import api, { tokenStore, refreshSession, type SessionResponse } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
  // "Recordar estación": la sesión sobrevive al cierre del navegador
  recordar?: boolean;
}

export interface AuthUser {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  foto: string | null;
  estado: string;
  rol: {
    id: string;
    nombre: string;
    descripcion: string | null;
  };
  ultimoAcceso: string | null;
}

export type LoginResponse = SessionResponse;

export interface MessageResponse {
  message: string;
}

export interface RegisterRequestData {
  nombreCompleto: string;
  email: string;
  password: string;
  telefono?: string;
}

export interface RegisterRequestResponse {
  message: string;
  email: string;
  expiresInSeconds: number;
  devCode?: string;
}

export interface RegisterVerifyData {
  email: string;
  code: string;
}

export interface RegisterResendData {
  email: string;
}

export const urlFotoPerfil = (user: AuthUser | null) =>
  user?.foto ? `/auth/profile/foto?v=${user.foto}` : null;

const authService = {
  /**
   * Iniciar sesión. El refresh token queda en una cookie httpOnly (no accesible desde JS).
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    tokenStore.set(response.data.accessToken);
    return response.data;
  },

  /**
   * Recuperar la sesión a partir de la cookie (al recargar la página).
   */
  restoreSession(): Promise<SessionResponse> {
    return refreshSession();
  },

  /**
   * Solicitar restablecimiento de contraseña
   */
  async forgotPassword(email: string): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Paso 1: Enviar datos de onboarding y solicitar código OTP
   */
  async registerRequest(data: RegisterRequestData): Promise<RegisterRequestResponse> {
    const response = await api.post<RegisterRequestResponse>('/auth/register/request-code', data);
    return response.data;
  },

  /**
   * Reenviar código OTP de verificación
   */
  async registerResend(data: RegisterResendData): Promise<RegisterRequestResponse> {
    const response = await api.post<RegisterRequestResponse>('/auth/register/resend-code', data);
    return response.data;
  },

  /**
   * Paso 2: Verificar código y activar cuenta (inicia sesión y guarda token)
   */
  async registerVerify(data: RegisterVerifyData): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/register/verify-code', data);
    tokenStore.set(response.data.accessToken);
    return response.data;
  },

  /**
   * Restablecer contraseña con el token recibido por correo
   */
  async resetPassword(token: string, newPassword: string): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },

  /**
   * Obtener perfil del usuario autenticado
   */
  async getProfile(): Promise<AuthUser> {
    const response = await api.get<AuthUser>('/auth/profile');
    return response.data;
  },

  async subirFotoPerfil(archivo: File): Promise<AuthUser> {
    const datos = new FormData();
    datos.append('foto', archivo);
    const response = await api.put<AuthUser>('/auth/profile/foto', datos, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async eliminarFotoPerfil(): Promise<AuthUser> {
    const response = await api.delete<AuthUser>('/auth/profile/foto');
    return response.data;
  },

  /**
   * Cerrar sesión: revoca la sesión en el servidor y borra el token en memoria
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      tokenStore.set(null);
    }
  },
};

export default authService;
