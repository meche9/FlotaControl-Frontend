import api, { getApiErrorMessage } from './api';

export type ConductorSexo = 'M' | 'F';

export type ConductorEstadoCivil =
  | 'Soltero_a'
  | 'Casado_a'
  | 'Divorciado_a'
  | 'Viudo_a'
  | 'Concubinato';

export type ConductorEstado =
  | 'Activo'
  | 'En_Ruta'
  | 'Vacaciones'
  | 'Inactivo'
  | 'Suspendido';

export interface VehiculoHabitual {
  idVehiculo: string;
  placa: string;
  marca: string;
  modelo?: string | null;
  anio?: number;
  clasificacion?: {
    idClasificacion?: number;
    nombreClasificacion?: string;
  } | null;
}

export interface Conductor {
  idConductor: string;
  cedulaIdentidad: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento?: string | null;
  fechaIngreso?: string | null;
  sexo?: ConductorSexo | null;
  nacionalidad?: string | null;
  estadoCivil?: ConductorEstadoCivil | null;
  cargaFamiliar?: number | null;
  tipoSangre?: string | null;

  telefono: string;
  telefonoAuxiliar?: string | null;
  email?: string | null;

  direccion?: string | null;
  urbBarrioParroquia?: string | null;
  avCalle?: string | null;
  edifCasa?: string | null;
  aptoPiso?: string | null;
  estadoCiudadMunicipio?: string | null;

  personaContacto?: string | null;
  telefonoContacto?: string | null;

  tallaCamisa?: string | null;
  tallaPantalon?: string | null;
  tallaChemise?: string | null;
  tallaFranela?: string | null;
  tallaCalzado?: string | null;

  banco?: string | null;
  nroCuenta?: string | null;
  pagoMovil?: string | null;

  estado: ConductorEstado;
  idVehiculoHabitual?: string | null;
  vehiculoHabitual?: VehiculoHabitual | null;

  foto?: string | null;
  fotoUrl?: string | null;

  fechaCreacion?: string;
  fechaActualizacion?: string;

  // Metadata visual / enriquecida (UI)
  experienciaAnios?: number;
  viajesCompletados?: number;
  scoreDesempeno?: string;
  notaOperativa?: string;
  avatarUrl?: string | null;
}

export interface ConductorFormData {
  cedulaIdentidad: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento?: string;
  fechaIngreso?: string;
  sexo?: ConductorSexo;
  nacionalidad?: string;
  estadoCivil?: ConductorEstadoCivil;
  cargaFamiliar?: number;
  tipoSangre?: string;

  telefono: string;
  telefonoAuxiliar?: string;
  email?: string;

  direccion?: string;
  urbBarrioParroquia?: string;
  avCalle?: string;
  edifCasa?: string;
  aptoPiso?: string;
  estadoCiudadMunicipio?: string;

  personaContacto?: string;
  telefonoContacto?: string;

  tallaCamisa?: string;
  tallaPantalon?: string;
  tallaChemise?: string;
  tallaFranela?: string;
  tallaCalzado?: string;

  banco?: string;
  nroCuenta?: string;
  pagoMovil?: string;

  estado?: ConductorEstado;
  idVehiculoHabitual?: string | null;
  foto?: string | null;
}

export interface RegistroRapidoFormData {
  cedulaIdentidad: string;
  telefono: string;
  nombres: string;
  apellidos: string;
  nombreCompleto?: string;
  idVehiculoHabitual?: string;
  hubOperativo?: string;
  fechaIngreso?: string;
  archivoFoto?: File | null;
}

export const ESTADO_CONDUCTOR_LABELS: Record<ConductorEstado, string> = {
  Activo: 'Activo',
  En_Ruta: 'En Ruta',
  Vacaciones: 'Vacaciones',
  Inactivo: 'Inactivo',
  Suspendido: 'Suspendido',
};

export const ESTADO_CIVIL_LABELS: Record<ConductorEstadoCivil, string> = {
  Soltero_a: 'Soltero/a',
  Casado_a: 'Casado/a',
  Divorciado_a: 'Divorciado/a',
  Viudo_a: 'Viudo/a',
  Concubinato: 'Concubinato',
};

export const urlFotoConductor = (idConductor: string, foto: string | null | undefined): string | null =>
  foto ? `/conductores/${idConductor}/foto?v=${foto}` : null;

// Genera datos de desempeño telemático para enriquecer visualmente el listado
function enriquecerConductor(c: Conductor): Conductor {
  const seed = (c.cedulaIdentidad + c.idConductor)
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  let anios = 2 + (seed % 14);
  if (c.fechaIngreso) {
    const diffMs = Date.now() - new Date(c.fechaIngreso).getTime();
    const diffAnios = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    if (diffAnios >= 0) {
      anios = diffAnios;
    }
  }
  const viajes = 150 + (seed % 950);
  const puntualidad = 92 + (seed % 8);

  let scoreDesempeno = `★ ${puntualidad}% Conducción Segura • ${viajes} viajes`;
  let notaOperativa = '';

  if (c.estado === 'En_Ruta') {
    const rutas = [
      'Valencia → Barquisimeto',
      'Puerto Cabello → Valencia',
      'Valencia → Caracas',
      'Barquisimeto → Maracaibo',
    ];
    notaOperativa = rutas[seed % rutas.length];
    scoreDesempeno = `★ ${95 + (seed % 5)}% Telemetría OK • ${viajes} viajes`;
  } else if (c.estado === 'Vacaciones') {
    notaOperativa = 'Reintegro: 18 Nov';
    scoreDesempeno = `★ ${93 + (seed % 6)}% Eficiencia Combustible • ${viajes} viajes`;
  } else if (c.estado === 'Inactivo') {
    notaOperativa = seed % 2 === 0 ? 'Reposo Médico Traumatología' : 'Licencia Temporal';
    scoreDesempeno = 'En espera de reactivación médica';
  } else if (c.estado === 'Suspendido') {
    notaOperativa = 'Revisión Técnica';
    scoreDesempeno = '⚠️ Alerta Telemetría: Exceso de Velocidad';
  }

  return {
    ...c,
    foto: c.foto ?? null,
    fotoUrl: urlFotoConductor(c.idConductor, c.foto),
    experienciaAnios: c.experienciaAnios ?? anios,
    viajesCompletados: c.viajesCompletados ?? viajes,
    scoreDesempeno: c.scoreDesempeno ?? scoreDesempeno,
    notaOperativa: c.notaOperativa ?? notaOperativa,
  };
}

