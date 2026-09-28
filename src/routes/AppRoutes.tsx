import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import PrivateRoute from './PrivateRoute';
import AdminLayout from '../componentes/layout/AdminLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import Vehiculos from '../pages/vehiculos/Vehiculos';

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Ruta Pública */}
                <Route path="/login" element={<Login />} />

                {/* Rutas Privadas envueltas en el AdminLayout */}
                <Route element={<PrivateRoute />}>
                    <Route element={<AdminLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/vehiculos" element={<Vehiculos />} />
                    </Route>
                </Route>

                {/* Redirecciones por defecto */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}