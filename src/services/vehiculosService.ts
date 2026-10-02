import api from './api';

export type EstadoUnidad = 'patio' | 'en_ruta' | 'taller' | 'inactivo';
export type TipoUnidad = 'motriz' | 'acoplado';

type EstadoApi = 'Activo' | 'En_Ruta' | 'En Ruta' | 'Mantenimiento' | 'Inactivo';

export interface TipoVehiculo {
  idTipo: number;
  nombreTipo: string;
  activo?: boolean;
  clasificaciones?: ClasificacionVehiculo[];
}

export interface ClasificacionVehiculo {
  idClasificacion: number;
  idTipo: number;
  nombreClasificacion: string;
  activo?: boolean;
  tipo?: TipoVehiculo;
}

export interface TelemetriaDetalle {
  velocidad?: string;
  nivelCombustible?: number;
  odometro?: string;
  odometroKm?: number;
  ultimoReporte?: string;
  ubicacion?: string;
  operador?: string;
  acopladoAsignado?: string;
  proximoServicio?: string;
  proximoServicioEstado?: 'urgente' | 'programado' | 'normal' | 'vencido';
}

export interface ConductorHabitual {
  idConductor: string;
  nombres: string;
  apellidos: string;
}

export interface Vehiculo {
  idVehiculo: string;
  placa: string;
  pais: string;
  tipoUnidad: TipoUnidad;
  codigoUnidad: string;
  marca: string;
  modelo: string;
  especificacionMotor?: string;
  anio: number;
  idClasificacion: number;
  clasificacion: string;
  nombreClasificacion: string;
  idTipo: number;
  nombreTipo: string;
  clasificacionDetalle?: ClasificacionVehiculo;
  numeroChasis: string;
  numeroMotor?: string;
  capacidadCarga: number;
  capacidadArrastre: number;
  estadoTipo: EstadoUnidad;
  estadoTelemetrico: string;
  telemetriaDetalle?: TelemetriaDetalle;
  conductoresHabituales?: ConductorHabitual[];
  foto: string | null;
  fotoUrl: string | null;
}

export interface VehiculoFormData {
  placa: string;
  pais: string;
  tipoUnidad: TipoUnidad;
  codigoUnidad: string;
  marca: string;
  modelo: string;
  especificacionMotor?: string;
  anio: number;
  clasificacion: string;
  idClasificacion?: number;
  idTipo?: number;
  numeroChasis: string;
  numeroMotor?: string;
  capacidadCarga: number;
  capacidadArrastre: number;
  estadoTipo: EstadoUnidad;
  ubicacion?: string;
}

interface VehiculoApi {
  idVehiculo: string;
  idClasificacion: number | string;
  placa: string;
  marca: string;
  modelo: string | null;
  anio: number;
  numeroChasis: string;
  numeroMotor: string | null;
  capacidadCarga: string | number | null;
  capacidadArrastre: string | number | null;
  estado: EstadoApi;
  foto: string | null;
  idAcopladoActual: string | null;
  clasificacion?: {
    idClasificacion: number | string;
    idTipo: number | string;
    nombreClasificacion: string;
    activo?: boolean;
    tipo?: {
      idTipo: number | string;
      nombreTipo: string;
      activo?: boolean;
    };
  };
  conductoresHabituales?: Array<{
    idConductor: string;
    nombres: string;
    apellidos: string;
  }>;
}

const CLASIFICACIONES: Record<string, number> = {
  Chuto: 1,
  'Camion Volteo': 2,
  'Camión Volteo': 2,
  Cortinero: 3,
  Cava: 4,
  'Tractocamión 6x2': 1,
  'Tractocamión 6x4': 1,
  'Tractocamión 4x2': 1,
  'Rígido 3 Ejes': 1,
  'Góndola Volquete 3 Ejes': 2,
  'Caja Frigorífica 13.6m': 4,
  'Semirremolque Lona 13.6m': 3,
  'Plataforma Portacontenedor': 3,
};

const ESTADO_A_API: Record<EstadoUnidad, EstadoApi> = {
  patio: 'Activo',
  en_ruta: 'En_Ruta',
  taller: 'Mantenimiento',
  inactivo: 'Inactivo',
};

