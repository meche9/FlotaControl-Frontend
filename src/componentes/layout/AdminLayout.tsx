import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AdminLayout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      {/* Menú lateral (fijo en desktop, drawer deslizable en móvil) */}
      <Sidebar
        isOpen={sidebarAbierto}
        onClose={() => setSidebarAbierto(false)}
      />

      {/* Contenedor derecho */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Barra superior con botón hamburguesa en móvil */}
        <Header onToggleSidebar={() => setSidebarAbierto((prev) => !prev)} />

        {/* Aquí se renderiza tu Dashboard u otras pantallas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}