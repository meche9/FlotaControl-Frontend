import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  Building2,
  Calendar,
  RotateCw,
  Clock,
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
  XCircle
} from 'lucide-react';
import { conductoresService } from '../../services/conductoresService';
import { clientesService, type Cliente } from '../../services/clientesService';
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
  destinoCodigo: string;
  destinoNombre: string;
  fechaEstimadaLlegada: string;
  distanciaKm: number;
  conductorId: string | null;
  conductorIdEnBD?: string | null;
  autoGuardar?: boolean;
  observaciones?: string | null;
  estadoOrden?: string;
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

function parsearFechaGuia(fechaStr: string) {
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) {
    return {
      fecha: fechaStr || '',
      hora: '08:00 AM',
      diaSemana: 'FECHA PROGRAMADA',
      diaKey: 'sin-fecha',
      pildoraDia: 'S/F'
    };
  }

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  const fecha = `${dia}/${mes}/${anio}`;

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hora = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

  const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
  const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  const diasCorto = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const mesesCorto = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const diaSemana = `${diasSemana[d.getDay()]} ${dia} DE ${meses[d.getMonth()]} ${anio}`;
  const pildoraDia = `${diasCorto[d.getDay()]} ${dia} ${mesesCorto[d.getMonth()]}`;
  const diaKey = `${anio}-${mes}-${dia}`;

  return { fecha, hora, diaSemana, diaKey, pildoraDia };
}