const ESTADO_DESDE_API: Record<string, EstadoUnidad> = {
  Activo: 'patio',
  En_Ruta: 'en_ruta',
  'En Ruta': 'en_ruta',
  Mantenimiento: 'taller',
  Inactivo: 'inactivo',
};

const ETIQUETA_ESTADO: Record<EstadoUnidad, string> = {
  patio: 'Activo en Patio',
  en_ruta: 'En Ruta',
  taller: 'Taller Preventivo',
  inactivo: 'Inactivo',
};

const urlFoto = (idVehiculo: string, foto: string | null) =>
  foto ? `/vehiculos/${idVehiculo}/foto?v=${foto}` : null;

function generarTelemetria(raw: VehiculoApi, estadoTipo: EstadoUnidad): TelemetriaDetalle {
  const seed = (raw.placa + raw.idVehiculo)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const combustible = (seed % 65) + 30; // 30% - 95%
  const baseKm = 85000 + (seed % 240000);
  const odometroStr = baseKm.toLocaleString('es-ES') + ' km';

  let proximoServicio = `en ${(1200 + (seed % 7500)).toLocaleString('es-ES')} km`;
  let proximoServicioEstado: 'urgente' | 'programado' | 'normal' | 'vencido' = 'normal';

  if (estadoTipo === 'taller') {
    proximoServicio = 'Vencido';
    proximoServicioEstado = 'vencido';
  } else if (seed % 5 === 0) {
    proximoServicio = `en ${250 + (seed % 200)} km`;
    proximoServicioEstado = 'urgente';
  } else if (seed % 4 === 0) {
    proximoServicio = 'Programado';
    proximoServicioEstado = 'programado';
  }

  const operadorReal = raw.conductoresHabituales?.[0]
    ? `${raw.conductoresHabituales[0].nombres} ${raw.conductoresHabituales[0].apellidos}`
    : undefined;

  return {
    velocidad: estadoTipo === 'en_ruta' ? `${68 + (seed % 22)} km/h` : '0 km/h',
    nivelCombustible: combustible,
    odometro: odometroStr,
    odometroKm: baseKm,
    ultimoReporte: estadoTipo === 'en_ruta' ? 'En tiempo real' : 'En base',
    ubicacion: estadoTipo === 'en_ruta' ? 'En Tránsito' : 'Patio Central',
    operador: operadorReal,
    proximoServicio,
    proximoServicioEstado,
  };
}

function aPayload(form: VehiculoFormData) {
  const idClasificacion = form.idClasificacion ?? CLASIFICACIONES[form.clasificacion] ?? 1;

  return {
    idClasificacion,
    placa: form.placa.trim(),
    marca: form.marca.trim(),
    modelo: form.modelo.trim() || undefined,
    anio: form.anio,
    numeroChasis: form.numeroChasis.trim(),
    numeroMotor: form.numeroMotor?.trim() || undefined,
    capacidadCarga: form.capacidadCarga,
    capacidadArrastre: form.capacidadArrastre,
    estado: ESTADO_A_API[form.estadoTipo],
  };
}

