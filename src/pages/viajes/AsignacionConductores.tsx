import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  Calendar,
  RotateCw,
  Truck,
  CheckCircle2,
  Search,
  MessageCircle,
  Edit2,
  MapPin,
  ChevronDown,
  ChevronUp,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Printer,
  X,
  Copy,
  Maximize2,
  AlertTriangle,
  Save,
  XCircle,
  FileCheck,
  Check,
  ShieldCheck,
  LayoutGrid,
  Download
} from 'lucide-react';
import { conductoresService } from '../../services/conductoresService';
import { programacionService, type GuiaProgramada } from '../../services/programacionService';

// ==========================================
// TIPOS E INTERFACES
// ==========================================

export interface ConductorItem {
  id: string;
  nombre: string;
  iniciales: string;
  telefono: string;
  vehiculo: string;
  placa: string;
  idVehiculoMotriz?: string | null;
  idAcopladoActual?: string | null;
  estado: 'En Patio' | 'Disponible' | 'Ruta Larga' | 'En Reposo';
  horasDescanso?: number;
  eficienciaScore?: number;
}

export interface ViajeAsignacion {
  id: string;
  nroTransporte: string;
  fecha: string;
  hora: string;
  diaSemana: string;
  diaKey: string;
  origenCodigo: string;
  origenNombre: string;
  clienteNombre?: string;
  destinoCodigo: string;
  destinoNombre: string;
  fechaEstimadaLlegada: string;
  distanciaKm: number;
  conductorId: string | null;
  conductorIdEnBD?: string | null;
  idVehiculoMotriz?: string | null;
  idAcoplado?: string | null;
  autoGuardar?: boolean;
  observaciones?: string | null;
  estadoOrden?: string;
  fisico?: boolean;
}

export interface GrupoDia {
  diaKey: string;
  titulo: string;
  pildoraDia: string;
  viajes: ViajeAsignacion[];
  kmTotales: number;
  ventanaHoraria: string;
}

export interface GuiaAsignadaPanel {
  id: string;
  conductorId: string;
  nroTransporte: string;
  diaTexto: string;
  origenNombre: string;
  destinoNombre: string;
}

// ==========================================
// FUNCIONES DE FORMATEO Y MAPEO
// ==========================================

/**
 * Extrae únicamente el día, mes y año de una cadena de fecha (ISO, YYYY-MM-DD o DD/MM/YYYY)
 * sin que la hora ni el desfase de zona horaria alteren el día calendario.
 */
function extraerPartesFecha(fechaStr?: string | null): {
  anio: number;
  mes: number;
  dia: number;
  hours24: number;
  minutes: number;
} | null {
  if (!fechaStr) return null;
  const raw = String(fechaStr).trim();
  if (!raw) return null;

  // Separar la porción de fecha de la porción de hora (T o espacio)
  const soloFecha = raw.split(/[T\s]/)[0].replace(/\./g, '/').replace(/-/g, '/');

  let anio = 0;
  let mes = 0;
  let dia = 0;

  // 1. Formato YYYY/MM/DD
  const matchYMD = soloFecha.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (matchYMD) {
    anio = parseInt(matchYMD[1], 10);
    mes = parseInt(matchYMD[2], 10);
    dia = parseInt(matchYMD[3], 10);
  } else {
    // 2. Formato DD/MM/YYYY
    const matchDMY = soloFecha.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (matchDMY) {
      dia = parseInt(matchDMY[1], 10);
      mes = parseInt(matchDMY[2], 10);
      anio = parseInt(matchDMY[3], 10);
      if (anio < 100) anio += 2000;
    }
  }

  // Hora informativa (extraída del texto sin desplazar la fecha)
  let hours24 = 8;
  let minutes = 0;
  const matchHora = raw.match(/[T\s](\d{1,2}):(\d{2})/);
  if (matchHora) {
    hours24 = parseInt(matchHora[1], 10);
    minutes = parseInt(matchHora[2], 10);
    if (raw.toUpperCase().includes('PM') && hours24 < 12) hours24 += 12;
    if (raw.toUpperCase().includes('AM') && hours24 === 12) hours24 = 0;
  }

  if (anio >= 2000 && anio <= 2100 && mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) {
    return { anio, mes, dia, hours24, minutes };
  }

  // Fallback con métodos UTC para no cambiar de día por zona horaria
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return {
      anio: d.getUTCFullYear(),
      mes: d.getUTCMonth() + 1,
      dia: d.getUTCDate(),
      hours24: d.getUTCHours(),
      minutes: d.getUTCMinutes(),
    };
  }

  return null;
}

function parsearFechaGuia(fechaStr: string) {
  const partes = extraerPartesFecha(fechaStr);
  if (!partes) {
    return {
      fecha: fechaStr || '',
      hora: '08:00 AM',
      diaSemana: 'FECHA PROGRAMADA',
      diaKey: 'sin-fecha',
      pildoraDia: 'S/F'
    };
  }

  const dia = String(partes.dia).padStart(2, '0');
  const mes = String(partes.mes).padStart(2, '0');
  const anio = partes.anio;
  const fecha = `${dia}/${mes}/${anio}`;

  let hours = partes.hours24;
  const minutes = String(partes.minutes).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hora = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

  // Fecha construida exclusivamente con año, mes y día (mediodía local para evitar cualquier cambio por hora)
  const fechaSoloDia = new Date(anio, partes.mes - 1, partes.dia, 12, 0, 0);

  const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
  const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  const diasCorto = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const mesesCorto = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const diaSemana = `${diasSemana[fechaSoloDia.getDay()]} ${dia} DE ${meses[partes.mes - 1]} ${anio}`;
  const pildoraDia = `${diasCorto[fechaSoloDia.getDay()]} ${dia} ${mesesCorto[partes.mes - 1]}`;
  const diaKey = `${anio}-${mes}-${dia}`;

  return { fecha, hora, diaSemana, diaKey, pildoraDia };
}

