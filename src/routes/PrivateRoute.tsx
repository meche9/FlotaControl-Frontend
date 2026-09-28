import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PantallaCarga from '../componentes/common/PantallaCarga';

/**
 * Protege las rutas internas: sin sesión válida redirige al login y
 * recuerda la ruta solicitada para volver a ella después de autenticarse.
 */
export default function PrivateRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'checking') {
    return <PantallaCarga />;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
