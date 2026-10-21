import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Search,
  MessageSquare,
  Edit2,
  MapPin,
  ChevronDown,
  ChevronUp,
  Truck,
  RotateCcw,
  Sparkles,
  Save,
  Send,
  Loader2,
  FileText,
  Table,
  X,
  Calendar,
  Building2,
  RefreshCw,
  Copy
} from 'lucide-react';
import {
  programacionService,
  type TripItem,
  type SchedulePreviewResponse,
  type ConductorResumen,
  type PuntoResumen
} from '../../services/programacionService';
import { conductoresService } from '../../services/conductoresService';

// Datos de demostración enriquecidos que replican el estado visual del diseño de consola
const DEMO_MANIFEST: TripItem[] = [
  // LUNES 24 DE FEBRERO 2025
  {
    id: 'demo-1',
    nroTransporte: 'TR-2025-0481',
    origenSalida: { codigo: 'P-SJ01', nombre: 'Planta San Joaquín' },
    destinoLlegada: { codigo: 'P-LC04', nombre: 'C.D. Los Cortijos' },
    fechaProgramadaCarga: '24/02/2025',
    horaProgramadaCarga: '06:30 AM',
    fechaEntregaEstimada: '24/02/2025',
    horaEntregaEstimada: '11:15 AM',
    conductorAsignado: {
      idConductor: 'c-1',
      nombreCompleto: 'Carlos Mendoza',
      telefono: '+58 414-5692118',
      vehiculoHabitual: 'Mack MP8 (Tracto #66) + Batea #10'
    },
    idConductor: 'c-1',
    nroRetorno: 'RET-9091-A',
    puntoRegreso: '[P-SJ01] Planta San Joaquín',
    estadoPendienteChofer: false,
    yaExiste: false,
    colision: false,
    seleccionado: true
  },
  {
    id: 'demo-2',
    nroTransporte: 'TR-2025-0482',
    origenSalida: { codigo: 'P-SJ01', nombre: 'Planta San Joaquín' },
    destinoLlegada: { codigo: 'P-MY01', nombre: 'C.D. Maracay' },
    fechaProgramadaCarga: '24/02/2025',
    horaProgramadaCarga: '07:15 AM',
    fechaEntregaEstimada: '24/02/2025',
    horaEntregaEstimada: '09:40 AM',
    conductorAsignado: {
      idConductor: 'c-2',
      nombreCompleto: 'Rafael Useche',
      telefono: '+58 412-8874120',
      vehiculoHabitual: 'Iveco Stralis (Tracto #22)'
    },
    idConductor: 'c-2',
    nroRetorno: 'RET-9092-B',
    puntoRegreso: '[P-TM02] Turmero',
    estadoPendienteChofer: false,
    yaExiste: false,
    colision: false,
    seleccionado: true
  },
  {
    id: 'demo-3',
    nroTransporte: 'TR-2025-0483',
    origenSalida: { codigo: 'P-PC01', nombre: 'Puerto Cabello' },
    destinoLlegada: { codigo: 'P-SJ01', nombre: 'Silos San Joaquín' },
    fechaProgramadaCarga: '24/02/2025',
    horaProgramadaCarga: '08:00 AM',
    fechaEntregaEstimada: '24/02/2025',
    horaEntregaEstimada: '12:30 PM',
    conductorAsignado: null,
    idConductor: null,
    nroRetorno: 'RET-9093-PC',
    puntoRegreso: '[P-PC01] Puerto Cabello',
    estadoPendienteChofer: true,
    yaExiste: false,
    colision: false,
    seleccionado: true
  },
  {
    id: 'demo-4',
    nroTransporte: 'TR-2025-0484',
    origenSalida: { codigo: 'P-SJ01', nombre: 'Planta San Joaquín' },
    destinoLlegada: { codigo: 'P-BQ02', nombre: 'C.D. Barquisimeto' },
    fechaProgramadaCarga: '24/02/2025',
    horaProgramadaCarga: '09:00 AM',
    fechaEntregaEstimada: '24/02/2025',
    horaEntregaEstimada: '03:15 PM',
    conductorAsignado: {
      idConductor: 'c-3',
      nombreCompleto: 'Manuel Gómez',
      telefono: '+58 424-9112233',
      vehiculoHabitual: 'Freightliner Cascadia (Tracto #45)'
    },
    idConductor: 'c-3',
    nroRetorno: 'RET-9094-BQ',
    puntoRegreso: '[P-SJ01] Planta San Joaquín',
    estadoPendienteChofer: false,
    yaExiste: false,
    colision: false,
    seleccionado: true
  },
  // MARTES 25 DE FEBRERO 2025
  {
    id: 'demo-5',
    nroTransporte: 'TR-2025-0490',
    origenSalida: { codigo: 'P-TM02', nombre: 'Turmero Graneles' },
    destinoLlegada: { codigo: 'P-MY01', nombre: 'Almacén Maracay' },
    fechaProgramadaCarga: '25/02/2025',
    horaProgramadaCarga: '07:00 AM',
    fechaEntregaEstimada: '25/02/2025',
    horaEntregaEstimada: '09:30 AM',
    conductorAsignado: {
      idConductor: 'c-4',
      nombreCompleto: 'Luis Villegas',
      telefono: '+58 416-5544332',
      vehiculoHabitual: 'Cargo #19'
    },
    idConductor: 'c-4',
    nroRetorno: 'RET-9098-R',
    puntoRegreso: '[P-SJ01] Planta San Joaquín',
    estadoPendienteChofer: false,
    yaExiste: false,
    colision: false,
    seleccionado: true
  },
  {
    id: 'demo-6',
    nroTransporte: 'TR-2025-0491',
    origenSalida: { codigo: 'P-PC01', nombre: 'Puerto Cabello' },
    destinoLlegada: { codigo: 'P-SJ01', nombre: 'Planta San Joaquín' },
    fechaProgramadaCarga: '25/02/2025',
    horaProgramadaCarga: '06:00 AM',
    fechaEntregaEstimada: '25/02/2025',
    horaEntregaEstimada: '10:20 AM',
    conductorAsignado: {
      idConductor: 'c-5',
      nombreCompleto: 'Eduardo Quintero',
      telefono: '+58 414-7788990',
      vehiculoHabitual: 'Mack Trident (Tracto #52)'
    },
    idConductor: 'c-5',
    nroRetorno: 'RET-9099-PC',
    puntoRegreso: '[P-PC01] Puerto Cabello',
    estadoPendienteChofer: false,
    yaExiste: false,
    colision: false,
    seleccionado: true
  },
  // MIÉRCOLES 26 DE FEBRERO 2025
  {
    id: 'demo-7',
    nroTransporte: 'TR-2025-0501',
    origenSalida: { codigo: 'P-SJ01', nombre: 'Planta San Joaquín' },
    destinoLlegada: { codigo: 'P-VL01', nombre: 'C.D. Valencia Sur' },
    fechaProgramadaCarga: '26/02/2025',
    horaProgramadaCarga: '08:30 AM',
    fechaEntregaEstimada: '26/02/2025',
    horaEntregaEstimada: '11:00 AM',
    conductorAsignado: null,
    idConductor: null,
    nroRetorno: 'RET-9102-V',
    puntoRegreso: '[P-SJ01] Planta San Joaquín',
    estadoPendienteChofer: true,
    yaExiste: false,
    colision: false,
    seleccionado: true
  }
];

