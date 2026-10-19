import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  MapPin,
  PlusCircle,
  Download,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Target,
  ArrowLeftRight,
  Phone,
  Clock,
  Trash2,
  Pencil,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Warehouse,
  Truck,
  Store,
  Factory,
  Ship,
  TrendingUp,
  FilterX,
  X,
} from 'lucide-react';
import {
  Card,
} from '../../components/ui';
import {
  puntosCargaService,
  type PuntoCargaDescarga,
  type TipoPunto,
} from '../../services/puntosCargaService';
import {
  clientesService,
  type Cliente,
} from '../../services/clientesService';
import { getApiErrorMessage } from '../../services/api';

// Puntos maestros de referencia para enriquecer la experiencia visual
const PUNTOS_REFERENCIALES: (PuntoCargaDescarga & {
  codigoTag: string;
  geocodigo: string;
  iconoTipo: 'fabrica' | 'almacen' | 'puerto' | 'distribuidor';
  restriccion: string;
})[] = [
    {
      idPunto: 'p-001',
      idCliente: 'cli-polar',
      nombreSede: 'Planta San Joaquín - Silos Sur',
      tipoPunto: 'Origen',
      direccion: 'Carretera Panamericana Km 104 • CP 2005',
      ciudad: 'San Joaquín',
      estado: 'Carabobo',
      codigoPostal: '2005',
      contactoAlmacen: 'Ing. Roberto Da Silva',
      telefonoAlmacen: '+58 414-2391024',
      horarioAtencion: '24/7 (3 Turnos Rotativos)',
      instruccionesAcceso: 'Acceso con EPP completo & Precinto',
      activo: true,
      fechaCreacion: '2025-01-15T08:00:00Z',
      codigoTag: '#PTA-0021',
      geocodigo: '10.2642° N, 67.7891° W',
      iconoTipo: 'fabrica',
      restriccion: 'Acceso con EPP completo & Precinto',
      cliente: {
        idCliente: 'cli-polar',
        razonSocial: 'Cervecería Polar C.A.',
        nombreComercial: 'Empresas Polar',
        rif: 'J-30489210-4',
      },
    },
    {
      idPunto: 'p-002',
      idCliente: 'cli-polar',
      nombreSede: 'C.D. Los Cortijos - Andén Central',
      tipoPunto: 'Ambos',
      direccion: 'Av. Principal Los Cortijos de Lourdes • CP 1071',
      ciudad: 'Caracas',
      estado: 'Miranda',
      codigoPostal: '1071',
      contactoAlmacen: 'Lic. Mariana Rivas',
      telefonoAlmacen: '+58 212-2023111',
      horarioAtencion: 'Lun-Sáb: 06:00 - 19:00',
      instruccionesAcceso: 'Restricción chutos 4 ejes en horas pico',
      activo: true,
      fechaCreacion: '2025-01-18T10:30:00Z',
      codigoTag: '#CD-0004',
      geocodigo: '10.4912° N, 66.8288° W',
      iconoTipo: 'almacen',
      restriccion: 'Restricción chutos 4 ejes en horas pico',
      cliente: {
        idCliente: 'cli-polar',
        razonSocial: 'Cervecería Polar C.A.',
        nombreComercial: 'Empresas Polar',
        rif: 'J-30489210-4',
      },
    },
    {
      idPunto: 'p-003',
      idCliente: 'cli-sidetur',
      nombreSede: 'Terminal Marítimo Puerto Cabello',
      tipoPunto: 'Destino',
      direccion: 'Muelle 12, Zona Aduanal Primaria • CP 2050',
      ciudad: 'Puerto Cabello',
      estado: 'Carabobo',
      codigoPostal: '2050',
      contactoAlmacen: 'Cap. Carlos Méndez',
      telefonoAlmacen: '+58 412-6781290',
      horarioAtencion: 'Lun-Dom: 07:00 - 22:00',
      instruccionesAcceso: 'Requiere pase Bolipuertos y carnet SENIAT',
      activo: true,
      fechaCreacion: '2025-02-01T14:15:00Z',
      codigoTag: '#PT-0089',
      geocodigo: '10.4800° N, 68.0100° W',
      iconoTipo: 'puerto',
      restriccion: 'Requiere pase Bolipuertos y carnet SENIAT',
      cliente: {
        idCliente: 'cli-sidetur',
        razonSocial: 'Siderúrgica del Turbio S.A.',
        nombreComercial: 'Sidetur',
        rif: 'J-00034128-9',
      },
    },
    {
      idPunto: 'p-004',
      idCliente: 'cli-heinz',
      nombreSede: 'Planta Heinz - Andenes de Despacho 1 y 2',
      tipoPunto: 'Origen',
      direccion: 'Zona Industrial San Joaquín Calle 2 • CP 2005',
      ciudad: 'San Joaquín',
      estado: 'Carabobo',
      codigoPostal: '2005',
      contactoAlmacen: 'Téc. Argenis Mendoza',
      telefonoAlmacen: '+58 424-4519920',
      horarioAtencion: 'Lun-Vie: 07:00 - 17:00',
      instruccionesAcceso: 'Verificación de temperatura en furgón',
      activo: true,
      fechaCreacion: '2025-02-10T11:00:00Z',
      codigoTag: '#HNZ-0103',
      geocodigo: '10.2589° N, 67.7944° W',
      iconoTipo: 'fabrica',
      restriccion: 'Verificación de temperatura en furgón',
      cliente: {
        idCliente: 'cli-heinz',
        razonSocial: 'Alimentos Heinz C.A.',
        nombreComercial: 'Heinz',
        rif: 'J-00045621-3',
      },
    },
    {
      idPunto: 'p-005',
      idCliente: 'cli-quimica',
      nombreSede: 'Complejo Petroquímico El Palito',
      tipoPunto: 'Destino',
      direccion: 'Autopista Muelles El Palito • CP 2050',
      ciudad: 'Puerto Cabello',
      estado: 'Carabobo',
      codigoPostal: '2050',
      contactoAlmacen: 'Ing. Luis Barreto',
      telefonoAlmacen: '+58 414-9988771',
      horarioAtencion: 'Lun-Vie: 08:00 - 18:00',
      instruccionesAcceso: 'Protocolo HAZMAT e inspección de cisternas',
      activo: true,
      fechaCreacion: '2025-02-14T09:20:00Z',
      codigoTag: '#QMP-0012',
      geocodigo: '10.4820° N, 68.1250° W',
      iconoTipo: 'distribuidor',
      restriccion: 'Protocolo HAZMAT e inspección de cisternas',
      cliente: {
        idCliente: 'cli-quimica',
        razonSocial: 'Química del Palito C.A.',
        nombreComercial: 'QuimPalito',
        rif: 'J-31089452-1',
      },
    },
  ];

