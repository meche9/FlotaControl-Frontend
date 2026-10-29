import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  X,
  Building2,
  ChevronDown,
  CircleDot,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  UserPlus,
  Milestone,
  FileText,
  Sparkles,
  Loader2,
  AlertCircle,
  Route as RouteIcon,
  Navigation,
  Search,
  FileCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { programacionService, type TripItem } from '../../services/programacionService';
import { clientesService, obtenerCodigoAvatar, type Cliente } from '../../services/clientesService';
import { rutasService, type Ruta } from '../../services/rutasService';

interface RegistrarDespachoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (nuevoViaje: any) => void;
}

// Helper para generar formato legible de fecha en español
const formatFechaEspanol = (dateObj: Date): string => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dia = dateObj.getDate();
  const mes = meses[dateObj.getMonth()];
  const anio = dateObj.getFullYear();
  return `${dia} de ${mes}, ${anio}`;
};

const formatDateToIso = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const RegistrarDespachoModal: React.FC<RegistrarDespachoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);

  // Form State
  const [nroTransporte, setNroTransporte] = useState('');
  const [clienteNombre, setClienteNombre] = useState('Empresas Polar • C.A. Distribuidora Nacional');
  const [idClienteSeleccionado, setIdClienteSeleccionado] = useState<string>('');


  // Rutas
  const [rutasList, setRutasList] = useState<Ruta[]>([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<Ruta | null>(null);
  const [isLoadingRutas, setIsLoadingRutas] = useState(false);
  const [showRutaDropdown, setShowRutaDropdown] = useState(false);
  const rutaDropdownRef = useRef<HTMLDivElement>(null);

  // Origen (Solo visualización / derivado de la ruta)
  const [origenSede, setOrigenSede] = useState('');
  const [origenDetalle, setOrigenDetalle] = useState('');
  const [origenCodigo, setOrigenCodigo] = useState('');
  const [idOrigenPunto, setIdOrigenPunto] = useState<string>('');

  // Destino (Solo visualización / derivado de la ruta)
  const [destinoSede, setDestinoSede] = useState('');
  const [destinoDetalle, setDestinoDetalle] = useState('');
  const [destinoCodigo, setDestinoCodigo] = useState('');
  const [idDestinoPunto, setIdDestinoPunto] = useState<string>('');

  // Fecha y Hora
  const [fechaCargaDate, setFechaCargaDate] = useState<string>(() => formatDateToIso(new Date()));
  const [fechaCargaFormatted, setFechaCargaFormatted] = useState<string>(() => formatFechaEspanol(new Date()));
  const [horaProgramada, setHoraProgramada] = useState('08:00 AM');
  const [activeDatePill, setActiveDatePill] = useState<'hoy' | 'manana' | '48h' | 'custom'>('hoy');
  const [observaciones, setObservaciones] = useState('Viaje Adicional');
  const [fisico, setFisico] = useState(false);

  // Interactivity / Dropdown menus
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const clienteDropdownRef = useRef<HTMLDivElement>(null);

  // Clientes cargados
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [clienteSeleccionadoObj, setClienteSeleccionadoObj] = useState<Cliente | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper para asignar puntos a partir de una ruta seleccionada
  const aplicarRutaSeleccionada = (ruta: Ruta) => {
    setRutaSeleccionada(ruta);

    // Origen
    if (ruta.puntoOrigen) {
      setOrigenSede(ruta.puntoOrigen.nombreSede || ruta.ciudadOrigen);
      setOrigenDetalle(`${ruta.puntoOrigen.estado || 'Carabobo'}, ${ruta.puntoOrigen.direccion || ruta.puntoOrigen.ciudad || 'Autopista Regional'}`);
      setOrigenCodigo(ruta.puntoOrigen.codigoPuntoc || 'ORIGEN');
      setIdOrigenPunto(ruta.puntoOrigen.idPunto);
    } else {
      setOrigenSede(ruta.ciudadOrigen ? `Sede Operativa ${ruta.ciudadOrigen}` : 'Sede Fabril Valencia Sur - Rampa 04');
      setOrigenDetalle(ruta.ciudadOrigen || 'Carabobo, Km 162 Autopista Regional');
      setOrigenCodigo('ORIGEN');
      setIdOrigenPunto('');
    }

    // Destino
    if (ruta.puntoDestino) {
      setDestinoSede(ruta.puntoDestino.nombreSede || ruta.ciudadDestino);
      const dist = ruta.distanciaKm ? ` • Estimado ${ruta.distanciaKm} Km` : '';
      setDestinoDetalle(`${ruta.nombreRuta ? ruta.nombreRuta.split(':')[0] : 'Ruta Troncal'}${dist}`);
      setDestinoCodigo(ruta.puntoDestino.codigoPuntoc || 'DESTINO');
      setIdDestinoPunto(ruta.puntoDestino.idPunto);
    } else {
      setDestinoSede(ruta.ciudadDestino ? `C.D. ${ruta.ciudadDestino}` : 'Centro Distribución San Felipe II');
      setDestinoDetalle(`Ruta Troncal • Estimado ${ruta.distanciaKm || 210} Km`);
      setDestinoCodigo('DESTINO');
      setIdDestinoPunto('');
    }
  };

  // Carga de rutas según cliente
  const cargarRutasCliente = async (clienteId?: string) => {
    setIsLoadingRutas(true);
    try {
      let rts: Ruta[] = [];
      if (clienteId) {
        try {
          rts = await rutasService.getRutas({ idCliente: clienteId, activo: true });
        } catch {
          rts = [];
        }
        if (!rts || rts.length === 0) {
          try {
            rts = await rutasService.getRutasByCliente(clienteId);
          } catch {
            rts = [];
          }
        }
      }

      const rutasValidas = rts || [];
      setRutasList(rutasValidas);

      // Solo si el cliente tiene rutas creadas, auto-seleccionar la primera
      if (rutasValidas.length > 0) {
        aplicarRutaSeleccionada(rutasValidas[0]);
      } else {
        // Si el cliente no tiene rutas creadas, no mostrar rutas ni puntos
        setRutaSeleccionada(null);
        setOrigenSede('');
        setOrigenDetalle('Sin punto de carga asignado');
        setOrigenCodigo('');
        setIdOrigenPunto('');
        setDestinoSede('');
        setDestinoDetalle('Sin punto de descarga asignado');
        setDestinoCodigo('');
        setIdDestinoPunto('');
      }
    } catch (err) {
      console.warn('Error al cargar rutas del cliente:', err);
      setRutasList([]);
      setRutaSeleccionada(null);
      setOrigenSede('');
      setOrigenDetalle('Sin punto de carga asignado');
      setOrigenCodigo('');
      setIdOrigenPunto('');
      setDestinoSede('');
      setDestinoDetalle('Sin punto de descarga asignado');
      setDestinoCodigo('');
      setIdDestinoPunto('');
    } finally {
      setIsLoadingRutas(false);
    }
  };

  // Carga inicial de clientes al abrir el modal
  useEffect(() => {
    if (!isOpen) return;

    setNroTransporte('');
    setObservaciones('Viaje Adicional');
    setErrorMsg(null);
    const today = new Date();
    setFechaCargaDate(formatDateToIso(today));
    setFechaCargaFormatted(formatFechaEspanol(today));
    setActiveDatePill('hoy');

    let isMounted = true;
    const loadData = async () => {
      try {
        const cls = await clientesService.getClientes();
        if (!isMounted) return;

        if (cls && cls.length > 0) {
          setClientesList(cls);
          // Buscar Polar o tomar el primero
          const matched = cls.find(c =>
            c.razonSocial.toLowerCase().includes('polar') ||
            (c.nombreComercial && c.nombreComercial.toLowerCase().includes('polar'))
          );
          const initialClient = matched || cls[0];
          setClienteSeleccionadoObj(initialClient);
          setIdClienteSeleccionado(initialClient.idCliente);
          setClienteNombre(`${initialClient.razonSocial}${initialClient.nombreComercial ? ` • ${initialClient.nombreComercial}` : ''}`);
          cargarRutasCliente(initialClient.idCliente);
        } else {
          cargarRutasCliente();
        }
      } catch (err) {
        console.warn('No se pudieron cargar clientes:', err);
        cargarRutasCliente();
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Manejador Escape y bloqueo de scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Click outside para cerrar el dropdown de cliente
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(e.target as Node)) {
        setShowClienteDropdown(false);
      }
    };
    if (showClienteDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClienteDropdown]);

  // Click outside para cerrar el dropdown de rutas
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rutaDropdownRef.current && !rutaDropdownRef.current.contains(e.target as Node)) {
        setShowRutaDropdown(false);
      }
    };
    if (showRutaDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRutaDropdown]);

  // Quick date pill actions
  const handlePillDate = (type: 'hoy' | 'manana' | '48h') => {
    setActiveDatePill(type);
    const date = new Date();
    if (type === 'manana') {
      date.setDate(date.getDate() + 1);
    } else if (type === '48h') {
      date.setDate(date.getDate() + 2);
    }
    setFechaCargaDate(formatDateToIso(date));
    setFechaCargaFormatted(formatFechaEspanol(date));
  };

  const handleCustomDateChange = (val: string) => {
    setFechaCargaDate(val);
    setActiveDatePill('custom');
    if (val) {
      const parts = val.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        setFechaCargaFormatted(formatFechaEspanol(d));
      }
    }
  };

  // Helper para auto-generar número de transporte o guía
  const handleGenerarNumero = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = Math.random() > 0.5 ? 'GUI-2026' : 'TR-2026';
    setNroTransporte(`${prefix}-${randomNum}`);
    if (errorMsg) setErrorMsg(null);
  };

  // Cambio de cliente
  const handleCambiarCliente = (cliente: Cliente | null, nombreDisplay: string) => {
    setClienteSeleccionadoObj(cliente);
    setClienteNombre(nombreDisplay);
    setShowClienteDropdown(false);
    setBusquedaCliente('');
    if (cliente) {
      setIdClienteSeleccionado(cliente.idCliente);
      cargarRutasCliente(cliente.idCliente);
    } else {
      setIdClienteSeleccionado('');
      cargarRutasCliente();
    }
  };

  // Submit Handler
  const handleSubmit = async (redirectAAsignacion: boolean) => {
    if (!nroTransporte.trim()) {
      setErrorMsg('Por favor ingrese o genere el N° de transporte o guía.');
      return;
    }

    if (!rutaSeleccionada) {
      setErrorMsg('Por favor seleccione una ruta de transporte para el cliente.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    const obsFinal = observaciones.trim() || 'Viaje Adicional';

    const tripPayload: TripItem = {
      id: `manual-${Date.now()}`,
      nroTransporte: nroTransporte.trim(),
      origenSalida: {
        codigo: origenCodigo,
        nombre: origenSede,
        idPunto: idOrigenPunto || undefined,
        clienteNombre: clienteNombre,
      },
      destinoLlegada: {
        codigo: destinoCodigo,
        nombre: destinoSede,
        idPunto: idDestinoPunto || undefined,
      },
      fechaProgramadaCarga: fechaCargaDate,
      horaProgramadaCarga: horaProgramada,
      fechaEntregaEstimada: fechaCargaDate,
      horaEntregaEstimada: '18:00',
      yaExiste: false,
      colision: false,
      fisico,
      observacion: obsFinal,
      observaciones: obsFinal,
    };

    try {
      await programacionService.confirmarProgramacion(
        [tripPayload],
        idClienteSeleccionado || undefined
      );

      if (onSuccess) {
        onSuccess(tripPayload);
      }

      onClose();

      if (redirectAAsignacion) {
        navigate('/viajes/asignacion-conductores', {
          state: { viajeRecienCreado: tripPayload },
        });
      }
    } catch (err: any) {
      console.warn('Aviso al guardar despacho en backend:', err);
      if (onSuccess) {
        onSuccess(tripPayload);
      }
      onClose();

      if (redirectAAsignacion) {
        navigate('/viajes/asignacion-conductores', {
          state: { viajeRecienCreado: tripPayload },
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clientes filtrados por búsqueda
  const clientesFiltrados = clientesList.filter((c) => {
    if (!busquedaCliente.trim()) return true;
    const q = busquedaCliente.toLowerCase();
    return (
      c.razonSocial?.toLowerCase().includes(q) ||
      (c.nombreComercial && c.nombreComercial.toLowerCase().includes(q)) ||
      (c.rif && c.rif.toLowerCase().includes(q))
    );
  });

  // Avatar / insignia del cliente seleccionado
  const avatarInfo = clienteSeleccionadoObj
    ? obtenerCodigoAvatar(clienteSeleccionadoObj)
    : obtenerCodigoAvatar({ razonSocial: clienteNombre });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[640px] bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-900/15 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto p-5 sm:p-6"
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            {/* Orange squircle with truck icon */}
            <div className="w-12 h-12 rounded-2xl bg-[#feeae1] flex items-center justify-center shrink-0 shadow-2xs">
              <Truck className="w-6 h-6 text-[#e0531c] stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">
                  Registrar Nuevo Viaje
                </h3>
                <span className="bg-[#feebe2] text-[#d95c26] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Paso Rápido 1/1
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal mt-0.5 leading-relaxed">
                Complete la ruta y fecha operativa de carga para emitir la orden.
              </p>
            </div>
          </div>

          {/* Close 'X' Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 flex items-center justify-center transition shrink-0"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>



        {/* ERROR ALERT */}
        {errorMsg && (
          <div className="mt-2.5 p-3 bg-red-50 border border-red-200/80 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* BODY CONTENT */}
        <div className="space-y-3 mt-2.5">
          {/* 1. CLIENTE OPERATIVO / REMITENTE (DESTACADO Y DIFERENCIADO) */}
          <div
            ref={clienteDropdownRef}
            className="relative rounded-2xl p-3 sm:p-3.5 bg-gradient-to-r from-orange-500/[0.09] via-amber-500/[0.04] to-slate-50 border-2 border-orange-300/80 hover:border-orange-400 transition-all shadow-xs"
          >
            {/* Header / Badges de la tarjeta de cliente */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black bg-orange-600 text-white tracking-wider uppercase shadow-2xs">
                  <Building2 className="w-3 h-3 text-orange-100" />
                  Cliente Remitente
                </span>
                <span className="text-[11px] font-bold text-slate-600 hidden sm:inline">
                  Dador de Carga / Facturación
                </span>
              </div>

              {/* Badges de soporte (RIF y Rutas) */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-600 bg-white border border-slate-200/90 px-2 py-0.5 rounded-md shadow-2xs">
                  {clienteSeleccionadoObj?.rif ? `RIF: ${clienteSeleccionadoObj.rif}` : 'RIF: J-00041312-1'}
                </span>
                <span className="text-[10px] font-bold text-orange-700 bg-orange-100/90 border border-orange-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <RouteIcon className="w-2.5 h-2.5" />
                  <span>{rutasList.length} {rutasList.length === 1 ? 'ruta' : 'rutas'}</span>
                </span>
              </div>
            </div>

            {/* Selector interactivo principal */}
            <div className="relative">
              <div
                onClick={() => setShowClienteDropdown(!showClienteDropdown)}
                className="w-full bg-white rounded-xl border border-orange-200/90 hover:border-orange-400 p-2.5 sm:p-3 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {/* Avatar / Insignia de Cliente */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border shadow-2xs transition-transform group-hover:scale-105 ${avatarInfo.estilo}`}>
                    {avatarInfo.codigo}
                  </div>

                  {/* Nombre y Subtítulo */}
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-orange-950 transition truncate">
                        {clienteSeleccionadoObj?.razonSocial || clienteNombre.split('•')[0].trim()}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-2xs" title="Cliente Activo / Verificado" />
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                      {clienteSeleccionadoObj?.nombreComercial
                        ? clienteSeleccionadoObj.nombreComercial
                        : (clienteNombre.includes('•') ? clienteNombre.split('•')[1].trim() : 'C.A. Distribuidora Nacional')}
                      {clienteSeleccionadoObj?.direccionFiscal ? ` • ${clienteSeleccionadoObj.direccionFiscal.split(',')[0]}` : ''}
                    </p>
                  </div>
                </div>

                {/* Botón de Acción 'Cambiar' */}
                <div className="shrink-0 flex items-center gap-1.5 bg-orange-50 group-hover:bg-orange-100/90 text-orange-800 border border-orange-200/90 px-3 py-1.5 rounded-xl font-bold text-xs transition">
                  <span className="hidden sm:inline">Cambiar</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-orange-600 transition-transform duration-200 ${showClienteDropdown ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Dropdown de Selección Enriquecido */}
              {showClienteDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150">
                  {/* Buscador interno */}
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar por razón social, nombre o RIF..."
                      value={busquedaCliente}
                      onChange={(e) => setBusquedaCliente(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-slate-50 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-orange-500 outline-hidden transition"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
                    {/* Opción predeterminada si clientesList está vacía o no tiene Polar */}
                    {(!clientesList.some(c => c.razonSocial.toLowerCase().includes('polar')) || clientesList.length === 0) && (
                      <div
                        onClick={() => handleCambiarCliente(null, 'Empresas Polar • C.A. Distribuidora Nacional')}
                        className={`p-2.5 rounded-xl cursor-pointer font-medium flex items-center justify-between transition ${!clienteSeleccionadoObj
                          ? 'bg-orange-50 border border-orange-200/80 text-orange-950 font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 border border-sky-200/80 font-black text-xs flex items-center justify-center shrink-0">
                            POL
                          </div>
                          <div className="truncate text-left">
                            <div className="truncate font-bold text-xs text-slate-900">
                              Empresas Polar
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              C.A. Distribuidora Nacional • RIF: J-00041312-1
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                          Default
                        </span>
                      </div>
                    )}

                    {/* Lista filtrada de clientes de BD */}
                    {clientesFiltrados.map((c) => {
                      const isSelected = clienteSeleccionadoObj?.idCliente === c.idCliente;
                      const avatar = obtenerCodigoAvatar(c);
                      return (
                        <div
                          key={c.idCliente}
                          onClick={() => handleCambiarCliente(c, `${c.razonSocial}${c.nombreComercial ? ` • ${c.nombreComercial}` : ''}`)}
                          className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between gap-2 ${isSelected
                            ? 'bg-orange-50 border border-orange-200/80 text-orange-950 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 border ${avatar.estilo}`}>
                              {avatar.codigo}
                            </div>
                            <div className="min-w-0 text-left">
                              <div className="truncate font-bold text-xs text-slate-900">
                                {c.razonSocial}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {c.nombreComercial ? `${c.nombreComercial} • ` : ''}RIF: {c.rif || 'N/A'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-orange-600" />
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                Seleccionar
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {clientesFiltrados.length === 0 && clientesList.length > 0 && (
                      <div className="p-4 text-center text-xs text-slate-400 font-medium">
                        No se encontraron clientes con "{busquedaCliente}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2 y 3. N° DE TRANSPORTE Y RUTA LOGÍSTICA ASIGNADA EN UNA SOLA LÍNEA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* N° DE TRANSPORTE O GUÍA */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>N° de Transporte o Guía</span>
                  <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerarNumero}
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-md flex items-center gap-1 transition"
                  title="Auto-generar correlativo"
                >
                  <Sparkles className="w-2.5 h-2.5 text-orange-500" />
                  <span>Generar</span>
                </button>
              </div>

              <div className="relative">
                <div className="w-full bg-white rounded-xl border border-slate-200/90 px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-slate-800 shadow-2xs focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={nroTransporte}
                    onChange={(e) => {
                      setNroTransporte(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Ej. GUA-2026-8942 / TR-00812"
                    className="w-full font-semibold text-slate-800 placeholder:text-slate-300 outline-hidden bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* RUTA LOGÍSTICA ASIGNADA */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1 truncate pr-1">
                  <span>Ruta Logística Asignada</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/70 px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                  <Navigation className="w-2.5 h-2.5 text-teal-600" />
                  <span>{rutaSeleccionada ? `${rutaSeleccionada.distanciaKm || 0} Km` : '0 Km'}</span>
                </span>
              </div>

              <div className="relative" ref={rutaDropdownRef}>
                <div
                  onClick={() => {
                    if (rutasList.length > 0) {
                      setShowRutaDropdown(!showRutaDropdown);
                    }
                  }}
                  className={`w-full bg-white rounded-xl border px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold shadow-2xs transition ${
                    rutasList.length === 0
                      ? 'border-slate-200 text-slate-400 bg-slate-50/70 cursor-not-allowed'
                      : 'border-slate-200/90 text-slate-800 hover:border-orange-400 cursor-pointer'
                  }`}
                  title={rutasList.length === 0 ? 'El cliente no tiene rutas creadas' : 'Seleccionar ruta'}
                >
                  <div className="flex items-center gap-2 truncate pr-1">
                    <RouteIcon className={`w-4 h-4 shrink-0 ${rutasList.length === 0 ? 'text-slate-400' : 'text-orange-500'}`} />
                    <span className="truncate">
                      {isLoadingRutas
                        ? 'Cargando rutas...'
                        : rutasList.length === 0
                        ? 'Sin rutas creadas para este cliente'
                        : (rutaSeleccionada?.nombreRuta || 'Seleccionar ruta')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isLoadingRutas && <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />}
                    {rutasList.length > 0 && (
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showRutaDropdown ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </div>

                {/* Dropdown de Rutas (solo si el cliente tiene rutas creadas) */}
                {showRutaDropdown && rutasList.length > 0 && (
                  <div className="absolute top-full left-0 right-0 sm:w-[380px] sm:-right-0 sm:left-auto mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-52 overflow-y-auto p-1 text-xs">
                    {rutasList.map((r) => {
                      const isSelected = rutaSeleccionada?.idRuta === r.idRuta;
                      return (
                        <div
                          key={r.idRuta}
                          onClick={() => {
                            aplicarRutaSeleccionada(r);
                            setShowRutaDropdown(false);
                            if (errorMsg) setErrorMsg(null);
                          }}
                          className={`px-3 py-2.5 rounded-lg cursor-pointer transition flex items-center justify-between gap-2 ${isSelected
                            ? 'bg-orange-50 text-orange-950 font-bold border border-orange-200/60'
                            : 'hover:bg-slate-50 text-slate-700'
                            }`}
                        >
                          <div className="truncate">
                            <div className="truncate font-semibold text-xs text-slate-800">
                              {r.nombreRuta}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>{r.ciudadOrigen}</span>
                              <span>➔</span>
                              <span>{r.ciudadDestino}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                            {r.distanciaKm} Km
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. PUNTO DE ORIGEN & DESTINO (SOLO VISUALIZACIÓN / DETERMINADOS POR LA RUTA) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* ORIGEN (SOLO MOSTRARLO) */}
            <div className="bg-[#fbfcff] rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <CircleDot className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.2]" />
                  <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                    Punto de Origen (Carga)
                  </span>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  rutaSeleccionada ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'
                }`}>
                  {rutaSeleccionada ? 'Vinculado' : 'Sin ruta'}
                </span>
              </div>

              {/* Display de Solo Lectura */}
              <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between text-xs font-semibold text-slate-800 shadow-2xs">
                <span className="truncate pr-1 text-slate-800">{origenSede || 'Sin punto de origen'}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${rutaSeleccionada ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>

              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{origenDetalle || 'No hay ruta asignada'}</span>
              </div>
            </div>

            {/* DESTINO (SOLO MOSTRARLO) */}
            <div className="bg-[#fbfcff] rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-600 shrink-0 stroke-[2.2]" />
                  <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                    Punto de Destino
                  </span>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  rutaSeleccionada ? 'text-sky-700 bg-sky-50' : 'text-slate-500 bg-slate-100'
                }`}>
                  {rutaSeleccionada ? 'Vinculado' : 'Sin ruta'}
                </span>
              </div>

              {/* Display de Solo Lectura */}
              <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between text-xs font-semibold text-slate-800 shadow-2xs">
                <span className="truncate pr-1 text-slate-800">{destinoSede || 'Sin punto de destino'}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${rutaSeleccionada ? 'bg-sky-500' : 'bg-slate-300'}`} />
              </div>

              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400">
                <Milestone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{destinoDetalle || 'No hay ruta asignada'}</span>
              </div>
            </div>
          </div>

          {/* 5. BLOQUE 2 • VENTANA HORARIA DE CARGA */}
          <div className="bg-[#f4f7fc]/75 border border-blue-100/70 rounded-2xl p-4 space-y-3">
            {/* Header del Bloque */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">
                  Bloque 2 • Ventana Horaria de Carga
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>Sincronización GPS Lista</span>
              </div>
            </div>

            {/* Columnas Fecha y Hora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* FECHA DE CARGA */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Fecha de Carga
                  </span>
                </div>

                <div className="relative">
                  <div className="bg-white rounded-xl border border-slate-200/80 px-3 py-2 flex items-center gap-2 text-xs font-semibold text-slate-800 shadow-2xs">
                    <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{fechaCargaFormatted}</span>
                    <input
                      type="date"
                      value={fechaCargaDate}
                      onChange={(e) => handleCustomDateChange(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>

                {/* Pills Fecha */}
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => handlePillDate('hoy')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${activeDatePill === 'hoy'
                      ? 'bg-[#fedecd] text-[#d95c26] border border-orange-200/60 shadow-2xs'
                      : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/60'
                      }`}
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePillDate('manana')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${activeDatePill === 'manana'
                      ? 'bg-[#fedecd] text-[#d95c26] border border-orange-200/60 shadow-2xs'
                      : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/60'
                      }`}
                  >
                    Mañana
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePillDate('48h')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${activeDatePill === '48h'
                      ? 'bg-[#fedecd] text-[#d95c26] border border-orange-200/60 shadow-2xs'
                      : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/60'
                      }`}
                  >
                    +48h
                  </button>
                </div>
              </div>

              {/* HORA PROGRAMADA */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Hora Programada
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#b45309]">
                    Ventana 2h
                  </span>
                </div>

                <div className="relative">
                  <div className="bg-white rounded-xl border border-slate-200/80 px-3 py-2 flex items-center gap-2 text-xs font-semibold text-slate-800 shadow-2xs">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{horaProgramada}</span>
                  </div>
                </div>

                {/* Pills Horas */}
                <div className="flex items-center gap-1.5 mt-2">
                  {['08:00 AM', '12:00 PM', '04:00 PM'].map((hora) => {
                    const isSelected = horaProgramada === hora;
                    return (
                      <button
                        key={hora}
                        type="button"
                        onClick={() => setHoraProgramada(hora)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${isSelected
                          ? 'bg-[#fedecd] text-[#d95c26] border border-orange-200/60 shadow-2xs'
                          : 'bg-[#e8eef7]/80 hover:bg-[#dfe7f3] text-slate-600'
                          }`}
                      >
                        {hora}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* OBSERVACIONES / RESEÑA DEL VIAJE */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Observaciones / Reseña</span>
              </label>
              <span className="text-[10px] font-semibold text-slate-400">
                Se guardará en Guías de Viajes
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Viaje Adicional"
                className="w-full bg-white rounded-xl border border-slate-200/90 px-3.5 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition shadow-2xs"
              />
            </div>
          </div>

          {/* CONTROL DE DOCUMENTO FÍSICO */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f8fafc] border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition ${
                fisico ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200/80 text-slate-500'
              }`}>
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Documento Físico en Mano
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Marcar si la guía / manifiesto físico ya fue entregado
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={fisico}
                onChange={(e) => setFisico(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* 6. AVISO INFORMATIVO VERDE */}
          <div className="bg-[#eaf7f1] border border-emerald-200/70 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950 leading-snug">
                Este viaje quedará disponible inmediatamente para asignación de conductor y unidad en la grilla principal.
              </p>
              <p className="text-[11px] text-emerald-700/90 mt-0.5 font-medium">
                Notificación automática será enviada a la terminal de carga correspondiente.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition active:scale-[0.98] shadow-2xs"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Guardar y Asignar */}
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl bg-[#feeae1] hover:bg-[#fedecd] text-[#d95c26] border border-orange-200/50 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#d95c26]" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>Guardar y Asignar</span>
            </button>

            {/* Guardar Viaje */}
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-[#f0611e] hover:brightness-105 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 transition"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
              )}
              <span>Guardar Viaje</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
