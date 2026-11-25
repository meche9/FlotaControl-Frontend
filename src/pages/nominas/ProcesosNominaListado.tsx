import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Landmark,
    ShieldCheck,
    Truck,
    Users,
    Search,
    ListFilter,
    Calendar,
    GitFork,
    PlusCircle,
    Lock,
    CheckCircle2,
    Copy,
    Check,
    Calculator,
    ArrowRight,
    UserCheck,
    DollarSign,
    Fuel,
    CreditCard,
    History,
    X,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import {
    nominasProcesosService,
    type NominaProceso,
    type NominaResumen,
    type CreateProcesoNominaDto,
} from '../../services/nominasProcesosService';
import { getApiErrorMessage } from '../../services/api';

interface OperadorPreAuditoria {
    iniciales: string;
    colorAvatar: string;
    nombre: string;
    cedula: string;
    unidad: string;
    viajes: number;
    fleteBrutoUsd: number;
    anticiposUsd: number;
    netoUsd: number;
}

interface ResumenProcesoVisual {
    etiquetaTipo: string;
    nombreNominaDetalle: string;
    regimenJuridico: string;
    regimenSubtitulo: string;
    viajesCount: number;
    choferesCount: number;
    fletesBrutosUsd: number;
    anticiposUsd: number;
    deduccionesUsd: number;
    comprobantesCount: number;
    responsableCierre?: string;
    creadoPor: string;
    operadoresMuestra: OperadorPreAuditoria[];
}

const TASA_BCV_ACTUAL = 36.42;

const PROCESOS_INICIALES_DEMO: NominaProceso[] = [
    {
        idProcesonomina: '8a4c19e2-fa12-421c-9d3a-41b8e209b2f1',
        idCodnomina: '01',
        codProcesonomina: '2026-Q11',
        fechaInicioP: '2026-11-01',
        fechaFinP: '2026-11-15',
        fechaCierreP: null,
        createdAt: '2026-11-01T08:00:00.000Z',
        updateAt: '2026-11-15T14:22:00.000Z',
        nomina: {
            idCodnomina: '01',
            modalidad: 'quincenal',
            descripcion: 'Conductores Mack Pesado',
            activo: true,
        },
        _count: { calculos: 42 },
    },
    {
        idProcesonomina: '3d91b04a-7c18-4f55-a12c-98e4d120a4c2',
        idCodnomina: '01',
        codProcesonomina: '2026-Q10',
        fechaInicioP: '2026-10-16',
        fechaFinP: '2026-10-31',
        fechaCierreP: '2026-10-31T19:40:22.000Z',
        createdAt: '2026-10-16T08:00:00.000Z',
        updateAt: '2026-10-31T19:40:22.000Z',
        nomina: {
            idCodnomina: '01',
            modalidad: 'quincenal',
            descripcion: 'Conductores Mack Pesado',
            activo: true,
        },
        _count: { calculos: 38 },
    },
    {
        idProcesonomina: '7e22c510-118b-4e92-8c44-52f09a31c8d9',
        idCodnomina: '01',
        codProcesonomina: '2026-Q09',
        fechaInicioP: '2026-10-01',
        fechaFinP: '2026-10-15',
        fechaCierreP: '2026-10-15T21:15:04.000Z',
        createdAt: '2026-10-01T08:00:00.000Z',
        updateAt: '2026-10-15T21:15:04.000Z',
        nomina: {
            idCodnomina: '01',
            modalidad: 'quincenal',
            descripcion: 'Conductores Mack Pesado',
            activo: true,
        },
        _count: { calculos: 45 },
    },
    {
        idProcesonomina: '9f41e822-2b33-4a11-9e10-12a34b56c780',
        idCodnomina: '02',
        codProcesonomina: '2026-E11',
        fechaInicioP: '2026-11-01',
        fechaFinP: '2026-11-15',
        fechaCierreP: null,
        createdAt: '2026-11-01T08:30:00.000Z',
        updateAt: '2026-11-15T11:10:00.000Z',
        nomina: {
            idCodnomina: '02',
            modalidad: 'quincenal',
            descripcion: 'Empleados Administrativos y Taller',
            activo: true,
        },
        _count: { calculos: 18 },
    },
];

