import api from './api';

export interface ConductorResumen {
  idConductor: string;
  nombreCompleto: string;
  telefono: string;
  vehiculoHabitual?: string | null;
  estado?: string;
}

export interface PuntoResumen {
  idPunto: string;
  codigoPuntoc: string;
  nombreSede: string;
  ciudad: string;
  estado?: string;
  idCliente?: string;
}

export interface ColisionDetalle {
  idOrden: string;
  estadoOrden: string;
  fechaProgramadaCarga?: string;
  conductorAsignado?: string | null;
}

export interface TripItem {
  id: string;
  nroTransporte: string;
  origenSalida: {
    codigo: string;
    nombre: string;
    idPunto?: string | null;
    idCliente?: string | null;
  };
  destinoLlegada: {
    codigo: string;
    nombre: string;
    idPunto?: string | null;
  };
  fechaProgramadaCarga: string;
  horaProgramadaCarga: string;
  fechaEntregaEstimada: string;
  horaEntregaEstimada: string;
  conductorAsignado?: ConductorResumen | null;
  idConductor?: string | null;
  nroRetorno?: string;
  puntoRegreso?: string;
  estadoPendienteChofer?: boolean;
  observacion?: string;
  yaExiste: boolean;
  colision: boolean;
  colisionDetalle?: ColisionDetalle | null;
  seleccionado?: boolean;
}

export interface SchedulePreviewResponse {
  nombreArchivo: string;
  totalViajes: number;
  colisiones: number;
  nuevos: number;
  todosExisten: boolean;
  trips: TripItem[];
  conductoresDisponibles: ConductorResumen[];
  puntosDisponibles: PuntoResumen[];
}

export interface ConfirmScheduleResponse {
  success: boolean;
  message: string;
  guardados: number;
  omitidosPorColision: number;
  guias?: any[];
}

export const programacionService = {
  /**
   * Sube el archivo PDF que emite el cliente y obtiene la previsualización
   * con validación de colisiones contra guias_viajes.
   */
  async subirPdfPrograma(file: File): Promise<SchedulePreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<SchedulePreviewResponse>('/schedules/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Confirma e ingesta en BD los viajes seleccionados que no presenten colisión.
   */
  async confirmarProgramacion(trips: TripItem[]): Promise<ConfirmScheduleResponse> {
    const response = await api.post<ConfirmScheduleResponse>('/schedules/confirm', { trips });
    return response.data;
  },
};
