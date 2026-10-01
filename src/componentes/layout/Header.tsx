import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ImagenProtegida } from '../../components/ui';
import { urlFotoPerfil } from '../../services/authService';
import FotoPerfilModal from './FotoPerfilModal';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [fotoPerfilAbierta, setFotoPerfilAbierta] = useState(false);

  const handleLogout = async () => {
    setCerrandoSesion(true);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between shadow-sm">
      
      {/* 1. Barra de Búsqueda */}
      <div className="relative w-96">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Buscar placa, unidad, operador o proforma..."
          className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-xl pl-10 pr-12 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className="bg-gray-200/80 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-300/60 shadow-xs">
            ⌘K
          </span>
        </div>
      </div>

      {/* 2. Sección Derecha (Estado, Notificaciones, Botón y Perfil) */}
      <div className="flex items-center space-x-6">
        
        {/* Indicador de Flota en Línea */}
        <div className="hidden md:flex items-center space-x-2 bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          <span className="text-xs font-semibold text-emerald-800 tracking-wide">
            48/48 En Línea
          </span>
        </div>

        {/* Notificaciones */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
          <Bell className="w-5 h-5" />
          {/* Puntito de alerta naranja */}
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* Botón de Acción Principal */}
        <button className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-md shadow-orange-500/20 transition">
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nuevo Viaje</span>
        </button>

        {/* Divisor vertical */}
        <div className="h-8 w-px bg-gray-200"></div>

        {/* Perfil del Usuario */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setFotoPerfilAbierta(true)}
            title="Cambiar foto de perfil"
            aria-label="Cambiar foto de perfil"
            className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300 hover:ring-2 hover:ring-orange-500/30 transition"
          >
            <ImagenProtegida
              url={urlFotoPerfil(user)}
              alt="Foto de perfil"
              className="w-full h-full object-cover"
              fallback={<User className="w-5 h-5 text-gray-600" />}
            />
          </button>
          <div className="hidden sm:block text-left leading-tight">
            <h4 className="text-xs font-bold text-gray-900">
              {user ? `${user.nombre} ${user.apellido}` : ''}
            </h4>
            <span className="text-[11px] font-medium text-gray-500">{user?.rol.nombre}</span>
          </div>
        </div>

        {/* Cerrar sesión */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={cerrandoSesion}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
        </button>

      </div>

      <FotoPerfilModal isOpen={fotoPerfilAbierta} onClose={() => setFotoPerfilAbierta(false)} />
    </header>
  );
}