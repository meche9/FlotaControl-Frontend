import { Navigate, Outlet } from 'react-router-dom';

export default function PrivateRoute() {
  // Verificamos si hay un token guardado (puedes ajustarlo según tu lógica de auth)
  const isAuthenticated: boolean = Boolean(localStorage.getItem('token')) || true; 

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}