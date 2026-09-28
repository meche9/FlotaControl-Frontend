import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PantallaCarga from '../componentes/common/PantallaCarga';

/**
 * Rutas solo para visitantes (login): con sesión activa se va directo al dashboard.
 */
export default function PublicOnlyRoute() {
  const { status } = useAuth();

  if (status === 'checking') {
    return <PantallaCarga />;
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
