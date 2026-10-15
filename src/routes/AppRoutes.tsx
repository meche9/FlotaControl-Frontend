import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import PrivateRoute from './PrivateRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
import AdminLayout from '../componentes/layout/AdminLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import Vehiculos from '../pages/vehiculos/Vehiculos';
import VehiculosRegistro from '../pages/vehiculos/VehiculosRegistro';
import Conductores from '../pages/conductores/Conductores';
import ConductoresRegistroCompleto from '../pages/conductores/ConductoresRegistroCompleto';
import Clientes from '../pages/clientes/Clientes';
import PuntosCargaDescarga from '../pages/clientes/PuntosCargaDescarga';
import PuntosRegistrar from '../pages/clientes/PuntosRegistrar';
import RutasRegistro from '../pages/rutas/RutasRegistro';
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
                        <Route path="/vehiculos/nuevo" element={<VehiculosRegistro />} />
                        <Route path="/vehiculos/registro" element={<VehiculosRegistro />} />

                        {/* Operativo */}
                        <Route path="/conductores" element={<Conductores />} />
                        <Route path="/conductores/nuevo" element={<ConductoresRegistroCompleto />} />
                        <Route path="/conductores/registro" element={<ConductoresRegistroCompleto />} />
                        <Route path="/conductores/editar/:id" element={<ConductoresRegistroCompleto />} />
                        <Route path="/drivers" element={<Conductores />} />
                        <Route path="/maintenance" element={<PaginaEnConstruccion titulo="Mantenimiento" descripcion="Control de mantenimientos preventivos y correctivos de la flota." />} />

                        {/* Logístico */}
                        <Route path="/clients" element={<Clientes />} />
                        <Route path="/clientes" element={<Clientes />} />
                        <Route path="/clientes/puntos-carga-descarga" element={<PuntosCargaDescarga />} />
                        <Route path="/puntos-carga-descarga" element={<PuntosCargaDescarga />} />
                        <Route path="/clientes/puntos-carga-descarga/nuevo" element={<PuntosRegistrar />} />
                        <Route path="/clientes/puntos-carga-descarga/editar/:id" element={<PuntosRegistrar />} />
                        <Route path="/puntos-carga-descarga/nuevo" element={<PuntosRegistrar />} />
                        <Route path="/puntos-carga-descarga/editar/:id" element={<PuntosRegistrar />} />
                        <Route path="/routes" element={<RutasRegistro />} />
                        <Route path="/rutas" element={<RutasRegistro />} />
                        <Route path="/rutas/nuevo" element={<RutasRegistro />} />
                        <Route path="/rutas/registro" element={<RutasRegistro />} />
                        <Route path="/rutas/editar/:id" element={<RutasRegistro />} />
                        <Route path="/routes/:id" element={<RutasRegistro />} />
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
