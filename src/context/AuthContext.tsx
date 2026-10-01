import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import authService, { type AuthUser, type LoginCredentials } from '../services/authService';
import { setSessionExpiredHandler, tokenStore } from '../services/api';

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous';

interface AuthContextType {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  actualizarUsuario: (user: AuthUser) => void;
}

type MensajeSesion = 'login' | 'logout';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('checking');
  // Sincroniza login/logout entre pestañas abiertas
  const canalRef = useRef<BroadcastChannel | null>(null);

  const limpiarSesion = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
    setStatus('anonymous');
  }, []);

  const restaurarSesion = useCallback(
    (esVigente: () => boolean = () => true) =>
      authService
        .restoreSession()
        .then((sesion) => {
          if (!esVigente()) return;
          setUser(sesion.user);
          setStatus('authenticated');
        })
        .catch(() => {
          if (esVigente()) limpiarSesion();
        }),
    [limpiarSesion],
  );

  // Al montar: recuperar la sesión desde la cookie httpOnly (si existe)
  useEffect(() => {
    let vigente = true;
    void restaurarSesion(() => vigente);
    return () => {
      vigente = false;
    };
  }, [restaurarSesion]);

  // Si una petición falla por sesión vencida, volver al login
  useEffect(() => {
    setSessionExpiredHandler(limpiarSesion);
    return () => setSessionExpiredHandler(null);
  }, [limpiarSesion]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const canal = new BroadcastChannel('fleetflow-auth');
    canal.onmessage = (evento: MessageEvent<MensajeSesion>) => {
      if (evento.data === 'logout') limpiarSesion();
      if (evento.data === 'login') void restaurarSesion();
    };
    canalRef.current = canal;

    return () => {
      canal.close();
      canalRef.current = null;
    };
  }, [limpiarSesion, restaurarSesion]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const sesion = await authService.login(credentials);
    setUser(sesion.user);
    setStatus('authenticated');
    canalRef.current?.postMessage('login' satisfies MensajeSesion);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Aunque el servidor no responda, la sesión local se cierra igual
    }
    limpiarSesion();
    canalRef.current?.postMessage('logout' satisfies MensajeSesion);
  }, [limpiarSesion]);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isAuthenticated: status === 'authenticated',
        login,
        logout,
        actualizarUsuario: setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

export default AuthContext;
