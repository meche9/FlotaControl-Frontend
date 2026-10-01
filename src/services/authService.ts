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
