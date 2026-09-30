import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import PrivateRoute from './PrivateRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
import AdminLayout from '../componentes/layout/AdminLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import Vehiculos from '../pages/vehiculos/Vehiculos';
import PaginaEnConstruccion from '../componentes/common/PaginaEnConstruccion';

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

                        {/* Operativo */}
                        <Route path="/drivers" element={<PaginaEnConstruccion titulo="Conductores" descripcion="Gestión de conductores, licencias y asignaciones de vehículos." />} />
                        <Route path="/maintenance" element={<PaginaEnConstruccion titulo="Mantenimiento" descripcion="Control de mantenimientos preventivos y correctivos de la flota." />} />

                        {/* Logístico */}
                        <Route path="/clients" element={<PaginaEnConstruccion titulo="Clientes" descripcion="Directorio de clientes, contratos y puntos de carga/descarga." />} />
                        <Route path="/routes" element={<PaginaEnConstruccion titulo="Rutas" descripcion="Configuración de rutas, tarifas y matrices de recargos." />} />
                        <Route path="/scheduling" element={<PaginaEnConstruccion titulo="Programación" descripcion="Programación de viajes y asignación de gandolas." />} />

                        {/* Financiero */}
                        <Route path="/proformas" element={<PaginaEnConstruccion titulo="Proformas" descripcion="Generación y gestión de proformas de liquidación de fletes." />} />
                        <Route path="/costs" element={<PaginaEnConstruccion titulo="Costos" descripcion="Análisis de costos operativos por viaje, ruta y vehículo." />} />
                        <Route path="/profitability" element={<PaginaEnConstruccion titulo="Rentabilidad" descripcion="Indicadores de rentabilidad y márgenes por operación." />} />

                        {/* Configuración */}
                        <Route path="/settings" element={<PaginaEnConstruccion titulo="Ajustes de Sistema" descripcion="Configuración general, usuarios, roles y parámetros del sistema." />} />
                        <Route path="/iot-alerts" element={<PaginaEnConstruccion titulo="IoT & Alertas" descripcion="Monitoreo de dispositivos IoT y configuración de alertas operativas." />} />
                    </Route>
                </Route>

                {/* Redirecciones por defecto (pasan por PrivateRoute) */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
