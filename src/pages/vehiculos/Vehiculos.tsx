import React, { useState, useMemo, useEffect } from 'react';
import {
  Truck,
  Container,
  Search,
  Download,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Building2,
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
  Radio,
  X,
  FileSpreadsheet,
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
} from '../../services/vehiculosService';
import { getApiErrorMessage } from '../../services/api';

type FilterTab = 'todos' | 'patio' | 'en_ruta' | 'taller' | 'inactivo';

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'todos' | 'motriz' | 'acoplado'>('todos');
  const [selectedTab, setSelectedTab] = useState<FilterTab>('todos');
  const [selectedLocation, setSelectedLocation] = useState('Patio Central Valencia (P-01)');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState<Vehiculo | null>(null);

  // Foto y estado de guardado de los formularios
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
    clasificacion: 'Tractocamión 6x2',
    numeroChasis: '',
    numeroMotor: '',
    capacidadCarga: 25000,
    capacidadArrastre: 44000,
    estadoTipo: 'patio',
    ubicacion: 'Patio Central Valencia (P-01)',
  };

  const [formData, setFormData] = useState<VehiculoFormData>(initialFormData);

  // Cargar datos
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await vehiculosService.getVehiculos();
        setVehiculos(data);
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
    const motrices = vehiculos.filter((v) => v.tipoUnidad === 'motriz').length;
    const acoplados = vehiculos.filter((v) => v.tipoUnidad === 'acoplado').length;

    return { total, patio, enRuta, taller, inactivo, motrices, acoplados };
  }, [vehiculos]);

  // Filtrado reactivo
  const filteredVehiculos = useMemo(() => {
    return vehiculos.filter((v) => {
      // Filtro por Tab de Estado
      if (selectedTab !== 'todos' && v.estadoTipo !== selectedTab) {
        return false;
      }

      // Filtro por Tipo (Motriz vs Acoplado)
      if (selectedType !== 'todos' && v.tipoUnidad !== selectedType) {
        return false;
      }

      // Filtro por término de búsqueda (Placa, Marca, Modelo, Chasis/VIN)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesPlaca = v.placa.toLowerCase().includes(term);
        const matchesMarca = v.marca.toLowerCase().includes(term);
        const matchesModelo = v.modelo.toLowerCase().includes(term);
        const matchesVIN = v.numeroChasis.toLowerCase().includes(term);
        const matchesCodigo = v.codigoUnidad.toLowerCase().includes(term);
        if (!matchesPlaca && !matchesMarca && !matchesModelo && !matchesVIN && !matchesCodigo) {
          return false;
        }
      }

      return true;
    });
  }, [vehiculos, selectedTab, selectedType, searchTerm]);

  // Paginación de la tabla
  const totalPages = Math.ceil(filteredVehiculos.length / itemsPerPage) || 1;
  const paginatedVehiculos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVehiculos.slice(start, start + itemsPerPage);
  }, [filteredVehiculos, currentPage, itemsPerPage]);

  // Manejo de Selección Múltiple
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedVehicles(filteredVehiculos.map((v) => v.idVehiculo));
    } else {
      setSelectedVehicles([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Placa', 'Tipo', 'Código', 'Marca', 'Modelo', 'Año', 'Clasificación', 'VIN', 'Estado'];
    const rows = filteredVehiculos.map((v) => [
      v.idVehiculo,
      v.placa,
      v.tipoUnidad,
      v.codigoUnidad,
      v.marca,
      v.modelo,
      v.anio,
      v.clasificacion,
      v.numeroChasis,
      v.estadoTelemetrico,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `flota_vehiculos_${new Date().toISOString().slice(0, 10)}.csv`);
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
      // El vehículo ya existe: se abre en edición para reintentar solo la foto
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
      clasificacion: v.clasificacion,
      numeroChasis: v.numeroChasis,
      numeroMotor: v.numeroMotor || '',
      capacidadCarga: v.capacidadCarga,
      capacidadArrastre: v.capacidadArrastre,
      estadoTipo: v.estadoTipo,
      ubicacion: v.telemetriaDetalle?.ubicacion || '',
    });
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

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans antialiased text-slate-800">
      {/* ─── 1. HEADER SECTION & KPI METRICS ─── */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
        <div>
          {/* Breadcrumb / Top subtitle tag */}
          <div className="flex items-center gap-2 mb-1.5 text-[11px] uppercase tracking-wider font-semibold">
            <span className="text-amber-700 font-bold">MÓDULO ERP CENTRAL</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400 font-medium">Base Logística Valencia - HUB 01</span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Gestión de Flota y Vehículos
          </h1>

          {/* Detailed summary */}
          <p className="text-xs lg:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Supervisión telemática integral de{' '}
            <span className="font-bold text-slate-800">
              {counts.total || 48} Unidades registradas
            </span>
            :{' '}
            <span className="font-bold text-amber-800">
              {counts.motrices || 34} Unidades Motoras
            </span>{' '}
            (Cabezales pesados) y{' '}
            <span className="font-bold text-emerald-700">
              {counts.acoplados || 14} Acoplados
            </span>{' '}
            (Tolvas y plataformas).
          </p>
        </div>

        {/* 4 Mini KPI Cards at Top Right */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          {/* KPI 1: DISPONIBILIDAD */}
          <div className="bg-white/80 backdrop-blur-xs border border-slate-200/80 rounded-2xl p-3 shadow-2xs min-w-[110px] flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              DISPONIBILIDAD
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg lg:text-xl font-black text-emerald-600 tracking-tight">
                93.8%
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
            </div>
          </div>

          {/* KPI 2: EN CARRETERA */}
          <div className="bg-white/80 backdrop-blur-xs border border-slate-200/80 rounded-2xl p-3 shadow-2xs min-w-[110px] flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              EN CARRETERA
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg lg:text-xl font-black text-sky-600 tracking-tight">
                {counts.enRuta || 12}
              </span>
              <span className="text-[11px] font-bold text-sky-600/70">Unds</span>
            </div>
          </div>

          {/* KPI 3: MANTENIMIENTO */}
          <div className="bg-white/80 backdrop-blur-xs border border-slate-200/80 rounded-2xl p-3 shadow-2xs min-w-[110px] flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              MANTENIMIENTO
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg lg:text-xl font-black text-amber-700 tracking-tight">
                {String(counts.taller || 5).padStart(2, '0')}
              </span>
              <span className="text-[11px] font-bold text-amber-700/70">Taller</span>
            </div>
          </div>

          {/* KPI 4: CONSUMO PROM */}
          <div className="bg-white/80 backdrop-blur-xs border border-slate-200/80 rounded-2xl p-3 shadow-2xs min-w-[110px] flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              CONSUMO PROM.
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg lg:text-xl font-black text-slate-800 tracking-tight">
                32.4
              </span>
              <span className="text-[10px] font-medium text-slate-400">L/100km</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. CONTROLS & ACTION FILTERS BAR ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filtrar por placa, modelo o VIN..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white rounded-xl border border-slate-200/80 shadow-2xs text-slate-800 placeholder-slate-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 bg-slate-100 px-1.5 py-0.5 rounded select-none">
                /
              </span>
            )}
          </div>

          {/* Vehicle Type Dropdown */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as any);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white text-xs font-semibold text-slate-700 pl-3.5 pr-8 py-2 rounded-xl border border-slate-200/80 shadow-2xs outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="todos">Tipo: Todos los Vehículos</option>
              <option value="motriz">Unidades Motoras (Cabezales)</option>
              <option value="acoplado">Acoplados (Tolvas / Remolques)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Location Selector Chip */}
          <div className="flex items-center gap-1.5 bg-white text-xs font-semibold text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs cursor-default">
            <span>{selectedLocation}</span>
            <Building2 className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Export XLS / CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-xs font-bold text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar XLS / CSV</span>
          </button>

          {/* + Registrar Nuevo Vehículo */}
          <button
            type="button"
            onClick={() => {
              setFormData(initialFormData);
              reiniciarFormulario();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm shadow-orange-500/25 transition select-none"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Nuevo Vehículo</span>
          </button>
        </div>
      </div>

      {/* ─── 3. STATUS PILL FILTER TABS ─── */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Tab: Todos */}
        <button
          type="button"
          onClick={() => {
            setSelectedTab('todos');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition select-none ${
            selectedTab === 'todos'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/70'
          }`}
        >
          <span>Todos ({counts.total})</span>
        </button>

        {/* Tab: Activo en Patio */}
        <button
          type="button"
          onClick={() => {
            setSelectedTab('patio');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition select-none ${
            selectedTab === 'patio'
              ? 'bg-emerald-700 text-white shadow-xs font-bold'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/70'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              selectedTab === 'patio' ? 'bg-white' : 'bg-emerald-500'
            }`}
          />
          <span>Activo en Patio ({counts.patio})</span>
        </button>

        {/* Tab: En Ruta */}
        <button
          type="button"
          onClick={() => {
            setSelectedTab('en_ruta');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition select-none ${
            selectedTab === 'en_ruta'
              ? 'bg-sky-700 text-white shadow-xs font-bold'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/70'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              selectedTab === 'en_ruta' ? 'bg-white' : 'bg-sky-500'
            }`}
          />
          <span>En Ruta ({counts.enRuta})</span>
        </button>

        {/* Tab: Taller Preventivo */}
        <button
          type="button"
          onClick={() => {
            setSelectedTab('taller');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition select-none ${
            selectedTab === 'taller'
              ? 'bg-amber-700 text-white shadow-xs font-bold'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/70'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              selectedTab === 'taller' ? 'bg-white' : 'bg-amber-500'
            }`}
          />
          <span>Taller Preventivo ({counts.taller})</span>
        </button>

        {/* Tab: Inactivo */}
        <button
          type="button"
          onClick={() => {
            setSelectedTab('inactivo');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition select-none ${
            selectedTab === 'inactivo'
              ? 'bg-slate-600 text-white shadow-xs font-bold'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/70'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              selectedTab === 'inactivo' ? 'bg-white' : 'bg-slate-400'
            }`}
          />
          <span>Inactivo ({counts.inactivo})</span>
        </button>
      </div>

      {/* ─── 4. VEHICLES DATA TABLE ─── */}
      <Card className="overflow-hidden border border-slate-200/70 shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
              {/* Checkbox All */}
              <TableHead className="w-10 pl-5 pr-2">
                <input
                  type="checkbox"
                  checked={
                    paginatedVehiculos.length > 0 &&
                    paginatedVehiculos.every((v) => selectedVehicles.includes(v.idVehiculo))
                  }
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-orange-500 focus:ring-orange-500/20 w-4 h-4 cursor-pointer"
                />
              </TableHead>

              <TableHead className="text-[10px] font-bold tracking-wider text-slate-400 uppercase py-3.5">
                IDENTIFICACIÓN / PLACA
              </TableHead>

              <TableHead className="text-[10px] font-bold tracking-wider text-slate-400 uppercase py-3.5">
                MARCA & MODELO
              </TableHead>

              <TableHead className="text-[10px] font-bold tracking-wider text-slate-400 uppercase py-3.5">
                AÑO
              </TableHead>

              <TableHead className="text-[10px] font-bold tracking-wider text-slate-400 uppercase py-3.5">
                TIPO / CLASIFICACIÓN
              </TableHead>

              <TableHead className="text-[10px] font-bold tracking-wider text-slate-400 uppercase py-3.5">
                NÚMERO DE CHASIS (VIN)
              </TableHead>

              <TableHead className="text-[10px] font-bold tracking-wider text-slate-400 uppercase py-3.5 text-center">
                ESTADO TELEMÉTRICO
              </TableHead>

              <TableHead className="text-[10px] font-bold tracking-wider text-slate-400 uppercase py-3.5 pr-5 text-right">
                ACCIONES
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Activity className="w-6 h-6 animate-spin text-orange-500" />
                    <span className="text-xs font-semibold">Cargando flota telemática...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedVehiculos.length === 0 ? (
              <TableEmpty
                colSpan={8}
                message="No se encontraron vehículos"
                description="Intenta modificar los filtros de búsqueda o el tipo de unidad seleccionado."
                icon={<Truck className="w-8 h-8 stroke-[1.5]" />}
              />
            ) : (
              paginatedVehiculos.map((v) => {
                const isSelected = selectedVehicles.includes(v.idVehiculo);
                const isMotriz = v.tipoUnidad === 'motriz';

                return (
                  <TableRow
                    key={v.idVehiculo}
                    className={`transition-colors ${isSelected ? 'bg-orange-50/40' : ''}`}
                  >
                    {/* Checkbox Single */}
                    <TableCell className="w-10 pl-5 pr-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(v.idVehiculo)}
                        className="rounded border-slate-300 text-orange-500 focus:ring-orange-500/20 w-4 h-4 cursor-pointer"
                      />
                    </TableCell>

                    {/* Identificación / Placa */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        {/* Icon Box */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border ${
                            isMotriz
                              ? 'bg-amber-50/80 border-amber-200/60 text-amber-700'
                              : 'bg-emerald-50/80 border-emerald-200/60 text-emerald-700'
                          }`}
                        >
                          <ImagenProtegida
                            url={v.fotoUrl}
                            alt={`Foto del vehículo ${v.placa}`}
                            className="w-full h-full object-cover"
                            fallback={
                              isMotriz ? (
                                <Truck className="w-5 h-5 stroke-[1.8]" />
                              ) : (
                                <Container className="w-5 h-5 stroke-[1.8]" />
                              )
                            }
                          />
                        </div>

                        {/* Placa + Code */}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                              {v.placa}
                            </span>
                            <span
                              className={`text-[9px] font-black px-1 py-0.2 rounded border ${
                                v.pais === 'ES-R'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {v.pais}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                v.estadoTipo === 'en_ruta'
                                  ? 'bg-sky-500'
                                  : v.estadoTipo === 'patio'
                                  ? 'bg-emerald-500'
                                  : v.estadoTipo === 'taller'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            <span className="text-[11px] font-medium text-slate-400">
                              {v.codigoUnidad}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Marca & Modelo */}
                    <TableCell className="py-3.5">
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">
                          {v.marca} {v.modelo}
                        </span>
                        {v.especificacionMotor && (
                          <span className="text-[11px] text-slate-400 font-normal leading-none block mt-0.5">
                            {v.especificacionMotor}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Año */}
                    <TableCell className="py-3.5">
                      <span className="text-xs font-bold text-slate-700">{v.anio}</span>
                    </TableCell>

                    {/* Tipo / Clasificación */}
                    <TableCell className="py-3.5">
                      <span className="inline-block text-[11px] font-semibold text-slate-700 bg-slate-100/90 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                        {v.clasificacion}
                      </span>
                    </TableCell>

                    {/* Número de Chasis (VIN) */}
                    <TableCell className="py-3.5">
                      <span className="font-mono text-[11px] font-medium text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded border border-slate-200/50">
                        {v.numeroChasis}
                      </span>
                    </TableCell>

                    {/* Estado Telemétrico */}
                    <TableCell className="py-3.5 text-center">
                      {v.estadoTipo === 'en_ruta' && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-800 bg-sky-100/80 border border-sky-200/70 px-3 py-1 rounded-full">
                          <Radio className="w-3 h-3 text-sky-600 animate-pulse" />
                          <span>{v.estadoTelemetrico}</span>
                        </span>
                      )}

                      {v.estadoTipo === 'patio' && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200/70 px-3 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>{v.estadoTelemetrico}</span>
                        </span>
                      )}

                      {v.estadoTipo === 'taller' && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-100/80 border border-amber-200/70 px-3 py-1 rounded-full">
                          <Wrench className="w-3 h-3 text-amber-700" />
                          <span>{v.estadoTelemetrico}</span>
                        </span>
                      )}

                      {v.estadoTipo === 'inactivo' && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>{v.estadoTelemetrico}</span>
                        </span>
                      )}
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="py-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Ver Detalle */}
                        <button
                          type="button"
                          title="Ver telemetría y detalles"
                          onClick={() => {
                            setActiveVehicle(v);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Editar */}
                        <button
                          type="button"
                          title="Editar unidad"
                          onClick={() => handleOpenEdit(v)}
                          className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Eliminar */}
                        <button
                          type="button"
                          title="Eliminar vehículo"
                          onClick={() => {
                            setActiveVehicle(v);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* ─── 5. PAGINATION & SUMMARY FOOTER ─── */}
        <div className="p-4 sm:px-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              Mostrando{' '}
              <strong className="text-slate-800 font-bold">
                {filteredVehiculos.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
              </strong>{' '}
              a{' '}
              <strong className="text-slate-800 font-bold">
                {Math.min(currentPage * itemsPerPage, filteredVehiculos.length)}
              </strong>{' '}
              de{' '}
              <strong className="text-slate-800 font-bold">{filteredVehiculos.length}</strong>{' '}
              vehículos registrados
            </span>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5">
              <span>Filas por página:</span>
              <div className="relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-slate-100/80 font-bold text-slate-700 pl-2 pr-6 py-1 rounded-md border border-slate-200/60 outline-none cursor-pointer"
                >
                  <option value={6}>6</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200/80 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition ${
                  page === currentPage
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200/80 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

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
                placeholder="Ej. 6482-KPL o R-8831-BD"
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
                  const t = e.target.value as 'motriz' | 'acoplado';
                  setFormData({
                    ...formData,
                    tipoUnidad: t,
                    pais: t === 'acoplado' ? 'ES-R' : 'ES',
                    clasificacion: t === 'motriz' ? 'Tractocamión 6x2' : 'Semirremolque Lona 13.6m',
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
                placeholder="Ej. Volvo, Scania, Kenworth, Fruehauf"
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
                placeholder="Ej. FH 500 Globetrotter"
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
                onChange={(e) => setFormData({ ...formData, clasificacion: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800 text-xs focus:bg-white focus:border-orange-500 outline-none"
              >
                {formData.tipoUnidad === 'motriz' ? (
                  <>
                    <option value="Tractocamión 6x2">Tractocamión 6x2</option>
                    <option value="Tractocamión 6x4">Tractocamión 6x4</option>
                    <option value="Tractocamión 4x2">Tractocamión 4x2</option>
                    <option value="Rígido 3 Ejes">Rígido 3 Ejes</option>
                  </>
                ) : (
                  <>
                    <option value="Góndola Volquete 3 Ejes">Góndola Volquete 3 Ejes</option>
                    <option value="Caja Frigorífica 13.6m">Caja Frigorífica 13.6m</option>
                    <option value="Semirremolque Lona 13.6m">Semirremolque Lona 13.6m</option>
                    <option value="Plataforma Portacontenedor">Plataforma Portacontenedor</option>
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
                Número de Motor (Opcional)
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
                <option value="en_ruta">En Ruta</option>
                <option value="taller">Taller Preventivo</option>
                <option value="inactivo">Inactivo / Reserva</option>
              </select>
            </div>

            {/* Ubicación Inicial */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Ubicación / Muelle
              </label>
              <input
                type="text"
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                placeholder="Ej. Patio Central Valencia (Muelle B-02)"
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

      {/* ─── MODAL 2: DETALLES DE UNIDAD & TELEMETRÍA ─── */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setActiveVehicle(null);
        }}
        title={
          activeVehicle ? (
            <div className="flex items-center gap-2.5">
              <span>
                {activeVehicle.marca} {activeVehicle.modelo}
              </span>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
                {activeVehicle.placa}
              </span>
            </div>
          ) : (
            'Ficha Telemática de la Unidad'
          )
        }
        description="Parámetros en tiempo real, especificaciones de tren motriz y telemetría activa."
        size="lg"
      >
        {activeVehicle && (
          <div className="space-y-5">
            {activeVehicle.fotoUrl && (
              <ImagenProtegida
                url={activeVehicle.fotoUrl}
                alt={`Foto del vehículo ${activeVehicle.placa}`}
                className="w-full h-56 object-cover rounded-2xl border border-slate-200"
              />
            )}

            {/* Status overview banner */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                    activeVehicle.tipoUnidad === 'motriz'
                      ? 'bg-amber-100/70 border-amber-300/60 text-amber-800'
                      : 'bg-emerald-100/70 border-emerald-300/60 text-emerald-800'
                  }`}
                >
                  {activeVehicle.tipoUnidad === 'motriz' ? (
                    <Truck className="w-6 h-6 stroke-[1.8]" />
                  ) : (
                    <Container className="w-6 h-6 stroke-[1.8]" />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {activeVehicle.codigoUnidad}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {activeVehicle.clasificacion} • Fabricación {activeVehicle.anio}
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

            {/* Telemetry live stats */}
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
                  {activeVehicle.telemetriaDetalle?.nivelCombustible ?? 85}%
                </span>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
                  <Activity className="w-3.5 h-3.5 text-orange-500" />
                  <span>Odómetro</span>
                </div>
                <span className="text-sm font-black text-slate-800">
                  {activeVehicle.telemetriaDetalle?.odometro || '115,200 km'}
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

            {/* Detailed specs table */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs">
              <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-700 border-b border-slate-100">
                Ficha Técnica & Vinculación
              </div>
              <div className="divide-y divide-slate-100 bg-white">
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-slate-400">Número de Chasis (VIN):</span>
                  <span className="font-mono font-bold text-slate-800">
                    {activeVehicle.numeroChasis}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-slate-400">Especificación Motor / Frío:</span>
                  <span className="font-semibold text-slate-800">
                    {activeVehicle.especificacionMotor || 'N/A'}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-slate-400">Ubicación GPS:</span>
                  <span className="font-semibold text-slate-800">
                    {activeVehicle.telemetriaDetalle?.ubicacion || 'Base Valencia'}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-slate-400">Operador / Acoplado Asignado:</span>
                  <span className="font-semibold text-slate-800">
                    {activeVehicle.telemetriaDetalle?.operador ||
                      activeVehicle.telemetriaDetalle?.acopladoAsignado ||
                      'Sin asignar'}
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
                <option value="en_ruta">En Ruta</option>
                <option value="taller">Taller Preventivo</option>
                <option value="inactivo">Inactivo / Reserva</option>
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
                Ubicación Actual
              </label>
              <input
                type="text"
                value={formData.ubicacion || ''}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                placeholder="Ej. Patio Central Valencia"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Clasificación
              </label>
              <select
                value={formData.clasificacion}
                onChange={(e) => setFormData({ ...formData, clasificacion: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800 text-xs outline-none"
              >
                {formData.tipoUnidad === 'motriz' ? (
                  <>
                    <option value="Tractocamión 6x2">Tractocamión 6x2</option>
                    <option value="Tractocamión 6x4">Tractocamión 6x4</option>
                    <option value="Tractocamión 4x2">Tractocamión 4x2</option>
                    <option value="Rígido 3 Ejes">Rígido 3 Ejes</option>
                  </>
                ) : (
                  <>
                    <option value="Góndola Volquete 3 Ejes">Góndola Volquete 3 Ejes</option>
                    <option value="Caja Frigorífica 13.6m">Caja Frigorífica 13.6m</option>
                    <option value="Semirremolque Lona 13.6m">Semirremolque Lona 13.6m</option>
                    <option value="Plataforma Portacontenedor">Plataforma Portacontenedor</option>
                  </>
                )}
              </select>
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

      {/* ─── MODAL 4: CONFIRMACIÓN DE ELIMINACIÓN ─── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setActiveVehicle(null);
        }}
        title="Confirmar Eliminación"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            ¿Estás seguro de que deseas dar de baja o eliminar el vehículo con placa{' '}
            <strong className="text-slate-900 font-bold">{activeVehicle?.placa}</strong> (
            {activeVehicle?.marca} {activeVehicle?.modelo})?
          </p>
          <p className="text-[11px] text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
            Esta acción removerá la unidad de la supervisión activa de telemetría.
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
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}