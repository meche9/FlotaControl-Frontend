import { useState, useEffect, useMemo, useCallback } from 'react';
import { RegistrarDespachoModal } from './RegistrarDespachoModal';
import { programacionService, type GuiaProgramada } from '../../services/programacionService';
import {
  Truck,
  Users,
  Gauge,
  AlertTriangle,
  Search,
  RefreshCw,
  Calendar,
  TrendingUp,
  Trophy,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  ArrowUpRight,
  Wrench,
  MapPin,
  Navigation,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export interface ViajeGpsTelemetry {
  distanciaRecorridaKm?: number | null;
  progresoGpsPct?: number | null;
  gpsConectado?: boolean;
  ultimaActualizacionGps?: string | null;
}

type ViajeDashboardItem = GuiaProgramada & Partial<ViajeGpsTelemetry>;

function obtenerRangoSemanaActual() {
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  // Semana inicia el Lunes (0 = Dom -> 6, 1 = Lun -> 0, ..., 6 = Sáb -> 5)
  const offsetDesdeLunes = (hoy.getDay() + 6) % 7;

  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - offsetDesdeLunes);

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatCorto = (d: Date) => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]}`;
  };

  return {
    hoyISO: toISO(hoy),
    lunesISO: toISO(lunes),
    domingoISO: toISO(domingo),
    etiquetaSemana: `${formatCorto(lunes)} - ${formatCorto(domingo)}`,
  };
}

function extraerFechaISO(fechaStr?: string | null): string {
  if (!fechaStr) return '';
  const raw = String(fechaStr).trim();
  const soloFecha = raw.split(/[T\s]/)[0].replace(/\./g, '/').replace(/-/g, '/');

  const matchYMD = soloFecha.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (matchYMD) {
    return `${matchYMD[1]}-${matchYMD[2].padStart(2, '0')}-${matchYMD[3].padStart(2, '0')}`;
  }

  const matchDMY = soloFecha.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (matchDMY) {
    const anio = matchDMY[3].length === 2 ? `20${matchDMY[3]}` : matchDMY[3];
    return `${anio}-${matchDMY[2].padStart(2, '0')}-${matchDMY[1].padStart(2, '0')}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
}

function extraerHora(fechaStr?: string | null): string {
  if (!fechaStr) return '';
  const match = String(fechaStr).match(/[T\s](\d{2}:\d{2})/);
  return match ? match[1] : '';
}

