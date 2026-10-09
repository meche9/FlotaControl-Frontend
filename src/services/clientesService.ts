import api from './api';

export interface PuntoCargaDescargaResumen {
  idPunto: string;
  nombreSede: string;
  ciudad: string;
  estado: string;
  tipoPunto: 'Origen' | 'Destino' | 'Ambos';
  activo?: boolean;
}

export interface RutaResumen {
  idRuta: string;
  idCliente: string;
  nombreRuta: string;
  ciudadOrigen: string;
  ciudadDestino: string;
  idPuntoOrigen?: string | null;
  idPuntoDestino?: string | null;
  distanciaKm: number | string;
  tiempoEstimadoHoras?: number | string | null;
  activo?: boolean;
}

export interface Cliente {
  idCliente: string;
  razonSocial: string;
  nombreComercial?: string | null;
  rif: string;
  direccionFiscal: string;
  telefonoContacto: string;
  personaContacto: string;
  emailFacturacion: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  _count?: {
    puntosCargaDescarga?: number;
    rutas?: number;
    guiasViajes?: number;
    proformas?: number;
  };
  puntosCargaDescarga?: PuntoCargaDescargaResumen[];
  rutas?: RutaResumen[];
  // Campos derivados/visuales
  estadoFiscal?: 'Solvente' | 'Retención Especial' | 'Exento' | 'En Revisión';
  ciudadSede?: string;
}

export interface CreateClienteDto {
  razonSocial: string;
  nombreComercial?: string;
  rif: string;
  direccionFiscal: string;
  telefonoContacto: string;
  personaContacto: string;
  emailFacturacion: string;
}

export interface UpdateClienteDto {
  razonSocial?: string;
  nombreComercial?: string;
  rif?: string;
  direccionFiscal?: string;
  telefonoContacto?: string;
  personaContacto?: string;
  emailFacturacion?: string;
}

// Infiere las iniciales para el avatar tipo insignia (POL, HNZ, SID, MNC, QMP, CAP, etc.)
export function obtenerCodigoAvatar(cliente: Partial<Cliente>): { codigo: string; estilo: string } {
  const nombre = (cliente.nombreComercial || cliente.razonSocial || 'CLI').trim().toUpperCase();

  if (nombre.includes('POLAR')) {
    return { codigo: 'POL', estilo: 'bg-sky-100 text-sky-800 border-sky-200/80 ring-sky-500/20' };
  }
  if (nombre.includes('HEINZ')) {
    return { codigo: 'HNZ', estilo: 'bg-rose-100 text-rose-800 border-rose-200/80 ring-rose-500/20' };
  }
  if (nombre.includes('SIDETUR') || nombre.includes('TURBIO')) {
    return { codigo: 'SID', estilo: 'bg-blue-100 text-blue-800 border-blue-200/80 ring-blue-500/20' };
  }
  if (nombre.includes('MONACA')) {
    return { codigo: 'MNC', estilo: 'bg-orange-100 text-orange-800 border-orange-200/80 ring-orange-500/20' };
  }
  if (nombre.includes('QUIM') || nombre.includes('PALITO')) {
    return { codigo: 'QMP', estilo: 'bg-cyan-100 text-cyan-800 border-cyan-200/80 ring-cyan-500/20' };
  }
  if (nombre.includes('CAPCA') || nombre.includes('AZUCAR') || nombre.includes('PORTUGUESA')) {
    return { codigo: 'CAP', estilo: 'bg-amber-100 text-amber-800 border-amber-200/80 ring-amber-500/20' };
  }

  // Generador general de 3 letras
  const palabras = nombre.split(/\s+/).filter(Boolean);
  let codigo = 'CLI';
  if (palabras.length >= 3) {
    codigo = `${palabras[0][0]}${palabras[1][0]}${palabras[2][0]}`;
  } else if (palabras.length === 2) {
    codigo = `${palabras[0].slice(0, 2)}${palabras[1][0]}`;
  } else if (palabras.length === 1) {
    codigo = palabras[0].slice(0, 3);
  }

  const estilosGenericos = [
    'bg-sky-100 text-sky-800 border-sky-200/80 ring-sky-500/20',
    'bg-emerald-100 text-emerald-800 border-emerald-200/80 ring-emerald-500/20',
    'bg-indigo-100 text-indigo-800 border-indigo-200/80 ring-indigo-500/20',
    'bg-amber-100 text-amber-800 border-amber-200/80 ring-amber-500/20',
    'bg-rose-100 text-rose-800 border-rose-200/80 ring-rose-500/20',
    'bg-purple-100 text-purple-800 border-purple-200/80 ring-purple-500/20',
  ];

  const hash = codigo.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const estilo = estilosGenericos[hash % estilosGenericos.length];

  return { codigo: codigo.toUpperCase(), estilo };
}

export const clientesService = {
  getClientes: async (): Promise<Cliente[]> => {
    const response = await api.get<Cliente[]>('/clientes');
    return response.data;
  },

  getClienteById: async (id: string): Promise<Cliente> => {
    const response = await api.get<Cliente>(`/clientes/${id}`);
    return response.data;
  },

  createCliente: async (data: CreateClienteDto): Promise<Cliente> => {
    const response = await api.post<Cliente>('/clientes', data);
    return response.data;
  },

  updateCliente: async (id: string, data: UpdateClienteDto): Promise<Cliente> => {
    const response = await api.patch<Cliente>(`/clientes/${id}`, data);
    return response.data;
  },

  deleteCliente: async (id: string): Promise<void> => {
    await api.delete(`/clientes/${id}`);
  },
};
