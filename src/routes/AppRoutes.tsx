import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
//import Dashboard from '../pages/dashboard/Dashboard';
import PrivateRoute from './PrivateRoute';

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Ruta Pública */}
                <Route path="/login" element={<Login />} />

                {/* Rutas Privadas (Protegidas) */}
                <Route element={<PrivateRoute />}>
                    {/* Aquí agregaremos las rutas de choferes, mantenimientos, etc. */}
                </Route>

                {/* Redirección por defecto */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}