function formatearFechaEstimada(fechaStr?: string | null) {
  if (!fechaStr) return 'Por definir';
  const partes = extraerPartesFecha(fechaStr);
  if (!partes) return fechaStr;
  const dia = String(partes.dia).padStart(2, '0');
  const mes = String(partes.mes).padStart(2, '0');
  const anio = partes.anio;
  let hours = partes.hours24;
  const minutes = String(partes.minutes).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${dia}/${mes}/${anio} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

function mapGuiaToViaje(g: GuiaProgramada): ViajeAsignacion {
  const { fecha, hora, diaSemana, diaKey } = parsearFechaGuia(g.fechaProgramadaCarga);
  const obsRaw = (g as any).observaciones ?? (g as any).observacion ?? (g as any).observacionesOperativas ?? (g as any).observacionManifiesto ?? null;
  const observaciones = obsRaw && String(obsRaw).trim() && String(obsRaw).trim().toLowerCase() !== 'null'
    ? String(obsRaw).trim()
    : null;

  const idConductorDb = g.idConductor && String(g.idConductor).trim() && String(g.idConductor).trim().toLowerCase() !== 'null'
    ? String(g.idConductor).trim()
    : null;

  return {
    id: g.idOrden,
    nroTransporte: g.nroTransporte || 'S/N',
    fecha,
    hora,
    diaSemana,
    diaKey,
    origenCodigo: g.puntoOrigen?.codigoPuntoc ? `[${g.puntoOrigen.codigoPuntoc}]` : '[S/C]',
    origenNombre: g.puntoOrigen?.nombreSede || 'Planta Origen',
    clienteNombre: g.cliente?.nombreComercial || g.cliente?.razonSocial || '',
    destinoCodigo: g.puntoDestino?.codigoPuntoc ? `[${g.puntoDestino.codigoPuntoc}]` : '[S/C]',
    destinoNombre: g.puntoDestino?.nombreSede || 'Destino',
    fechaEstimadaLlegada: formatearFechaEstimada(g.fechaEntregaEstimada),
    distanciaKm: Number(g.ruta?.distanciaKm || 0),
    conductorId: idConductorDb,
    conductorIdEnBD: idConductorDb,
    idVehiculoMotriz: g.idVehiculoMotriz || g.conductor?.vehiculoHabitual?.idVehiculo || null,
    idAcoplado: g.idAcoplado || g.conductor?.vehiculoHabitual?.idAcopladoActual || null,
    autoGuardar: true,
    observaciones,
    estadoOrden: g.estadoOrden || 'Programado',
    fisico: Boolean(g.fisico),
  };
}

function generarTextoWhatsapp(viaje: ViajeAsignacion): string {
  const tieneObs =
    viaje.observaciones &&
    String(viaje.observaciones).trim() &&
    String(viaje.observaciones).trim().toLowerCase() !== 'null';

  const obsTexto = tieneObs
    ? `\n📝 Observaciones: *${String(viaje.observaciones).trim()}*`
    : '';

  const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
  const partesFecha = extraerPartesFecha(viaje.fecha);
  const nombreDia = partesFecha
    ? diasSemana[new Date(partesFecha.anio, partesFecha.mes - 1, partesFecha.dia, 12, 0, 0).getDay()]
    : viaje.diaSemana
      ? viaje.diaSemana.split(' ')[0].toUpperCase()
      : '';
  const diaPrefijo = nombreDia ? `${nombreDia} ` : '';

  const puntoCarga = ` ${(viaje.origenNombre || 'Origen').toUpperCase()}`;
  const puntoDescarga = ` ${(viaje.destinoNombre || 'Destino').toUpperCase()}`;

  return `🚛 *ORDEN DE CARGA & DESPACHO*

📅 Fecha: *${diaPrefijo}${viaje.fecha}*

📋 Guía/TR: *${viaje.nroTransporte}*

🏭 Punto de Carga: *${puntoCarga}*
📍 Punto de Descarga: *${puntoDescarga}*${obsTexto}

Por favor confirmar recepción y reporte de presencia en patio.`;
}

export default function AsignacionConductores() {
  const navigate = useNavigate();

  // Estados de datos
  const [conductores, setConductores] = useState<ConductorItem[]>([]);
  // La tabla inicia vacía hasta consultar con cliente e intervalo
  const [viajes, setViajes] = useState<ViajeAsignacion[]>([]);
  const [guiasPanel, setGuiasPanel] = useState<GuiaAsignadaPanel[]>([]);

  // Estados de interfaz y filtrado
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [presetFechaActivo, setPresetFechaActivo] = useState<'hoy' | 'manana' | 'mes' | null>(null);
  const [tabDiaActivo, setTabDiaActivo] = useState<string>('todos');
  const [terminoBusqueda, setTerminoBusqueda] = useState<string>('');
  const [gruposColapsados, setGruposColapsados] = useState<Record<string, boolean>>({});
  const [panelDerechoAbierto, setPanelDerechoAbierto] = useState<boolean>(true);

  // Estados de sincronización y feedback
  const [cargandoViajes, setCargandoViajes] = useState<boolean>(false);
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  // Modales
  const [viajeParaAsignarUrgente, setViajeParaAsignarUrgente] = useState<ViajeAsignacion | null>(null);
  const [viajeParaWhatsapp, setViajeParaWhatsapp] = useState<ViajeAsignacion | null>(null);
  const [mensajeWhatsapp, setMensajeWhatsapp] = useState<string>('');
  const [viajesConWhatsappEnviado, setViajesConWhatsappEnviado] = useState<string[]>(() => {
    try {
      const guardado = localStorage.getItem('flota_whatsapp_enviados');
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  });

  const marcarWhatsappEnviado = (viajeId: string) => {
    setViajesConWhatsappEnviado((prev) => {
      if (prev.includes(viajeId)) return prev;
      const nuevo = [...prev, viajeId];
      try {
        localStorage.setItem('flota_whatsapp_enviados', JSON.stringify(nuevo));
      } catch {
        // ignore
      }
      return nuevo;
    });
  };

  const desmarcarWhatsappEnviado = (viajeId: string) => {
    setViajesConWhatsappEnviado((prev) => {
      const nuevo = prev.filter((id) => id !== viajeId);
      try {
        localStorage.setItem('flota_whatsapp_enviados', JSON.stringify(nuevo));
      } catch {
        // ignore
      }
      return nuevo;
    });
  };

  useEffect(() => {
    if (viajeParaWhatsapp) {
      setMensajeWhatsapp(generarTextoWhatsapp(viajeParaWhatsapp));
    }
  }, [viajeParaWhatsapp]);

  const [viajeParaRuta, setViajeParaRuta] = useState<ViajeAsignacion | null>(null);
  const [viajeParaEditar, setViajeParaEditar] = useState<ViajeAsignacion | null>(null);
  const [obsEditada, setObsEditada] = useState<string>('');
  const [conductorItinerarioModal, setConductorItinerarioModal] = useState<ConductorItem | null>(null);

  // Estados de Cancelación Rápida & Guardado individual
  const [viajeParaCancelar, setViajeParaCancelar] = useState<ViajeAsignacion | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState<string>('');
  const [cancelandoViaje, setCancelandoViaje] = useState<boolean>(false);
  const [guardandoViajeId, setGuardandoViajeId] = useState<string | null>(null);
  const [actualizandoFisicoId, setActualizandoFisicoId] = useState<string | null>(null);

  // Selección de viajes para generar la Matriz Consolidada
  const [viajesSeleccionadosIds, setViajesSeleccionadosIds] = useState<string[]>([]);
  const [modalMatrizAbierto, setModalMatrizAbierto] = useState<boolean>(false);
  const [vistaMatriz, setVistaMatriz] = useState<'tabla' | 'conductores'>('tabla');

  // Cargar conductores desde la base de datos al montar
  useEffect(() => {
    async function fetchCatalogos() {
      try {
        const drivers = await conductoresService.getConductores().catch(() => []);

        if (drivers && drivers.length > 0) {
          const formateados: ConductorItem[] = drivers.map((d) => {
            const nombres = `${d.nombres || ''} ${d.apellidos || ''}`.trim() || 'Conductor';
            const partes = nombres.split(' ');
            const ini = partes.length >= 2 ? `${partes[0][0]}${partes[1][0]}`.toUpperCase() : nombres.slice(0, 2).toUpperCase();
            return {
              id: d.idConductor,
              nombre: nombres,
              iniciales: ini,
              telefono: d.telefono || '+58 414-0000000',
              vehiculo: d.vehiculoHabitual ? `${d.vehiculoHabitual.marca || 'Tracto'}` : 'Tracto Camión',
              placa: d.vehiculoHabitual?.placa || 'A00XX00',
              idVehiculoMotriz: d.idVehiculoHabitual || d.vehiculoHabitual?.idVehiculo || null,
              idAcopladoActual: d.vehiculoHabitual?.idAcopladoActual || null,
              estado: (d.estado?.toLowerCase() === 'activo' ? 'Disponible' : 'En Patio') as any,
              horasDescanso: 14,
              eficienciaScore: 98
            };
          });

          setConductores(formateados);
        }
      } catch (err) {
        console.warn('Error inicializando catálogos de asignación:', err);
      }
    }
    fetchCatalogos();
  }, []);

  const mostrarToast = (mensaje: string) => {
    setToastMensaje(mensaje);
    setTimeout(() => {
      setToastMensaje(null);
    }, 3800);
  };

  // Carga directa reutilizable filtrada únicamente por fechas (excluyendo planchas generadas)
  const cargarViajesDirecto = async (inicio: string, fin: string) => {
    setCargandoViajes(true);
    try {
      const guias = await programacionService.getGuiasProgramadas({
        fechaInicio: inicio,
        fechaFin: fin,
        estadoOrden: 'todos',
      });

      // Excluir planchas de retorno generadas para mostrar únicamente los viajes principales
      const guiasPrincipales = (guias || []).filter((g) => {
        const obs = String(g.observaciones || '');
        return (
          !obs.includes('[RETORNO_DE:') &&
          !obs.includes('[RETORNO]') &&
          !obs.includes('[PLANCHA_ADICIONAL') &&
          !obs.toLowerCase().includes('retorno')
        );
      });

      const viajesMapeados = guiasPrincipales.map(mapGuiaToViaje);
      setViajes(viajesMapeados);
      setViajesSeleccionadosIds(viajesMapeados.filter((v) => v.estadoOrden !== 'Cancelado').map((v) => v.id));

      // Reconstruir guiasPanel a partir de las guias principales que ya tienen conductor en BD y no están canceladas
      const panelItems: GuiaAsignadaPanel[] = [];
      guiasPrincipales.forEach((g) => {
        if (g.idConductor && g.estadoOrden !== 'Cancelado') {
          const { diaSemana, hora } = parsearFechaGuia(g.fechaProgramadaCarga);
          const diaCorto = diaSemana.split(' ')[0] || '';
          panelItems.push({
            id: `g-${g.idOrden}`,
            conductorId: g.idConductor,
            nroTransporte: g.nroTransporte || 'S/N',
            diaTexto: `${diaCorto} • ${hora}`,
            origenNombre: g.puntoOrigen?.nombreSede || 'Origen',
            destinoNombre: g.puntoDestino?.nombreSede || 'Destino',
          });
        }
      });
      setGuiasPanel(panelItems);
    } catch (error) {
      console.error('Error al consultar guias_viajes:', error);
    } finally {
      setCargandoViajes(false);
    }
  };

  const formatearFechaLocalISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleSeleccionarPresetFecha = async (preset: 'hoy' | 'manana' | 'mes') => {
    const ahora = new Date();
    let ini = '';
    let fin = '';

    if (preset === 'hoy') {
      ini = formatearFechaLocalISO(ahora);
      fin = ini;
    } else if (preset === 'manana') {
      const manana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1);
      ini = formatearFechaLocalISO(manana);
      fin = ini;
    } else if (preset === 'mes') {
      const primerDia = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const ultimoDia = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
      ini = formatearFechaLocalISO(primerDia);
      fin = formatearFechaLocalISO(ultimoDia);
    }

    setPresetFechaActivo(preset);
    setFechaInicio(ini);
    setFechaFin(fin);
    setTabDiaActivo('todos');
    await cargarViajesDirecto(ini, fin);
  };

  // Función para consultar guias_viajes por intervalo de fechas
  const handleCargarViajes = async () => {
    if (!fechaInicio || !fechaFin) {
      mostrarToast('Por favor especifique la fecha de inicio y fin del intervalo.');
      return;
    }
    if (fechaInicio > fechaFin) {
      mostrarToast('La fecha "Desde" no puede ser posterior a la fecha "Hasta".');
      return;
    }

    mostrarToast('Consultando viajes programados en guias_viajes...');
    await cargarViajesDirecto(fechaInicio, fechaFin);
    mostrarToast('Viajes programados actualizados para el intervalo seleccionado.');
  };

  // Asignar conductor a viaje (actualiza la asignación en la interfaz y panel)
  const asignarConductorAViaje = (viajeId: string, conductorId: string | null) => {
    const choferSeleccionado = conductorId ? conductores.find((c) => c.id === conductorId) : null;

    setViajes((prev) =>
      prev.map((v) =>
        v.id === viajeId
          ? {
            ...v,
            conductorId: conductorId,
            idVehiculoMotriz: choferSeleccionado?.idVehiculoMotriz ?? null,
            idAcoplado: choferSeleccionado?.idAcopladoActual ?? null,
          }
          : v
      )
    );

    const viaje = viajes.find((v) => v.id === viajeId);
    if (!viaje) return;

    if (conductorId) {
      const chofer = choferSeleccionado;
      setGuiasPanel((prev) => {
        const filtradas = prev.filter((g) => g.nroTransporte !== viaje.nroTransporte);
        return [
          ...filtradas,
          {
            id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            conductorId: conductorId,
            nroTransporte: viaje.nroTransporte,
            diaTexto: `${viaje.fecha} • ${viaje.hora}`,
            origenNombre: viaje.origenNombre,
            destinoNombre: viaje.destinoNombre,
          }
        ];
      });
      mostrarToast(`Chofer ${chofer?.nombre || 'seleccionado'} asignado a TR-${viaje.nroTransporte}. Presione guardar para registrar en BD.`);
    } else {
      setGuiasPanel((prev) => prev.filter((g) => g.nroTransporte !== viaje.nroTransporte));
      mostrarToast(`Asignación liberada para TR-${viaje.nroTransporte}. Presione guardar para registrar en BD.`);
    }
  };

  // Guardar viaje individual (persistir asignación y observaciones en BD)
  const handleGuardarViaje = async (viaje: ViajeAsignacion) => {
    setGuardandoViajeId(viaje.id);
    try {
      const chofer = viaje.conductorId ? conductores.find((c) => c.id === viaje.conductorId) : null;
      const idVehiculoMotriz = viaje.conductorId
        ? chofer?.idVehiculoMotriz ?? viaje.idVehiculoMotriz ?? null
        : null;
      const idAcoplado = viaje.conductorId
        ? chofer?.idAcopladoActual ?? viaje.idAcoplado ?? null
        : null;

      const guiaActualizada = await programacionService.asignarConductor(
        viaje.id,
        viaje.conductorId || null,
        idVehiculoMotriz,
        idAcoplado
      );

      if (viaje.observaciones !== undefined) {
        await programacionService.actualizarObservacion(viaje.id, viaje.observaciones || null);
      }

      setViajes((prev) =>
        prev.map((v) =>
          v.id === viaje.id
            ? {
              ...v,
              conductorIdEnBD: viaje.conductorId || null,
              idVehiculoMotriz: guiaActualizada?.idVehiculoMotriz ?? idVehiculoMotriz,
              idAcoplado: guiaActualizada?.idAcoplado ?? idAcoplado,
            }
            : v
        )
      );

      mostrarToast(`Viaje TR-${viaje.nroTransporte} guardado con éxito en BD.`);
    } catch (error: any) {
      console.error('Error al guardar viaje:', error);
      const msg = error?.response?.data?.message || `Error al guardar TR-${viaje.nroTransporte}. Intente nuevamente.`;
      mostrarToast(msg);
    } finally {
      setGuardandoViajeId(null);
    }
  };

  // Alternar estado de documento físico en mano (guía física recibida)
  const handleToggleFisico = async (viaje: ViajeAsignacion) => {
    const nuevoValor = !viaje.fisico;
    setActualizandoFisicoId(viaje.id);

    // Actualización optimista
    setViajes((prev) =>
      prev.map((v) => (v.id === viaje.id ? { ...v, fisico: nuevoValor } : v))
    );

    try {
      await programacionService.actualizarFisico(viaje.id, nuevoValor);
      mostrarToast(
        nuevoValor
          ? `Guía TR-${viaje.nroTransporte} marcada como FÍSICO recibido.`
          : `Guía TR-${viaje.nroTransporte} marcada como SIN FÍSICO (pendiente).`
      );
    } catch (error: any) {
      console.error('Error al actualizar estado físico:', error);
      // Revertir en caso de fallo
      setViajes((prev) =>
        prev.map((v) => (v.id === viaje.id ? { ...v, fisico: !nuevoValor } : v))
      );
      const msg = error?.response?.data?.message || `Error al actualizar estado físico de TR-${viaje.nroTransporte}`;
      mostrarToast(msg);
    } finally {
      setActualizandoFisicoId(null);
    }
  };

  // Abrir modal de cancelación rápida
  const abrirModalCancelar = (viaje: ViajeAsignacion) => {
    setViajeParaCancelar(viaje);
    setMotivoCancelacion('');
  };

  // Confirmar cancelación del viaje (cambio de estado_orden a Cancelado con motivo)
  const handleConfirmarCancelacion = async () => {
    if (!viajeParaCancelar) return;
    if (!motivoCancelacion.trim()) {
      mostrarToast('Por favor ingrese una observación o motivo de cancelación.');
      return;
    }

    setCancelandoViaje(true);
    try {
      const guiaActualizada = await programacionService.cancelarViaje(viajeParaCancelar.id, motivoCancelacion.trim());

      const obsMotivo = motivoCancelacion.trim();
      const obsFinal = guiaActualizada?.observaciones || (
        viajeParaCancelar.observaciones
          ? `${obsMotivo} | Previo: ${viajeParaCancelar.observaciones}`
          : obsMotivo
      );

      // Actualizar el viaje a estado Cancelado y reflejar la observación sin sacarlo de la tabla
      setViajes((prev) =>
        prev.map((v) =>
          v.id === viajeParaCancelar.id
            ? {
              ...v,
              estadoOrden: 'Cancelado',
              observaciones: obsFinal,
              conductorId: null,
              conductorIdEnBD: null,
              idVehiculoMotriz: null,
              idAcoplado: null,
            }
            : v
        )
      );

      // Liberar en panel derecho si estaba asignado
      setGuiasPanel((prev) => prev.filter((g) => g.nroTransporte !== viajeParaCancelar.nroTransporte));

      mostrarToast(`Viaje TR-${viajeParaCancelar.nroTransporte} cancelado con éxito.`);
      setViajeParaCancelar(null);
      setMotivoCancelacion('');
    } catch (error) {
      console.error('Error al cancelar viaje:', error);
      mostrarToast('Error al cancelar el viaje en base de datos.');
    } finally {
      setCancelandoViaje(false);
    }
  };

  // Liberar todos los viajes de un conductor
  const liberarTodosDeConductor = async (conductorId: string) => {
    const chofer = conductores.find((c) => c.id === conductorId);
    setGuiasPanel((prev) => prev.filter((g) => g.conductorId !== conductorId));
    setViajes((prev) =>
      prev.map((v) =>
        v.conductorId === conductorId
          ? { ...v, conductorId: null, conductorIdEnBD: null, idVehiculoMotriz: null, idAcoplado: null }
          : v
      )
    );
    mostrarToast(`Se liberaron los viajes asignados a ${chofer?.nombre || 'el conductor'}.`);

    try {
      await programacionService.liberarConductor(conductorId);
    } catch (err) {
      console.error('Error liberando conductor en backend:', err);
    }
  };

  // Toggle autoguardar por grupo
  const toggleAutoGuardar = (diaKey: string) => {
    setViajes((prev) =>
      prev.map((v) => (v.diaKey === diaKey ? { ...v, autoGuardar: !v.autoGuardar } : v))
    );
    mostrarToast('Preferencia de auto-guardado actualizada.');
  };

  // Toggle colapsar grupo
  const toggleColapso = (diaKey: string) => {
    setGruposColapsados((prev) => ({
      ...prev,
      [diaKey]: !prev[diaKey]
    }));
  };

  // Viajes filtrados por búsqueda y por tab de día
  const viajesFiltrados = useMemo(() => {
    return viajes.filter((v) => {
      // Filtro por tab de día
      if (tabDiaActivo !== 'todos' && v.diaKey !== tabDiaActivo) {
        return false;
      }
      // Búsqueda libre
      if (terminoBusqueda.trim()) {
        const term = terminoBusqueda.toLowerCase();
        const conductor = conductores.find((c) => c.id === v.conductorId);
        const matchTr = v.nroTransporte.toLowerCase().includes(term);
        const matchOrigen = v.origenNombre.toLowerCase().includes(term) || v.origenCodigo.toLowerCase().includes(term);
        const matchCliente = (v.clienteNombre || '').toLowerCase().includes(term);
        const matchDestino = v.destinoNombre.toLowerCase().includes(term) || v.destinoCodigo.toLowerCase().includes(term);
        const matchChofer = conductor ? conductor.nombre.toLowerCase().includes(term) || conductor.vehiculo.toLowerCase().includes(term) || conductor.placa.toLowerCase().includes(term) : false;
        const matchObs = v.observaciones ? v.observaciones.toLowerCase().includes(term) : false;
        const matchFisico = (v.fisico ? 'fisico físico con fisico con físico' : 'sin fisico sin físico').includes(term);
        return matchTr || matchOrigen || matchCliente || matchDestino || matchChofer || matchObs || matchFisico;
      }
      return true;
    });
  }, [viajes, tabDiaActivo, terminoBusqueda, conductores]);

  // Agrupación dinámica de viajes por día cronológico
  const gruposPorDia: GrupoDia[] = useMemo(() => {
    if (viajesFiltrados.length === 0) return [];

    const mapaDias = new Map<string, { diaKey: string; titulo: string; pildora: string; viajes: ViajeAsignacion[] }>();

    viajesFiltrados.forEach((v) => {
      if (!mapaDias.has(v.diaKey)) {
        const partes = v.fecha.split('/');
        let pildora = v.diaKey;
        if (partes.length === 3) {
          const d = new Date(parseInt(partes[2], 10), parseInt(partes[1], 10) - 1, parseInt(partes[0], 10));
          if (!isNaN(d.getTime())) {
            const diasCorto = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const mesesCorto = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            pildora = `${diasCorto[d.getDay()]} ${partes[0]} ${mesesCorto[d.getMonth()]}`;
          }
        }

        mapaDias.set(v.diaKey, {
          diaKey: v.diaKey,
          titulo: v.diaSemana || `VIAJES DEL ${v.fecha}`,
          pildora,
          viajes: [],
        });
      }
      mapaDias.get(v.diaKey)!.viajes.push(v);
    });

    const ordenados = Array.from(mapaDias.keys()).sort();

    return ordenados.map((key) => {
      const g = mapaDias.get(key)!;
      const vDia = g.viajes;
      const km = vDia.reduce((acc, curr) => acc + (Number(curr.distanciaKm) || 0), 0);
      const ventana = vDia.length > 0 ? `${vDia[0].hora} — ${vDia[vDia.length - 1].hora}` : 'Ventana Operativa';

      return {
        diaKey: g.diaKey,
        titulo: g.titulo,
        pildoraDia: g.pildora,
        viajes: vDia,
        kmTotales: km,
        ventanaHoraria: ventana
      };
    });
  }, [viajesFiltrados]);

  // Pestañas / Píldoras de días disponibles generadas dinámicamente
  const diasDisponiblesPills = useMemo(() => {
    const mapa = new Map<string, { diaKey: string; label: string; count: number }>();
    viajes.forEach((v) => {
      if (!mapa.has(v.diaKey)) {
        const partes = v.fecha.split('/');
        let label = v.diaKey;
        if (partes.length === 3) {
          const d = new Date(parseInt(partes[2], 10), parseInt(partes[1], 10) - 1, parseInt(partes[0], 10));
          if (!isNaN(d.getTime())) {
            const diasCorto = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const mesesCorto = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            label = `${diasCorto[d.getDay()]} ${partes[0]} ${mesesCorto[d.getMonth()]}`;
          }
        }
        mapa.set(v.diaKey, { diaKey: v.diaKey, label, count: 0 });
      }
      mapa.get(v.diaKey)!.count++;
    });

    return Array.from(mapa.values()).sort((a, b) => a.diaKey.localeCompare(b.diaKey));
  }, [viajes]);

  // Conteo de viajes activos sin chofer
  const conteoSinChofer = useMemo(() => {
    return viajes.filter((v) => !v.conductorId && v.estadoOrden !== 'Cancelado').length;
  }, [viajes]);

  // Conteo de viajes activos con documento físico
  const conteoConFisico = useMemo(() => {
    return viajes.filter((v) => v.fisico && v.estadoOrden !== 'Cancelado').length;
  }, [viajes]);

  // Conductores con viajes asignados para el panel derecho (Lote Activo)
  const conductoresConAsignacion = useMemo(() => {
    const listado: { conductor: ConductorItem; guias: GuiaAsignadaPanel[] }[] = [];

    conductores.forEach((chofer) => {
      const gList = guiasPanel.filter((g) => g.conductorId === chofer.id);
      if (gList.length > 0) {
        listado.push({
          conductor: chofer,
          guias: gList
        });
      }
    });

    return listado;
  }, [conductores, guiasPanel]);

  // Helpers de selección de viajes para la matriz
  const viajesSeleccionadosSet = useMemo(() => new Set(viajesSeleccionadosIds), [viajesSeleccionadosIds]);

  const viajesSeleccionadosLista = useMemo(() => {
    const conductorNombreById = new Map<string, string>();
    conductores.forEach((c) => conductorNombreById.set(c.id, c.nombre));

    return viajes
      .filter((v) => viajesSeleccionadosSet.has(v.id))
      .sort((a, b) => {
        const cmpDia = (a.diaKey || '').localeCompare(b.diaKey || '');
        if (cmpDia !== 0) return cmpDia;

        const nombreA = a.conductorId ? conductorNombreById.get(a.conductorId) ?? '' : '';
        const nombreB = b.conductorId ? conductorNombreById.get(b.conductorId) ?? '' : '';

        if (!nombreA && nombreB) return 1;
        if (nombreA && !nombreB) return -1;

        const cmpConductor = nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
        if (cmpConductor !== 0) return cmpConductor;

        return (a.nroTransporte || '').localeCompare(b.nroTransporte || '', 'es', { numeric: true });
      });
  }, [viajes, viajesSeleccionadosSet, conductores]);

  const todosVisiblesSeleccionados = useMemo(() => {
    if (viajesFiltrados.length === 0) return false;
    return viajesFiltrados.every((v) => viajesSeleccionadosSet.has(v.id));
  }, [viajesFiltrados, viajesSeleccionadosSet]);

  const toggleSeleccionViaje = (viajeId: string) => {
    setViajesSeleccionadosIds((prev) =>
      prev.includes(viajeId) ? prev.filter((id) => id !== viajeId) : [...prev, viajeId]
    );
  };

  const toggleSeleccionarTodosVisibles = () => {
    if (todosVisiblesSeleccionados) {
      const idsVisibles = new Set(viajesFiltrados.map((v) => v.id));
      setViajesSeleccionadosIds((prev) => prev.filter((id) => !idsVisibles.has(id)));
    } else {
      const nuevos = new Set(viajesSeleccionadosIds);
      viajesFiltrados.forEach((v) => nuevos.add(v.id));
      setViajesSeleccionadosIds(Array.from(nuevos));
    }
  };

  const toggleSeleccionarGrupo = (viajesGrupo: ViajeAsignacion[]) => {
    const todosEnGrupoSeleccionados =
      viajesGrupo.length > 0 && viajesGrupo.every((v) => viajesSeleccionadosSet.has(v.id));
    const idsGrupo = new Set(viajesGrupo.map((v) => v.id));

    if (todosEnGrupoSeleccionados) {
      setViajesSeleccionadosIds((prev) => prev.filter((id) => !idsGrupo.has(id)));
    } else {
      const nuevos = new Set(viajesSeleccionadosIds);
      viajesGrupo.forEach((v) => nuevos.add(v.id));
      setViajesSeleccionadosIds(Array.from(nuevos));
    }
  };

  const handleAbrirMatrizSeleccionados = () => {
    if (viajes.length === 0) {
      mostrarToast('Primero cargue los viajes programados por fecha para generar la matriz.');
      return;
    }
    if (viajesSeleccionadosIds.length === 0) {
      mostrarToast('Seleccione al menos un viaje en la tabla para generar la matriz.');
      return;
    }
    setModalMatrizAbierto(true);
  };

  const handleExportarMatrizCSV = () => {
    if (viajesSeleccionadosLista.length === 0) return;
    const encabezados = ['FECHA', 'NRO_TRANSPORTE', 'CLIENTE', 'ORIGEN', 'DESTINO', 'CONDUCTOR', 'UNIDAD_PLACA', 'FISICO', 'ESTADO', 'OBSERVACIONES'];
    const filas = viajesSeleccionadosLista.map((v) => {
      const ch = conductores.find((c) => c.id === v.conductorId);
      const choferNombre = ch ? ch.nombre : 'Sin asignar';
      const unidadPlaca = ch ? `${ch.vehiculo} - ${ch.placa}` : 'Sin unidad';
      const fisicoTxt = v.fisico ? 'FÍSICO RECIBIDO' : 'SIN FÍSICO';
      const obsTxt = (v.observaciones || '').replace(/"/g, '""');
      return `"${v.fecha}","${v.nroTransporte}","${v.clienteNombre || ''}","${v.origenCodigo} ${v.origenNombre}","${v.destinoCodigo} ${v.destinoNombre}","${choferNombre}","${unidadPlaca}","${fisicoTxt}","${v.estadoOrden || 'Programado'}","${obsTxt}"`;
    });

    const csv = '\uFEFF' + [encabezados.join(','), ...filas].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Matriz_Despacho_Seleccionados_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    mostrarToast(`Matriz exportada con ${viajesSeleccionadosLista.length} viajes seleccionados.`);
  };

  const handleCopiarMatrizPortapapeles = async () => {
    if (viajesSeleccionadosLista.length === 0) return;
    const lineas = viajesSeleccionadosLista.map((v, idx) => {
      const ch = conductores.find((c) => c.id === v.conductorId);
      const choferNombre = ch ? `${ch.nombre} (${ch.placa})` : 'Sin conductor';
      return `${idx + 1}. [${v.fecha}] ${v.nroTransporte} | ${v.clienteNombre || 'Cliente'} | ${v.origenNombre} ➔ ${v.destinoNombre} | Chofer: ${choferNombre}`;
    });
    const texto = `📊 MATRIZ DE DESPACHO (${viajesSeleccionadosLista.length} VIAJES)\n\n` + lineas.join('\n');
    try {
      await navigator.clipboard.writeText(texto);
      mostrarToast('Matriz copiada al portapapeles.');
    } catch {
      mostrarToast('No se pudo copiar la matriz.');
    }
  };

  // Handler para imprimir / generar PDF idéntico a la Matriz General
  const handleImprimirMatrizPDF = () => {
    if (viajesSeleccionadosLista.length === 0) {
      mostrarToast('Seleccione al menos un viaje para generar el PDF de la matriz.');
      return;
    }

    const escapeHtml = (value: string | number | null | undefined): string =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const totalSel = viajesSeleccionadosLista.length;
    const conConductorSel = viajesSeleccionadosLista.filter((v) => v.conductorId).length;
    const sinConductorSel = totalSel - conConductorSel;
    const clientesUnicosSel = new Set(viajesSeleccionadosLista.map((v) => v.clienteNombre).filter(Boolean)).size || 1;
    const conFisicoSel = viajesSeleccionadosLista.filter((v) => v.fisico).length;
    const fechaGeneracion = new Date().toLocaleString('es-VE', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    const filasHtml = viajesSeleccionadosLista
      .map((v, idx) => {
        const ch = conductores.find((c) => c.id === v.conductorId);
        const clienteHtml = v.clienteNombre
          ? `<div class="cliente-sub">${escapeHtml(v.clienteNombre.toLowerCase())}</div>`
          : '';
        const conductorHtml = ch
          ? `<div class="conductor-wrap"><span class="avatar">${escapeHtml(ch.iniciales)}</span><span class="conductor-name">${escapeHtml(ch.nombre)}</span></div>`
          : `<span class="badge-unassigned">Sin asignar</span>`;
        const unidadHtml = ch
          ? `<span class="unidad-txt"><strong>${escapeHtml(ch.placa)}</strong></span>`
          : `<span class="muted">&mdash;</span>`;

        return `
          <tr>
            <td class="col-num">${idx + 1}</td>
            <td class="col-fecha">${escapeHtml(v.fecha)}</td>
            <td class="col-tr">${escapeHtml(v.nroTransporte)}</td>
            <td>
              <div class="loc-main">${escapeHtml(v.origenNombre)}</div>
              ${clienteHtml}
            </td>
            <td>
              <div class="loc-sub">${escapeHtml(v.destinoNombre)}</div>
            </td>
            <td>${conductorHtml}</td>
            <td class="nowrap">${unidadHtml}</td>
          </tr>
        `;
      })
      .join('');

    const estadoConductorBadge =
      sinConductorSel > 0
        ? `<span class="kpi-pill amber">${sinConductorSel} Pend.</span>`
        : `<span class="kpi-pill emerald">100% Listo</span>`;

    const htmlDoc = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Matriz Operativa de Viajes Seleccionados</title>
  <style>
    @page { size: landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .sheet {
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      background: #ffffff;
    }
    .header {
      background: linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      color: #ffffff;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-icon {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: #f97316;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 16px;
      flex-shrink: 0;
    }
    .header-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .sync-pill {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(249, 115, 22, 0.2);
      color: #fdba74;
      border: 1px solid rgba(249, 115, 22, 0.35);
    }
    .count-meta {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
    }
    .header h1 {
      margin: 0;
      font-size: 17px;
      font-weight: 900;
      letter-spacing: -0.01em;
    }
    .header-right {
      text-align: right;
      font-size: 10px;
      color: #cbd5e1;
      font-weight: 600;
    }
    .header-right strong {
      display: block;
      color: #ffffff;
      font-size: 11px;
      margin-bottom: 2px;
    }
    .kpis {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      padding: 12px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .kpi-label {
      display: block;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94a3b8;
      margin-bottom: 2px;
    }
    .kpi-val {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
    }
    .kpi-val.emerald { color: #047857; }
    .kpi-val.teal { color: #0f766e; }
    .kpi-sub {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
    }
    .kpi-pill {
      font-size: 9px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .kpi-pill.orange { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
    .kpi-pill.emerald { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .kpi-pill.amber { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .kpi-pill.slate { background: #f1f5f9; color: #475569; }
    .kpi-pill.teal { background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; }
    .table-wrap {
      padding: 14px 20px;
      background: #f8fafc;
    }
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      text-align: left;
    }
    thead tr {
      background: #fff9f4;
      border-bottom: 1px solid #fed7aa;
    }
    th {
      padding: 9px 10px;
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
    }
    th.col-fisico { text-align: center; }
    tbody tr {
      border-bottom: 1px solid #f1f5f9;
      page-break-inside: avoid;
    }
    tbody tr:last-child { border-bottom: none; }
    td {
      padding: 8px 10px;
      vertical-align: middle;
    }
    .col-num { font-weight: 700; color: #94a3b8; width: 28px; }
    .col-fecha { font-weight: 700; color: #334155; white-space: nowrap; }
    .col-tr { font-weight: 900; color: #0f172a; white-space: nowrap; }
    .loc-main { font-weight: 700; color: #1e293b; }
    .loc-sub { font-weight: 600; color: #334155; }
    .code-ori { color: #047857; font-weight: 800; margin-right: 3px; }
    .code-des { color: #0f766e; font-weight: 800; margin-right: 3px; }
    .cliente-sub {
      font-size: 9.5px;
      font-weight: 600;
      color: #f97316;
      text-transform: capitalize;
      margin-top: 1px;
    }
    .conductor-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .avatar {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      background: #d1fae5;
      color: #065f46;
      font-size: 9px;
      font-weight: 900;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .conductor-name { font-weight: 700; color: #0f172a; }
    .badge-unassigned {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 9.5px;
      font-weight: 700;
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .unidad-txt { font-weight: 600; color: #334155; }
    .unidad-txt strong { color: #0f172a; }
    .muted { color: #94a3b8; }
    .nowrap { white-space: nowrap; }
    .col-fisico { text-align: center; white-space: nowrap; }
    .badge-fisico {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 9.5px;
      font-weight: 700;
    }
    .badge-fisico.ok { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-fisico.pend { background: #f1f5f9; color: #64748b; }
    .footer {
      padding: 10px 20px;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #64748b;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="header-left">
        <div class="header-icon">&#9638;</div>
        <div>
          <div class="header-meta">
            <span class="sync-pill">Sincronizado en Tiempo Real</span>
            <span class="count-meta">&bull; ${totalSel} ${totalSel === 1 ? 'viaje incluido' : 'viajes incluidos'}</span>
          </div>
          <h1>Matriz Operativa de Viajes Seleccionados</h1>
        </div>
      </div>
      <div class="header-right">
        <strong>Matriz General</strong>
        Generado: ${escapeHtml(fechaGeneracion)}
      </div>
    </div>

    <div class="kpis">
      <div class="kpi-card">
        <div>
          <span class="kpi-label">Viajes en Matriz</span>
          <span class="kpi-val">${totalSel}</span>
        </div>
        <span class="kpi-pill orange">Seleccionados</span>
      </div>
      <div class="kpi-card">
        <div>
          <span class="kpi-label">Con Conductor</span>
          <span class="kpi-val emerald">${conConductorSel} <span class="kpi-sub">/ ${totalSel}</span></span>
        </div>
        ${estadoConductorBadge}
      </div>
      <div class="kpi-card">
        <div>
          <span class="kpi-label">Clientes Activos</span>
          <span class="kpi-val">${clientesUnicosSel}</span>
        </div>
        <span class="kpi-pill slate">En ruta</span>
      </div>
      <div class="kpi-card">
        <div>
          <span class="kpi-label">Gu&iacute;as F&iacute;sicas</span>
          <span class="kpi-val teal">${conFisicoSel} <span class="kpi-sub">/ ${totalSel}</span></span>
        </div>
        <span class="kpi-pill teal">Recibidos</span>
      </div>
    </div>

    <div class="table-wrap">
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>FECHA</th>
              <th>N&deg; TRANSPORTE</th>
              <th>ORIGEN / CLIENTE</th>
              <th>DESTINO</th>
              <th>CONDUCTOR ASIGNADO</th>
              <th>UNIDAD / PLACA</th>
            </tr>
          </thead>
          <tbody>
            ${filasHtml}
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer">
      <span>Matriz generada en tiempo real a partir de la selecci&oacute;n activa en consola</span>
      <span>FlotaControl &bull; Ordenado por d&iacute;a y conductor</span>
    </div>
  </div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 250);
    });
  </script>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=1200,height=850');
    if (!printWindow) {
      mostrarToast('Permita las ventanas emergentes para generar el PDF de la matriz.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlDoc);
    printWindow.document.close();
    mostrarToast(`Preparando PDF de Matriz General (${totalSel} viajes)...`);
  };

  // Handler para exportar PDF
  const handleExportarPDF = (choferNombre?: string) => {
    mostrarToast(`Generando hoja de despacho PDF para ${choferNombre || 'la flota'}...`);
    setTimeout(() => {
      window.print();
    }, 600);
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Toast Notificación */}
      {toastMensaje && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMensaje}</span>
        </div>
      )}

      {/* 1. Breadcrumbs & Navegación superior */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-200/80 pb-3">
        <div className="flex items-center space-x-2 text-[11px] font-bold tracking-wider uppercase text-gray-400">
          <span
            onClick={() => navigate('/scheduling')}
            className="hover:text-gray-600 transition cursor-pointer"
          >
            Logístico
          </span>
          <span className="text-gray-300 font-normal">&gt;</span>
          <span
            onClick={() => navigate('/scheduling')}
            className="hover:text-gray-600 transition cursor-pointer"
          >
            Programación de Viajes
          </span>
          <span className="text-gray-300 font-normal">&gt;</span>
          <span className="text-orange-600 font-extrabold">Consola de Asignación de Choferes</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => navigate('/scheduling')}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span>Volver a Mesa de Despacho</span>
          </button>
        </div>
      </div>

      {/* 2. Tarjeta Superior: PARÁMETROS DE SELECCIÓN & CONSOLA DE DESPACHO */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 sm:p-6 transition-all duration-200">
        {/* Encabezado de la Tarjeta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
          <div className="flex items-center space-x-2.5">
            <SlidersHorizontal className="w-5 h-5 text-orange-600 shrink-0" />
            <h2 className="text-xs sm:text-sm font-black text-slate-800 tracking-wider uppercase">
              PARÁMETROS DE SELECCIÓN & CONSOLA DE DESPACHO
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-emerald-700">
              Sincronizado con SAP ERP & TMS
            </span>
          </div>
        </div>

        {/* Fila de Controles: Intervalo de Fechas y Botón Cargar BD */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 items-end">
          {/* 1. Rango de Fechas (Desde - Hasta) */}
          <div className="md:col-span-8 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>INTERVALO DE FECHAS (DESDE — HASTA)</span>
              </label>
              <div className="inline-flex items-center gap-1 bg-slate-100/80 border border-slate-200/70 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => handleSeleccionarPresetFecha('hoy')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${presetFechaActivo === 'hoy'
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => handleSeleccionarPresetFecha('manana')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${presetFechaActivo === 'manana'
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  Mañana
                </button>
                <button
                  type="button"
                  onClick={() => handleSeleccionarPresetFecha('mes')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${presetFechaActivo === 'mes'
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  Mes
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => {
                  setPresetFechaActivo(null);
                  setFechaInicio(e.target.value);
                }}
                className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-2xs"
                placeholder="Desde"
              />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => {
                  setPresetFechaActivo(null);
                  setFechaFin(e.target.value);
                }}
                className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-2xs"
                placeholder="Hasta"
              />
            </div>
          </div>

          {/* 2. Botón Cargar Viajes Programados BD */}
          <div className="md:col-span-4">
            <button
              type="button"
              disabled={cargandoViajes}
              onClick={handleCargarViajes}
              className="w-full bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] active:scale-[0.98] text-white font-black text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md shadow-orange-500/25 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-60"
            >
              <RotateCw
                className={`w-4 h-4 text-white shrink-0 ${cargandoViajes ? 'animate-spin' : ''}`}
                strokeWidth={2.4}
              />
              <span>{cargandoViajes ? 'Consultando BD...' : 'Cargar Viajes Programados'}</span>
            </button>
          </div>
        </div>

        {/* Fila Inferior: Información y Estado del Filtro */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-5 mt-5 border-t border-gray-100 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 bg-[#0f172a] text-white shadow-sm select-none">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              <span>Corte por Día (Cronológico)</span>
              <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {gruposPorDia.length} {gruposPorDia.length === 1 ? 'Día' : 'Días'}
              </span>
            </div>
          </div>

          <div className="text-xs font-medium text-gray-500">
            {viajes.length > 0
              ? `Mostrando ${viajesFiltrados.length} viajes en ${gruposPorDia.length} días programados`
              : 'Seleccione el intervalo de fechas para consultar viajes en guias_viajes'}
          </div>
        </div>
      </div>

      {/* 3. Píldoras de Filtro por Día & Barra de Búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Píldoras de días generadas dinámicamente */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Todos */}
          <button
            type="button"
            onClick={() => setTabDiaActivo('todos')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${tabDiaActivo === 'todos'
              ? 'bg-[#1e293b] text-white shadow-xs'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            <span>Todos</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${tabDiaActivo === 'todos' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700'
                }`}
            >
              {viajes.length}
            </span>
          </button>

          {/* Días presentes en la consulta */}
          {diasDisponiblesPills.map((p) => (
            <button
              key={p.diaKey}
              type="button"
              onClick={() => setTabDiaActivo(p.diaKey)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${tabDiaActivo === p.diaKey
                ? 'bg-[#1e293b] text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              <span>{p.label}</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                {p.count}
              </span>
            </button>
          ))}

          {/* Indicador de viajes sin chofer */}
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span>{conteoSinChofer} Sin Chofer</span>
          </div>

          {/* Indicador de guías con documento físico recibido */}
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{conteoConFisico}/{viajes.length} Físicos</span>
          </div>

          {/* Control global de Seleccionar Todos para la Matriz */}
          {viajesFiltrados.length > 0 && (
            <button
              type="button"
              onClick={toggleSeleccionarTodosVisibles}
              className={`px-3 py-1 rounded-full text-xs font-extrabold border transition flex items-center gap-1.5 cursor-pointer select-none ${todosVisiblesSeleccionados
                ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-2xs'
                : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'
                }`}
              title="Seleccionar o deseleccionar todos los viajes visibles para generar la matriz"
            >
              <span
                className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition ${todosVisiblesSeleccionados
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'border-slate-300 bg-white'
                  }`}
              >
                {todosVisiblesSeleccionados && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </span>
              <span>
                {todosVisiblesSeleccionados ? 'Todos seleccionados' : 'Seleccionar todos'} ({viajesSeleccionadosIds.length})
              </span>
            </button>
          )}
        </div>

        {/* Input de Búsqueda */}
        <div className="relative min-w-[260px] sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
            placeholder="Buscar chofer, guía TR-, nodo..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-slate-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition shadow-2xs"
          />
          {terminoBusqueda && (
            <button
              onClick={() => setTerminoBusqueda('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Layout Principal: Tabla agrupada (Izquierda) + Resumen de Carga por Conductor (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMNA IZQUIERDA: Acordeones de Viajes (8 cols) */}
        <div className={panelDerechoAbierto ? 'lg:col-span-8 xl:col-span-8 space-y-4' : 'lg:col-span-12 space-y-4'}>
          {viajes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-10 sm:p-14 text-center space-y-4">
              <div className="w-16 h-16 bg-orange-50 border border-orange-200 text-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <Calendar className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-black text-slate-800">
                  {cargandoViajes ? 'Consultando tabla guias_viajes...' : 'Consola lista para iniciar'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {cargandoViajes
                    ? 'Buscando manifiestos programados en la base de datos para el intervalo de fechas especificado...'
                    : 'Seleccione el intervalo de fechas en el panel superior y presione "Cargar Viajes Programados" para mostrar los despachos de la tabla guias_viajes.'}
                </p>
              </div>
            </div>
          ) : gruposPorDia.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-10 text-center space-y-3">
              <p className="text-sm font-bold text-slate-700">No se encontraron viajes con los filtros aplicados</p>
              <p className="text-xs text-slate-400">Intente modificar el término de búsqueda o seleccione otro día en las pestañas.</p>
            </div>
          ) : (
            gruposPorDia.map((grupo) => {
              const estaColapsado = !!gruposColapsados[grupo.diaKey];
              const viajesActivos = grupo.viajes.filter((v) => v.estadoOrden !== 'Cancelado');
              const asignadosCount = viajesActivos.filter((v) => v.conductorId).length;
              const totalCount = viajesActivos.length;
              const canceladosCount = grupo.viajes.filter((v) => v.estadoOrden === 'Cancelado').length;
              const notificadosCount = grupo.viajes.filter((v) => viajesConWhatsappEnviado.includes(v.id)).length;

              if (grupo.viajes.length === 0 && tabDiaActivo !== 'todos') return null;

              return (
                <div
                  key={grupo.diaKey}
                  className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden transition-all duration-200"
                >
                  {/* Cabecera del Acordeón del Día */}
                  <div className="p-4 sm:p-4.5 bg-white border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
                    <div
                      onClick={() => toggleColapso(grupo.diaKey)}
                      className="flex items-center space-x-2.5 cursor-pointer flex-1"
                    >
                      <div className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                        {estaColapsado ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-gray-700 font-bold" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">
                          {grupo.titulo}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 ml-2 hidden sm:inline">
                          — {totalCount} VIAJES ACTIVOS {canceladosCount > 0 ? `(${canceladosCount} CANCELADOS) ` : ''}| {grupo.kmTotales} KM TOTALES | VENTANA: {grupo.ventanaHoraria}
                        </span>
                      </div>
                    </div>

                    {/* Lado derecho de la cabecera: Choferes Listos y Auto-guardar */}
                    <div className="flex items-center space-x-3 pl-7 sm:pl-0">
                      {canceladosCount > 0 && (
                        <span className="bg-rose-50 border border-rose-200/90 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                          {canceladosCount} Cancelado{canceladosCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {notificadosCount > 0 && (
                        <span className="bg-purple-50 border border-purple-200/90 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 text-purple-600" />
                          <span>{notificadosCount} Notificado{notificadosCount > 1 ? 's' : ''} WA</span>
                        </span>
                      )}
                      <span className="bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-extrabold px-3 py-1 rounded-full whitespace-nowrap">
                        +{asignadosCount}/{totalCount} Choferes Listos
                      </span>

                      <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={grupo.viajes[0]?.autoGuardar ?? true}
                          onChange={() => toggleAutoGuardar(grupo.diaKey)}
                          className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500 accent-orange-600 cursor-pointer"
                        />
                        <span className="text-slate-600">Auto-Guardar</span>
                      </label>
                    </div>
                  </div>

                  {/* Subtítulo móvil si pantalla pequeña */}
                  <div className="sm:hidden px-4 pb-2 text-[11px] font-medium text-slate-500">
                    {totalCount} VIAJES | {grupo.kmTotales} KM | {grupo.ventanaHoraria}
                  </div>

                  {/* Contenido / Tabla del Grupo */}
                  {!estaColapsado && (() => {
                    const todosEnGrupoSeleccionados =
                      grupo.viajes.length > 0 && grupo.viajes.every((v) => viajesSeleccionadosSet.has(v.id));
                    const algunosEnGrupoSeleccionados =
                      !todosEnGrupoSeleccionados && grupo.viajes.some((v) => viajesSeleccionadosSet.has(v.id));

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                              <th className="py-2.5 pl-4 pr-2 w-10">
                                <button
                                  type="button"
                                  onClick={() => toggleSeleccionarGrupo(grupo.viajes)}
                                  title={
                                    todosEnGrupoSeleccionados
                                      ? 'Deseleccionar todos los viajes de este día'
                                      : 'Seleccionar todos los viajes de este día para la matriz'
                                  }
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition cursor-pointer ${todosEnGrupoSeleccionados
                                    ? 'bg-orange-500 border-orange-500 text-white shadow-2xs'
                                    : algunosEnGrupoSeleccionados
                                      ? 'bg-orange-100 border-orange-400 text-orange-600'
                                      : 'bg-white border-slate-300 hover:border-orange-400'
                                    }`}
                                >
                                  {todosEnGrupoSeleccionados ? (
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  ) : algunosEnGrupoSeleccionados ? (
                                    <span className="w-2 h-0.5 bg-orange-500 rounded-full" />
                                  ) : null}
                                </button>
                              </th>
                              <th className="py-2.5 px-3">N° TRANSPORTE</th>
                              <th className="py-2.5 px-4">ORIGEN SALIDA</th>
                              <th className="py-2.5 px-4">DESTINO LLEGADA</th>
                              <th className="py-2.5 px-4">CONDUCTOR Y OBSERVACIÓN</th>
                              <th className="py-2.5 px-4 text-right">ACCIONES RÁPIDAS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-xs">
                            {grupo.viajes.map((viaje) => {
                              const conductorActual = conductores.find((c) => c.id === viaje.conductorId);
                              const estaAsignado = !!conductorActual;
                              const esCancelado = viaje.estadoOrden === 'Cancelado';
                              const estaSeleccionado = viajesSeleccionadosSet.has(viaje.id);
                              const tieneConductorEnBD = Boolean(
                                !esCancelado &&
                                viaje.conductorId &&
                                viaje.conductorIdEnBD &&
                                viaje.conductorId === viaje.conductorIdEnBD
                              );
                              const yaNotificadoWhatsapp = viajesConWhatsappEnviado.includes(viaje.id);

                              return (
                                <tr
                                  key={viaje.id}
                                  className={`transition-colors duration-150 ${esCancelado
                                    ? 'bg-rose-50/40 hover:bg-rose-50/60'
                                    : estaSeleccionado
                                      ? 'bg-orange-50/25 hover:bg-orange-50/45'
                                      : 'hover:bg-slate-50/70'
                                    }`}
                                >
                                  {/* 0. CHECK DE SELECCIÓN PARA LA MATRIZ */}
                                  <td className="py-3 pl-4 pr-2 w-10 whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => toggleSeleccionViaje(viaje.id)}
                                      title={
                                        estaSeleccionado
                                          ? 'Quitar viaje de la matriz'
                                          : 'Incluir viaje en la matriz'
                                      }
                                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition transform active:scale-90 cursor-pointer ${estaSeleccionado
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-2xs'
                                        : 'bg-white border-slate-300 hover:border-orange-400'
                                        }`}
                                    >
                                      {estaSeleccionado && <Check className="w-3 h-3 stroke-[3]" />}
                                    </button>
                                  </td>

                                  {/* 1. N° TRANSPORTE */}
                                  <td className="py-3 px-3 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <span className={`font-black text-sm tracking-tight ${esCancelado ? 'text-slate-800' : 'text-slate-900'}`}>
                                        {viaje.nroTransporte}
                                      </span>
                                      {esCancelado && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 uppercase tracking-tight">
                                          Cancelado
                                        </span>
                                      )}
                                      {/* Botón interactivo para alternar estado Físico */}
                                      <button
                                        type="button"
                                        title={
                                          viaje.fisico
                                            ? 'Documento Físico Recibido (Haga clic para cambiar a Pendiente)'
                                            : 'Documento Físico Pendiente (Haga clic para marcar como Recibido)'
                                        }
                                        disabled={actualizandoFisicoId === viaje.id}
                                        onClick={() => handleToggleFisico(viaje)}
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight border transition cursor-pointer select-none active:scale-95 ${viaje.fisico
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600'
                                          }`}
                                      >
                                        <FileCheck className={`w-3 h-3 ${viaje.fisico ? 'text-emerald-600' : 'text-slate-400'}`} />
                                        <span>{viaje.fisico ? 'Físico' : 'Sin Físico'}</span>
                                      </button>
                                    </div>
                                  </td>

                                  {/* 2. ORIGEN SALIDA & CLIENTE */}
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-emerald-700 font-extrabold text-xs">
                                        {viaje.origenCodigo}
                                      </span>
                                      <span className="font-bold text-slate-800 text-xs sm:text-[13px]">
                                        {viaje.origenNombre}
                                      </span>
                                    </div>
                                    {viaje.clienteNombre && (
                                      <div
                                        className="text-[10.5px] font-medium text-orange-500 truncate capitalize mt-0.5 leading-tight"
                                        title={viaje.clienteNombre}
                                      >
                                        {viaje.clienteNombre.toLowerCase()}
                                      </div>
                                    )}
                                  </td>

                                  {/* 3. DESTINO LLEGADA & FECHA ESTIMADA */}
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-teal-700 font-extrabold text-xs">
                                        {viaje.destinoCodigo}
                                      </span>
                                      <span className="font-bold text-slate-800 text-xs sm:text-[13px]">
                                        {viaje.destinoNombre}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                      Pr. Est. {viaje.fechaEstimadaLlegada}
                                    </div>
                                  </td>

                                  {/* 4. CONDUCTOR ASIGNADO, ASIGNACIÓN URGENTE & OBSERVACIÓN */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-center space-x-2">
                                      {esCancelado ? (
                                        /* Si está cancelado, mostrar la palabra "Viaje Cancelado" de manera fácilmente identificable en lugar del conductor */
                                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-black text-xs shadow-sm shadow-rose-600/30 select-none min-w-[190px] sm:min-w-[210px] justify-center tracking-wider uppercase border border-rose-700 animate-in fade-in duration-150">
                                          <XCircle className="w-4 h-4 text-white shrink-0" />
                                          <span>Viaje Cancelado</span>
                                        </div>
                                      ) : (
                                        <>
                                          {/* Select de Conductor */}
                                          <div className="relative min-w-[190px] sm:min-w-[210px] max-w-[240px]">
                                            <select
                                              value={viaje.conductorId || ''}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                asignarConductorAViaje(viaje.id, val ? val : null);
                                              }}
                                              className={`w-full py-1.5 pl-3 pr-8 rounded-xl text-xs font-semibold appearance-none border transition cursor-pointer ${estaAsignado
                                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold'
                                                : 'bg-amber-50/40 border-amber-300/80 text-slate-700 hover:border-amber-400'
                                                }`}
                                            >
                                              <option value="">
                                                {conductores.length === 0 ? 'Cargando choferes...' : 'Seleccionar chofer activo...'}
                                              </option>
                                              {conductores.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                  {c.nombre} ({c.placa})
                                                </option>
                                              ))}
                                            </select>
                                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                          </div>

                                          {/* Botón Asignar Urgente - Icono pequeño alusivo a urgente */}
                                          <button
                                            type="button"
                                            title="Asignación Urgente de Conductor"
                                            aria-label="Asignar Urgente"
                                            onClick={() => setViajeParaAsignarUrgente(viaje)}
                                            className="p-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white shadow-xs transition transform active:scale-95 cursor-pointer shrink-0"
                                          >
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      )}

                                      {/* Observación del Viaje (muestra la observación dada por el usuario) */}
                                      {esCancelado ? (
                                        <div
                                          title={`Observación del Usuario / Motivo de Cancelación:\n${viaje.observaciones || 'Sin observación registrada'}`}
                                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs bg-rose-50 border border-rose-200/90 text-rose-950 font-medium max-w-[260px] sm:max-w-[340px] lg:max-w-[420px] min-w-0 shadow-2xs transition"
                                        >
                                          <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                          <span className="truncate">
                                            <strong className="text-rose-700 font-bold mr-1">Obs:</strong>
                                            {viaje.observaciones || 'Cancelado sin observación'}
                                          </span>
                                        </div>
                                      ) : viaje.observaciones ? (
                                        <div
                                          title={`Observación:\n${viaje.observaciones}`}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] min-w-0 max-w-[220px] lg:max-w-[280px] transition cursor-default font-medium bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 text-slate-700"
                                        >
                                          <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span className="truncate">
                                            {viaje.observaciones}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-[11px] text-slate-400 italic whitespace-nowrap">
                                          Sin observación
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* 5. ACCIONES RÁPIDAS (Guardar, WhatsApp, Cancelar) */}
                                  <td className="py-3 px-4 text-right whitespace-nowrap">
                                    {esCancelado ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold shadow-2xs">
                                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Cancelado</span>
                                      </span>
                                    ) : (
                                      <div className="inline-flex items-center space-x-1.5">
                                        {/* Botón Guardar (solo icono) */}
                                        <button
                                          type="button"
                                          title={guardandoViajeId === viaje.id ? 'Guardando...' : 'Guardar cambios de este viaje'}
                                          aria-label="Guardar cambios de este viaje"
                                          disabled={guardandoViajeId === viaje.id}
                                          onClick={() => handleGuardarViaje(viaje)}
                                          className="p-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 active:scale-95 text-white shadow-xs transition cursor-pointer disabled:opacity-60"
                                        >
                                          {guardandoViajeId === viaje.id ? (
                                            <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Save className="w-3.5 h-3.5" />
                                          )}
                                        </button>

                                        {/* Icono del WhatsApp (habilitado solo si ya tiene conductor registrado en BD) */}
                                        <button
                                          type="button"
                                          disabled={!tieneConductorEnBD}
                                          title={
                                            !tieneConductorEnBD
                                              ? viaje.conductorId
                                                ? 'Debe guardar los cambios para registrar el conductor en base de datos'
                                                : 'Este viaje no tiene conductor registrado en base de datos'
                                              : yaNotificadoWhatsapp
                                                ? 'Mensaje ya enviado por WhatsApp (Haga clic para ver, modificar o reenviar)'
                                                : 'Notificar por WhatsApp al conductor'
                                          }
                                          aria-label="Notificar por WhatsApp"
                                          onClick={() => {
                                            if (tieneConductorEnBD) {
                                              setViajeParaWhatsapp(viaje);
                                            }
                                          }}
                                          className={`p-1.5 rounded-lg shadow-xs transition ${!tieneConductorEnBD
                                            ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-50 shadow-none'
                                            : yaNotificadoWhatsapp
                                              ? 'bg-purple-600 hover:bg-purple-700 active:scale-95 text-white cursor-pointer ring-2 ring-purple-300/80'
                                              : 'bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white cursor-pointer'
                                            }`}
                                        >
                                          <MessageCircle className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Icono para cambio de estado_orden rápido a cancelar */}
                                        <button
                                          type="button"
                                          title="Cancelar orden de viaje (cambio rápido a Cancelado)"
                                          onClick={() => abrirModalCancelar(viaje)}
                                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200/90 shadow-2xs active:scale-95 transition cursor-pointer"
                                        >
                                          <XCircle className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              );
            })
          )}
        </div>

        {/* COLUMNA DERECHA: RESUMEN DE CARGA POR CONDUCTOR (Panel Lateral) */}
        {panelDerechoAbierto ? (
          <div className="lg:col-span-4 xl:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-4 sm:p-5 sticky top-4">
              {/* Encabezado del Panel */}
              <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-orange-100 text-orange-600 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">
                      RESUMEN DE CARGA POR CONDUCTOR
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      Lote Activo: {conductoresConAsignacion.length} Conductores con Guías
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  title="Ocultar panel lateral"
                  onClick={() => setPanelDerechoAbierto(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Listado de Tarjetas de Conductor */}
              <div className="divide-y divide-gray-100 mt-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {conductoresConAsignacion.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    <Truck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No hay conductores asignados</p>
                    <p className="text-[11px] mt-1 text-slate-400">
                      Seleccione choferes en la tabla izquierda o pulse "Asignar Urgente".
                    </p>
                  </div>
                ) : (
                  conductoresConAsignacion.map(({ conductor, guias: gList }) => {
                    return (
                      <div key={conductor.id} className="py-4 space-y-3 first:pt-2">
                        {/* Cabecera del Conductor */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                              {conductor.iniciales}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-black text-slate-900 text-xs sm:text-sm">
                                  {conductor.nombre}
                                </span>
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${conductor.estado === 'En Patio'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : conductor.estado === 'Disponible'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-sky-100 text-sky-800'
                                    }`}
                                >
                                  {conductor.estado}
                                </span>
                              </div>
                              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                {conductor.vehiculo} • {conductor.placa}
                              </p>
                            </div>
                          </div>

                          {/* Badge de cantidad de viajes */}
                          <span className="bg-orange-100 text-orange-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            {gList.length} {gList.length === 1 ? 'Viaje' : 'Viajes'}
                          </span>
                        </div>

                        {/* Lista de Guías TR asignadas a este conductor */}
                        <div className="space-y-2 pl-1">
                          {gList.map((guiaItem) => (
                            <div
                              key={guiaItem.id}
                              className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-2.5 text-xs flex flex-col space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-slate-900">
                                  TR-{guiaItem.nroTransporte}
                                </span>
                                <span className="text-[11px] font-medium text-slate-400">
                                  {guiaItem.diaTexto}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-[11.5px] font-medium text-slate-600">
                                <span className="truncate">{guiaItem.origenNombre}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{guiaItem.destinoNombre}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Botones de acción del conductor */}
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          {/* Itinerario */}
                          <button
                            type="button"
                            onClick={() => setConductorItinerarioModal(conductor)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] py-1.5 px-2 rounded-lg flex items-center justify-center space-x-1 shadow-2xs transition cursor-pointer"
                          >
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>Itinerario</span>
                          </button>

                          {/* PDF */}
                          <button
                            type="button"
                            onClick={() => handleExportarPDF(conductor.nombre)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] py-1.5 px-2 rounded-lg flex items-center justify-center space-x-1 border border-slate-200/80 shadow-2xs transition cursor-pointer"
                          >
                            <Printer className="w-3 h-3 shrink-0 text-slate-500" />
                            <span>PDF</span>
                          </button>

                          {/* Liberar */}
                          <button
                            type="button"
                            onClick={() => liberarTodosDeConductor(conductor.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] py-1.5 px-2 rounded-lg flex items-center justify-center space-x-1 border border-rose-200/60 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3 shrink-0" />
                            <span>Liberar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Innovador de Generación de Matriz de Viajes Seleccionados */}
              <div className="mt-4 pt-3.5 border-t border-slate-100">
                <div className="group rounded-2xl border border-slate-200/90 hover:border-orange-200 bg-gradient-to-r from-white via-slate-50/40 to-orange-50/20 px-3.5 py-3 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-600 leading-snug truncate">
                        Sincronización de despachos en tiempo real
                      </p>
                      <p className="text-[10px] font-bold text-emerald-700 mt-0.5">
                        {viajesSeleccionadosIds.length} {viajesSeleccionadosIds.length === 1 ? 'viaje seleccionado' : 'viajes seleccionados'} para matriz
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAbrirMatrizSeleccionados}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-orange-600 hover:text-orange-700 whitespace-nowrap shrink-0 cursor-pointer group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Ver Matriz de Viajes</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Botón flotante para reabrir panel si se ocultó */
          <div className="fixed bottom-6 right-6 z-40">
            <button
              type="button"
              onClick={() => setPanelDerechoAbierto(true)}
              className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-orange-400" />
              <span>Ver Resumen de Carga ({conductoresConAsignacion.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: ASIGNACIÓN URGENTE DE CHOFER                    */}
      {/* ======================================================== */}
      {viajeParaAsignarUrgente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Asignación Urgente de Chofer
                  </h3>
                  <p className="text-xs text-slate-500">
                    Viaje TR-{viajeParaAsignarUrgente.nroTransporte} • {viajeParaAsignarUrgente.origenNombre} ➔ {viajeParaAsignarUrgente.destinoNombre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViajeParaAsignarUrgente(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
              <span>
                Algoritmo de Despacho Troncal: Choferes certificados con reposo reglamentario de 10h+ y disponibilidad en patio.
              </span>
            </div>

            {/* Lista de candidatos recomendados */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {conductores.map((chofer) => {
                const yaTieneViajes = guiasPanel.filter((g) => g.conductorId === chofer.id).length;

                return (
                  <div
                    key={chofer.id}
                    className="p-3.5 border border-gray-200 rounded-xl hover:border-orange-500/70 hover:bg-orange-50/20 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                        {chofer.iniciales}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-slate-900 text-xs sm:text-sm">
                            {chofer.nombre}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {chofer.estado}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {chofer.vehiculo} • {chofer.placa} • Reposo: {chofer.horasDescanso}h
                        </div>
                        {yaTieneViajes > 0 && (
                          <span className="text-[10px] font-semibold text-amber-700">
                            Tiene {yaTieneViajes} guía(s) asignada(s) en este lote
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        asignarConductorAViaje(viajeParaAsignarUrgente.id, chofer.id);
                        setViajeParaAsignarUrgente(null);
                      }}
                      className="bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs transition cursor-pointer shrink-0"
                    >
                      Asignar Chofer
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setViajeParaAsignarUrgente(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: NOTIFICACIÓN VÍA WHATSAPP                       */}
      {/* ======================================================== */}
      {viajeParaWhatsapp && (() => {
        const choferWhatsapp = conductores.find((c) => c.id === viajeParaWhatsapp.conductorId);
        const telefonoDigitos = choferWhatsapp?.telefono ? choferWhatsapp.telefono.replace(/[^0-9]/g, '') : '';
        const fueEnviado = viajesConWhatsappEnviado.includes(viajeParaWhatsapp.id);

        const whatsappUrl = telefonoDigitos
          ? `https://api.whatsapp.com/send?phone=${telefonoDigitos}&text=${encodeURIComponent(mensajeWhatsapp)}`
          : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensajeWhatsapp)}`;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
              <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-xl ${fueEnviado ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">
                        Notificación de Manifiesto
                      </h3>
                      {fueEnviado ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 uppercase tracking-wider border border-purple-200">
                          Mensaje Enviado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                          Pendiente
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Envío de orden de despacho por WhatsApp (plantilla editable)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViajeParaWhatsapp(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Conductor asignado y registrado */}
              {choferWhatsapp && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Conductor Registrado
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {choferWhatsapp.nombre}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {choferWhatsapp.vehiculo} • {choferWhatsapp.placa}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Teléfono
                    </div>
                    <div className="font-bold text-emerald-700 mt-0.5">
                      {choferWhatsapp.telefono || 'Sin teléfono'}
                    </div>
                  </div>
                </div>
              )}

              {/* Puntos de Carga y Descarga Resaltados + Observación */}
              <div className="p-3 bg-slate-50/90 border border-slate-200/90 rounded-xl space-y-2 text-xs">
                <div className="flex items-start space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Punto de Carga (Origen)
                    </span>
                    <span className="font-black text-slate-900 text-xs">
                      <span className="text-emerald-700 font-bold mr-1">{viajeParaWhatsapp.origenCodigo}</span>
                      {viajeParaWhatsapp.origenNombre}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-200/70 pt-2 flex items-start space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500 mt-1 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                      Punto de Descarga (Destino)
                    </span>
                    <span className="font-black text-slate-900 text-xs">
                      <span className="text-teal-700 font-bold mr-1">{viajeParaWhatsapp.destinoCodigo}</span>
                      {viajeParaWhatsapp.destinoNombre}
                    </span>
                  </div>
                </div>

                {viajeParaWhatsapp.observaciones &&
                  String(viajeParaWhatsapp.observaciones).trim() &&
                  String(viajeParaWhatsapp.observaciones).trim().toLowerCase() !== 'null' && (
                    <div className="border-t border-slate-200/70 pt-2 flex items-start space-x-2">
                      <FileText className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                          Observación del Viaje
                        </span>
                        <span className="font-medium text-slate-800 text-[11.5px] italic">
                          {viajeParaWhatsapp.observaciones.trim()}
                        </span>
                      </div>
                    </div>
                  )}
              </div>

              {/* Mensaje editable */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="mensajeWhatsappTextarea" className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Mensaje a enviar (modificable):
                  </label>
                  <button
                    type="button"
                    onClick={() => setMensajeWhatsapp(generarTextoWhatsapp(viajeParaWhatsapp))}
                    className="text-[11px] text-teal-700 hover:text-teal-800 font-bold cursor-pointer hover:underline"
                    title="Restablecer mensaje a la plantilla original"
                  >
                    Restaurar plantilla
                  </button>
                </div>
                <textarea
                  id="mensajeWhatsappTextarea"
                  rows={6}
                  value={mensajeWhatsapp}
                  onChange={(e) => setMensajeWhatsapp(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200 rounded-xl text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed outline-none transition resize-y"
                  placeholder="Escriba o modifique el mensaje a enviar..."
                />
              </div>

              {/* Acciones y Botones */}
              <div className="flex items-center justify-between pt-2 gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(mensajeWhatsapp);
                      marcarWhatsappEnviado(viajeParaWhatsapp.id);
                      mostrarToast('Mensaje copiado y viaje marcado como enviado');
                    }}
                    className="px-3 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </button>

                  {fueEnviado && (
                    <button
                      type="button"
                      onClick={() => {
                        desmarcarWhatsappEnviado(viajeParaWhatsapp.id);
                        mostrarToast('Marcado como pendiente de WhatsApp');
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                      title="Quitar marca de enviado"
                    >
                      Desmarcar
                    </button>
                  )}
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    marcarWhatsappEnviado(viajeParaWhatsapp.id);
                    mostrarToast('Abriendo WhatsApp y viaje marcado como notificado');
                    setViajeParaWhatsapp(null);
                  }}
                  className={`px-4 py-2 ${fueEnviado
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    } rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{fueEnviado ? 'Reenviar WhatsApp' : 'Abrir WhatsApp Web'}</span>
                </a>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* MODAL 3: ITINERARIO Y RUTA DETALLADA                     */}
      {/* ======================================================== */}
      {(viajeParaRuta || conductorItinerarioModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {viajeParaRuta
                      ? `Itinerario de Ruta TR-${viajeParaRuta.nroTransporte}`
                      : `Itinerario Consolidado — ${conductorItinerarioModal?.nombre}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Corredor vial troncal y puntos de control de pesaje
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setViajeParaRuta(null);
                  setConductorItinerarioModal(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">
                      Origen / Punto de Carga
                    </span>
                    <p className="text-xs font-black text-slate-900">
                      [0705] Planta Limpieza (San Joaquín / Valencia)
                    </p>
                  </div>
                </div>

                <div className="pl-1.5 border-l-2 border-dashed border-gray-300 ml-1.5 py-2 text-[11px] text-gray-500 space-y-1">
                  <p>🛣️ Autopista Regional del Centro (ARC)</p>
                  <p>🛑 Punto de Control Peaje Guacara (Telepeaje OK)</p>
                  <p>⚖️ Balanza de Pesaje Troncal (Límite: 32 Toneladas)</p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0"></div>
                  <div>
                    <span className="text-[10px] font-bold text-orange-600 uppercase">
                      Destino / Punto de Entrega
                    </span>
                    <p className="text-xs font-black text-slate-900">
                      {viajeParaRuta
                        ? `${viajeParaRuta.destinoCodigo} ${viajeParaRuta.destinoNombre}`
                        : 'Múltiples Centros de Distribución'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    Distancia Estimada
                  </span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {viajeParaRuta ? `${viajeParaRuta.distanciaKm} KM` : '360 KM Totales'}
                  </p>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    Tiempo de Tránsito
                  </span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    ~3h 45m (Velocidad segura)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setViajeParaRuta(null);
                  setConductorItinerarioModal(null);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: EDICIÓN RÁPIDA DE VIAJE                         */}
      {/* ======================================================== */}
      {viajeParaEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Modificar Manifiesto TR-{viajeParaEditar.nroTransporte}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ajuste de hora de salida y destino programado
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViajeParaEditar(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  Hora Programada de Salida
                </label>
                <input
                  type="text"
                  defaultValue={viajeParaEditar.hora}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  Destino Asignado
                </label>
                <input
                  type="text"
                  defaultValue={`${viajeParaEditar.destinoCodigo} ${viajeParaEditar.destinoNombre}`}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  Observaciones Operativas
                </label>
                <textarea
                  rows={2}
                  value={obsEditada}
                  onChange={(e) => setObsEditada(e.target.value)}
                  placeholder="Instrucciones para patio o conductor..."
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setViajeParaEditar(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const nuevaObs = obsEditada.trim() || null;
                  const vId = viajeParaEditar.id;
                  setViajes((prev) =>
                    prev.map((v) => (v.id === vId ? { ...v, observaciones: nuevaObs } : v))
                  );
                  try {
                    await programacionService.actualizarObservacion(vId, nuevaObs);
                    mostrarToast('Observación del viaje actualizada exitosamente en BD.');
                  } catch {
                    mostrarToast('Observación actualizada en la consola.');
                  }
                  setViajeParaEditar(null);
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: CANCELACIÓN RÁPIDA DE VIAJE (ORDEN CANCELADA)   */}
      {/* ======================================================== */}
      {viajeParaCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm sm:max-w-md w-full p-5 sm:p-6 shadow-2xl border border-rose-100 space-y-4">
            {/* Encabezado */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Cancelar Viaje TR-{viajeParaCancelar.nroTransporte}
                  </h3>
                  <p className="text-[11px] text-rose-600 font-bold">
                    Cambio rápido de estado a "Cancelado"
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViajeParaCancelar(null);
                  setMotivoCancelacion('');
                }}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen del viaje a cancelar */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-700 font-semibold">
                <span className="truncate">{viajeParaCancelar.origenNombre} ➔ {viajeParaCancelar.destinoNombre}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Programado: {viajeParaCancelar.fecha} a las {viajeParaCancelar.hora}
              </div>
            </div>

            {/* Input de Observación rápida requerida */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                <span>Observación / Motivo de cancelación:</span>
                <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">* Requerido</span>
              </label>
              <textarea
                rows={3}
                autoFocus
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                placeholder="Indique el motivo por el cual se cancela la orden (ej: Avería mecánica de la unidad, orden suspendida por planta/cliente)..."
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-medium text-slate-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition resize-none shadow-2xs"
              />
            </div>

            {/* Footer con botones de acción */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={cancelandoViaje}
                onClick={() => {
                  setViajeParaCancelar(null);
                  setMotivoCancelacion('');
                }}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
              >
                Descartar
              </button>
              <button
                type="button"
                disabled={cancelandoViaje || !motivoCancelacion.trim()}
                onClick={handleConfirmarCancelacion}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-extrabold shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{cancelandoViaje ? 'Cancelando...' : 'Confirmar Cancelación'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: MATRIZ CONSOLIDADA DE VIAJES SELECCIONADOS      */}
      {/* ======================================================== */}
      {modalMatrizAbierto && (() => {
        const totalSeleccionados = viajesSeleccionadosLista.length;
        const conConductor = viajesSeleccionadosLista.filter((v) => v.conductorId).length;
        const sinConductor = totalSeleccionados - conConductor;
        const conFisicoSel = viajesSeleccionadosLista.filter((v) => v.fisico).length;
        const clientesUnicos = new Set(
          viajesSeleccionadosLista.map((v) => v.clienteNombre).filter(Boolean)
        ).size;

        // Agrupación por conductor para la vista matricial por chofer
        const mapaPorConductor = new Map<string, { nombre: string; placa: string; vehiculo: string; iniciales: string; items: ViajeAsignacion[] }>();
        viajesSeleccionadosLista.forEach((v) => {
          const ch = conductores.find((c) => c.id === v.conductorId);
          const key = ch ? ch.id : 'sin-asignar';
          if (!mapaPorConductor.has(key)) {
            mapaPorConductor.set(key, {
              nombre: ch ? ch.nombre : 'Sin conductor asignado',
              placa: ch ? ch.placa : 'S/P',
              vehiculo: ch ? ch.vehiculo : 'Pendiente de unidad',
              iniciales: ch ? ch.iniciales : '--',
              items: [],
            });
          }
          mapaPorConductor.get(key)!.items.push(v);
        });
        const gruposConductoresMatriz = Array.from(mapaPorConductor.values()).sort((a, b) => {
          if (a.nombre === 'Sin conductor asignado') return 1;
          if (b.nombre === 'Sin conductor asignado') return -1;
          return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Cabecera del Modal de Matriz */}
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-orange-500/20 border border-orange-400/40 text-orange-400 flex items-center justify-center shrink-0 shadow-inner">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        Sincronizado en Tiempo Real
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        • {totalSeleccionados} {totalSeleccionados === 1 ? 'viaje incluido' : 'viajes incluidos'}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-1">
                      Matriz Operativa de Viajes Seleccionados
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {/* Selector de vista */}
                  <div className="inline-flex items-center bg-slate-800/90 border border-slate-700 rounded-xl p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setVistaMatriz('tabla')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${vistaMatriz === 'tabla'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white'
                        }`}
                    >
                      Matriz General
                    </button>
                    <button
                      type="button"
                      onClick={() => setVistaMatriz('conductores')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${vistaMatriz === 'conductores'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white'
                        }`}
                    >
                      Por Conductor ({gruposConductoresMatriz.length})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalMatrizAbierto(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Barra de KPIs de la Matriz */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3.5 bg-slate-50/90 border-b border-slate-200/80">
                <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Viajes en Matriz
                    </span>
                    <span className="text-base font-black text-slate-900">
                      {totalSeleccionados}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                    Seleccionados
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Con Conductor
                    </span>
                    <span className="text-base font-black text-emerald-700">
                      {conConductor} <span className="text-xs font-semibold text-slate-400">/ {totalSeleccionados}</span>
                    </span>
                  </div>
                  {sinConductor > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {sinConductor} Pend.
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      100% Listo
                    </span>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Clientes Activos
                    </span>
                    <span className="text-base font-black text-slate-900">
                      {clientesUnicos || 1}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    En ruta
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Guías Físicas
                    </span>
                    <span className="text-base font-black text-teal-700">
                      {conFisicoSel} <span className="text-xs font-semibold text-slate-400">/ {totalSeleccionados}</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                    Recibidos
                  </span>
                </div>
              </div>

              {/* Cuerpo de la Matriz */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/40">
                {vistaMatriz === 'tabla' ? (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#fff9f4] border-b border-orange-200/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                            <th className="py-3 px-3.5">#</th>
                            <th className="py-3 px-3.5">FECHA</th>
                            <th className="py-3 px-3.5">N° TRANSPORTE</th>
                            <th className="py-3 px-3.5">ORIGEN / CLIENTE</th>
                            <th className="py-3 px-3.5">DESTINO</th>
                            <th className="py-3 px-3.5">CONDUCTOR ASIGNADO</th>
                            <th className="py-3 px-3.5">UNIDAD / PLACA</th>
                            <th className="py-3 px-3.5 text-center">FÍSICO</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {viajesSeleccionadosLista.map((v, idx) => {
                            const ch = conductores.find((c) => c.id === v.conductorId);
                            return (
                              <tr key={v.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-2.5 px-3.5 font-bold text-slate-400">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3.5 font-bold text-slate-700 whitespace-nowrap">
                                  {v.fecha}
                                </td>
                                <td className="py-2.5 px-3.5 font-black text-slate-900 whitespace-nowrap">
                                  {v.nroTransporte}
                                </td>
                                <td className="py-2.5 px-3.5">
                                  <div className="font-bold text-slate-800">
                                    <span className="text-emerald-700 font-extrabold mr-1">{v.origenCodigo}</span>
                                    {v.origenNombre}
                                  </div>
                                  {v.clienteNombre && (
                                    <div className="text-[10px] font-medium text-orange-500 capitalize">
                                      {v.clienteNombre.toLowerCase()}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3.5">
                                  <div className="font-semibold text-slate-700">
                                    <span className="text-teal-700 font-extrabold mr-1">{v.destinoCodigo}</span>
                                    {v.destinoNombre}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3.5">
                                  {ch ? (
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0">
                                        {ch.iniciales}
                                      </span>
                                      <span className="font-bold text-slate-900">{ch.nombre}</span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      Sin asignar
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3.5 whitespace-nowrap">
                                  {ch ? (
                                    <span className="font-semibold text-slate-700">
                                      {ch.vehiculo} • <strong className="text-slate-900">{ch.placa}</strong>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${v.fisico
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-500'
                                      }`}
                                  >
                                    {v.fisico ? 'Recibido' : 'Pendiente'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gruposConductoresMatriz.map((grupoCh, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                              {grupoCh.iniciales}
                            </div>
                            <div>
                              <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                                {grupoCh.nombre}
                              </h4>
                              <p className="text-[11px] font-medium text-slate-500">
                                {grupoCh.vehiculo} • {grupoCh.placa}
                              </p>
                            </div>
                          </div>
                          <span className="bg-orange-100 text-orange-800 text-[11px] font-extrabold px-2.5 py-1 rounded-full">
                            {grupoCh.items.length} {grupoCh.items.length === 1 ? 'Viaje' : 'Viajes'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {grupoCh.items.map((item) => (
                            <div
                              key={item.id}
                              className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs flex flex-col gap-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-slate-900">
                                  {item.nroTransporte}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-500">
                                  {item.fecha}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                                <span className="truncate">{item.origenNombre}</span>
                                <ArrowRight className="w-3 h-3 text-orange-500 shrink-0" />
                                <span className="truncate">{item.destinoNombre}</span>
                              </div>
                              {item.clienteNombre && (
                                <span className="text-[10px] font-medium text-orange-500 capitalize">
                                  {item.clienteNombre.toLowerCase()}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer del Modal de Matriz */}
              <div className="px-6 py-4 border-t border-slate-200/80 bg-white flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Matriz generada en tiempo real a partir de la selección activa en consola</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopiarMatrizPortapapeles}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copiar Resumen</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleImprimirMatrizPDF}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Imprimir / PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportarMatrizCSV}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/25 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar Matriz CSV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}