const RESUMEN_POR_CODIGO: Record<string, ResumenProcesoVisual> = {
    '2026-Q11': {
        etiquetaTipo: 'Fletes Mack',
        nombreNominaDetalle: 'Mack Pesado',
        regimenJuridico: 'Art. 241 LOTTT',
        regimenSubtitulo: 'Flete por Distancia',
        viajesCount: 42,
        choferesCount: 14,
        fletesBrutosUsd: 12480,
        anticiposUsd: 4120,
        deduccionesUsd: 1000,
        comprobantesCount: 33,
        creadoPor: 'a.silva',
        operadoresMuestra: [
            {
                iniciales: 'RG',
                colorAvatar: 'bg-amber-100 text-amber-800',
                nombre: 'Rafael González',
                cedula: 'C.I. 14.821.902',
                unidad: 'MACK-08',
                viajes: 4,
                fleteBrutoUsd: 1450,
                anticiposUsd: 450,
                netoUsd: 1000,
            },
            {
                iniciales: 'EM',
                colorAvatar: 'bg-emerald-100 text-emerald-800',
                nombre: 'Eduardo Morales',
                cedula: 'C.I. 16.339.102',
                unidad: 'MACK-12',
                viajes: 5,
                fleteBrutoUsd: 1820,
                anticiposUsd: 600,
                netoUsd: 1220,
            },
            {
                iniciales: 'CL',
                colorAvatar: 'bg-sky-100 text-sky-800',
                nombre: 'Carlos Linares',
                cedula: 'C.I. 18.002.411',
                unidad: 'MACK-04',
                viajes: 3,
                fleteBrutoUsd: 980,
                anticiposUsd: 250,
                netoUsd: 730,
            },
        ],
    },
    '2026-Q10': {
        etiquetaTipo: 'Fletes Mack',
        nombreNominaDetalle: 'Mack Pesado',
        regimenJuridico: 'Art. 241 LOTTT',
        regimenSubtitulo: 'Flete por Distancia',
        viajesCount: 38,
        choferesCount: 13,
        fletesBrutosUsd: 10920,
        anticiposUsd: 3450,
        deduccionesUsd: 890,
        comprobantesCount: 29,
        responsableCierre: 'm.torres',
        creadoPor: 'm.torres',
        operadoresMuestra: [
            {
                iniciales: 'RG',
                colorAvatar: 'bg-amber-100 text-amber-800',
                nombre: 'Rafael González',
                cedula: 'C.I. 14.821.902',
                unidad: 'MACK-08',
                viajes: 3,
                fleteBrutoUsd: 1180,
                anticiposUsd: 320,
                netoUsd: 860,
            },
            {
                iniciales: 'EM',
                colorAvatar: 'bg-emerald-100 text-emerald-800',
                nombre: 'Eduardo Morales',
                cedula: 'C.I. 16.339.102',
                unidad: 'MACK-12',
                viajes: 4,
                fleteBrutoUsd: 1540,
                anticiposUsd: 480,
                netoUsd: 1060,
            },
        ],
    },
    '2026-Q09': {
        etiquetaTipo: 'Fletes Mack',
        nombreNominaDetalle: 'Mack Pesado',
        regimenJuridico: 'Art. 241 LOTTT',
        regimenSubtitulo: 'Flete por Distancia',
        viajesCount: 45,
        choferesCount: 14,
        fletesBrutosUsd: 13650,
        anticiposUsd: 4380,
        deduccionesUsd: 1120,
        comprobantesCount: 36,
        responsableCierre: 'a.silva',
        creadoPor: 'a.silva',
        operadoresMuestra: [
            {
                iniciales: 'CL',
                colorAvatar: 'bg-sky-100 text-sky-800',
                nombre: 'Carlos Linares',
                cedula: 'C.I. 18.002.411',
                unidad: 'MACK-04',
                viajes: 4,
                fleteBrutoUsd: 1320,
                anticiposUsd: 390,
                netoUsd: 930,
            },
        ],
    },
};

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

const MESES_LARGOS = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];

function parseIsoDatePart(iso: string): { year: number; month: number; day: number } {
    const clean = iso.slice(0, 10);
    const [y, m, d] = clean.split('-').map(Number);
    return {
        year: y || 2026,
        month: (m || 1) - 1,
        day: d || 1,
    };
}

function formatFechaCorta(iso: string): string {
    const { year, month, day } = parseIsoDatePart(iso);
    return `${String(day).padStart(2, '0')} ${MESES_CORTOS[month]} ${year}`;
}

function formatFechaLarga(iso: string): string {
    const { year, month, day } = parseIsoDatePart(iso);
    return `${String(day).padStart(2, '0')} de ${MESES_LARGOS[month]}`;
}