function formatearEncabezadoDia(iso: string, hoyISO: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const fecha = new Date(y, (m || 1) - 1, d || 1);
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const etiquetaDia = `${dias[fecha.getDay()]}, ${String(d).padStart(2, '0')} de ${meses[fecha.getMonth()]} ${y}`;

  const [hy, hm, hd] = hoyISO.split('-').map(Number);
  const hoyDate = new Date(hy, (hm || 1) - 1, hd || 1);
  const diffDias = Math.round((fecha.getTime() - hoyDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    etiquetaDia,
    esHoy: diffDias === 0,
    esManana: diffDias === 1,
  };
}

function obtenerNombreConductor(viaje: ViajeDashboardItem): string {
  if (!viaje.conductor) return 'Sin conductor asignado';
  return `${viaje.conductor.nombres || ''} ${viaje.conductor.apellidos || ''}`.trim() || 'Sin conductor asignado';
}

function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'SC';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

function calcularProgresoUbicacion(viaje: ViajeDashboardItem) {
  const distanciaTotalKm = Math.max(0, Number(viaje.ruta?.distanciaKm || 0));
  const tieneGps =
    viaje.gpsConectado === true ||
    (viaje.distanciaRecorridaKm !== undefined && viaje.distanciaRecorridaKm !== null);

  const estadoNorm = (viaje.estadoOrden || '').toLowerCase();
  const completado =
    estadoNorm.includes('complet') ||
    estadoNorm.includes('entreg') ||
    estadoNorm.includes('finaliz');

  let distanciaRecorridaKm = 0;
  let progresoPct = 0;

  if (tieneGps) {
    distanciaRecorridaKm = Math.max(0, Number(viaje.distanciaRecorridaKm ?? 0));
    if (viaje.progresoGpsPct !== undefined && viaje.progresoGpsPct !== null) {
      progresoPct = Math.min(100, Math.max(0, Number(viaje.progresoGpsPct)));
    } else if (distanciaTotalKm > 0) {
      progresoPct = Math.min(100, Math.max(0, (distanciaRecorridaKm / distanciaTotalKm) * 100));
    }
  } else if (completado) {
    distanciaRecorridaKm = distanciaTotalKm;
    progresoPct = 100;
  }

  return {
    distanciaTotalKm,
    distanciaRecorridaKm: Math.round(distanciaRecorridaKm),
    progresoPct: Math.round(progresoPct),
    tieneGps,
    completado,
  };
}

export default function Dashboard() {
  const [rangoSemana] = useState(() => obtenerRangoSemanaActual());
  const [alcanceSemana, setAlcanceSemana] = useState<'desde_hoy' | 'toda_semana'>('desde_hoy');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'En Tránsito' | 'Programado' | 'Completado'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [viajesSemana, setViajesSemana] = useState<ViajeDashboardItem[]>([]);
  const [cargandoViajes, setCargandoViajes] = useState(true);
  const [errorViajes, setErrorViajes] = useState<string | null>(null);
  const [diasPlegados, setDiasPlegados] = useState<Record<string, boolean>>({});
  const [ordenTabla, setOrdenTabla] = useState<'conductor' | 'ruta_asc' | 'ruta_desc'>('conductor');
  const [verTodosOperadores, setVerTodosOperadores] = useState(false);
  const [isModalDespachoOpen, setIsModalDespachoOpen] = useState(false);
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  const alternarOrdenRuta = () => {
    setOrdenTabla((prev) =>
      prev === 'conductor' ? 'ruta_asc' : prev === 'ruta_asc' ? 'ruta_desc' : 'conductor'
    );
  };

  const toggleDiaPlegado = (fechaISO: string) => {
    setDiasPlegados((prev) => ({
      ...prev,
      [fechaISO]: !prev[fechaISO],
    }));
  };

  const cargarViajesSemana = useCallback(async () => {
    setCargandoViajes(true);
    setErrorViajes(null);
    try {
      const data = await programacionService.getGuiasProgramadas({
        fechaInicio: rangoSemana.lunesISO,
        fechaFin: rangoSemana.domingoISO,
        estadoOrden: 'todos',
      });
      setViajesSemana(Array.isArray(data) ? data : []);
    } catch {
      setErrorViajes('No se pudo cargar el listado de viajes de la semana.');
      setViajesSemana([]);
    } finally {
      setCargandoViajes(false);
    }
  }, [rangoSemana.lunesISO, rangoSemana.domingoISO]);

  useEffect(() => {
    cargarViajesSemana();
  }, [cargarViajesSemana]);

  // Filtra desde hoy (o toda la semana Lun-Dom), ordena por fecha asc -> conductor asc, y agrupa por día
  const viajesAgrupadosPorDia = useMemo(() => {
    const fechaMinima = alcanceSemana === 'desde_hoy' ? rangoSemana.hoyISO : rangoSemana.lunesISO;
    const termino = searchTerm.trim().toLowerCase();

    const filtrados = viajesSemana
      .map((viaje) => {
        const plantaOrigen =
          viaje.puntoOrigen?.nombreSede ||
          viaje.puntoOrigen?.ciudad ||
          viaje.puntoOrigen?.codigoPuntoc ||
          'Origen';
        const plantaDestino =
          viaje.puntoDestino?.nombreSede ||
          viaje.puntoDestino?.ciudad ||
          viaje.puntoDestino?.codigoPuntoc ||
          'Destino';
        return {
          viaje,
          fechaISO: extraerFechaISO(viaje.fechaProgramadaCarga),
          hora: extraerHora(viaje.fechaProgramadaCarga),
          conductorNombre: obtenerNombreConductor(viaje),
          rutaOrdenKey: `${plantaOrigen} -> ${plantaDestino}`,
        };
      })
      .filter(({ viaje, fechaISO, conductorNombre }) => {
        if (!fechaISO) return false;
        if (fechaISO < fechaMinima || fechaISO > rangoSemana.domingoISO) return false;

        if (filtroEstado !== 'todos') {
          const est = (viaje.estadoOrden || '').toLowerCase();
          if (filtroEstado === 'En Tránsito' && !est.includes('tránsito') && !est.includes('transito')) return false;
          if (filtroEstado === 'Programado' && !est.includes('programado') && !est.includes('andén') && !est.includes('anden')) return false;
          if (filtroEstado === 'Completado' && !est.includes('complet') && !est.includes('entreg') && !est.includes('finaliz')) return false;
        }

        if (termino) {
          const placa = viaje.vehiculoMotriz?.placa || viaje.conductor?.vehiculoHabitual?.placa || '';
          const marca = viaje.vehiculoMotriz?.marca || viaje.conductor?.vehiculoHabitual?.marca || '';
          const modelo = viaje.vehiculoMotriz?.modelo || viaje.conductor?.vehiculoHabitual?.modelo || '';
          const origen = `${viaje.puntoOrigen?.codigoPuntoc || ''} ${viaje.puntoOrigen?.nombreSede || ''} ${viaje.puntoOrigen?.ciudad || ''}`;
          const destino = `${viaje.puntoDestino?.codigoPuntoc || ''} ${viaje.puntoDestino?.nombreSede || ''} ${viaje.puntoDestino?.ciudad || ''}`;
          const cliente = viaje.cliente?.nombreComercial || viaje.cliente?.razonSocial || '';
          const texto = `${viaje.nroTransporte || ''} ${conductorNombre} ${placa} ${marca} ${modelo} ${origen} ${destino} ${cliente}`.toLowerCase();
          if (!texto.includes(termino)) return false;
        }

        return true;
      });

    // Ordenar primero por fecha ascendente y dentro de cada día por ruta (si se seleccionó) o por conductor
    filtrados.sort((a, b) => {
      if (a.fechaISO !== b.fechaISO) return a.fechaISO.localeCompare(b.fechaISO);

      if (ordenTabla === 'ruta_asc' || ordenTabla === 'ruta_desc') {
        const cmpRuta = a.rutaOrdenKey.localeCompare(b.rutaOrdenKey, 'es', { sensitivity: 'base' });
        if (cmpRuta !== 0) return ordenTabla === 'ruta_asc' ? cmpRuta : -cmpRuta;
      }

      const aSin = a.conductorNombre === 'Sin conductor asignado';
      const bSin = b.conductorNombre === 'Sin conductor asignado';
      if (aSin !== bSin) return aSin ? 1 : -1;
      const cmpConductor = a.conductorNombre.localeCompare(b.conductorNombre, 'es', { sensitivity: 'base' });
      if (cmpConductor !== 0) return cmpConductor;
      if (a.hora !== b.hora) return a.hora.localeCompare(b.hora);
      return (a.viaje.nroTransporte || '').localeCompare(b.viaje.nroTransporte || '');
    });

    // Agrupar haciendo corte por día
    const grupos: Array<{
      fechaISO: string;
      etiquetaDia: string;
      esHoy: boolean;
      esManana: boolean;
      items: typeof filtrados;
    }> = [];

    for (const item of filtrados) {
      let grupo = grupos[grupos.length - 1];
      if (!grupo || grupo.fechaISO !== item.fechaISO) {
        const infoDia = formatearEncabezadoDia(item.fechaISO, rangoSemana.hoyISO);
        grupo = {
          fechaISO: item.fechaISO,
          etiquetaDia: infoDia.etiquetaDia,
          esHoy: infoDia.esHoy,
          esManana: infoDia.esManana,
          items: [],
        };
        grupos.push(grupo);
      }
      grupo.items.push(item);
    }

    return grupos;
  }, [viajesSemana, alcanceSemana, filtroEstado, searchTerm, rangoSemana, ordenTabla]);

  const totalViajesMostrados = useMemo(
    () => viajesAgrupadosPorDia.reduce((acc, g) => acc + g.items.length, 0),
    [viajesAgrupadosPorDia]
  );

  // Ranking de operadores ordenado por mayor flete acumulado y total de kilometraje recorrido
  const { rankingOperadores, totalKmRanking } = useMemo(() => {
    const mapa = new Map<
      string,
      {
        idConductor: string;
        nombreCompleto: string;
        iniciales: string;
        fleteAcumulado: number;
        kmRecorrido: number;
        totalViajes: number;
        moneda: string;
      }
    >();

    for (const viaje of viajesSemana) {
      if (!viaje.conductor) continue;
      const estadoNorm = (viaje.estadoOrden || '').toLowerCase();
      if (estadoNorm.includes('cancel')) continue;

      const id = viaje.conductor.idConductor || obtenerNombreConductor(viaje);
      const nombre = obtenerNombreConductor(viaje);
      const flete =
        viaje.montoFleteCliente !== null &&
          viaje.montoFleteCliente !== undefined &&
          Number(viaje.montoFleteCliente) > 0
          ? Number(viaje.montoFleteCliente)
          : Number(viaje.ruta?.montoTarifa || 0);

      const tieneGps =
        viaje.gpsConectado === true ||
        (viaje.distanciaRecorridaKm !== undefined && viaje.distanciaRecorridaKm !== null);
      const km = tieneGps
        ? Math.max(0, Number(viaje.distanciaRecorridaKm ?? 0))
        : Math.max(0, Number(viaje.ruta?.distanciaKm || 0));

      const actual = mapa.get(id);
      if (actual) {
        actual.fleteAcumulado += flete;
        actual.kmRecorrido += km;
        actual.totalViajes += 1;
      } else {
        mapa.set(id, {
          idConductor: id,
          nombreCompleto: nombre,
          iniciales: obtenerIniciales(nombre),
          fleteAcumulado: flete,
          kmRecorrido: km,
          totalViajes: 1,
          moneda: viaje.moneda || 'USD',
        });
      }
    }

    const lista = Array.from(mapa.values()).sort((a, b) => {
      if (b.fleteAcumulado !== a.fleteAcumulado) return b.fleteAcumulado - a.fleteAcumulado;
      return b.kmRecorrido - a.kmRecorrido;
    });

    const totalKm = lista.reduce((acc, op) => acc + op.kmRecorrido, 0);

    return {
      rankingOperadores: lista,
      totalKmRanking: Math.round(totalKm),
    };
  }, [viajesSemana]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* 1. Header / Top Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs"></span>
            <span className="text-[11px] font-bold text-teal-800 tracking-wider uppercase">
              Telemetría y Control Activo
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Centro de Control Operativo
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Supervisión en tiempo real de unidades activas, operadores, telemetría y mantenimiento preventivo.
          </p>
        </div>

        {/* Right Controls & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Todas las Zonas */}
            <button className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 rounded-xl transition border border-slate-200/60 shadow-2xs">
              Todas las Zonas
            </button>
          </div>

          {/* Asignar Viaje Button */}
          <button
            type="button"
            onClick={() => setIsModalDespachoOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-orange-500/20 transition cursor-pointer"
          >
            <Truck className="w-4 h-4 stroke-[2.5]" />
            <span>Viaje Adicional</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Unidades Activas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                Unidades Activas
              </span>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-3xl font-black text-slate-900 tracking-tight">42</span>
                <span className="text-sm font-semibold text-slate-400">/ 48</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center">
              <Truck className="w-6 h-6 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>87.5% Disponibilidad</span>
              </div>
            </div>
            <span className="text-slate-400 text-[11px] font-medium">6 en base</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: '87.5%' }}></div>
          </div>
        </div>

        {/* Card 2: Operadores en Turno */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                Operadores en Turno
              </span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-3xl font-black text-slate-900 tracking-tight">38</span>
                <span className="text-xs font-bold text-teal-600">En cabina</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-100/70 text-sky-600 flex items-center justify-center">
              <Users className="w-6 h-6 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-sky-700 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
              <span>94% Puntualidad</span>
            </div>
            <span className="text-slate-400 text-[11px] font-medium">4 en relevo</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-sky-500 h-full rounded-full" style={{ width: '94%' }}></div>
          </div>
        </div>

        {/* Card 3: Kilometraje Hoy */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                Kilometraje Hoy
              </span>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-3xl font-black text-slate-900 tracking-tight">14,820</span>
                <span className="text-xs font-semibold text-slate-400">km</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center">
              <Gauge className="w-6 h-6 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2 py-0.5 rounded-full text-[10px] font-bold">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              +12.4% vs prom.
            </span>
            <span className="text-slate-400 text-[11px] font-medium">Odómetro global</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: '72%' }}></div>
          </div>
        </div>

        {/* Card 4: Alertas Críticas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                Alertas Críticas
              </span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-3xl font-black text-orange-600 tracking-tight">03</span>
                <span className="text-xs font-semibold text-slate-400">en taller</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-100/70 text-orange-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200/60 px-2 py-0.5 rounded-full text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              Atención Inmediata
            </span>
            <button className="text-slate-700 hover:text-orange-600 text-[11px] font-bold flex items-center gap-0.5 transition">
              <span>Revisar</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-orange-500 h-full rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>
      </div>

      {/* 3. Main Body Grid: Left (Table) + Right (3 Stacked Widgets) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: Listado de Viajes de la Semana (Spans 2 cols on xl) */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs p-5 lg:p-6 space-y-5">
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base lg:text-lg font-bold text-slate-900">
                  Programación de Viajes
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/60">
                  <Calendar className="w-3 h-3" />
                  Semana Lun–Dom: {rangoSemana.etiquetaSemana}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Viajes ordenados por fecha (corte diario) y conductor, con seguimiento de ruta para telemetría GPS
              </p>
            </div>

            {/* Alcance de semana (Desde hoy vs Semana completa Lun-Dom) */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center p-1 bg-slate-50 border border-slate-100 rounded-full gap-1">
                <button
                  type="button"
                  onClick={() => setAlcanceSemana('desde_hoy')}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition cursor-pointer ${alcanceSemana === 'desde_hoy'
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Desde Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setAlcanceSemana('toda_semana')}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition cursor-pointer ${alcanceSemana === 'toda_semana'
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Semana (Lun–Dom)
                </button>
              </div>
            </div>
          </div>

          {/* Search bar, Status Filter Pills & Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por guía, conductor, placa, cliente, origen o destino..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['todos', 'En Tránsito', 'Programado', 'Completado'] as const).map((estado) => (
                <button
                  key={estado}
                  type="button"
                  onClick={() => setFiltroEstado(estado)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-xl border transition cursor-pointer ${filtroEstado === estado
                      ? 'bg-sky-100/80 text-sky-800 border-sky-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  {estado === 'todos' ? 'Todos' : estado}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setOrdenTabla('conductor');
                  cargarViajesSemana();
                }}
                disabled={cargandoViajes}
                title="Actualizar viajes y restaurar orden original (fecha y conductor)"
                className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${cargandoViajes ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Trips Table */}
          {cargandoViajes ? (
            <div className="py-12 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-orange-500 animate-spin mx-auto" />
              <p className="text-xs font-medium text-slate-500">Cargando programación de viajes...</p>
            </div>
          ) : errorViajes ? (
            <div className="py-10 px-4 text-center rounded-xl bg-orange-50/60 border border-orange-200/70 space-y-2">
              <AlertTriangle className="w-6 h-6 text-orange-500 mx-auto" />
              <p className="text-xs font-semibold text-orange-800">{errorViajes}</p>
              <button
                type="button"
                onClick={cargarViajesSemana}
                className="px-3 py-1.5 text-xs font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          ) : viajesAgrupadosPorDia.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200 space-y-1.5">
              <Truck className="w-7 h-7 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">
                No hay viajes programados para el rango seleccionado
              </p>
              <p className="text-[11px] text-slate-400">
                {alcanceSemana === 'desde_hoy'
                  ? `Mostrando desde hoy (${rangoSemana.hoyISO}) hasta el domingo (${rangoSemana.domingoISO}).`
                  : `Mostrando semana completa (${rangoSemana.lunesISO} al ${rangoSemana.domingoISO}).`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 lg:-mx-6 px-5 lg:px-6">
              <table className="w-full text-left border-collapse min-w-[780px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="pb-3 pr-3">
                      <button
                        type="button"
                        onClick={alternarOrdenRuta}
                        title="Ordenar por ruta (plantas)"
                        className={`inline-flex items-center gap-1 uppercase tracking-wider transition cursor-pointer ${ordenTabla !== 'conductor'
                            ? 'text-orange-600'
                            : 'text-slate-400 hover:text-slate-700'
                          }`}
                      >
                        <span>Ruta / Viaje</span>
                        {ordenTabla === 'ruta_asc' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : ordenTabla === 'ruta_desc' ? (
                          <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-70" />
                        )}
                      </button>
                    </th>
                    <th className="pb-3 px-3">
                      <button
                        type="button"
                        onClick={() => setOrdenTabla('conductor')}
                        title="Ordenar por conductor"
                        className={`inline-flex items-center gap-1 uppercase tracking-wider transition cursor-pointer ${ordenTabla === 'conductor'
                            ? 'text-teal-700'
                            : 'text-slate-400 hover:text-slate-700'
                          }`}
                      >
                        <span>Conductor</span>
                        {ordenTabla === 'conductor' && <ArrowUp className="w-3 h-3" />}
                      </button>
                    </th>
                    <th className="pb-3 px-3">Unidad / Placa</th>
                    <th className="pb-3 px-3 min-w-[240px]">Ubicación del Vehículo (GPS)</th>
                    <th className="pb-3 pl-3 text-right">Estado</th>
                  </tr>
                </thead>

                {viajesAgrupadosPorDia.map((grupo) => {
                  const estaPlegado = Boolean(diasPlegados[grupo.fechaISO]);
                  return (
                    <tbody key={grupo.fechaISO} className="divide-y divide-slate-100 text-xs">
                      {/* Corte por Día (plegable / desplegable) */}
                      <tr className="bg-slate-50/90 hover:bg-slate-100/80 border-y border-slate-200/70 transition">
                        <td colSpan={5} className="p-0">
                          <button
                            type="button"
                            onClick={() => toggleDiaPlegado(grupo.fechaISO)}
                            aria-expanded={!estaPlegado}
                            className="w-full py-2 px-3 flex items-center justify-between text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              {estaPlegado ? (
                                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-teal-700 shrink-0" />
                              )}
                              <Calendar className="w-3.5 h-3.5 text-teal-700" />
                              <span className="font-bold text-slate-800 text-xs">
                                {grupo.etiquetaDia}
                              </span>
                              {grupo.esHoy && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200/70">
                                  Hoy
                                </span>
                              )}
                              {grupo.esManana && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 border border-sky-200/70">
                                  Mañana
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {grupo.items.length} {grupo.items.length === 1 ? 'viaje' : 'viajes'}
                            </span>
                          </button>
                        </td>
                      </tr>

                      {!estaPlegado && grupo.items.map(({ viaje, hora, conductorNombre }) => {
                        const placa =
                          viaje.vehiculoMotriz?.placa ||
                          viaje.conductor?.vehiculoHabitual?.placa ||
                          null;
                        const modelo =
                          viaje.vehiculoMotriz
                            ? `${viaje.vehiculoMotriz.marca || ''} ${viaje.vehiculoMotriz.modelo || ''}`.trim()
                            : viaje.conductor?.vehiculoHabitual
                              ? `${viaje.conductor.vehiculoHabitual.marca || ''} ${viaje.conductor.vehiculoHabitual.modelo || ''}`.trim()
                              : '';

                        const plantaOrigen =
                          viaje.puntoOrigen?.nombreSede ||
                          viaje.puntoOrigen?.ciudad ||
                          viaje.puntoOrigen?.codigoPuntoc ||
                          'Origen';
                        const plantaDestino =
                          viaje.puntoDestino?.nombreSede ||
                          viaje.puntoDestino?.ciudad ||
                          viaje.puntoDestino?.codigoPuntoc ||
                          'Destino';
                        const origenLabel =
                          viaje.puntoOrigen?.ciudad ||
                          viaje.puntoOrigen?.nombreSede ||
                          viaje.puntoOrigen?.codigoPuntoc ||
                          'Origen';
                        const destinoLabel =
                          viaje.puntoDestino?.ciudad ||
                          viaje.puntoDestino?.nombreSede ||
                          viaje.puntoDestino?.codigoPuntoc ||
                          'Destino';

                        const {
                          distanciaTotalKm,
                          distanciaRecorridaKm,
                          progresoPct,
                          tieneGps,
                          completado,
                        } = calcularProgresoUbicacion(viaje);

                        const estadoTexto = viaje.estadoOrden || 'Programado';
                        const estadoLower = estadoTexto.toLowerCase();
                        const badgeEstadoClass =
                          estadoLower.includes('tránsito') || estadoLower.includes('transito')
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                            : completado
                              ? 'bg-teal-50 text-teal-700 border-teal-200/60'
                              : estadoLower.includes('cancel')
                                ? 'bg-red-50 text-red-700 border-red-200/60'
                                : 'bg-sky-50 text-sky-700 border-sky-200/60';

                        return (
                          <tr key={viaje.idOrden} className="hover:bg-slate-50/70 transition group">
                            {/* Ruta (Plantas) / Viaje */}
                            <td className="py-3.5 pr-3 align-middle">
                              <div className="space-y-1 max-w-[230px]">
                                <p
                                  className="font-bold text-slate-900 text-xs leading-snug line-clamp-2"
                                  title={`${plantaOrigen} → ${plantaDestino}`}
                                >
                                  {plantaOrigen}{' '}
                                  <span className="text-orange-500 font-extrabold">→</span>{' '}
                                  {plantaDestino}
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-semibold text-slate-600">
                                    #{viaje.nroTransporte || viaje.idOrden.slice(0, 8)}
                                  </span>
                                  {hora && (
                                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {hora}
                                    </span>
                                  )}
                                  {(viaje.cliente?.nombreComercial || viaje.cliente?.razonSocial) && (
                                    <span
                                      className="text-[10px] text-slate-400 truncate max-w-[110px]"
                                      title={viaje.cliente?.nombreComercial || viaje.cliente?.razonSocial || ''}
                                    >
                                      • {viaje.cliente?.nombreComercial || viaje.cliente?.razonSocial}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Conductor */}
                            <td className="py-3.5 px-3 align-middle">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-7 h-7 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 border ${viaje.conductor
                                      ? 'bg-teal-50 text-teal-800 border-teal-200'
                                      : 'bg-slate-100 text-slate-400 border-slate-200'
                                    }`}
                                >
                                  {obtenerIniciales(conductorNombre)}
                                </div>
                                <div className="min-w-0">
                                  <span
                                    className={`block text-xs truncate max-w-[150px] ${viaje.conductor
                                        ? 'font-semibold text-slate-800'
                                        : 'italic text-slate-400'
                                      }`}
                                    title={conductorNombre}
                                  >
                                    {conductorNombre}
                                  </span>
                                  {viaje.conductor?.telefono && (
                                    <span className="text-[10px] text-slate-400 block">
                                      {viaje.conductor.telefono}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Unidad / Placa */}
                            <td className="py-3.5 px-3 align-middle">
                              {placa ? (
                                <div>
                                  <span className="font-bold text-slate-800 text-xs block">
                                    {placa}
                                  </span>
                                  <span className="text-[11px] text-slate-400 block truncate max-w-[130px]" title={modelo}>
                                    {modelo || 'Vehículo asignado'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Sin unidad</span>
                              )}
                            </td>

                            {/* Ubicación del Vehículo (Línea Origen -> Destino con Camión GPS) */}
                            <td className="py-3.5 px-3 align-middle">
                              <div className="w-full min-w-[220px] max-w-[280px] space-y-1.5">
                                {/* Etiquetas Origen y Destino */}
                                <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-600">
                                  <span className="inline-flex items-center gap-1 truncate max-w-[110px]" title={`Origen: ${viaje.puntoOrigen?.nombreSede || origenLabel}`}>
                                    <MapPin className="w-3 h-3 text-teal-700 shrink-0" />
                                    <span className="truncate">{origenLabel}</span>
                                  </span>
                                  <span className="inline-flex items-center gap-1 truncate max-w-[110px] text-right" title={`Destino: ${viaje.puntoDestino?.nombreSede || destinoLabel}`}>
                                    <span className="truncate">{destinoLabel}</span>
                                    <Navigation className="w-3 h-3 text-orange-500 shrink-0" />
                                  </span>
                                </div>

                                {/* Línea de ruta con punto origen, punto destino e icono del camión */}
                                <div className="relative h-5 flex items-center px-1.5">
                                  {/* Pista base */}
                                  <div className="relative w-full h-1.5 bg-slate-200 rounded-full">
                                    {/* Barra de progreso recorrido */}
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${completado
                                          ? 'bg-emerald-500'
                                          : tieneGps
                                            ? 'bg-teal-600'
                                            : 'bg-slate-300'
                                        }`}
                                      style={{ width: `${progresoPct}%` }}
                                    />

                                    {/* Punto Origen */}
                                    <span
                                      title={`Origen: ${origenLabel}`}
                                      className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-teal-700 border-2 border-white shadow-xs z-10"
                                    />

                                    {/* Punto Destino */}
                                    <span
                                      title={`Destino: ${destinoLabel}`}
                                      className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-white shadow-xs z-10"
                                    />

                                    {/* Icono del Camión sobre la línea */}
                                    <div
                                      title={
                                        distanciaTotalKm > 0
                                          ? `${distanciaRecorridaKm} km de ${distanciaTotalKm} km (${progresoPct}%)`
                                          : 'En espera de datos GPS'
                                      }
                                      className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full flex items-center justify-center border shadow-sm transition-all duration-500 ${completado
                                          ? 'bg-emerald-600 border-white text-white'
                                          : tieneGps
                                            ? 'bg-white border-teal-600 text-teal-700'
                                            : 'bg-white border-slate-300 text-slate-500'
                                        }`}
                                      style={{ left: `${progresoPct}%` }}
                                    >
                                      <Truck className="w-3.5 h-3.5" />
                                    </div>
                                  </div>
                                </div>

                                {/* Lectura de distancia recorrida / total */}
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="font-bold text-slate-700">
                                    {distanciaTotalKm > 0
                                      ? `${distanciaRecorridaKm.toLocaleString('es-VE')} / ${distanciaTotalKm.toLocaleString('es-VE')} km`
                                      : 'Distancia N/D'}
                                  </span>
                                  <span className={`font-semibold ${tieneGps || completado ? 'text-teal-700' : 'text-slate-400'}`}>
                                    {tieneGps
                                      ? `${progresoPct}% recorrido`
                                      : completado
                                        ? '100% completado'
                                        : 'GPS por conectar'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Estado */}
                            <td className="py-3.5 pl-3 text-right align-middle">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badgeEstadoClass}`}
                              >
                                {estadoTexto}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  );
                })}
              </table>
            </div>
          )}

          {/* Footer resumen */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              Mostrando <strong className="text-slate-700">{totalViajesMostrados}</strong>{' '}
              {totalViajesMostrados === 1 ? 'viaje' : 'viajes'} en{' '}
              <strong className="text-slate-700">{viajesAgrupadosPorDia.length}</strong>{' '}
              {viajesAgrupadosPorDia.length === 1 ? 'día' : 'días'}
            </span>
            <span>
              Rango activo:{' '}
              <strong className="text-slate-600">
                {alcanceSemana === 'desde_hoy' ? rangoSemana.hoyISO : rangoSemana.lunesISO}
              </strong>{' '}
              al <strong className="text-slate-600">{rangoSemana.domingoISO}</strong>
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: 3 Stacked Cards (Reordered) */}
        <div className="space-y-6">
          {/* Posición 1: Operadores Destacados (Ordenados por Flete Acumulado) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Operadores Destacados
                </h3>
              </div>
              <span className="bg-slate-100 text-slate-600 font-semibold text-[10px] px-2 py-0.5 rounded-md">
                Semana Actual
              </span>
            </div>

            {/* Resumen Total de Kilometraje Recorrido */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-teal-50/70 border border-teal-200/50 text-xs">
              <span className="font-semibold text-teal-900 text-[11px]">
                Total Kilometraje Recorrido
              </span>
              <span className="font-black text-teal-800 text-xs">
                {totalKmRanking.toLocaleString('es-VE')} km
              </span>
            </div>

            {cargandoViajes ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Calculando ranking de flete...
              </div>
            ) : rankingOperadores.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Sin viajes asignados a operadores esta semana.
              </div>
            ) : (
              <div className="space-y-2.5">
                {(verTodosOperadores ? rankingOperadores : rankingOperadores.slice(0, 3)).map((op, idx) => {
                  const pos = idx + 1;
                  const badgePosClass =
                    pos === 1
                      ? 'bg-emerald-600'
                      : pos === 2
                        ? 'bg-teal-600'
                        : pos === 3
                          ? 'bg-blue-600'
                          : 'bg-slate-500';
                  const simboloMoneda = op.moneda === 'Bs' ? 'Bs ' : '$';

                  return (
                    <div
                      key={op.idConductor}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200/60">
                            {op.iniciales}
                          </div>
                          <span
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${badgePosClass} text-white font-bold text-[9px] flex items-center justify-center border border-white`}
                          >
                            {pos}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs truncate max-w-[150px]" title={op.nombreCompleto}>
                            {op.nombreCompleto}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {op.totalViajes} {op.totalViajes === 1 ? 'viaje' : 'viajes'} •{' '}
                            <span className="font-semibold text-slate-600">
                              {Math.round(op.kmRecorrido).toLocaleString('es-VE')} km
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <span className="text-sm font-black text-teal-800 leading-none block">
                          {simboloMoneda}
                          {op.fleteAcumulado.toLocaleString('es-VE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 tracking-wider">
                          FLETE ACUM.
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {rankingOperadores.length > 3 && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setVerTodosOperadores((prev) => !prev)}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 transition cursor-pointer"
                >
                  <span>
                    {verTodosOperadores
                      ? 'Mostrar Top 3 Operadores'
                      : `Ver Ranking Completo (${rankingOperadores.length})`}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${verTodosOperadores ? 'rotate-90' : ''}`} />
                </button>
              </div>
            )}
          </div>

          {/* Posición 2: Mantenimiento Crítico */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Mantenimiento Crítico
                </h3>
              </div>
              <span className="bg-orange-50 text-orange-600 border border-orange-200/60 font-bold text-[10px] px-2 py-0.5 rounded-full">
                3 Prioritarios
              </span>
            </div>

            <div className="space-y-3">
              {/* Item 1 */}
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    #TR-104 <span className="font-normal text-slate-700">Cambio de Aceite & Filtros</span>
                  </span>
                  <span className="bg-orange-100/70 text-orange-700 font-bold text-[10px] px-1.5 py-0.5 rounded">
                    en 250 km
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Tracto Volvo FH 540</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    #TR-088 <span className="font-normal text-slate-700">Desgaste Balatas y Frenos</span>
                  </span>
                  <span className="bg-emerald-100/80 text-emerald-800 font-bold text-[10px] px-1.5 py-0.5 rounded">
                    Programado
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Inspección de 2do eje</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-700 h-full rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    #TR-201 <span className="font-normal text-slate-700">Calibración Sensores Inyección</span>
                  </span>
                  <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-1.5 py-0.5 rounded">
                    Alerta Amarilla
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Código ECU P0087</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-800 h-full rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>

            <button className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20 transition">
              <Calendar className="w-4 h-4" />
              <span>Programar Ingreso a Taller</span>
            </button>
          </div>

          {/* Posición 3: Kilometraje Semanal */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Kilometraje Semanal
                </h3>
                <p className="text-[11px] text-slate-400">
                  Rendimiento acumulado de flota
                </p>
              </div>
              <div className="flex items-center gap-1 font-bold text-xs text-slate-800">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span>88,410 km</span>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="pt-4 pb-2">
              <div className="flex items-end justify-between h-32 gap-2 px-1">
                {/* Lunes */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full bg-indigo-100/70 hover:bg-indigo-200 rounded-t-lg transition h-[52%]"></div>
                  <span className="text-[10px] font-bold text-slate-400">L</span>
                </div>
                {/* Martes */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full bg-indigo-100/70 hover:bg-indigo-200 rounded-t-lg transition h-[68%]"></div>
                  <span className="text-[10px] font-bold text-slate-400">M</span>
                </div>
                {/* Miércoles */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full bg-teal-700 hover:bg-teal-800 rounded-t-lg transition h-[76%]"></div>
                  <span className="text-[10px] font-bold text-slate-700">M</span>
                </div>
                {/* Jueves */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full bg-indigo-100/70 hover:bg-indigo-200 rounded-t-lg transition h-[84%]"></div>
                  <span className="text-[10px] font-bold text-slate-400">J</span>
                </div>
                {/* Viernes (Peak Max) */}
                <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end relative">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mb-0.5"></span>
                  <div className="w-full bg-orange-500 hover:bg-orange-600 rounded-t-lg transition h-[90%] shadow-xs"></div>
                  <span className="text-[10px] font-bold text-orange-600">V</span>
                </div>
                {/* Sábado */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full bg-indigo-100/70 hover:bg-indigo-200 rounded-t-lg transition h-[58%]"></div>
                  <span className="text-[10px] font-bold text-slate-400">S</span>
                </div>
                {/* Domingo */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full bg-indigo-100/70 hover:bg-indigo-200 rounded-t-lg transition h-[36%]"></div>
                  <span className="text-[10px] font-bold text-slate-400">D</span>
                </div>
              </div>
            </div>

            {/* Chart Legend */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-500"></span>
                <span className="font-medium text-slate-600">Máx: Viernes (16,400 km)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-700"></span>
                <span className="font-medium text-slate-600">Media Operativa</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notificación */}
      {toastMensaje && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMensaje}</span>
        </div>
      )}

      {/* Modal Registrar Despacho / Asignar Viaje */}
      <RegistrarDespachoModal
        isOpen={isModalDespachoOpen}
        onClose={() => setIsModalDespachoOpen(false)}
        onSuccess={(viaje) => {
          setToastMensaje(`Despacho ${viaje.nroTransporte} registrado con éxito.`);
          setTimeout(() => setToastMensaje(null), 4000);
          cargarViajesSemana();
        }}
      />
    </div>
  );
}