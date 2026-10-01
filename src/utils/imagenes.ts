export const FORMATOS_IMAGEN = 'image/jpeg,image/png,image/webp';
export const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

export function validarImagen(archivo: File): string | null {
  if (!FORMATOS_IMAGEN.split(',').includes(archivo.type)) {
    return 'Formato no permitido: use JPG, PNG o WEBP.';
  }
  if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
    return 'La imagen supera el máximo de 5 MB.';
  }
  return null;
}
