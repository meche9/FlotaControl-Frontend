import { Construction } from 'lucide-react';

interface Props {
  titulo: string;
  descripcion?: string;
}

/**
 * Página temporal que se muestra para secciones aún en desarrollo.
 */
export default function PaginaEnConstruccion({ titulo, descripcion }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
          <Construction className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          {descripcion ?? 'Esta sección se encuentra en desarrollo. Pronto estará disponible.'}
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-xs font-semibold text-orange-600">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          En construcción
        </div>
      </div>
    </div>
  );
}
