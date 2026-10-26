import api from './api';

export interface ConductorResumen {
  idConductor: string;
  nombreCompleto: string;
  telefono: string;
  vehiculoHabitual?: string | null;
  placaVehiculoHabitual?: string | null;
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

export interface ClienteDetectado {
  idCliente: string;
  razonSocial: string;
  nombreComercial?: string | null;
  rif?: string | null;
}

export interface TripItem {
  id: string;
  nroTransporte: string;
  origenSalida: {
    codigo: string;
    nombre: string;
    idPunto?: string | null;
    idCliente?: string | null;
    clienteNombre?: string | null;
    clienteRif?: string | null;
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
  observaciones?: string;
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
  clienteDetectado?: ClienteDetectado | null;
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

export interface GuiaProgramada {
  idOrden: string;
  nroTransporte: string | null;
  idCliente: string;
  idRuta: string;
  idPuntoOrigen: string;
  idPuntoDestino: string;
  idVehiculoMotriz: string | null;
  idAcoplado: string | null;
  idConductor: string | null;
  fechaProgramadaCarga: string;
  fechaSalidaReal: string | null;
  fechaEntregaEstimada: string;
  fechaEntregaReal: string | null;
  moneda: string;
  montoFleteCliente: number | string;
  montoAnticipoConductor: number | string;
  estadoFacturacion: string;
  estadoOrden: string;
  observaciones: string | null;
  cliente?: {
    idCliente: string;
    razonSocial: string;
    nombreComercial?: string | null;
    rif: string;
  };
  puntoOrigen?: {
    idPunto: string;
    codigoPuntoc: string;
    nombreSede: string;
    ciudad: string;
    estado: string;
  };
  puntoDestino?: {
    idPunto: string;
    codigoPuntoc: string;
    nombreSede: string;
    ciudad: string;
    estado: string;
  };
  ruta?: {
    idRuta: string;
    nombreRuta: string;
    distanciaKm: number | string;
    montoTarifa: number | string;
  };
  conductor?: {
    idConductor: string;
    nombres: string;
    apellidos: string;
    telefono: string;
    vehiculoHabitual?: {
      idVehiculo: string;
      placa: string;
      marca: string;
      modelo: string;
    } | null;
  } | null;
  vehiculoMotriz?: {
    idVehiculo: string;
    placa: string;
    marca: string;
    modelo: string;
  } | null;
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
  async confirmarProgramacion(trips: TripItem[], idCliente?: string): Promise<ConfirmScheduleResponse> {
    const response = await api.post<ConfirmScheduleResponse>('/schedules/confirm', { trips, idCliente });
    return response.data;
  },

  /**
   * Obtiene los viajes programados de la tabla guias_viajes según filtros.
   */
  async getGuiasProgramadas(params: {
    idCliente?: string;
    fechaInicio?: string;
    fechaFin?: string;
    estadoOrden?: string;
  }): Promise<GuiaProgramada[]> {
    const response = await api.get<GuiaProgramada[]>('/schedules/programados', { params });
    return response.data;
  },

  /**
   * Asigna o desasigna un conductor a un viaje en guias_viajes.
   */
  async asignarConductor(idOrden: string, idConductor: string | null): Promise<GuiaProgramada> {
    const response = await api.patch<GuiaProgramada>('/schedules/asignar-conductor', {
      idOrden,
      idConductor,
    });
    return response.data;
  },

  /**
   * Libera todas las asignaciones programadas de un conductor.
   */
  async liberarConductor(idConductor: string): Promise<{ count: number }> {
    const response = await api.patch<{ count: number }>(`/schedules/liberar-conductor/${idConductor}`);
    return response.data;
  },

  /**
   * Actualiza las observaciones de una orden de viaje en guias_viajes.
   */
  async actualizarObservacion(idOrden: string, observaciones: string | null): Promise<GuiaProgramada> {
    const response = await api.patch<GuiaProgramada>('/schedules/actualizar-observacion', {
      idOrden,
      observaciones,
    });
    return response.data;
  },

  /**
   * Cancela una orden de viaje estableciendo estadoOrden a Cancelado y guardando observación.
   */
  async cancelarViaje(idOrden: string, observacion?: string): Promise<GuiaProgramada> {
    const response = await api.patch<GuiaProgramada>('/schedules/cancelar-viaje', {
      idOrden,
      observacion,
    });
    return response.data;
  },
};
