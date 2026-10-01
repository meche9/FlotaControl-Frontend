import React, { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import { ImagenProtegida } from './ImagenProtegida';
import { FORMATOS_IMAGEN, validarImagen } from '../../utils/imagenes';

export interface SelectorImagenProps {
  urlActual?: string | null;
  archivo: File | null;
  quitada: boolean;
  onSeleccionar: (archivo: File) => void;
  onQuitar: () => void;
  forma?: 'rectangulo' | 'circulo';
  etiqueta?: string;
}

export const SelectorImagen: React.FC<SelectorImagenProps> = ({
  urlActual,
  archivo,
  quitada,
  onSeleccionar,
  onQuitar,
  forma = 'rectangulo',
  etiqueta,
}) => {
  const [error, setError] = useState<string | null>(null);
  const vistaPrevia = useMemo(() => (archivo ? URL.createObjectURL(archivo) : null), [archivo]);

  useEffect(
    () => () => {
      if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
    },
    [vistaPrevia],
  );

  const urlVisible = !archivo && !quitada ? urlActual : null;
  const tieneImagen = Boolean(vistaPrevia || urlVisible);
  const marco =
    forma === 'circulo' ? 'w-20 h-20 rounded-full' : 'w-32 h-24 rounded-xl';
  const icono = <ImagePlus className="w-6 h-6 text-slate-300" />;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seleccionado = e.target.files?.[0];
    e.target.value = '';
    if (!seleccionado) return;

    const problema = validarImagen(seleccionado);
    setError(problema);
    if (!problema) onSeleccionar(seleccionado);
  };

  return (
    <div>
      {etiqueta && (
        <span className="block text-[11px] font-bold uppercase text-slate-500 mb-1">{etiqueta}</span>
      )}
      <div className="flex items-center gap-4">
        <div
          className={`${marco} shrink-0 overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center`}
        >
          {vistaPrevia ? (
            <img src={vistaPrevia} alt="Vista previa" className="w-full h-full object-cover" />
          ) : (
            <ImagenProtegida
              url={urlVisible}
              alt="Imagen actual"
              className="w-full h-full object-cover"
              fallback={icono}
            />
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition focus-within:ring-2 focus-within:ring-orange-500/30">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>{tieneImagen ? 'Cambiar imagen' : 'Elegir imagen'}</span>
              <input type="file" accept={FORMATOS_IMAGEN} className="sr-only" onChange={handleChange} />
            </label>
            {tieneImagen && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  onQuitar();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Quitar</span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400">JPG, PNG o WEBP · máximo 5 MB</p>
          {error && <p className="text-[11px] font-semibold text-rose-600">{error}</p>}
        </div>
      </div>
    </div>
  );
};
