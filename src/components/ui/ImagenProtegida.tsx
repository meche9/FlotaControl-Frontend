import React from 'react';
import { useImagenProtegida } from '../../hooks/useImagenProtegida';

export interface ImagenProtegidaProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  url: string | null | undefined;
  fallback?: React.ReactNode;
}

export const ImagenProtegida: React.FC<ImagenProtegidaProps> = ({
  url,
  fallback = null,
  alt = '',
  ...props
}) => {
  const src = useImagenProtegida(url);
  return src ? <img src={src} alt={alt} {...props} /> : <>{fallback}</>;
};
