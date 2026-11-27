import api from './api';

export interface NominaResumen {
  idCodnomina: string;
  modalidad: 'diaria' | 'semanal' | 'por_viaje' | 'quincenal' | 'mensual';
  descripcion: string | null;
  activo: boolean;
}

export interface NominaProceso {
  idProcesonomina: string;
  idCodnomina: string;
  codProcesonomina: string;
  fechaInicioP: string;
  fechaFinP: string;
  fechaCierreP: string | null;
  createdAt: string;
  updateAt: string;
  nomina?: NominaResumen;
  _count?: {
    calculos: number;
  };
}

export interface CreateProcesoNominaDto {
  idCodnomina: string;
  codProcesonomina: string;
  fechaInicioP: string;
  fechaFinP: string;
}

export interface UpdateProcesoNominaDto {
  codProcesonomina?: string;
  fechaInicioP?: string;
  fechaFinP?: string;
  fechaCierreP?: string | null;
}

export interface NominaDeduccionItem {
  idDeducciones: string;
  idNomina: string;
  descripcion: string;
  tipocalculo: 'monto_fijo' | 'porcentaje';
  valor: number | string;
  moneda: string;
  activo: boolean;
}

export interface TasaBcvResponse {
  tasa: number;
  fechaTasa: string | null;
}

export const nominasProcesosService = {
  async listarTiposNomina(): Promise<NominaResumen[]> {
    const { data } = await api.get<NominaResumen[]>('/nominas-procesos/tipos');
    return data;
  },

  async listarDeducciones(idNomina?: string): Promise<NominaDeduccionItem[]> {
    const { data } = await api.get<NominaDeduccionItem[]>(
      '/nominas-procesos/deducciones',
      {
        params: idNomina ? { idNomina } : undefined,
      },
    );
    return data;
  },

  async obtenerTasaBcv(): Promise<TasaBcvResponse> {
    const { data } = await api.get<TasaBcvResponse>(
      '/nominas-procesos/tasa-bcv',
    );
    return data;
  },

  async listar(params?: {
    idCodnomina?: string;
    soloAbiertos?: boolean;
  }): Promise<NominaProceso[]> {
    const { data } = await api.get<NominaProceso[]>('/nominas-procesos', {
      params,
    });
    return data;
  },

  async obtenerPorId(id: string): Promise<NominaProceso> {
    const { data } = await api.get<NominaProceso>(`/nominas-procesos/${id}`);
    return data;
  },

  async abrirProceso(dto: CreateProcesoNominaDto): Promise<NominaProceso> {
    const { data } = await api.post<NominaProceso>(
      '/nominas-procesos/abrir',
      dto,
    );
    return data;
  },

  async actualizar(
    id: string,
    dto: UpdateProcesoNominaDto,
  ): Promise<NominaProceso> {
    const { data } = await api.patch<NominaProceso>(
      `/nominas-procesos/${id}`,
      dto,
    );
    return data;
  },

  async cerrarProceso(id: string): Promise<NominaProceso> {
    const { data } = await api.patch<NominaProceso>(
      `/nominas-procesos/${id}`,
      {
        fechaCierreP: new Date().toISOString(),
      },
    );
    return data;
  },
};
