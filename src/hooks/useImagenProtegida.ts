import { useEffect, useState } from 'react';
import api from '../services/api';

export function useImagenProtegida(url: string | null | undefined): string | null {
  const [cargada, setCargada] = useState<{ url: string; src: string } | null>(null);

  useEffect(() => {
    if (!url) return;

    let vigente = true;
    let objectUrl: string | null = null;

    api
      .get<Blob>(url, { responseType: 'blob' })
      .then((response) => {
        if (!vigente) return;
        objectUrl = URL.createObjectURL(response.data);
        setCargada({ url, src: objectUrl });
      })
      .catch(() => undefined);

    return () => {
      vigente = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return url && cargada?.url === url ? cargada.src : null;
}
