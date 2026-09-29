import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AuthUser } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface SessionResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

// ─── Access token solo en memoria (OWASP A07) ────────────────────────
// No se guarda en localStorage para que un XSS no pueda robarlo. El refresh
// token vive en una cookie httpOnly que JavaScript no puede leer.
let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token;
  },
};

// Notifica al AuthContext cuando la sesión deja de ser válida
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true, // envía la cookie httpOnly de sesión a /auth
});

// ─── Renovación de sesión ────────────────────────────────────────────
// Una sola petición a la vez: dentro de la pestaña se comparte la promesa y
// entre pestañas se serializa con Web Locks, porque el refresh token rota en
// cada uso y dos renovaciones simultáneas cerrarían la sesión.
let refreshInFlight: Promise<SessionResponse> | null = null;

async function requestRefresh(): Promise<SessionResponse> {
  const response = await axios.post<SessionResponse>(`${API_URL}/auth/refresh`, null, {
    withCredentials: true,
    timeout: 15000,
  });
  tokenStore.set(response.data.accessToken);
  return response.data;
}

export function refreshSession(): Promise<SessionResponse> {
  if (!refreshInFlight) {
    const run = () => requestRefresh();
    const locked =
      typeof navigator !== 'undefined' && navigator.locks
        ? navigator.locks.request('fleetflow-refresh', run)
        : run();

    refreshInFlight = locked.finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

// ─── Request Interceptor: Adjuntar JWT a cada petición ───────────────
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Los endpoints de autenticación manejan sus propios 401 (p. ej. credenciales inválidas)
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/forgot-password', '/auth/reset-password'];

// ─── Response Interceptor: renovar el access token vencido una vez ───
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const esEndpointAuth = AUTH_ENDPOINTS.some((path) => originalRequest?.url?.startsWith(path));

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || esEndpointAuth) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const { accessToken: nuevoToken } = await refreshSession();
      originalRequest.headers.Authorization = `Bearer ${nuevoToken}`;
      return api(originalRequest);
    } catch {
      tokenStore.set(null);
      onSessionExpired?.();
      return Promise.reject(error);
    }
  },
);

/**
 * Extrae un mensaje legible de un error de la API.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Verifique su conexión e intente de nuevo.';
    }

    const message = (error.response.data as { message?: unknown } | undefined)?.message;
    const texto = Array.isArray(message) ? message.join('. ') : typeof message === 'string' ? message : '';

    if (error.response.status === 429 && (!texto || texto.startsWith('ThrottlerException'))) {
      return 'Demasiadas solicitudes. Espere un momento e intente de nuevo.';
    }
    if (texto) return texto;
  }
  return fallback;
}

export default api;