function aVehiculo(raw: VehiculoApi, form?: VehiculoFormData): Vehiculo {
  const rawIdTipo = Number(raw.clasificacion?.tipo?.idTipo ?? raw.clasificacion?.idTipo);
  const idTipoNum = !isNaN(rawIdTipo) && rawIdTipo > 0
    ? rawIdTipo
    : (form?.tipoUnidad === 'acoplado' ? 2 : 1);
  const tipoUnidad: TipoUnidad =
    form?.tipoUnidad ?? (idTipoNum === 2 ? 'acoplado' : 'motriz');
  const estadoTipo = ESTADO_DESDE_API[raw.estado] ?? 'patio';
  const ubicacion = form?.ubicacion?.trim();

  const telemetriaGenerada = generarTelemetria(raw, estadoTipo);

  // Formato #TR-XXX para que concuerde con el diseño telemático
  const digitsOnly = raw.placa.replace(/\D/g, '');
  const fallbackNum = digitsOnly.length >= 2 ? digitsOnly.slice(-3).padStart(3, '0') : raw.idVehiculo.replace(/\D/g, '').slice(-3).padStart(3, '0');
  const defaultCodigo = tipoUnidad === 'motriz' ? `#TR-${fallbackNum || '104'}` : `#AC-${fallbackNum || '050'}`;

  const nombreClasificacion = raw.clasificacion?.nombreClasificacion ?? form?.clasificacion ?? '';
  const nombreTipo = raw.clasificacion?.tipo?.nombreTipo ?? (idTipoNum === 1 ? 'Unidad Motora' : 'Acoplado');

  return {
    idVehiculo: raw.idVehiculo,
    placa: raw.placa,
    pais: form?.pais ?? (tipoUnidad === 'acoplado' ? 'ES-R' : 'ES'),
    tipoUnidad,
    codigoUnidad: form?.codigoUnidad || defaultCodigo,
    marca: raw.marca,
    modelo: raw.modelo ?? '',
    especificacionMotor: form?.especificacionMotor || undefined,
    anio: raw.anio,
    idClasificacion: Number(raw.idClasificacion || raw.clasificacion?.idClasificacion || 1),
    clasificacion: nombreClasificacion,
    nombreClasificacion,
    idTipo: idTipoNum,
    nombreTipo,
    clasificacionDetalle: raw.clasificacion ? {
      idClasificacion: Number(raw.clasificacion.idClasificacion),
      idTipo: Number(raw.clasificacion.idTipo),
      nombreClasificacion: raw.clasificacion.nombreClasificacion,
      activo: raw.clasificacion.activo,
      tipo: raw.clasificacion.tipo ? {
        idTipo: Number(raw.clasificacion.tipo.idTipo),
        nombreTipo: raw.clasificacion.tipo.nombreTipo,
        activo: raw.clasificacion.tipo.activo,
      } : undefined,
    } : undefined,
    numeroChasis: raw.numeroChasis,
    numeroMotor: raw.numeroMotor ?? undefined,
    capacidadCarga: Number(raw.capacidadCarga ?? 0),
    capacidadArrastre: Number(raw.capacidadArrastre ?? 0),
    estadoTipo,
    estadoTelemetrico: ubicacion
      ? `${ETIQUETA_ESTADO[estadoTipo]} • ${ubicacion}`
      : ETIQUETA_ESTADO[estadoTipo],
    telemetriaDetalle: {
      ...telemetriaGenerada,
      ...(ubicacion ? { ubicacion } : {}),
      ...(form?.ubicacion ? { ubicacion: form.ubicacion } : {}),
    },
    conductoresHabituales: raw.conductoresHabituales,
    foto: raw.foto ?? null,
    fotoUrl: urlFoto(raw.idVehiculo, raw.foto ?? null),
  };
}

export const vehiculosService = {
  async getVehiculos(): Promise<Vehiculo[]> {
    const response = await api.get<VehiculoApi[]>('/vehiculos');
    return response.data.map((raw) => aVehiculo(raw));
  },

  async getTiposVehiculo(): Promise<TipoVehiculo[]> {
    const response = await api.get<TipoVehiculo[]>('/vehiculos/tipos');
    return response.data;
  },

  async getClasificaciones(): Promise<ClasificacionVehiculo[]> {
    const response = await api.get<ClasificacionVehiculo[]>('/vehiculos/clasificaciones');
    return response.data;
  },

  async createVehiculo(form: VehiculoFormData): Promise<Vehiculo> {
    const response = await api.post<VehiculoApi>('/vehiculos', aPayload(form));
    return aVehiculo(response.data, form);
  },

  async updateVehiculo(idVehiculo: string, form: VehiculoFormData): Promise<Vehiculo> {
    const response = await api.patch<VehiculoApi>(`/vehiculos/${idVehiculo}`, aPayload(form));
    return aVehiculo(response.data, form);
  },

  async deleteVehiculo(idVehiculo: string): Promise<void> {
    await api.delete(`/vehiculos/${idVehiculo}`);
  },

  async subirFoto(vehiculo: Vehiculo, archivo: File): Promise<Vehiculo> {
    const datos = new FormData();
    datos.append('foto', archivo);
    const response = await api.put<VehiculoApi>(`/vehiculos/${vehiculo.idVehiculo}/foto`, datos, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return {
      ...vehiculo,
      foto: response.data.foto,
      fotoUrl: urlFoto(vehiculo.idVehiculo, response.data.foto),
    };
  },

  async eliminarFoto(vehiculo: Vehiculo): Promise<Vehiculo> {
    await api.delete(`/vehiculos/${vehiculo.idVehiculo}/foto`);
    return { ...vehiculo, foto: null, fotoUrl: null };
  },
};