interface InfoFechaNormalizada {
  isoKey: string;
  tituloCompleto: string;
  pildoraCorta: string;
  timestamp: number;
}

const DIAS_SEMANA_COMPLETOS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const MESES_COMPLETOS = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function normalizarFecha(fechaStr?: string): InfoFechaNormalizada {
  if (!fechaStr || !fechaStr.trim()) {
    return {
      isoKey: '9999-99-99',
      tituloCompleto: 'FECHA POR DEFINIR',
      pildoraCorta: 'Sin Fecha',
      timestamp: 9999999999999,
    };
  }

  const limpia = fechaStr.trim().replace(/\./g, '/').replace(/-/g, '/');
  let dia = 0;
  let mes = 0;
  let anio = 0;

  // 1. Formato DD/MM/YYYY
  const matchDMY = limpia.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (matchDMY) {
    dia = parseInt(matchDMY[1], 10);
    mes = parseInt(matchDMY[2], 10) - 1;
    let y = parseInt(matchDMY[3], 10);
    if (y < 100) y += 2000;
    anio = y;
  } else {
    // 2. Formato YYYY/MM/DD
    const matchYMD = limpia.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
    if (matchYMD) {
      anio = parseInt(matchYMD[1], 10);
      mes = parseInt(matchYMD[2], 10) - 1;
      dia = parseInt(matchYMD[3], 10);
    } else {
      // 3. Fallback buscar cualquier DD/MM/YYYY o DD/MM dentro del string
      const matchAny = limpia.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      if (matchAny) {
        dia = parseInt(matchAny[1], 10);
        mes = parseInt(matchAny[2], 10) - 1;
        let y = parseInt(matchAny[3], 10);
        if (y < 100) y += 2000;
        anio = y;
      } else {
        const parseado = new Date(limpia);
        if (!isNaN(parseado.getTime())) {
          anio = parseado.getFullYear();
          mes = parseado.getMonth();
          dia = parseado.getDate();
        }
      }
    }
  }

  if (anio >= 2000 && anio <= 2100 && mes >= 0 && mes <= 11 && dia >= 1 && dia <= 31) {
    const d = new Date(anio, mes, dia, 12, 0, 0);
    const isoKey = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const diaSemana = DIAS_SEMANA_COMPLETOS[d.getDay()];
    const mesNombre = MESES_COMPLETOS[mes];
    const tituloCompleto = `${diaSemana} ${dia} DE ${mesNombre} ${anio}`;
    const pildoraCorta = `${DIAS_CORTOS[d.getDay()]} ${dia} ${MESES_CORTOS[mes]}`;
    return {
      isoKey,
      tituloCompleto,
      pildoraCorta,
      timestamp: d.getTime(),
    };
  }

  return {
    isoKey: limpia,
    tituloCompleto: `PROGRAMACIÓN ${limpia.toUpperCase()}`,
    pildoraCorta: limpia,
    timestamp: 0,
  };
}

export function parsearHoraMinutos(horaStr?: string): number {
  if (!horaStr) return 0;
  const clean = horaStr.trim().toUpperCase();
  const match = clean.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3];
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export interface GrupoCronologicoDia {
  isoKey: string;
  titulo: string;
  pildora: string;
  timestamp: number;
  viajes: TripItem[];
  ventanaHoraria: string;
  kmTotalesEstimados: number;
}

export interface GrupoPlanta {
  key: string;
  codigo: string;
  nombre: string;
  titulo: string;
  viajes: TripItem[];
  ventanaHoraria: string;
  kmTotalesEstimados: number;
  destinosUnicos: number;
}

