import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    FileUp,
    Download,
    Users,
    UserPlus,
    IdCard,
    Truck,
    RotateCcw,
    CheckCircle2,
    AlertTriangle,
    Clock,
    ArrowRight,
    Eye,
    ExternalLink,
    Sparkles,
    Calendar,
    Layers,
    TrendingUp,
    Check,
    FileCheck
} from 'lucide-react';

// Tipos de Viajes en la Matriz
export interface ViajeProgramado {
    id: string;
    nroTransporte: string;
    estadoZarpe: 'LISTO PARA ZARPE' | 'SIN CONDUCTOR ASIGNADO' | 'PENDIENTE BATEA' | 'COMPLETADO & VERIFICADO';
    origen: string;
    destino: string;
    ventanaHoraria: string;
    urgenciaHoras?: string;
    distanciaKm?: string;
    corredor?: string;
    retornoInfo?: string;
    conductor?: {
        nombre: string;
        categoria: string;
        horasReposo: number;
        telefono?: string;
    } | null;
    chuto?: string | null;
    batea?: string | null;
    dieselLts?: string | null;
    alertaFalta?: string | null;
}

// Datos iniciales idénticos al diseño operativo
const VIAJES_MOCK_INICIALES: ViajeProgramado[] = [
    {
        id: 'tr-0481',
        nroTransporte: 'TR-2025-0481',
        estadoZarpe: 'LISTO PARA ZARPE',
        origen: 'San Joaquín (Planta)',
        destino: 'Los Cortijos (CEDI)',
        ventanaHoraria: 'Hoy • 14:00 hrs',
        retornoInfo: 'Retorno: TR-2025-0485 (Paletas vacías)',
        conductor: {
            nombre: 'Carlos Mendoza',
            categoria: 'Cat. 5',
            horasReposo: 14,
            telefono: '+58 414-5692118'
        },
        chuto: 'Chuto Mack MP8 #44',
        batea: 'Batea Tolva #18',
        dieselLts: '66.5 Lts Diésel'
    },
    {
        id: 'tr-0482',
        nroTransporte: 'TR-2025-0482',
        estadoZarpe: 'SIN CONDUCTOR ASIGNADO',
        origen: 'Cagua (Almacén Central)',
        destino: 'Valencia (Distribuidora)',
        ventanaHoraria: 'Hoy • 15:30 hrs',
        urgenciaHoras: 'En 1h 45m',
        corredor: 'Troncal 1',
        distanciaKm: '140 km',
        conductor: null,
        chuto: 'Chuto Mack #19',
        batea: 'Batea Granelera #03',
        dieselLts: '100% Tanque'
    },
    {
        id: 'tr-0483',
        nroTransporte: 'TR-2025-0483',
        estadoZarpe: 'PENDIENTE BATEA',
        origen: 'San Joaquín (Planta)',
        destino: 'Barquisimeto (CEDI Oeste)',
        ventanaHoraria: 'Mañana • 06:00 hrs',
        conductor: {
            nombre: 'Andrés Rivas',
            categoria: 'Cat. 5',
            horasReposo: 16,
            telefono: '+58 412-8874120'
        },
        chuto: 'Chuto Mack MP8 #31',
        batea: null,
        alertaFalta: 'Falta Acoplar Batea Tolva #24'
    },
    {
        id: 'tr-0484',
        nroTransporte: 'TR-2025-0484',
        estadoZarpe: 'COMPLETADO & VERIFICADO',
        origen: 'Guacara (Envases)',
        destino: 'San Joaquín (Planta)',
        ventanaHoraria: 'Hoy • 18:30 hrs',
        conductor: {
            nombre: 'Héctor Páez',
            categoria: 'Cat. 5',
            horasReposo: 15,
            telefono: '+58 424-9112233'
        },
        chuto: 'Chuto Mack #07',
        batea: 'Batea #09',
        dieselLts: '100% Recursos Listos'
    },
    {
        id: 'tr-0485',
        nroTransporte: 'TR-2025-0485',
        estadoZarpe: 'LISTO PARA ZARPE',
        origen: 'Los Cortijos (CEDI)',
        destino: 'San Joaquín (Planta)',
        ventanaHoraria: 'Hoy • 20:00 hrs',
        retornoInfo: 'Retorno de TR-2025-0481 con paletas vacías',
        conductor: {
            nombre: 'Carlos Mendoza',
            categoria: 'Cat. 5',
            horasReposo: 14,
            telefono: '+58 414-5692118'
        },
        chuto: 'Chuto Mack MP8 #44',
        batea: 'Batea Tolva #18',
        dieselLts: '60.0 Lts Diésel'
    },
    {
        id: 'tr-0486',
        nroTransporte: 'TR-2025-0486',
        estadoZarpe: 'SIN CONDUCTOR ASIGNADO',
        origen: 'Puerto Cabello (Muelle 4)',
        destino: 'San Joaquín (Planta)',
        ventanaHoraria: 'Mañana • 07:30 hrs',
        corredor: 'Autopista Valencia - Pto. Cabello',
        distanciaKm: '75 km',
        conductor: null,
        chuto: 'Chuto Mack #28',
        batea: 'Batea Tolva #02',
        dieselLts: '95% Tanque'
    }
];

