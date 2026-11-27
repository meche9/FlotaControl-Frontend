import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
    Calendar,
    ChevronRight,
    FileSpreadsheet,
    Printer,
    Send,
    Truck,
    Phone,
    IdCard,
    CheckCircle2,
    ListFilter,
    ArrowUpDown,
    Receipt,
    Wallet,
    Calculator,
    PlusCircle,
    MinusCircle,
    Landmark,
    MessageSquare,
    Ship,
    Loader2,
    Copy,
    Check,
} from 'lucide-react';
import {
    programacionService,
    type GuiaProgramada,
} from '../../services/programacionService';
import {
    nominasProcesosService,
    type NominaProceso,
} from '../../services/nominasProcesosService';

export interface RegistroLiquidacionViaje {
    id: string;
    idOrdenPadre?: string | null;
    observacionesRaw?: string | null;
    fecha: string;
    fechaProgramadaCargaRaw?: string;
    tipo: 'VIAJE' | 'PLANCHA';
    esEspecial?: boolean;
    nroTransporte: string;
    origenDestino: string;
    tieneIconoBarco?: boolean;
    viaticos: number;
    caletas: number;
    peajes: number;
    gExtras: number;
    anticipo: number;
    tabuladorBase: number;
    art241Lottt: number;
    totalFlete: number;
}

export interface ConductorNominaState {
    idConductor?: string;
    nombre: string;
    cedula: string;
    telefono?: string;
    chutoMarcaModelo?: string;
    chutoPlaca?: string;
    foto?: string | null;
    estatus?: string;
    proceso?: NominaProceso | null;
    tasaBcv?: number;
}

const TASA_BCV_DEFECTO = 36.42;

const REGISTROS_DEMO_ROBERTO: RegistroLiquidacionViaje[] = [
    {
        id: 'reg-1',
        fecha: '02/11/2026',
        tipo: 'VIAJE',
        nroTransporte: '703826329',
        origenDestino: 'ALIM.VALENCIA',
        viaticos: 8000,
        caletas: 0,
        peajes: 0,
        gExtras: 0,
        anticipo: 0,
        tabuladorBase: 4954,
        art241Lottt: 3185,
        totalFlete: 8139,
    },
    {
        id: 'reg-2',
        idOrdenPadre: 'reg-1',
        fecha: '02/11/2026',
        tipo: 'PLANCHA',
        nroTransporte: '30131548',
        origenDestino: 'VALENCIA.CDA',
        viaticos: 0,
        caletas: 0,
        peajes: 0,
        gExtras: 0,
        anticipo: 0,
        tabuladorBase: 8865,
        art241Lottt: 5699,
        totalFlete: 14564,
    },
    {
        id: 'reg-3',
        fecha: '02/11/2026',
        tipo: 'VIAJE',
        nroTransporte: '703826635',
        origenDestino: 'CDA.YAGUARA',
        viaticos: 12000,
        caletas: 0,
        peajes: 0,
        gExtras: 0,
        anticipo: 12000,
        tabuladorBase: 11349,
        art241Lottt: 7296,
        totalFlete: 18645,
    },
    {
        id: 'reg-4',
        idOrdenPadre: 'reg-3',
        fecha: '02/11/2026',
        tipo: 'PLANCHA',
        nroTransporte: '30131951',
        origenDestino: 'YAGUARA.TURM',
        viaticos: 0,
        caletas: 0,
        peajes: 0,
        gExtras: 0,
        anticipo: 0,
        tabuladorBase: 10123,
        art241Lottt: 6508,
        totalFlete: 16631,
    },
    {
        id: 'reg-5',
        fecha: '03/11/2026',
        tipo: 'VIAJE',
        nroTransporte: '703826912',
        origenDestino: 'TURM.CDA',
        viaticos: 8000,
        caletas: 0,
        peajes: 0,
        gExtras: 0,
        anticipo: 8000,
        tabuladorBase: 7091,
        art241Lottt: 4558,
        totalFlete: 11649,
    },
    {
        id: 'reg-6',
        fecha: '03/11/2026',
        tipo: 'VIAJE',
        nroTransporte: '703826647',
        origenDestino: 'CDA.YAGUARA',
        viaticos: 12000,
        caletas: 0,
        peajes: 0,
        gExtras: 0,
        anticipo: 12000,
        tabuladorBase: 11453,
        art241Lottt: 7363,
        totalFlete: 18816,
    },
    {
        id: 'reg-7',
        idOrdenPadre: 'reg-6',
        fecha: '03/11/2026',
        tipo: 'PLANCHA',
        nroTransporte: '30132522',
        origenDestino: 'YAGUARA.LIMP',
        viaticos: 0,
        caletas: 0,
        peajes: 0,
        gExtras: 0,
        anticipo: 0,
        tabuladorBase: 11301,
        art241Lottt: 7265,
        totalFlete: 18566,
    },
    {
        id: 'reg-8',
        fecha: '04/11/2026',
        tipo: 'VIAJE',
        esEspecial: true,
        nroTransporte: '703826357',
        origenDestino: 'LIMP.PORLAMAR',
        tieneIconoBarco: true,
        viaticos: 182000,
        caletas: 0,
        peajes: 0,
        gExtras: 123159,
        anticipo: 58841.04,
        tabuladorBase: 69810.78,
        art241Lottt: 44877.43,
        totalFlete: 114688.21,
    },
    {
        id: 'reg-9',
        idOrdenPadre: 'reg-8',
        fecha: '04/11/2026',
        tipo: 'PLANCHA',
        nroTransporte: '30133773',
        origenDestino: 'PORLAMAR.LIMP',
        viaticos: 0,
        caletas: 0,
        peajes: 0,
        gExtras: 0,
        anticipo: 0,
        tabuladorBase: 0,
        art241Lottt: 0,
        totalFlete: 0,
    },
    {
        id: 'reg-10',
        fecha: '09/11/2026',
        tipo: 'VIAJE',
        nroTransporte: '703829494',
        origenDestino: 'LIMP.YAGUARA',
        viaticos: 12000,
        caletas: 0,
        peajes: 0,
        gExtras: 0,
        anticipo: 12000,
        tabuladorBase: 11301,
        art241Lottt: 7265,
        totalFlete: 18566,
    },
    {
        id: 'reg-11',
        idOrdenPadre: 'reg-10',
        fecha: '09/11/2026',
        tipo: 'PLANCHA',
        nroTransporte: '30134839',
        origenDestino: 'YAGUARA.LIMP',
        viaticos: 0,
        caletas: 0,
        peajes: 0,
        gExtras: 0,
        anticipo: 0,
        tabuladorBase: 0,
        art241Lottt: 0,
        totalFlete: 0,
    },
    {
        id: 'reg-12',
        fecha: '10/11/2026',
        tipo: 'VIAJE',
        nroTransporte: '9321114475',
        origenDestino: 'TURM.CTE VAL',
        viaticos: 12000,
        caletas: 0,
        peajes: 0,
        gExtras: 0,
        anticipo: 12000,
        tabuladorBase: 0,
        art241Lottt: 0,
        totalFlete: 0,
    },
    {
        id: 'reg-13',
        fecha: '11/11/2026',
        tipo: 'VIAJE',
        nroTransporte: '9321114492',
        origenDestino: 'TURM.CTE CARACAS',
        viaticos: 12000,
        caletas: 0,
        peajes: 0,
        gExtras: 0,
        anticipo: 12000,
        tabuladorBase: 0,
        art241Lottt: 0,
        totalFlete: 0,
    },
    {
        id: 'reg-14',
        fecha: '12/11/2026',
        tipo: 'VIAJE',
        nroTransporte: '9983728296',
        origenDestino: 'CDA.CHIVACOA MP',
        viaticos: 12000,
        caletas: 0,
        peajes: 0,
        gExtras: 0,
        anticipo: 12000,
        tabuladorBase: 0,
        art241Lottt: 0,
        totalFlete: 0,
    },
];