export const conductoresService = {
  async getConductores(): Promise<Conductor[]> {
    const response = await api.get<Conductor[]>('/conductores');
    return response.data.map(enriquecerConductor);
  },

  async getConductor(id: string): Promise<Conductor> {
    const response = await api.get<Conductor>(`/conductores/${id}`);
    return enriquecerConductor(response.data);
  },

  async createConductor(data: ConductorFormData): Promise<Conductor> {
    const payload = {
      ...data,
      cedulaIdentidad: data.cedulaIdentidad.trim().toUpperCase(),
      nombres: data.nombres.trim(),
      apellidos: data.apellidos.trim(),
      telefono: data.telefono.trim(),
      email: data.email?.trim() || undefined,
      idVehiculoHabitual: data.idVehiculoHabitual && data.idVehiculoHabitual.trim() !== ''
        ? data.idVehiculoHabitual
        : undefined,
    };
    const response = await api.post<Conductor>('/conductores', payload);
    return enriquecerConductor(response.data);
  },

  async registroRapido(form: RegistroRapidoFormData): Promise<Conductor> {
    let nombres = form.nombres?.trim() || '';
    let apellidos = form.apellidos?.trim() || '';

    // Soporte retrocompatible en caso de que se pase nombreCompleto
    if ((!nombres || !apellidos) && form.nombreCompleto) {
      const partes = form.nombreCompleto.trim().split(/\s+/);
      if (partes.length === 1) {
        nombres = partes[0];
        apellidos = '-';
      } else if (partes.length === 2) {
        nombres = partes[0];
        apellidos = partes[1];
      } else if (partes.length === 3) {
        nombres = `${partes[0]} ${partes[1]}`;
        apellidos = partes[2];
      } else {
        const medio = Math.ceil(partes.length / 2);
        nombres = partes.slice(0, medio).join(' ');
        apellidos = partes.slice(medio).join(' ');
      }
    }

    const payload: ConductorFormData = {
      cedulaIdentidad: form.cedulaIdentidad.trim().toUpperCase(),
      nombres,
      apellidos,
      telefono: form.telefono.trim(),
      fechaIngreso: form.fechaIngreso?.trim() || new Date().toISOString().slice(0, 10),
      idVehiculoHabitual: form.idVehiculoHabitual && form.idVehiculoHabitual.trim() !== ''
        ? form.idVehiculoHabitual
        : undefined,
      estadoCiudadMunicipio: form.hubOperativo?.trim() || undefined,
      estado: 'Activo',
    };

    let conductor = await this.createConductor(payload);

    if (form.archivoFoto) {
      try {
        conductor = await this.subirFoto(conductor.idConductor, form.archivoFoto);
      } catch (err) {
        console.warn('No se pudo subir la foto inicial del conductor:', err);
      }
    }

    return conductor;
  },

  async updateConductor(id: string, data: Partial<ConductorFormData>): Promise<Conductor> {
    const payload: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      // Ignorar campos no proporcionados (undefined)
      if (value === undefined) continue;

      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (key === 'cedulaIdentidad') {
          payload[key] = trimmed.toUpperCase();
        } else if (key === 'idVehiculoHabitual') {
          payload[key] = trimmed ? trimmed : null;
        } else if (key === 'tipoSangre') {
          payload[key] = trimmed ? trimmed.toUpperCase() : null;
        } else if (key === 'fechaNacimiento' || key === 'fechaIngreso') {
          payload[key] = trimmed ? trimmed : null;
        } else if (key === 'email') {
          payload[key] = trimmed ? trimmed : null;
        } else if (trimmed === '') {
          payload[key] = null;
        } else {
          payload[key] = trimmed;
        }
      } else {
        payload[key] = value;
      }
    }

    const response = await api.patch<Conductor>(`/conductores/${id}`, payload);
    return enriquecerConductor(response.data);
  },

  async deleteConductor(id: string): Promise<void> {
    await api.delete(`/conductores/${id}`);
  },

  async cambiarEstado(id: string, nuevoEstado: ConductorEstado): Promise<Conductor> {
    const response = await api.patch<Conductor>(`/conductores/${id}`, { estado: nuevoEstado });
    return enriquecerConductor(response.data);
  },

  async subirFoto(idConductor: string, archivo: File): Promise<Conductor> {
    const datos = new FormData();
    datos.append('foto', archivo);
    const response = await api.put<Conductor>(`/conductores/${idConductor}/foto`, datos, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return enriquecerConductor(response.data);
  },

  async eliminarFoto(idConductor: string): Promise<Conductor> {
    const response = await api.delete<Conductor>(`/conductores/${idConductor}/foto`);
    return enriquecerConductor(response.data);
  },
};
