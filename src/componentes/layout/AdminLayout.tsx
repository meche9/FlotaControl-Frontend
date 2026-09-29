import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Menú lateral */}
      <Sidebar />

      {/* Contenedor derecho */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Barra superior */}
        <Header />

        {/* Aquí se renderiza tu Dashboard u otras pantallas */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}