const MESES_CORTOS = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
];

function formatearNumeroVe(valor: number, decimales = 2): string {
    return valor.toLocaleString('es-VE', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
    });
}

function formatearFechaIsoADdMmYyyy(iso: string): string {
    if (!iso) return '02/11/2026';
    const clean = iso.slice(0, 10);
    const partes = clean.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return iso;
}

function formatearRangoPeriodo(fechaInicio?: string, fechaFin?: string): string {
    if (!fechaInicio || !fechaFin) return '01 - 15 Nov 2026';
    const ini = fechaInicio.slice(0, 10).split('-').map(Number);
    const fin = fechaFin.slice(0, 10).split('-').map(Number);
    if (ini.length < 3 || fin.length < 3) return '01 - 15 Nov 2026';
    const diaIni = String(ini[2] || 1).padStart(2, '0');
    const diaFin = String(fin[2] || 15).padStart(2, '0');
    const mes = MESES_CORTOS[(fin[1] || 11) - 1] || 'Nov';
    const anio = fin[0] || 2026;
    return `${diaIni} - ${diaFin} ${mes} ${anio}`;
}

function parseFechaOrdenable(fechaStr: string, rawIso?: string): number {
    if (rawIso) {
        const cleanIso = rawIso.slice(0, 10);
        const partesIso = cleanIso.split('-').map(Number);
        if (partesIso.length === 3 && !partesIso.some(Number.isNaN)) {
            return Date.UTC(partesIso[0], partesIso[1] - 1, partesIso[2]);
        }
        const parsed = Date.parse(rawIso);
        if (!Number.isNaN(parsed)) return parsed;
    }

    const clean = (fechaStr || '').trim();
    if (clean.includes('/')) {
        const partes = clean.split('/').map(Number);
        if (partes.length === 3 && !partes.some(Number.isNaN)) {
            return Date.UTC(partes[2], partes[1] - 1, partes[0]);
        }
    }
    if (clean.includes('-')) {
        const partes = clean.slice(0, 10).split('-').map(Number);
        if (partes.length === 3 && !partes.some(Number.isNaN)) {
            return Date.UTC(partes[0], partes[1] - 1, partes[2]);
        }
    }
    return 0;
}

function extraerOrigenDestinoPartes(origenDestino: string): {
    origen: string;
    destino: string;
} {
    const clean = (origenDestino || '').trim().toUpperCase();
    // Si tiene separador explícito de ruta ("—", "->", "→", " - ", " / ")
    const matchSeparadorRuta = clean.split(/\s*(?:—|–|->|→|\s-\s|\s\/\s)\s*/);
    if (matchSeparadorRuta.length >= 2) {
        return {
            origen: matchSeparadorRuta[0].trim(),
            destino:
                matchSeparadorRuta[matchSeparadorRuta.length - 1].trim(),
        };
    }

    // Si tiene exactamente dos segmentos separados por punto (ej: "CDA.YAGUARA")
    const partesPunto = clean
        .split('.')
        .map((p) => p.trim())
        .filter(Boolean);
    if (partesPunto.length === 2) {
        return {
            origen: partesPunto[0],
            destino: partesPunto[1],
        };
    }

    return {
        origen: clean,
        destino: '',
    };
}

function ordenarRegistrosPorFechaYTipo(
    registros: RegistroLiquidacionViaje[],
): RegistroLiquidacionViaje[] {
    const viajes: RegistroLiquidacionViaje[] = [];
    const planchas: RegistroLiquidacionViaje[] = [];

    for (const r of registros) {
        if (r.tipo === 'PLANCHA') {
            planchas.push(r);
        } else {
            viajes.push(r);
        }
    }

    const compararFecha = (
        a: RegistroLiquidacionViaje,
        b: RegistroLiquidacionViaje,
    ) => {
        const fechaA = parseFechaOrdenable(
            a.fecha,
            a.fechaProgramadaCargaRaw,
        );
        const fechaB = parseFechaOrdenable(
            b.fecha,
            b.fechaProgramadaCargaRaw,
        );
        return fechaA - fechaB;
    };

    viajes.sort(compararFecha);
    planchas.sort(compararFecha);

    const planchasPorPadre = new Map<string, RegistroLiquidacionViaje[]>();
    const planchasAsignadas = new Set<string>();
    const idsPresentes = new Set(registros.map((r) => r.id));

    // 1. Vincular planchas que tienen idOrdenPadre explícito (ej. [RETORNO_DE:uuid] en BD o idOrdenPadre en demo)
    for (const p of planchas) {
        if (p.idOrdenPadre && idsPresentes.has(p.idOrdenPadre)) {
            const lista = planchasPorPadre.get(p.idOrdenPadre) || [];
            lista.push(p);
            planchasPorPadre.set(p.idOrdenPadre, lista);
            planchasAsignadas.add(p.id);
        }
    }

    // 2. Para planchas sin idOrdenPadre explícito, emparejar con el viaje de la misma fecha cuyo destino coincida con el origen de la plancha (o el viaje de esa fecha)
    for (const p of planchas) {
        if (planchasAsignadas.has(p.id)) continue;

        const fechaP = parseFechaOrdenable(p.fecha, p.fechaProgramadaCargaRaw);
        const { origen: origenPlancha } = extraerOrigenDestinoPartes(
            p.origenDestino,
        );

        // Buscar viaje de la misma fecha cuyo destino coincida con el origen de la plancha y que aún no tenga plancha asignada
        let viajePadre = viajes.find((v) => {
            if (
                parseFechaOrdenable(v.fecha, v.fechaProgramadaCargaRaw) !==
                fechaP
            ) {
                return false;
            }
            const { destino: destinoViaje } = extraerOrigenDestinoPartes(
                v.origenDestino,
            );
            return (
                Boolean(origenPlancha) &&
                Boolean(destinoViaje) &&
                origenPlancha === destinoViaje &&
                !(planchasPorPadre.get(v.id)?.length)
            );
        });

        // Si ya tenía una plancha, permitir encadenar al viaje de misma fecha cuyo destino coincida con el origen de la plancha
        if (!viajePadre) {
            viajePadre = viajes.find((v) => {
                if (
                    parseFechaOrdenable(v.fecha, v.fechaProgramadaCargaRaw) !==
                    fechaP
                ) {
                    return false;
                }
                const { destino: destinoViaje } = extraerOrigenDestinoPartes(
                    v.origenDestino,
                );
                return (
                    Boolean(origenPlancha) &&
                    Boolean(destinoViaje) &&
                    origenPlancha === destinoViaje
                );
            });
        }

        // Fallback: cualquier viaje de la misma fecha sin plancha asignada
        if (!viajePadre) {
            viajePadre = viajes.find(
                (v) =>
                    parseFechaOrdenable(v.fecha, v.fechaProgramadaCargaRaw) ===
                    fechaP && !(planchasPorPadre.get(v.id)?.length),
            );
        }

        if (viajePadre) {
            const lista = planchasPorPadre.get(viajePadre.id) || [];
            lista.push(p);
            planchasPorPadre.set(viajePadre.id, lista);
            planchasAsignadas.add(p.id);
        }
    }

    // 3. Construir la lista jerárquica intercalando cada VIAJE seguido inmediatamente de su(s) PLANCHA(s)
    const resultado: RegistroLiquidacionViaje[] = [];

    const agregarHijosPlancha = (idPadre: string) => {
        const hijos = (planchasPorPadre.get(idPadre) || []).slice().sort((a, b) => {
            const esAdicA = (a.observacionesRaw || '').includes(
                '[PLANCHA_ADICIONAL',
            )
                ? 1
                : 0;
            const esAdicB = (b.observacionesRaw || '').includes(
                '[PLANCHA_ADICIONAL',
            )
                ? 1
                : 0;
            if (esAdicA !== esAdicB) return esAdicA - esAdicB;
            return compararFecha(a, b);
        });

        for (const h of hijos) {
            resultado.push(h);
            // Si hay una sub-plancha encadenada a esta plancha, agregarla debajo
            if (planchasPorPadre.has(h.id)) {
                agregarHijosPlancha(h.id);
            }
        }
    };

    const planchasSueltas = planchas.filter((p) => !planchasAsignadas.has(p.id));
    let idxSuelta = 0;

    for (const v of viajes) {
        const fechaV = parseFechaOrdenable(v.fecha, v.fechaProgramadaCargaRaw);
        while (
            idxSuelta < planchasSueltas.length &&
            parseFechaOrdenable(
                planchasSueltas[idxSuelta].fecha,
                planchasSueltas[idxSuelta].fechaProgramadaCargaRaw,
            ) < fechaV
        ) {
            resultado.push(planchasSueltas[idxSuelta]);
            idxSuelta++;
        }

        resultado.push(v);
        agregarHijosPlancha(v.id);
    }

    while (idxSuelta < planchasSueltas.length) {
        resultado.push(planchasSueltas[idxSuelta]);
        idxSuelta++;
    }

    return resultado;
}

