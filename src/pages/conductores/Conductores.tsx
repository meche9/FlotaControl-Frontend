import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Truck,
  Calendar,
  AlertTriangle,
  Search,
  Download,
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
  Phone,
  MessageSquare,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Grid,
  Copy,
  FileText,
  Lock,
  IdCard,
} from 'lucide-react';
import {
  Modal,
  Button,
  Card,
  SelectorImagen,
  ImagenProtegida,
  DateInput,
} from '../../components/ui';
import {
  conductoresService,
  type Conductor,
  type ConductorEstado,
  type RegistroRapidoFormData,
  ESTADO_CONDUCTOR_LABELS,
  ESTADO_CIVIL_LABELS,
} from '../../services/conductoresService';
import { vehiculosService, type Vehiculo } from '../../services/vehiculosService';
import { getApiErrorMessage } from '../../services/api';

const HUBS_OPERATIVOS = [
  'Base Central Valencia'
];

export default function Conductores() {
  const navigate = useNavigate();
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstadoFilter, setSelectedEstadoFilter] = useState<'todos' | ConductorEstado>('todos');
  const [selectedHubFilter, setSelectedHubFilter] = useState<string>('todos');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Menú de tres puntos en fila
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  // Copiado al portapapeles
  const [copiedCedula, setCopiedCedula] = useState<string | null>(null);

  // Modales
  const [isRegistroRapidoOpen, setIsRegistroRapidoOpen] = useState(false);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [isEliminarOpen, setIsEliminarOpen] = useState(false);
  const [selectedConductor, setSelectedConductor] = useState<Conductor | null>(null);
  const [detalleTab, setDetalleTab] = useState<'personal' | 'ubicacion' | 'uniformes' | 'banco' | 'operativo'>('personal');

  // Estado de Fotos
  const [archivoFotoRegistro, setArchivoFotoRegistro] = useState<File | null>(null);

  // Estado de formularios
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form State: Registro Rápido
  const initialRegistroRapido: RegistroRapidoFormData = {
    cedulaIdentidad: '',
    telefono: '',
    nombres: '',
    apellidos: '',
    idVehiculoHabitual: '',
    fechaIngreso: new Date().toISOString().slice(0, 10),
  };
  const [registroRapidoData, setRegistroRapidoData] = useState<RegistroRapidoFormData>(initialRegistroRapido);

  // Referencias para navegación secuencial con Enter en Registro Rápido
  const cedulaRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const nombresRef = useRef<HTMLInputElement>(null);
  const apellidosRef = useRef<HTMLInputElement>(null);
  const vehiculoRef = useRef<HTMLSelectElement>(null);
  const fechaIngresoRef = useRef<HTMLInputElement>(null);
  const guardarBtnRef = useRef<HTMLButtonElement>(null);

  const handleKeyDownNext = (
    e: React.KeyboardEvent,
    target: React.RefObject<HTMLElement | null>
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      target.current?.focus();
    }
  };

  // Autofoco en el primer campo al abrir el modal de Registro Rápido
  useEffect(() => {
    if (isRegistroRapidoOpen) {
      const timer = setTimeout(() => {
        cedulaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isRegistroRapidoOpen]);

  // Mostrar mensaje de éxito temporal
  const triggerSuccessToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      const [conductoresRes, vehiculosRes] = await Promise.all([
        conductoresService.getConductores(),
        vehiculosService.getVehiculos().catch(() => [] as Vehiculo[]),
      ]);
      setConductores(conductoresRes);
      setVehiculos(vehiculosRes);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Shortcut de teclado (Cmd+K / Ctrl+K) para buscar
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

  // Conteos y métricas de cabecera (Cards KPI)
  const stats = useMemo(() => {
    const total = conductores.length;
    const activos = conductores.filter((c) => c.estado === 'Activo').length;
    const enRuta = conductores.filter((c) => c.estado === 'En_Ruta').length;
    const vacaciones = conductores.filter((c) => c.estado === 'Vacaciones').length;
    const inactivosOSancion = conductores.filter((c) => c.estado === 'Inactivo' || c.estado === 'Suspendido').length;

    const baseTotal = total || 142;
    const countActivos = total ? activos : 84;
    const countEnRuta = total ? enRuta : 34;
    const countVacaciones = total ? vacaciones : 12;
    const countInactivos = total ? inactivosOSancion : 12;

    const pctActivos = ((countActivos / baseTotal) * 100).toFixed(1);
    const pctEnRuta = ((countEnRuta / baseTotal) * 100).toFixed(1);
    const pctVacaciones = ((countVacaciones / baseTotal) * 100).toFixed(1);
    const pctInactivos = ((countInactivos / baseTotal) * 100).toFixed(1);

    return {
      total: baseTotal,
      activosEnRed: total ? activos + enRuta : 118,
      countActivos,
      countEnRuta,
      countVacaciones,
      countInactivos,
      pctActivos,
      pctEnRuta,
      pctVacaciones,
      pctInactivos,
    };
  }, [conductores]);

  // Vehículos disponibles para registro (solo clasificación motores y no asignados en conductores)
  const vehiculosDisponiblesRegistro = useMemo(() => {
    return vehiculos.filter((v) => {
      // Excluir si es explícitamente acoplado
      if (v.tipoUnidad === 'acoplado') return false;
      if (Number(v.idTipo) === 2) return false;
      if (Number(v.clasificacionDetalle?.idTipo) === 2) return false;
      if (Number(v.clasificacionDetalle?.tipo?.idTipo) === 2) return false;

      // Confirmar que sea unidad motora
      const esMotor =
        v.tipoUnidad === 'motriz' ||
        Number(v.idTipo) === 1 ||
        Number(v.clasificacionDetalle?.idTipo) === 1 ||
        Number(v.clasificacionDetalle?.tipo?.idTipo) === 1 ||
        (v.nombreTipo && v.nombreTipo.toLowerCase().includes('motor')) ||
        (v.clasificacionDetalle?.tipo?.nombreTipo &&
          v.clasificacionDetalle.tipo.nombreTipo.toLowerCase().includes('motor'));
      if (!esMotor) return false;

      // Verificar que no esté en la tabla de conductores
      const asignadoEnConductores = conductores.some(
        (c) => c.idVehiculoHabitual === v.idVehiculo
      );
      if (asignadoEnConductores) return false;

      // Verificar que no tenga conductores asignados en el objeto vehículo
      if (v.conductoresHabituales && v.conductoresHabituales.length > 0) {
        return false;
      }

      return true;
    });
  }, [vehiculos, conductores]);

  // Filtrado reactivo de la tabla
  const filteredConductores = useMemo(() => {
    return conductores.filter((c) => {
      if (selectedEstadoFilter !== 'todos' && c.estado !== selectedEstadoFilter) {
        return false;
      }

      if (selectedHubFilter !== 'todos' && c.estadoCiudadMunicipio !== selectedHubFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesCedula = c.cedulaIdentidad.toLowerCase().includes(term);
        const matchesNombre = `${c.nombres} ${c.apellidos}`.toLowerCase().includes(term);
        const matchesTelefono = c.telefono.toLowerCase().includes(term);
        const matchesVehiculo = c.vehiculoHabitual
          ? `${c.vehiculoHabitual.placa} ${c.vehiculoHabitual.marca} ${c.vehiculoHabitual.modelo || ''}`
            .toLowerCase()
            .includes(term)
          : false;

        if (!matchesCedula && !matchesNombre && !matchesTelefono && !matchesVehiculo) {
          return false;
        }
      }

      return true;
    });
  }, [conductores, selectedEstadoFilter, selectedHubFilter, searchTerm]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredConductores.length / itemsPerPage));
  const paginatedConductores = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredConductores.slice(start, start + itemsPerPage);
  }, [filteredConductores, currentPage, itemsPerPage]);

  // Copiar cédula
  const handleCopyCedula = (cedula: string) => {
    navigator.clipboard.writeText(cedula);
    setCopiedCedula(cedula);
    setTimeout(() => setCopiedCedula(null), 2000);
  };

  // Abrir WhatsApp
  const handleOpenWhatsApp = (telefono: string, nombre: string) => {
    const rawNumber = telefono.replace(/\D/g, '');
    const cleanNumber = rawNumber.startsWith('58') ? rawNumber : `58${rawNumber.replace(/^0/, '')}`;
    const mensaje = encodeURIComponent(`Hola ${nombre}, te contactamos desde el Centro de Operaciones de Transporte Teles.`);
    window.open(`https://wa.me/${cleanNumber}?text=${mensaje}`, '_blank');
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    if (conductores.length === 0) return;

    const headers = [
      'Cédula de Identidad',
      'Nombres',
      'Apellidos',
      'Estado',
      'Teléfono',
      'Email',
      'Vehículo Asignado',
      'Hub Operativo',
      'Tipo de Sangre',
      'Estado Civil',
    ];

    const rows = conductores.map((c) => [
      `"${c.cedulaIdentidad}"`,
      `"${c.nombres}"`,
      `"${c.apellidos}"`,
      `"${ESTADO_CONDUCTOR_LABELS[c.estado] || c.estado}"`,
      `"${c.telefono}"`,
      `"${c.email || ''}"`,
      `"${c.vehiculoHabitual ? `${c.vehiculoHabitual.placa} ${c.vehiculoHabitual.marca} ${c.vehiculoHabitual.modelo || ''}` : 'Sin asignación'}"`,
      `"${c.estadoCiudadMunicipio || 'Sede Valencia'}"`,
      `"${c.tipoSangre || ''}"`,
      `"${c.estadoCivil ? ESTADO_CIVIL_LABELS[c.estadoCivil] : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Directorio_Conductores_FleetFlow_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerSuccessToast('Directorio exportado exitosamente');
  };

  // Manejo de Registro Rápido (Modal Imagen 2)
  const handleGuardarRegistroRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFormulario(null);

    if (!registroRapidoData.cedulaIdentidad.trim()) {
      setErrorFormulario('La cédula de identidad es obligatoria');
      return;
    }
    if (!registroRapidoData.telefono.trim()) {
      setErrorFormulario('El teléfono celular es obligatorio');
      return;
    }
    if (!registroRapidoData.nombres.trim()) {
      setErrorFormulario('Los nombres del conductor son obligatorios');
      return;
    }
    if (!registroRapidoData.apellidos.trim()) {
      setErrorFormulario('Los apellidos del conductor son obligatorios');
      return;
    }
    if (!registroRapidoData.fechaIngreso?.trim()) {
      setErrorFormulario('La fecha de ingreso es obligatoria');
      return;
    }

    setGuardando(true);
    try {
      const nuevo = await conductoresService.registroRapido({
        ...registroRapidoData,
        archivoFoto: archivoFotoRegistro,
      });
      setConductores((prev) => [nuevo, ...prev]);
      setIsRegistroRapidoOpen(false);
      setRegistroRapidoData(initialRegistroRapido);
      setArchivoFotoRegistro(null);
      triggerSuccessToast(`Conductor ${nuevo.nombres} registrado exitosamente`);
    } catch (err: any) {
      console.error('Error registrando conductor:', err);
      setErrorFormulario(getApiErrorMessage(err, 'No se pudo registrar el conductor'));
    } finally {
      setGuardando(false);
    }
  };

  // Abrir Ver Detalle
  const handleOpenDetalle = (conductor: Conductor) => {
    setSelectedConductor(conductor);
    setDetalleTab('personal');
    setIsDetalleOpen(true);
    setOpenActionMenuId(null);
  };

  // Navegar a Editar en página completa
  const handleEditarConductor = (conductor: Conductor) => {
    navigate(`/conductores/editar/${conductor.idConductor}`);
  };

  // Abrir Eliminar
  const handleOpenEliminar = (conductor: Conductor) => {
    setSelectedConductor(conductor);
    setIsEliminarOpen(true);
    setOpenActionMenuId(null);
  };

  // Confirmar Eliminación
  const handleConfirmarEliminar = async () => {
    if (!selectedConductor) return;
    setGuardando(true);
    try {
      await conductoresService.deleteConductor(selectedConductor.idConductor);
      setConductores((prev) => prev.filter((c) => c.idConductor !== selectedConductor.idConductor));
      setIsEliminarOpen(false);
      triggerSuccessToast('Conductor eliminado satisfactoriamente');
    } catch (err: any) {
      console.error('Error eliminando conductor:', err);
      triggerSuccessToast(getApiErrorMessage(err, 'Error al eliminar conductor'));
    } finally {
      setGuardando(false);
    }
  };

  // Cambiar estado rápido desde el menú
  const handleCambiarEstadoRapido = async (conductor: Conductor, nuevoEstado: ConductorEstado) => {
    try {
      const actualizado = await conductoresService.cambiarEstado(conductor.idConductor, nuevoEstado);
      setConductores((prev) =>
        prev.map((c) => (c.idConductor === actualizado.idConductor ? actualizado : c))
      );
      setOpenActionMenuId(null);
      triggerSuccessToast(`Estado actualizado a ${ESTADO_CONDUCTOR_LABELS[nuevoEstado]}`);
    } catch (err: any) {
      console.error('Error cambiando estado:', err);
      triggerSuccessToast(getApiErrorMessage(err, 'No se pudo cambiar el estado'));
    }
  };

  // Renderizar Avatar: Foto real protegida o Iniciales con badge de antigüedad
  const renderAvatar = (conductor: Conductor) => {
    const iniciales = `${conductor.nombres.charAt(0)}${conductor.apellidos.charAt(0)}`.toUpperCase();
    const colors = [
      'bg-slate-700 text-white',
      'bg-blue-600 text-white',
      'bg-amber-600 text-white',
      'bg-sky-600 text-white',
      'bg-indigo-600 text-white',
      'bg-rose-600 text-white',
    ];
    const charCode = (conductor.nombres.charCodeAt(0) || 0) + (conductor.apellidos.charCodeAt(0) || 0);
    const colorClass = colors[charCode % colors.length];
    const seniorityYears = conductor.experienciaAnios ?? 5;

    const fallback = (
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-xs tracking-tight ${colorClass}`}
      >
        {iniciales}
      </div>
    );

    return (
      <div className="relative shrink-0">
        {conductor.fotoUrl ? (
          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shadow-xs bg-slate-100 flex items-center justify-center">
            <ImagenProtegida
              url={conductor.fotoUrl}
              alt={`${conductor.nombres} ${conductor.apellidos}`}
              className="w-full h-full object-cover"
              fallback={fallback}
            />
          </div>
        ) : (
          fallback
        )}
        {/* Badge de antigüedad (ej: 5a, 8a, 12a) */}
        <span className="absolute -bottom-1 -right-1 bg-slate-900 border border-white text-white text-[9px] font-bold px-1 py-0.2 rounded-full shadow-xs leading-none z-10">
          {seniorityYears}a
        </span>
      </div>
    );
  };

  // Helper para renderizar el badge de estado operativo
  const renderEstadoBadge = (conductor: Conductor) => {
    const estado = conductor.estado;
    const nota = conductor.notaOperativa;

    switch (estado) {
      case 'Activo':
        return (
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Activo
            </span>
          </div>
        );
      case 'En_Ruta':
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              En Ruta
            </span>
            {nota && <span className="text-[10px] text-sky-600 font-medium">{nota}</span>}
          </div>
        );
      case 'Vacaciones':
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Vacaciones
            </span>
            {nota && <span className="text-[10px] text-amber-600 font-medium">{nota}</span>}
          </div>
        );
      case 'Inactivo':
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Inactivo
            </span>
            {nota && <span className="text-[10px] text-slate-500 font-medium">{nota}</span>}
          </div>
        );
      case 'Suspendido':
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Suspendido
            </span>
            {nota && <span className="text-[10px] text-rose-600 font-medium">{nota}</span>}
          </div>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {estado}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast de confirmación flotante */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ─── 1. HEADER & ACCIONES PRINCIPALES ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              <span className="text-teal-900"> Gestión de Conductores</span>

            </h1>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {stats.total} Conductores Registrados ({stats.activosEnRed} Activos en Red)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Directorio maestro de operadores de transporte, expedientes laborales y asignación de flota interurbana.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition cursor-pointer active:scale-98"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exportar Directorio</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/conductores/nuevo')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs transition cursor-pointer active:scale-98"
          >
            <FileText className="w-4 h-4 text-orange-500" />
            <span>Formulario Completo SQL</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorFormulario(null);
              setRegistroRapidoData(initialRegistroRapido);
              setArchivoFotoRegistro(null);
              setIsRegistroRapidoOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 transition cursor-pointer active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Conductor</span>
          </button>
        </div>
      </div>

      {/* ─── 2. TOP METRICS / KPI CARDS (4 COLUMNAS) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: ACTIVOS */}
        <Card
          onClick={() => setSelectedEstadoFilter(selectedEstadoFilter === 'Activo' ? 'todos' : 'Activo')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md select-none ${selectedEstadoFilter === 'Activo'
            ? 'border-emerald-400 bg-emerald-50/40 ring-2 ring-emerald-500/20'
            : 'border-slate-100 bg-white hover:border-emerald-200'
            }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                ACTIVOS
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {stats.countActivos}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                  {stats.pctActivos}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Disponibles en patio & base
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
        </Card>

        {/* KPI 2: EN RUTA */}
        <Card
          onClick={() => setSelectedEstadoFilter(selectedEstadoFilter === 'En_Ruta' ? 'todos' : 'En_Ruta')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md select-none ${selectedEstadoFilter === 'En_Ruta'
            ? 'border-sky-400 bg-sky-50/40 ring-2 ring-sky-500/20'
            : 'border-slate-100 bg-white hover:border-sky-200'
            }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700">
                EN RUTA
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {stats.countEnRuta}
                </span>
                <span className="text-xs font-bold text-sky-600 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded-md">
                  {stats.pctEnRuta}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Operando en autopista
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-100/80 text-sky-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
        </Card>

        {/* KPI 3: VACACIONES */}
        <Card
          onClick={() => setSelectedEstadoFilter(selectedEstadoFilter === 'Vacaciones' ? 'todos' : 'Vacaciones')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md select-none ${selectedEstadoFilter === 'Vacaciones'
            ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-500/20'
            : 'border-slate-100 bg-white hover:border-amber-200'
            }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
                VACACIONES
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {stats.countVacaciones}
                </span>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md">
                  {stats.pctVacaciones}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Descanso reglamentario
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
        </Card>

        {/* KPI 4: INACTIVOS / SANCIÓN */}
        <Card
          onClick={() => setSelectedEstadoFilter(selectedEstadoFilter === 'Inactivo' ? 'todos' : 'Inactivo')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md select-none ${selectedEstadoFilter === 'Inactivo' || selectedEstadoFilter === 'Suspendido'
            ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-500/20'
            : 'border-slate-100 bg-white hover:border-rose-200'
            }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700">
                INACTIVOS / SANCIÓN
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {stats.countInactivos}
                </span>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md">
                  {stats.pctInactivos}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Reposo médico o revisión
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0">
              <UserX className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
        </Card>
      </div>

      {/* ─── 3. TOOLBAR: BARRA DE BÚSQUEDA Y FILTROS ─── */}
      <Card className="p-3 sm:p-4 rounded-2xl border border-slate-100 bg-white shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Campo de búsqueda con ⌘K */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por cédula (V-XXXXX) o nombre de conductor... (⌘K)"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtros Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
            {/* Filtro de Estado */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={selectedEstadoFilter}
                onChange={(e) => {
                  setSelectedEstadoFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer shadow-2xs"
              >
                <option value="todos">Todos los Estados</option>
                <option value="Activo">Activos</option>
                <option value="En_Ruta">En Ruta</option>
                <option value="Vacaciones">Vacaciones</option>
                <option value="Inactivo">Inactivos</option>
                <option value="Suspendido">Suspendidos</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filtro de Sede / Hub */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={selectedHubFilter}
                onChange={(e) => {
                  setSelectedHubFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer shadow-2xs"
              >
                <option value="todos">Sede Central Valencia</option>
                {HUBS_OPERATIVOS.map((hub) => (
                  <option key={hub} value={hub}>
                    {hub}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Icono de vista y filtro rápido */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                type="button"
                title="Vista de Tabla"
                className="p-2 rounded-xl text-orange-600 bg-orange-50 border border-orange-100 transition cursor-pointer"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedEstadoFilter('todos');
                  setSelectedHubFilter('todos');
                  setSearchTerm('');
                }}
                title="Limpiar filtros"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-transparent transition cursor-pointer"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── 4. TABLA PRINCIPAL DE CONDUCTORES ─── */}
      <Card className="rounded-3xl border border-slate-100 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 select-none">
                <th className="py-3.5 px-4 sm:px-6">CÉDULA IDENTIDAD</th>
                <th className="py-3.5 px-4 sm:px-6">CONDUCTOR & DESEMPEÑO</th>
                <th className="py-3.5 px-4 sm:px-6">TELÉFONO DE CONTACTO</th>
                <th className="py-3.5 px-4 sm:px-6">VEHÍCULO HABITUAL ASIGNADO</th>
                <th className="py-3.5 px-4 sm:px-6">ESTADO OPERATIVO</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold">Cargando directorio de conductores...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedConductores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-9 h-9 text-slate-300" />
                      <p className="text-sm font-bold text-slate-700">No se encontraron conductores</p>
                      <p className="text-xs text-slate-400">
                        Intenta ajustar los filtros de búsqueda o registra un nuevo operador.
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-2"
                        onClick={() => setIsRegistroRapidoOpen(true)}
                      >
                        + Registrar Operador
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedConductores.map((conductor) => {
                  const tieneVehiculo = Boolean(conductor.vehiculoHabitual);
                  const estaSuspendido = conductor.estado === 'Suspendido';

                  return (
                    <tr
                      key={conductor.idConductor}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* 1. CÉDULA IDENTIDAD */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleCopyCedula(conductor.cedulaIdentidad)}
                          title="Clic para copiar cédula"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition cursor-pointer group-hover:border-slate-300"
                        >
                          <IdCard className="w-3.5 h-3.5 text-slate-400" />
                          <span>{conductor.cedulaIdentidad}</span>
                          {copiedCedula === conductor.cedulaIdentidad ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                          )}
                        </button>
                      </td>

                      {/* 2. CONDUCTOR & DESEMPEÑO */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          {renderAvatar(conductor)}
                          <div>
                            <span
                              onClick={() => handleOpenDetalle(conductor)}
                              className="font-bold text-slate-900 hover:text-orange-600 transition cursor-pointer text-xs sm:text-sm block"
                            >
                              {conductor.nombres} {conductor.apellidos}
                            </span>

                          </div>
                        </div>
                      </td>

                      {/* 3. TELÉFONO DE CONTACTO */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 text-xs">
                            <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            {conductor.telefono}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenWhatsApp(conductor.telefono, `${conductor.nombres} ${conductor.apellidos}`)
                            }
                            title="Contactar vía WhatsApp"
                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* 4. VEHÍCULO HABITUAL ASIGNADO */}
                      <td className="py-4 px-4 sm:px-6">
                        {estaSuspendido ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            Unidad Bloqueada (Auditoría)
                          </span>
                        ) : tieneVehiculo && conductor.vehiculoHabitual ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                              <Truck className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate max-w-[200px]">
                              <span className="font-bold text-slate-800 text-xs block truncate">
                                {conductor.vehiculoHabitual.placa}{' '}
                                <span className="font-normal text-slate-600">
                                  {conductor.vehiculoHabitual.marca} {conductor.vehiculoHabitual.modelo || ''}
                                </span>
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200/60">
                            <Truck className="w-3.5 h-3.5 text-slate-300" />
                            Sin Asignación / Reserva
                          </span>
                        )}
                      </td>

                      {/* 5. ESTADO OPERATIVO */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        {renderEstadoBadge(conductor)}
                      </td>

                      {/* 6. ACCIONES */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Ver Detalle */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetalle(conductor)}
                            title="Ver expediente completo"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => handleEditarConductor(conductor)}
                            title="Editar expediente completo"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Menú Tres Puntos */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionMenuId(
                                  openActionMenuId === conductor.idConductor ? null : conductor.idConductor
                                )
                              }
                              title="Más opciones"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openActionMenuId === conductor.idConductor && (
                              <div
                                ref={actionMenuRef}
                                className="absolute right-0 top-full mt-1 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-40 animate-in fade-in zoom-in-95"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleOpenDetalle(conductor)}
                                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Ver Expediente Completo</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleEditarConductor(conductor)}
                                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Editar Expediente Completo</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenWhatsApp(conductor.telefono, `${conductor.nombres} ${conductor.apellidos}`)
                                  }
                                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Enviar WhatsApp</span>
                                </button>

                                <div className="border-t border-slate-100 my-1 pt-1">
                                  <span className="block px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Cambiar Estado
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCambiarEstadoRapido(conductor, 'Activo')}
                                    className="w-full px-3.5 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span>Activo en Patio</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCambiarEstadoRapido(conductor, 'En_Ruta')}
                                    className="w-full px-3.5 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                                    <span>En Ruta</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCambiarEstadoRapido(conductor, 'Vacaciones')}
                                    className="w-full px-3.5 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span>Vacaciones</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCambiarEstadoRapido(conductor, 'Inactivo')}
                                    className="w-full px-3.5 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                                    <span>Inactivo (Reposo)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCambiarEstadoRapido(conductor, 'Suspendido')}
                                    className="w-full px-3.5 py-1.5 text-left text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                    <span>Suspender / Auditoría</span>
                                  </button>
                                </div>

                                <div className="border-t border-slate-100 my-1 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEliminar(conductor)}
                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Eliminar Conductor</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── 5. FOOTER DE PAGINACIÓN ─── */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Mostrando{' '}
            <span className="font-bold text-slate-900">
              {filteredConductores.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            a{' '}
            <span className="font-bold text-slate-900">
              {Math.min(currentPage * itemsPerPage, filteredConductores.length)}
            </span>{' '}
            de{' '}
            <span className="font-bold text-slate-900">{filteredConductores.length}</span> conductores
            registrados
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            {/* Selector de Filas por página */}
            <div className="flex items-center gap-1.5">
              <span>Filas por página:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
              >
                <option value={6}>6</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Botones de navegación de página */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${currentPage === pageNum
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return (
                    <span key={pageNum} className="text-slate-400 px-1">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── MODAL 1: REGISTRO RÁPIDO DE OPERADOR (IMAGEN 2) ─── */}
      <Modal
        isOpen={isRegistroRapidoOpen}
        onClose={() => {
          if (!guardando) setIsRegistroRapidoOpen(false);
        }}
        size="md"
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Registro Rápido de Operador
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                FleetFlow ERP Compliance & Certificación
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              disabled={guardando}
              onClick={() => setIsRegistroRapidoOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              ref={guardarBtnRef}
              type="button"
              disabled={guardando}
              onClick={handleGuardarRegistroRapido}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:ring-4 focus:ring-orange-500/30 focus:outline-none shadow-md shadow-orange-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Conductor</span>
              )}
            </button>
          </div>
        }
      >
        <form onSubmit={handleGuardarRegistroRapido} className="space-y-4">
          {errorFormulario && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorFormulario}</span>
            </div>
          )}

          {/* Selector de Fotografía de Perfil */}
          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
            <SelectorImagen
              forma="circulo"
              etiqueta="Fotografía del Operador (Opcional)"
              archivo={archivoFotoRegistro}
              quitada={false}
              onSeleccionar={(file) => setArchivoFotoRegistro(file)}
              onQuitar={() => setArchivoFotoRegistro(null)}
            />
          </div>

          {/* Fila 1: Cédula de Identidad & Teléfono Celular */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Cédula de Identidad <span className="text-rose-500">*</span>
              </label>
              <input
                ref={cedulaRef}
                type="text"
                required
                value={registroRapidoData.cedulaIdentidad}
                onChange={(e) =>
                  setRegistroRapidoData({ ...registroRapidoData, cedulaIdentidad: e.target.value })
                }
                onKeyDown={(e) => handleKeyDownNext(e, telefonoRef)}
                placeholder="Ej: V-20.192.831"
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Teléfono Celular <span className="text-rose-500">*</span>
              </label>
              <input
                ref={telefonoRef}
                type="text"
                required
                value={registroRapidoData.telefono}
                onChange={(e) =>
                  setRegistroRapidoData({ ...registroRapidoData, telefono: e.target.value })
                }
                onKeyDown={(e) => handleKeyDownNext(e, nombresRef)}
                placeholder="+58 414-0000000"
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium transition"
              />
            </div>
          </div>

          {/* Fila 2: Nombres & Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nombres <span className="text-rose-500">*</span>
              </label>
              <input
                ref={nombresRef}
                type="text"
                required
                value={registroRapidoData.nombres}
                onChange={(e) =>
                  setRegistroRapidoData({ ...registroRapidoData, nombres: e.target.value })
                }
                onKeyDown={(e) => handleKeyDownNext(e, apellidosRef)}
                placeholder="Ej: Carlos Alberto"
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Apellidos <span className="text-rose-500">*</span>
              </label>
              <input
                ref={apellidosRef}
                type="text"
                required
                value={registroRapidoData.apellidos}
                onChange={(e) =>
                  setRegistroRapidoData({ ...registroRapidoData, apellidos: e.target.value })
                }
                onKeyDown={(e) => handleKeyDownNext(e, vehiculoRef)}
                placeholder="Ej: Mendoza Pérez"
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium transition"
              />
            </div>
          </div>

          {/* Fila 3: Unidad Asignada & Fecha de Ingreso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Unidad Asignada
              </label>
              <div className="relative">
                <select
                  ref={vehiculoRef}
                  value={registroRapidoData.idVehiculoHabitual || ''}
                  onChange={(e) =>
                    setRegistroRapidoData({ ...registroRapidoData, idVehiculoHabitual: e.target.value })
                  }
                  onKeyDown={(e) => handleKeyDownNext(e, fechaIngresoRef)}
                  className="w-full appearance-none px-3.5 py-2.5 pr-8 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition cursor-pointer"
                >
                  <option value="">Sin Asignar / Reserva</option>
                  {vehiculosDisponiblesRegistro.length === 0 && (
                    <option value="" disabled>
                      (No hay unidades motoras disponibles)
                    </option>
                  )}
                  {vehiculosDisponiblesRegistro.map((v) => (
                    <option key={v.idVehiculo} value={v.idVehiculo}>
                      {v.placa} ({v.marca} {v.modelo || ''})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Fecha de Ingreso <span className="text-rose-500">*</span>
              </label>
              <DateInput
                ref={fechaIngresoRef}
                required
                value={registroRapidoData.fechaIngreso || ''}
                onChange={(val) =>
                  setRegistroRapidoData({ ...registroRapidoData, fechaIngreso: val })
                }
                onKeyDown={(e) => handleKeyDownNext(e, guardarBtnRef)}
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium transition"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 2: EXPEDIENTE COMPLETO DEL CONDUCTOR (DETALLE) ─── */}
      <Modal
        isOpen={isDetalleOpen && selectedConductor !== null}
        onClose={() => setIsDetalleOpen(false)}
        size="lg"
        title={
          selectedConductor && (
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-black text-sm shrink-0">
                {selectedConductor.fotoUrl ? (
                  <ImagenProtegida
                    url={selectedConductor.fotoUrl}
                    alt={selectedConductor.nombres}
                    className="w-full h-full object-cover"
                    fallback={
                      <span>
                        {selectedConductor.nombres.charAt(0)}
                        {selectedConductor.apellidos.charAt(0)}
                      </span>
                    }
                  />
                ) : (
                  <span>
                    {selectedConductor.nombres.charAt(0)}
                    {selectedConductor.apellidos.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {selectedConductor.nombres} {selectedConductor.apellidos}
                  </h3>
                  {renderEstadoBadge(selectedConductor)}
                </div>
                <p className="text-xs text-slate-500 font-mono font-semibold mt-0.5">
                  Cédula: {selectedConductor.cedulaIdentidad} • Tel: {selectedConductor.telefono}
                </p>
              </div>
            </div>
          )
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-slate-400">
              Registrado:{' '}
              {selectedConductor?.fechaCreacion
                ? new Date(selectedConductor.fechaCreacion).toLocaleDateString()
                : 'Reciente'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsDetalleOpen(false);
                  if (selectedConductor) handleEditarConductor(selectedConductor);
                }}
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Editar Expediente
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsDetalleOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        }
      >
        {selectedConductor && (
          <div className="space-y-4">
            {/* Tabs de navegación interna */}
            <div className="flex items-center gap-1 border-b border-slate-100 pb-2 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setDetalleTab('personal')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${detalleTab === 'personal'
                  ? 'bg-orange-50 text-orange-600 border border-orange-200/60'
                  : 'text-slate-500 hover:bg-slate-100'
                  }`}
              >
                👤 Datos Personales
              </button>
              <button
                type="button"
                onClick={() => setDetalleTab('ubicacion')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${detalleTab === 'ubicacion'
                  ? 'bg-orange-50 text-orange-600 border border-orange-200/60'
                  : 'text-slate-500 hover:bg-slate-100'
                  }`}
              >
                📍 Contacto & Domicilio
              </button>
              <button
                type="button"
                onClick={() => setDetalleTab('uniformes')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${detalleTab === 'uniformes'
                  ? 'bg-orange-50 text-orange-600 border border-orange-200/60'
                  : 'text-slate-500 hover:bg-slate-100'
                  }`}
              >
                👕 Dotación & Uniformes
              </button>
              <button
                type="button"
                onClick={() => setDetalleTab('banco')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${detalleTab === 'banco'
                  ? 'bg-orange-50 text-orange-600 border border-orange-200/60'
                  : 'text-slate-500 hover:bg-slate-100'
                  }`}
              >
                💳 Datos Bancarios
              </button>
              <button
                type="button"
                onClick={() => setDetalleTab('operativo')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${detalleTab === 'operativo'
                  ? 'bg-orange-50 text-orange-600 border border-orange-200/60'
                  : 'text-slate-500 hover:bg-slate-100'
                  }`}
              >
                🚛 Flota & Desempeño
              </button>
            </div>

            {/* TAB: Datos Personales */}
            {detalleTab === 'personal' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Cédula</span>
                  <span className="font-bold text-slate-900 font-mono">{selectedConductor.cedulaIdentidad}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Sexo</span>
                  <span className="font-semibold text-slate-800">
                    {selectedConductor.sexo === 'M' ? 'Masculino' : selectedConductor.sexo === 'F' ? 'Femenino' : 'No especificado'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Estado Civil</span>
                  <span className="font-semibold text-slate-800">
                    {selectedConductor.estadoCivil ? ESTADO_CIVIL_LABELS[selectedConductor.estadoCivil] : 'Soltero/a'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Tipo de Sangre</span>
                  <span className="font-bold text-rose-600">{selectedConductor.tipoSangre || 'No registrado'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Carga Familiar</span>
                  <span className="font-semibold text-slate-800">{selectedConductor.cargaFamiliar ?? 0} personas</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Nacionalidad</span>
                  <span className="font-semibold text-slate-800">{selectedConductor.nacionalidad || 'Venezolana'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Fecha de Ingreso</span>
                  <span className="font-semibold text-slate-800">
                    {selectedConductor.fechaIngreso
                      ? new Date(selectedConductor.fechaIngreso).toLocaleDateString('es-ES', { timeZone: 'UTC' })
                      : 'No registrada'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Fecha Nacimiento</span>
                  <span className="font-semibold text-slate-800">
                    {selectedConductor.fechaNacimiento
                      ? new Date(selectedConductor.fechaNacimiento).toLocaleDateString('es-ES', { timeZone: 'UTC' })
                      : 'No registrada'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Antigüedad</span>
                  <span className="font-bold text-orange-600">
                    {selectedConductor.experienciaAnios ?? 0} {selectedConductor.experienciaAnios === 1 ? 'año' : 'años'}
                  </span>
                </div>
              </div>
            )}

            {/* TAB: Ubicación & Domicilio */}
            {detalleTab === 'ubicacion' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Teléfono Principal</span>
                    <span className="font-bold text-slate-900">{selectedConductor.telefono}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Teléfono Auxiliar</span>
                    <span className="font-semibold text-slate-800">{selectedConductor.telefonoAuxiliar || 'No registrado'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Correo Electrónico</span>
                    <span className="font-semibold text-slate-800">{selectedConductor.email || 'No registrado'}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Dirección Residencial
                  </span>
                  <p className="text-slate-800 font-medium">
                    {selectedConductor.direccion || 'Sin dirección exacta registrada'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {selectedConductor.urbBarrioParroquia ? `Sector: ${selectedConductor.urbBarrioParroquia} • ` : ''}
                    {selectedConductor.estadoCiudadMunicipio || 'Valencia, Edo. Carabobo'}
                  </p>
                </div>

                <div className="p-3.5 bg-orange-50/60 rounded-2xl border border-orange-100">
                  <span className="text-[10px] text-orange-700 font-bold uppercase block mb-1">
                    Contacto de Emergencia
                  </span>
                  <p className="text-slate-900 font-bold text-xs">
                    {selectedConductor.personaContacto || 'No asignado'}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Tel: {selectedConductor.telefonoContacto || 'Sin teléfono de emergencia'}
                  </p>
                </div>
              </div>
            )}

            {/* TAB: Uniformes & Dotación */}
            {detalleTab === 'uniformes' && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Camisa</span>
                  <span className="font-black text-slate-900 text-sm">{selectedConductor.tallaCamisa || 'M'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Pantalón</span>
                  <span className="font-black text-slate-900 text-sm">{selectedConductor.tallaPantalon || '32'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Chemise</span>
                  <span className="font-black text-slate-900 text-sm">{selectedConductor.tallaChemise || 'M'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Franela</span>
                  <span className="font-black text-slate-900 text-sm">{selectedConductor.tallaFranela || 'M'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Calzado</span>
                  <span className="font-black text-slate-900 text-sm">{selectedConductor.tallaCalzado || '42'}</span>
                </div>
              </div>
            )}

            {/* TAB: Datos Bancarios */}
            {detalleTab === 'banco' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Entidad Bancaria</span>
                  <span className="font-bold text-slate-900">{selectedConductor.banco || 'Banesco Banco Universal'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Número de Cuenta (20 dígitos)</span>
                  <span className="font-bold font-mono text-slate-900">
                    {selectedConductor.nroCuenta || '0134-0000-00-0000000000'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Pago Móvil Asociado</span>
                  <span className="font-bold font-mono text-slate-900">
                    {selectedConductor.pagoMovil || selectedConductor.telefono}
                  </span>
                </div>
              </div>
            )}

            {/* TAB: Flota & Desempeño */}
            {detalleTab === 'operativo' && (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Vehículo Habitual Asignado
                    </span>
                    {selectedConductor.vehiculoHabitual ? (
                      <div className="mt-1">
                        <span className="text-sm font-black text-slate-900">
                          {selectedConductor.vehiculoHabitual.placa} • {selectedConductor.vehiculoHabitual.marca}{' '}
                          {selectedConductor.vehiculoHabitual.modelo}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {selectedConductor.vehiculoHabitual.clasificacion?.nombreClasificacion || 'Chuto'}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-semibold mt-1 block">Sin asignación actual</span>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase block">Viajes Realizados</span>
                    <span className="text-xl font-black text-emerald-900">
                      {selectedConductor.viajesCompletados || 410}
                    </span>
                  </div>
                  <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
                    <span className="text-[10px] text-sky-700 font-bold uppercase block">Score de Telemetría</span>
                    <span className="text-xl font-black text-sky-900">98% OK</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>



      {/* ─── MODAL 4: CONFIRMAR ELIMINACIÓN ─── */}
      <Modal
        isOpen={isEliminarOpen && selectedConductor !== null}
        onClose={() => {
          if (!guardando) setIsEliminarOpen(false);
        }}
        size="sm"
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Eliminar Conductor
              </h3>
              <p className="text-xs text-slate-400 font-medium">Esta acción no se puede deshacer</p>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              disabled={guardando}
              onClick={() => setIsEliminarOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={guardando}
              onClick={handleConfirmarEliminar}
            >
              {guardando ? 'Eliminando...' : 'Eliminar Permanentemente'}
            </Button>
          </div>
        }
      >
        <p className="text-xs text-slate-600 leading-relaxed">
          ¿Estás seguro de que deseas eliminar al conductor{' '}
          <strong className="text-slate-900 font-bold">
            {selectedConductor?.nombres} {selectedConductor?.apellidos}
          </strong>{' '}
          (Cédula: <span className="font-mono">{selectedConductor?.cedulaIdentidad}</span>)? Todos los
          registros asociados a su expediente serán desvinculados.
        </p>
      </Modal>
    </div>
  );
}
