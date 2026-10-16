import api from './api';

export interface RutaPuntoResumen {
  idPunto: string;
  nombreSede: string;
  ciudad: string;
  estado: string;
  direccion: string;
}

export type RutaTipoCobro =
  | 'Por_Viaje_Fijo'
  | 'Por_Tonelada'
  | 'Por_Kilometro'
  | 'Por_Volumen_M3';

export interface Ruta {
  idRuta: string;
  idCliente: string;
  nombreRuta: string;
  ciudadOrigen: string;
  ciudadDestino: string;
  idPuntoOrigen?: string | null;
  idPuntoDestino?: string | null;
  distanciaKm: number | string;
  tiempoEstimadoHoras?: number | string | null;
  consumoEstimadoGasoil: number | string;
  montoTarifa?: number | string;
  tipoCobro?: RutaTipoCobro;
  moneda?: string;
  activo: boolean;
  cliente?: {
    idCliente: string;
    razonSocial: string;
    nombreComercial?: string | null;
    rif: string;
  };
  puntoOrigen?: RutaPuntoResumen | null;
  puntoDestino?: RutaPuntoResumen | null;
  rutaPeajes?: any[];
  _count?: {
    guiasViajes?: number;
    rutaPeajes?: number;
    rutaRecargos?: number;
  };
}

export interface CreateRutaDto {
  idCliente: string;
  nombreRuta: string;
  ciudadOrigen: string;
  ciudadDestino: string;
  idPuntoOrigen?: string | null;
  idPuntoDestino?: string | null;
  distanciaKm?: number;
  tiempoEstimadoHoras?: number | null;
  consumoEstimadoGasoil?: number;
  montoTarifa?: number;
  tipoCobro?: RutaTipoCobro;
  moneda?: string;
  activo?: boolean;
}

export interface UpdateRutaDto extends Partial<CreateRutaDto> {}

export const rutasService = {
  getRutas: async (params?: { idCliente?: string; activo?: boolean }): Promise<Ruta[]> => {
    const response = await api.get<Ruta[]>('/rutas', { params });
    return response.data;
  },

  getRutasByCliente: async (idCliente: string): Promise<Ruta[]> => {
    const response = await api.get<Ruta[]>(`/rutas/cliente/${idCliente}`);
    return response.data;
  },

  getRutaById: async (id: string): Promise<Ruta> => {
    const response = await api.get<Ruta>(`/rutas/${id}`);
    return response.data;
  },

  createRuta: async (data: CreateRutaDto): Promise<Ruta> => {
    const response = await api.post<Ruta>('/rutas', data);
    return response.data;
  },

  updateRuta: async (id: string, data: UpdateRutaDto): Promise<Ruta> => {
    const response = await api.patch<Ruta>(`/rutas/${id}`, data);
    return response.data;
  },

  toggleEstado: async (id: string): Promise<Ruta> => {
    const response = await api.patch<Ruta>(`/rutas/${id}/toggle-estado`);
    return response.data;
  },

  deleteRuta: async (id: string): Promise<void> => {
    await api.delete(`/rutas/${id}`);
  },

  // Gestión de Peajes de Venezuela y Peajes de Ruta
  getPeajesVzla: async (): Promise<PeajeVzla[]> => {
    const response = await api.get<PeajeVzla[]>('/rutas/peajes/catalogo-vzla');
    return response.data;
  },

  getPeajesByRuta: async (idRuta: string): Promise<RutaPeaje[]> => {
    const response = await api.get<RutaPeaje[]>(`/rutas/peajes/ruta/${idRuta}`);
    return response.data;
  },

  asignarPeajesRuta: async (idRuta: string, peajes: ItemRutaPeajeDto[]): Promise<RutaPeaje[]> => {
    const response = await api.post<RutaPeaje[]>('/rutas/peajes/asignar', { idRuta, peajes });
    return response.data;
  },

  deleteRutaPeaje: async (idRutaPeaje: string): Promise<void> => {
    await api.delete(`/rutas/peajes/${idRutaPeaje}`);
  },
};

export interface PeajeVzla {
  idPeaje: number;
  nombrePeaje: string;
  estadoUbicacion: string;
  ubicacionDetallada?: string | null;
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface RutaPeaje {
  idRutaPeaje: string;
  idRuta: string;
  nombrePeaje: string;
  ubicacion?: string | null;
  orden: number;
  costo: number | string;
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface ItemRutaPeajeDto {
  nombrePeaje: string;
  ubicacion?: string | null;
  orden: number;
  costo: number;
  activo?: boolean;
}