function transformarGuiasARegistros(
    guias: GuiaProgramada[],
    tasaBcv: number,
): RegistroLiquidacionViaje[] {
    const lista = guias.map((g, idx) => {
        const nro = (g.nroTransporte || `703826${300 + idx}`).trim();
        const obsRaw = g.observaciones || '';
        const obsTrimmed = obsRaw.trimStart();
        const obsLower = obsRaw.toLowerCase();

        const esRetornoTag = obsTrimmed.startsWith('[RETORNO_DE:');
        const matchPadre = esRetornoTag
            ? obsTrimmed.match(/^\[RETORNO_DE:([a-zA-Z0-9-]+)\]/)
            : null;
        const idOrdenPadre =
            matchPadre && matchPadre[1] ? matchPadre[1] : null;

        const esPlancha =
            esRetornoTag ||
            nro.startsWith('30') ||
            obsLower.includes('plancha') ||
            obsLower.includes('retorno');

        const etiquetaOrigen = (
            g.puntoOrigen?.nombreSede ||
            g.puntoOrigen?.codigoPuntoc ||
            g.puntoOrigen?.ciudad ||
            g.idPuntoOrigen ||
            'CDA'
        )
            .trim()
            .toUpperCase();
        const etiquetaDestino = (
            g.puntoDestino?.nombreSede ||
            g.puntoDestino?.codigoPuntoc ||
            g.puntoDestino?.ciudad ||
            g.idPuntoDestino ||
            'YAGUARA'
        )
            .trim()
            .toUpperCase();

        // En las planchas solo colocar puntoOrigen -> puntoDestino de la tabla guias_viajes (no el nombre de la ruta)
        const origenDestino = esPlancha
            ? `${etiquetaOrigen} → ${etiquetaDestino}`
            : g.ruta?.nombreRuta
                ? g.ruta.nombreRuta.toUpperCase()
                : `${etiquetaOrigen} → ${etiquetaDestino}`;

        const tieneBarco =
            origenDestino.includes('PORLAMAR') ||
            origenDestino.includes('MARGARITA');

        const anticipoBs = Number(g.montoAnticipoConductor) || 0;

        let peajesBs = 0;
        let caletasBs = 0;
        let extrasBs = 0;
        for (const rec of g.guiasViajesRecargos ?? []) {
            if (rec.estado === 'Rechazado') continue;
            const concepto = (
                rec.recargo?.concepto ||
                rec.observaciones ||
                ''
            ).toLowerCase();
            const monedaRec = (
                rec.recargo?.moneda ||
                g.moneda ||
                'Bs'
            ).toUpperCase();
            const montoNum = Number(rec.monto) || 0;
            const montoBs = monedaRec === 'USD' ? montoNum * tasaBcv : montoNum;

            if (concepto.includes('peaje')) {
                peajesBs += montoBs;
            } else if (concepto.includes('caleta')) {
                caletasBs += montoBs;
            } else {
                extrasBs += montoBs;
            }
        }

        const fleteRaw =
            g.montoFleteCliente !== null &&
                g.montoFleteCliente !== undefined &&
                Number(g.montoFleteCliente) > 0
                ? Number(g.montoFleteCliente)
                : Number(g.ruta?.montoTarifa || 0);
        const monFlete = (
            g.moneda ||
            g.ruta?.moneda ||
            'USD'
        ).toUpperCase();
        const fleteBsTotal =
            monFlete === 'USD' ? fleteRaw * tasaBcv : fleteRaw;

        // Remuneración conductor (~11.5% flete total distribuido en Tabulador Base 60.87% y Art. 241 LOTTT 39.13%)
        const totalFleteCond = Number((fleteBsTotal * 0.115).toFixed(2));
        const tabuladorBase = Number((totalFleteCond * 0.6087).toFixed(2));
        const art241Lottt = Number((totalFleteCond - tabuladorBase).toFixed(2));

        const viaticos = esPlancha ? 0 : anticipoBs + extrasBs;

        return {
            id: g.idOrden || `reg-${idx}`,
            idOrdenPadre,
            observacionesRaw: obsRaw,
            fecha: formatearFechaIsoADdMmYyyy(g.fechaProgramadaCarga),
            fechaProgramadaCargaRaw: g.fechaProgramadaCarga,
            tipo: (esPlancha ? 'PLANCHA' : 'VIAJE') as 'VIAJE' | 'PLANCHA',
            esEspecial: tieneBarco,
            nroTransporte: nro,
            origenDestino,
            tieneIconoBarco: tieneBarco,
            viaticos,
            caletas: caletasBs,
            peajes: peajesBs,
            gExtras: extrasBs,
            anticipo: anticipoBs,
            tabuladorBase,
            art241Lottt,
            totalFlete: totalFleteCond,
        };
    });

    return ordenarRegistrosPorFechaYTipo(lista);
}

