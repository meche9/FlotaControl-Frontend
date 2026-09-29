import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import PrivateRoute from './PrivateRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
import AdminLayout from '../componentes/layout/AdminLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import Vehiculos from '../pages/vehiculos/Vehiculos';

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Ruta pública solo para visitantes: con sesión activa redirige al dashboard */}
                <Route element={<PublicOnlyRoute />}>
                    <Route path="/login" element={<Login />} />
                </Route>

                {/* Recuperación de contraseña: pública */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Rutas Privadas envueltas en el AdminLayout */}
                <Route element={<PrivateRoute />}>
                    <Route element={<AdminLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/vehiculos" element={<Vehiculos />} />
                    </Route>
                </Route>

                {/* Redirecciones por defecto (pasan por PrivateRoute) */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
