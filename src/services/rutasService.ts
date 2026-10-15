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
  rutaTarifas?: any[];
  rutaPeajes?: any[];
  _count?: {
    guiasViajes?: number;
    rutaTarifas?: number;
    rutaPeajes?: number;
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

export interface RutaTarifa {
  idTarifa: string;
  codigoTarifa?: string | null;
  idCliente?: string | null;
  idRuta: string;
  idClasificacionVehiculo?: number | null;
  tipoCobro: RutaTipoCobro;
  montoTarifa: number | string;
  montoMinimo?: number | string | null;
  moneda: string;
  fechaInicioVigencia: string;
  fechaFinVigencia?: string | null;
  activo?: boolean | null;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  ruta?: {
    idRuta: string;
    nombreRuta: string;
    ciudadOrigen: string;
    ciudadDestino: string;
  };
  cliente?: {
    idCliente: string;
    razonSocial: string;
    nombreComercial?: string | null;
    rif: string;
  } | null;
  clasificacionVehiculo?: {
    idClasificacion: number;
    nombreClasificacion: string;
  } | null;
  _count?: {
    guiasViajes?: number;
    rutaRecargos?: number;
  };
}

export interface CreateRutaTarifaDto {
  idRuta: string;
  idCliente?: string | null;
  codigoTarifa?: string | null;
  idClasificacionVehiculo?: number | null;
  tipoCobro?: RutaTipoCobro;
  montoTarifa: number;
  montoMinimo?: number;
  moneda?: string;
  fechaInicioVigencia: string;
  fechaFinVigencia?: string | null;
  activo?: boolean;
}

export interface UpdateRutaTarifaDto extends Partial<CreateRutaTarifaDto> {}

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

  // Gestión de Tarifas de Rutas
  getTarifasByRuta: async (idRuta: string): Promise<RutaTarifa[]> => {
    const response = await api.get<RutaTarifa[]>(`/rutas/tarifas/ruta/${idRuta}`);
    return response.data;
  },

  getAllTarifas: async (params?: {
    idRuta?: string;
    idCliente?: string;
    activo?: boolean;
  }): Promise<RutaTarifa[]> => {
    const response = await api.get<RutaTarifa[]>('/rutas/tarifas', { params });
    return response.data;
  },

  getTarifaById: async (idTarifa: string): Promise<RutaTarifa> => {
    const response = await api.get<RutaTarifa>(`/rutas/tarifas/${idTarifa}`);
    return response.data;
  },

  createTarifa: async (data: CreateRutaTarifaDto): Promise<RutaTarifa> => {
    const response = await api.post<RutaTarifa>('/rutas/tarifas', data);
    return response.data;
  },

  updateTarifa: async (idTarifa: string, data: UpdateRutaTarifaDto): Promise<RutaTarifa> => {
    const response = await api.patch<RutaTarifa>(`/rutas/tarifas/${idTarifa}`, data);
    return response.data;
  },

  toggleEstadoTarifa: async (idTarifa: string): Promise<RutaTarifa> => {
    const response = await api.patch<RutaTarifa>(`/rutas/tarifas/${idTarifa}/toggle-estado`);
    return response.data;
  },

  deleteTarifa: async (idTarifa: string): Promise<void> => {
    await api.delete(`/rutas/tarifas/${idTarifa}`);
  },
};