function formatFechaHora(iso: string | null): string {
    if (!iso) return 'NULL';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

function formatFechaCortaHora(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function formatUsd(amount: number, decimals = 2): string {
    return `$${amount.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })}`;
}

function formatBs(amountUsd: number): string {
    const bs = amountUsd * TASA_BCV_ACTUAL;
    return `Bs. ${bs.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function shortenUuid(uuid: string): string {
    if (uuid.length <= 14) return uuid;
    return `${uuid.slice(0, 6)}...${uuid.slice(-4)}`;
}

function buildResumenVisual(proceso: NominaProceso): ResumenProcesoVisual {
    const exact = RESUMEN_POR_CODIGO[proceso.codProcesonomina];
    if (exact) return exact;

    const esConductores = proceso.idCodnomina === '01';
    const viajes = proceso._count?.calculos ?? (esConductores ? 0 : 0);
    const fletes = viajes * 295;
    const anticipos = Math.round(fletes * 0.3);
    const deducciones = Math.round(fletes * 0.08);

    return {
        etiquetaTipo: esConductores ? 'Fletes Mack' : 'Personal Fijo',
        nombreNominaDetalle: esConductores ? 'Mack Pesado' : 'Empleados Admin',
        regimenJuridico: esConductores ? 'Art. 241 LOTTT' : 'Art. 104 LOTTT',
        regimenSubtitulo: esConductores ? 'Flete por Distancia' : 'Salario Base Quincenal',
        viajesCount: viajes,
        choferesCount: esConductores ? 14 : 18,
        fletesBrutosUsd: fletes,
        anticiposUsd: anticipos,
        deduccionesUsd: deducciones,
        comprobantesCount: viajes > 0 ? Math.max(1, Math.round(viajes * 0.78)) : 0,
        responsableCierre: proceso.fechaCierreP ? 'a.silva' : undefined,
        creadoPor: 'a.silva',
        operadoresMuestra: [],
    };
}

export default function ProcesosNominaListado() {
    const navigate = useNavigate();

    const [procesos, setProcesos] = useState<NominaProceso[]>(PROCESOS_INICIALES_DEMO);
    const [tiposNomina, setTiposNomina] = useState<NominaResumen[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [usandoDatosDemo, setUsandoDatosDemo] = useState<boolean>(false);

    const [tipoNominaActivo, setTipoNominaActivo] = useState<string>('');
    const [busquedaCodigo, setBusquedaCodigo] = useState<string>('');
    const [soloAbiertosFiltro, setSoloAbiertosFiltro] = useState<boolean>(false);
    const [procesoSeleccionadoId, setProcesoSeleccionadoId] = useState<string>(
        PROCESOS_INICIALES_DEMO[0].idProcesonomina,
    );
    const [uuidCopiado, setUuidCopiado] = useState<boolean>(false);

    // Modal Aperturar Nuevo Período
    const [modalAperturaAbierto, setModalAperturaAbierto] = useState<boolean>(false);
    const [formApertura, setFormApertura] = useState<CreateProcesoNominaDto>({
        idCodnomina: '01',
        codProcesonomina: '',
        fechaInicioP: '',
        fechaFinP: '',
    });
    const [guardandoApertura, setGuardandoApertura] = useState<boolean>(false);
    const [errorApertura, setErrorApertura] = useState<string | null>(null);

    // Modal Confirmar Cierre
    const [modalCierreAbierto, setModalCierreAbierto] = useState<boolean>(false);
    const [cerrandoProceso, setCerrandoProceso] = useState<boolean>(false);
    const [errorCierre, setErrorCierre] = useState<string | null>(null);

    const cargarProcesos = useCallback(async () => {
        setCargando(true);
        try {
            const [tiposRes, procesosRes] = await Promise.allSettled([
                nominasProcesosService.listarTiposNomina(),
                nominasProcesosService.listar(),
            ]);

            if (tiposRes.status === 'fulfilled' && Array.isArray(tiposRes.value)) {
                setTiposNomina(tiposRes.value);
                setTipoNominaActivo((prev) =>
                    tiposRes.value.some((t) => t.idCodnomina === prev)
                        ? prev
                        : (tiposRes.value[0]?.idCodnomina ?? ''),
                );
            } else {
                setTiposNomina([]);
            }

            if (
                procesosRes.status === 'fulfilled' &&
                Array.isArray(procesosRes.value) &&
                procesosRes.value.length > 0
            ) {
                const data = procesosRes.value;
                setProcesos(data);
                setUsandoDatosDemo(false);
                setProcesoSeleccionadoId((prev) =>
                    data.some((p) => p.idProcesonomina === prev)
                        ? prev
                        : data[0].idProcesonomina,
                );
            } else if (procesosRes.status === 'fulfilled') {
                setProcesos([]);
                setUsandoDatosDemo(false);
            } else {
                setProcesos(PROCESOS_INICIALES_DEMO);
                setUsandoDatosDemo(true);
            }
        } catch {
            setProcesos(PROCESOS_INICIALES_DEMO);
            setUsandoDatosDemo(true);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        void cargarProcesos();
    }, [cargarProcesos]);

    const procesosFiltrados = useMemo(() => {
        const q = busquedaCodigo.trim().toLowerCase();
        return procesos.filter((p) => {
            if (p.idCodnomina !== tipoNominaActivo) return false;
            if (soloAbiertosFiltro && p.fechaCierreP !== null) return false;
            if (q && !p.codProcesonomina.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [procesos, tipoNominaActivo, soloAbiertosFiltro, busquedaCodigo]);

    const procesosAbiertos = useMemo(
        () => procesosFiltrados.filter((p) => p.fechaCierreP === null),
        [procesosFiltrados],
    );

    const procesosCerrados = useMemo(
        () => procesosFiltrados.filter((p) => p.fechaCierreP !== null),
        [procesosFiltrados],
    );

    // Mantener selección válida cuando cambia el tab o filtro
    useEffect(() => {
        if (
            procesosFiltrados.length > 0 &&
            !procesosFiltrados.some((p) => p.idProcesonomina === procesoSeleccionadoId)
        ) {
            setProcesoSeleccionadoId(procesosFiltrados[0].idProcesonomina);
        }
    }, [procesosFiltrados, procesoSeleccionadoId]);

    const procesoActual = useMemo(
        () =>
            procesosFiltrados.find((p) => p.idProcesonomina === procesoSeleccionadoId) ??
            procesosFiltrados[0] ??
            null,
        [procesosFiltrados, procesoSeleccionadoId],
    );

    const resumenActual = useMemo(
        () => (procesoActual ? buildResumenVisual(procesoActual) : null),
        [procesoActual],
    );

    const handleCopiarUuid = async (uuid: string) => {
        try {
            await navigator.clipboard.writeText(uuid);
            setUuidCopiado(true);
            setTimeout(() => setUuidCopiado(false), 1800);
        } catch {
            // Silencioso si el navegador bloquea clipboard
        }
    };

    const handleAbrirModalNuevo = () => {
        setFormApertura({
            idCodnomina: tipoNominaActivo,
            codProcesonomina: '',
            fechaInicioP: '',
            fechaFinP: '',
        });
        setErrorApertura(null);
        setModalAperturaAbierto(true);
    };

    const handleSubmitApertura = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorApertura(null);

        const codigo = formApertura.codProcesonomina.trim().toUpperCase();
        if (!codigo || codigo.length > 9) {
            setErrorApertura(
                'El código del proceso es obligatorio y debe tener máximo 9 caracteres (ej: 2026-Q12).',
            );
            return;
        }

        if (!formApertura.fechaInicioP || !formApertura.fechaFinP) {
            setErrorApertura('Debe especificar fecha de inicio y fecha de fin.');
            return;
        }

        if (formApertura.fechaInicioP > formApertura.fechaFinP) {
            setErrorApertura('La fecha de inicio no puede ser mayor a la fecha de fin.');
            return;
        }

        setGuardandoApertura(true);
        try {
            if (!usandoDatosDemo) {
                const nuevo = await nominasProcesosService.abrirProceso({
                    ...formApertura,
                    codProcesonomina: codigo,
                });
                setProcesos((prev) => [nuevo, ...prev]);
                setTipoNominaActivo(nuevo.idCodnomina);
                setProcesoSeleccionadoId(nuevo.idProcesonomina);
            } else {
                const existeCodigo = procesos.some(
                    (p) => p.codProcesonomina.toUpperCase() === codigo,
                );
                if (existeCodigo) {
                    setErrorApertura(`Ya existe un proceso registrado con el código '${codigo}'.`);
                    setGuardandoApertura(false);
                    return;
                }
                const nuevoLocal: NominaProceso = {
                    idProcesonomina: crypto.randomUUID
                        ? crypto.randomUUID()
                        : `proc-${Date.now()}`,
                    idCodnomina: formApertura.idCodnomina,
                    codProcesonomina: codigo,
                    fechaInicioP: formApertura.fechaInicioP,
                    fechaFinP: formApertura.fechaFinP,
                    fechaCierreP: null,
                    createdAt: new Date().toISOString(),
                    updateAt: new Date().toISOString(),
                    nomina: {
                        idCodnomina: formApertura.idCodnomina,
                        modalidad: 'quincenal',
                        descripcion:
                            formApertura.idCodnomina === '01'
                                ? 'Conductores Mack Pesado'
                                : 'Empleados Administrativos',
                        activo: true,
                    },
                    _count: { calculos: 0 },
                };
                setProcesos((prev) => [nuevoLocal, ...prev]);
                setTipoNominaActivo(formApertura.idCodnomina);
                setProcesoSeleccionadoId(nuevoLocal.idProcesonomina);
            }
            setModalAperturaAbierto(false);
        } catch (err) {
            setErrorApertura(getApiErrorMessage(err));
        } finally {
            setGuardandoApertura(false);
        }
    };

    const handleConfirmarCierre = async () => {
        if (!procesoActual) return;
        setCerrandoProceso(true);
        setErrorCierre(null);

        try {
            if (!usandoDatosDemo) {
                const actualizado = await nominasProcesosService.cerrarProceso(
                    procesoActual.idProcesonomina,
                );
                setProcesos((prev) =>
                    prev.map((p) =>
                        p.idProcesonomina === actualizado.idProcesonomina ? actualizado : p,
                    ),
                );
            } else {
                const ahora = new Date().toISOString();
                setProcesos((prev) =>
                    prev.map((p) =>
                        p.idProcesonomina === procesoActual.idProcesonomina
                            ? { ...p, fechaCierreP: ahora, updateAt: ahora }
                            : p,
                    ),
                );
            }
            setModalCierreAbierto(false);
        } catch (err) {
            setErrorCierre(getApiErrorMessage(err));
        } finally {
            setCerrandoProceso(false);
        }
    };

    // Cálculos para la barra de balance neto
    const balanceData = useMemo(() => {
        if (!resumenActual) {
            return {
                netoPagar: 0,
                pctFlete: 67,
                pctAnticipos: 25,
                pctDeducciones: 8,
                anticiposBarra: 0,
            };
        }
        const bruto = resumenActual.fletesBrutosUsd;
        const netoPagar = Math.max(0, bruto - resumenActual.anticiposUsd);
        const anticiposBarra = Math.max(
            0,
            resumenActual.anticiposUsd - resumenActual.deduccionesUsd,
        );
        const total = netoPagar + anticiposBarra + resumenActual.deduccionesUsd;

        if (total <= 0) {
            return {
                netoPagar: 0,
                pctFlete: 0,
                pctAnticipos: 0,
                pctDeducciones: 0,
                anticiposBarra: 0,
            };
        }

        const pctFlete = Math.round((netoPagar / total) * 100);
        const pctAnticipos = Math.round((anticiposBarra / total) * 100);
        const pctDeducciones = Math.max(0, 100 - pctFlete - pctAnticipos);

        return {
            netoPagar,
            pctFlete,
            pctAnticipos,
            pctDeducciones,
            anticiposBarra,
        };
    }, [resumenActual]);

    return (
        <div className="min-h-full space-y-5 text-slate-800">
            {/* 1. ENCABEZADO SUPERIOR */}
            <header className="bg-white rounded-2xl border border-slate-200/80 shadow-xs px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                        <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                                Gestión de Procesos de Nómina
                            </h1>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                                DB: NOMINAS_PROCESOS
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Conciliación bimonetaria (USD / Bs. BCV), fletes de larga distancia y
                            regímenes laborales de transporte pesado.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/90 text-xs">
                        <span className="text-slate-500 font-medium">Tasa Fijada BCV:</span>
                        <span className="font-bold text-slate-900">
                            Bs. {TASA_BCV_ACTUAL.toFixed(2)}
                        </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-semibold text-slate-700">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>LOTTT Art. 241 &amp; 245</span>
                    </div>
                </div>
            </header>

            {/* 2. CUERPO PRINCIPAL DE 2 COLUMNAS */}
            <div className="grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-5 items-start">
                {/* COLUMNA IZQUIERDA: SELECTOR Y LISTADO DE PROCESOS */}
                <aside className="min-w-0 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3.5">
                        {/* Título selector + Categorías */}
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                NÓMINAS:
                            </span>
                            <span className="text-xs font-semibold text-orange-600">
                                {tiposNomina.length}{' '}
                                {tiposNomina.length === 1 ? 'Categoría' : 'Categorías'}
                            </span>
                        </div>

                        {/* Tabs tipo segmented azul oscuro desde tabla nominas */}
                        <div
                            className={`grid p-1 rounded-xl bg-[#0e4f7d] border-2 border-[#0e4f7d] gap-1 ${
                                tiposNomina.length <= 1
                                    ? 'grid-cols-1'
                                    : tiposNomina.length === 2
                                      ? 'grid-cols-2'
                                      : 'grid-cols-2 sm:grid-cols-3'
                            }`}
                        >
                            {tiposNomina.map((nomina) => {
                                const activo = tipoNominaActivo === nomina.idCodnomina;
                                const label = nomina.descripcion?.trim() || nomina.modalidad;
                                const Icono = nomina.idCodnomina === '01' ? Truck : Users;
                                return (
                                    <button
                                        key={nomina.idCodnomina}
                                        type="button"
                                        onClick={() => setTipoNominaActivo(nomina.idCodnomina)}
                                        title={`${nomina.idCodnomina} - ${label}`}
                                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            activo
                                                ? 'bg-white text-[#0e4f7d] shadow-sm'
                                                : 'text-white/95 hover:bg-white/10'
                                        }`}
                                    >
                                        <Icono className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">
                                            {nomina.idCodnomina} - {label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Buscador + Botón Filtro */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={busquedaCodigo}
                                    onChange={(e) => setBusquedaCodigo(e.target.value)}
                                    placeholder="Filtrar por código (ej: 2026-Q11)..."
                                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setSoloAbiertosFiltro((prev) => !prev)}
                                title={
                                    soloAbiertosFiltro
                                        ? 'Mostrando solo procesos abiertos'
                                        : 'Filtrar solo procesos abiertos'
                                }
                                className={`p-2 rounded-xl border transition cursor-pointer ${soloAbiertosFiltro
                                    ? 'bg-orange-50 border-orange-300 text-orange-600'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                    }`}
                            >
                                <ListFilter className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Procesos Abiertos */}
                        {cargando ? (
                            <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                                <span className="text-xs">Cargando procesos de nómina...</span>
                            </div>
                        ) : procesosAbiertos.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center">
                                <p className="text-xs font-medium text-slate-500">
                                    No hay procesos abiertos para esta categoría.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {procesosAbiertos.map((proc) => {
                                    const res = buildResumenVisual(proc);
                                    const seleccionado =
                                        procesoActual?.idProcesonomina === proc.idProcesonomina;
                                    return (
                                        <button
                                            key={proc.idProcesonomina}
                                            type="button"
                                            onClick={() => setProcesoSeleccionadoId(proc.idProcesonomina)}
                                            className={`w-full text-left rounded-xl p-3.5 border transition-all cursor-pointer ${seleccionado
                                                ? 'bg-white border-orange-300 shadow-sm ring-2 ring-orange-500/10'
                                                : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-900">
                                                        {proc.codProcesonomina}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                                                        {res.etiquetaTipo}
                                                    </span>
                                                </div>
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Activo / Conciliando
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                <span>
                                                    {formatFechaCorta(proc.fechaInicioP)} -{' '}
                                                    {formatFechaCorta(proc.fechaFinP)}
                                                </span>
                                            </div>

                                            <div className="flex items-end justify-between mt-3 pt-2 border-t border-slate-100">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                                    <GitFork className="w-3.5 h-3.5 text-sky-600" />
                                                    <span>{res.viajesCount} viajes cargados</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[11px] text-slate-400 leading-none">
                                                        Provisional:
                                                    </p>
                                                    <p className="text-xs font-bold text-orange-600 mt-0.5">
                                                        {formatUsd(res.fletesBrutosUsd)} USD
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[11px]">
                                                <span className="font-mono text-slate-400">
                                                    UUID: {shortenUuid(proc.idProcesonomina)}
                                                </span>
                                                <span className="font-semibold text-emerald-700">
                                                    fecha_CierreP: NULL (Abierto)
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Botón Aperturar Nuevo Período */}
                        <button
                            type="button"
                            onClick={handleAbrirModalNuevo}
                            className="w-full py-2.5 px-4 rounded-xl bg-orange-100/80 hover:bg-orange-200/80 border border-orange-200 text-orange-900 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                            <PlusCircle className="w-4 h-4 text-orange-700" />
                            <span>+ Aperturar Nuevo Período de Nómina</span>
                        </button>
                    </div>

                    {/* Procesos Cerrados / Histórico */}
                    <div className="space-y-2.5">
                        <h2 className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            PROCESOS CERRADOS / HISTÓRICO
                        </h2>

                        {procesosCerrados.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 text-center text-xs text-slate-400">
                                No hay procesos cerrados en esta categoría.
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {procesosCerrados.map((proc) => {
                                    const res = buildResumenVisual(proc);
                                    const seleccionado =
                                        procesoActual?.idProcesonomina === proc.idProcesonomina;
                                    return (
                                        <button
                                            key={proc.idProcesonomina}
                                            type="button"
                                            onClick={() => setProcesoSeleccionadoId(proc.idProcesonomina)}
                                            className={`w-full text-left bg-white rounded-2xl p-3.5 border transition-all cursor-pointer ${seleccionado
                                                ? 'border-orange-300 shadow-sm ring-2 ring-orange-500/10'
                                                : 'border-slate-200/80 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-900">
                                                        {proc.codProcesonomina}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                                                        {res.etiquetaTipo}
                                                    </span>
                                                </div>
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                                                    <Lock className="w-3 h-3" />
                                                    Cerrado
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                <span>
                                                    {formatFechaCorta(proc.fechaInicioP)} -{' '}
                                                    {formatFechaCorta(proc.fechaFinP)}
                                                </span>
                                            </div>

                                            <div className="flex items-end justify-between mt-3 pt-2 border-t border-slate-100">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{res.viajesCount} viajes liquidados</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[11px] text-slate-400 leading-none">
                                                        Consolidado:
                                                    </p>
                                                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                                                        {formatUsd(res.fletesBrutosUsd)} USD
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                                                <span>Cerrado: {formatFechaHora(proc.fechaCierreP)}</span>
                                                <span>Resp: {res.responsableCierre ?? 'a.silva'}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </aside>

                {/* COLUMNA DERECHA: DETALLE DEL PROCESO SELECCIONADO */}
                <section className="min-w-0 space-y-4">
                    {!procesoActual || !resumenActual ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                            Selecciona o apertura un proceso de nómina para visualizar su detalle.
                        </div>
                    ) : (
                        <>
                            {/* TARJETA HERO DEL PROCESO */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                                {procesoActual.codProcesonomina}
                                            </h2>
                                            {procesoActual.fechaCierreP === null ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    En Curso • Conciliación Abierta
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                                                    <Lock className="w-3.5 h-3.5" />
                                                    Cerrado • Liquidación Sellada
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                            Ciclo Quincenal {resumenActual.nombreNominaDetalle}:{' '}
                                            {formatFechaLarga(procesoActual.fechaInicioP)} —{' '}
                                            {formatFechaLarga(procesoActual.fechaFinP)}{' '}
                                            {parseIsoDatePart(procesoActual.fechaFinP).year}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleCopiarUuid(procesoActual.idProcesonomina)}
                                        title="Copiar UUID completo del proceso"
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600 transition cursor-pointer shrink-0"
                                    >
                                        <span>
                                            id_procesonomina: {procesoActual.idProcesonomina.slice(0, 18)}
                                        </span>
                                        {uuidCopiado ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                                        )}
                                    </button>
                                </div>

                                {/* BANNER CTA NARANJA */}
                                <div className="rounded-2xl bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 p-4 sm:p-5 text-white shadow-md shadow-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                                            <Calculator className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold leading-snug">
                                                Entrar a Liquidación de Fletes y Cierre de Nómina
                                            </h3>
                                            <p className="text-xs text-orange-50/90 mt-0.5">
                                                Auditoría individual por chofer, asignación de viáticos,
                                                deducciones y generación de recibos
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => navigate('/costs')}
                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-extrabold tracking-wide transition cursor-pointer shrink-0"
                                    >
                                        <span>INGRESAR</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* 4 MINI TARJETAS DE METADATA */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                                    <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-3.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            TIPO DE NÓMINA
                                        </p>
                                        <p className="text-sm font-bold text-slate-900 mt-1">
                                            {resumenActual.nombreNominaDetalle}
                                        </p>
                                        <p className="text-[11px] font-mono text-emerald-700 mt-0.5">
                                            id_codnomina = &apos;{procesoActual.idCodnomina}&apos;
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-3.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            RÉGIMEN JURÍDICO
                                        </p>
                                        <p className="text-sm font-bold text-slate-900 mt-1">
                                            {resumenActual.regimenJuridico}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            {resumenActual.regimenSubtitulo}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-3.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            TASA FISCAL BCV
                                        </p>
                                        <p className="text-sm font-bold text-slate-900 mt-1">
                                            {TASA_BCV_ACTUAL.toFixed(2)} Bs/$
                                        </p>
                                        <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                                            Sincronizado Hoy
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-3.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            FECHA_CIERREP
                                        </p>
                                        {procesoActual.fechaCierreP === null ? (
                                            <>
                                                <p className="text-sm font-bold text-orange-600 mt-1">NULL</p>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    Liquidación no sellada
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-xs font-bold text-slate-800 mt-1.5">
                                                    {formatFechaCortaHora(procesoActual.fechaCierreP)}
                                                </p>
                                                <p className="text-[11px] text-emerald-600 mt-0.5">
                                                    Liquidación sellada
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 4 KPI CARDS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            {procesoActual.idCodnomina === '01'
                                                ? 'CHOFERES MACK'
                                                : 'EMPLEADOS ACTIVOS'}
                                        </span>
                                        <UserCheck className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <p className="text-2xl font-extrabold text-slate-900 mt-2">
                                        {resumenActual.choferesCount}
                                    </p>
                                    <p className="text-xs font-medium text-emerald-600 mt-1">
                                        100% con hojas de ruta
                                    </p>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            VIAJES COMPUTADOS
                                        </span>
                                        <GitFork className="w-4 h-4 text-sky-600" />
                                    </div>
                                    <p className="text-2xl font-extrabold text-slate-900 mt-2">
                                        {resumenActual.viajesCount}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {resumenActual.viajesCount} guías validadas
                                    </p>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            FLETES BRUTOS
                                        </span>
                                        <DollarSign className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <p className="text-2xl font-extrabold text-emerald-700 mt-2">
                                        {formatUsd(resumenActual.fletesBrutosUsd)}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {formatBs(resumenActual.fletesBrutosUsd)}
                                    </p>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            ANTICIPOS / VIÁTICOS
                                        </span>
                                        <Fuel className="w-4 h-4 text-orange-500" />
                                    </div>
                                    <p className="text-2xl font-extrabold text-orange-600 mt-2">
                                        -{formatUsd(resumenActual.anticiposUsd)}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {resumenActual.comprobantesCount} comprobantes
                                    </p>
                                </div>
                            </div>

                            {/* ESTIMACIÓN DE BALANCE NETO DE SALIDA */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                        <CreditCard className="w-4 h-4 text-slate-600" />
                                        <span>Estimación de Balance Neto de Salida</span>
                                    </div>
                                    <div className="sm:text-right">
                                        <p className="text-[11px] text-slate-400 leading-none">
                                            Neto Provisional a Pagar
                                        </p>
                                        <p className="text-lg font-extrabold text-emerald-700 mt-0.5">
                                            {formatUsd(balanceData.netoPagar)} USD
                                        </p>
                                    </div>
                                </div>

                                {/* Barra segmentada */}
                                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                                    <div
                                        className="h-full bg-emerald-600 transition-all duration-300"
                                        style={{ width: `${balanceData.pctFlete}%` }}
                                    />
                                    <div
                                        className="h-full bg-orange-500 transition-all duration-300"
                                        style={{ width: `${balanceData.pctAnticipos}%` }}
                                    />
                                    <div
                                        className="h-full bg-sky-700 transition-all duration-300"
                                        style={{ width: `${balanceData.pctDeducciones}%` }}
                                    />
                                </div>

                                {/* Leyenda */}
                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                                        <span>
                                            {balanceData.pctFlete}% Flete Neto (
                                            {formatUsd(balanceData.netoPagar, 0)})
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                        <span>
                                            {balanceData.pctAnticipos}% Anticipos (
                                            {formatUsd(balanceData.anticiposBarra, 0)})
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-sky-700" />
                                        <span>
                                            {balanceData.pctDeducciones}% Deducciones Legales (
                                            {formatUsd(resumenActual.deduccionesUsd, 0)})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* PRE-AUDITORÍA DE OPERADORES ASIGNADOS */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Pre-Auditoría de Operadores Asignados
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Muestreo preliminar para verificación previa al cierre
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/costs')}
                                        className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>Ver los {resumenActual.choferesCount} Choferes</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                <th className="py-2.5 pr-3">OPERADOR MACK</th>
                                                <th className="py-2.5 px-3">UNIDAD</th>
                                                <th className="py-2.5 px-3 text-center">VIAJES</th>
                                                <th className="py-2.5 px-3 text-right">FLETE BRUTO</th>
                                                <th className="py-2.5 px-3 text-right">ANTICIPOS</th>
                                                <th className="py-2.5 pl-3 text-right">NETO USD</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs">
                                            {resumenActual.operadoresMuestra.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="py-6 text-center text-slate-400 text-xs"
                                                    >
                                                        Aún no hay cálculos registrados en este período.
                                                    </td>
                                                </tr>
                                            ) : (
                                                resumenActual.operadoresMuestra.map((op) => (
                                                    <tr
                                                        key={op.cedula}
                                                        className="hover:bg-slate-50/70 transition-colors"
                                                    >
                                                        <td className="py-3 pr-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <span
                                                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${op.colorAvatar}`}
                                                                >
                                                                    {op.iniciales}
                                                                </span>
                                                                <div className="font-medium text-slate-800">
                                                                    {op.nombre}{' '}
                                                                    <span className="text-slate-400 font-normal">
                                                                        ({op.cedula})
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                                                            {op.unidad}
                                                        </td>
                                                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                                                            {op.viajes}
                                                        </td>
                                                        <td className="py-3 px-3 text-right font-semibold text-slate-800">
                                                            {formatUsd(op.fleteBrutoUsd)}
                                                        </td>
                                                        <td className="py-3 px-3 text-right font-semibold text-orange-600">
                                                            -{formatUsd(op.anticiposUsd)}
                                                        </td>
                                                        <td className="py-3 pl-3 text-right font-bold text-emerald-700">
                                                            {formatUsd(op.netoUsd)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* BARRA INFERIOR DE AUDITORÍA Y CIERRE OFICIAL */}
                            <footer className="bg-white rounded-2xl border border-slate-200/80 shadow-xs px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <History className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span>
                                        Creado: {formatFechaCortaHora(procesoActual.createdAt)} por{' '}
                                        {resumenActual.creadoPor} • Última mod:{' '}
                                        {formatFechaCortaHora(procesoActual.updateAt)} (&apos;update_at&apos;)
                                    </span>
                                </div>

                                {procesoActual.fechaCierreP === null ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setErrorCierre(null);
                                            setModalCierreAbierto(true);
                                        }}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs transition cursor-pointer shrink-0"
                                    >
                                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                                        <span>Cerrar y Liquidar Proceso Oficialmente</span>
                                    </button>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold shrink-0">
                                        <Lock className="w-3.5 h-3.5" />
                                        <span>Proceso Cerrado Oficialmente</span>
                                    </span>
                                )}
                            </footer>
                        </>
                    )}
                </section>
            </div>

            {/* MODAL: APERTURAR NUEVO PERÍODO DE NÓMINA */}
            {modalAperturaAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Aperturar Nuevo Período de Nómina
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Registra un nuevo ciclo en{' '}
                                    <span className="font-mono">nominas_procesos</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalAperturaAbierto(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitApertura} className="p-5 space-y-4">
                            {errorApertura && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{errorApertura}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Tipo de Nómina (id_codnomina)
                                </label>
                                <select
                                    value={formApertura.idCodnomina}
                                    onChange={(e) =>
                                        setFormApertura((prev) => ({
                                            ...prev,
                                            idCodnomina: e.target.value,
                                        }))
                                    }
                                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                                >
                                    {tiposNomina.map((nomina) => (
                                        <option
                                            key={nomina.idCodnomina}
                                            value={nomina.idCodnomina}
                                        >
                                            {nomina.idCodnomina} -{' '}
                                            {nomina.descripcion?.trim() || nomina.modalidad}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Código de Proceso (cod_procesonomina, máx 9 chars)
                                </label>
                                <input
                                    type="text"
                                    maxLength={9}
                                    required
                                    placeholder="Ej: 2026-Q12"
                                    value={formApertura.codProcesonomina}
                                    onChange={(e) =>
                                        setFormApertura((prev) => ({
                                            ...prev,
                                            codProcesonomina: e.target.value.toUpperCase(),
                                        }))
                                    }
                                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Fecha Inicio (fecha_InicioP)
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formApertura.fechaInicioP}
                                        onChange={(e) =>
                                            setFormApertura((prev) => ({
                                                ...prev,
                                                fechaInicioP: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Fecha Fin (fecha_FinP)
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formApertura.fechaFinP}
                                        onChange={(e) =>
                                            setFormApertura((prev) => ({
                                                ...prev,
                                                fechaFinP: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setModalAperturaAbierto(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardandoApertura}
                                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer"
                                >
                                    {guardandoApertura && (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    )}
                                    <span>Aperturar Período</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CONFIRMAR CIERRE OFICIAL */}
            {modalCierreAbierto && procesoActual && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden p-5 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Cerrar Proceso {procesoActual.codProcesonomina}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Al sellar la liquidación se registrará{' '}
                                    <span className="font-mono font-semibold">fecha_CierreP</span> y
                                    no podrán modificarse los cálculos de este período.
                                </p>
                            </div>
                        </div>

                        {errorCierre && (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{errorCierre}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={() => setModalCierreAbierto(false)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={cerrandoProceso}
                                onClick={handleConfirmarCierre}
                                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer"
                            >
                                {cerrandoProceso && (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                )}
                                <span>Confirmar Cierre Oficial</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
