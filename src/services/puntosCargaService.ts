import api from './api';

export type TipoPunto = 'Origen' | 'Destino' | 'Ambos';

export interface PuntoCargaDescarga {
  idPunto: string;
  idCliente: string;
  codigoPuntoc?: string;
  nombreSede: string;
  tipoPunto: TipoPunto;
  direccion: string;
  ciudad: string;
  estado: string;
  codigoPostal?: string | null;
  contactoAlmacen?: string | null;
  telefonoAlmacen?: string | null;
  horarioAtencion?: string | null;
  instruccionesAcceso?: string | null;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion?: string;
  cliente?: {
    idCliente: string;
    razonSocial: string;
    nombreComercial?: string | null;
    rif: string;
  };
}

export interface CreatePuntoCargaDto {
  idCliente: string;
  codigoPuntoc: string;
  nombreSede: string;
  tipoPunto?: TipoPunto;
  direccion: string;
  ciudad: string;
  estado: string;
  codigoPostal?: string;
  contactoAlmacen?: string;
  telefonoAlmacen?: string;
  horarioAtencion?: string;
  instruccionesAcceso?: string;
  activo?: boolean;
}

export interface UpdatePuntoCargaDto extends Partial<CreatePuntoCargaDto> {}

export const puntosCargaService = {
  getPuntos: async (): Promise<PuntoCargaDescarga[]> => {
    const response = await api.get<PuntoCargaDescarga[]>('/puntos-carga');
    return response.data;
  },

  getPuntosByCliente: async (idCliente: string): Promise<PuntoCargaDescarga[]> => {
    const response = await api.get<PuntoCargaDescarga[]>(`/puntos-carga/cliente/${idCliente}`);
    return response.data;
  },

  validarCodigo: async (idCliente: string, codigo: string, excludeId?: string): Promise<boolean> => {
    const url = `/puntos-carga/validar-codigo/${encodeURIComponent(idCliente)}/${encodeURIComponent(codigo)}${
      excludeId ? `?excludeId=${encodeURIComponent(excludeId)}` : ''
    }`;
    const response = await api.get<{ existe: boolean }>(url);
    return response.data.existe;
  },

  getPuntoById: async (id: string): Promise<PuntoCargaDescarga> => {
    const response = await api.get<PuntoCargaDescarga>(`/puntos-carga/${id}`);
    return response.data;
  },

  createPunto: async (data: CreatePuntoCargaDto): Promise<PuntoCargaDescarga> => {
    const response = await api.post<PuntoCargaDescarga>('/puntos-carga', data);
    return response.data;
  },

  updatePunto: async (id: string, data: UpdatePuntoCargaDto): Promise<PuntoCargaDescarga> => {
    const response = await api.patch<PuntoCargaDescarga>(`/puntos-carga/${id}`, data);
    return response.data;
  },

  deletePunto: async (id: string): Promise<void> => {
    await api.delete(`/puntos-carga/${id}`);
  },
};