export default function NominaConductor() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams<{ idConductor?: string }>();

    const stateData = (location.state as ConductorNominaState | null) ?? null;

    const [monedaVista, setMonedaVista] = useState<'BS' | 'USD'>('BS');
    const [tabFiltro, setTabFiltro] = useState<'TODOS' | 'VIAJES' | 'PLANCHAS'>(
        'TODOS',
    );
    const [busquedaRutaGuia, setBusquedaRutaGuia] = useState<string>('');
    const [tasaBcv, setTasaBcv] = useState<number>(
        stateData?.tasaBcv || TASA_BCV_DEFECTO,
    );
    const [cargando, setCargando] = useState<boolean>(false);
    const [registrosReales, setRegistrosReales] = useState<
        RegistroLiquidacionViaje[] | null
    >(null);
    const [infoConductorBd, setInfoConductorBd] = useState<{
        nombre?: string;
        cedula?: string;
        telefono?: string;
        chutoMarcaModelo?: string;
        chutoPlaca?: string;
        foto?: string | null;
    } | null>(null);
    const [mensajeAccion, setMensajeAccion] = useState<string | null>(null);
    const [transporteCopiadoId, setTransporteCopiadoId] = useState<
        string | null
    >(null);

    const handleCopiarTransporte = async (
        idRegistro: string,
        nroTransporte: string,
    ) => {
        try {
            await navigator.clipboard.writeText(nroTransporte);
            setTransporteCopiadoId(idRegistro);
            setTimeout(() => {
                setTransporteCopiadoId((prev) =>
                    prev === idRegistro ? null : prev,
                );
            }, 1800);
        } catch {
            // Silencioso si el navegador bloquea clipboard
        }
    };

    const idConductorObjetivo =
        params.idConductor || stateData?.idConductor || '';

    useEffect(() => {
        let cancelado = false;

        const cargarDatos = async () => {
            try {
                const tasaRes = await nominasProcesosService.obtenerTasaBcv();
                if (
                    !cancelado &&
                    tasaRes &&
                    Number(tasaRes.tasa) > 0 &&
                    !stateData?.tasaBcv
                ) {
                    setTasaBcv(Number(tasaRes.tasa));
                }
            } catch {
                // Mantiene tasa por defecto
            }

            if (!idConductorObjetivo) return;

            setCargando(true);
            try {
                const fechaInicio = stateData?.proceso?.fechaInicioP?.slice(
                    0,
                    10,
                );
                const fechaFin = stateData?.proceso?.fechaFinP?.slice(0, 10);

                let guias = await programacionService.getGuiasProgramadas({
                    ...(fechaInicio ? { fechaInicio } : {}),
                    ...(fechaFin ? { fechaFin } : {}),
                    estadoOrden: 'todos',
                });

                let guiasConductor = (guias || []).filter(
                    (g) =>
                        g.idConductor === idConductorObjetivo &&
                        String(g.estadoOrden || '').toLowerCase() !==
                        'cancelado',
                );

                if (guiasConductor.length === 0) {
                    const todas = await programacionService.getGuiasProgramadas({
                        estadoOrden: 'todos',
                    });
                    guiasConductor = (todas || []).filter(
                        (g) =>
                            g.idConductor === idConductorObjetivo &&
                            String(g.estadoOrden || '').toLowerCase() !==
                            'cancelado',
                    );
                }

                if (cancelado) return;

                if (guiasConductor.length > 0) {
                    const primerViaje = guiasConductor[0];
                    const cond = primerViaje.conductor;
                    const veh =
                        primerViaje.vehiculoMotriz || cond?.vehiculoHabitual;

                    if (cond) {
                        setInfoConductorBd({
                            nombre: `${cond.nombres || ''} ${cond.apellidos || ''}`.trim(),
                            cedula: cond.cedulaIdentidad || undefined,
                            telefono: cond.telefono || undefined,
                            chutoMarcaModelo: veh
                                ? `${veh.marca || 'Mack'} ${veh.modelo || 'Vision'}`.trim()
                                : undefined,
                            chutoPlaca: veh?.placa || undefined,
                            foto: cond.foto,
                        });
                    }

                    const registros = transformarGuiasARegistros(
                        guiasConductor,
                        stateData?.tasaBcv || TASA_BCV_DEFECTO,
                    );
                    setRegistrosReales(registros);
                }
            } catch {
                // Usa datos demo si falla la consulta
            } finally {
                if (!cancelado) {
                    setCargando(false);
                }
            }
        };

        void cargarDatos();

        return () => {
            cancelado = true;
        };
    }, [
        idConductorObjetivo,
        stateData?.proceso?.fechaInicioP,
        stateData?.proceso?.fechaFinP,
        stateData?.tasaBcv,
    ]);

    // Datos de cabecera del conductor (prioriza BD / state, con fallback al diseño de Roberto Méndez)
    const nombreConductor =
        infoConductorBd?.nombre || stateData?.nombre || 'Roberto Méndez';
    const cedulaConductor =
        infoConductorBd?.cedula || stateData?.cedula || 'V-19.845.221';
    const telefonoConductor =
        infoConductorBd?.telefono || stateData?.telefono || '+58 414-9482910';

    // Extraer nombre de unidad y placa si viene del listado (ej. "MACK #04" o "MACK (A27BF8D)")
    const { unidadNombre, unidadPlaca } = useMemo(() => {
        if (infoConductorBd?.chutoMarcaModelo) {
            return {
                unidadNombre: infoConductorBd.chutoMarcaModelo,
                unidadPlaca: infoConductorBd.chutoPlaca || 'A27BF8D',
            };
        }
        const raw = stateData?.chutoMarcaModelo || '';
        if (raw && raw !== 'SIN UNIDAD') {
            const matchPlaca = raw.match(/\(([^)]+)\)/);
            if (matchPlaca) {
                const limpio = raw.replace(/\([^)]+\)/, '').trim();
                return {
                    unidadNombre: limpio || 'Mack Vision #04',
                    unidadPlaca: matchPlaca[1],
                };
            }
            if (raw.toUpperCase().includes('MACK #04')) {
                return {
                    unidadNombre: 'Mack Vision #04',
                    unidadPlaca: stateData?.chutoPlaca || 'A27BF8D',
                };
            }
            return {
                unidadNombre: raw,
                unidadPlaca: stateData?.chutoPlaca || 'A27BF8D',
            };
        }
        return {
            unidadNombre: 'Mack Vision #04',
            unidadPlaca: stateData?.chutoPlaca || 'A27BF8D',
        };
    }, [infoConductorBd, stateData]);

    const registrosBase = useMemo(() => {
        if (registrosReales && registrosReales.length > 0) {
            return ordenarRegistrosPorFechaYTipo(registrosReales);
        }
        return ordenarRegistrosPorFechaYTipo(REGISTROS_DEMO_ROBERTO);
    }, [registrosReales]);

    const conteoViajes = useMemo(
        () => registrosBase.filter((r) => r.tipo === 'VIAJE').length,
        [registrosBase],
    );
    const conteoPlanchas = useMemo(
        () => registrosBase.filter((r) => r.tipo === 'PLANCHA').length,
        [registrosBase],
    );

    const esDemoRoberto = !registrosReales || registrosReales.length === 0;
    const badgeTodosCount = esDemoRoberto ? 18 : registrosBase.length;
    const badgeViajesCount = esDemoRoberto ? 8 : conteoViajes;
    const badgePlanchasCount = esDemoRoberto ? 10 : conteoPlanchas;

    const registrosFiltrados = useMemo(() => {
        const q = busquedaRutaGuia.trim().toLowerCase();
        return registrosBase.filter((item) => {
            if (tabFiltro === 'VIAJES' && item.tipo !== 'VIAJE') return false;
            if (tabFiltro === 'PLANCHAS' && item.tipo !== 'PLANCHA')
                return false;
            if (
                q &&
                !item.nroTransporte.toLowerCase().includes(q) &&
                !item.origenDestino.toLowerCase().includes(q) &&
                !item.fecha.toLowerCase().includes(q)
            ) {
                return false;
            }
            return true;
        });
    }, [registrosBase, tabFiltro, busquedaRutaGuia]);

    // Conversor según el switch Bs. Soberanos / $ USD
    const convertirSegunVista = (montoBs: number): number => {
        if (monedaVista === 'USD') {
            return tasaBcv > 0 ? montoBs / tasaBcv : montoBs;
        }
        return montoBs;
    };

    const prefijoMoneda = monedaVista === 'USD' ? '$ ' : 'Bs. ';

    // Totales de las filas visibles
    const totalesTabla = useMemo(() => {
        if (
            esDemoRoberto &&
            tabFiltro === 'TODOS' &&
            !busquedaRutaGuia.trim()
        ) {
            return {
                viaticos: 258000.0,
                caletas: 0.0,
                peajes: 0.0,
                gExtras: 123159.0,
                anticipo: 164341.04,
                tabuladorBase: 146247.78,
                art241Lottt: 94016.43,
                totalFlete: 240264.21,
            };
        }

        return registrosFiltrados.reduce(
            (acc, r) => ({
                viaticos: acc.viaticos + r.viaticos,
                caletas: acc.caletas + r.caletas,
                peajes: acc.peajes + r.peajes,
                gExtras: acc.gExtras + r.gExtras,
                anticipo: acc.anticipo + r.anticipo,
                tabuladorBase: acc.tabuladorBase + r.tabuladorBase,
                art241Lottt: acc.art241Lottt + r.art241Lottt,
                totalFlete: acc.totalFlete + r.totalFlete,
            }),
            {
                viaticos: 0,
                caletas: 0,
                peajes: 0,
                gExtras: 0,
                anticipo: 0,
                tabuladorBase: 0,
                art241Lottt: 0,
                totalFlete: 0,
            },
        );
    }, [esDemoRoberto, tabFiltro, busquedaRutaGuia, registrosFiltrados]);

    // Cálculos de las 4 tarjetas inferiores
    const resumenInferior = useMemo(() => {
        if (esDemoRoberto) {
            return {
                diasTrabajadosRuta: 11,
                diasDescansoFeriados: 4,
                descansosTrabajados: 0,
                promedioSalarialDiarioBs: 13295.25,
                promedioSalarialDiarioUsd: 365.05,
                totalFleteTabuladorBs: 146247.78,
                descansoFeriadoLegalBs: 53181.01,
                descansoTrabajadoBs: 0.0,
                totalArt241LotttBs: 94016.43,
                subTotalIngresosBrutosBs: 293445.23,
                subTotalIngresosBrutosUsd: 8057.25,
                anticiposNominaBs: 164341.04,
                retencionIsrlBs: 5125.32,
                seguroSocialIvssBs: 16.25,
                aporteHabitacionalLphBs: 1994.29,
                subTotalDeduccionesBs: 171476.9,
                subTotalDeduccionesUsd: 4708.31,
                totalNetoCobrarBs: 27951.9,
                totalNetoCobrarUsd: 767.48,
                fondoReservaArt241Bs: 94016.43,
            };
        }

        const diasTrabajadosRuta = Math.max(
            1,
            new Set(registrosBase.map((r) => r.fecha)).size,
        );
        const diasDescansoFeriados = 4;
        const descansosTrabajados = 0;

        const totalFleteTabuladorBs = totalesTabla.tabuladorBase;
        const promedioSalarialDiarioBs =
            diasTrabajadosRuta > 0
                ? totalFleteTabuladorBs / diasTrabajadosRuta
                : 0;
        const promedioSalarialDiarioUsd =
            tasaBcv > 0 ? promedioSalarialDiarioBs / tasaBcv : 0;

        const descansoFeriadoLegalBs =
            promedioSalarialDiarioBs * diasDescansoFeriados;
        const descansoTrabajadoBs = 0;
        const totalArt241LotttBs = totalesTabla.art241Lottt;

        const subTotalIngresosBrutosBs =
            totalFleteTabuladorBs +
            descansoFeriadoLegalBs +
            descansoTrabajadoBs +
            totalArt241LotttBs;
        const subTotalIngresosBrutosUsd =
            tasaBcv > 0 ? subTotalIngresosBrutosBs / tasaBcv : 0;

        const anticiposNominaBs = totalesTabla.anticipo;
        const retencionIsrlBs = totalFleteTabuladorBs * 0.035;
        const seguroSocialIvssBs = 16.25;
        const aporteHabitacionalLphBs = subTotalIngresosBrutosBs * 0.0068;

        const subTotalDeduccionesBs =
            anticiposNominaBs +
            retencionIsrlBs +
            seguroSocialIvssBs +
            aporteHabitacionalLphBs;
        const subTotalDeduccionesUsd =
            tasaBcv > 0 ? subTotalDeduccionesBs / tasaBcv : 0;

        const totalNetoCobrarBs = Math.max(
            0,
            subTotalIngresosBrutosBs -
            totalArt241LotttBs -
            subTotalDeduccionesBs,
        );
        const totalNetoCobrarUsd =
            tasaBcv > 0 ? totalNetoCobrarBs / tasaBcv : 0;

        return {
            diasTrabajadosRuta,
            diasDescansoFeriados,
            descansosTrabajados,
            promedioSalarialDiarioBs,
            promedioSalarialDiarioUsd,
            totalFleteTabuladorBs,
            descansoFeriadoLegalBs,
            descansoTrabajadoBs,
            totalArt241LotttBs,
            subTotalIngresosBrutosBs,
            subTotalIngresosBrutosUsd,
            anticiposNominaBs,
            retencionIsrlBs,
            seguroSocialIvssBs,
            aporteHabitacionalLphBs,
            subTotalDeduccionesBs,
            subTotalDeduccionesUsd,
            totalNetoCobrarBs,
            totalNetoCobrarUsd,
            fondoReservaArt241Bs: totalArt241LotttBs,
        };
    }, [esDemoRoberto, registrosBase, totalesTabla, tasaBcv]);

    const dispararAviso = (texto: string) => {
        setMensajeAccion(texto);
        setTimeout(() => {
            setMensajeAccion(null);
        }, 3000);
    };

    const textoPeriodo = formatearRangoPeriodo(
        stateData?.proceso?.fechaInicioP,
        stateData?.proceso?.fechaFinP,
    );

    return (
        <div className="min-h-full space-y-4 text-slate-800 pb-6">
            {/* Notificación flotante de acción */}
            {mensajeAccion && (
                <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{mensajeAccion}</span>
                </div>
            )}

            {/* 1. BARRA SUPERIOR: BREADCRUMB + PERÍODO Y TASA REF */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <button
                        type="button"
                        onClick={() => navigate('/nominas/procesos')}
                        className="hover:text-slate-800 transition cursor-pointer"
                    >
                        Nómina
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <button
                        type="button"
                        onClick={() => navigate('/nominas/procesos')}
                        className="hover:text-slate-800 transition cursor-pointer"
                    >
                        Liquidación de Fletes
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-orange-600">
                        Detalle Conductor
                    </span>
                </nav>

                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-xs">
                        <Calendar className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-slate-500 font-medium">
                            PERÍODO:
                        </span>
                        <span className="font-bold text-slate-800">
                            {textoPeriodo}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            Quincena 21
                        </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-xs">
                        <span className="text-slate-500 font-medium">
                            Tasa Ref:
                        </span>
                        <span className="font-extrabold text-emerald-700 font-mono">
                            {formatearNumeroVe(tasaBcv, 2)} Bs/$
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. TARJETA PERFIL DEL CONDUCTOR Y CONTROLES */}
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs px-5 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {/* Foto Avatar del Conductor con check verde */}
                    <div className="relative shrink-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-xs bg-slate-200 flex items-center justify-center">
                            {infoConductorBd?.foto || stateData?.foto ? (
                                <img
                                    src={
                                        (infoConductorBd?.foto ||
                                            stateData?.foto) ??
                                        ''
                                    }
                                    alt={nombreConductor}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <img
                                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80"
                                    alt={nombreConductor}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-2xs">
                            <CheckCircle2 className="w-3 h-3" />
                        </span>
                    </div>

                    {/* Nombre, Estado y Metadata */}
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                                {nombreConductor}
                            </h1>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                ACTIVO AUDITADO
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-slate-500 mt-1.5">
                            <div className="inline-flex items-center gap-1.5">
                                <IdCard className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-bold text-slate-700">
                                    C.I.
                                </span>
                                <span className="font-mono">
                                    {cedulaConductor}
                                </span>
                            </div>

                            <span className="text-slate-300">•</span>

                            <div className="inline-flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-mono">
                                    {telefonoConductor}
                                </span>
                            </div>

                            <span className="text-slate-300">•</span>

                            <div className="inline-flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-amber-600" />
                                <span className="font-semibold text-slate-700">
                                    {unidadNombre}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-mono text-[10px] font-bold">
                                    {unidadPlaca}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Switch Moneda + Botones de Acción */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Selector Moneda */}
                    <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80">
                        <button
                            type="button"
                            onClick={() => setMonedaVista('BS')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${monedaVista === 'BS'
                                    ? 'bg-white text-orange-600 shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            Bs. Soberanos
                        </button>
                        <button
                            type="button"
                            onClick={() => setMonedaVista('USD')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${monedaVista === 'USD'
                                    ? 'bg-white text-emerald-700 shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            $ USD (@{formatearNumeroVe(tasaBcv, 2)})
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            dispararAviso(
                                `Exportando relación de ${nombreConductor} a Excel...`,
                            )
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Excel</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
                    >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Imprimir</span>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            dispararAviso(
                                `Recibo digital enviado a ${nombreConductor}`,
                            )
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-extrabold shadow-sm shadow-orange-500/20 transition cursor-pointer"
                    >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Recibo Chofer</span>
                    </button>
                </div>
            </section>

            {/* 3. CONTENEDOR PRINCIPAL DE TABLA Y FILTROS */}
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {/* Barra de Pestañas y Buscador */}
                <div className="px-4 py-3 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setTabFiltro('TODOS')}
                            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${tabFiltro === 'TODOS'
                                    ? 'bg-white text-slate-900 border border-slate-200/90 shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                                }`}
                        >
                            <span>Todos los Registros</span>
                            <span
                                className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${tabFiltro === 'TODOS'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-slate-200/70 text-slate-600'
                                    }`}
                            >
                                {badgeTodosCount}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setTabFiltro('VIAJES')}
                            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${tabFiltro === 'VIAJES'
                                    ? 'bg-white text-slate-900 border border-slate-200/90 shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                                }`}
                        >
                            <span>Viajes Flete</span>
                            <span
                                className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${tabFiltro === 'VIAJES'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-slate-200/70 text-slate-600'
                                    }`}
                            >
                                {badgeViajesCount}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setTabFiltro('PLANCHAS')}
                            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${tabFiltro === 'PLANCHAS'
                                    ? 'bg-white text-slate-900 border border-slate-200/90 shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                                }`}
                        >
                            <span>Planchas Retorno</span>
                            <span
                                className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${tabFiltro === 'PLANCHAS'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-slate-200/70 text-slate-600'
                                    }`}
                            >
                                {badgePlanchasCount}
                            </span>
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <ListFilter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={busquedaRutaGuia}
                                onChange={(e) =>
                                    setBusquedaRutaGuia(e.target.value)
                                }
                                placeholder="Filtrar por ruta o guía..."
                                className="w-52 sm:w-60 pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                            />
                        </div>

                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>100% Conciliado con Manifiestos</span>
                        </div>
                    </div>
                </div>

                {/* Tabla de Bloques 01 - 04 */}
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1050px]">
                        <thead>
                            {/* Encabezado de Bloques */}
                            <tr className="text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-200/90 bg-slate-50/80">
                                <th
                                    colSpan={4}
                                    className="py-1.5 px-3 text-slate-600 border-r border-slate-200/70"
                                >
                                    <div className="inline-flex items-center gap-1.5">
                                        <ArrowUpDown className="w-3.5 h-3.5 text-sky-600" />
                                        <span>
                                            BLOQUE 01: IDENTIFICACIÓN Y DESPACHO
                                            LOGÍSTICO
                                        </span>
                                    </div>
                                </th>

                                <th
                                    colSpan={4}
                                    className="py-1.5 px-3 text-center text-slate-600 bg-slate-100/60 border-r border-slate-200/70"
                                >
                                    <div className="inline-flex items-center justify-center gap-1.5">
                                        <Receipt className="w-3.5 h-3.5 text-amber-600" />
                                        <span>
                                            BLOQUE 02: REEMBOLSOS &amp; GASTOS
                                            OPERATIVOS
                                        </span>
                                    </div>
                                </th>

                                <th
                                    colSpan={1}
                                    className="py-1.5 px-3 text-center text-slate-700 bg-slate-100/90 border-r border-slate-200/70"
                                >
                                    <div className="inline-flex items-center justify-center gap-1.5">
                                        <Wallet className="w-3.5 h-3.5 text-slate-700" />
                                        <span>BLOQUE 03: ANTICIPOS</span>
                                    </div>
                                </th>

                                <th
                                    colSpan={3}
                                    className="py-1.5 px-3 text-center text-emerald-900 bg-emerald-50/70"
                                >
                                    <div className="inline-flex items-center justify-center gap-1.5">
                                        <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                                        <span>
                                            BLOQUE 04: REMUNERACIÓN BASE Y LEY
                                            LOTTT
                                        </span>
                                    </div>
                                </th>
                            </tr>

                            {/* Encabezado de Columnas */}
                            <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-white">
                                <th className="py-1.5 px-3">FECHA</th>
                                <th className="py-1.5 px-2">TIPO</th>
                                <th className="py-1.5 px-2">Nº TRANSPORTE</th>
                                <th className="py-1.5 px-3 border-r border-slate-200/70">
                                    ORIGEN → DESTINO
                                </th>

                                <th className="py-1.5 px-2.5 text-right bg-slate-50/60">
                                    VIÁTICOS
                                </th>
                                <th className="py-1.5 px-2.5 text-right bg-slate-50/60">
                                    CALETAS
                                </th>
                                <th className="py-1.5 px-2.5 text-right bg-slate-50/60">
                                    PEAJES
                                </th>
                                <th className="py-1.5 px-2.5 text-right bg-slate-50/60 border-r border-slate-200/70">
                                    G. EXTRAS
                                </th>

                                <th className="py-1.5 px-3 text-right bg-slate-100/50 text-slate-700 border-r border-slate-200/70">
                                    ANTICIPO
                                </th>

                                <th className="py-1.5 px-3 text-right bg-emerald-50/40 text-emerald-800">
                                    TABULADOR BASE
                                </th>
                                <th className="py-1.5 px-3 text-right bg-emerald-100/50 text-emerald-800">
                                    ART. 241 LOTTT
                                </th>
                                <th className="py-1.5 px-3 text-right font-extrabold text-slate-800">
                                    TOTAL FLETE
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 text-xs font-mono">
                            {cargando ? (
                                <tr>
                                    <td
                                        colSpan={12}
                                        className="py-10 text-center text-slate-400 font-sans"
                                    >
                                        <div className="inline-flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                            <span>
                                                Cargando registros de viajes y
                                                planchas del conductor...
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : registrosFiltrados.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={12}
                                        className="py-10 text-center text-slate-400 font-sans"
                                    >
                                        No hay registros que coincidan con el
                                        filtro seleccionado.
                                    </td>
                                </tr>
                            ) : (
                                registrosFiltrados.map((reg) => {
                                    const viaticosVal = convertirSegunVista(
                                        reg.viaticos,
                                    );
                                    const caletasVal = convertirSegunVista(
                                        reg.caletas,
                                    );
                                    const peajesVal = convertirSegunVista(
                                        reg.peajes,
                                    );
                                    const gExtrasVal = convertirSegunVista(
                                        reg.gExtras,
                                    );
                                    const anticipoVal = convertirSegunVista(
                                        reg.anticipo,
                                    );
                                    const tabuladorVal = convertirSegunVista(
                                        reg.tabuladorBase,
                                    );
                                    const art241Val = convertirSegunVista(
                                        reg.art241Lottt,
                                    );
                                    const totalFleteVal = convertirSegunVista(
                                        reg.totalFlete,
                                    );

                                    return (
                                        <tr
                                            key={reg.id}
                                            className={`transition-colors ${reg.esEspecial
                                                    ? 'bg-orange-50/30 hover:bg-orange-50/60 font-bold'
                                                    : 'hover:bg-slate-50/80'
                                                }`}
                                        >
                                            {/* Fecha */}
                                            <td className="py-1 px-3 text-slate-700 font-semibold">
                                                {reg.fecha}
                                            </td>

                                            {/* Tipo: VIAJE / PLANCHA */}
                                            <td className="py-1 px-2 font-sans">
                                                {reg.tipo === 'VIAJE' ? (
                                                    <span
                                                        className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-extrabold tracking-wide ${reg.esEspecial
                                                                ? 'bg-amber-700 text-white shadow-2xs'
                                                                : 'bg-orange-50 text-orange-700 border border-orange-200/80'
                                                            }`}
                                                    >
                                                        VIAJE
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-extrabold tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                                                        PLANCHA
                                                    </span>
                                                )}
                                            </td>

                                            {/* Nº Transporte */}
                                            <td
                                                className={`py-1 px-2 font-bold ${reg.esEspecial
                                                        ? 'text-amber-800'
                                                        : 'text-slate-700'
                                                    }`}
                                            >
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleCopiarTransporte(
                                                                reg.id,
                                                                reg.nroTransporte,
                                                            )
                                                        }
                                                        title={`Copiar Nº Transporte ${reg.nroTransporte}`}
                                                        className="p-0.5 rounded hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                                    >
                                                        {transporteCopiadoId ===
                                                            reg.id ? (
                                                            <Check className="w-3 h-3 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                    <span>
                                                        {reg.nroTransporte}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Origen -> Destino */}
                                            <td className="py-1 px-3 font-sans border-r border-slate-200/70">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <span
                                                        className={
                                                            reg.esEspecial
                                                                ? 'font-extrabold text-slate-900'
                                                                : 'font-semibold text-slate-700'
                                                        }
                                                    >
                                                        {reg.origenDestino}
                                                    </span>
                                                    {reg.tieneIconoBarco && (
                                                        <Ship className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                                    )}
                                                </div>
                                            </td>

                                            {/* Viáticos */}
                                            <td
                                                className={`py-1 px-2.5 text-right bg-slate-50/40 ${reg.viaticos > 0
                                                        ? 'font-bold text-slate-800'
                                                        : 'text-slate-300'
                                                    }`}
                                            >
                                                {formatearNumeroVe(viaticosVal)}
                                            </td>

                                            {/* Caletas */}
                                            <td
                                                className={`py-1 px-2.5 text-right bg-slate-50/40 ${reg.caletas > 0
                                                        ? 'font-bold text-slate-800'
                                                        : 'text-slate-300'
                                                    }`}
                                            >
                                                {formatearNumeroVe(caletasVal)}
                                            </td>

                                            {/* Peajes */}
                                            <td
                                                className={`py-1 px-2.5 text-right bg-slate-50/40 ${reg.peajes > 0
                                                        ? 'font-bold text-slate-800'
                                                        : 'text-slate-300'
                                                    }`}
                                            >
                                                {formatearNumeroVe(peajesVal)}
                                            </td>

                                            {/* G. Extras */}
                                            <td
                                                className={`py-1 px-2.5 text-right bg-slate-50/40 border-r border-slate-200/70 ${reg.gExtras > 0
                                                        ? 'font-extrabold text-amber-800'
                                                        : 'text-slate-300'
                                                    }`}
                                            >
                                                {formatearNumeroVe(gExtrasVal)}
                                            </td>

                                            {/* Anticipo */}
                                            <td
                                                className={`py-1 px-3 text-right bg-slate-100/45 border-r border-slate-200/70 ${reg.anticipo > 0
                                                        ? 'font-extrabold text-amber-800'
                                                        : 'font-bold text-slate-700'
                                                    }`}
                                            >
                                                {formatearNumeroVe(anticipoVal)}
                                            </td>

                                            {/* Tabulador Base */}
                                            <td
                                                className={`py-1 px-3 text-right bg-emerald-50/35 ${reg.tabuladorBase > 0
                                                        ? 'font-bold text-slate-800'
                                                        : 'text-slate-300'
                                                    }`}
                                            >
                                                {formatearNumeroVe(
                                                    tabuladorVal,
                                                )}
                                            </td>

                                            {/* Art. 241 LOTTT */}
                                            <td
                                                className={`py-1 px-3 text-right bg-emerald-100/45 ${reg.art241Lottt > 0
                                                        ? 'font-extrabold text-emerald-700'
                                                        : 'text-slate-300'
                                                    }`}
                                            >
                                                {formatearNumeroVe(art241Val)}
                                            </td>

                                            {/* Total Flete */}
                                            <td
                                                className={`py-1 px-3 text-right ${reg.totalFlete > 0
                                                        ? 'font-extrabold text-slate-900'
                                                        : 'text-slate-300'
                                                    }`}
                                            >
                                                {formatearNumeroVe(
                                                    totalFleteVal,
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>

                        {/* Fila Totales Brutos Registrados */}
                        <tfoot>
                            <tr className="bg-slate-50 border-t-2 border-slate-200 text-xs font-mono font-extrabold text-slate-900">
                                <td
                                    colSpan={4}
                                    className="py-2 px-3 font-sans text-[11px] font-extrabold uppercase tracking-wide text-slate-800 border-r border-slate-200/70"
                                >
                                    TOTALES BRUTOS REGISTRADOS (
                                    {registrosFiltrados.length} REGISTROS
                                    VISIBLES)
                                </td>

                                <td className="py-2 px-2.5 text-right bg-sky-50/50 text-slate-900">
                                    {formatearNumeroVe(
                                        convertirSegunVista(
                                            totalesTabla.viaticos,
                                        ),
                                    )}
                                </td>
                                <td className="py-2 px-2.5 text-right bg-sky-50/50 text-slate-400">
                                    {formatearNumeroVe(
                                        convertirSegunVista(
                                            totalesTabla.caletas,
                                        ),
                                    )}
                                </td>
                                <td className="py-2 px-2.5 text-right bg-sky-50/50 text-slate-400">
                                    {formatearNumeroVe(
                                        convertirSegunVista(
                                            totalesTabla.peajes,
                                        ),
                                    )}
                                </td>
                                <td className="py-2 px-2.5 text-right bg-sky-50/50 text-amber-800 border-r border-slate-200/70">
                                    {formatearNumeroVe(
                                        convertirSegunVista(
                                            totalesTabla.gExtras,
                                        ),
                                    )}
                                </td>

                                <td className="py-2 px-3 text-right bg-slate-200/60 text-amber-900 border-r border-slate-200/70">
                                    {formatearNumeroVe(
                                        convertirSegunVista(
                                            totalesTabla.anticipo,
                                        ),
                                    )}
                                </td>

                                <td className="py-2 px-3 text-right bg-emerald-100/50 text-slate-900">
                                    {formatearNumeroVe(
                                        convertirSegunVista(
                                            totalesTabla.tabuladorBase,
                                        ),
                                    )}
                                </td>
                                <td className="py-2 px-3 text-right bg-emerald-200/60 text-emerald-800">
                                    {formatearNumeroVe(
                                        convertirSegunVista(
                                            totalesTabla.art241Lottt,
                                        ),
                                    )}
                                </td>
                                <td className="py-2 px-3 text-right bg-slate-100 text-slate-900">
                                    {formatearNumeroVe(
                                        convertirSegunVista(
                                            totalesTabla.totalFlete,
                                        ),
                                    )}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </section>

            {/* 4. SECCIÓN INFERIOR: 4 TARJETAS DE LIQUIDACIÓN */}
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
                {/* TARJETA 1: JORNADA Y DÍAS */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-extrabold text-slate-900">
                                    Jornada y Días
                                </h3>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/70 text-[10px] font-extrabold uppercase">
                                LOTTT VIGENTE
                            </span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Días Trabajados en Ruta:
                                </span>
                                <span className="font-mono font-extrabold text-slate-900">
                                    {resumenInferior.diasTrabajadosRuta} días
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Días de Descanso y Feriados:
                                </span>
                                <span className="font-mono font-extrabold text-emerald-700">
                                    {String(
                                        resumenInferior.diasDescansoFeriados,
                                    ).padStart(2, '0')}{' '}
                                    días
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Descansos / Feriados Trabajados:
                                </span>
                                <span className="font-mono font-bold text-slate-700">
                                    {resumenInferior.descansosTrabajados} días
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3.5">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            PROMEDIO SALARIAL DIARIO
                        </p>
                        <div className="flex items-baseline justify-between gap-2 mt-1">
                            <span className="text-base font-extrabold font-mono text-slate-900">
                                {prefijoMoneda}
                                {formatearNumeroVe(
                                    convertirSegunVista(
                                        resumenInferior.promedioSalarialDiarioBs,
                                    ),
                                )}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                                ~$
                                {formatearNumeroVe(
                                    resumenInferior.promedioSalarialDiarioUsd,
                                )}{' '}
                                / día
                            </span>
                        </div>
                    </div>
                </div>

                {/* TARJETA 2: INGRESOS BRUTOS */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                    <PlusCircle className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-extrabold text-slate-900">
                                    Ingresos Brutos
                                </h3>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-extrabold uppercase">
                                PERCEPCIONES
                            </span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Total Flete Tabulador:
                                </span>
                                <span className="font-mono font-extrabold text-slate-900">
                                    {prefijoMoneda}
                                    {formatearNumeroVe(
                                        convertirSegunVista(
                                            resumenInferior.totalFleteTabuladorBs,
                                        ),
                                    )}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Descanso o Feriado Legal:
                                </span>
                                <span className="font-mono font-extrabold text-slate-900">
                                    {prefijoMoneda}
                                    {formatearNumeroVe(
                                        convertirSegunVista(
                                            resumenInferior.descansoFeriadoLegalBs,
                                        ),
                                    )}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Descanso Trabajado:
                                </span>
                                <span className="font-mono font-bold text-slate-500">
                                    {prefijoMoneda}
                                    {formatearNumeroVe(
                                        convertirSegunVista(
                                            resumenInferior.descansoTrabajadoBs,
                                        ),
                                    )}
                                </span>
                            </div>

                            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60">
                                <span className="font-bold text-emerald-800">
                                    Total Art. 241 LOTTT:
                                </span>
                                <span className="font-mono font-extrabold text-emerald-700">
                                    {prefijoMoneda}
                                    {formatearNumeroVe(
                                        convertirSegunVista(
                                            resumenInferior.totalArt241LotttBs,
                                        ),
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-3.5">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                            SUB-TOTAL INGRESOS BRUTOS
                        </p>
                        <div className="flex items-baseline justify-between gap-2 mt-1">
                            <span className="text-base font-extrabold font-mono text-emerald-800">
                                {prefijoMoneda}
                                {formatearNumeroVe(
                                    convertirSegunVista(
                                        resumenInferior.subTotalIngresosBrutosBs,
                                    ),
                                )}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-emerald-700">
                                $
                                {formatearNumeroVe(
                                    resumenInferior.subTotalIngresosBrutosUsd,
                                )}{' '}
                                USD
                            </span>
                        </div>
                    </div>
                </div>

                {/* TARJETA 3: DEDUCCIONES */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                                    <MinusCircle className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-extrabold text-slate-900">
                                    Deducciones
                                </h3>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200/70 text-[10px] font-extrabold uppercase">
                                FISCALES &amp; ENTREGAS
                            </span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Anticipos de Nómina:
                                </span>
                                <span className="font-mono font-extrabold text-amber-700">
                                    {prefijoMoneda}
                                    {formatearNumeroVe(
                                        convertirSegunVista(
                                            resumenInferior.anticiposNominaBs,
                                        ),
                                    )}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Retención ISRL (Tasa Fija):
                                </span>
                                <span className="font-mono font-extrabold text-slate-800">
                                    {prefijoMoneda}
                                    {formatearNumeroVe(
                                        convertirSegunVista(
                                            resumenInferior.retencionIsrlBs,
                                        ),
                                    )}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Seguro Social Obligatorio (IVSS):
                                </span>
                                <span className="font-mono font-extrabold text-slate-800">
                                    {prefijoMoneda}
                                    {formatearNumeroVe(
                                        convertirSegunVista(
                                            resumenInferior.seguroSocialIvssBs,
                                        ),
                                    )}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Aporte Habitacional (LPH):
                                </span>
                                <span className="font-mono font-extrabold text-slate-800">
                                    {prefijoMoneda}
                                    {formatearNumeroVe(
                                        convertirSegunVista(
                                            resumenInferior.aporteHabitacionalLphBs,
                                        ),
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-slate-100/90 border border-slate-200/80 p-3.5">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                            SUB-TOTAL DEDUCCIONES
                        </p>
                        <div className="flex items-baseline justify-between gap-2 mt-1">
                            <span className="text-base font-extrabold font-mono text-slate-900">
                                {prefijoMoneda}
                                {formatearNumeroVe(
                                    convertirSegunVista(
                                        resumenInferior.subTotalDeduccionesBs,
                                    ),
                                )}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-rose-500">
                                -$
                                {formatearNumeroVe(
                                    resumenInferior.subTotalDeduccionesUsd,
                                )}{' '}
                                USD
                            </span>
                        </div>
                    </div>
                </div>

                {/* TARJETA 4: LIQUIDACIÓN LISTA PARA ABONO (DARK CARD) */}
                <div className="bg-[#162032] text-white rounded-2xl border border-slate-800 shadow-md p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-0.5" />
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 leading-tight">
                                    LIQUIDACIÓN LISTA PARA ABONO
                                </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono font-bold shrink-0">
                                Q1 Nov-2026
                            </span>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                TOTAL NETO A COBRAR
                            </p>
                            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight mt-0.5">
                                {prefijoMoneda}
                                {formatearNumeroVe(
                                    convertirSegunVista(
                                        resumenInferior.totalNetoCobrarBs,
                                    ),
                                )}
                            </p>
                            <div className="flex items-center gap-2 text-xs font-mono mt-1">
                                <span className="font-bold text-emerald-400">
                                    $
                                    {formatearNumeroVe(
                                        resumenInferior.totalNetoCobrarUsd,
                                    )}{' '}
                                    USD
                                </span>
                                <span className="text-slate-600">|</span>
                                <span className="text-slate-400 text-[11px]">
                                    Tasa {formatearNumeroVe(tasaBcv, 2)} BCV
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs">
                            <span className="text-slate-300 text-[11px]">
                                Fondo Reserva Art. 241 LOTTT:
                            </span>
                            <span className="font-mono font-extrabold text-emerald-400 text-xs">
                                {prefijoMoneda}
                                {formatearNumeroVe(
                                    convertirSegunVista(
                                        resumenInferior.fondoReservaArt241Bs,
                                    ),
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2 pt-1">
                        <button
                            type="button"
                            onClick={() =>
                                dispararAviso(
                                    `Archivo TXT bancario generado para ${nombreConductor}`,
                                )
                            }
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20 transition cursor-pointer"
                        >
                            <Landmark className="w-3.5 h-3.5" />
                            <span>Liquidar y Generar Archivo TXT</span>
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                dispararAviso(
                                    `Comprobante digital enviado por WhatsApp a ${nombreConductor}`,
                                )
                            }
                            className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Comprobante Digital WhatsApp</span>
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
