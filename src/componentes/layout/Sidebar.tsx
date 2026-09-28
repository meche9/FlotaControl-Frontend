
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Truck, 
  Users, 
  Wrench, 
  Building2, 
  Route, 
  Calendar, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  Radio, 
  ChevronDown 
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const [baseActual, setBaseActual] = useState('Base Central Valencia');

  // Función para determinar si el link está activo y darle el estilo naranja
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col shadow-sm select-none">
     
      {/* 1. Encabezado / Logo */}
      <div className="p-5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center space-x-2">
          {/* Logo simulado o espacio para imagen */}
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
            FC
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-gray-900 tracking-tight leading-none">
              FleetControl
            </h1>
            <span className="text-[10px] font-bold tracking-widest text-orange-600 uppercase">
              ENTERPRISE
            </span>
          </div>
        </div>
      </div>

      {/* 2. Selector de Base / Sucursal */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <div className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-semibold rounded-lg px-3 py-2.5 flex items-center justify-between cursor-pointer transition">
            <div className="flex items-center space-x-2 truncate">
              <Building2 className="w-4 h-4 text-orange-600 shrink-0" />
              <span className="truncate">{baseActual}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
          </div>
        </div>
      </div>

      {/* 3. Menú de Navegación Organizado por Secciones */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6 text-sm">
       
        {/* OPERATIVO */}
        <div>
          <p className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase mb-2 px-3">
            Operativo
          </p>
          <nav className="space-y-1">
            <Link
              to="/vehiculos"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-small text-sm transition ${
                isActive('/vehiculos') || isActive('/dashboard')
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Truck className="w-4 h-4 shrink-0" />
              <span>Flota</span>
            </Link>

            <Link
              to="/drivers"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium transition ${
                isActive('/drivers')
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Conductores</span>
            </Link>

            <Link
              to="/maintenance"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium transition ${
                isActive('/maintenance')
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Wrench className="w-4 h-4 shrink-0" />
              <span>Mantenimiento</span>
            </Link>
          </nav>
        </div>

        {/* LOGÍSTICO */}
        <div>
          <p className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase mb-2 px-3">
            Logístico
          </p>
          <nav className="space-y-1">
            <Link
              to="/clients"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium transition ${
                isActive('/clients')
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Clientes</span>
            </Link>

            <Link
              to="/routes"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium transition ${
                isActive('/routes')
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Route className="w-4 h-4 shrink-0" />
              <span>Rutas</span>
            </Link>

            <Link
              to="/scheduling"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium transition ${
                isActive('/scheduling')
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Programación</span>
            </Link>
          </nav>
        </div>

        {/* FINANCIERO */}
        <div>
          <p className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase mb-2 px-3">
            Financiero
          </p>
          <nav className="space-y-1">
            <Link
              to="/proformas"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium transition ${
                isActive('/proformas')
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Proformas</span>
            </Link>

            <Link
              to="/costs"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium transition ${
                isActive('/costs')
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <DollarSign className="w-4 h-4 shrink-0" />
              <span>Costos</span>
            </Link>

            <Link
              to="/profitability"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium transition ${
                isActive('/profitability')
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>Rentabilidad</span>
            </Link>
          </nav>
        </div>

        {/* CONFIGURACIÓN */}
        <div>
          <p className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase mb-2 px-3">
            Configuración
          </p>
          <nav className="space-y-1">
            <Link
              to="/settings"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium transition ${
                isActive('/settings')
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Ajustes de Sistema</span>
            </Link>

            <Link
              to="/iot-alerts"
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium transition ${
                isActive('/iot-alerts')
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Radio className="w-4 h-4 shrink-0" />
              <span>IoT & Alertas</span>
            </Link>
          </nav>
        </div>

      </div>
    </aside>
  );
}