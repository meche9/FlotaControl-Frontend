import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Truck,
  Container,
  Search,
  Download,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Gauge,
  Fuel,
  Wrench,
  MapPin,
  Activity,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  SlidersHorizontal,
  CalendarPlus,
  MoreVertical,
  Award,
  UserCheck,
} from 'lucide-react';
import {
  Button,
  Card,
  Modal,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  ImagenProtegida,
  SelectorImagen,
} from '../../components/ui';
import {
  vehiculosService,
  type Vehiculo,
  type VehiculoFormData,
  type EstadoUnidad,
  type TipoUnidad,
  type TipoVehiculo,
  type ClasificacionVehiculo,
} from '../../services/vehiculosService';
import { getApiErrorMessage } from '../../services/api';

type FilterTab = 'todos' | 'en_ruta' | 'patio' | 'taller' | 'inactivo';

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<TipoVehiculo[]>([]);
  const [clasificaciones, setClasificaciones] = useState<ClasificacionVehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'todos' | 'motriz' | 'acoplado'>('todos');
  const [selectedTab, setSelectedTab] = useState<FilterTab>('todos');
  const [selectedZona, setSelectedZona] = useState('Todas las Zonas');
  const [selectedEstadoFilter, setSelectedEstadoFilter] = useState<'todos' | EstadoUnidad>('todos');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState<Vehiculo | null>(null);

  // Dropdown de acciones por fila
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  // Foto y estado de formularios
  const [fotoArchivo, setFotoArchivo] = useState<File | null>(null);
  const [quitarFoto, setQuitarFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);

  // Form State
  const initialFormData: VehiculoFormData = {
    placa: '',
    pais: 'ES',
    tipoUnidad: 'motriz',
    codigoUnidad: '',
    marca: '',
    modelo: '',
    especificacionMotor: '',
    anio: new Date().getFullYear(),
    clasificacion: 'Chuto',
    idClasificacion: 1,
    idTipo: 1,
    numeroChasis: '',
    numeroMotor: '',
    capacidadCarga: 25000,
    capacidadArrastre: 44000,
    estadoTipo: 'patio',
    ubicacion: 'Patio Central Valencia (P-01)',
  };

  const [formData, setFormData] = useState<VehiculoFormData>(initialFormData);

  // Cerrar menú de acciones al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar datos
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [data, tipos, clasifs] = await Promise.all([
          vehiculosService.getVehiculos(),
          vehiculosService.getTiposVehiculo().catch((e) => {
            console.warn('No se pudieron cargar tipos de vehículos:', e);
            return [] as TipoVehiculo[];
          }),
          vehiculosService.getClasificaciones().catch((e) => {
            console.warn('No se pudieron cargar clasificaciones de vehículos:', e);
            return [] as ClasificacionVehiculo[];
          }),
        ]);
        setVehiculos(data);
        if (tipos.length > 0) setTiposVehiculo(tipos);
        if (clasifs.length > 0) setClasificaciones(clasifs);
      } catch (err) {
        console.error('Error cargando vehículos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Conteos para tabs y métricas
  const counts = useMemo(() => {
    const total = vehiculos.length;
    const patio = vehiculos.filter((v) => v.estadoTipo === 'patio').length;
    const enRuta = vehiculos.filter((v) => v.estadoTipo === 'en_ruta').length;
    const taller = vehiculos.filter((v) => v.estadoTipo === 'taller').length;
    const inactivo = vehiculos.filter((v) => v.estadoTipo === 'inactivo').length;
    const motrices = vehiculos.filter((v) => {
      const c = clasificaciones.find((cl) => Number(cl.idClasificacion) === Number(v.idClasificacion));
      const t = tiposVehiculo.find((tp) => Number(tp.idTipo) === Number(c?.idTipo)) || c?.tipo;
      const tId = Number(t?.idTipo ?? c?.idTipo ?? v.idTipo ?? 1);
      return tId === 1;
    }).length;
    const acoplados = vehiculos.length - motrices;

    const disponibilidadPorcentaje = total > 0 ? (((patio + enRuta) / total) * 100).toFixed(1) : '87.5';

    return {
      total: total || 48,
      patio: patio || 6,
      enRuta: enRuta || 35,
      taller: taller || 4,
      inactivo: inactivo || 3,
      motrices,
      acoplados,
      disponibilidadPorcentaje,
      unidadesActivas: patio + enRuta || 42,
    };
  }, [vehiculos, clasificaciones, tiposVehiculo]);

  // Filtrado reactivo
  const filteredVehiculos = useMemo(() => {
    return vehiculos.filter((v) => {
      // Filtro por Tab de Estado (En Ruta, Disponibles/Patio, En Taller, Detenidas/Inactivo)
      if (selectedTab !== 'todos' && v.estadoTipo !== selectedTab) {
        return false;
      }

      // Filtro de estado secundario (desde el dropdown superior)
      if (selectedEstadoFilter !== 'todos' && v.estadoTipo !== selectedEstadoFilter) {
        return false;
      }

      // Filtro por Tipo (Motriz vs Acoplado según idClasificacion -> clasificaciones -> idTipo -> tipos_vehiculos)
      if (selectedType !== 'todos') {
        const c = clasificaciones.find((cl) => Number(cl.idClasificacion) === Number(v.idClasificacion));
        const t = tiposVehiculo.find((tp) => Number(tp.idTipo) === Number(c?.idTipo)) || c?.tipo;
        const tId = Number(t?.idTipo ?? c?.idTipo ?? v.idTipo ?? 1);
        const tipoU = tId === 1 ? 'motriz' : 'acoplado';
        if (tipoU !== selectedType) {
          return false;
        }
      }

      // Filtro por término de búsqueda (Placa, Marca, Modelo, Chasis, Código o Conductor)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesPlaca = v.placa.toLowerCase().includes(term);
        const matchesMarca = v.marca.toLowerCase().includes(term);
        const matchesModelo = v.modelo.toLowerCase().includes(term);
        const matchesVIN = v.numeroChasis.toLowerCase().includes(term);
        const matchesCodigo = v.codigoUnidad.toLowerCase().includes(term);
        const matchesConductor = v.telemetriaDetalle?.operador?.toLowerCase().includes(term) ?? false;
        const matchesClasificacion = (v.nombreClasificacion || v.clasificacion || '').toLowerCase().includes(term);
        const matchesTipo = (v.nombreTipo || '').toLowerCase().includes(term);

        if (
          !matchesPlaca &&
          !matchesMarca &&
          !matchesModelo &&
          !matchesVIN &&
          !matchesCodigo &&
          !matchesConductor &&
          !matchesClasificacion &&
          !matchesTipo
        ) {
          return false;
        }
      }

      return true;
    });
  }, [vehiculos, selectedTab, selectedType, selectedEstadoFilter, searchTerm, clasificaciones, tiposVehiculo]);

  // Paginación de la tabla
  const totalPages = Math.ceil(filteredVehiculos.length / itemsPerPage) || 1;
  const paginatedVehiculos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVehiculos.slice(start, start + itemsPerPage);
  }, [filteredVehiculos, currentPage, itemsPerPage]);

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = ['Unidad', 'Placa', 'Marca', 'Modelo', 'Año', 'Tipo', 'Clasificación', 'Estado', 'Operador', 'Odómetro'];
    const rows = filteredVehiculos.map((v) => [
      v.codigoUnidad,
      v.placa,
      v.marca,
      v.modelo,
      v.anio,
      v.nombreTipo || (v.idTipo === 1 ? 'Unidad Motora' : 'Acoplado'),
      v.nombreClasificacion || v.clasificacion,
      v.estadoTipo,
      v.telemetriaDetalle?.operador || 'Sin asignar',
      v.telemetriaDetalle?.odometro || 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_flota_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reiniciarFormulario = () => {
    setFotoArchivo(null);
    setQuitarFoto(false);
    setErrorFormulario(null);
  };

  const reemplazarVehiculo = (actualizado: Vehiculo) =>
    setVehiculos((prev) =>
      prev.map((item) => (item.idVehiculo === actualizado.idVehiculo ? actualizado : item))
    );

  const seleccionarFoto = (archivo: File) => {
    setFotoArchivo(archivo);
    setQuitarFoto(false);
  };

  const quitarFotoSeleccionada = () => {
    setFotoArchivo(null);
    setQuitarFoto(true);
  };

  // Crear vehículo
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.placa || !formData.marca || !formData.modelo) return;

    setGuardando(true);
    setErrorFormulario(null);

    let nuevo: Vehiculo;
    try {
      nuevo = await vehiculosService.createVehiculo(formData);
    } catch (err) {
      setErrorFormulario(getApiErrorMessage(err, 'No se pudo registrar el vehículo.'));
      setGuardando(false);
      return;
    }

    setVehiculos((prev) => [nuevo, ...prev]);
    setIsCreateModalOpen(false);

    const fotoPendiente = fotoArchivo;
    try {
      if (fotoPendiente) {
        reemplazarVehiculo(await vehiculosService.subirFoto(nuevo, fotoPendiente));
      }
      setFormData(initialFormData);
      reiniciarFormulario();
    } catch (err) {
      handleOpenEdit(nuevo);
      setFotoArchivo(fotoPendiente);
      setErrorFormulario(
        `El vehículo se registró, pero la foto no se pudo subir. ${getApiErrorMessage(err, '')}`.trim()
      );
    } finally {
      setGuardando(false);
    }
  };

  // Editar vehículo
  const handleOpenEdit = (v: Vehiculo) => {
    reiniciarFormulario();
    setActiveVehicle(v);
    setFormData({
      placa: v.placa,
      pais: v.pais,
      tipoUnidad: v.tipoUnidad,
      codigoUnidad: v.codigoUnidad,
      marca: v.marca,
      modelo: v.modelo,
      especificacionMotor: v.especificacionMotor || '',
      anio: v.anio,
      clasificacion: v.nombreClasificacion || v.clasificacion,
      idClasificacion: v.idClasificacion,
      idTipo: v.idTipo,
      numeroChasis: v.numeroChasis,
      numeroMotor: v.numeroMotor || '',
      capacidadCarga: v.capacidadCarga,
      capacidadArrastre: v.capacidadArrastre,
      estadoTipo: v.estadoTipo,
      ubicacion: v.telemetriaDetalle?.ubicacion || '',
    });
    setOpenActionMenuId(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVehicle) return;

    setGuardando(true);
    setErrorFormulario(null);
    try {
      let actualizado = await vehiculosService.updateVehiculo(activeVehicle.idVehiculo, formData);
      if (fotoArchivo) {
        actualizado = await vehiculosService.subirFoto(actualizado, fotoArchivo);
      } else if (quitarFoto && activeVehicle.foto) {
        actualizado = await vehiculosService.eliminarFoto(actualizado);
      }
      reemplazarVehiculo(actualizado);
      setIsEditModalOpen(false);
      setActiveVehicle(null);
      reiniciarFormulario();
    } catch (err) {
      setErrorFormulario(getApiErrorMessage(err, 'No se pudieron guardar los cambios.'));
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar vehículo
  const handleDeleteVehicle = async () => {
    if (!activeVehicle) return;
    try {
      await vehiculosService.deleteVehiculo(activeVehicle.idVehiculo);
      setVehiculos((prev) => prev.filter((item) => item.idVehiculo !== activeVehicle.idVehiculo));
      setIsDeleteModalOpen(false);
      setActiveVehicle(null);
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  // Programar a taller rápido
  const handleSetMaintenance = async (vehiculo: Vehiculo) => {
    try {
      const updated = await vehiculosService.updateVehiculo(vehiculo.idVehiculo, {
        placa: vehiculo.placa,
        pais: vehiculo.pais,
        tipoUnidad: vehiculo.tipoUnidad,
        codigoUnidad: vehiculo.codigoUnidad,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        anio: vehiculo.anio,
        clasificacion: vehiculo.clasificacion,
        numeroChasis: vehiculo.numeroChasis,
        capacidadCarga: vehiculo.capacidadCarga,
        capacidadArrastre: vehiculo.capacidadArrastre,
        estadoTipo: 'taller',
        ubicacion: 'Taller Central',
      });
      reemplazarVehiculo(updated);
      setIsMaintenanceModalOpen(false);
    } catch (err) {
      console.error('Error programando a taller:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-[1650px] mx-auto pb-16 font-sans antialiased text-slate-800">
      {/* ─── 1. TOP HEADER & TELEMETRÍA CONTROLS ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          {/* Header pill / badge */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-800">
              TELEMETRÍA Y CONTROL ACTIVO
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Centro de Control Operativo
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Supervisión en tiempo real de unidades activas, operadores, telemetría y mantenimiento preventivo.
          </p>
        </div>


        {/* Botón Primario Naranja */}
        <button
          type="button"
          onClick={() => {
            setFormData(initialFormData);
            reiniciarFormulario();
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm shadow-orange-500/25 transition select-none cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Registrar Vehículo</span>
        </button>
      </div>

      {/* ─── 2. TOP 4 KPI METRIC CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: UNIDADES ACTIVAS */}
        <Card className="p-4 rounded-2xl border border-slate-100/90 shadow-2xs flex flex-col justify-between hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              UNIDADES ACTIVAS
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 stroke-[2]" />
            </div>
          </div>

          <div className="mt-2 mb-2 flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {counts.unidadesActivas}
            </span>
            <span className="text-sm font-semibold text-slate-400">
              / {counts.total}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {counts.disponibilidadPorcentaje}% Disponibilidad
              </span>
              <span className="text-slate-400 font-medium">
                {counts.patio} en base
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Number(counts.disponibilidadPorcentaje))}%` }}
              />
            </div>
          </div>
        </Card>

        {/* KPI 2: OPERADORES EN TURNO */}
        <Card className="p-4 rounded-2xl border border-slate-100/90 shadow-2xs flex flex-col justify-between hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              OPERADORES EN TURNO
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 stroke-[2]" />
            </div>
          </div>

          <div className="mt-2 mb-2 flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {Math.max(1, counts.enRuta + 3)}
            </span>
            <span className="text-xs font-bold text-sky-600 ml-1">
              En cabina
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-bold text-sky-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                94% Puntualidad
              </span>
              <span className="text-slate-400 font-medium">
                4 en relevo
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full w-[94%]" />
            </div>
          </div>
        </Card>

        {/* KPI 3: KILOMETRAJE HOY */}
        <Card className="p-4 rounded-2xl border border-slate-100/90 shadow-2xs flex flex-col justify-between hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              KILOMETRAJE HOY
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Gauge className="w-4 h-4 stroke-[2]" />
            </div>
          </div>

          <div className="mt-2 mb-2 flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              14,820
            </span>
            <span className="text-xs font-semibold text-slate-400 ml-0.5">
              km
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-bold text-teal-600 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                +12.4% vs prom.
              </span>
              <span className="text-slate-400 font-medium">
                Odómetro global
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full w-[76%]" />
            </div>
          </div>
        </Card>

        {/* KPI 4: ALERTAS CRÍTICAS */}
        <Card className="p-4 rounded-2xl border border-slate-100/90 shadow-2xs flex flex-col justify-between hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ALERTAS CRÍTICAS
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 stroke-[2]" />
            </div>
          </div>

          <div className="mt-2 mb-2 flex items-baseline gap-1">
            <span className="text-3xl font-black text-orange-500 tracking-tight">
              {String(counts.taller).padStart(2, '0')}
            </span>
            <span className="text-xs font-semibold text-slate-400 ml-1">
              en taller
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Atención Inmediata
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedTab('taller');
                  setCurrentPage(1);
                }}
                className="text-slate-600 hover:text-orange-600 font-bold transition flex items-center gap-0.5 cursor-pointer"
              >
                Revisar &rarr;
              </button>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full w-[45%]" />
            </div>
          </div>
        </Card>
      </div>

      {/* ─── 3. MAIN DASHBOARD CONTENT: 2 COLUMNS ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ─── LEFT COLUMN: GESTIÓN DE UNIDADES Y FLOTA (8 COLUMNS) ─── */}
        <div className="xl:col-span-8">
          <Card className="rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-xs bg-white">
            {/* Header del bloque */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Gestión de Unidades y Flota
                </h2>
                <p className="text-xs text-slate-400 font-normal mt-0.5">
                  Monitoreo detallado de bitácora, odómetro y telemetría por vehículo
                </p>
              </div>

              {/* Status Pill Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Tab: Todos */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTab('todos');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${selectedTab === 'todos'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
                    }`}
                >
                  Todos ({counts.total})
                </button>

                {/* Tab: En Ruta */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTab('en_ruta');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${selectedTab === 'en_ruta'
                    ? 'bg-sky-50 text-sky-700 border border-sky-200/80 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
                    }`}
                >
                  En Ruta ({counts.enRuta})
                </button>

                {/* Tab: Disponibles */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTab('patio');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${selectedTab === 'patio'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
                    }`}
                >
                  Disponibles ({counts.patio})
                </button>

                {/* Tab: En Taller */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTab('taller');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${selectedTab === 'taller'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
                    }`}
                >
                  En Taller ({counts.taller})
                </button>

                {/* Tab: Detenidas */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTab('inactivo');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${selectedTab === 'inactivo'
                    ? 'bg-slate-200 text-slate-800 border border-slate-300 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
                    }`}
                >
                  Detenidas ({counts.inactivo})
                </button>
              </div>
            </div>

            {/* Search Bar & Action Buttons */}
            <div className="flex items-center gap-2.5 pb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Filtrar por placa, unidad o nombre de operador..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-200/80 text-slate-800 placeholder-slate-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter button */}
              <button
                type="button"
                title="Filtros avanzados"
                onClick={() => {
                  setSelectedType(selectedType === 'todos' ? 'motriz' : selectedType === 'motriz' ? 'acoplado' : 'todos');
                  setCurrentPage(1);
                }}
                className="p-2.5 bg-slate-50/80 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200/80 transition cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {/* Export button */}
              <button
                type="button"
                title="Descargar listado"
                onClick={handleExportCSV}
                className="p-2.5 bg-slate-50/80 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200/80 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto -mx-5 sm:-mx-6">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-b border-slate-100/90 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <TableHead className="py-3 px-6 text-left">UNIDAD / MODELO</TableHead>
                    <TableHead className="py-3 px-4 text-left">OPERADOR ASIGNADO</TableHead>
                    <TableHead className="py-3 px-4 text-left">ESTADO</TableHead>
                    <TableHead className="py-3 px-4 text-left">ODÓMETRO</TableHead>
                    <TableHead className="py-3 px-4 text-left">CLASIFICACIÓN</TableHead>
                    <TableHead className="py-3 px-4 text-left">PRÓX. SERVICIO</TableHead>
                    <TableHead className="py-3 px-6 text-right">ACCIÓN</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Activity className="w-6 h-6 animate-spin text-orange-500" />
                          <span className="text-xs font-semibold">Cargando unidades telemáticas...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedVehiculos.length === 0 ? (
                    <TableEmpty
                      colSpan={7}
                      message="No se encontraron vehículos"
                      description="Intenta ajustar el término de búsqueda o el filtro de estado seleccionado."
                      icon={<Truck className="w-8 h-8 stroke-[1.5]" />}
                    />
                  ) : (
                    paginatedVehiculos.map((v) => {
                      const combustible = v.telemetriaDetalle?.nivelCombustible ?? 75;
                      const isLowFuel = combustible <= 30;
                      const unitNumber = v.codigoUnidad.replace('#TR-', '').replace('#AC-', '');
                      const assignedDriver =
                        v.telemetriaDetalle?.operador ||
                        (v.conductoresHabituales && v.conductoresHabituales.length > 0
                          ? `${v.conductoresHabituales[0].nombres} ${v.conductoresHabituales[0].apellidos}`
                          : null);

                      // Relación BD: vehiculos.id_clasificacion -> clasificaciones_vehiculos.id_tipo -> tipos_vehiculos
                      // 1 = Unidad Motora (motor), 2 = Acoplado
                      const clasifInfo =
                        clasificaciones.find((c) => Number(c.idClasificacion) === Number(v.idClasificacion)) ||
                        v.clasificacionDetalle ||
                        clasificaciones.find(
                          (c) => c.nombreClasificacion?.toLowerCase() === (v.nombreClasificacion || v.clasificacion || '').toLowerCase()
                        );

                      const tipoInfo =
                        tiposVehiculo.find((t) => Number(t.idTipo) === Number(clasifInfo?.idTipo)) ||
                        clasifInfo?.tipo;

                      const idTipoVehiculo = Number(tipoInfo?.idTipo ?? clasifInfo?.idTipo ?? v.idTipo ?? 1);
                      const esUnidadMotriz = idTipoVehiculo === 1;
                      const nombreTipoVehiculo = tipoInfo?.nombreTipo || (esUnidadMotriz ? 'Unidad Motora' : 'Acoplado');
                      const nombreClasifVehiculo =
                        clasifInfo?.nombreClasificacion || v.nombreClasificacion || v.clasificacion || 'Sin clasificar';

                      return (
                        <TableRow
                          key={v.idVehiculo}
                          className="hover:bg-slate-50/80 transition-colors border-b border-slate-50"
                        >
                          {/* UNIDAD / MODELO */}
                          <TableCell className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              {/* Thumbnail / Unit Tag */}
                              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-800 flex items-center justify-center font-black text-[11px] shrink-0 overflow-hidden shadow-2xs">
                                {v.fotoUrl ? (
                                  <ImagenProtegida
                                    url={v.fotoUrl}
                                    alt={v.placa}
                                    className="w-full h-full object-cover"
                                    fallback={<span>{unitNumber || 'TR'}</span>}
                                  />
                                ) : (
                                  <span>{unitNumber || 'TR'}</span>
                                )}
                              </div>

                              <div>
                                <span className="font-extrabold text-xs text-slate-900 tracking-tight block">
                                  {v.placa}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium block">
                                  {v.marca} {v.modelo || ''}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* OPERADOR ASIGNADO */}
                          <TableCell className="py-3.5 px-4">
                            {assignedDriver ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {assignedDriver
                                    .split(' ')
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join('')}
                                </div>
                                <span className="font-bold text-xs text-slate-800">
                                  {assignedDriver}
                                </span>
                              </div>
                            ) : (
                              <span className="italic text-xs text-slate-400 font-medium">
                                Sin asignar
                              </span>
                            )}
                          </TableCell>

                          {/* ESTADO */}
                          <TableCell className="py-3.5 px-4">
                            {v.estadoTipo === 'en_ruta' && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>En Tránsito</span>
                              </span>
                            )}
                            {v.estadoTipo === 'patio' && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                <span>En Base</span>
                              </span>
                            )}
                            {v.estadoTipo === 'taller' && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-100/70 border border-amber-200 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                <span>Taller Central</span>
                              </span>
                            )}
                            {v.estadoTipo === 'inactivo' && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                <span>Detenido</span>
                              </span>
                            )}
                          </TableCell>

                          {/* ODÓMETRO */}
                          <TableCell className="py-3.5 px-4">
                            <span className="font-extrabold text-xs text-slate-900">
                              {v.telemetriaDetalle?.odometro?.replace(' km', '') || '184,320'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium ml-1">
                              km
                            </span>
                          </TableCell>

                          {/* CLASIFICACIÓN / TIPO (idTipo = 1 -> Truck verde / Unidad Motora, idTipo = 2 -> Container naranja / Acoplado) */}
                          <TableCell className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-2">
                              {esUnidadMotriz ? (
                                <div
                                  className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center shrink-0 text-emerald-600 shadow-2xs"
                                  title={nombreTipoVehiculo}
                                >
                                  <Truck className="w-4 h-4 text-emerald-600" />
                                </div>
                              ) : (
                                <div
                                  className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200/70 flex items-center justify-center shrink-0 text-orange-500 shadow-2xs"
                                  title={nombreTipoVehiculo}
                                >
                                  <Container className="w-4 h-4 text-orange-500" />
                                </div>
                              )}
                              <div>
                                <span className="text-xs font-bold text-slate-800 whitespace-nowrap block">
                                  {nombreClasifVehiculo}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400 block">
                                  {nombreTipoVehiculo}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* PRÓX. SERVICIO */}
                          <TableCell className="py-3.5 px-4">
                            {v.telemetriaDetalle?.proximoServicioEstado === 'urgente' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                <span>{v.telemetriaDetalle.proximoServicio}</span>
                              </span>
                            ) : v.telemetriaDetalle?.proximoServicioEstado === 'programado' ? (
                              <span className="inline-block text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/70 px-2 py-0.5 rounded-md">
                                Programado
                              </span>
                            ) : v.telemetriaDetalle?.proximoServicioEstado === 'vencido' ? (
                              <span className="text-[11px] font-black text-orange-600">
                                Vencido
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-600">
                                {v.telemetriaDetalle?.proximoServicio || 'en 4,100 km'}
                              </span>
                            )}
                          </TableCell>

                          {/* ACCIÓN (3 DOTS DROPDOWN) */}
                          <TableCell className="py-3.5 px-6 text-right relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionMenuId(openActionMenuId === v.idVehiculo ? null : v.idVehiculo)
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {openActionMenuId === v.idVehiculo && (
                              <div
                                ref={actionMenuRef}
                                className="absolute right-6 top-10 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 text-left animate-in fade-in zoom-in-95 duration-100"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveVehicle(v);
                                    setIsDetailModalOpen(true);
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Ver Telemetría</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleOpenEdit(v);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-orange-500" />
                                  <span>Editar Unidad</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSetMaintenance(v);
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2 transition"
                                >
                                  <Wrench className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Enviar a Taller</span>
                                </button>

                                <div className="my-1 border-t border-slate-100" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveVehicle(v);
                                    setIsDeleteModalOpen(true);
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Dar de Baja</span>
                                </button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination footer */}
            <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <span>
                Mostrando{' '}
                <strong className="text-slate-800 font-bold">
                  {filteredVehiculos.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                </strong>{' '}
                a{' '}
                <strong className="text-slate-800 font-bold">
                  {Math.min(currentPage * itemsPerPage, filteredVehiculos.length)}
                </strong>{' '}
                de <strong className="text-slate-800 font-bold">{filteredVehiculos.length}</strong>{' '}
                unidades registradas
              </span>

              {/* Botones de navegación */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition cursor-pointer ${page === currentPage
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* ─── RIGHT COLUMN: 2 SIDEBAR CARDS (4 COLUMNS) ─── */}
        <div className="xl:col-span-4 space-y-6">
          {/* ─── CARD 1: MANTENIMIENTO CRÍTICO ─── */}
          <Card className="rounded-3xl border border-slate-100 p-5 shadow-xs bg-white">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                  Mantenimiento Crítico
                </h3>
              </div>
              <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200/60 px-2.5 py-0.5 rounded-full">
                3 Prioritarios
              </span>
            </div>

            {/* List of critical items */}
            <div className="divide-y divide-slate-100 pt-1">
              {/* Item 1 */}
              <div className="py-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">
                    #TR-104 Cambio de Aceite & Filtros
                  </span>
                  <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md">
                    en 250 km
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Tracto Volvo FH 540
                </p>
                {/* Colored orange bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-orange-500 rounded-full w-[85%]" />
                </div>
              </div>

              {/* Item 2 */}
              <div className="py-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">
                    #TR-088 Desgaste Balatas y Frenos
                  </span>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    Programado
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Inspección de 2do eje
                </p>
                {/* Colored teal bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-teal-700 rounded-full w-[60%]" />
                </div>
              </div>

              {/* Item 3 */}
              <div className="py-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">
                    #TR-201 Calibración Sensores Inyección
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                    Alerta Amarilla
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Código ECU P0087
                </p>
                {/* Colored amber bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-amber-700 rounded-full w-[40%]" />
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsMaintenanceModalOpen(true)}
                className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-orange-500/25 transition cursor-pointer select-none"
              >
                <CalendarPlus className="w-4 h-4 stroke-[2.5]" />
                <span>Programar Ingreso a Taller</span>
              </button>
            </div>
          </Card>

          {/* ─── CARD 2: OPERADORES DESTACADOS ─── */}
          <Card className="rounded-3xl border border-slate-100 p-5 shadow-xs bg-white">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                  Operadores Destacados
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                Turno A
              </span>
            </div>

            {/* Operators List */}
            <div className="divide-y divide-slate-100">
              {/* Operator 1 */}
              <div className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-black text-xs flex items-center justify-center">
                      MC
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white font-bold text-[9px] flex items-center justify-center border border-white">
                      1
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      Miguel Ángel Cruz
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      0 frenados bruscos • 8.4h
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-teal-700 tracking-tight block">
                    99
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 block -mt-1 uppercase tracking-wider">
                    SCORE
                  </span>
                </div>
              </div>

              {/* Operator 2 */}
              <div className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-slate-700 text-white font-black text-xs flex items-center justify-center">
                      CM
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white font-bold text-[9px] flex items-center justify-center border border-white">
                      2
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      Carlos Mendoza
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Eco-Driving +14% • 7.2h
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-teal-700 tracking-tight block">
                    98
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 block -mt-1 uppercase tracking-wider">
                    SCORE
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── MODAL 1: REGISTRAR NUEVO VEHÍCULO ─── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Registrar Nuevo Vehículo en la Flota"
        description="Ingresa las especificaciones del nuevo vehículo o unidad de arrastre para habilitar su seguimiento."
        size="lg"
      >
        <form onSubmit={handleCreateVehicle} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <SelectorImagen
                etiqueta="Foto del vehículo (opcional)"
                archivo={fotoArchivo}
                quitada={quitarFoto}
                onSeleccionar={seleccionarFoto}
                onQuitar={quitarFotoSeleccionada}
              />
            </div>

            {/* Placa */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Placa / Matrícula *
              </label>
              <input
                type="text"
                required
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                placeholder="Ej. 872-AJ-4 o 6482-KPL"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-800 text-xs focus:bg-white focus:border-orange-500 outline-none"
              />
            </div>

            {/* Tipo de Unidad */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Tipo de Unidad *
              </label>
              <select
                value={formData.tipoUnidad}
                onChange={(e) => {
                  const t = e.target.value as TipoUnidad;
                  const isMotriz = t === 'motriz';
                  const targetTipoId = isMotriz ? 1 : 2;
                  const match = clasificaciones.find((c) => Number(c.idTipo) === targetTipoId);
                  const defaultClasif = match?.nombreClasificacion || (isMotriz ? 'Chuto' : 'Camion Volteo');
                  setFormData({
                    ...formData,
                    tipoUnidad: t,
                    pais: t === 'acoplado' ? 'ES-R' : 'ES',
                    clasificacion: defaultClasif,
                    idClasificacion: match?.idClasificacion ?? targetTipoId,
                    idTipo: targetTipoId,
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800 text-xs focus:bg-white focus:border-orange-500 outline-none"
              >
                <option value="motriz">Unidad Motora (Cabezal Tractor)</option>
                <option value="acoplado">Acoplado (Remolque / Semirremolque)</option>
              </select>
            </div>

            {/* Marca */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Marca *
              </label>
              <input
                type="text"
                required
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                placeholder="Ej. Volvo, Scania, Kenworth"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs focus:bg-white focus:border-orange-500 outline-none"
              />
            </div>

            {/* Modelo */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Modelo *
              </label>
              <input
                type="text"
                required
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                placeholder="Ej. FH 540 Globetrotter"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs focus:bg-white focus:border-orange-500 outline-none"
              />
            </div>

            {/* Año */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Año de Fabricación *
              </label>
              <input
                type="number"
                required
                min={1990}
                max={2030}
                value={formData.anio}
                onChange={(e) => setFormData({ ...formData, anio: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs focus:bg-white focus:border-orange-500 outline-none"
              />
            </div>

            {/* Clasificación */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Clasificación *
              </label>
              <select
                value={formData.clasificacion}
                onChange={(e) => {
                  const nombre = e.target.value;
                  const match = clasificaciones.find((c) => c.nombreClasificacion === nombre);
                  setFormData({
                    ...formData,
                    clasificacion: nombre,
                    idClasificacion: match?.idClasificacion,
                    idTipo: match?.idTipo,
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800 text-xs focus:bg-white focus:border-orange-500 outline-none"
              >
                {clasificaciones.length > 0 ? (
                  clasificaciones
                    .filter((c) =>
                      formData.tipoUnidad === 'motriz' ? Number(c.idTipo) === 1 : Number(c.idTipo) !== 1
                    )
                    .map((c) => (
                      <option key={c.idClasificacion} value={c.nombreClasificacion}>
                        {c.nombreClasificacion}
                      </option>
                    ))
                ) : formData.tipoUnidad === 'motriz' ? (
                  <>
                    <option value="Chuto">Chuto</option>
                    <option value="Cortinero">Cortinero</option>
                    <option value="Tractocamión 6x2">Tractocamión 6x2</option>
                  </>
                ) : (
                  <>
                    <option value="Camión Volteo">Camión Volteo</option>
                    <option value="Camion Volteo">Camion Volteo</option>
                    <option value="Cava">Cava</option>
                  </>
                )}
              </select>
            </div>

            {/* Chasis / VIN */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Número de Chasis (VIN) *
              </label>
              <input
                type="text"
                required
                value={formData.numeroChasis}
                onChange={(e) =>
                  setFormData({ ...formData, numeroChasis: e.target.value.toUpperCase() })
                }
                placeholder="Ej. YV2RT40A8PA109284"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono text-slate-800 text-xs focus:bg-white focus:border-orange-500 outline-none"
              />
            </div>

            {/* Número de Motor */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Número de Motor
              </label>
              <input
                type="text"
                value={formData.numeroMotor || ''}
                onChange={(e) => setFormData({ ...formData, numeroMotor: e.target.value })}
                placeholder="Ej. D13TC-1049281"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs focus:bg-white focus:border-orange-500 outline-none"
              />
            </div>

            {/* Estado Inicial */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Estado Inicial *
              </label>
              <select
                value={formData.estadoTipo}
                onChange={(e) =>
                  setFormData({ ...formData, estadoTipo: e.target.value as EstadoUnidad })
                }
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800 text-xs focus:bg-white focus:border-orange-500 outline-none"
              >
                <option value="patio">Activo en Patio</option>
                <option value="en_ruta">En Tránsito / Ruta</option>
                <option value="taller">En Taller Preventivo</option>
                <option value="inactivo">Detenido / Inactivo</option>
              </select>
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Ubicación / Muelle
              </label>
              <input
                type="text"
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                placeholder="Ej. Base Logística Valencia"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs focus:bg-white focus:border-orange-500 outline-none"
              />
            </div>
          </div>

          {errorFormulario && (
            <p className="text-[11px] font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {errorFormulario}
            </p>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar Unidad'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 2: FICHA TELEMÁTICA DE LA UNIDAD ─── */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setActiveVehicle(null);
        }}
        title={
          activeVehicle ? (
            <div className="flex items-center gap-2.5">
              <span>{activeVehicle.marca} {activeVehicle.modelo}</span>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
                {activeVehicle.placa}
              </span>
            </div>
          ) : (
            'Ficha Telemática de la Unidad'
          )
        }
        description="Parámetros en tiempo real, bitácora de telemetría y especificaciones de tren motriz."
        size="lg"
      >
        {activeVehicle && (
          <div className="space-y-4">
            {activeVehicle.fotoUrl && (
              <ImagenProtegida
                url={activeVehicle.fotoUrl}
                alt={activeVehicle.placa}
                className="w-full h-52 object-cover rounded-2xl border border-slate-200"
              />
            )}

            {/* Overview Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-100/70 border border-orange-200 text-orange-800 flex items-center justify-center font-black text-sm">
                  {activeVehicle.codigoUnidad}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {activeVehicle.marca} {activeVehicle.modelo}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {(() => {
                      const activeClasif =
                        clasificaciones.find((c) => Number(c.idClasificacion) === Number(activeVehicle.idClasificacion)) ||
                        activeVehicle.clasificacionDetalle;
                      const activeTipo =
                        tiposVehiculo.find((t) => Number(t.idTipo) === Number(activeClasif?.idTipo)) ||
                        activeClasif?.tipo;
                      const activeIdTipo = Number(activeTipo?.idTipo ?? activeClasif?.idTipo ?? activeVehicle.idTipo ?? 1);
                      const activeTipoNombre = activeTipo?.nombreTipo || (activeIdTipo === 1 ? 'Unidad Motora' : 'Acoplado');
                      const activeClasifNombre = activeClasif?.nombreClasificacion || activeVehicle.nombreClasificacion || activeVehicle.clasificacion;
                      return `${activeClasifNombre} (${activeTipoNombre}) • Fabricación ${activeVehicle.anio}`;
                    })()}
                  </p>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  ESTADO TELEMÉTRICO
                </span>
                <span className="inline-block text-xs font-bold text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-xl shadow-2xs">
                  {activeVehicle.estadoTelemetrico}
                </span>
              </div>
            </div>

            {/* Telemetry live cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
                  <Gauge className="w-3.5 h-3.5 text-sky-500" />
                  <span>Velocidad</span>
                </div>
                <span className="text-sm font-black text-slate-800">
                  {activeVehicle.telemetriaDetalle?.velocidad || '0 km/h'}
                </span>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
                  <Fuel className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Combustible</span>
                </div>
                <span className="text-sm font-black text-slate-800">
                  {activeVehicle.telemetriaDetalle?.nivelCombustible ?? 78}%
                </span>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
                  <Activity className="w-3.5 h-3.5 text-orange-500" />
                  <span>Odómetro</span>
                </div>
                <span className="text-sm font-black text-slate-800">
                  {activeVehicle.telemetriaDetalle?.odometro || '184,320 km'}
                </span>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Último Reporte</span>
                </div>
                <span className="text-sm font-black text-slate-800">
                  {activeVehicle.telemetriaDetalle?.ultimoReporte || 'En tiempo real'}
                </span>
              </div>
            </div>

            {/* Technical specs */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs">
              <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-700 border-b border-slate-100">
                Ficha Técnica & Vinculación
              </div>
              <div className="divide-y divide-slate-100 bg-white">
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-slate-400">Tipo de Unidad:</span>
                  <span className="font-semibold text-slate-800">
                    {(() => {
                      const activeClasif =
                        clasificaciones.find((c) => Number(c.idClasificacion) === Number(activeVehicle.idClasificacion)) ||
                        activeVehicle.clasificacionDetalle;
                      const activeTipo =
                        tiposVehiculo.find((t) => Number(t.idTipo) === Number(activeClasif?.idTipo)) ||
                        activeClasif?.tipo;
                      const activeIdTipo = Number(activeTipo?.idTipo ?? activeClasif?.idTipo ?? activeVehicle.idTipo ?? 1);
                      return activeTipo?.nombreTipo || (activeIdTipo === 1 ? 'Unidad Motora' : 'Acoplado');
                    })()}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-slate-400">Clasificación:</span>
                  <span className="font-bold text-slate-800">
                    {(() => {
                      const activeClasif =
                        clasificaciones.find((c) => Number(c.idClasificacion) === Number(activeVehicle.idClasificacion)) ||
                        activeVehicle.clasificacionDetalle;
                      return activeClasif?.nombreClasificacion || activeVehicle.nombreClasificacion || activeVehicle.clasificacion;
                    })()}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-slate-400">Número de Chasis (VIN):</span>
                  <span className="font-mono font-bold text-slate-800">{activeVehicle.numeroChasis}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-slate-400">Número de Motor:</span>
                  <span className="font-semibold text-slate-800">{activeVehicle.numeroMotor || 'N/A'}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-slate-400">Capacidad Carga / Arrastre:</span>
                  <span className="font-semibold text-slate-800">
                    {activeVehicle.capacidadCarga.toLocaleString()} kg / {activeVehicle.capacidadArrastre.toLocaleString()} kg
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-slate-400">Operador Asignado:</span>
                  <span className="font-semibold text-slate-800">
                    {activeVehicle.telemetriaDetalle?.operador || 'Sin operador asignado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── MODAL 3: EDITAR VEHÍCULO ─── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setActiveVehicle(null);
        }}
        title="Modificar Datos de Unidad"
        description="Actualiza la información técnica o el estado telemático del vehículo."
        size="lg"
      >
        <form onSubmit={handleUpdateVehicle} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <SelectorImagen
                etiqueta="Foto del vehículo"
                urlActual={activeVehicle?.fotoUrl}
                archivo={fotoArchivo}
                quitada={quitarFoto}
                onSeleccionar={seleccionarFoto}
                onQuitar={quitarFotoSeleccionada}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Placa
              </label>
              <input
                type="text"
                required
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-800 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Estado
              </label>
              <select
                value={formData.estadoTipo}
                onChange={(e) =>
                  setFormData({ ...formData, estadoTipo: e.target.value as EstadoUnidad })
                }
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800 text-xs outline-none"
              >
                <option value="patio">Activo en Patio</option>
                <option value="en_ruta">En Tránsito</option>
                <option value="taller">En Taller</option>
                <option value="inactivo">Detenido</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Marca
              </label>
              <input
                type="text"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Modelo
              </label>
              <input
                type="text"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Clasificación
              </label>
              <select
                value={formData.clasificacion}
                onChange={(e) => {
                  const nombre = e.target.value;
                  const match = clasificaciones.find((c) => c.nombreClasificacion === nombre);
                  setFormData({
                    ...formData,
                    clasificacion: nombre,
                    idClasificacion: match?.idClasificacion,
                    idTipo: match?.idTipo,
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800 text-xs outline-none"
              >
                {clasificaciones.length > 0 ? (
                  clasificaciones.map((c) => (
                    <option key={c.idClasificacion} value={c.nombreClasificacion}>
                      {c.nombreClasificacion} ({Number(c.idTipo) === 1 ? 'Unidad Motora' : 'Acoplado'})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Chuto">Chuto (Unidad Motora)</option>
                    <option value="Cortinero">Cortinero (Unidad Motora)</option>
                    <option value="Camion Volteo">Camion Volteo (Acoplado)</option>
                    <option value="Cava">Cava (Acoplado)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Año
              </label>
              <input
                type="number"
                value={formData.anio}
                onChange={(e) => setFormData({ ...formData, anio: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs outline-none"
              />
            </div>
          </div>

          {errorFormulario && (
            <p className="text-[11px] font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {errorFormulario}
            </p>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 4: CONFIRMAR ELIMINACIÓN ─── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setActiveVehicle(null);
        }}
        title="Confirmar Baja de Vehículo"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            ¿Estás seguro de que deseas retirar la unidad con placa{' '}
            <strong className="text-slate-900 font-bold">{activeVehicle?.placa}</strong> (
            {activeVehicle?.marca} {activeVehicle?.modelo}) del sistema?
          </p>
          <p className="text-[11px] text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
            Esta acción removerá el vehículo de la supervisión activa de telemetría.
          </p>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="danger" size="sm" type="button" onClick={handleDeleteVehicle}>
              Confirmar Baja
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── MODAL 5: PROGRAMAR INGRESO A TALLER ─── */}
      <Modal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        title="Programar Ingreso a Mantenimiento"
        description="Selecciona una unidad de la flota para registrar su orden de servicio e ingreso a taller."
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Seleccionar Unidad
            </label>
            <select
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800 text-xs focus:bg-white focus:border-orange-500 outline-none"
              onChange={(e) => {
                const found = vehiculos.find((v) => v.idVehiculo === e.target.value);
                if (found) setActiveVehicle(found);
              }}
              defaultValue=""
            >
              <option value="" disabled>Selecciona un vehículo...</option>
              {vehiculos.map((v) => (
                <option key={v.idVehiculo} value={v.idVehiculo}>
                  {v.codigoUnidad} • {v.placa} ({v.marca} {v.modelo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Tipo de Servicio
            </label>
            <select className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800 text-xs focus:bg-white focus:border-orange-500 outline-none">
              <option>Cambio de Aceite & Filtros Preventivo</option>
              <option>Inspección de Balatas y Frenos</option>
              <option>Calibración Sensores de Inyección</option>
              <option>Revisión Sistema Neumático</option>
              <option>Mantenimiento Mayor</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Observaciones / Bitácora
            </label>
            <textarea
              rows={3}
              placeholder="Detalles sobre ruidos, códigos ECU o diagnóstico..."
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs focus:bg-white focus:border-orange-500 outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsMaintenanceModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={() => {
                if (activeVehicle) {
                  handleSetMaintenance(activeVehicle);
                } else {
                  setIsMaintenanceModalOpen(false);
                }
              }}
            >
              Programar Ingreso
            </Button>
          </div>
        </div>
      </Modal>
    </div >
  );
}