import { useState, useMemo, useEffect } from 'react';
import {
    Truck,
    Calendar,
    Search,
    X,
    CheckCircle2,
    MapPin,
    Download,
    Save,
    RotateCw,
    CornerDownRight,
    Package,
    ArrowRightLeft,
    Check,
    AlertCircle,
    ChevronDown,
    MessageSquare,
    Sparkles,
    Coins,
    RefreshCw,
    Building2,
    Pencil,
    Banknote,
    Copy,
} from 'lucide-react';
import { Button, Modal } from '../../components/ui';
import { programacionService, type GuiaProgramada, type GuiaViajeRecargoItem } from '../../services/programacionService';
import { vehiculosService, type Vehiculo } from '../../services/vehiculosService';
import { conductoresService, type Conductor } from '../../services/conductoresService';
import { puntosCargaService, type PuntoCargaDescarga } from '../../services/puntosCargaService';
import { rutasService, type Ruta, type RecargoGeneral } from '../../services/rutasService';

// ============================================================================
// INTERFACES & MODELOS
// ============================================================================

export interface ViajeFleteItem {
    idOrden: string;
    nroTransporte: string;
    fecha: string;
    hora: string;
    fechaISO: string;
    fleteBase: number;
    montoAnticipoConductor: number;
    monedaAnticipo?: 'Bs' | 'USD';
    origenCodigo: string;
    origenNombre: string;
    idPuntoOrigen: string;
    destinoCodigo: string;
    destinoNombre: string;
    idPuntoDestino: string;
    idRuta: string;
    nombreRuta?: string;
    idCliente: string;
    clienteNombre?: string;
    idVehiculoMotriz: string | null;
    vehiculoMotrizNombre: string;
    idAcoplado: string | null;
    acopladoNombre: string;
    idConductor: string | null;
    conductorNombre: string;
    conductorIniciales: string;
    conductorEstado: string;
    conductorCedula?: string | null;
    conductorTelefono?: string | null;
    conductorBanco?: string | null;
    conductorNroCuenta?: string | null;
    conductorPagoMovil?: string | null;
    estadoOrden: 'En Tránsito' | 'Programado' | 'En Andén' | 'Cancelado' | string;
    fisico: boolean;
    observaciones: string | null;
    guiasViajesRecargos: GuiaViajeRecargoItem[];
    esRetorno: boolean;
    idOrdenPadre: string | null;
}

export interface RecargoModalItem {
    idRecargo?: string;
    idViajeRecargo?: string;
    concepto: string;
    tipoCalculo: string;
    valor: string | number;
    selected: boolean;
    observaciones?: string;
}

// Helper para parsear fechas tomando únicamente la fecha (día, mes, año) sin que la hora o zona horaria altere el día
function formatearFechaHora(fechaStr?: string | null) {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    if (!fechaStr) {
        const hoy = new Date();
        const dia = String(hoy.getDate()).padStart(2, '0');
        const mes = meses[hoy.getMonth()];
        const anio = hoy.getFullYear();
        return { fecha: `${dia} ${mes} ${anio}`, hora: '', iso: `${anio}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${dia}` };
    }

    const raw = String(fechaStr).trim();
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

    if (anio >= 2000 && anio <= 2100 && mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) {
        const diaStr = String(dia).padStart(2, '0');
        const mesStr = String(mes).padStart(2, '0');
        const mesNombre = meses[mes - 1] || mesStr;
        return {
            fecha: `${diaStr} ${mesNombre} ${anio}`,
            hora: '',
            iso: `${anio}-${mesStr}-${diaStr}`,
        };
    }

    // Fallback con UTC para no cambiar de día por zona horaria
    const d = new Date(raw);
    if (isNaN(d.getTime())) {
        return { fecha: soloFecha || raw, hora: '', iso: soloFecha };
    }

    const diaUtc = String(d.getUTCDate()).padStart(2, '0');
    const mesUtc = meses[d.getUTCMonth()];
    const anioUtc = d.getUTCFullYear();

    return {
        fecha: `${diaUtc} ${mesUtc} ${anioUtc}`,
        hora: '',
        iso: `${anioUtc}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${diaUtc}`,
    };
}

function obtenerIniciales(nombre?: string | null): string {
    if (!nombre) return 'OP';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length >= 2) {
        return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return partes[0].slice(0, 2).toUpperCase();
}

function formatearFechaCorta(fechaStr?: string) {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    if (partes.length !== 3) return fechaStr;
    const [y, m, d] = partes;
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const mesNombre = meses[parseInt(m, 10) - 1] || m;
    return `${parseInt(d, 10)} ${mesNombre} ${y}`;
}

function formatearRangoLegible(inicio?: string, fin?: string, preset?: string) {
    if (!inicio && !fin) return preset === 'todos' ? 'Todos los Viajes' : 'Seleccionar Fecha';
    if (inicio && fin && inicio === fin) return `Fecha: ${formatearFechaCorta(inicio)}`;
    if (inicio && fin) return `${formatearFechaCorta(inicio)} – ${formatearFechaCorta(fin)}`;
    if (inicio) return `Desde ${formatearFechaCorta(inicio)}`;
    if (fin) return `Hasta ${formatearFechaCorta(fin)}`;
    return 'Intervalo de Fechas';
}