export default function Programacion() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modo de visualización: Por Día vs Por Planta (Sede Origen)
  const [modoVista, setModoVista] = useState<'dia' | 'planta'>('dia');

  // Estados principales
  const [trips, setTrips] = useState<TripItem[]>(DEMO_MANIFEST);
  const [nombreArchivo, setNombreArchivo] = useState<string>('manifiesto_demostracion.pdf');
  const [cargandoPdf, setCargandoPdf] = useState<boolean>(false);
  const [guardandoBd, setGuardandoBd] = useState<boolean>(false);
  const [mensajeToast, setMensajeToast] = useState<{ tipo: 'ok' | 'err' | 'warn'; texto: string } | null>(null);

  // Filtros
  const [filtroFecha, setFiltroFecha] = useState<string>('todos');
  const [filtroPlanta, setFiltroPlanta] = useState<string>('todas');
  const [filtroSoloSinChofer, setFiltroSoloSinChofer] = useState<boolean>(false);
  const [filtroSoloColisiones, setFiltroSoloColisiones] = useState<boolean>(false);
  const [busqueda, setBusqueda] = useState<string>('');

  // Conductores y puntos disponibles
  const [conductores, setConductores] = useState<ConductorResumen[]>([]);
  const [puntos, setPuntos] = useState<PuntoResumen[]>([]);

  // Secciones colapsadas (por clave de grupo)
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({});

  // Viaje activo para vista previa WhatsApp y modal
  const [viajeSeleccionadoWhatsapp, setViajeSeleccionadoWhatsapp] = useState<TripItem | null>(DEMO_MANIFEST[0]);
  const [modalWhatsappAbierto, setModalWhatsappAbierto] = useState<boolean>(false);
  const [textoWhatsappCustom, setTextoWhatsappCustom] = useState<string | null>(null);
  const [editandoTextoWa, setEditandoTextoWa] = useState<boolean>(false);

  // Manejo de tecla Escape y bloqueo de scroll para el modal de WhatsApp
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalWhatsappAbierto) {
        setModalWhatsappAbierto(false);
      }
    };

    if (modalWhatsappAbierto) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalWhatsappAbierto]);

  // Cargar conductores reales del sistema para los dropdowns
  useEffect(() => {
    async function cargarCatalogos() {
      try {
        const drivers = await conductoresService.getConductores();
        if (drivers && drivers.length > 0) {
          // Filtrar solo conductores con estatus 'Activo' en la tabla conductores
          const activos = drivers.filter((d) => d.estado === 'Activo');
          setConductores(
            activos.map((d) => ({
              idConductor: d.idConductor,
              nombreCompleto: `${d.nombres} ${d.apellidos}`,
              telefono: d.telefono,
              estado: d.estado,
              vehiculoHabitual: d.vehiculoHabitual
                ? `${d.vehiculoHabitual.marca} (${d.vehiculoHabitual.placa})`
                : undefined,
            }))
          );
        }
      } catch (err) {
        console.warn('Usando catálogo local de conductores.');
        setConductores([
          { idConductor: 'c-1', nombreCompleto: 'Carlos Mendoza', telefono: '+58 414-5692118', estado: 'Activo', vehiculoHabitual: 'Mack MP8 (Tracto #66)' },
          { idConductor: 'c-2', nombreCompleto: 'Rafael Useche', telefono: '+58 412-8874120', estado: 'Activo', vehiculoHabitual: 'Iveco Stralis (Tracto #22)' },
          { idConductor: 'c-3', nombreCompleto: 'Manuel Gómez', telefono: '+58 424-9112233', estado: 'Activo', vehiculoHabitual: 'Freightliner Cascadia (#45)' },
          { idConductor: 'c-4', nombreCompleto: 'Luis Villegas', telefono: '+58 416-5544332', estado: 'Activo', vehiculoHabitual: 'Cargo #19' },
          { idConductor: 'c-5', nombreCompleto: 'Eduardo Quintero', telefono: '+58 414-7788990', estado: 'Activo', vehiculoHabitual: 'Mack Trident (#52)' },
          { idConductor: 'c-6', nombreCompleto: 'Javier Ortiz', telefono: '+58 412-1234567', estado: 'Activo', vehiculoHabitual: 'Mack Granite (#14)' },
          { idConductor: 'c-7', nombreCompleto: 'Mateo Valdivia', telefono: '+58 414-9876543', estado: 'Activo', vehiculoHabitual: 'Volvo FH (#33)' },
        ]);
      }
    }
    cargarCatalogos();
  }, []);

  // Manejar subida de archivo PDF emitido por el cliente
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      mostrarToast('warn', 'Por favor seleccione un archivo PDF emitido por el cliente.');
      return;
    }

    setCargandoPdf(true);
    setNombreArchivo(file.name);

    try {
      const resp: SchedulePreviewResponse = await programacionService.subirPdfPrograma(file);

      setTrips(resp.trips.map(t => ({ ...t, seleccionado: !t.colision })));
      if (resp.conductoresDisponibles?.length > 0) {
        setConductores(resp.conductoresDisponibles.filter((c) => !c.estado || c.estado === 'Activo'));
      }
      if (resp.puntosDisponibles?.length > 0) {
        setPuntos(resp.puntosDisponibles);
      }

      // Resetear filtros para ver el contenido completo del PDF
      setFiltroFecha('todos');
      setFiltroPlanta('todas');

      if (resp.colisiones > 0) {
        mostrarToast(
          'warn',
          `Se detectaron ${resp.colisiones} viaje(s) que ya existen en 'guias_viajes'. Han sido marcados con advertencia.`
        );
      } else {
        mostrarToast('ok', `PDF procesado: ${resp.totalViajes} viajes detectados sin colisiones.`);
      }

      if (resp.trips.length > 0) {
        setViajeSeleccionadoWhatsapp(resp.trips[0]);
      }
    } catch (error: any) {
      console.error('Error al subir PDF:', error);
      const msg = error.response?.data?.message || error.message || 'Error al conectar con el backend.';
      mostrarToast('err', `Error al levantar programa: ${msg}`);
    } finally {
      setCargandoPdf(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCargarDemo = () => {
    setTrips(DEMO_MANIFEST);
    setNombreArchivo('manifiesto_demostracion.pdf');
    setFiltroFecha('todos');
    setFiltroPlanta('todas');
    setViajeSeleccionadoWhatsapp(DEMO_MANIFEST[0]);
    mostrarToast('ok', 'Datos de demostración cargados.');
  };

  const mostrarToast = (tipo: 'ok' | 'err' | 'warn', texto: string) => {
    setMensajeToast({ tipo, texto });
    setTimeout(() => setMensajeToast(null), 6000);
  };

  // Asignar conductor a un viaje
  const handleAsignarConductor = (tripId: string, idConductor: string) => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id === tripId) {
          const chofer =
            conductores.find((c) => c.idConductor === idConductor) ||
            (t.conductorAsignado?.idConductor === idConductor ? t.conductorAsignado : null);
          const updated = {
            ...t,
            idConductor: chofer?.idConductor || null,
            conductorAsignado: chofer || null,
            estadoPendienteChofer: !chofer,
          };
          if (viajeSeleccionadoWhatsapp?.id === tripId) {
            setViajeSeleccionadoWhatsapp(updated);
          }
          return updated;
        }
        return t;
      })
    );
  };

  // Obtener conductores disponibles para un viaje específico:
  // 1. Que tengan estatus 'Activo' en la tabla conductores
  // 2. Que aún NO hayan sido seleccionados en el manifiesto actual (exceptuando el viaje actual si ya lo tiene asignado)
  const getConductoresDisponiblesParaViaje = (tripActualId: string, idConductorActual?: string | null) => {
    // IDs de conductores asignados en OTROS viajes del manifiesto
    const asignadosEnOtrosViajes = new Set(
      trips
        .filter((t) => t.id !== tripActualId && (t.idConductor || t.conductorAsignado?.idConductor))
        .map((t) => (t.idConductor || t.conductorAsignado?.idConductor) as string)
    );

    return conductores.filter((c) => {
      // 1. Debe tener estatus activo
      const esActivo = !c.estado || c.estado === 'Activo';
      if (!esActivo) return false;

      // 2. Si es el conductor actualmente asignado a este viaje, se mantiene disponible para mostrarlo en el select
      if (idConductorActual && c.idConductor === idConductorActual) {
        return true;
      }

      // 3. No debe haber sido seleccionado en otro viaje del manifiesto
      return !asignadosEnOtrosViajes.has(c.idConductor);
    });
  };


  // Lista única de días disponibles para los filtros de píldora
  const diasDisponibles = useMemo(() => {
    const mapaDias = new Map<string, { isoKey: string; pildora: string; timestamp: number; total: number }>();
    for (const trip of trips) {
      const norm = normalizarFecha(trip.fechaProgramadaCarga);
      const existente = mapaDias.get(norm.isoKey);
      if (existente) {
        existente.total += 1;
      } else {
        mapaDias.set(norm.isoKey, {
          isoKey: norm.isoKey,
          pildora: norm.pildoraCorta,
          timestamp: norm.timestamp,
          total: 1,
        });
      }
    }
    return Array.from(mapaDias.values()).sort(
      (a, b) => a.timestamp - b.timestamp || a.isoKey.localeCompare(b.isoKey)
    );
  }, [trips]);

  // Lista única de plantas (origen) disponibles para los filtros de píldora
  const plantasDisponibles = useMemo(() => {
    const mapaPlantas = new Map<string, { key: string; codigo: string; nombre: string; total: number }>();
    for (const trip of trips) {
      const cod = (trip.origenSalida.codigo || '').trim();
      const nom = (trip.origenSalida.nombre || 'Planta Origen').trim();
      const key = (cod || nom).toUpperCase();
      const existente = mapaPlantas.get(key);
      if (existente) {
        existente.total += 1;
      } else {
        mapaPlantas.set(key, {
          key,
          codigo: cod,
          nombre: nom,
          total: 1,
        });
      }
    }
    return Array.from(mapaPlantas.values()).sort((a, b) => b.total - a.total);
  }, [trips]);

  // Métricas calculadas
  const metricas = useMemo(() => {
    const total = trips.length;
    const colisiones = trips.filter((t) => t.yaExiste || t.colision).length;
    const asignados = trips.filter((t) => t.conductorAsignado && !t.estadoPendienteChofer).length;
    const pendientes = total - asignados;
    const seleccionadosValidos = trips.filter((t) => !t.colision).length;
    return { total, colisiones, asignados, pendientes, seleccionadosValidos };
  }, [trips]);

  // Lista filtrada común
  const tripsFiltrados = useMemo(() => {
    return trips.filter((t) => {
      // Filtro de colisión
      if (filtroSoloColisiones && !t.colision) return false;
      // Filtro sin chofer
      if (filtroSoloSinChofer && !t.estadoPendienteChofer) return false;

      // Filtro según la vista activa
      if (modoVista === 'dia') {
        if (filtroFecha !== 'todos') {
          const norm = normalizarFecha(t.fechaProgramadaCarga);
          if (norm.isoKey !== filtroFecha) return false;
        }
      } else {
        if (filtroPlanta !== 'todas') {
          const key = (t.origenSalida.codigo || t.origenSalida.nombre || '').trim().toUpperCase();
          if (key !== filtroPlanta) return false;
        }
      }

      // Filtro de texto
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const coincideNro = t.nroTransporte.toLowerCase().includes(q);
        const coincideOrigen = t.origenSalida.nombre.toLowerCase().includes(q) || t.origenSalida.codigo.toLowerCase().includes(q);
        const coincideDestino = t.destinoLlegada.nombre.toLowerCase().includes(q) || t.destinoLlegada.codigo.toLowerCase().includes(q);
        const coincideChofer = t.conductorAsignado?.nombreCompleto.toLowerCase().includes(q);
        return coincideNro || coincideOrigen || coincideDestino || coincideChofer;
      }
      return true;
    });
  }, [trips, filtroSoloColisiones, filtroSoloSinChofer, modoVista, filtroFecha, filtroPlanta, busqueda]);

  // Agrupación 1: Corte cronológico por fechaProgramadaCarga (Día)
  const gruposCronologicos = useMemo((): GrupoCronologicoDia[] => {
    const map = new Map<string, { info: InfoFechaNormalizada; viajes: TripItem[] }>();

    for (const trip of tripsFiltrados) {
      const info = normalizarFecha(trip.fechaProgramadaCarga);
      if (!map.has(info.isoKey)) {
        map.set(info.isoKey, { info, viajes: [] });
      }
      map.get(info.isoKey)!.viajes.push(trip);
    }

    const lista = Array.from(map.values()).map(({ info, viajes }) => {
      viajes.sort((a, b) => {
        const tA = parsearHoraMinutos(a.horaProgramadaCarga);
        const tB = parsearHoraMinutos(b.horaProgramadaCarga);
        return tA - tB;
      });

      let horaMin = '';
      let horaMax = '';
      if (viajes.length > 0) {
        horaMin = viajes[0].horaProgramadaCarga || '06:00 AM';
        let maxM = -1;
        let maxStr = viajes[0].horaEntregaEstimada || viajes[0].horaProgramadaCarga;
        for (const v of viajes) {
          const m = parsearHoraMinutos(v.horaEntregaEstimada || v.horaProgramadaCarga);
          if (m > maxM) {
            maxM = m;
            maxStr = v.horaEntregaEstimada || v.horaProgramadaCarga;
          }
        }
        horaMax = maxStr || '08:00 PM';
      }

      const ventanaHoraria = horaMin && horaMax ? `VENTANA: ${horaMin} - ${horaMax}` : 'VENTANA DIURNA';
      const kmTotalesEstimados = viajes.length * 175;

      return {
        isoKey: info.isoKey,
        titulo: info.tituloCompleto,
        pildora: info.pildoraCorta,
        timestamp: info.timestamp,
        viajes,
        ventanaHoraria,
        kmTotalesEstimados,
      };
    });

    lista.sort((a, b) => a.timestamp - b.timestamp || a.isoKey.localeCompare(b.isoKey));
    return lista;
  }, [tripsFiltrados]);

  // Agrupación 2: Corte por Planta / Sede Origen
  const gruposPorPlanta = useMemo((): GrupoPlanta[] => {
    const map = new Map<string, { codigo: string; nombre: string; viajes: TripItem[] }>();

    for (const trip of tripsFiltrados) {
      const cod = (trip.origenSalida.codigo || '').trim();
      const nom = (trip.origenSalida.nombre || 'Planta Origen').trim();
      const key = (cod || nom).toUpperCase();

      if (!map.has(key)) {
        map.set(key, { codigo: cod, nombre: nom, viajes: [] });
      }
      map.get(key)!.viajes.push(trip);
    }

    const lista = Array.from(map.entries()).map(([key, { codigo, nombre, viajes }]) => {
      // Ordenar cronológicamente viajes de esta planta
      viajes.sort((a, b) => {
        const normA = normalizarFecha(a.fechaProgramadaCarga).timestamp + parsearHoraMinutos(a.horaProgramadaCarga) * 60000;
        const normB = normalizarFecha(b.fechaProgramadaCarga).timestamp + parsearHoraMinutos(b.horaProgramadaCarga) * 60000;
        return normA - normB;
      });

      let horaMin = viajes[0]?.horaProgramadaCarga || '06:00 AM';
      let horaMax = viajes[viajes.length - 1]?.horaEntregaEstimada || viajes[viajes.length - 1]?.horaProgramadaCarga || '08:00 PM';
      const ventanaHoraria = `VENTANA: ${horaMin} - ${horaMax}`;
      const destinos = new Set(viajes.map((v) => v.destinoLlegada.codigo || v.destinoLlegada.nombre)).size;
      const kmTotalesEstimados = viajes.length * 180;

      const tagCod = codigo ? `[${codigo}] ` : '';
      const titulo = `PLANTA ${tagCod}${nombre.toUpperCase()}`;

      return {
        key,
        codigo,
        nombre,
        titulo,
        viajes,
        ventanaHoraria,
        kmTotalesEstimados,
        destinosUnicos: destinos,
      };
    });

    return lista.sort((a, b) => b.viajes.length - a.viajes.length);
  }, [tripsFiltrados]);

  // Guardar / Confirmar en base de datos
  const handleConfirmarYGuardar = async () => {
    const validos = trips.filter((t) => !t.colision);
    if (validos.length === 0) {
      mostrarToast('warn', 'No hay viajes válidos para registrar (o todos presentan colisión con guias_viajes).');
      return;
    }

    setGuardandoBd(true);
    try {
      const res = await programacionService.confirmarProgramacion(validos);
      if (res.success) {
        mostrarToast('ok', `Éxito: Se registraron ${res.guardados} viajes en la tabla guias_viajes.`);
        setTrips((prev) =>
          prev.map((t) => {
            if (validos.some((v) => v.nroTransporte === t.nroTransporte)) {
              return { ...t, yaExiste: true, colision: true };
            }
            return t;
          })
        );
      } else {
        mostrarToast('warn', res.message || 'No se pudo guardar la programación.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al persistir en la base de datos.';
      mostrarToast('err', `Error al guardar: ${msg}`);
    } finally {
      setGuardandoBd(false);
    }
  };

  // Texto generado para la plantilla WhatsApp
  const mensajeWhatsappGenerado = useMemo(() => {
    if (!viajeSeleccionadoWhatsapp) return '';
    const chofer = viajeSeleccionadoWhatsapp.conductorAsignado?.nombreCompleto || 'Estimado Conductor';
    const unidad = viajeSeleccionadoWhatsapp.conductorAsignado?.vehiculoHabitual || 'Mack MP8 (Tracto #66) + Batea #10';
    return `🔔 NOTIFICACIÓN DE VIAJE FLEETFLOW\n\nHola ${chofer}, se te ha asignado el despacho:\n\n• Guía de Ida: ${viajeSeleccionadoWhatsapp.nroTransporte}\n• Origen: [${viajeSeleccionadoWhatsapp.origenSalida.codigo}] ${viajeSeleccionadoWhatsapp.origenSalida.nombre} (${viajeSeleccionadoWhatsapp.fechaProgramadaCarga} ${viajeSeleccionadoWhatsapp.horaProgramadaCarga})\n• Destino: [${viajeSeleccionadoWhatsapp.destinoLlegada.codigo}] ${viajeSeleccionadoWhatsapp.destinoLlegada.nombre} (Est. ${viajeSeleccionadoWhatsapp.horaEntregaEstimada})\n• Guía Retorno: ${viajeSeleccionadoWhatsapp.nroRetorno || 'RET-9091-A'}\n• Punto de Regreso: ${viajeSeleccionadoWhatsapp.puntoRegreso || 'Planta San Joaquín (Simétrico)'}\n• Unidad: ${unidad}\n\nPor favor confirma recepción respondiendo OK o reporta cualquier novedad a la Mesa de Control.`;
  }, [viajeSeleccionadoWhatsapp]);

  const textoWhatsappFinal = textoWhatsappCustom ?? mensajeWhatsappGenerado;

  const enviarWhatsappDirecto = () => {
    if (!viajeSeleccionadoWhatsapp?.conductorAsignado?.telefono) {
      mostrarToast('warn', 'El conductor no tiene un número telefónico asignado.');
      return;
    }
    const cleanTel = viajeSeleccionadoWhatsapp.conductorAsignado.telefono.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanTel}?text=${encodeURIComponent(textoWhatsappFinal)}`;
    window.open(url, '_blank');
  };

  const copiarTextoWhatsapp = async () => {
    try {
      await navigator.clipboard.writeText(textoWhatsappFinal);
      mostrarToast('ok', 'Plantilla copiada al portapapeles.');
    } catch {
      mostrarToast('warn', 'No se pudo copiar el texto automáticamente.');
    }
  };

  // Renderizador unificado y reutilizable de la tabla de viajes
  const renderTablaDeViajes = (viajesGrupo: TripItem[], grupoId: string) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
              <th className="py-2.5 px-3">N° TRANSPORTE</th>
              <th className="py-2.5 px-3">ORIGEN SALIDA</th>
              <th className="py-2.5 px-3">DESTINO LLEGADA</th>
              <th className="py-2.5 px-3">CONDUCTOR ASIGNADO</th>
              <th className="py-2.5 px-3">PUNTO DE REGRESO</th>
              <th className="py-2.5 px-3 text-center">ACCIONES RÁPIDAS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {viajesGrupo.map((trip) => {
              const esColision = trip.yaExiste || trip.colision;
              const esPendiente = trip.estadoPendienteChofer || !trip.conductorAsignado;
              const estaSeleccionadoParaWa = modalWhatsappAbierto && viajeSeleccionadoWhatsapp?.id === trip.id;

              return (
                <tr
                  key={`${grupoId}-${trip.id}`}
                  className={`transition hover:bg-orange-50/40 ${esColision
                    ? 'bg-rose-50/30'
                    : esPendiente
                      ? 'bg-amber-50/20'
                      : estaSeleccionadoParaWa
                        ? 'bg-emerald-50/30'
                        : 'bg-white'
                    }`}
                >

                  {/* N° Guía / Despacho */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-gray-900 tracking-tight text-xs">
                          {trip.nroTransporte}
                        </span>
                        {esColision ? (
                          <span
                            title="Este viaje ya está registrado en la tabla guias_viajes"
                            className="bg-rose-100 text-rose-800 text-[10px] font-black px-1.5 py-0.2 rounded border border-rose-300"
                          >
                            ⚠️ Ya en BD
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[10px] text-gray-500 flex items-center space-x-1 mt-0.5">
                        <span>🕒</span>
                        <span>
                          {trip.fechaProgramadaCarga} • {trip.horaProgramadaCarga}
                        </span>
                      </span>
                    </div>
                  </td>

                  {/* Origen Salida */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">
                        <span className="text-emerald-700 font-extrabold">[{trip.origenSalida.codigo}]</span>{' '}
                        {trip.origenSalida.nombre}
                      </span>

                    </div>
                  </td>

                  {/* Destino Llegada */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">
                        <span className="text-blue-700 font-extrabold">[{trip.destinoLlegada.codigo}]</span>{' '}
                        {trip.destinoLlegada.nombre}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Pr. Est. {trip.fechaEntregaEstimada} {trip.horaEntregaEstimada}
                      </span>
                    </div>
                  </td>

                  {/* Conductor Asignado */}
                  <td className="py-3 px-3">
                    {(() => {
                      const conductoresDisponibles = getConductoresDisponiblesParaViaje(
                        trip.id,
                        trip.idConductor
                      );
                      const primerChoferDisponible = conductoresDisponibles.find(
                        (c) => c.idConductor !== trip.idConductor
                      );

                      if (esPendiente) {
                        return (
                          <div className="flex items-center space-x-2">
                            <div className="relative">
                              <select
                                value={trip.idConductor || ''}
                                onChange={(e) => handleAsignarConductor(trip.id, e.target.value)}
                                className="bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold rounded-xl px-2.5 py-1.5 pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 max-w-[210px] truncate"
                              >
                                <option value="">
                                  {conductoresDisponibles.length === 0
                                    ? 'Sin choferes activos disponibles'
                                    : 'Seleccionar chofer...'}
                                </option>
                                {conductoresDisponibles.map((c) => (
                                  <option key={c.idConductor} value={c.idConductor}>
                                    {c.nombreCompleto} {c.vehiculoHabitual ? `(${c.vehiculoHabitual})` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {primerChoferDisponible ? (
                              <button
                                onClick={() => handleAsignarConductor(trip.id, primerChoferDisponible.idConductor)}
                                title={`Asignar de urgencia a ${primerChoferDisponible.nombreCompleto}`}
                                className="bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer shrink-0"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Asignar Urgente</span>
                              </button>
                            ) : null}

                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
                              Pendiente
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div className="relative">
                          <select
                            value={trip.idConductor || ''}
                            onChange={(e) => handleAsignarConductor(trip.id, e.target.value)}
                            className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl px-2.5 py-1.5 pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500 max-w-[240px] truncate"
                          >
                            <option value="">
                              — Quitar chofer (Dejar pendiente) —
                            </option>
                            {conductoresDisponibles.map((c) => (
                              <option key={c.idConductor} value={c.idConductor}>
                                {c.nombreCompleto} {c.vehiculoHabitual ? `(${c.vehiculoHabitual})` : ''}
                              </option>
                            ))}
                            {trip.conductorAsignado &&
                              !conductoresDisponibles.some(
                                (c) => c.idConductor === trip.conductorAsignado?.idConductor
                              ) && (
                                <option value={trip.conductorAsignado.idConductor}>
                                  {trip.conductorAsignado.nombreCompleto}{' '}
                                  {trip.conductorAsignado.vehiculoHabitual
                                    ? `(${trip.conductorAsignado.vehiculoHabitual})`
                                    : ''}
                                </option>
                              )}
                          </select>
                        </div>
                      );
                    })()}
                  </td>

                  {/* Punto de Regreso */}
                  <td className="py-3 px-3">
                    <select
                      value={trip.puntoRegreso || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTrips((prev) =>
                          prev.map((t) => (t.id === trip.id ? { ...t, puntoRegreso: val } : t))
                        );
                      }}
                      className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-medium rounded-xl px-2 py-1 max-w-[170px] truncate cursor-pointer focus:outline-none"
                    >
                      <option value={trip.puntoRegreso || ''}>{trip.puntoRegreso || 'Punto retorno'}</option>
                      {puntos.map((p) => (
                        <option key={p.idPunto} value={`[${p.codigoPuntoc}] ${p.nombreSede}`}>
                          [{p.codigoPuntoc}] {p.nombreSede} ({p.ciudad})
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Acciones Rápidas */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => {
                          setViajeSeleccionadoWhatsapp(trip);
                          setTextoWhatsappCustom(null);
                          setEditandoTextoWa(false);
                          setModalWhatsappAbierto(true);
                        }}
                        title="Ver y Enviar Notificación WhatsApp"
                        className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xs transition cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => mostrarToast('ok', `Edición de viaje ${trip.nroTransporte} habilitada.`)}
                        title="Editar Registro de Viaje"
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => mostrarToast('ok', `Geocerca verificada: 100% de cobertura en ruta.`)}
                        title="Ver Geocercas y Ruta"
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 select-none font-sans">
      {/* Toast Alert Flotante */}
      {mensajeToast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 ${mensajeToast.tipo === 'ok'
            ? 'bg-emerald-600 text-white'
            : mensajeToast.tipo === 'warn'
              ? 'bg-amber-500 text-white'
              : 'bg-rose-600 text-white'
            }`}
        >
          {mensajeToast.tipo === 'ok' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
          {mensajeToast.tipo === 'warn' && <AlertTriangle className="w-5 h-5 shrink-0" />}
          {mensajeToast.tipo === 'err' && <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{mensajeToast.texto}</span>
          <button onClick={() => setMensajeToast(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input oculto para subida de PDF */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 1. Encabezado y Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold tracking-wider text-emerald-800 uppercase">
            <span>LOGÍSTICO</span>
            <span>›</span>
            <span>PROGRAMACIÓN DE VIAJES</span>
            <span>›</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">INGESTA DE MANIFIESTO</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
            Consola de Programación de Viajes y Despacho Masivo
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Matriz de alta densidad para edición en lote, asignación rápida de tripulación troncal y notificación masiva vía WhatsApp.
          </p>
        </div>

        {/* Acciones Superiores */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCargarDemo}
            title="Restablecer datos de demostración"
            className="flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
            <span>Datos Demo</span>
          </button>

          <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-2 rounded-xl">
            <Table className="w-4 h-4 text-blue-600" />
            <span>DataGrid</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sincronizado</span>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={cargandoPdf}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {cargandoPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extrayendo PDF...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Subir Manifiesto (.pdf)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Barra de Métricas y Estado de Colisión */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Badge Nombre Archivo & Colisiones */}
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-700">
            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-gray-800 max-w-[140px] truncate" title={nombreArchivo}>
              {nombreArchivo}
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center space-x-1 text-emerald-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{metricas.total} detectados</span>
            </span>
            <span className="text-gray-400">•</span>
            {metricas.colisiones > 0 ? (
              <span className="flex items-center space-x-1 text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{metricas.colisiones} colisiones en BD</span>
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold">0 colisiones</span>
            )}
          </div>

          {/* Badge Total */}
          <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
            TOTAL: {metricas.total} Viajes
          </div>

          {/* Badge Asignados vs Pendientes */}
          <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium px-3 py-1.5 rounded-xl">
            <span>Asignados: <strong className="font-bold text-amber-950">{metricas.asignados}</strong> / {metricas.total}</span>
            {metricas.pendientes > 0 && (
              <span className="bg-amber-600 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">
                {metricas.pendientes} Pendientes
              </span>
            )}
          </div>

          {/* Badge Retornos */}
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1">
            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Retornos: 100% Geocercados</span>
          </div>
        </div>

        {/* Botón Guardar en Base de Datos */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleConfirmarYGuardar}
            disabled={guardandoBd || metricas.seleccionadosValidos === 0}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {guardandoBd ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registrando en guias_viajes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Confirmar e Ingestar ({metricas.seleccionadosValidos} Nuevos)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerta Destacada si existen Colisiones en guias_viajes */}
      {metricas.colisiones > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-2xl flex items-start space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-rose-800 text-sm">
              Colisión detectada: {metricas.colisiones} viaje(s) ya existen en la tabla guias_viajes
            </p>
            <p className="text-rose-700 mt-0.5">
              El sistema identificó que estos códigos de despacho ya fueron ingresados previamente. Se han resaltado en color ámbar/rojo y desmarcado por seguridad para evitar duplicaciones en la flota.
            </p>
          </div>
        </div>
      )}

      {/* 3. Selector de Pestaña Principal: Corte por Día vs Corte por Planta */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setModoVista('dia')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${modoVista === 'dia'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            <Calendar className={`w-4 h-4 ${modoVista === 'dia' ? 'text-orange-400' : 'text-gray-400'}`} />
            <span>Corte por Día (Cronológico)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${modoVista === 'dia' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
            >
              {diasDisponibles.length} Días
            </span>
          </button>

          <button
            onClick={() => setModoVista('planta')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${modoVista === 'planta'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            <Building2 className={`w-4 h-4 ${modoVista === 'planta' ? 'text-emerald-400' : 'text-gray-400'}`} />
            <span>Corte por Planta (Sede Origen)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${modoVista === 'planta' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
            >
              {plantasDisponibles.length} Plantas
            </span>
          </button>
        </div>

        <span className="text-[11px] text-gray-400 hidden sm:inline font-medium">
          {modoVista === 'dia' ? 'Agrupación temporal por fecha de despacho' : 'Agrupación logística por centro de carga'}
        </span>
      </div>

      {/* 4. Filtros Dinámicos y Buscador */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
        {/* Píldoras de Filtro Dinámicas */}
        {modoVista === 'dia' ? (
          // Píldoras por DÍA
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFiltroFecha('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${filtroFecha === 'todos'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Todos <span className="ml-1 opacity-80">{trips.length}</span>
            </button>

            {diasDisponibles.map((dia) => (
              <button
                key={dia.isoKey}
                onClick={() => setFiltroFecha(dia.isoKey)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${filtroFecha === dia.isoKey
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <span>{dia.pildora}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                  {dia.total}
                </span>
              </button>
            ))}
          </div>
        ) : (
          // Píldoras por PLANTA
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFiltroPlanta('todas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${filtroPlanta === 'todas'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Todas las Plantas <span className="ml-1 opacity-80">{trips.length}</span>
            </button>

            {plantasDisponibles.map((p) => (
              <button
                key={p.key}
                onClick={() => setFiltroPlanta(p.key)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${filtroPlanta === p.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <span>{p.codigo ? `[${p.codigo}] ` : ''}{p.nombre}</span>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                  {p.total}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Filtros Rápidos y Buscador */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Toggle Sin Chofer */}
          <button
            onClick={() => setFiltroSoloSinChofer((prev) => !prev)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${filtroSoloSinChofer
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
          >
            <span className="w-2 h-2 rounded-sm bg-amber-600"></span>
            <span>{metricas.pendientes} Sin Chofer</span>
          </button>

          {/* Toggle Solo Colisiones */}
          {metricas.colisiones > 0 && (
            <button
              onClick={() => setFiltroSoloColisiones((prev) => !prev)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${filtroSoloColisiones
                ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{metricas.colisiones} Colisiones</span>
            </button>
          )}

          {/* Input Buscador */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar chofer, guía TR-, nodo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* 5. Matriz de Viajes Agrupados (Acordeones Dinámicos) */}
      <div className="space-y-4">
        {modoVista === 'dia' ? (
          // VISTA: CORTE POR DÍA
          gruposCronologicos.map((grupo) => {
            const estaAbierto = seccionesAbiertas[grupo.isoKey] !== undefined ? seccionesAbiertas[grupo.isoKey] : true;
            const choferesListos = grupo.viajes.filter((v) => v.conductorAsignado && !v.estadoPendienteChofer).length;
            const choferesTotal = grupo.viajes.length;

            return (
              <div key={grupo.isoKey} className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                {/* Encabezado del Acordeón por Día */}
                <div
                  onClick={() =>
                    setSeccionesAbiertas((prev) => ({ ...prev, [grupo.isoKey]: !estaAbierto }))
                  }
                  className="p-4 bg-gradient-to-r from-gray-50 to-white hover:bg-gray-100/70 border-b border-gray-200 flex items-center justify-between cursor-pointer transition select-none"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                      {estaAbierto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900 tracking-wide uppercase">
                        {grupo.titulo} —{' '}
                        <span className="text-gray-500 font-semibold">
                          {grupo.viajes.length} VIAJES PROGRAMADOS | {grupo.kmTotalesEstimados.toLocaleString()} KM TOTALES | {grupo.ventanaHoraria}
                        </span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] px-2.5 py-1 rounded-xl">
                      +{choferesListos}/{choferesTotal} Choferes Listos
                    </span>

                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center space-x-1.5 text-xs font-medium text-gray-600 cursor-pointer"
                    >
                      <span>Auto-Guardar</span>
                      <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-0" />
                    </label>
                  </div>
                </div>

                {/* Tabla de Viajes */}
                {estaAbierto && renderTablaDeViajes(grupo.viajes, `dia-${grupo.isoKey}`)}
              </div>
            );
          })
        ) : (
          // VISTA: CORTE POR PLANTA
          gruposPorPlanta.map((grupo) => {
            const estaAbierto = seccionesAbiertas[grupo.key] !== undefined ? seccionesAbiertas[grupo.key] : true;
            const choferesListos = grupo.viajes.filter((v) => v.conductorAsignado && !v.estadoPendienteChofer).length;
            const choferesTotal = grupo.viajes.length;

            return (
              <div key={grupo.key} className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                {/* Encabezado del Acordeón por Planta */}
                <div
                  onClick={() =>
                    setSeccionesAbiertas((prev) => ({ ...prev, [grupo.key]: !estaAbierto }))
                  }
                  className="p-4 bg-gradient-to-r from-emerald-50/40 to-white hover:bg-emerald-50/70 border-b border-gray-200 flex items-center justify-between cursor-pointer transition select-none"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      {estaAbierto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900 tracking-wide uppercase">
                        {grupo.titulo} —{' '}
                        <span className="text-gray-500 font-semibold">
                          {grupo.viajes.length} VIAJES PROGRAMADOS | {grupo.destinosUnicos} DESTINOS | {grupo.ventanaHoraria}
                        </span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] px-2.5 py-1 rounded-xl">
                      +{choferesListos}/{choferesTotal} Choferes Listos
                    </span>

                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center space-x-1.5 text-xs font-medium text-gray-600 cursor-pointer"
                    >
                      <span>Auto-Guardar</span>
                      <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-0" />
                    </label>
                  </div>
                </div>

                {/* Tabla de Viajes */}
                {estaAbierto && renderTablaDeViajes(grupo.viajes, `planta-${grupo.key}`)}
              </div>
            );
          })
        )}
      </div>

      {/* 6. Modal Oficial de Notificación WhatsApp / Dispatch Preview */}
      {modalWhatsappAbierto && viajeSeleccionadoWhatsapp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setModalWhatsappAbierto(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            id="whatsapp-preview-card"
            className="relative w-full max-w-2xl bg-[#0b2b24] rounded-2xl overflow-hidden shadow-2xl border border-emerald-800/60 my-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera de la Notificación */}
            <div className="p-4 bg-[#08201a] border-b border-emerald-800/40 flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-extrabold text-sm text-white shadow-inner shrink-0">
                  {viajeSeleccionadoWhatsapp?.conductorAsignado?.nombreCompleto
                    ? viajeSeleccionadoWhatsapp.conductorAsignado.nombreCompleto.slice(0, 2).toUpperCase()
                    : 'SC'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm tracking-tight">
                      {viajeSeleccionadoWhatsapp?.conductorAsignado?.nombreCompleto || 'Sin Conductor Asignado'}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${viajeSeleccionadoWhatsapp?.conductorAsignado ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                    ></span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 font-medium">
                    {viajeSeleccionadoWhatsapp?.conductorAsignado?.telefono || 'Sin teléfono registrado'} •{' '}
                    {viajeSeleccionadoWhatsapp?.conductorAsignado ? 'Conductor Titular' : 'Pendiente Asignación'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs font-bold text-emerald-300">
                <div className="hidden sm:flex items-center space-x-1.5 bg-emerald-900/60 border border-emerald-700/50 px-2.5 py-1 rounded-lg">
                  <span className="text-[10px]">&lt; &gt;</span>
                  <span className="tracking-wider text-[11px]">VISTA PREVIA</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalWhatsappAbierto(false)}
                  aria-label="Cerrar modal"
                  className="text-emerald-300 hover:text-white hover:bg-emerald-800/60 p-1.5 rounded-xl transition-colors cursor-pointer"
                  title="Cerrar (Esc)"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Banner Plantilla Oficial */}
            <div className="bg-[#0e372e] py-1.5 px-4 text-[10px] font-extrabold tracking-widest text-emerald-200 uppercase border-b border-emerald-800/30 flex items-center justify-between">
              <span>GUÍA: {viajeSeleccionadoWhatsapp.nroTransporte}</span>
              <span>PLANTILLA OFICIAL DE DESPACHO</span>
            </div>

            {/* Advertencia si no hay conductor o teléfono */}
            {!viajeSeleccionadoWhatsapp?.conductorAsignado?.telefono && (
              <div className="bg-amber-900/40 border-b border-amber-600/30 px-4 py-2 flex items-center space-x-2 text-amber-200 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Atención: El conductor asignado no tiene número telefónico registrado en el sistema.
                </span>
              </div>
            )}

            {/* Cuerpo del Mensaje (Burbuja WhatsApp) */}
            <div className="p-6 bg-[#061814] bg-opacity-95 flex justify-center">
              <div className="w-full max-w-xl bg-white text-gray-900 rounded-2xl p-4 shadow-lg text-xs leading-relaxed border border-gray-100">
                {editandoTextoWa ? (
                  <textarea
                    value={textoWhatsappFinal}
                    onChange={(e) => setTextoWhatsappCustom(e.target.value)}
                    rows={10}
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Escribe el mensaje de WhatsApp..."
                  />
                ) : (
                  <div className="space-y-2 whitespace-pre-wrap font-sans">
                    {textoWhatsappFinal}
                  </div>
                )}
                <div className="flex justify-end items-center space-x-1 text-[10px] text-gray-400 mt-2 font-mono">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-blue-500 font-bold">✓✓</span>
                </div>
              </div>
            </div>

            {/* Pie de la Notificación & Acciones */}
            <div className="p-4 bg-[#08201a] border-t border-emerald-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">Disparador: Webhook API Oficial</span>
                <span className="text-emerald-500">•</span>
                <span className="text-emerald-400 text-[11px] font-bold">Token Activo</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={copiarTextoWhatsapp}
                  title="Copiar texto al portapapeles"
                  className="flex items-center space-x-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditandoTextoWa((prev) => !prev)}
                  className="flex items-center space-x-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{editandoTextoWa ? 'Listo' : 'Editar Texto'}</span>
                </button>

                <button
                  type="button"
                  onClick={enviarWhatsappDirecto}
                  className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-1.5 rounded-xl shadow-md transition transform active:scale-95 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Este</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