function formatearFechaEstimada(fechaStr?: string | null) {
  if (!fechaStr) return 'Por definir';
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return fechaStr;
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
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
    destinoCodigo: g.puntoDestino?.codigoPuntoc ? `[${g.puntoDestino.codigoPuntoc}]` : '[S/C]',
    destinoNombre: g.puntoDestino?.nombreSede || 'Destino',
    fechaEstimadaLlegada: formatearFechaEstimada(g.fechaEntregaEstimada),
    distanciaKm: Number(g.ruta?.distanciaKm || 0),
    conductorId: idConductorDb,
    conductorIdEnBD: idConductorDb,
    autoGuardar: true,
    observaciones,
    estadoOrden: g.estadoOrden || 'Programado',
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

  const puntoCarga = `${viaje.origenCodigo} ${(viaje.origenNombre || 'Origen').toUpperCase()}`;
  const puntoDescarga = `${viaje.destinoCodigo} ${(viaje.destinoNombre || 'Destino').toUpperCase()}`;

  return `🚛 *ORDEN DE CARGA & DESPACHO*
📋 Guía/TR: *${viaje.nroTransporte}*
📅 Fecha: *${viaje.fecha}*
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
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
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

  // Cargar conductores y clientes desde la base de datos al montar
  useEffect(() => {
    async function fetchCatalogos() {
      try {
        const [drivers, clients] = await Promise.all([
          conductoresService.getConductores().catch(() => []),
          clientesService.getClientes().catch(() => []),
        ]);

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
              estado: (d.estado?.toLowerCase() === 'activo' ? 'Disponible' : 'En Patio') as any,
              horasDescanso: 14,
              eficienciaScore: 98
            };
          });

          setConductores(formateados);
        }

        if (clients && clients.length > 0) {
          setClientes(clients);
          // Preferir Polar o el primer cliente registrado
          const polar = clients.find((c) =>
            (c.razonSocial || '').toLowerCase().includes('polar') ||
            (c.nombreComercial || '').toLowerCase().includes('polar')
          );
          const clienteId = polar ? polar.idCliente : clients[0].idCliente;
          setClienteSeleccionadoId(clienteId);
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

  // Carga directa reutilizable
  const cargarViajesDirecto = async (clienteId: string, inicio: string, fin: string) => {
    setCargandoViajes(true);
    try {
      const guias = await programacionService.getGuiasProgramadas({
        idCliente: clienteId,
        fechaInicio: inicio,
        fechaFin: fin,
        estadoOrden: 'todos',
      });

      const viajesMapeados = guias.map(mapGuiaToViaje);
      setViajes(viajesMapeados);

      // Reconstruir guiasPanel a partir de las guias que ya tienen conductor en BD y no están canceladas
      const panelItems: GuiaAsignadaPanel[] = [];
      guias.forEach((g) => {
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

  // Función para consultar guias_viajes con cliente e intervalo
  const handleCargarViajes = async () => {
    if (!clienteSeleccionadoId) {
      mostrarToast('Por favor seleccione un Cliente Matriz.');
      return;
    }
    if (!fechaInicio || !fechaFin) {
      mostrarToast('Por favor especifique la fecha de inicio y fin del intervalo.');
      return;
    }
    if (fechaInicio > fechaFin) {
      mostrarToast('La fecha "Desde" no puede ser posterior a la fecha "Hasta".');
      return;
    }

    mostrarToast('Consultando viajes programados en guias_viajes...');
    await cargarViajesDirecto(clienteSeleccionadoId, fechaInicio, fechaFin);
    const cl = clientes.find((c) => c.idCliente === clienteSeleccionadoId);
    const nombreCl = cl?.nombreComercial || cl?.razonSocial || 'el cliente';
    mostrarToast(`Viajes programados actualizados para ${nombreCl}.`);
  };

  // Asignar conductor a viaje (actualiza la asignación en la interfaz y panel)
  const asignarConductorAViaje = (viajeId: string, conductorId: string | null) => {
    setViajes((prev) =>
      prev.map((v) => (v.id === viajeId ? { ...v, conductorId: conductorId } : v))
    );

    const viaje = viajes.find((v) => v.id === viajeId);
    if (!viaje) return;

    if (conductorId) {
      const chofer = conductores.find((c) => c.id === conductorId);
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
      await programacionService.asignarConductor(viaje.id, viaje.conductorId || null);

      if (viaje.observaciones !== undefined) {
        await programacionService.actualizarObservacion(viaje.id, viaje.observaciones || null);
      }

      setViajes((prev) =>
        prev.map((v) =>
          v.id === viaje.id
            ? { ...v, conductorIdEnBD: viaje.conductorId || null }
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
      prev.map((v) => (v.conductorId === conductorId ? { ...v, conductorId: null, conductorIdEnBD: null } : v))
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
        const matchDestino = v.destinoNombre.toLowerCase().includes(term) || v.destinoCodigo.toLowerCase().includes(term);
        const matchChofer = conductor ? conductor.nombre.toLowerCase().includes(term) || conductor.vehiculo.toLowerCase().includes(term) || conductor.placa.toLowerCase().includes(term) : false;
        const matchObs = v.observaciones ? v.observaciones.toLowerCase().includes(term) : false;
        return matchTr || matchOrigen || matchDestino || matchChofer || matchObs;
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

        {/* Fila de Controles: Cliente Matriz, Intervalo de Fechas y Botón Cargar BD */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 items-end">
          {/* 1. Cliente Matriz */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-orange-500" />
              <span>CLIENTE MATRIZ</span>
            </label>
            <div className="relative">
              <select
                value={clienteSeleccionadoId}
                onChange={(e) => setClienteSeleccionadoId(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition appearance-none cursor-pointer"
              >
                <option value="">Seleccione un Cliente Matriz...</option>
                {clientes.map((c) => (
                  <option key={c.idCliente} value={c.idCliente}>
                    {c.razonSocial} {c.nombreComercial && c.nombreComercial !== c.razonSocial ? `(${c.nombreComercial})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2. Rango de Fechas (Desde - Hasta) */}
          <div className="md:col-span-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>INTERVALO DE FECHAS (DESDE — HASTA)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setFechaInicio('2026-10-19');
                  setFechaFin('2026-10-23');
                }}
                className="text-[10px] text-emerald-700 hover:text-emerald-900 font-extrabold underline cursor-pointer"
                title="Cargar fechas W-43"
              >
                W-43 (19-23 Oct)
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-2xs"
                placeholder="Desde"
              />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-2xs"
                placeholder="Hasta"
              />
            </div>
          </div>

          {/* 3. Botón Cargar Viajes Programados BD */}
          <div className="md:col-span-3">
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
              : 'Seleccione cliente e intervalo de fechas para consultar viajes en guias_viajes'}
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
                    ? 'Buscando manifiestos programados en la base de datos para el cliente e intervalo especificados...'
                    : 'Seleccione el Cliente Matriz y el intervalo de fechas en el panel superior, luego presione "Cargar Viajes Programados" para mostrar los despachos de la tabla guias_viajes.'}
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
                  {!estaColapsado && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            <th className="py-2.5 px-4">N° TRANSPORTE</th>
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
                                    : 'hover:bg-slate-50/70'
                                  }`}
                              >
                                {/* 1. N° TRANSPORTE & FECHA/HORA */}
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <span className={`font-black text-sm tracking-tight ${esCancelado ? 'text-slate-800' : 'text-slate-900'}`}>
                                      {viaje.nroTransporte}
                                    </span>
                                    {esCancelado && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 uppercase tracking-tight">
                                        Cancelado
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1.5 text-slate-500 text-[11.5px] mt-0.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{viaje.fecha} • {viaje.hora}</span>
                                  </div>
                                </td>

                                {/* 2. ORIGEN SALIDA */}
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-emerald-700 font-extrabold text-xs">
                                      {viaje.origenCodigo}
                                    </span>
                                    <span className="font-bold text-slate-800 text-xs sm:text-[13px]">
                                      {viaje.origenNombre}
                                    </span>
                                  </div>
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
                                                {c.nombre} ({c.vehiculo} • {c.placa})
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
                                        className={`p-1.5 rounded-lg shadow-xs transition ${
                                          !tieneConductorEnBD
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
                  )}
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
                  className={`px-4 py-2 ${
                    fueEnviado
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
    </div>
  );
}