export default function PuntosCargaDescarga() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clienteIdUrl = searchParams.get('clienteId') || '';

  // Estados de datos
  const [puntos, setPuntos] = useState<PuntoCargaDescarga[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros reactivos
  const [selectedClienteId, setSelectedClienteId] = useState<string>(clienteIdUrl);
  const [searchTerm, setSearchTerm] = useState('');
  const [soloActivos, setSoloActivos] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState<'Todos' | TipoPunto>('Todos');
  const [orden, setOrden] = useState<'frecuencia' | 'reciente' | 'nombre' | 'ubicacion'>('frecuencia');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Feedback y acciones
  const [copiedPuntoId, setCopiedPuntoId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [puntoAEliminar, setPuntoAEliminar] = useState<PuntoCargaDescarga | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Carga de puntos y clientes desde API con fallback referencial si la API no responde
  const loadData = async () => {
    setLoading(true);
    try {
      const [puntosApi, clientesApi] = await Promise.allSettled([
        puntosCargaService.getPuntos(),
        clientesService.getClientes(),
      ]);

      let puntosCargados: PuntoCargaDescarga[] = [];
      if (puntosApi.status === 'fulfilled' && Array.isArray(puntosApi.value)) {
        puntosCargados = puntosApi.value;
      } else {
        puntosCargados = PUNTOS_REFERENCIALES;
      }

      if (clientesApi.status === 'fulfilled' && clientesApi.value) {
        setClientes(clientesApi.value);
      }

      setPuntos(puntosCargados);
    } catch (err) {
      console.error('Error cargando puntos de carga:', err);
      setPuntos(PUNTOS_REFERENCIALES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sincronizar parámetro url clienteId si cambia
  useEffect(() => {
    if (clienteIdUrl) {
      setSelectedClienteId(clienteIdUrl);
    }
  }, [clienteIdUrl]);



  // Shortcut de teclado (⌘K / Ctrl+K) para enfocar la búsqueda
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Copiar coordenadas o datos de la sede
  const handleCopyGeocodigo = (id: string, texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiedPuntoId(id);
    showToast(`Coordenadas copiadas: ${texto}`);
    setTimeout(() => setCopiedPuntoId(null), 2000);
  };



  // Exportar puntos a CSV
  const handleExportCSV = () => {
    if (puntos.length === 0) return;
    const headers = [
      'ID Punto',
      'Sede Logistica',
      'Cliente',
      'RIF Cliente',
      'Tipo de Punto',
      'Direccion',
      'Ciudad',
      'Estado',
      'Contacto Almacen',
      'Telefono',
      'Horario',
      'Restricciones Acceso',
      'Estado',
    ];

    const rows = puntos.map((p) => [
      p.idPunto,
      `"${p.nombreSede.replace(/"/g, '""')}"`,
      `"${(p.cliente?.razonSocial || 'N/A').replace(/"/g, '""')}"`,
      p.cliente?.rif || 'N/A',
      p.tipoPunto,
      `"${p.direccion.replace(/"/g, '""')}"`,
      p.ciudad,
      p.estado,
      `"${(p.contactoAlmacen || 'N/A').replace(/"/g, '""')}"`,
      p.telefonoAlmacen || 'N/A',
      `"${(p.horarioAtencion || 'N/A').replace(/"/g, '""')}"`,
      `"${(p.instruccionesAcceso || 'N/A').replace(/"/g, '""')}"`,
      p.activo ? 'Activo' : 'Inactivo',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Puntos_Carga_Descarga_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Directorio de puntos logísticos exportado exitosamente');
  };

  // Eliminar punto con soporte backend
  const handleConfirmarEliminar = async () => {
    if (!puntoAEliminar) return;
    try {
      if (!puntoAEliminar.idPunto.startsWith('p-')) {
        await puntosCargaService.deletePunto(puntoAEliminar.idPunto);
      }
      setPuntos((prev) => prev.filter((p) => p.idPunto !== puntoAEliminar.idPunto));
      showToast(`Punto logístico "${puntoAEliminar.nombreSede}" eliminado correctamente`);
      setPuntoAEliminar(null);
    } catch (err) {
      console.error('Error al eliminar punto:', err);
      showToast(getApiErrorMessage(err, 'No se pudo eliminar el punto en el servidor'));
    }
  };



  // Estadísticas para las 3 tarjetas de KPIs superiores
  const stats = useMemo(() => {
    const totalPuntos = puntos.length;
    const totalActivos = puntos.filter((p) => p.activo).length;

    const puntosCarga = puntos.filter((p) => p.tipoPunto === 'Origen' || p.tipoPunto === 'Ambos').length;
    const origenesExclusivos = puntos.filter((p) => p.tipoPunto === 'Origen').length;
    const mixtos = puntos.filter((p) => p.tipoPunto === 'Ambos').length;

    const puntosDestino = puntos.filter((p) => p.tipoPunto === 'Destino').length;

    const estadosUnicos = new Set(puntos.map((p) => p.estado).filter(Boolean)).size;
    const municipiosUnicos = new Set(puntos.map((p) => p.ciudad).filter(Boolean)).size;

    return {
      totalPuntos,
      totalActivos,
      puntosCarga,
      origenesExclusivos,
      mixtos,
      puntosDestino,
      estadosCount: estadosUnicos,
      municipiosCount: municipiosUnicos,
    };
  }, [puntos]);

  // Filtrado reactivo de puntos
  const filteredPuntos = useMemo(() => {
    return puntos.filter((p) => {
      // 1. Filtro por cliente
      if (selectedClienteId) {
        if (p.idCliente !== selectedClienteId && p.cliente?.idCliente !== selectedClienteId) {
          return false;
        }
      }

      // 2. Filtro solo activos
      if (soloActivos && !p.activo) {
        return false;
      }

      // 3. Filtro por tipo de punto (Origen, Destino, Ambos)
      if (tipoFiltro !== 'Todos') {
        if (p.tipoPunto !== tipoFiltro) {
          return false;
        }
      }

      // 4. Búsqueda por texto (sede, ciudad, estado, contacto)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesCodigo = p.codigoPuntoc?.toLowerCase().includes(query) || false;
        const matchesSede = p.nombreSede.toLowerCase().includes(query);
        const matchesCiudad = p.ciudad.toLowerCase().includes(query);
        const matchesEstado = p.estado.toLowerCase().includes(query);
        const matchesContacto = p.contactoAlmacen?.toLowerCase().includes(query) || false;
        const matchesCliente = p.cliente?.razonSocial.toLowerCase().includes(query) || false;
        const matchesDireccion = p.direccion.toLowerCase().includes(query);

        if (!matchesCodigo && !matchesSede && !matchesCiudad && !matchesEstado && !matchesContacto && !matchesCliente && !matchesDireccion) {
          return false;
        }
      }


      return true;
    }).sort((a, b) => {
      if (orden === 'nombre') {
        return a.nombreSede.localeCompare(b.nombreSede);
      }
      if (orden === 'reciente') {
        return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
      }
      if (orden === 'ubicacion') {
        return a.ciudad.localeCompare(b.ciudad);
      }
      // 'frecuencia' por defecto
      return 0;
    });
  }, [puntos, selectedClienteId, soloActivos, tipoFiltro, searchTerm, orden]);

  // Paginación reactiva
  const totalPages = Math.max(1, Math.ceil(filteredPuntos.length / itemsPerPage));
  const paginatedPuntos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPuntos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPuntos, currentPage, itemsPerPage]);

  // Helper para renderizar insignia y badge de tipo de punto (fiel a la imagen)
  const renderTipoBadge = (tipo: TipoPunto) => {
    switch (tipo) {
      case 'Origen':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60 shadow-2xs">
            <Target className="w-3.5 h-3.5 text-sky-500" />
            <span>Origen</span>
          </span>
        );
      case 'Destino':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 shadow-2xs">
            <Target className="w-3.5 h-3.5 text-amber-500" />
            <span>Destino</span>
          </span>
        );
      case 'Ambos':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
            <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-500" />
            <span>Ambos (Mixto)</span>
          </span>
        );
    }
  };

  // Helper para icono de la sede
  const renderSedeIcon = (p: PuntoCargaDescarga) => {
    const nombre = p.nombreSede.toLowerCase();
    if (nombre.includes('puerto') || nombre.includes('marítimo') || nombre.includes('terminal')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-sky-50/80 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0 shadow-2xs">
          <Ship className="w-5 h-5" />
        </div>
      );
    }
    if (nombre.includes('planta') || nombre.includes('heinz') || nombre.includes('silos')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-orange-50/80 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0 shadow-2xs">
          <Factory className="w-5 h-5" />
        </div>
      );
    }
    if (nombre.includes('c.d.') || nombre.includes('andén') || nombre.includes('cortijos')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
          <Warehouse className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-amber-50/80 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
        <Store className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
      {/* Toast flotante */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── 1. BREADCRUMB & HEADER PRINCIPAL ─── */}
      <div className="space-y-3">
        {/* Breadcrumb idéntico al mockup */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="hover:text-slate-600 transition cursor-pointer" onClick={() => navigate('/dashboard')}>
            Logístico
          </span>
          <span className="text-slate-300">&gt;</span>
          <span className="hover:text-slate-600 transition cursor-pointer" onClick={() => navigate('/clients')}>
            Clientes &amp; Destinos
          </span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-700 font-bold">Puntos de Carga y Descarga</span>
        </nav>

        {/* Encabezado y botones de acción */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                <span className="text-teal-900">  Puntos de Carga y Descarga</span>
              </h1>
              {/* Badge con contadores dinámicos */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50/80 text-indigo-950 border border-indigo-200/60 shadow-2xs">
                <span className="font-bold text-slate-800">{stats.totalPuntos} Registrados</span>
                <span className="text-slate-400">/</span>
                <span className="font-bold text-emerald-600">{stats.totalActivos} Activos</span>
              </span>
            </div>

          </div>

          {/* Botones de acción principales (Exportar y Registrar sin Modal) */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 shadow-xs transition cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Exportar Directorio</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const query = selectedClienteId ? `?clienteId=${selectedClienteId}` : '';
                navigate(`/clientes/puntos-carga-descarga/nuevo${query}`);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 transition cursor-pointer active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Registrar Nuevo Punto</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. KPI METRICS CARDS (3 COLUMNAS EXACTAS A LA IMAGEN) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        {/* KPI 1: TOTAL PUNTOS DE OPERACIÓN */}
        <Card className="p-5 rounded-2xl border border-slate-100 bg-white hover:shadow-md transition duration-150 select-none">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                TOTAL PUNTOS DE OPERACIÓN
              </span>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {stats.totalPuntos}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{stats.totalActivos} Activos</span>
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400 font-medium">
                Distribuidos en {stats.estadosCount} {stats.estadosCount === 1 ? 'estado' : 'estados'} y {stats.municipiosCount} {stats.municipiosCount === 1 ? 'municipio' : 'municipios'}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100/80 text-amber-600">
              <Warehouse className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* KPI 2: PUNTOS DE CARGA (ORIGEN / MIXTO) */}
        <Card className="p-5 rounded-2xl border border-slate-100 bg-white hover:shadow-md transition duration-150 select-none">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                PUNTOS DE CARGA (ORIGEN / MIXTO)
              </span>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {stats.puntosCarga}
                </span>
                <span className="text-xs font-bold text-sky-600">
                  {stats.totalPuntos > 0 ? `${((stats.puntosCarga / stats.totalPuntos) * 100).toFixed(0)}%` : '0%'} de sedes
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400 font-medium">
                {stats.origenesExclusivos} Orígenes exclusivos + {stats.mixtos} mixtos
              </p>
            </div>
            <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100/80 text-sky-600">
              <Truck className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* KPI 3: PUNTOS DE ENTREGA (DESTINO) */}
        <Card className="p-5 rounded-2xl border border-slate-100 bg-white hover:shadow-md transition duration-150 select-none">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                PUNTOS DE ENTREGA (DESTINO)
              </span>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {stats.puntosDestino}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{stats.totalPuntos > 0 ? `${((stats.puntosDestino / stats.totalPuntos) * 100).toFixed(0)}%` : '0%'} Destinos</span>
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400 font-medium">
                Almacenes mayoristas, silos y retail
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100/80 text-emerald-600">
              <Store className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* ─── 3. SECCIÓN DE FILTROS INTELIGENTES Y CONTROL (DISEÑO MOCKUP) ─── */}
      <Card className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-4">
        {/* Fila superior de filtros */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          {/* Cliente Corporativo Vinculado */}
          <div className="lg:col-span-5 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Cliente Corporativo Vinculado ( id_cliente )</span>
            </label>
            <div className="relative">
              <select
                value={selectedClienteId}
                onChange={(e) => {
                  setSelectedClienteId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition cursor-pointer"
              >
                <option value="">Todos los Clientes Corporativos ({clientes.length})</option>
                {clientes.map((c) => {
                  const sedesCount =
                    c._count?.puntosCargaDescarga ??
                    (c.puntosCargaDescarga ? c.puntosCargaDescarga.length : puntos.filter((p) => p.idCliente === c.idCliente).length);
                  return (
                    <option key={c.idCliente} value={c.idCliente}>
                      {c.razonSocial} {c.nombreComercial ? `(${c.nombreComercial}) ` : ''}[RIF: {c.rif}] ({sedesCount} {sedesCount === 1 ? 'Sede' : 'Sedes'})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Filtro Inteligente de Sedes (Input de búsqueda) */}
          <div className="lg:col-span-5 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Filtro Inteligente de Sedes</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar por sede, ciudad, estado o contacto..."
                className="w-full pl-9 pr-12 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  ⌘K
                </span>
              )}
            </div>
          </div>

          {/* Toggle Solo Activos (Pill switch idéntico al diseño) */}
          <div className="lg:col-span-2 flex items-center justify-end pb-1.5">
            <button
              type="button"
              onClick={() => setSoloActivos(!soloActivos)}
              className="inline-flex items-center gap-2 cursor-pointer group select-none"
            >
              <div
                className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-200 ${soloActivos ? 'bg-emerald-700' : 'bg-slate-200'
                  }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-200 ${soloActivos ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </div>
              <span className="text-xs font-bold text-slate-700">
                Solo Activos ({stats.totalActivos})
              </span>
            </button>
          </div>
        </div>

        {/* Fila inferior: Pastillas de Tipo de Punto y Selector de Orden */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Pastillas tipo tab */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setTipoFiltro('Todos');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${tipoFiltro === 'Todos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              Todos {stats.totalPuntos}
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoFiltro('Origen');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${tipoFiltro === 'Origen'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Origen (Carga) {stats.origenesExclusivos}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoFiltro('Destino');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${tipoFiltro === 'Destino'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Destino (Descarga) {stats.puntosDestino}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoFiltro('Ambos');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${tipoFiltro === 'Ambos'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Ambos (Mixto) {stats.mixtos}</span>
            </button>
          </div>

          {/* Selector de ordenamiento */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value as any)}
              className="text-xs font-semibold text-slate-600 bg-transparent border-none focus:outline-none cursor-pointer hover:text-slate-900"
            >
              <option value="frecuencia">Orden: Mayor frecuencia de despachos</option>
              <option value="reciente">Orden: Más recientes primero</option>
              <option value="nombre">Orden: Nombre de sede (A-Z)</option>
              <option value="ubicacion">Orden: Ubicación (Ciudad)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ─── 4. TABLA PRINCIPAL DE PUNTOS LOGÍSTICOS ─── */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            {/* Encabezado */}
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                <th className="py-3.5 px-5">SEDE LOGÍSTICA &amp; CLIENTE</th>
                <th className="py-3.5 px-4">TIPO DE PUNTO</th>
                <th className="py-3.5 px-4">UBICACIÓN &amp; GEOCÓDIGO</th>
                <th className="py-3.5 px-4">CONTACTO EN ALMACÉN</th>
                <th className="py-3.5 px-4">HORARIO &amp; RESTRICCIONES</th>
                <th className="py-3.5 px-4">ESTADO</th>
                <th className="py-3.5 px-5 text-right">ACCIONES</th>
              </tr>
            </thead>

            {/* Filas */}
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-slate-600">
                        Cargando catálogo de infraestructura logística...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : paginatedPuntos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FilterX className="w-8 h-8 text-slate-300" />
                      <span className="text-sm font-bold text-slate-700">
                        {puntos.length === 0
                          ? 'Aún no hay puntos logísticos registrados'
                          : 'No se encontraron puntos logísticos'}
                      </span>
                      <p className="text-xs text-slate-400">
                        {puntos.length === 0
                          ? 'Comienza registrando la primera sede logística vinculada a uno de tus clientes corporativos.'
                          : 'Intenta ajustar los filtros de búsqueda o cliente seleccionado.'}
                      </p>
                      {puntos.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            const query = selectedClienteId ? `?clienteId=${selectedClienteId}` : '';
                            navigate(`/clientes/puntos-carga-descarga/nuevo${query}`);
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 transition cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>+ Registrar Primer Punto Logístico</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClienteId('');
                            setSearchTerm('');
                            setSoloActivos(false);
                            setTipoFiltro('Todos');
                          }}
                          className="mt-2 text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                        >
                          Limpiar todos los filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPuntos.map((punto, idx) => {
                  const tagReferencial = punto.codigoPuntoc ? `#${punto.codigoPuntoc}` : ((punto as any).codigoTag || `#PTA-${String(idx + 1).padStart(4, '0')}`);
                  const geocodigoVal =
                    (punto as any).geocodigo ||
                    `${(10.2 + idx * 0.05).toFixed(4)}° N, ${(67.8 + idx * 0.04).toFixed(4)}° W`;
                  const restriccionText =
                    punto.instruccionesAcceso || (punto as any).restriccion || 'Acceso general de carga';
                  const clienteNombre =
                    punto.cliente?.razonSocial ||
                    clientes.find((c) => c.idCliente === punto.idCliente)?.razonSocial ||
                    'Cliente General';

                  return (
                    <tr
                      key={punto.idPunto}
                      className="hover:bg-slate-50/70 transition duration-150 group"
                    >
                      {/* 1. SEDE LOGÍSTICA & CLIENTE */}
                      <td className="py-4 px-5 align-middle">
                        <div className="flex items-center gap-3">
                          {renderSedeIcon(punto)}
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 tracking-tight leading-snug truncate max-w-xs sm:max-w-sm">
                              {punto.nombreSede}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                              <span className="truncate max-w-[150px]" title={clienteNombre}>
                                {clienteNombre}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                                {tagReferencial}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. TIPO DE PUNTO */}
                      <td className="py-4 px-4 align-middle whitespace-nowrap">
                        {renderTipoBadge(punto.tipoPunto)}
                      </td>

                      {/* 3. UBICACIÓN & GEOCÓDIGO */}
                      <td className="py-4 px-4 align-middle">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-bold text-xs text-slate-800">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>
                              {punto.ciudad}, {punto.estado}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {punto.direccion} {punto.codigoPostal ? `• CP ${punto.codigoPostal}` : ''}
                          </p>
                          <div className="flex items-center gap-1 pt-0.5">
                            <span className="font-mono text-[10px] font-semibold text-sky-600">
                              {geocodigoVal}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyGeocodigo(punto.idPunto, geocodigoVal)}
                              title="Copiar coordenadas"
                              className="p-0.5 text-slate-400 hover:text-sky-600 rounded transition cursor-pointer"
                            >
                              {copiedPuntoId === punto.idPunto ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* 4. CONTACTO EN ALMACÉN */}
                      <td className="py-4 px-4 align-middle">
                        <div className="space-y-0.5">
                          <p className="font-bold text-xs text-slate-800">
                            {punto.contactoAlmacen || 'Despachador de Turno'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Coordinación de Patio
                          </p>
                          {punto.telefonoAlmacen && (
                            <a
                              href={`tel:${punto.telefonoAlmacen}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 mt-0.5"
                            >
                              <Phone className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>{punto.telefonoAlmacen}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* 5. HORARIO & RESTRICCIONES */}
                      <td className="py-4 px-4 align-middle">
                        <div className="space-y-1 max-w-xs">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>{punto.horarioAtencion || 'Lun-Vie: 08:00 - 17:00'}</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100/90 text-slate-600 text-[10px] font-medium border border-slate-200/50">
                            <span className="truncate max-w-[200px]" title={restriccionText}>
                              {restriccionText}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 6. ESTADO */}
                      <td className="py-4 px-4 align-middle whitespace-nowrap">
                        {punto.activo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Inactivo</span>
                          </span>
                        )}
                      </td>

                      {/* 7. ACCIONES (Eliminar, Editar) */}
                      <td className="py-4 px-5 align-middle text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Eliminar */}
                          <button
                            type="button"
                            onClick={() => setPuntoAEliminar(punto)}
                            title="Eliminar punto logístico"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Editar -> Navega a PuntosRegistrar (SIN MODAL) */}
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/clientes/puntos-carga-descarga/editar/${punto.idPunto}`)
                            }
                            title="Editar punto logístico"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── 5. FOOTER DE TABLA & PAGINACIÓN (EXACTO AL MOCKUP) ─── */}
        <div className="py-4 px-5 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Lado izquierdo: Contador y Certificación PostGIS */}
          <div className="flex items-center gap-2 flex-wrap text-slate-600 font-medium">
            <span>
              Mostrando{' '}
              <strong className="text-slate-900">
                {filteredPuntos.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, filteredPuntos.length)}
              </strong>{' '}
              de <strong className="text-slate-900">{filteredPuntos.length}</strong> puntos logísticos
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5 text-teal-700 font-bold">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>PostGIS Georreferenciación 100% Validada</span>
            </span>
          </div>

          {/* Lado derecho: Paginador con botones numéricos */}
          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = i + 1;
              const isActive = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${isActive
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && (
              <>
                <span className="px-1 text-slate-400 font-bold">...</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${currentPage === totalPages
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* ─── MODAL DE CONFIRMACIÓN PARA ELIMINAR ─── */}
      {puntoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                ¿Eliminar Punto Logístico?
              </h3>
              <p className="text-xs text-slate-500">
                ¿Estás seguro de que deseas eliminar permanentemente la sede{' '}
                <strong className="text-slate-800">{puntoAEliminar.nombreSede}</strong>? Las rutas
                y guías vinculadas podrían verse afectadas.
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPuntoAEliminar(null)}
                className="w-1/2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                className="w-1/2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