export default function InicialProgramacion() {
    const navigate = useNavigate();

    // Estados
    const [viajes] = useState<ViajeProgramado[]>(VIAJES_MOCK_INICIALES);
    const [filtroActivo, setFiltroActivo] = useState<'todos' | 'sin-conductor' | 'pendientes'>('todos');
    const [verTodos, setVerTodos] = useState(false);
    const [toastMensaje, setToastMensaje] = useState<string | null>(null);

    // Estados de hover en botones para animar agrandamiento del botón y de la sombra redonda
    const [hoverBtn1, setHoverBtn1] = useState(false);
    const [hoverBtn2, setHoverBtn2] = useState(false);
    const [hoverBtn3, setHoverBtn3] = useState(false);

    // Notificación toast rápida
    const mostrarToast = (mensaje: string) => {
        setToastMensaje(mensaje);
        setTimeout(() => {
            setToastMensaje(null);
        }, 3500);
    };

    // Filtrado de viajes
    const viajesFiltrados = useMemo(() => {
        let lista = viajes;
        if (filtroActivo === 'sin-conductor') {
            lista = lista.filter((v) => v.estadoZarpe === 'SIN CONDUCTOR ASIGNADO');
        } else if (filtroActivo === 'pendientes') {
            lista = lista.filter((v) => v.estadoZarpe === 'PENDIENTE BATEA' || v.estadoZarpe === 'SIN CONDUCTOR ASIGNADO');
        }

        if (!verTodos) {
            return lista.slice(0, 4);
        }
        return lista;
    }, [viajes, filtroActivo, verTodos]);

    // Contadores para filtros y métricas
    const totalSinConductor = useMemo(
        () => viajes.filter((v) => v.estadoZarpe === 'SIN CONDUCTOR ASIGNADO').length,
        [viajes]
    );
    const totalPendientesRecurso = useMemo(
        () => viajes.filter((v) => v.estadoZarpe === 'PENDIENTE BATEA').length,
        [viajes]
    );

    // Exportar Matriz PDF simulado
    const handleExportarPDF = () => {
        mostrarToast('Generando reporte PDF consolidado de matriz activa W-08...');
        setTimeout(() => {
            window.print();
        }, 600);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Toast Notificación */}
            {toastMensaje && (
                <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{toastMensaje}</span>
                </div>
            )}

            {/* 1. Breadcrumbs & Recarga */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-200/80 pb-3">
                <div className="flex items-center space-x-2 text-[11px] font-bold tracking-wider uppercase text-gray-400">
                    <span className="hover:text-gray-600 transition cursor-pointer">Logístico</span>
                    <span className="text-gray-300 font-normal">&gt;</span>
                    <span className="hover:text-gray-600 transition cursor-pointer">Programación de Viajes</span>
                    <span className="text-gray-300 font-normal">&gt;</span>
                    <span className="text-orange-600 font-extrabold">Panel de Control Operativo</span>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={() => mostrarToast('Matriz de despacho sincronizada con patio en tiempo real')}
                        title="Actualizar datos"
                        className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 shadow-2xs transition"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* 2. Header & Título Principal */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    {/* Pill superior */}
                    <div className="inline-flex items-center space-x-1.5 bg-orange-50 border border-orange-200/60 px-3 py-1 rounded-full mb-2">
                        <Sparkles className="w-3 h-3 text-orange-600" />
                        <span className="text-[11px] font-bold tracking-wide uppercase text-orange-700">
                            Centro de Despacho & Control Troncal
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                        Dashboard de Programación & Mesa de Despacho
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-3xl leading-relaxed">
                        Supervisión integral de manifiestos ingresados, asignación de tripulación y orquestación de recursos de tracción y carga en tiempo real.
                    </p>
                </div>

                {/* Estado Despacho Central */}
                <div className="flex items-center space-x-2 self-start lg:self-center bg-white px-3.5 py-2 rounded-xl border border-gray-200/80 shadow-2xs">
                    <span className="text-xs font-semibold text-gray-500">Despacho Central:</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Patio Transporte Teles (Activo)
                    </span>
                </div>
            </div>

            {/* 3. Tres Tarjetas de Acción de Nivel Superior (Hero Action Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Tarjeta 1: Carga de Manifiesto Maestro */}
                <div className="relative bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
                    {/* Barra superior de color naranja */}
                    <div className="h-1.5 w-full bg-[#f97316]" />

                    {/* Sombra / círculo redondo de color en la esquina inferior derecha con efecto agrandamiento al hover */}
                    <div
                        className={`absolute -bottom-10 -right-10 w-44 h-44 rounded-full pointer-events-none transition-all duration-300 ease-out ${hoverBtn1 ? 'scale-140 bg-[#fed7aa]/80 shadow-lg' : 'scale-100 bg-[#fed7aa]/50'
                            }`}
                    />

                    <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between relative z-10">
                        <div>
                            {/* Cabecera de la tarjeta: Icono e Ingesta Pill */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="w-12 h-12 rounded-2xl bg-[#fef0e6] flex items-center justify-center shrink-0">
                                    <FileUp className="w-6 h-6 text-[#9a3412]" strokeWidth={2.2} />
                                </div>
                                <span className="text-[10px] font-extrabold text-[#334e68] bg-[#edf2fe] border border-[#dbe4f9] px-3 py-1 rounded-full uppercase tracking-wider">
                                    Ingesta PDF / Excel .xlsx
                                </span>
                            </div>

                            {/* Título de la tarjeta */}
                            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug mt-4">
                                Carga de Manifiesto<br />Maestro
                            </h3>

                            {/* Descripción */}
                            <p className="text-[12.5px] text-slate-500 font-normal leading-relaxed mt-2.5">
                                Importación masiva de guías de despacho, geocercas de origen/destino y ventanas horarias de embarque troncal.
                            </p>
                        </div>

                        {/* Parte inferior: Botón Principal y Subtexto */}
                        <div className="mt-6 space-y-3">
                            <button
                                type="button"
                                onMouseEnter={() => setHoverBtn1(true)}
                                onMouseLeave={() => setHoverBtn1(false)}
                                onClick={() => navigate('/viajes/programacion/editor')}
                                className="w-full bg-[#f97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs sm:text-sm font-bold py-3.5 px-4 rounded-xl shadow-md shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/40 flex items-center justify-center space-x-2 transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                            >
                                <FileUp className="w-4 h-4 text-white shrink-0" strokeWidth={2.4} />
                                <span>Importar Manifiesto</span>
                            </button>

                            <div className="flex items-center justify-between text-[11.5px] text-slate-500 pt-1">
                                <button
                                    type="button"
                                    onClick={() => navigate('/viajes/programacion/editor')}
                                    className="font-medium text-slate-600 hover:text-orange-600 transition truncate text-left cursor-pointer"
                                >
                                    Ver historial de cargas (Lote #492)
                                </button>
                                <span className="font-semibold text-slate-600 flex items-center gap-1 shrink-0">
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" /> CSV, XLSX, XML
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tarjeta 2: Asignación de Conductores */}
                <div className="relative bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
                    {/* Barra superior de color azul petróleo / teal */}
                    <div className="h-1.5 w-full bg-[#0e5873]" />

                    {/* Sombra / círculo redondo de color en la esquina inferior derecha con efecto agrandamiento al hover */}
                    <div
                        className={`absolute -bottom-10 -right-10 w-44 h-44 rounded-full pointer-events-none transition-all duration-300 ease-out ${hoverBtn2 ? 'scale-140 bg-[#bae6fd]/80 shadow-lg' : 'scale-100 bg-[#bae6fd]/50'
                            }`}
                    />

                    <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between relative z-10">
                        <div>
                            {/* Cabecera de la tarjeta: Icono y Badge de asignación con punto naranja */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="w-12 h-12 rounded-2xl bg-[#e1f3f9] flex items-center justify-center shrink-0">
                                    <IdCard className="w-6 h-6 text-[#084c61]" strokeWidth={2.2} />
                                </div>
                                <div className="bg-[#fff8e7] border border-[#fef08a]/60 px-3 py-1 rounded-full flex items-center space-x-2">
                                    <span className="w-2 h-2 rounded-full bg-[#f97316] shrink-0" />
                                    <div className="text-[10px] font-extrabold text-[#92400e] uppercase tracking-wider leading-tight text-left">
                                        <div>15/18 Asignados • 3</div>
                                        <div>Pendientes</div>
                                    </div>
                                </div>
                            </div>

                            {/* Título de la tarjeta */}
                            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug mt-4">
                                Asignación de Conductores
                            </h3>

                            {/* Descripción */}
                            <p className="text-[12.5px] text-slate-500 font-normal leading-relaxed mt-2.5">
                                Vinculación de operadores certificados según horas de reposo, aptitud médica y calificación de corredor vial troncal.
                            </p>
                        </div>

                        {/* Parte inferior: Botón Principal y Subtexto */}
                        <div className="mt-6 space-y-3">
                            <button
                                type="button"
                                onMouseEnter={() => setHoverBtn2(true)}
                                onMouseLeave={() => setHoverBtn2(false)}
                                onClick={() => navigate('/viajes/programacion/asignacion-conductores')}
                                className="w-full bg-[#0e3b52] hover:bg-[#092e40] active:bg-[#031118] text-white text-xs sm:text-sm font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-xl hover:shadow-slate-900/30 flex items-center justify-center space-x-2 transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                            >
                                <IdCard className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2.2} />
                                <span>Asignación  de Choferes</span>
                            </button>

                            <div className="flex items-center justify-between text-[11.5px] text-slate-500 pt-1">
                                <span className="font-medium text-slate-600 truncate">
                                    Pruebas Conductores: <strong className="text-slate-900 font-bold">100% OK</strong>
                                </span>
                                <span className="font-semibold text-teal-700 shrink-0">
                                    Base <span className="text-teal-600">Valencia • Patio 1</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tarjeta 3: Asignación de Recursos de Flota */}
                <div className="relative bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
                    {/* Barra superior de color verde bosque */}
                    <div className="h-1.5 w-full bg-[#0b6641]" />

                    {/* Sombra / círculo redondo de color en la esquina inferior derecha con efecto agrandamiento al hover */}
                    <div
                        className={`absolute -bottom-10 -right-10 w-44 h-44 rounded-full pointer-events-none transition-all duration-300 ease-out ${hoverBtn3 ? 'scale-140 bg-[#a7f3d0]/80 shadow-lg' : 'scale-100 bg-[#a7f3d0]/50'
                            }`}
                    />

                    <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between relative z-10">
                        <div>
                            {/* Cabecera de la tarjeta: Icono y Pill */}f
                            <div className="flex items-start justify-between gap-2">
                                <div className="w-12 h-12 rounded-2xl bg-[#cbf7dc] flex items-center justify-center shrink-0">
                                    <Truck className="w-6 h-6 text-[#0b6641]" strokeWidth={2.2} />
                                </div>
                                <span className="text-[10px] font-extrabold text-[#0b6641] bg-[#e1f9ee] border border-[#a7f3d0] px-3 py-1 rounded-full uppercase tracking-wider">
                                    Unidades, Bateas & Diésel
                                </span>
                            </div>

                            {/* Título de la tarjeta */}
                            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug mt-4">
                                Asignación de Recursos del<br />Viaje
                            </h3>

                            {/* Descripción */}
                            <p className="text-[12.5px] text-slate-500 font-normal leading-relaxed mt-2.5">
                                Asignación de Recursos: viaticos, combustible, caletas y Otros gastos requeridos durante el viaje.
                            </p>
                        </div>

                        {/* Parte inferior: Botón Principal y Subtexto */}
                        <div className="mt-6 space-y-3">
                            <button
                                type="button"
                                onMouseEnter={() => setHoverBtn3(true)}
                                onMouseLeave={() => setHoverBtn3(false)}
                                onClick={() => navigate('/viajes/asignacion-recursos')}
                                className="w-full bg-[#0b6641] hover:bg-[#074e30] active:bg-[#053823] text-white text-xs sm:text-sm font-bold py-3.5 px-4 rounded-xl shadow-md shadow-emerald-950/20 hover:shadow-xl hover:shadow-emerald-900/40 flex items-center justify-center space-x-2 transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                            >
                                <Truck className="w-4 h-4 text-white shrink-0" strokeWidth={2.2} />
                                <span>Asignación de Recursos & Recargos</span>
                            </button>

                            <div className="flex items-center justify-between text-[11.5px] text-slate-500 pt-1">
                                <span className="font-medium text-slate-600 truncate">
                                    Autonomía promedio: <strong className="text-slate-900 font-bold">680 km</strong>
                                </span>
                                <span className="font-medium text-slate-500 shrink-0">
                                    Tanque lleno requerido
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Strip de Métricas y KPIs Operativos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1 */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-gray-500 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Total Viajes Planificados</span>
                        <RotateCcw className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-black text-gray-900">42</span>
                        <span className="text-xs font-bold text-emerald-600">+6 vs. ciclo ant.</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-gray-100 text-[11px]">
                        <span className="bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-md">36 Troncales</span>
                        <span className="bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-md">6 Locales Urb.</span>
                    </div>
                </div>

                {/* KPI 2 */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-gray-500 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Conductores Asignados</span>
                        <Users className="w-4 h-4 text-sky-600" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-black text-gray-900">88%</span>
                        <span className="text-xs font-bold text-amber-600">5 Pendientes</span>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-100">
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-sky-600 h-1.5 rounded-full" style={{ width: '88%' }}></div>
                        </div>
                    </div>
                </div>

                {/* KPI 3 */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-gray-500 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Recursos de Carga</span>
                        <Layers className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-black text-gray-900">92%</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Óptimo
                        </span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 text-xs">
                        <span className="text-gray-500 font-medium">Tractos 42/42</span>
                        <span className="text-emerald-700 font-bold">Bateas 39/42</span>
                    </div>
                </div>

                {/* KPI 4 */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-gray-500 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Ventana de Zarpe</span>
                        <Clock className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-black text-gray-900">97.4%</span>
                        <span className="text-xs font-bold text-emerald-600">A tiempo</span>
                    </div>
                    <div className="flex items-center space-x-1.5 mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="truncate">0 retrasos críticos en patio hoy</span>
                    </div>
                </div>
            </div>

            {/* 5. Área Principal Dividida: Matriz de Viajes (Izquierda) + Disponibilidad en Patio (Derecha) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Columna Izquierda: Matriz de Viajes Activos en Planificación (8 cols) */}
                <div className="lg:col-span-8 space-y-4">
                    {/* Header de la Matriz con Tabs de Filtro */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                                Matriz de Viajes Activos en Planificación
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Programación horaria para la ventana de despacho de hoy y mañana
                            </p>
                        </div>

                        <div className="flex items-center space-x-1.5 p-1 bg-gray-100/80 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setFiltroActivo('todos')}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${filtroActivo === 'todos'
                                    ? 'bg-white text-gray-900 shadow-xs'
                                    : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                Todos los Viajes ({viajes.length})
                            </button>

                            <button
                                type="button"
                                onClick={() => setFiltroActivo('sin-conductor')}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${filtroActivo === 'sin-conductor'
                                    ? 'bg-white text-gray-900 shadow-xs'
                                    : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                Sin Conductor ({totalSinConductor})
                            </button>

                            <button
                                type="button"
                                onClick={() => setFiltroActivo('pendientes')}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${filtroActivo === 'pendientes'
                                    ? 'bg-white text-gray-900 shadow-xs'
                                    : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                Sin Recurso ({totalPendientesRecurso})
                            </button>
                        </div>
                    </div>

                    {/* Lista de Tarjetas de Viaje */}
                    <div className="space-y-3.5">
                        {viajesFiltrados.map((viaje) => (
                            <div
                                key={viaje.id}
                                className={`bg-white rounded-2xl border p-4 shadow-xs transition-all duration-150 hover:shadow-md ${viaje.estadoZarpe === 'SIN CONDUCTOR ASIGNADO'
                                    ? 'border-orange-200/90 bg-orange-50/10'
                                    : viaje.estadoZarpe === 'PENDIENTE BATEA'
                                        ? 'border-purple-200/90'
                                        : 'border-gray-200/80'
                                    }`}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    {/* Bloque Izquierdo: Icono + Código + Ruta y Horario */}
                                    <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                                        {/* Icono de Estado */}
                                        <div className="shrink-0 mt-0.5">
                                            {viaje.estadoZarpe === 'LISTO PARA ZARPE' && (
                                                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                                                </div>
                                            )}
                                            {viaje.estadoZarpe === 'SIN CONDUCTOR ASIGNADO' && (
                                                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                                                    <UserPlus className="w-5 h-5 stroke-[2.5]" />
                                                </div>
                                            )}
                                            {viaje.estadoZarpe === 'PENDIENTE BATEA' && (
                                                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                                                    <Layers className="w-5 h-5 stroke-[2.5]" />
                                                </div>
                                            )}
                                            {viaje.estadoZarpe === 'COMPLETADO & VERIFICADO' && (
                                                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                                                    <FileCheck className="w-5 h-5 stroke-[2.5]" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info de Ruta */}
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs font-bold text-gray-900 tracking-tight">
                                                    {viaje.nroTransporte}
                                                </span>

                                                {/* Píldora de Estado */}
                                                {viaje.estadoZarpe === 'LISTO PARA ZARPE' && (
                                                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                                                        LISTO PARA ZARPE
                                                    </span>
                                                )}
                                                {viaje.estadoZarpe === 'SIN CONDUCTOR ASIGNADO' && (
                                                    <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                                                        SIN CONDUCTOR ASIGNADO
                                                    </span>
                                                )}
                                                {viaje.estadoZarpe === 'PENDIENTE BATEA' && (
                                                    <span className="text-[10px] font-extrabold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                                                        PENDIENTE BATEA
                                                    </span>
                                                )}
                                                {viaje.estadoZarpe === 'COMPLETADO & VERIFICADO' && (
                                                    <span className="text-[10px] font-extrabold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                                                        COMPLETADO & VERIFICADO
                                                    </span>
                                                )}
                                            </div>

                                            {/* Origen -> Destino */}
                                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-900 font-bold">
                                                <span>{viaje.origen}</span>
                                                <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span>{viaje.destino}</span>
                                            </div>

                                            {/* Sub-información de Ventana Horaria y Retorno */}
                                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                                                <div className="flex items-center space-x-1">
                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                    <span>{viaje.ventanaHoraria}</span>
                                                    {viaje.urgenciaHoras && (
                                                        <span className="text-amber-700 font-bold">({viaje.urgenciaHoras})</span>
                                                    )}
                                                </div>

                                                {viaje.retornoInfo && (
                                                    <>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="text-gray-600 font-medium">{viaje.retornoInfo}</span>
                                                    </>
                                                )}

                                                {viaje.corredor && (
                                                    <>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="text-gray-600">{viaje.corredor} - {viaje.distanciaKm}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bloque Central/Derecho: Asignaciones de Flota & Acciones */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                                        {/* Información de Conductor y Vehículo */}
                                        <div className="text-left md:text-right space-y-1">
                                            {viaje.conductor ? (
                                                <div className="flex items-center md:justify-end space-x-1.5 text-xs font-bold text-gray-900">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                    <span>{viaje.conductor.nombre}</span>
                                                    <span className="text-[11px] font-medium text-gray-500">
                                                        ({viaje.conductor.categoria} • Reposo {viaje.conductor.horasReposo}h)
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="text-xs font-bold text-amber-700">
                                                    No asignado a la unidad
                                                </div>
                                            )}

                                            {/* Chuto, Batea y Diésel */}
                                            <div className="flex flex-wrap items-center md:justify-end gap-1.5 text-[11px] text-gray-600">
                                                {viaje.chuto && <span>{viaje.chuto}</span>}
                                                {viaje.batea && (
                                                    <>
                                                        <span className="text-gray-300">|</span>
                                                        <span>{viaje.batea}</span>
                                                    </>
                                                )}
                                                {viaje.dieselLts && (
                                                    <>
                                                        <span className="text-gray-300">|</span>
                                                        <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                                            {viaje.dieselLts}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Alerta si falta algo */}
                                            {viaje.alertaFalta && (
                                                <div className="text-xs font-bold text-amber-600 flex items-center md:justify-end space-x-1">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                                    <span>{viaje.alertaFalta}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Botones de Acción Directa */}
                                        <div className="flex items-center space-x-2">
                                            {viaje.estadoZarpe === 'LISTO PARA ZARPE' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => mostrarToast(`Detalles de viaje ${viaje.nroTransporte} en preparación`)}
                                                        className="text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs flex items-center space-x-1.5 transition cursor-pointer"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                                                        <span>Detalle</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            mostrarToast(`Generando Hoja de Ruta Troncal para ${viaje.nroTransporte}...`);
                                                        }}
                                                        className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
                                                    >
                                                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                                                        <span>Hoja de Ruta</span>
                                                    </button>
                                                </>
                                            )}

                                            {viaje.estadoZarpe === 'SIN CONDUCTOR ASIGNADO' && (
                                                <button
                                                    type="button"
                                                    onClick={() => mostrarToast(`Asignación de chofer para ${viaje.nroTransporte} en preparación`)}
                                                    className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-orange-500/20 flex items-center space-x-1.5 transition cursor-pointer"
                                                >
                                                    <UserPlus className="w-3.5 h-3.5" />
                                                    <span>Asignar Chofer Urgente</span>
                                                </button>
                                            )}

                                            {viaje.estadoZarpe === 'PENDIENTE BATEA' && (
                                                <button
                                                    type="button"
                                                    onClick={() => mostrarToast(`Asignación de batea para ${viaje.nroTransporte} en preparación`)}
                                                    className="bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md flex items-center space-x-1.5 transition cursor-pointer"
                                                >
                                                    <Layers className="w-3.5 h-3.5" />
                                                    <span>Asignar Batea</span>
                                                </button>
                                            )}

                                            {viaje.estadoZarpe === 'COMPLETADO & VERIFICADO' && (
                                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-xl inline-flex items-center space-x-1">
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span>100% Recursos Listos</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer de la Matriz con Botones de Exportación */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                        <span className="text-xs text-gray-500 font-medium">
                            Mostrando {viajesFiltrados.length} de 42 viajes programados en la matriz activa W-08.
                        </span>

                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
                                onClick={handleExportarPDF}
                                className="text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-xl shadow-2xs flex items-center space-x-1.5 transition"
                            >
                                <Download className="w-3.5 h-3.5 text-gray-500" />
                                <span>Exportar Matriz PDF</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setVerTodos(!verTodos)}
                                className="text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-xl shadow-2xs transition"
                            >
                                {verTodos ? 'Ver Menos' : 'Ver Todos los 42'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Disponibilidad Inmediata en Patio (4 cols) */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-base font-bold text-gray-900 tracking-tight">
                                Disponibilidad Inmediata en Patio
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                Recursos mecánicos y humanos sin asignación actual, listos para acople.
                            </p>
                        </div>

                        {/* Badge P verde */}
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                            P
                        </div>
                    </div>

                    {/* Bloque 1: Chutos Mack MP8 (Tractos) */}
                    <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-100 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2 font-bold text-gray-900">
                                <Truck className="w-4 h-4 text-gray-600" />
                                <span>Chutos Mack MP8 (Tractos)</span>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                                8 Libres / 50 Total
                            </span>
                        </div>

                        {/* Barra de Progreso */}
                        <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-700 h-1.5 rounded-full" style={{ width: '84%' }}></div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                            <span>42 en tránsito/despacho</span>
                            <span>8 disponibles patio San Joaquín</span>
                        </div>
                    </div>

                    {/* Bloque 2: Bateas Disponibles */}
                    <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-100 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2 font-bold text-gray-900">
                                <Layers className="w-4 h-4 text-blue-600" />
                                <span>Bateas Disponibles</span>
                            </div>
                            <span className="text-[11px] font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md">
                                12 Libres
                            </span>
                        </div>

                        {/* Barra de Progreso */}
                        <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '70%' }}></div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                            <span>5 Tolvas granel</span>
                            <span>7 Plataformas paleteras</span>
                        </div>
                    </div>

                    {/* Bloque 3: Conductores en Guardia */}
                    <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-100 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2 font-bold text-gray-900">
                                <Users className="w-4 h-4 text-orange-600" />
                                <span>Conductores en Guardia</span>
                            </div>
                            <span className="text-[11px] font-bold text-orange-800 bg-orange-100/80 px-2 py-0.5 rounded-md">
                                6 Listos
                            </span>
                        </div>

                        <p className="text-[11px] text-gray-500 leading-relaxed pt-1">
                            Cumplen &gt;12 hrs reposo. Aptos salida inmediata
                        </p>
                    </div>

                    {/* Botón CTA Inferior */}
                    <button
                        type="button"
                        onClick={() => mostrarToast('Radar de patio y bahías sincronizado')}
                        className="w-full bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-2xs cursor-pointer"
                    >
                        <span>Abrir Radar de Patio & Bahías</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}