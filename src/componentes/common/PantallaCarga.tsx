import { Truck } from 'lucide-react';

export default function PantallaCarga({ mensaje = 'Verificando sesión...' }: { mensaje?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0a1329] text-slate-300 font-sans">
      <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/30 animate-pulse">
        <Truck className="w-8 h-8 text-white" />
      </div>
      <p className="text-sm font-semibold tracking-wide" role="status">
        {mensaje}
      </p>
    </div>
  );
}