function obtenerFechasPorPreset(preset: 'hoy' | 'semana' | 'mes' | 'todos') {
    const hoy = new Date();
    const formatYMD = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dia}`;
    };

    if (preset === 'hoy') {
        const str = formatYMD(hoy);
        return { inicio: str, fin: str };
    }

    if (preset === 'semana') {
        const diaSemana = hoy.getDay();
        const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
        const lunes = new Date(hoy);
        lunes.setDate(hoy.getDate() + diffLunes);
        const domingo = new Date(lunes);
        domingo.setDate(lunes.getDate() + 6);
        return { inicio: formatYMD(lunes), fin: formatYMD(domingo) };
    }

    if (preset === 'mes') {
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        return { inicio: formatYMD(primerDia), fin: formatYMD(ultimoDia) };
    }

    return { inicio: '', fin: '' };
}

export default function AsignacionRecursos() {
    // Estado de viajes cargados (inicia vacío al entrar a la página)
    const [viajes, setViajes] = useState<ViajeFleteItem[]>([]);
    const [cargando, setCargando] = useState<boolean>(false);
    const [busqueda, setBusqueda] = useState<string>('');
    const [excluirCancelados, setExcluirCancelados] = useState<boolean>(true);

    // Intervalo de fechas para auditoría (sin fecha predeterminada)
    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [fechaFin, setFechaFin] = useState<string>('');
    const [presetFecha, setPresetFecha] = useState<'hoy' | 'semana' | 'mes' | 'todos' | 'personalizado' | ''>('');
    const [popoverFechaAbierto, setPopoverFechaAbierto] = useState<boolean>(false);
    const [tempInicio, setTempInicio] = useState<string>('');
    const [tempFin, setTempFin] = useState<string>('');

    // Catálogos auxiliares
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [conductores, setConductores] = useState<Conductor[]>([]);
    const [puntos, setPuntos] = useState<PuntoCargaDescarga[]>([]);
    const [rutasCatalogo, setRutasCatalogo] = useState<Ruta[]>([]);
    const [, setRecargosGeneralesCatalogo] = useState<RecargoGeneral[]>([]);

    // Toast / feedback state
    const [toast, setToast] = useState<{ visible: boolean; mensaje: string; tipo: 'ok' | 'error' | 'info' }>({
        visible: false,
        mensaje: '',
        tipo: 'info',
    });

    const mostrarToast = (mensaje: string, tipo: 'ok' | 'error' | 'info' = 'info') => {
        setToast({ visible: true, mensaje, tipo });
        setTimeout(() => {
            setToast((prev) => ({ ...prev, visible: false }));
        }, 3800);
    };

    // ==========================================================================
    // MODAL 1: GESTIÓN DE RECARGOS
    // ==========================================================================
    const [modalRecargosAbierto, setModalRecargosAbierto] = useState<boolean>(false);
    const [viajeSeleccionadoRecargos, setViajeSeleccionadoRecargos] = useState<ViajeFleteItem | null>(null);
    const [recargosModalItems, setRecargosModalItems] = useState<RecargoModalItem[]>([]);
    const [origenRecargosModal, setOrigenRecargosModal] = useState<'rutas_recargos' | 'recargos_generales'>('rutas_recargos');
    const [recargosModalLoading, setRecargosModalLoading] = useState<boolean>(false);
    const [recargosFiltroTexto, setRecargosFiltroTexto] = useState<string>('');
    const [guardandoRecargos, setGuardandoRecargos] = useState<boolean>(false);

    const recargosSeleccionados = useMemo(() => {
        return recargosModalItems.filter((r) => r.selected);
    }, [recargosModalItems]);

    const costoTotalRecargos = useMemo(() => {
        return recargosSeleccionados.reduce((acc, curr) => {
            const val = parseFloat(String(curr.valor)) || 0;
            return acc + Math.max(0, val);
        }, 0);
    }, [recargosSeleccionados]);

    const recargosFiltradosModal = useMemo(() => {
        const q = recargosFiltroTexto.trim().toLowerCase();
        if (!q) return recargosModalItems;
        return recargosModalItems.filter((r) =>
            r.concepto.toLowerCase().includes(q)
        );
    }, [recargosModalItems, recargosFiltroTexto]);

    // ==========================================================================
    // MODAL 2: PLANCHA DE RETORNO (CREACIÓN Y EDICIÓN)
    // ==========================================================================
    const [modalRetornoAbierto, setModalRetornoAbierto] = useState<boolean>(false);
    const [viajeSeleccionadoRetorno, setViajeSeleccionadoRetorno] = useState<ViajeFleteItem | null>(null);
    const [planchaEditando, setPlanchaEditando] = useState<ViajeFleteItem | null>(null);
    const [nroTransporteRetorno, setNroTransporteRetorno] = useState<string>('');
    const [puntoRegresoSeleccionado, setPuntoRegresoSeleccionado] = useState<string>('');
    const [montoRetorno, setMontoRetorno] = useState<string>('0');
    const [observacionRetorno, setObservacionRetorno] = useState<string>('Retorno de Plancha en vacío');
    const [guardandoRetorno, setGuardandoRetorno] = useState<boolean>(false);

    // Helper: dado que la plancha va de Origen B -> Destino C,
    // busca en la tabla rutas la ruta inversa registrada (Origen C -> Destino B)
    const buscarRutaContraria = (
        idOrigenPlanchaB: string,
        idDestinoPlanchaC: string,
        listaRutas: Ruta[] = rutasCatalogo
    ): Ruta | null => {
        if (!idOrigenPlanchaB || !idDestinoPlanchaC) return null;

        // 1. Priorizar ruta C -> B (destino de la plancha como origen en tabla rutas, y origen de la plancha como destino)
        const exactaInversa = listaRutas.find(
            (r) => r.idPuntoOrigen === idDestinoPlanchaC && r.idPuntoDestino === idOrigenPlanchaB
        );
        if (exactaInversa) return exactaInversa;

        // 2. Fallback por códigos de sede si algún punto difiere en UUID pero coincide en código
        const pOrigB = puntos.find((p) => p.idPunto === idOrigenPlanchaB);
        const pDestC = puntos.find((p) => p.idPunto === idDestinoPlanchaC);
        if (pOrigB?.codigoPuntoc && pDestC?.codigoPuntoc) {
            const porCodigoInversa = listaRutas.find(
                (r) =>
                    r.puntoOrigen?.codigoPuntoc === pDestC.codigoPuntoc &&
                    r.puntoDestino?.codigoPuntoc === pOrigB.codigoPuntoc
            );
            if (porCodigoInversa) return porCodigoInversa;
        }

        // 3. Fallback secundario: si existiera registrada directamente B -> C
        const directa = listaRutas.find(
            (r) => r.idPuntoOrigen === idOrigenPlanchaB && r.idPuntoDestino === idDestinoPlanchaC
        );
        return directa || null;
    };

    // Ruta contraria C -> B detectada para la selección actual en el modal de plancha
    const rutaContrariaActiva = useMemo(() => {
        if (!viajeSeleccionadoRetorno || !puntoRegresoSeleccionado) return null;
        return buscarRutaContraria(
            viajeSeleccionadoRetorno.idPuntoDestino,
            puntoRegresoSeleccionado,
            rutasCatalogo
        );
    }, [viajeSeleccionadoRetorno, puntoRegresoSeleccionado, rutasCatalogo, puntos]);

    const tarifaReferenciaRuta = useMemo(() => {
        if (rutaContrariaActiva && rutaContrariaActiva.montoTarifa !== undefined && rutaContrariaActiva.montoTarifa !== null) {
            const val = Number(rutaContrariaActiva.montoTarifa);
            if (!isNaN(val)) return val;
        }
        return Number(viajeSeleccionadoRetorno?.fleteBase || 0);
    }, [rutaContrariaActiva, viajeSeleccionadoRetorno]);

    // Cliente detectado para el viaje de retorno
    const idClienteRetorno = useMemo(() => {
        if (!viajeSeleccionadoRetorno) return null;
        if (viajeSeleccionadoRetorno.idCliente) return viajeSeleccionadoRetorno.idCliente;
        // Si no viene en el viaje, buscarlo a través de los puntos de origen o destino
        const pOrigen = puntos.find((p) => p.idPunto === viajeSeleccionadoRetorno.idPuntoOrigen);
        if (pOrigen?.idCliente) return pOrigen.idCliente;
        const pDestino = puntos.find((p) => p.idPunto === viajeSeleccionadoRetorno.idPuntoDestino);
        if (pDestino?.idCliente) return pDestino.idCliente;
        return null;
    }, [viajeSeleccionadoRetorno, puntos]);

    // Puntos de carga y descarga filtrados exclusivamente por el mismo cliente del viaje
    const puntosClienteRetorno = useMemo(() => {
        if (!viajeSeleccionadoRetorno) return [];

        let list: PuntoCargaDescarga[] = [];
        if (idClienteRetorno) {
            list = puntos.filter(
                (p) => p.idCliente === idClienteRetorno && (p.activo === true || p.activo === undefined)
            );
        }

        // Garantizar que el punto de origen del viaje inicial esté en la lista
        if (
            viajeSeleccionadoRetorno.idPuntoOrigen &&
            !list.some((p) => p.idPunto === viajeSeleccionadoRetorno.idPuntoOrigen)
        ) {
            list.unshift({
                idPunto: viajeSeleccionadoRetorno.idPuntoOrigen,
                idCliente: idClienteRetorno || viajeSeleccionadoRetorno.idCliente,
                codigoPuntoc: viajeSeleccionadoRetorno.origenCodigo,
                nombreSede: viajeSeleccionadoRetorno.origenNombre,
                tipoPunto: 'Origen' as any,
                direccion: '',
                ciudad: '',
                estado: '',
                activo: true,
                fechaCreacion: new Date().toISOString(),
            });
        }
        return list;
    }, [puntos, viajeSeleccionadoRetorno, idClienteRetorno]);

    // ==========================================================================
    // MODAL 3: ASIGNACIÓN DE RECURSOS (MACK & BATEA)
    // ==========================================================================
    const [modalRecursosAbierto, setModalRecursosAbierto] = useState<boolean>(false);
    const [viajeSeleccionadoRecursos, setViajeSeleccionadoRecursos] = useState<ViajeFleteItem | null>(null);
    const [selVehiculoMotriz, setSelVehiculoMotriz] = useState<string>('');
    const [selAcoplado, setSelAcoplado] = useState<string>('');
    const [selConductor, setSelConductor] = useState<string>('');
    const [guardandoRecursos, setGuardandoRecursos] = useState<boolean>(false);

    // ==========================================================================
    // MODAL 4: ANTICIPO DE CONDUCTOR
    // ==========================================================================
    const [modalAnticipoAbierto, setModalAnticipoAbierto] = useState<boolean>(false);
    const [viajeSeleccionadoAnticipo, setViajeSeleccionadoAnticipo] = useState<ViajeFleteItem | null>(null);
    const [montoAnticipoInput, setMontoAnticipoInput] = useState<string>('');
    const [monedaAnticipoInput, setMonedaAnticipoInput] = useState<'Bs' | 'USD'>('Bs');
    const [guardandoAnticipo, setGuardandoAnticipo] = useState<boolean>(false);
    const [campoCopiado, setCampoCopiado] = useState<'cedula' | 'pagoMovil' | 'cuenta' | null>(null);

    const handleCopiarDatoBancario = async (texto: string, tipo: 'cedula' | 'pagoMovil' | 'cuenta', etiqueta: string) => {
        if (!texto || texto === '—') {
            mostrarToast(`No hay ${etiqueta.toLowerCase()} registrado en base de datos para copiar`, 'info');
            return;
        }
        try {
            await navigator.clipboard.writeText(texto);
            setCampoCopiado(tipo);
            mostrarToast(`${etiqueta} copiado al portapapeles`, 'ok');
            setTimeout(() => {
                setCampoCopiado((prev) => (prev === tipo ? null : prev));
            }, 2200);
        } catch {
            mostrarToast(`No se pudo copiar ${etiqueta.toLowerCase()}`, 'error');
        }
    };

    // ==========================================================================
    // CARGA DE CATÁLOGOS Y CONSULTA DE VIAJES
    // ==========================================================================
    const cargarCatalogosBase = async () => {
        try {
            const [vecs, conds, pts, rts, recGen] = await Promise.all([
                vehiculosService.getVehiculos().catch(() => []),
                conductoresService.getConductores().catch(() => []),
                puntosCargaService.getPuntos().catch(() => []),
                rutasService.getRutas().catch(() => []),
                rutasService.getRecargosGenerales().catch(() => []),
            ]);

            setVehiculos(vecs || []);
            setConductores(conds || []);
            setPuntos(pts || []);
            setRutasCatalogo(rts || []);
            setRecargosGeneralesCatalogo(recGen || []);
        } catch {
            // Silencioso en carga inicial de catálogos
        }
    };

    const cargarDatos = async (inicioParam?: string, finParam?: string, forzarTodos: boolean = false) => {
        const ini = inicioParam !== undefined ? inicioParam : fechaInicio;
        const fn = finParam !== undefined ? finParam : fechaFin;

        // Si no hay fechas seleccionadas y no se solicitó explícitamente ver todos, mantener la tabla vacía
        if (!ini && !fn && !forzarTodos && presetFecha !== 'todos') {
            setViajes([]);
            return;
        }

        setCargando(true);

        try {
            const params: any = { estadoOrden: 'todos' };
            if (ini && ini.trim()) params.fechaInicio = ini.trim();
            if (fn && fn.trim()) params.fechaFin = fn.trim();

            const [guiasBd, vecs, conds, pts, rts, recGen] = await Promise.all([
                programacionService.getGuiasProgramadas(params).catch(() => []),
                vehiculosService.getVehiculos().catch(() => []),
                conductoresService.getConductores().catch(() => []),
                puntosCargaService.getPuntos().catch(() => []),
                rutasService.getRutas().catch(() => []),
                rutasService.getRecargosGenerales().catch(() => []),
            ]);

            setVehiculos(vecs || []);
            setConductores(conds || []);
            setPuntos(pts || []);
            setRutasCatalogo(rts || []);
            setRecargosGeneralesCatalogo(recGen || []);

            // Mapear viajes desde base de datos
            const listaMapeada: ViajeFleteItem[] = (guiasBd || []).map((g: GuiaProgramada) => {
                const fh = formatearFechaHora(g.fechaProgramadaCarga);
                const obs = g.observaciones || '';
                const esRet = obs.includes('[RETORNO_DE:') || obs.toLowerCase().includes('retorno');
                let idPadre: string | null = null;
                const matchPadre = obs.match(/\[RETORNO_DE:([a-zA-Z0-9-]+)\]/);
                if (matchPadre && matchPadre[1]) {
                    idPadre = matchPadre[1];
                }

                const nombreMack = g.vehiculoMotriz
                    ? `${g.vehiculoMotriz.marca || ''} ${g.vehiculoMotriz.modelo || ''} #${g.vehiculoMotriz.placa || ''}`.trim()
                    : g.conductor?.vehiculoHabitual
                        ? `${g.conductor.vehiculoHabitual.marca || ''} ${g.conductor.vehiculoHabitual.modelo || ''} #${g.conductor.vehiculoHabitual.placa || ''}`.trim()
                        : 'Sin unidad motriz';

                const nombreBatea = g.acoplado
                    ? `${g.acoplado.marca || ''} ${g.acoplado.modelo || ''} • ${g.acoplado.placa || ''}`.trim()
                    : 'Sin acoplado';

                const condNombre = g.conductor
                    ? `${g.conductor.nombres || ''} ${g.conductor.apellidos || ''}`.trim()
                    : 'Sin conductor asignado';

                const fleteBaseReal = g.montoFleteCliente !== null && g.montoFleteCliente !== undefined
                    ? Number(g.montoFleteCliente)
                    : Number((g as any).ruta?.montoTarifa || 0);

                const anticipoReal = g.montoAnticipoConductor !== null && g.montoAnticipoConductor !== undefined
                    ? Number(g.montoAnticipoConductor)
                    : 0;

                return {
                    idOrden: g.idOrden,
                    nroTransporte: g.nroTransporte || g.idOrden,
                    fecha: fh.fecha,
                    hora: fh.hora,
                    fechaISO: fh.iso,
                    fleteBase: !isNaN(fleteBaseReal) ? fleteBaseReal : 0,
                    montoAnticipoConductor: !isNaN(anticipoReal) ? anticipoReal : 0,
                    monedaAnticipo: 'Bs',
                    origenCodigo: g.puntoOrigen?.codigoPuntoc || '',
                    origenNombre: g.puntoOrigen?.nombreSede || '',
                    idPuntoOrigen: g.idPuntoOrigen,
                    destinoCodigo: g.puntoDestino?.codigoPuntoc || '',
                    destinoNombre: g.puntoDestino?.nombreSede || '',
                    idPuntoDestino: g.idPuntoDestino,
                    idRuta: g.idRuta,
                    nombreRuta: (g as any).ruta?.nombreRuta || `${g.puntoOrigen?.nombreSede || ''} — ${g.puntoDestino?.nombreSede || ''}`,
                    idCliente: g.idCliente || g.cliente?.idCliente || '',
                    clienteNombre: g.cliente?.nombreComercial || g.cliente?.razonSocial || '',
                    idVehiculoMotriz: g.idVehiculoMotriz,
                    vehiculoMotrizNombre: nombreMack,
                    idAcoplado: g.idAcoplado,
                    acopladoNombre: nombreBatea,
                    idConductor: g.idConductor,
                    conductorNombre: condNombre,
                    conductorIniciales: obtenerIniciales(g.conductor ? condNombre : '--'),
                    conductorEstado: g.conductor ? (g.conductor as any).estado || 'Activo' : 'Sin asignar',
                    conductorCedula: g.conductor?.cedulaIdentidad || null,
                    conductorTelefono: g.conductor?.telefono || null,
                    conductorBanco: g.conductor?.banco || null,
                    conductorNroCuenta: g.conductor?.nroCuenta || null,
                    conductorPagoMovil: g.conductor?.pagoMovil || null,
                    estadoOrden: g.estadoOrden || 'Programado',
                    fisico: Boolean(g.fisico),
                    observaciones: g.observaciones,
                    guiasViajesRecargos: g.guiasViajesRecargos || [],
                    esRetorno: esRet,
                    idOrdenPadre: idPadre,
                };
            });

            setViajes(listaMapeada);

            if (ini || fn || forzarTodos) {
                mostrarToast(
                    `Auditoría: ${listaMapeada.length} viajes encontrados para ${formatearRangoLegible(ini, fn, forzarTodos ? 'todos' : presetFecha)}`,
                    'ok'
                );
            }
        } catch (err: any) {
            mostrarToast(`Error al consultar viajes: ${err?.message || err}`, 'error');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarCatalogosBase();
    }, []);

    // Manejadores para aplicar intervalos de auditoría
    const handleAplicarPreset = (preset: 'hoy' | 'semana' | 'mes' | 'todos') => {
        setPresetFecha(preset);
        const { inicio, fin } = obtenerFechasPorPreset(preset);
        setFechaInicio(inicio);
        setFechaFin(fin);
        setTempInicio(inicio);
        setTempFin(fin);
        setPopoverFechaAbierto(false);
        cargarDatos(inicio, fin, preset === 'todos');
    };

    const handleAplicarRangoPersonalizado = () => {
        if (!tempInicio && !tempFin) {
            mostrarToast('Seleccione al menos una fecha para auditar el rango', 'info');
            return;
        }
        if (tempInicio && tempFin && tempInicio > tempFin) {
            mostrarToast('La fecha "Desde" no puede ser posterior a la fecha "Hasta"', 'error');
            return;
        }
        setFechaInicio(tempInicio);
        setFechaFin(tempFin);
        setPresetFecha('personalizado');
        setPopoverFechaAbierto(false);
        cargarDatos(tempInicio, tempFin);
    };

    // ==========================================================================
    // FILTRADO Y AGRUPAMIENTO JERÁRQUICO (RETORNO DEBAJO DEL VIAJE INICIAL)
    // ==========================================================================
    const viajesFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();

        return viajes.filter((v) => {
            if (excluirCancelados && v.estadoOrden?.toLowerCase() === 'cancelado') {
                return false;
            }

            if (!q) return true;

            const coincideGuia = v.nroTransporte.toLowerCase().includes(q);
            const coincideChofer = v.conductorNombre.toLowerCase().includes(q);
            const coincideOrigen = v.origenNombre.toLowerCase().includes(q) || v.origenCodigo.toLowerCase().includes(q);
            const coincideDestino = v.destinoNombre.toLowerCase().includes(q) || v.destinoCodigo.toLowerCase().includes(q);
            const coincideMack = v.vehiculoMotrizNombre.toLowerCase().includes(q);
            const coincideBatea = v.acopladoNombre.toLowerCase().includes(q);

            return coincideGuia || coincideChofer || coincideOrigen || coincideDestino || coincideMack || coincideBatea;
        });
    }, [viajes, busqueda, excluirCancelados]);

    // Conjunto de viajes iniciales que ya tienen al menos una plancha de retorno asignada
    const padresConPlancha = useMemo(() => {
        const ids = new Set<string>();
        for (const v of viajes) {
            if (v.esRetorno && v.idOrdenPadre) {
                ids.add(v.idOrdenPadre);
            }
        }
        return ids;
    }, [viajes]);

    // Agrupamiento: Coloca los viajes de retorno inmediatamente después de su viaje inicial
    const viajesOrdenadosJerarquicos = useMemo(() => {
        const padres: ViajeFleteItem[] = [];
        const retornosPorPadre = new Map<string, ViajeFleteItem[]>();
        const retornosHuerfanos: ViajeFleteItem[] = [];

        for (const v of viajesFiltrados) {
            if (v.esRetorno && v.idOrdenPadre) {
                const arr = retornosPorPadre.get(v.idOrdenPadre) || [];
                arr.push(v);
                retornosPorPadre.set(v.idOrdenPadre, arr);
            } else if (v.esRetorno) {
                retornosHuerfanos.push(v);
            } else {
                padres.push(v);
            }
        }

        const compararPorConductor = (a: ViajeFleteItem, b: ViajeFleteItem) => {
            const sinA = !a.idConductor || a.conductorNombre === 'Sin conductor asignado';
            const sinB = !b.idConductor || b.conductorNombre === 'Sin conductor asignado';
            if (sinA && !sinB) return 1;
            if (!sinA && sinB) return -1;
            return (a.conductorNombre || '').localeCompare(b.conductorNombre || '', 'es', { sensitivity: 'base' });
        };

        padres.sort(compararPorConductor);
        retornosHuerfanos.sort(compararPorConductor);

        const resultado: Array<{ viaje: ViajeFleteItem; esSubFila: boolean }> = [];

        for (const p of padres) {
            resultado.push({ viaje: p, esSubFila: false });
            const retornos = retornosPorPadre.get(p.idOrden) || [];
            for (const r of retornos) {
                resultado.push({ viaje: r, esSubFila: true });
            }
        }

        // Agregar retornos sin padre identificado al final
        for (const r of retornosHuerfanos) {
            resultado.push({ viaje: r, esSubFila: true });
        }

        return resultado;
    }, [viajesFiltrados]);

    // Contadores de KPIs
    const conteoKPI = useMemo(() => {
        const activas = viajes.filter((v) => v.estadoOrden?.toLowerCase() !== 'cancelado').length;
        const programadas = viajes.filter((v) => v.estadoOrden?.toLowerCase() === 'programado').length;
        const transito = viajes.filter((v) => v.estadoOrden?.toLowerCase().includes('tránsito') || v.estadoOrden?.toLowerCase().includes('ruta')).length;
        const anden = viajes.filter((v) => v.estadoOrden?.toLowerCase().includes('andén') || v.estadoOrden?.toLowerCase().includes('origen')).length;

        return {
            activas,
            programadas,
            transito,
            anden,
        };
    }, [viajes]);

    // Totalización de anticipos asignados en las filas visibles de la tabla
    const resumenAnticipos = useMemo(() => {
        let totalGeneral = 0;
        let totalBs = 0;
        let totalUSD = 0;
        let cantidadConAnticipo = 0;

        for (const { viaje } of viajesOrdenadosJerarquicos) {
            const monto = Number(viaje.montoAnticipoConductor || 0);
            if (!isNaN(monto) && monto > 0) {
                totalGeneral += monto;
                cantidadConAnticipo += 1;
                if (viaje.monedaAnticipo === 'USD') {
                    totalUSD += monto;
                } else {
                    totalBs += monto;
                }
            }
        }

        return {
            totalGeneral,
            totalBs,
            totalUSD,
            cantidadConAnticipo,
        };
    }, [viajesOrdenadosJerarquicos]);

    // ==========================================================================
    // CAMBIO RÁPIDO DE GUÍA FÍSICA (SWITCH)
    // ==========================================================================
    const handleToggleFisico = async (idOrden: string, estadoActual: boolean) => {
        const nuevoEstado = !estadoActual;

        // Actualización optimista inmediata
        setViajes((prev) =>
            prev.map((v) => (v.idOrden === idOrden ? { ...v, fisico: nuevoEstado } : v))
        );

        try {
            if (!idOrden.startsWith('mock-')) {
                await programacionService.actualizarFisico(idOrden, nuevoEstado);
            }
            mostrarToast(
                nuevoEstado ? 'Guía Física marcada como RECIBIDA' : 'Guía Física marcada como PENDIENTE',
                'ok'
            );
        } catch (err: any) {
            // Revertir en caso de falla
            setViajes((prev) =>
                prev.map((v) => (v.idOrden === idOrden ? { ...v, fisico: estadoActual } : v))
            );
            mostrarToast(`No se pudo actualizar el estado físico: ${err?.message || err}`, 'error');
        }
    };

    // ==========================================================================
    // MANEJO DE MODAL 1: GESTIÓN DE RECARGOS (RUTAS_RECARGOS / RECARGOS_GENERALES)
    // ==========================================================================
    const abrirModalRecargos = async (viaje: ViajeFleteItem) => {
        setViajeSeleccionadoRecargos(viaje);
        setRecargosFiltroTexto('');
        setModalRecargosAbierto(true);
        setRecargosModalLoading(true);

        try {
            // 1. Identificar la ruta correspondiente al viaje y consultar rutas_recargos
            const rutaDirecta = rutasCatalogo.find(
                (r) => r.idPuntoOrigen === viaje.idPuntoOrigen && r.idPuntoDestino === viaje.idPuntoDestino
            );
            const rutaInversa = viaje.esRetorno
                ? buscarRutaContraria(viaje.idPuntoOrigen, viaje.idPuntoDestino, rutasCatalogo)
                : null;

            const idsRutasCandidatas = Array.from(
                new Set(
                    [viaje.idRuta, rutaDirecta?.idRuta, rutaInversa?.idRuta].filter(
                        (id): id is string => Boolean(id && !id.startsWith('ruta-mock'))
                    )
                )
            );

            let recargosBase: Array<{
                idRecargo?: string;
                concepto: string;
                tipoCalculo: string;
                valor: number | string;
                moneda?: 'Bs' | 'USD';
            }> = [];

            for (const idRutaCand of idsRutasCandidatas) {
                const deRuta = await rutasService.getRecargosByRuta(idRutaCand).catch(() => []);
                if (Array.isArray(deRuta) && deRuta.length > 0) {
                    recargosBase = deRuta;
                    break;
                }
            }

            if (recargosBase.length > 0) {
                setOrigenRecargosModal('rutas_recargos');
            } else {
                // 2. Si no existen recargos para esa ruta en rutas_recargos, mostrar los de recargos_generales
                setOrigenRecargosModal('recargos_generales');
                const catalogoGenerales = await rutasService.getRecargosGenerales().catch(() => []);
                recargosBase = Array.isArray(catalogoGenerales) ? catalogoGenerales : [];
            }

            // 3. Cruzar con los recargos ya asignados a este viaje en guias_viajes_recargos
            const asignadosGuia = viaje.guiasViajesRecargos || [];
            const asignadosMap = new Map<string, GuiaViajeRecargoItem>();
            for (const a of asignadosGuia) {
                const conc = (a.recargo?.concepto || (a as any).concepto || '').trim().toLowerCase();
                if (conc) asignadosMap.set(conc, a);
                if (a.idRecargo) asignadosMap.set(a.idRecargo, a);
            }

            const items: RecargoModalItem[] = recargosBase.map((rb) => {
                const concTrim = (rb.concepto || '').trim().toLowerCase();
                const asignado =
                    asignadosMap.get(concTrim) ||
                    (rb.idRecargo ? asignadosMap.get(rb.idRecargo) : undefined);

                const isSelected = !!asignado;
                const valor =
                    isSelected && asignado?.monto !== undefined && asignado?.monto !== null
                        ? asignado.monto
                        : (rb.valor ?? '0.00');

                return {
                    idRecargo: rb.idRecargo,
                    idViajeRecargo: asignado?.idViajeRecargo,
                    concepto: rb.concepto,
                    tipoCalculo: asignado?.recargo?.tipoCalculo || rb.tipoCalculo || 'Monto_Fijo',
                    valor: valor,
                    selected: isSelected,
                    observaciones: asignado?.observaciones || '',
                };
            });

            // Incluir recargos asignados previamente al viaje que no estén en la lista base
            const conceptosSet = new Set(recargosBase.map((r) => (r.concepto || '').trim().toLowerCase()));
            for (const asig of asignadosGuia) {
                const conc = (asig.recargo?.concepto || (asig as any).concepto || '').trim();
                if (conc && !conceptosSet.has(conc.toLowerCase())) {
                    items.push({
                        idRecargo: asig.idRecargo || undefined,
                        idViajeRecargo: asig.idViajeRecargo,
                        concepto: conc,
                        tipoCalculo: asig.recargo?.tipoCalculo || 'Monto_Fijo',
                        valor: asig.monto ?? '0.00',
                        selected: true,
                        observaciones: asig.observaciones || '',
                    });
                    conceptosSet.add(conc.toLowerCase());
                }
            }

            // Ordenar: seleccionados primero, luego alfabéticamente
            items.sort((a, b) => {
                if (a.selected && !b.selected) return -1;
                if (!a.selected && b.selected) return 1;
                return a.concepto.localeCompare(b.concepto);
            });

            setRecargosModalItems(items);
        } catch (err: any) {
            mostrarToast(`No se pudieron cargar los recargos: ${err?.message || err}`, 'error');
        } finally {
            setRecargosModalLoading(false);
        }
    };

    const handleToggleRecargo = (idOrConcepto: string, forceState?: boolean) => {
        setRecargosModalItems((prev) =>
            prev.map((item) => {
                const match = item.idRecargo === idOrConcepto || item.concepto === idOrConcepto;
                if (!match) return item;
                return {
                    ...item,
                    selected: forceState !== undefined ? forceState : !item.selected,
                };
            })
        );
    };

    const handleUpdateRecargoMonto = (idOrConcepto: string, nuevoMonto: string) => {
        setRecargosModalItems((prev) =>
            prev.map((item) => {
                const match = item.idRecargo === idOrConcepto || item.concepto === idOrConcepto;
                if (!match) return item;
                return {
                    ...item,
                    valor: nuevoMonto,
                    selected: true,
                };
            })
        );
    };

    const handleGuardarRecargosViaje = async () => {
        if (!viajeSeleccionadoRecargos) return;
        setGuardandoRecargos(true);

        try {
            const idOrden = viajeSeleccionadoRecargos.idOrden;
            const seleccionados = recargosModalItems.filter((r) => r.selected);

            const payload = seleccionados.map((r) => ({
                idViajeRecargo: r.idViajeRecargo,
                idRecargo: r.idRecargo,
                concepto: r.concepto.trim(),
                monto: Math.max(0, parseFloat(String(r.valor)) || 0),
                observaciones: r.observaciones || `Recargo de ruta ${viajeSeleccionadoRecargos.nombreRuta || ''}`.trim(),
                estado: 'Pendiente' as const,
            }));

            let recargosGuardados: GuiaViajeRecargoItem[] = [];
            if (!idOrden.startsWith('mock-')) {
                recargosGuardados = await programacionService.guardarRecargosViaje(idOrden, payload);
            } else {
                recargosGuardados = payload.map((r, i) => ({
                    idViajeRecargo: r.idViajeRecargo || `rec-local-${Date.now()}-${i}`,
                    idOrden,
                    idRecargo: r.idRecargo || null,
                    monto: r.monto,
                    estado: 'Pendiente',
                    observaciones: r.observaciones,
                    recargo: {
                        idRecargo: r.idRecargo || `r-${i}`,
                        idRuta: viajeSeleccionadoRecargos.idRuta,
                        concepto: r.concepto,
                        tipoCalculo: 'Monto_Fijo',
                        valor: r.monto,
                    },
                }));
            }

            setViajes((prev) =>
                prev.map((v) =>
                    v.idOrden === idOrden
                        ? {
                            ...v,
                            guiasViajesRecargos: recargosGuardados,
                        }
                        : v
                )
            );

            mostrarToast(
                `Recargos guardados exitosamente (${seleccionados.length} conceptos asignados)`,
                'ok'
            );
            setModalRecargosAbierto(false);
        } catch (err: any) {
            mostrarToast(`Error guardando recargos: ${err?.message || err}`, 'error');
        } finally {
            setGuardandoRecargos(false);
        }
    };

    // ==========================================================================
    // MANEJO DE MODAL 2: PLANCHA DE RETORNO
    // ==========================================================================
    const calcularFechaHoraRetornoInterna = (viaje: ViajeFleteItem) => {
        // Utilizar exactamente la misma fecha_programada_carga del viaje inicial
        let fechaBase = viaje.fechaISO ? new Date(viaje.fechaISO) : new Date();
        if (isNaN(fechaBase.getTime())) {
            fechaBase = new Date();
        }
        return fechaBase.toISOString();
    };

    const handleAutoGenerarNroTransporteRetorno = () => {
        if (!viajeSeleccionadoRetorno) return;
        const baseNro = viajeSeleccionadoRetorno.nroTransporte.replace(/[^0-9]/g, '');
        const sug = baseNro ? `TR-${baseNro}-R` : `TR-${viajeSeleccionadoRetorno.nroTransporte}-R`;
        setNroTransporteRetorno(sug);
        mostrarToast(`Nº de Transporte autogenerado: ${sug}`, 'info');
    };

    const handleChangePuntoRegreso = (nuevoIdPuntoDestinoC: string) => {
        setPuntoRegresoSeleccionado(nuevoIdPuntoDestinoC);
        if (!viajeSeleccionadoRetorno) return;

        // Plancha tiene Origen B = viajeSeleccionadoRetorno.idPuntoDestino y Destino C = nuevoIdPuntoDestinoC
        // Se busca en la tabla rutas el flete de la ruta C --> B
        const rutaInversa = buscarRutaContraria(
            viajeSeleccionadoRetorno.idPuntoDestino,
            nuevoIdPuntoDestinoC,
            rutasCatalogo
        );

        if (rutaInversa && rutaInversa.montoTarifa !== undefined && rutaInversa.montoTarifa !== null) {
            const tarifaNum = Number(rutaInversa.montoTarifa);
            if (!isNaN(tarifaNum)) {
                setMontoRetorno(tarifaNum.toFixed(2));
                return;
            }
        }

        // Si regresa al origen inicial del viaje padre y no se halló en catálogo local, usar el fleteBase del padre
        if (nuevoIdPuntoDestinoC === viajeSeleccionadoRetorno.idPuntoOrigen) {
            setMontoRetorno(Number(viajeSeleccionadoRetorno.fleteBase || 0).toFixed(2));
        }
    };

    const cargarCatalogosClienteRetorno = async (
        idCli: string | undefined,
        idOrigenPlanchaB: string,
        idDestinoPlanchaC: string,
        actualizarMontoAutomatico: boolean
    ) => {
        if (!idCli || idCli.startsWith('mock-') || idCli.startsWith('cli-')) return;
        try {
            const [ptsCli, rutasCli] = await Promise.all([
                puntosCargaService.getPuntosByCliente(idCli).catch(() => []),
                rutasService.getRutasByCliente(idCli).catch(() => []),
            ]);

            if (ptsCli && ptsCli.length > 0) {
                setPuntos((prev) => {
                    const ids = new Set(prev.map((p) => p.idPunto));
                    const nuevos = ptsCli.filter((p) => !ids.has(p.idPunto));
                    return nuevos.length > 0 ? [...prev, ...nuevos] : prev;
                });
            }

            if (rutasCli && rutasCli.length > 0) {
                setRutasCatalogo((prev) => {
                    const ids = new Set(prev.map((r) => r.idRuta));
                    const nuevas = rutasCli.filter((r) => !ids.has(r.idRuta));
                    const combinadas = nuevas.length > 0 ? [...prev, ...nuevas] : prev;

                    if (actualizarMontoAutomatico) {
                        const rInv = buscarRutaContraria(idOrigenPlanchaB, idDestinoPlanchaC, combinadas);
                        if (rInv && rInv.montoTarifa !== undefined && rInv.montoTarifa !== null) {
                            const t = Number(rInv.montoTarifa);
                            if (!isNaN(t)) {
                                setMontoRetorno(t.toFixed(2));
                            }
                        }
                    }

                    return combinadas;
                });
            }
        } catch {
            // Silencioso: se utiliza el catálogo ya disponible
        }
    };

    const abrirModalRetorno = async (viaje: ViajeFleteItem) => {
        setPlanchaEditando(null);
        setViajeSeleccionadoRetorno(viaje);

        // Dejar Nº de transporte en blanco para nueva plancha
        setNroTransporteRetorno('');

        // Punto de regreso por defecto (C): El Origen del viaje inicial
        const destinoDefectoC = viaje.idPuntoOrigen;
        setPuntoRegresoSeleccionado(destinoDefectoC);

        // Buscar flete en tabla rutas según ruta contraria C -> B (donde B = destino del viaje inicial)
        const rutaInversa = buscarRutaContraria(viaje.idPuntoDestino, destinoDefectoC, rutasCatalogo);
        const montoInicial =
            rutaInversa && rutaInversa.montoTarifa !== undefined && rutaInversa.montoTarifa !== null
                ? Number(rutaInversa.montoTarifa).toFixed(2)
                : viaje.fleteBase !== undefined && viaje.fleteBase !== null
                    ? Number(viaje.fleteBase).toFixed(2)
                    : '0.00';

        setMontoRetorno(montoInicial);
        setObservacionRetorno(`Plancha de Retorno vinculada a ${viaje.nroTransporte}`);
        setModalRetornoAbierto(true);

        const idCli = viaje.idCliente || puntos.find((p) => p.idPunto === viaje.idPuntoOrigen)?.idCliente;
        await cargarCatalogosClienteRetorno(idCli, viaje.idPuntoDestino, destinoDefectoC, true);
    };

    const abrirModalEditarRetorno = async (plancha: ViajeFleteItem) => {
        setPlanchaEditando(plancha);

        // Localizar el viaje padre (o reconstruir el contexto de origen/destino si el padre no está en vista)
        const viajePadre = viajes.find((v) => v.idOrden === plancha.idOrdenPadre);
        const contextoViaje: ViajeFleteItem = viajePadre || {
            ...plancha,
            // En la plancha: su origen (B) era el destino del viaje inicial
            idPuntoDestino: plancha.idPuntoOrigen,
            destinoCodigo: plancha.origenCodigo,
            destinoNombre: plancha.origenNombre,
            idPuntoOrigen: plancha.idPuntoDestino,
            origenCodigo: plancha.destinoCodigo,
            origenNombre: plancha.destinoNombre,
        };

        setViajeSeleccionadoRetorno(contextoViaje);

        // Cargar los datos ya guardados de la plancha
        setNroTransporteRetorno(plancha.nroTransporte || '');
        setPuntoRegresoSeleccionado(plancha.idPuntoDestino);
        setMontoRetorno(Number(plancha.fleteBase || 0).toFixed(2));

        const obsLimpia = (plancha.observaciones || '')
            .replace(/^\[RETORNO_DE:[^\]]+\]\s*/i, '')
            .replace(/^\[RETORNO\]\s*/i, '')
            .trim();
        setObservacionRetorno(obsLimpia);

        setModalRetornoAbierto(true);

        const idCli =
            plancha.idCliente ||
            contextoViaje.idCliente ||
            puntos.find((p) => p.idPunto === plancha.idPuntoOrigen)?.idCliente;
        await cargarCatalogosClienteRetorno(idCli, plancha.idPuntoOrigen, plancha.idPuntoDestino, false);
    };

    const handleGenerarPlanchaRetorno = async () => {
        if (!viajeSeleccionadoRetorno) return;

        const nroTrim = nroTransporteRetorno.trim();
        if (!nroTrim) {
            mostrarToast('Por favor ingrese el Nº de Transporte para el viaje de retorno o pulse el icono de autogenerar', 'error');
            return;
        }

        if (!puntoRegresoSeleccionado) {
            mostrarToast('Por favor seleccione el Punto de Regreso', 'error');
            return;
        }

        setGuardandoRetorno(true);

        try {
            const pRegresoObj = puntos.find((p) => p.idPunto === puntoRegresoSeleccionado);
            const codigoRegreso = pRegresoObj?.codigoPuntoc || viajeSeleccionadoRetorno.origenCodigo;
            const nombreRegreso = pRegresoObj?.nombreSede || viajeSeleccionadoRetorno.origenNombre;
            const idRutaCalculada = rutaContrariaActiva?.idRuta || planchaEditando?.idRuta || viajeSeleccionadoRetorno.idRuta;

            // MODO EDICIÓN DE PLANCHA EXISTENTE
            if (planchaEditando) {
                const esLocal = planchaEditando.idOrden.startsWith('mock-') || planchaEditando.idOrden.startsWith('retorno-');
                let montoActualizado = parseFloat(montoRetorno) || 0;
                let obsActualizada = planchaEditando.idOrdenPadre
                    ? `[RETORNO_DE:${planchaEditando.idOrdenPadre}] ${observacionRetorno}`.trim()
                    : observacionRetorno;

                if (!esLocal) {
                    const respuestaBd = await programacionService.actualizarViajeRetorno({
                        idOrden: planchaEditando.idOrden,
                        nroTransporte: nroTrim,
                        idPuntoDestino: puntoRegresoSeleccionado,
                        montoFlete: parseFloat(montoRetorno) || 0,
                        observaciones: observacionRetorno,
                    });
                    montoActualizado =
                        respuestaBd.montoFleteCliente !== undefined && respuestaBd.montoFleteCliente !== null
                            ? Number(respuestaBd.montoFleteCliente)
                            : montoActualizado;
                    obsActualizada = respuestaBd.observaciones || obsActualizada;
                }

                setViajes((prev) =>
                    prev.map((v) =>
                        v.idOrden === planchaEditando.idOrden
                            ? {
                                ...v,
                                nroTransporte: nroTrim,
                                destinoCodigo: codigoRegreso,
                                destinoNombre: nombreRegreso,
                                idPuntoDestino: puntoRegresoSeleccionado,
                                idRuta: idRutaCalculada,
                                fleteBase: montoActualizado,
                                observaciones: obsActualizada,
                            }
                            : v
                    )
                );

                mostrarToast(`Plancha de Retorno ${nroTrim} actualizada exitosamente`, 'ok');
                setModalRetornoAbierto(false);
                setPlanchaEditando(null);
                return;
            }

            // MODO CREACIÓN DE NUEVA PLANCHA
            const fechaSalidaIso = calcularFechaHoraRetornoInterna(viajeSeleccionadoRetorno);
            const fh = formatearFechaHora(fechaSalidaIso);

            let viajeRetornoCreado: ViajeFleteItem;

            if (!viajeSeleccionadoRetorno.idOrden.startsWith('mock-')) {
                const respuestaBd = await programacionService.crearViajeRetorno({
                    idOrdenOrigen: viajeSeleccionadoRetorno.idOrden,
                    nroTransporte: nroTrim,
                    idPuntoDestino: puntoRegresoSeleccionado,
                    fechaProgramadaCarga: fechaSalidaIso,
                    montoFlete: parseFloat(montoRetorno) || 0,
                    observaciones: observacionRetorno,
                });

                const rFh = formatearFechaHora(respuestaBd.fechaProgramadaCarga);
                viajeRetornoCreado = {
                    idOrden: respuestaBd.idOrden,
                    nroTransporte: respuestaBd.nroTransporte || nroTrim,
                    fecha: rFh.fecha,
                    hora: rFh.hora,
                    fechaISO: rFh.iso,
                    fleteBase: Number(respuestaBd.montoFleteCliente) || parseFloat(montoRetorno) || 0,
                    montoAnticipoConductor: Number(respuestaBd.montoAnticipoConductor) || 0,
                    monedaAnticipo: 'Bs',
                    origenCodigo: viajeSeleccionadoRetorno.destinoCodigo,
                    origenNombre: viajeSeleccionadoRetorno.destinoNombre,
                    idPuntoOrigen: viajeSeleccionadoRetorno.idPuntoDestino,
                    destinoCodigo: codigoRegreso,
                    destinoNombre: nombreRegreso,
                    idPuntoDestino: puntoRegresoSeleccionado,
                    idRuta: respuestaBd.idRuta,
                    idCliente: respuestaBd.idCliente,
                    clienteNombre:
                        respuestaBd.cliente?.razonSocial ||
                        respuestaBd.cliente?.nombreComercial ||
                        viajeSeleccionadoRetorno.clienteNombre ||
                        '',
                    idVehiculoMotriz: respuestaBd.idVehiculoMotriz,
                    vehiculoMotrizNombre: viajeSeleccionadoRetorno.vehiculoMotrizNombre,
                    idAcoplado: respuestaBd.idAcoplado,
                    acopladoNombre: viajeSeleccionadoRetorno.acopladoNombre,
                    idConductor: respuestaBd.idConductor,
                    conductorNombre: viajeSeleccionadoRetorno.conductorNombre,
                    conductorIniciales: viajeSeleccionadoRetorno.conductorIniciales,
                    conductorEstado: 'Programado Retorno',
                    conductorCedula: viajeSeleccionadoRetorno.conductorCedula,
                    conductorTelefono: viajeSeleccionadoRetorno.conductorTelefono,
                    conductorBanco: viajeSeleccionadoRetorno.conductorBanco,
                    conductorNroCuenta: viajeSeleccionadoRetorno.conductorNroCuenta,
                    conductorPagoMovil: viajeSeleccionadoRetorno.conductorPagoMovil,
                    estadoOrden: 'Programado',
                    fisico: false,
                    observaciones: respuestaBd.observaciones,
                    guiasViajesRecargos: [],
                    esRetorno: true,
                    idOrdenPadre: viajeSeleccionadoRetorno.idOrden,
                };
            } else {
                // En modo local mock
                viajeRetornoCreado = {
                    idOrden: `retorno-${Date.now()}`,
                    nroTransporte: nroTrim,
                    fecha: fh.fecha,
                    hora: fh.hora,
                    fechaISO: fechaSalidaIso,
                    fleteBase: parseFloat(montoRetorno) || 0,
                    montoAnticipoConductor: 0,
                    monedaAnticipo: 'Bs',
                    origenCodigo: viajeSeleccionadoRetorno.destinoCodigo,
                    origenNombre: viajeSeleccionadoRetorno.destinoNombre,
                    idPuntoOrigen: viajeSeleccionadoRetorno.idPuntoDestino,
                    destinoCodigo: codigoRegreso,
                    destinoNombre: nombreRegreso,
                    idPuntoDestino: puntoRegresoSeleccionado,
                    idRuta: idRutaCalculada,
                    idCliente: viajeSeleccionadoRetorno.idCliente,
                    clienteNombre: viajeSeleccionadoRetorno.clienteNombre || '',
                    idVehiculoMotriz: viajeSeleccionadoRetorno.idVehiculoMotriz,
                    vehiculoMotrizNombre: viajeSeleccionadoRetorno.vehiculoMotrizNombre,
                    idAcoplado: viajeSeleccionadoRetorno.idAcoplado,
                    acopladoNombre: viajeSeleccionadoRetorno.acopladoNombre,
                    idConductor: viajeSeleccionadoRetorno.idConductor,
                    conductorNombre: viajeSeleccionadoRetorno.conductorNombre,
                    conductorIniciales: viajeSeleccionadoRetorno.conductorIniciales,
                    conductorEstado: 'Programado Retorno',
                    conductorCedula: viajeSeleccionadoRetorno.conductorCedula,
                    conductorTelefono: viajeSeleccionadoRetorno.conductorTelefono,
                    conductorBanco: viajeSeleccionadoRetorno.conductorBanco,
                    conductorNroCuenta: viajeSeleccionadoRetorno.conductorNroCuenta,
                    conductorPagoMovil: viajeSeleccionadoRetorno.conductorPagoMovil,
                    estadoOrden: 'Programado',
                    fisico: false,
                    observaciones: `[RETORNO_DE:${viajeSeleccionadoRetorno.idOrden}] ${observacionRetorno}`,
                    guiasViajesRecargos: [],
                    esRetorno: true,
                    idOrdenPadre: viajeSeleccionadoRetorno.idOrden,
                };
            }

            // Añadir a la lista de viajes (se posicionará automáticamente debajo del viaje inicial)
            setViajes((prev) => [viajeRetornoCreado, ...prev]);

            mostrarToast(
                `Plancha de Retorno ${nroTrim} generada exitosamente debajo del viaje ${viajeSeleccionadoRetorno.nroTransporte}`,
                'ok'
            );
            setModalRetornoAbierto(false);
        } catch (err: any) {
            mostrarToast(
                `Error al ${planchaEditando ? 'actualizar' : 'crear'} la plancha de retorno: ${err?.message || err}`,
                'error'
            );
        } finally {
            setGuardandoRetorno(false);
        }
    };

    // ==========================================================================
    // MANEJO DE MODAL 3: ASIGNACIÓN DE RECURSOS (MACK / BATEA / CHOFER)
    // ==========================================================================
    const abrirModalRecursos = (viaje: ViajeFleteItem) => {
        setViajeSeleccionadoRecursos(viaje);
        setSelVehiculoMotriz(viaje.idVehiculoMotriz || '');
        setSelAcoplado(viaje.idAcoplado || '');
        setSelConductor(viaje.idConductor || '');
        setModalRecursosAbierto(true);
    };

    const handleGuardarRecursos = async () => {
        if (!viajeSeleccionadoRecursos) return;
        setGuardandoRecursos(true);

        try {
            const vMotrizObj = vehiculos.find((v) => v.idVehiculo === selVehiculoMotriz);
            const vAcopladoObj = vehiculos.find((v) => v.idVehiculo === selAcoplado);
            const condObj = conductores.find((c) => c.idConductor === selConductor);

            const nombreMack = vMotrizObj
                ? `${vMotrizObj.marca || 'Mack'} ${vMotrizObj.modelo || ''} #${vMotrizObj.placa}`
                : viajeSeleccionadoRecursos.vehiculoMotrizNombre;
            const nombreBatea = vAcopladoObj
                ? `${vAcopladoObj.marca || 'Batea'} ${vAcopladoObj.modelo || ''} • ${vAcopladoObj.placa}`
                : viajeSeleccionadoRecursos.acopladoNombre;
            const nombreChofer = condObj
                ? `${condObj.nombres} ${condObj.apellidos}`
                : viajeSeleccionadoRecursos.conductorNombre;

            if (!viajeSeleccionadoRecursos.idOrden.startsWith('mock-')) {
                await programacionService.asignarRecursos({
                    idOrden: viajeSeleccionadoRecursos.idOrden,
                    idVehiculoMotriz: selVehiculoMotriz || null,
                    idAcoplado: selAcoplado || null,
                    idConductor: selConductor || null,
                });
            }

            setViajes((prev) =>
                prev.map((v) =>
                    v.idOrden === viajeSeleccionadoRecursos.idOrden
                        ? {
                            ...v,
                            idVehiculoMotriz: selVehiculoMotriz || null,
                            vehiculoMotrizNombre: nombreMack,
                            idAcoplado: selAcoplado || null,
                            acopladoNombre: nombreBatea,
                            idConductor: selConductor || null,
                            conductorNombre: nombreChofer,
                            conductorIniciales: obtenerIniciales(nombreChofer),
                            conductorCedula: condObj?.cedulaIdentidad ?? v.conductorCedula,
                            conductorTelefono: condObj?.telefono ?? v.conductorTelefono,
                            conductorBanco: condObj?.banco ?? v.conductorBanco,
                            conductorNroCuenta: condObj?.nroCuenta ?? v.conductorNroCuenta,
                            conductorPagoMovil: condObj?.pagoMovil ?? v.conductorPagoMovil,
                        }
                        : v
                )
            );

            mostrarToast('Recursos de transporte (Mack / Batea / Chofer) actualizados correctamente', 'ok');
            setModalRecursosAbierto(false);
        } catch (err: any) {
            mostrarToast(`Error al asignar recursos: ${err?.message || err}`, 'error');
        } finally {
            setGuardandoRecursos(false);
        }
    };

    // ==========================================================================
    // MANEJO DE MODAL 4: ANTICIPO DE CONDUCTOR
    // ==========================================================================
    const abrirModalAnticipo = async (viaje: ViajeFleteItem) => {
        setViajeSeleccionadoAnticipo(viaje);
        const montoActual = Number(viaje.montoAnticipoConductor || 0);
        setMontoAnticipoInput(montoActual > 0 ? montoActual.toFixed(2) : '');
        setMonedaAnticipoInput(viaje.monedaAnticipo || 'Bs');
        setModalAnticipoAbierto(true);

        // Consultar directamente en la base de datos la tabla conductores si el viaje tiene idConductor
        if (viaje.idConductor) {
            try {
                const conductorBd = await conductoresService.getConductor(viaje.idConductor);
                setViajeSeleccionadoAnticipo((prev) =>
                    prev && prev.idOrden === viaje.idOrden
                        ? {
                            ...prev,
                            conductorNombre: `${conductorBd.nombres || ''} ${conductorBd.apellidos || ''}`.trim() || prev.conductorNombre,
                            conductorCedula: conductorBd.cedulaIdentidad ?? null,
                            conductorTelefono: conductorBd.telefono ?? null,
                            conductorBanco: conductorBd.banco ?? null,
                            conductorNroCuenta: conductorBd.nroCuenta ?? null,
                            conductorPagoMovil: conductorBd.pagoMovil ?? null,
                        }
                        : prev
                );
            } catch {
                // Se mantienen los datos de la relación conductor traídos de la BD en la guía
            }
        }
    };

    const handleGuardarAnticipo = async () => {
        if (!viajeSeleccionadoAnticipo) return;

        const montoNum = Math.max(0, parseFloat(montoAnticipoInput) || 0);
        setGuardandoAnticipo(true);

        try {
            let montoGuardado = montoNum;
            if (!viajeSeleccionadoAnticipo.idOrden.startsWith('mock-') && !viajeSeleccionadoAnticipo.idOrden.startsWith('retorno-')) {
                const actualizado = await programacionService.actualizarAnticipo(
                    viajeSeleccionadoAnticipo.idOrden,
                    montoNum,
                    monedaAnticipoInput
                );
                if (actualizado?.montoAnticipoConductor !== undefined && actualizado?.montoAnticipoConductor !== null) {
                    montoGuardado = Number(actualizado.montoAnticipoConductor);
                }
            }

            setViajes((prev) =>
                prev.map((v) =>
                    v.idOrden === viajeSeleccionadoAnticipo.idOrden
                        ? {
                            ...v,
                            montoAnticipoConductor: montoGuardado,
                            monedaAnticipo: monedaAnticipoInput,
                        }
                        : v
                )
            );

            mostrarToast(
                `Anticipo de ${monedaAnticipoInput === 'Bs' ? 'Bs.' : '$'} ${montoGuardado.toFixed(2)} (${monedaAnticipoInput}) guardado para la guía ${viajeSeleccionadoAnticipo.nroTransporte}`,
                'ok'
            );
            setModalAnticipoAbierto(false);
        } catch (err: any) {
            mostrarToast(`Error al guardar el anticipo: ${err?.message || err}`, 'error');
        } finally {
            setGuardandoAnticipo(false);
        }
    };

    // ==========================================================================
    // EXPORTACIÓN TXT DE ANTICIPOS POR CONDUCTOR
    // ==========================================================================
    const handleExportarConciliacion = () => {
        try {
            // Fecha actual: DDMMYYYY
            const ahora = new Date();
            const diaActual = String(ahora.getDate()).padStart(2, '0');
            const mesActual = String(ahora.getMonth() + 1).padStart(2, '0');
            const anioActual = String(ahora.getFullYear());
            const fechaActualTxt = `${diaActual}${mesActual}${anioActual}`;

            // Agrupar y sumar anticipos por conductor
            const acumuladoPorConductor = new Map<string, { cedulaFormateada: string; montoTotal: number }>();

            for (const item of viajesFiltrados) {
                const monto = Number(item.montoAnticipoConductor || 0);
                if (monto <= 0) continue;

                const condCatalogo = item.idConductor
                    ? conductores.find((c) => c.idConductor === item.idConductor)
                    : undefined;
                const rawCedula = (item.conductorCedula || condCatalogo?.cedulaIdentidad || '').trim();
                if (!rawCedula && !item.idConductor) continue;

                // Determinar letra inicial (V o E) y 9 dígitos rellenados con 0 a la izquierda
                const letraMatch = rawCedula.toUpperCase().match(/[VE]/);
                const letra = letraMatch ? letraMatch[0] : 'V';
                const digitosCedula = rawCedula.replace(/\D/g, '').slice(-9).padStart(9, '0');
                const cedulaFormateada = `${letra}${digitosCedula}`;

                // Clave única por cédula formateada (o idConductor si no tuviera dígitos)
                const claveAgrupacion = digitosCedula !== '000000000' ? cedulaFormateada : (item.idConductor || cedulaFormateada);

                const existente = acumuladoPorConductor.get(claveAgrupacion);
                if (existente) {
                    existente.montoTotal += monto;
                } else {
                    acumuladoPorConductor.set(claveAgrupacion, {
                        cedulaFormateada,
                        montoTotal: monto,
                    });
                }
            }

            if (acumuladoPorConductor.size === 0) {
                mostrarToast('No hay anticipos asignados a conductores en la tabla para exportar', 'info');
                return;
            }

            const lineas: string[] = [];
            for (const { cedulaFormateada, montoTotal } of acumuladoPorConductor.values()) {
                const [parteEnteraRaw, parteDecimalRaw = '00'] = Math.abs(montoTotal).toFixed(2).split('.');
                const parteEntera = parteEnteraRaw.slice(-19).padStart(19, '0');
                const parteDecimal = parteDecimalRaw.slice(0, 2).padEnd(2, '0');
                const anticipoFormateado = `${parteEntera}${parteDecimal}`;

                // Estructura: [V/E + 9 dígitos cédula] + [2 espacios] + [19 enteros + 2 decimales] + [DDMMYYYY]
                lineas.push(`${cedulaFormateada}  ${anticipoFormateado}${fechaActualTxt}`);
            }

            const contenidoTxt = lineas.join('\r\n');
            const blob = new Blob([contenidoTxt], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Anticipos_Conductores_${fechaActualTxt}.txt`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            mostrarToast(`Archivo TXT de anticipos exportado (${lineas.length} ${lineas.length === 1 ? 'conductor' : 'conductores'})`, 'ok');
        } catch (err: any) {
            mostrarToast(`Error al exportar TXT de anticipos: ${err?.message || err}`, 'error');
        }
    };

    // Vehículos clasificados para modal
    const chutosDisponibles = useMemo(() => {
        return vehiculos.filter(
            (v) =>
                v.tipoUnidad === 'motriz' ||
                v.nombreClasificacion?.toLowerCase().includes('chuto') ||
                v.marca?.toLowerCase().includes('mack')
        );
    }, [vehiculos]);

    const bateasDisponibles = useMemo(() => {
        return vehiculos.filter(
            (v) =>
                v.tipoUnidad === 'acoplado' ||
                v.nombreClasificacion?.toLowerCase().includes('batea') ||
                v.nombreClasificacion?.toLowerCase().includes('cortinero') ||
                v.nombreClasificacion?.toLowerCase().includes('cava')
        );
    }, [vehiculos]);

    // ==========================================================================
    // RENDER PRINCIPAL
    // ==========================================================================
    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-3 sm:p-4 lg:p-5 select-none">
            {/* Toast Notificación */}
            {toast.visible && (
                <div className="fixed top-6 right-6 z-50 transition-all duration-300 ease-out transform translate-y-0">
                    <div
                        className={`flex items-center space-x-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold backdrop-blur-md ${toast.tipo === 'ok'
                            ? 'bg-emerald-500/95 text-white border-emerald-400 shadow-emerald-500/20'
                            : toast.tipo === 'error'
                                ? 'bg-rose-500/95 text-white border-rose-400 shadow-rose-500/20'
                                : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-900/20'
                            }`}
                    >
                        {toast.tipo === 'ok' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-100 shrink-0" />
                        ) : toast.tipo === 'error' ? (
                            <AlertCircle className="w-5 h-5 text-rose-100 shrink-0" />
                        ) : (
                            <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
                        )}
                        <span>{toast.mensaje}</span>
                    </div>
                </div>
            )}

            <div className="max-w-[1720px] mx-auto space-y-6">
                {/* ================================================================= */}
                {/* CABECERA PRINCIPAL: TÍTULO, SUBTÍTULO & BADGES DE ESTATUS         */}
                {/* ================================================================= */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                            Asignación de Recursos & Recargos de Ruta
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                            Control de fletes en curso, unidades pesadas Mack, estados físicos y gestión arancelaria de recargos extraordinarios.
                        </p>
                    </div>

                    {/* Badges de Estado Operativo Superiores */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                        {/* Activas con punto verde */}
                        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#e8f8f0] border border-[#a7f3d0] text-[#0b6641] text-xs font-bold shadow-xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
                            <span>{conteoKPI.activas} Activas</span>
                        </div>

                        {/* Programadas */}
                        <div className="flex items-center px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
                            <span>{conteoKPI.programadas} Programadas</span>
                        </div>

                        {/* En Tránsito */}
                        <div className="flex items-center px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold">
                            <span>{conteoKPI.transito} En Tránsito</span>
                        </div>

                        {/* En Andén */}
                        <div className="flex items-center px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                            <span>{conteoKPI.anden} En Andén</span>
                        </div>

                        {/* Total Anticipos Asignados */}
                        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold shadow-2xs">
                            <Banknote className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>
                                Total Anticipos:{' '}
                                {resumenAnticipos.totalUSD > 0 && resumenAnticipos.totalBs > 0
                                    ? `Bs. ${resumenAnticipos.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + $${resumenAnticipos.totalUSD.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                                    : resumenAnticipos.totalUSD > 0
                                        ? `$${resumenAnticipos.totalUSD.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                                        : `Bs. ${resumenAnticipos.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ================================================================= */}
                {/* BARRA DE FILTROS Y CONTROLES                                      */}
                {/* ================================================================= */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Lado izquierdo: Buscador + Selector de fechas + Excluyendo cancelados */}
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                        {/* Buscador */}
                        <div className="relative min-w-[240px] flex-1 max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Search className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Filtrar por Guía TR-*, Chofer, Planta..."
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 transition"
                            />
                            {busqueda && (
                                <button
                                    type="button"
                                    onClick={() => setBusqueda('')}
                                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Rango de Fecha */}
                        {/* Rango de Fecha e Intervalo de Auditoría */}
                        <div className="relative">
                            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTempInicio(fechaInicio);
                                        setTempFin(fechaFin);
                                        setPopoverFechaAbierto(!popoverFechaAbierto);
                                    }}
                                    className="flex items-center space-x-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
                                    title="Cambiar intervalo de fechas de auditoría"
                                >
                                    <Calendar className="w-3.5 h-3.5 text-orange-500" />
                                    <span className="font-bold text-slate-800">{formatearRangoLegible(fechaInicio, fechaFin, presetFecha)}</span>
                                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${popoverFechaAbierto ? 'rotate-180' : ''}`} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleAplicarPreset('hoy')}
                                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${presetFecha === 'hoy'
                                        ? 'bg-slate-800 text-white font-bold'
                                        : 'text-slate-600 hover:bg-slate-200/60'
                                        }`}
                                >
                                    Hoy
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAplicarPreset('semana')}
                                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${presetFecha === 'semana'
                                        ? 'bg-slate-800 text-white font-bold'
                                        : 'text-slate-600 hover:bg-slate-200/60'
                                        }`}
                                >
                                    Esta Semana
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAplicarPreset('mes')}
                                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${presetFecha === 'mes'
                                        ? 'bg-slate-800 text-white font-bold'
                                        : 'text-slate-600 hover:bg-slate-200/60'
                                        }`}
                                >
                                    Este Mes
                                </button>
                            </div>

                            {/* Popover desplegable para definir intervalo personalizado */}
                            {popoverFechaAbierto && (
                                <>
                                    <div
                                        className="fixed inset-0 z-30"
                                        onClick={() => setPopoverFechaAbierto(false)}
                                    />
                                    <div className="absolute left-0 mt-2 z-40 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="w-4 h-4 text-orange-500" />
                                                <h4 className="font-extrabold text-slate-900 text-xs tracking-tight">Intervalo de Auditoría</h4>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setPopoverFechaAbierto(false)}
                                                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                    Fecha Inicio (Desde)
                                                </label>
                                                <input
                                                    type="date"
                                                    value={tempInicio}
                                                    onChange={(e) => setTempInicio(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                    Fecha Fin (Hasta)
                                                </label>
                                                <input
                                                    type="date"
                                                    value={tempFin}
                                                    onChange={(e) => setTempFin(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden"
                                                />
                                            </div>

                                            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAplicarPreset('todos')}
                                                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline transition cursor-pointer"
                                                >
                                                    Ver Todos
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={handleAplicarRangoPersonalizado}
                                                    className="flex items-center space-x-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
                                                >
                                                    <Search className="w-3 h-3" />
                                                    <span>Auditar Rango</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Checkbox Excluyendo Cancelados */}
                        <label
                            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 cursor-pointer select-none transition"
                        >
                            <input
                                type="checkbox"
                                checked={excluirCancelados}
                                onChange={(e) => setExcluirCancelados(e.target.checked)}
                                className="hidden"
                            />
                            <div
                                className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${excluirCancelados
                                    ? 'bg-teal-600 border-teal-600 text-white'
                                    : 'border-slate-300 bg-white'
                                    }`}
                            >
                                {excluirCancelados && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="text-xs font-semibold text-slate-700">Excluyendo Cancelados</span>
                        </label>
                    </div>

                    {/* Lado derecho: Botón Exportar Conciliación */}
                    <div className="flex items-center space-x-2 self-end md:self-auto">
                        <button
                            type="button"
                            onClick={() => cargarDatos(fechaInicio, fechaFin)}
                            disabled={cargando}
                            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                            title="Refrescar matriz"
                        >
                            <RotateCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                            type="button"
                            onClick={handleExportarConciliacion}
                            className="flex items-center space-x-2 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm px-4 py-2 border border-slate-200 rounded-xl shadow-xs transition transform hover:scale-[1.01]"
                        >
                            <Download className="w-4 h-4 text-slate-600" />
                            <span>Exportar Txt Anticipos</span>
                        </button>
                    </div>
                </div>

                {/* ================================================================= */}
                {/* TABLA PRINCIPAL DE ASIGNACIÓN & FLETES                            */}
                {/* ================================================================= */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto lg:overflow-x-visible">
                        <table className="w-full text-left border-collapse">
                            {/* Encabezados de Columna */}
                            <thead>
                                <tr className="bg-[#fff9f4] border-b border-[#fed7aa]/50 text-[10px] xl:text-[11px] font-black tracking-wider text-slate-500 uppercase select-none">
                                    <th className="py-3 px-2.5 xl:px-3.5 whitespace-nowrap">FECHA / SALIDA</th>
                                    <th className="py-3 px-2.5 xl:px-3.5 whitespace-nowrap">Nº GUÍA / TRANSP.</th>
                                    <th className="py-3 px-2.5 xl:px-3.5">RUTA (ORIGEN — DESTINO)</th>
                                    <th className="py-3 px-2.5 xl:px-3.5">RECURSOS (MACK / BATEA)</th>
                                    <th className="py-3 px-2.5 xl:px-3.5">CONDUCTOR</th>
                                    <th className="py-3 px-2 xl:px-3 text-center whitespace-nowrap">GUÍA FÍSICA</th>
                                    <th className="py-3 px-2.5 xl:px-3.5 text-right whitespace-nowrap">ACCIONES RÁPIDAS</th>
                                </tr>
                            </thead>

                            {/* Cuerpo de Filas */}
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {viajesOrdenadosJerarquicos.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center space-y-2.5">
                                                <Package className="w-8 h-8 text-slate-300" />
                                                <span className="font-semibold text-slate-700 text-sm">
                                                    {!fechaInicio && !fechaFin && presetFecha === ''
                                                        ? 'Seleccione una fecha o rango para consultar los viajes'
                                                        : `No se encontraron viajes en el intervalo ${formatearRangoLegible(fechaInicio, fechaFin, presetFecha)}`}
                                                </span>
                                                <span className="text-xs text-slate-400 max-w-md">
                                                    {!fechaInicio && !fechaFin && presetFecha === ''
                                                        ? 'Utilice el selector de fechas superior (Hoy, Esta Semana, Este Mes o un intervalo personalizado) para cargar los viajes.'
                                                        : 'Intente cambiar el intervalo de fechas o presione el botón inferior para auditar todos los registros disponibles.'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAplicarPreset('todos')}
                                                    className="mt-1 px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                                                >
                                                    Ver Todos los Viajes sin Filtro de Fecha
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    viajesOrdenadosJerarquicos.map(({ viaje: trip, esSubFila }) => {
                                        const cantRecargos = (trip.guiasViajesRecargos || []).length;
                                        const tieneRecargos = cantRecargos > 0;
                                        const tieneAnticipo = Number(trip.montoAnticipoConductor || 0) > 0;
                                        const tienePlanchaAsignada = padresConPlancha.has(trip.idOrden);

                                        return (
                                            <tr
                                                key={trip.idOrden}
                                                className={`transition-colors duration-150 ${esSubFila
                                                    ? 'bg-emerald-50/85 hover:bg-emerald-100/50 border-l-4 border-l-emerald-600'
                                                    : 'hover:bg-slate-50/80'
                                                    }`}
                                            >
                                                {/* 1. FECHA / SALIDA */}
                                                <td className="py-3 px-2.5 xl:px-3.5 align-middle whitespace-nowrap">
                                                    {esSubFila ? (
                                                        <div className="flex items-center space-x-1.5">
                                                            <CornerDownRight className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                                                            <div className="font-black text-emerald-900 text-xs">
                                                                {trip.fecha}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="font-bold text-slate-900 text-xs">
                                                            {trip.fecha}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* 2. Nº GUÍA / TRANSPORTE */}
                                                <td className="py-3 px-2.5 xl:px-3.5 align-middle whitespace-nowrap">
                                                    <div className="flex items-center space-x-1">
                                                        <span className="font-black text-slate-900 tracking-tight text-xs">
                                                            {trip.nroTransporte}
                                                        </span>
                                                        {esSubFila && (
                                                            <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black text-[8px] tracking-wider uppercase shadow-2xs">
                                                                Plancha
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                                        Flete:{' '}
                                                        <strong className="text-slate-800 font-bold">
                                                            ${trip.fleteBase.toFixed(2)}
                                                        </strong>
                                                    </div>
                                                    {tieneAnticipo && (
                                                        <div className="text-[10px] text-teal-700 font-semibold mt-0.5">
                                                            Anticipo:{' '}
                                                            <strong className="font-extrabold">
                                                                {trip.monedaAnticipo === 'USD' ? '$' : 'Bs. '}
                                                                {Number(trip.montoAnticipoConductor).toLocaleString('es-VE', {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                            </strong>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* 3. RUTA (ORIGEN — DESTINO) */}
                                                <td className="py-1.5 px-2.5 xl:px-3.5 align-middle max-w-[160px] xl:max-w-[220px]">
                                                    <div className="leading-tight space-y-0.5">
                                                        {/* Origen */}
                                                        <div className="flex items-center space-x-1.5 leading-tight" title={`[${trip.origenCodigo}] ${trip.origenNombre}`}>
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                            <span className="font-semibold text-slate-800 text-[11px] xl:text-xs truncate">
                                                                {trip.origenNombre}
                                                            </span>
                                                        </div>

                                                        {/* Destino */}
                                                        <div className="flex items-center space-x-1.5 leading-tight" title={`[${trip.destinoCodigo}] ${trip.destinoNombre}`}>
                                                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                                                            <span className="text-slate-500 text-[11px] xl:text-xs font-normal truncate">
                                                                {trip.destinoNombre}
                                                            </span>
                                                        </div>

                                                        {/* Cliente en naranja suave y limpio (solo en viajes principales, no en plancha) */}
                                                        {!esSubFila && !trip.esRetorno && trip.clienteNombre && (
                                                            <div
                                                                className="pl-3 text-[10px] font-medium text-orange-500 truncate leading-none pt-0.5 capitalize"
                                                                title={trip.clienteNombre}
                                                            >
                                                                {trip.clienteNombre.toLowerCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* 4. RECURSOS (MACK / BATEA) */}
                                                <td className="py-3 px-2.5 xl:px-3.5 align-middle max-w-[140px] xl:max-w-[180px]">
                                                    <div
                                                        onClick={() => abrirModalRecursos(trip)}
                                                        className="group cursor-pointer p-1 -m-1 rounded-xl hover:bg-slate-100/90 transition"
                                                        title="Click para reasignar unidad Mack o Batea"
                                                    >
                                                        <div className="flex items-center space-x-1 font-bold text-slate-800 text-[11px] xl:text-xs group-hover:text-orange-600 transition">
                                                            <Truck className="w-3.5 h-3.5 text-slate-600 group-hover:text-orange-500 shrink-0" />
                                                            <span className="truncate">{trip.vehiculoMotrizNombre}</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-medium mt-0.5 truncate pl-4">
                                                            {trip.acopladoNombre}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 5. CONDUCTOR ASIGNADO */}
                                                <td className="py-3 px-2.5 xl:px-3.5 align-middle max-w-[145px] xl:max-w-[180px]">
                                                    <div className="flex items-center space-x-2">
                                                        {/* Avatar Iniciales */}
                                                        <div className="w-7 h-7 rounded-full bg-[#d1fae5] text-[#065f46] font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                                                            {trip.conductorIniciales}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-slate-800 text-[11px] xl:text-xs truncate" title={trip.conductorNombre}>
                                                                {trip.conductorNombre}
                                                            </div>
                                                            <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-medium">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                                <span className="truncate">{trip.conductorEstado}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 6. GUÍA FÍSICA (SWITCH RÁPIDO CON ETIQUETA DEBAJO) */}
                                                <td className="py-3 px-2 xl:px-3 align-middle text-center whitespace-nowrap">
                                                    <div className="flex flex-col items-center justify-center gap-1">
                                                        {/* Switch interactivo */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleFisico(trip.idOrden, trip.fisico)}
                                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 ${trip.fisico ? 'bg-[#059669]' : 'bg-slate-300'
                                                                }`}
                                                            role="switch"
                                                            aria-checked={trip.fisico}
                                                            title={trip.fisico ? 'Guía física en archivo/recibida' : 'Pendiente de entrega de guía física'}
                                                        >
                                                            <span
                                                                aria-hidden="true"
                                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${trip.fisico ? 'translate-x-4' : 'translate-x-0'
                                                                    }`}
                                                            />
                                                        </button>

                                                        {/* Label de estado físico debajo del switch */}
                                                        <span
                                                            className={`text-[9px] xl:text-[10px] font-bold select-none leading-tight text-center ${trip.fisico ? 'text-[#0b6641]' : 'text-slate-400'
                                                                }`}
                                                        >
                                                            {trip.fisico ? 'Recibido' : 'Pendiente'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* 7. ACCIONES RÁPIDAS: ANTICIPO + RECARGOS + PLANCHA RETORNO */}
                                                <td className="py-3 px-2.5 xl:px-3.5 align-middle text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end space-x-1 xl:space-x-1.5">
                                                        {/* Icono Reasignar recursos de flota (Mack y Batea) */}
                                                        <button
                                                            type="button"
                                                            onClick={() => abrirModalRecursos(trip)}
                                                            className="hidden sm:inline-flex p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                                            title="Reasignar recursos de flota (Mack y Batea)"
                                                        >
                                                            <ArrowRightLeft className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* Icono de Mensajes / Notas rápidas */}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const obs = trip.observaciones || 'Sin observaciones registradas.';
                                                                mostrarToast(`Nota Guía ${trip.nroTransporte}: ${obs}`, 'info');
                                                            }}
                                                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                                                            title="Ver observaciones del viaje"
                                                        >
                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* Botón Anticipo */}
                                                        <button
                                                            type="button"
                                                            onClick={() => abrirModalAnticipo(trip)}
                                                            className={`flex items-center justify-center space-x-1 px-2 xl:px-2.5 py-1.5 rounded-xl font-bold text-[11px] xl:text-xs transition transform hover:scale-[1.02] active:scale-[0.98] shadow-xs cursor-pointer ${tieneAnticipo
                                                                ? 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-teal-600/25'
                                                                : 'bg-slate-100 hover:bg-slate-200/80 active:bg-slate-300 text-slate-700 border border-slate-200'
                                                                }`}
                                                            title={
                                                                tieneAnticipo
                                                                    ? `Anticipo asignado: ${trip.monedaAnticipo === 'USD' ? '$' : 'Bs.'} ${Number(trip.montoAnticipoConductor).toFixed(2)}`
                                                                    : 'Registrar anticipo transferido al conductor'
                                                            }
                                                        >
                                                            <Banknote className="w-3.5 h-3.5 shrink-0" />
                                                            <span>Anticipo</span>
                                                            {tieneAnticipo && (
                                                                <Check className="w-3 h-3 stroke-[3] text-teal-100 shrink-0" />
                                                            )}
                                                        </button>

                                                        {/* Botón % + Recargos */}
                                                        <button
                                                            type="button"
                                                            onClick={() => abrirModalRecargos(trip)}
                                                            className={`flex items-center justify-center space-x-1 px-2 xl:px-2.5 py-1.5 rounded-xl font-bold text-[11px] xl:text-xs transition transform hover:scale-[1.02] active:scale-[0.98] shadow-xs cursor-pointer ${tieneRecargos
                                                                ? 'bg-[#f97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white shadow-orange-500/25'
                                                                : 'bg-slate-100 hover:bg-slate-200/80 active:bg-slate-300 text-slate-700 border border-slate-200'
                                                                }`}
                                                            title="Gestionar conceptos de recargos extraordinarios"
                                                        >
                                                            <span>% + Recargos</span>
                                                            {tieneRecargos && (
                                                                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-white text-orange-600 font-extrabold text-[10px]">
                                                                    {cantRecargos}
                                                                </span>
                                                            )}
                                                        </button>

                                                        {/* Slot de Botón Plancha Retorno (en viaje sin plancha) o Botón Editar (solo en la plancha) */}
                                                        {esSubFila || trip.esRetorno ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => abrirModalEditarRetorno(trip)}
                                                                className="flex items-center justify-center space-x-1 bg-white hover:bg-emerald-50 active:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 xl:px-2.5 py-1.5 rounded-xl font-bold text-[11px] xl:text-xs w-[112px] xl:w-[122px] shadow-2xs transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                                                title="Editar los datos de esta plancha de retorno"
                                                            >
                                                                <Pencil className="w-3 h-3 text-emerald-600 shrink-0" />
                                                                <span>Editar Plancha</span>
                                                            </button>
                                                        ) : !tienePlanchaAsignada ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => abrirModalRetorno(trip)}
                                                                className="flex items-center justify-center space-x-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-2 xl:px-2.5 py-1.5 rounded-xl font-bold text-[11px] xl:text-xs w-[112px] xl:w-[122px] shadow-sm shadow-emerald-600/30 transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                                                title="Generar plancha de retorno debajo de este flete"
                                                            >
                                                                <CornerDownRight className="w-3 h-3 shrink-0 stroke-[2.5]" />
                                                                <span>Plancha Retorno</span>
                                                            </button>
                                                        ) : (
                                                            <div className="w-[112px] xl:w-[122px] shrink-0" aria-hidden="true" />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pie de tabla con resumen y totalización de anticipos */}
                    <div className="bg-[#fafaf9] border-t border-slate-200/80 px-5 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
                        <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                                Mostrando{' '}
                                <strong className="text-slate-800 font-bold">
                                    {viajesOrdenadosJerarquicos.length}
                                </strong>{' '}
                                de {viajes.length} viajes activos en tiempo real.
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-teal-50 border border-teal-200/90 text-teal-900 px-3.5 py-1.5 rounded-xl shadow-2xs">
                                <Banknote className="w-4 h-4 text-teal-600 shrink-0" />
                                <span className="font-semibold text-teal-800">
                                    Total Anticipos ({resumenAnticipos.cantidadConAnticipo} viajes):
                                </span>
                                <span className="font-black text-teal-950 text-xs sm:text-sm">
                                    {resumenAnticipos.totalUSD > 0 && resumenAnticipos.totalBs > 0
                                        ? `Bs. ${resumenAnticipos.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / $${resumenAnticipos.totalUSD.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                                        : resumenAnticipos.totalUSD > 0
                                            ? `$${resumenAnticipos.totalUSD.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                                            : `Bs. ${resumenAnticipos.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===================================================================== */}
            {/* MODAL 1: GESTIÓN DE RECARGOS DE RUTA (REPLICA EXACTA DE LA IMAGEN)   */}
            {/* ===================================================================== */}
            <Modal
                isOpen={modalRecargosAbierto && !!viajeSeleccionadoRecargos}
                onClose={() => setModalRecargosAbierto(false)}
                title={
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                            <Coins className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-slate-900 block">
                                Recargos y Viáticos — {viajeSeleccionadoRecargos?.nombreRuta || 'Ruta'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-normal block">
                                Seleccione los conceptos y defina el monto a guardar en la tabla rutas_recargos
                            </span>
                        </div>
                    </div>
                }
                size="lg"
                footer={
                    <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-slate-500 font-medium">
                            {recargosSeleccionados.length} de {recargosModalItems.length} seleccionados
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setModalRecargosAbierto(false)}
                                disabled={guardandoRecargos}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleGuardarRecargosViaje}
                                disabled={guardandoRecargos || recargosModalLoading}
                                iconLeft={
                                    guardandoRecargos ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Save className="w-3.5 h-3.5" />
                                    )
                                }
                            >
                                {guardandoRecargos ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </div>
                    </div>
                }
            >
                <div className="space-y-4">
                    {/* Header informativo + Buscador */}
                    <div className="p-3 bg-gradient-to-r from-orange-50 via-amber-50/60 to-orange-50/40 border border-orange-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-orange-600 shrink-0" />
                            <div>
                                <span className="font-bold text-orange-950 block">
                                    {origenRecargosModal === 'rutas_recargos'
                                        ? 'Recargos de la Ruta (rutas_recargos):'
                                        : 'Recargos Generales (recargos_generales):'}
                                </span>
                                <span className="text-[11px] text-orange-800">
                                    {origenRecargosModal === 'rutas_recargos'
                                        ? 'Conceptos registrados para la ruta correspondiente al viaje'
                                        : 'La ruta no tiene recargos propios; se muestran los de recargos_generales'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Buscar concepto..."
                                    value={recargosFiltroTexto}
                                    onChange={(e) => setRecargosFiltroTexto(e.target.value)}
                                    className="pl-8 pr-2.5 py-1 text-xs bg-white border border-orange-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 w-44"
                                />
                            </div>
                            <div className="text-right shrink-0 bg-white/80 border border-orange-200 px-2 py-0.5 rounded-lg">
                                <span className="font-black text-orange-950 text-xs block leading-tight">
                                    {recargosSeleccionados.length}
                                </span>
                                <span className="text-[9px] text-orange-700 font-semibold block leading-tight">Activos</span>
                            </div>
                        </div>
                    </div>

                    {recargosModalLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
                            <p className="text-xs font-medium">Cargando catálogo de recargos de la ruta (rutas_recargos)...</p>
                        </div>
                    ) : recargosFiltradosModal.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            {recargosFiltroTexto
                                ? `No se encontraron conceptos que coincidan con "${recargosFiltroTexto}".`
                                : 'No hay conceptos registrados para esta ruta en la tabla rutas_recargos.'}
                        </div>
                    ) : (
                        <div className="max-h-[46vh] overflow-y-auto space-y-2 pr-1">
                            {recargosFiltradosModal.map((recargo) => {
                                const isSelected = recargo.selected;
                                const tipoTexto = recargo.tipoCalculo
                                    ? recargo.tipoCalculo.replace(/_/g, ' ')
                                    : 'Monto Fijo';
                                const itemKey = recargo.idRecargo || recargo.concepto;

                                return (
                                    <div
                                        key={itemKey}
                                        className={`p-3 rounded-xl border transition-all duration-150 ${isSelected
                                            ? 'border-orange-400 bg-gradient-to-r from-orange-50/90 via-amber-50/40 to-orange-50/70 shadow-xs ring-1 ring-orange-400/30'
                                            : 'border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300 shadow-2xs'
                                            }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            {/* Checkbox y Datos del concepto */}
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    id={`recargo-${itemKey}`}
                                                    checked={isSelected}
                                                    onChange={(e) => handleToggleRecargo(itemKey, e.target.checked)}
                                                    className="w-4 h-4 mt-1 text-orange-600 rounded focus:ring-orange-500 cursor-pointer accent-orange-600"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <label
                                                        htmlFor={`recargo-${itemKey}`}
                                                        className={`text-xs font-bold block cursor-pointer transition-colors ${isSelected ? 'text-orange-950 font-black' : 'text-slate-800 hover:text-orange-700'
                                                            }`}
                                                    >
                                                        {recargo.concepto}
                                                    </label>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span
                                                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${isSelected
                                                                ? 'bg-orange-100/90 text-orange-800 border-orange-200'
                                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                                                }`}
                                                        >
                                                            {tipoTexto}
                                                        </span>
                                                        {isSelected && (
                                                            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                                                <Check className="w-3 h-3 text-emerald-600" />
                                                                Asignado al viaje
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Parámetros de asignación a rutas_recargos: Monto */}
                                            <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-orange-200/60">
                                                <div className="flex flex-col items-end">
                                                    <label
                                                        htmlFor={`monto-${itemKey}`}
                                                        className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1"
                                                    >
                                                        <span>Monto a guardar</span>
                                                        <span className="text-orange-600 font-mono">
                                                            ({recargo.tipoCalculo === 'Porcentaje' ? '%' : 'USD'})
                                                        </span>
                                                    </label>
                                                    <div className="flex items-center mt-0.5 relative">
                                                        <span className="text-xs font-bold text-slate-400 px-1 select-none">
                                                            {recargo.tipoCalculo === 'Porcentaje' ? '%' : '$'}
                                                        </span>
                                                        <input
                                                            id={`monto-${itemKey}`}
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={recargo.valor ?? ''}
                                                            placeholder="0.00"
                                                            onChange={(e) =>
                                                                handleUpdateRecargoMonto(itemKey, e.target.value)
                                                            }
                                                            onFocus={() => {
                                                                if (!isSelected) {
                                                                    handleToggleRecargo(itemKey, true);
                                                                }
                                                            }}
                                                            className={`w-24 text-xs font-black rounded-lg py-1 px-2 text-right transition-all shadow-2xs ${isSelected
                                                                ? 'text-slate-900 bg-white border border-orange-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                                                : 'text-slate-500 bg-slate-50 border border-slate-300 focus:bg-white focus:text-slate-900 focus:border-orange-400'
                                                                }`}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Botón rápido toggle */}
                                                <div className="flex flex-col items-center justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleRecargo(itemKey)}
                                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${isSelected
                                                            ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-2xs'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-700 border border-slate-200'
                                                            }`}
                                                    >
                                                        {isSelected ? 'Activo' : '+ Asignar'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Banner de Resumen y Totalización de Recargos */}
                    <div className="p-3.5 bg-gradient-to-r from-orange-50 via-amber-50/50 to-orange-50 border border-orange-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-orange-600 shrink-0" />
                            <div>
                                <span className="font-bold text-orange-950 block">
                                    Resumen de Recargos para la Ruta:
                                </span>
                                <span className="text-[11px] text-orange-800">
                                    {recargosSeleccionados.length} recargo(s) asignados que se guardarán en <code className="bg-orange-100 text-orange-900 px-1 py-0.5 rounded font-mono text-[10px]">rutas_recargos</code>
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="font-black text-orange-950 text-base block">
                                ${costoTotalRecargos.toFixed(2)} USD
                            </span>
                            <span className="text-[10px] text-orange-700 font-semibold">
                                Subtotal recargos fijos por viaje
                            </span>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* ===================================================================== */}
            {/* MODAL 2: GENERAR PLANCHA DE RETORNO (DEBAJO DEL VIAJE INICIAL)        */}
            {/* ===================================================================== */}
            {modalRetornoAbierto && viajeSeleccionadoRetorno && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
                        {/* Header del Modal */}
                        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-white">
                            <div className="flex items-start space-x-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 shrink-0">
                                    {planchaEditando ? (
                                        <Pencil className="w-5 h-5 stroke-[2.5]" />
                                    ) : (
                                        <CornerDownRight className="w-6 h-6 stroke-[2.5]" />
                                    )}
                                </div>
                                <div>
                                    <span className="text-[10px] font-black tracking-wider text-emerald-700 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-md uppercase">
                                        {planchaEditando ? 'EDICIÓN DE PLANCHA REGISTRADA' : 'LOGÍSTICA INVERSA & PLANCHAS'}
                                    </span>
                                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug mt-1">
                                        {planchaEditando ? `Editar Plancha ${planchaEditando.nroTransporte}` : 'Generar Plancha de Retorno'}
                                    </h2>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        {planchaEditando ? (
                                            <>Modificar datos de la plancha asociada a la unidad de <strong>{viajeSeleccionadoRetorno.conductorNombre}</strong></>
                                        ) : (
                                            <>Asociar flete de regreso para la unidad de <strong>{viajeSeleccionadoRetorno.conductorNombre}</strong></>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setModalRetornoAbierto(false);
                                    setPlanchaEditando(null);
                                }}
                                className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-xl transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Formulario Plancha de Retorno */}
                        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
                            {/* Resumen de recursos que retornan */}
                            <div className="p-3.5 bg-emerald-50 border border-emerald-300/80 rounded-2xl flex items-center justify-between text-xs">
                                <div>
                                    <div className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                                        Unidad Mack & Chofer Vinculados
                                    </div>
                                    <div className="font-bold text-slate-900 text-xs mt-0.5">
                                        {viajeSeleccionadoRetorno.vehiculoMotrizNombre} • {viajeSeleccionadoRetorno.conductorNombre}
                                    </div>
                                    {viajeSeleccionadoRetorno.clienteNombre && (
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 mt-1">
                                            <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                            <span>Cliente: {viajeSeleccionadoRetorno.clienteNombre}</span>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full">
                                    Misma Tripulación
                                </span>
                            </div>

                            {/* Nº de Transporte de Retorno con opción autogenerar */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 block">
                                        Nº de Transporte de Retorno <span className="text-orange-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAutoGenerarNroTransporteRetorno}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/70 border border-emerald-300/90 px-2 py-0.5 rounded-lg transition cursor-pointer"
                                        title="Autogenerar Nº de transporte sugerido"
                                    >
                                        <Sparkles className="w-3 h-3 text-emerald-600" />
                                        <span>Autogenerar Nº</span>
                                    </button>
                                </div>
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        value={nroTransporteRetorno}
                                        onChange={(e) => setNroTransporteRetorno(e.target.value)}
                                        placeholder="Ingrese el número de transporte o pulse el icono..."
                                        className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-xl pl-3.5 pr-10 py-2.5 text-sm font-bold text-slate-900 focus:outline-hidden transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAutoGenerarNroTransporteRetorno}
                                        className="absolute right-2 p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                        title="Autogenerar Nº sugerido"
                                    >
                                        <Sparkles className="w-4 h-4 text-emerald-600" />
                                    </button>
                                </div>
                                <span className="text-[11px] text-slate-400">
                                    Número identificador único con el que se registrará el viaje en guias_viajes.
                                </span>
                            </div>

                            {/* Card Ruta de Retorno (Origen -> Destino de la Plancha) */}
                            <div className="bg-linear-to-br from-orange-50/95 via-amber-50/80 to-orange-100/60 border border-orange-200/90 rounded-2xl p-4 space-y-3.5 shadow-2xs">
                                {/* Encabezado de la sección */}
                                <div className="flex items-center justify-between border-b border-orange-200/70 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-xl bg-orange-500/15 border border-orange-300/80 flex items-center justify-center text-orange-600 shrink-0">
                                            <ArrowRightLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black text-orange-950 uppercase tracking-wide leading-none">
                                                Tramo de Retorno
                                            </h3>
                                            <p className="text-[11px] text-orange-800/80 font-medium mt-0.5">
                                                Definición de salida y destino para la plancha de regreso
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-900 bg-orange-200/60 border border-orange-300/90 px-2.5 py-1 rounded-full shrink-0">
                                        <Building2 className="w-3 h-3 text-orange-700" />
                                        <span className="truncate max-w-[150px]">
                                            {viajeSeleccionadoRetorno.clienteNombre || 'Mismo cliente'}
                                        </span>
                                    </span>
                                </div>

                                {/* Punto 1: Origen del Retorno (Fijo = Destino del viaje inicial) */}
                                <div className="bg-white/85 border border-orange-200/80 rounded-xl p-3 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-extrabold text-orange-950 flex items-center gap-1.5">
                                            <span className="w-4 h-4 rounded-full bg-orange-200 text-orange-800 text-[10px] font-black flex items-center justify-center">
                                                1
                                            </span>
                                            <span>Punto de Salida de Retorno (Origen)</span>
                                        </label>
                                        <span className="text-[10px] font-bold text-orange-700 bg-orange-100/90 px-2 py-0.5 rounded-md">
                                            Fijo • Destino Inicial
                                        </span>
                                    </div>
                                    <div className="relative flex items-center">
                                        <MapPin className="w-4 h-4 text-orange-500 absolute left-3 pointer-events-none" />
                                        <input
                                            type="text"
                                            readOnly
                                            value={`[${viajeSeleccionadoRetorno.destinoCodigo}] ${viajeSeleccionadoRetorno.destinoNombre}`}
                                            className="w-full bg-orange-50/60 border border-orange-200/80 rounded-lg pl-9 pr-3.5 py-2 text-xs font-bold text-slate-700 select-none"
                                        />
                                    </div>
                                </div>

                                {/* Punto 2: Punto de Regreso (Filtrado exclusivamente por el mismo cliente del viaje) */}
                                <div className="bg-white border border-orange-300/90 rounded-xl p-3 space-y-2 shadow-2xs">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-extrabold text-orange-950 flex items-center gap-1.5">
                                            <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
                                                2
                                            </span>
                                            <span>
                                                Punto de Regreso (Destino de la Plancha) <span className="text-orange-600">*</span>
                                            </span>
                                        </label>
                                        <span className="text-[10px] font-extrabold text-orange-800 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-md">
                                            {puntosClienteRetorno.length} disponibles
                                        </span>
                                    </div>
                                    <select
                                        value={puntoRegresoSeleccionado}
                                        onChange={(e) => handleChangePuntoRegreso(e.target.value)}
                                        className="w-full bg-orange-50/30 hover:bg-white focus:bg-white border border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden transition cursor-pointer"
                                    >
                                        {puntosClienteRetorno.length === 0 ? (
                                            <option value="">No hay puntos de carga/descarga registrados para este cliente</option>
                                        ) : (
                                            puntosClienteRetorno.map((p) => (
                                                <option key={p.idPunto} value={p.idPunto}>
                                                    {p.idPunto === viajeSeleccionadoRetorno.idPuntoOrigen ? '★ [ORIGEN INICIAL] ' : ''}
                                                    [{p.codigoPuntoc || 'PTO'}] {p.nombreSede} {p.ciudad ? `(${p.ciudad})` : ''} {p.tipoPunto ? `• ${p.tipoPunto}` : ''}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    <p className="text-[11px] text-orange-800/80 font-medium">
                                        Puntos de carga y descarga vinculados exclusivamente a este cliente.
                                    </p>
                                </div>
                            </div>

                            {/* Monto Flete Retorno (Sujeto a la ruta inversa C -> B registrada en la tabla rutas) */}
                            <div className="space-y-1.5 bg-emerald-50/70 border border-emerald-300 rounded-2xl p-3.5">
                                <div className="flex items-center justify-between gap-2">
                                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <Coins className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Monto Base del Flete de Retorno</span>
                                    </label>
                                    <span className="text-[11px] font-black text-white bg-emerald-600 px-2.5 py-0.5 rounded-lg shadow-2xs truncate max-w-[250px]">
                                        {rutaContrariaActiva
                                            ? `Ruta C→B: $${tarifaReferenciaRuta.toFixed(2)} USD`
                                            : `Referencia: $${tarifaReferenciaRuta.toFixed(2)} USD`}
                                    </span>
                                </div>
                                <div className="relative flex items-center">
                                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-emerald-600 font-black text-sm select-none">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={montoRetorno}
                                        onChange={(e) => setMontoRetorno(e.target.value)}
                                        placeholder={tarifaReferenciaRuta.toFixed(2)}
                                        className="w-full bg-white border border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pl-8 pr-28 py-2.5 text-sm font-black text-slate-900 focus:outline-hidden transition shadow-2xs"
                                    />
                                    <div className="absolute right-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2.5 py-1 rounded-lg">
                                        <span>USD</span>
                                        {montoRetorno !== tarifaReferenciaRuta.toFixed(2) && (
                                            <button
                                                type="button"
                                                onClick={() => setMontoRetorno(tarifaReferenciaRuta.toFixed(2))}
                                                className="ml-1 text-[10px] text-orange-600 hover:text-orange-700 underline font-extrabold cursor-pointer"
                                                title="Restablecer monto según tarifa de la ruta C→B"
                                            >
                                                Restablecer
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 gap-2">
                                    <span className="truncate">
                                        {rutaContrariaActiva
                                            ? `Tarifa tomada de ruta inversa registrada: ${rutaContrariaActiva.nombreRuta}`
                                            : 'Tarifa calculada según ruta inversa (Destino → Origen) en tabla rutas.'}
                                    </span>
                                    <span className="font-black text-emerald-700 shrink-0">
                                        Tarifa Ruta: ${tarifaReferenciaRuta.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Observaciones */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">Observaciones Operativas</label>
                                <textarea
                                    rows={2}
                                    value={observacionRetorno}
                                    onChange={(e) => setObservacionRetorno(e.target.value)}
                                    className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-xl p-3 text-xs text-slate-800 focus:outline-hidden resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer Plancha Retorno */}
                        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex items-center justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setModalRetornoAbierto(false);
                                    setPlanchaEditando(null);
                                }}
                                className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={handleGenerarPlanchaRetorno}
                                disabled={guardandoRetorno}
                                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/30 hover:shadow-lg hover:shadow-emerald-600/40 transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                            >
                                {planchaEditando ? (
                                    <Save className="w-4 h-4 stroke-[2.5]" />
                                ) : (
                                    <CornerDownRight className="w-4 h-4 stroke-[2.5]" />
                                )}
                                <span>
                                    {guardandoRetorno
                                        ? planchaEditando
                                            ? 'Guardando...'
                                            : 'Generando...'
                                        : planchaEditando
                                            ? 'Guardar Cambios de Plancha'
                                            : 'Generar Viaje de Retorno'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================================================================== */}
            {/* MODAL 3: ASIGNACIÓN DE RECURSOS (MACK, BATEA & CHOFER)                */}
            {/* ===================================================================== */}
            {modalRecursosAbierto && viajeSeleccionadoRecursos && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-white">
                            <div className="flex items-start space-x-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shrink-0">
                                    <Truck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                                        Asignación de Recursos de Flota
                                    </h2>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Guía {viajeSeleccionadoRecursos.nroTransporte} • [{viajeSeleccionadoRecursos.origenCodigo} → {viajeSeleccionadoRecursos.destinoCodigo}]
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setModalRecursosAbierto(false)}
                                className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-xl transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-4 bg-slate-50/50">
                            {/* Chuto / Vehículo Motriz */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">
                                    Vehículo Motriz (Chuto / Mack)
                                </label>
                                <select
                                    value={selVehiculoMotriz}
                                    onChange={(e) => setSelVehiculoMotriz(e.target.value)}
                                    className="w-full bg-white border border-slate-200 focus:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden"
                                >
                                    <option value="">Seleccione Chuto...</option>
                                    {chutosDisponibles.map((v) => (
                                        <option key={v.idVehiculo} value={v.idVehiculo}>
                                            {v.marca} {v.modelo} (#{v.placa}) – {v.nombreClasificacion}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Batea / Acoplado */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">
                                    Acoplado (Batea / Cortinero / Cava)
                                </label>
                                <select
                                    value={selAcoplado}
                                    onChange={(e) => setSelAcoplado(e.target.value)}
                                    className="w-full bg-white border border-slate-200 focus:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden"
                                >
                                    <option value="">Seleccione Batea/Acoplado...</option>
                                    {bateasDisponibles.map((v) => (
                                        <option key={v.idVehiculo} value={v.idVehiculo}>
                                            {v.marca} {v.modelo} (#{v.placa}) – {v.nombreClasificacion}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Conductor Asignado */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">
                                    Conductor Asignado
                                </label>
                                <select
                                    value={selConductor}
                                    onChange={(e) => setSelConductor(e.target.value)}
                                    className="w-full bg-white border border-slate-200 focus:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden"
                                >
                                    <option value="">Seleccione Conductor...</option>
                                    {conductores.map((c) => (
                                        <option key={c.idConductor} value={c.idConductor}>
                                            {c.nombres} {c.apellidos} ({c.estado})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex items-center justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setModalRecursosAbierto(false)}
                                className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleGuardarRecursos}
                                disabled={guardandoRecursos}
                                className="bg-slate-900 hover:bg-black text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition transform hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                            >
                                {guardandoRecursos ? 'Guardando...' : 'Guardar Recursos'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================================================================== */}
            {/* MODAL 4: ANTICIPO TRANSFERIDO AL CONDUCTOR (GUIAS_VIAJES)             */}
            {/* ===================================================================== */}
            <Modal
                isOpen={modalAnticipoAbierto && !!viajeSeleccionadoAnticipo}
                onClose={() => setModalAnticipoAbierto(false)}
                title={
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                            <Banknote className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-slate-900 block">
                                Anticipo de Viaje — Guía {viajeSeleccionadoAnticipo?.nroTransporte}
                            </span>
                            <span className="text-[11px] text-slate-500 font-normal block">
                                Registre el monto del anticipo transferido para realizar el viaje
                            </span>
                        </div>
                    </div>
                }
                size="md"
                footer={
                    <div className="flex items-center justify-end gap-2 w-full">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setModalAnticipoAbierto(false)}
                            disabled={guardandoAnticipo}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleGuardarAnticipo}
                            disabled={guardandoAnticipo}
                            iconLeft={
                                guardandoAnticipo ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Save className="w-3.5 h-3.5" />
                                )
                            }
                        >
                            {guardandoAnticipo ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </div>
                }
            >
                {viajeSeleccionadoAnticipo && (() => {
                    const cedulaChofer = viajeSeleccionadoAnticipo.conductorCedula || '—';
                    const telefonoChofer = viajeSeleccionadoAnticipo.conductorTelefono || '—';
                    const bancoChofer = viajeSeleccionadoAnticipo.conductorBanco || '—';
                    const cuentaChofer = viajeSeleccionadoAnticipo.conductorNroCuenta || '—';
                    const pagoMovilChofer = viajeSeleccionadoAnticipo.conductorPagoMovil || '—';

                    return (
                        <div className="space-y-4">
                            {/* Parte Superior: Datos Bancarios del Conductor (tabla conductores en BD) */}
                            <div className="p-4 bg-gradient-to-br from-teal-50/90 via-emerald-50/50 to-slate-50 border border-teal-200/80 rounded-2xl space-y-3 shadow-2xs">
                                <div className="flex items-center justify-between border-b border-teal-200/70 pb-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                            {viajeSeleccionadoAnticipo.conductorIniciales}
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-teal-800 uppercase tracking-wider block">
                                                Datos Bancarios del Conductor
                                            </span>
                                            <span className="font-extrabold text-slate-900 text-xs sm:text-sm block">
                                                {viajeSeleccionadoAnticipo.conductorNombre}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-900 bg-white/90 border border-teal-200 px-2.5 py-1 rounded-lg">
                                        <span>C.I: {cedulaChofer}</span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleCopiarDatoBancario(
                                                    cedulaChofer,
                                                    'cedula',
                                                    'Cédula'
                                                )
                                            }
                                            className={`inline-flex items-center justify-center p-0.5 rounded transition shrink-0 cursor-pointer ${campoCopiado === 'cedula'
                                                ? 'text-emerald-600'
                                                : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                            title="Copiar Cédula"
                                        >
                                            {campoCopiado === 'cedula' ? (
                                                <Check className="w-3.5 h-3.5" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                    <div className="bg-white/90 border border-teal-200/70 rounded-xl p-2.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Banco
                                        </span>
                                        <span className="font-extrabold text-slate-800 text-xs block mt-0.5 truncate" title={bancoChofer}>
                                            {bancoChofer}
                                        </span>
                                    </div>

                                    <div className="bg-white/90 border border-teal-200/70 rounded-xl p-2.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Pago Móvil / Teléfono
                                        </span>
                                        <div className="inline-flex items-center gap-1.5 mt-0.5 max-w-full">
                                            <span className="font-extrabold text-slate-800 text-xs truncate">
                                                {pagoMovilChofer !== '—' ? pagoMovilChofer : telefonoChofer}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleCopiarDatoBancario(
                                                        pagoMovilChofer !== '—' ? pagoMovilChofer : telefonoChofer,
                                                        'pagoMovil',
                                                        'Pago Móvil'
                                                    )
                                                }
                                                className={`inline-flex items-center justify-center p-0.5 rounded transition shrink-0 cursor-pointer ${campoCopiado === 'pagoMovil'
                                                    ? 'text-emerald-600'
                                                    : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                                title="Copiar Pago Móvil"
                                            >
                                                {campoCopiado === 'pagoMovil' ? (
                                                    <Check className="w-3.5 h-3.5" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2 bg-white/90 border border-teal-200/70 rounded-xl p-2.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Número de Cuenta Bancaria
                                        </span>
                                        <div className="inline-flex items-center gap-1.5 mt-0.5 max-w-full">
                                            <span className="font-mono font-black text-slate-900 text-xs sm:text-sm tracking-wide break-all">
                                                {cuentaChofer}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleCopiarDatoBancario(
                                                        cuentaChofer,
                                                        'cuenta',
                                                        'Cuenta Bancaria'
                                                    )
                                                }
                                                className={`inline-flex items-center justify-center p-0.5 rounded transition shrink-0 cursor-pointer ${campoCopiado === 'cuenta'
                                                    ? 'text-emerald-600'
                                                    : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                                title="Copiar Cuenta Bancaria"
                                            >
                                                {campoCopiado === 'cuenta' ? (
                                                    <Check className="w-3.5 h-3.5" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-[11px] text-slate-500 font-medium pt-0.5 flex items-center justify-between">
                                    <span className="truncate">
                                        Ruta: [{viajeSeleccionadoAnticipo.origenCodigo}] {viajeSeleccionadoAnticipo.origenNombre} → [{viajeSeleccionadoAnticipo.destinoCodigo}] {viajeSeleccionadoAnticipo.destinoNombre}
                                    </span>
                                    <span className="font-bold text-slate-700 shrink-0 ml-2">
                                        {viajeSeleccionadoAnticipo.vehiculoMotrizNombre}
                                    </span>
                                </div>
                            </div>

                            {/* Monto del Anticipo + Tipo de Moneda al lado (Bs predeterminado o USD) */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="input-monto-anticipo"
                                    className="text-xs font-bold text-slate-700 block"
                                >
                                    Monto del Anticipo Transferido <span className="text-orange-500">*</span>
                                </label>
                                <div className="flex items-stretch gap-2">
                                    <div className="relative flex-1 flex items-center">
                                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-extrabold text-xs select-none">
                                            {monedaAnticipoInput === 'Bs' ? 'Bs.' : '$'}
                                        </span>
                                        <input
                                            id="input-monto-anticipo"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={montoAnticipoInput}
                                            onChange={(e) => setMontoAnticipoInput(e.target.value)}
                                            placeholder="0.00"
                                            autoFocus
                                            className="w-full bg-white border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-black text-slate-900 focus:outline-hidden transition"
                                        />
                                    </div>

                                    {/* Selector de Moneda al lado (Bs predeterminado / USD) */}
                                    <select
                                        value={monedaAnticipoInput}
                                        onChange={(e) => setMonedaAnticipoInput(e.target.value as 'Bs' | 'USD')}
                                        aria-label="Tipo de moneda del anticipo"
                                        className="w-28 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-extrabold text-slate-800 focus:outline-hidden transition cursor-pointer shrink-0"
                                    >
                                        <option value="Bs">Bs</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
}