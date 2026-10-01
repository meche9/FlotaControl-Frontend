import api from './api';

export type EstadoUnidad = 'patio' | 'en_ruta' | 'taller' | 'inactivo';
export type TipoUnidad = 'motriz' | 'acoplado';

type EstadoApi = 'Activo' | 'En_Ruta' | 'Mantenimiento' | 'Inactivo';

export interface TelemetriaDetalle {
  velocidad?: string;
  nivelCombustible?: number;
  odometro?: string;
  ultimoReporte?: string;
  ubicacion?: string;
  operador?: string;
  acopladoAsignado?: string;
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
  clasificacion: string;
  numeroChasis: string;
  numeroMotor?: string;
  capacidadCarga: number;
  capacidadArrastre: number;
  estadoTipo: EstadoUnidad;
  estadoTelemetrico: string;
  telemetriaDetalle?: TelemetriaDetalle;
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
  numeroChasis: string;
  numeroMotor?: string;
  capacidadCarga: number;
  capacidadArrastre: number;
  estadoTipo: EstadoUnidad;
  ubicacion?: string;
}

interface VehiculoApi {
  idVehiculo: string;
  idClasificacion: string;
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
    idClasificacion: string;
    idTipo: string;
    nombreClasificacion: string;
  };
}

const TIPO_ACOPLADO = 'a1000000-0000-4000-8000-000000000002';

const CLASIFICACIONES: Record<string, string> = {
  'Tractocamión 6x2': 'c1000000-0000-4000-8000-000000000001',
  'Tractocamión 6x4': 'c1000000-0000-4000-8000-000000000002',
  'Tractocamión 4x2': 'c1000000-0000-4000-8000-000000000003',
  'Rígido 3 Ejes': 'c1000000-0000-4000-8000-000000000004',
  'Góndola Volquete 3 Ejes': 'c1000000-0000-4000-8000-000000000005',
  'Caja Frigorífica 13.6m': 'c1000000-0000-4000-8000-000000000006',
  'Semirremolque Lona 13.6m': 'c1000000-0000-4000-8000-000000000007',
  'Plataforma Portacontenedor': 'c1000000-0000-4000-8000-000000000008',
};

const ESTADO_A_API: Record<EstadoUnidad, EstadoApi> = {
  patio: 'Activo',
  en_ruta: 'En_Ruta',
  taller: 'Mantenimiento',
  inactivo: 'Inactivo',
};

const ESTADO_DESDE_API: Record<EstadoApi, EstadoUnidad> = {
  Activo: 'patio',
  En_Ruta: 'en_ruta',
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

function aPayload(form: VehiculoFormData) {
  const idClasificacion = CLASIFICACIONES[form.clasificacion];
  if (!idClasificacion) {
    throw new Error(`Clasificación no registrada: ${form.clasificacion}`);
  }

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
  const tipoUnidad: TipoUnidad =
    form?.tipoUnidad ?? (raw.clasificacion?.idTipo === TIPO_ACOPLADO ? 'acoplado' : 'motriz');
  const estadoTipo = ESTADO_DESDE_API[raw.estado] ?? 'patio';
  const ubicacion = form?.ubicacion?.trim();

  return {
    idVehiculo: raw.idVehiculo,
    placa: raw.placa,
    pais: form?.pais ?? (tipoUnidad === 'acoplado' ? 'ES-R' : 'ES'),
    tipoUnidad,
    codigoUnidad:
      form?.codigoUnidad ||
      `${tipoUnidad === 'motriz' ? 'MT' : 'AC'}-${raw.idVehiculo.slice(0, 6).toUpperCase()}`,
    marca: raw.marca,
    modelo: raw.modelo ?? '',
    especificacionMotor: form?.especificacionMotor || undefined,
    anio: raw.anio,
    clasificacion: raw.clasificacion?.nombreClasificacion ?? form?.clasificacion ?? '',
    numeroChasis: raw.numeroChasis,
    numeroMotor: raw.numeroMotor ?? undefined,
    capacidadCarga: Number(raw.capacidadCarga ?? 0),
    capacidadArrastre: Number(raw.capacidadArrastre ?? 0),
    estadoTipo,
    estadoTelemetrico: ubicacion
      ? `${ETIQUETA_ESTADO[estadoTipo]} • ${ubicacion}`
      : ETIQUETA_ESTADO[estadoTipo],
    telemetriaDetalle: ubicacion ? { ubicacion } : undefined,
    foto: raw.foto ?? null,
    fotoUrl: urlFoto(raw.idVehiculo, raw.foto ?? null),
  };
}

export const vehiculosService = {
  async getVehiculos(): Promise<Vehiculo[]> {
    const response = await api.get<VehiculoApi[]>('/vehiculos');
    return response.data.map((raw) => aVehiculo(raw));
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
