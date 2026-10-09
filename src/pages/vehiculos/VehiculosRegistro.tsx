import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Truck,
    Container,
    Calendar,
    CreditCard,
    Fingerprint,
    Gauge,
    Weight,
    Layers,
    Activity,
    PlusCircle,
    FileText,
    X,
    ChevronDown,
    AlertCircle,
    CheckCircle2,
    Car,
    Check,
} from 'lucide-react';
import {
    SelectorImagen,
} from '../../components/ui';
import {
    vehiculosService,
    type Vehiculo,
    type TipoVehiculo,
    type ClasificacionVehiculo,
    type TipoUnidad,
} from '../../services/vehiculosService';
import { getApiErrorMessage } from '../../services/api';

const DRAFT_STORAGE_KEY = 'flotacontrol_vehiculo_registro_draft';

export default function VehiculosRegistro() {
    const navigate = useNavigate();

    // Referencias para navegación secuencial con Enter
    const placaRef = useRef<HTMLInputElement>(null);
    const anioRef = useRef<HTMLInputElement>(null);
    const marcaRef = useRef<HTMLInputElement>(null);
    const modeloRef = useRef<HTMLInputElement>(null);
    const chasisRef = useRef<HTMLInputElement>(null);
    const motorRef = useRef<HTMLInputElement>(null);
    const cargaRef = useRef<HTMLInputElement>(null);
    const arrastreRef = useRef<HTMLInputElement>(null);
    const estadoRef = useRef<HTMLSelectElement>(null);
    const acopladoRef = useRef<HTMLSelectElement>(null);
    const submitBtnRef = useRef<HTMLButtonElement>(null);

    const handleKeyDownNext = (
        e: React.KeyboardEvent,
        target: React.RefObject<HTMLElement | null>
    ) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            target.current?.focus();
        }
    };

    // Estados de datos maestros
    const [tiposVehiculo, setTiposVehiculo] = useState<TipoVehiculo[]>([]);
    const [clasificaciones, setClasificaciones] = useState<ClasificacionVehiculo[]>([]);
    const [vehiculosExistentes, setVehiculosExistentes] = useState<Vehiculo[]>([]);
    const [acopladosExistentes, setAcopladosExistentes] = useState<Vehiculo[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Estado del formulario
    const [idTipoSeleccionado, setIdTipoSeleccionado] = useState<number>(1); // 1 = Unidad Motora por defecto
    const [idClasificacion, setIdClasificacion] = useState<number>(5);
    const [placa, setPlaca] = useState('');
    const [anio, setAnio] = useState<number>(new Date().getFullYear());
    const [marca, setMarca] = useState('');
    const [modelo, setModelo] = useState('');
    const [numeroChasis, setNumeroChasis] = useState('');
    const [numeroMotor, setNumeroMotor] = useState('');
    const [capacidadCarga, setCapacidadCarga] = useState<string>('32.0');
    const [capacidadArrastre, setCapacidadArrastre] = useState<string>('44.0');
    const [estado, setEstado] = useState<'Activo' | 'En_Ruta' | 'Mantenimiento' | 'Inactivo'>('Activo');
    const [idAcopladoActual, setIdAcopladoActual] = useState<string>('');

    // Telemetría toggle
    const [emparejamientoInmediato, setEmparejamientoInmediato] = useState(true);

    // Foto
    const [fotoArchivo, setFotoArchivo] = useState<File | null>(null);
    const [quitarFoto, setQuitarFoto] = useState(false);

    // Estados de interfaz y feedback
    const [guardando, setGuardando] = useState(false);
    const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
    const [mensajeExito, setMensajeExito] = useState<string | null>(null);
    const [borradorGuardado, setBorradorGuardado] = useState(false);

    // Cargar datos maestros al montar
    useEffect(() => {
        async function cargarDatosMaestros() {
            setLoadingData(true);
            try {
                const [tipos, clasifs, vehiculos] = await Promise.all([
                    vehiculosService.getTiposVehiculo().catch((e) => {
                        console.warn('Error cargando tipos de vehículos:', e);
                        return [] as TipoVehiculo[];
                    }),
                    vehiculosService.getClasificaciones().catch((e) => {
                        console.warn('Error cargando clasificaciones:', e);
                        return [] as ClasificacionVehiculo[];
                    }),
                    vehiculosService.getVehiculos().catch((e) => {
                        console.warn('Error cargando vehículos:', e);
                        return [] as Vehiculo[];
                    }),
                ]);

                if (tipos.length > 0) {
                    setTiposVehiculo(tipos);
                    const motora = tipos.find(
                        (t) => t.nombreTipo.toLowerCase().includes('motor') || Number(t.idTipo) === 1
                    );
                    const primerTipoId = motora ? Number(motora.idTipo) : Number(tipos[0].idTipo);
                    setIdTipoSeleccionado((prev) => (prev ? prev : primerTipoId));

                    // Buscar clasificación correspondiente válida
                    const matchingClasif = clasifs.find(
                        (c) => Number(c.idTipo) === Number(primerTipoId) && c.activo !== false
                    ) || clasifs[0];
                    if (matchingClasif) {
                        setIdClasificacion(matchingClasif.idClasificacion);
                    }
                }

                if (clasifs.length > 0) {
                    setClasificaciones(clasifs);
                }

                setVehiculosExistentes(vehiculos);

                // Filtrar acoplados para el selector de "Acoplado Asociado"
                const acoplados = vehiculos.filter((v) => {
                    const c = clasifs.find((cl) => Number(cl.idClasificacion) === Number(v.idClasificacion));
                    const tId = Number(c?.idTipo ?? v.idTipo ?? 1);
                    return tId === 2 || v.tipoUnidad === 'acoplado';
                });
                setAcopladosExistentes(acoplados);

                // Restaurar borrador si existe
                try {
                    const draftRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
                    if (draftRaw) {
                        const draft = JSON.parse(draftRaw);
                        if (draft.idTipoSeleccionado) setIdTipoSeleccionado(draft.idTipoSeleccionado);
                        if (draft.idClasificacion && clasifs.some((c) => Number(c.idClasificacion) === Number(draft.idClasificacion))) {
                            setIdClasificacion(Number(draft.idClasificacion));
                        }
                        if (draft.placa) setPlaca(draft.placa);
                        if (draft.anio) setAnio(draft.anio);
                        if (draft.marca) setMarca(draft.marca);
                        if (draft.modelo) setModelo(draft.modelo);
                        if (draft.numeroChasis) setNumeroChasis(draft.numeroChasis);
                        if (draft.numeroMotor) setNumeroMotor(draft.numeroMotor);
                        if (draft.capacidadCarga !== undefined) setCapacidadCarga(String(draft.capacidadCarga));
                        if (draft.capacidadArrastre !== undefined) setCapacidadArrastre(String(draft.capacidadArrastre));
                        if (draft.estado) setEstado(draft.estado);
                        if (draft.idAcopladoActual) setIdAcopladoActual(draft.idAcopladoActual);
                        if (draft.emparejamientoInmediato !== undefined) setEmparejamientoInmediato(draft.emparejamientoInmediato);
                    }
                } catch {
                    // Ignorar error al leer borrador
                }
            } catch (err) {
                console.error('Error al inicializar datos:', err);
            } finally {
                setLoadingData(false);
            }
        }

        cargarDatosMaestros();
    }, []);

    // Validación reactiva de placa duplicada
    const vehiculoConMismaPlaca = useMemo(() => {
        if (!placa.trim()) return null;
        const p = placa.trim().toUpperCase();
        return vehiculosExistentes.find((v) => v.placa.trim().toUpperCase() === p) ?? null;
    }, [placa, vehiculosExistentes]);

    // Validación reactiva de chasis duplicado
    const vehiculoConMismoChasis = useMemo(() => {
        if (!numeroChasis.trim()) return null;
        const c = numeroChasis.trim().toUpperCase();
        return vehiculosExistentes.find((v) => v.numeroChasis.trim().toUpperCase() === c) ?? null;
    }, [numeroChasis, vehiculosExistentes]);

    // Identificar dinámicamente los IDs de tipo según el catálogo maestro (por defecto 1 y 2)
    const idTipoMotora = useMemo(() => {
        const t = tiposVehiculo.find(
            (item) => item.nombreTipo.toLowerCase().includes('motor') || Number(item.idTipo) === 1
        );
        return t ? Number(t.idTipo) : 1;
    }, [tiposVehiculo]);

    const idTipoAcoplado = useMemo(() => {
        const t = tiposVehiculo.find(
            (item) =>
                item.nombreTipo.toLowerCase().includes('acopl') ||
                item.nombreTipo.toLowerCase().includes('remolque') ||
                Number(item.idTipo) === 2
        );
        return t ? Number(t.idTipo) : 2;
    }, [tiposVehiculo]);

    // Es unidad motora si el idTipo coincide con unidad motora o su nombre contiene "Motor"
    const esUnidadMotora = useMemo(() => {
        const tipo = tiposVehiculo.find((t) => Number(t.idTipo) === Number(idTipoSeleccionado));
        if (tipo) {
            return tipo.nombreTipo.toLowerCase().includes('motor') || Number(tipo.idTipo) === Number(idTipoMotora);
        }
        return Number(idTipoSeleccionado) === Number(idTipoMotora);
    }, [tiposVehiculo, idTipoSeleccionado, idTipoMotora]);

    // Clasificaciones filtradas según el tipo seleccionado
    const clasificacionesFiltradas = useMemo(() => {
        return clasificaciones.filter((c) => Number(c.idTipo) === Number(idTipoSeleccionado) && c.activo !== false);
    }, [clasificaciones, idTipoSeleccionado]);

    // Mantener siempre idClasificacion sincronizado con una opción válida de la base de datos
    useEffect(() => {
        if (clasificacionesFiltradas.length > 0) {
            const existe = clasificacionesFiltradas.some(
                (c) => Number(c.idClasificacion) === Number(idClasificacion)
            );
            if (!existe) {
                setIdClasificacion(clasificacionesFiltradas[0].idClasificacion);
            }
        }
    }, [clasificacionesFiltradas, idClasificacion]);

    // Cambiar tipo de vehículo (Unidad Motora vs Acoplado)
    const handleSeleccionarTipo = (idTipo: number) => {
        setIdTipoSeleccionado(idTipo);
        setErrorGlobal(null);

        // Ajustar primera subclasificación disponible para este tipo
        const disponibles = clasificaciones.filter((c) => Number(c.idTipo) === Number(idTipo) && c.activo !== false);
        if (disponibles.length > 0) {
            setIdClasificacion(disponibles[0].idClasificacion);
        }

        // Si cambia a acoplado, limpiar número de motor y acoplado asociado
        const nuevoEsMotora =
            tiposVehiculo.find((t) => Number(t.idTipo) === Number(idTipo))?.nombreTipo.toLowerCase().includes('motor') ||
            Number(idTipo) === Number(idTipoMotora);
        if (!nuevoEsMotora) {
            setIdAcopladoActual('');
        }
    };

    // Guardar borrador localmente
    const handleGuardarBorrador = () => {
        const draft = {
            idTipoSeleccionado,
            idClasificacion,
            placa,
            anio,
            marca,
            modelo,
            numeroChasis,
            numeroMotor,
            capacidadCarga,
            capacidadArrastre,
            estado,
            idAcopladoActual,
            emparejamientoInmediato,
        };
        try {
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
            setBorradorGuardado(true);
            setTimeout(() => setBorradorGuardado(false), 3000);
        } catch {
            setErrorGlobal('No se pudo guardar el borrador en el almacenamiento local.');
        }
    };

    // Registro del vehículo
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorGlobal(null);
        setMensajeExito(null);

        // Validaciones
        if (!placa.trim()) {
            setErrorGlobal('La placa / matrícula oficial es requerida.');
            return;
        }
        if (vehiculoConMismaPlaca) {
            setErrorGlobal(`Ya existe un vehículo registrado con la placa '${placa.trim().toUpperCase()}'. Por favor ingrese una matrícula diferente.`);
            return;
        }
        if (!marca.trim()) {
            setErrorGlobal('La marca comercial es requerida.');
            return;
        }
        if (!numeroChasis.trim()) {
            setErrorGlobal('El número de chasis / serial VIN es requerido.');
            return;
        }
        if (vehiculoConMismoChasis) {
            setErrorGlobal(`Ya existe un vehículo con el número de chasis (VIN) '${numeroChasis.trim().toUpperCase()}'.`);
            return;
        }
        if (esUnidadMotora && !numeroMotor.trim()) {
            setErrorGlobal('El número de motor es obligatorio para unidades motoras.');
            return;
        }

        const clasifActual = clasificaciones.find((c) => Number(c.idClasificacion) === Number(idClasificacion));
        const tipoUnidad: TipoUnidad = esUnidadMotora ? 'motriz' : 'acoplado';

        setGuardando(true);

        try {
            const nuevo = await vehiculosService.createVehiculo({
                placa: placa.trim().toUpperCase(),
                pais: esUnidadMotora ? 'ES' : 'ES-R',
                tipoUnidad,
                codigoUnidad: '',
                marca: marca.trim(),
                modelo: modelo.trim(),
                anio: Number(anio) || new Date().getFullYear(),
                clasificacion: clasifActual?.nombreClasificacion || (esUnidadMotora ? 'Chuto' : 'Cortinero'),
                idClasificacion: Number(idClasificacion || clasifActual?.idClasificacion || (esUnidadMotora ? 5 : 7)),
                idTipo: Number(idTipoSeleccionado),
                numeroChasis: numeroChasis.trim().toUpperCase(),
                numeroMotor: esUnidadMotora && numeroMotor.trim() ? numeroMotor.trim().toUpperCase() : undefined,
                capacidadCarga: capacidadCarga ? parseFloat(capacidadCarga) : 0,
                capacidadArrastre: capacidadArrastre ? parseFloat(capacidadArrastre) : 0,
                estadoTipo: estado === 'Activo' ? 'patio' : estado === 'En_Ruta' ? 'en_ruta' : estado === 'Mantenimiento' ? 'taller' : 'inactivo',
                estado,
                idAcopladoActual: esUnidadMotora && idAcopladoActual ? idAcopladoActual : null,
            });

            // Si hay foto adjunta, subirla
            if (fotoArchivo) {
                try {
                    await vehiculosService.subirFoto(nuevo, fotoArchivo);
                } catch (errFoto) {
                    console.warn('El vehículo se registró pero hubo un problema al subir la foto:', errFoto);
                }
            }

            // Limpiar borrador guardado
            try {
                localStorage.removeItem(DRAFT_STORAGE_KEY);
            } catch {
                // Ignorar
            }

            setMensajeExito(`¡Vehículo ${nuevo.placa} registrado con éxito en la flota!`);

            setTimeout(() => {
                navigate('/vehiculos');
            }, 1200);
        } catch (err) {
            setErrorGlobal(getApiErrorMessage(err, 'Ocurrió un error al registrar el vehículo. Revisa que la placa o VIN no estén duplicados.'));
            setGuardando(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-slate-900/40 p-3 sm:p-6 flex items-center justify-center font-sans animate-in fade-in duration-300">
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
                {/* ─── ENCABEZADO SUPERIOR ─── */}
                <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-slate-100 flex items-start justify-between relative bg-white">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block shadow-xs shadow-amber-500/50" />
                            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">
                                FLEET MANAGEMENT ERP • ALTA DE ACTIVO
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Registrar Nuevo Vehículo en Flota
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
                            Configuración paramétrica integral y emparejamiento telemático CAN-Bus en vista simultánea.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/vehiculos')}
                        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shadow-2xs"
                        title="Cerrar y volver a Vehículos"
                    >
                        <X className="w-5 h-5 stroke-[2.5]" />
                    </button>
                </div>

                {/* ─── ALERTAS DE ESTADO ─── */}
                {errorGlobal && (
                    <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3 animate-in fade-in duration-200">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <div className="flex-1">{errorGlobal}</div>
                        <button
                            type="button"
                            onClick={() => setErrorGlobal(null)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {mensajeExito && (
                    <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3 animate-in fade-in duration-200">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="flex-1">{mensajeExito}</div>
                    </div>
                )}

                {borradorGuardado && (
                    <div className="mx-6 sm:mx-8 mt-6 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Borrador guardado exitosamente en este navegador.</span>
                    </div>
                )}

                {/* ─── CUERPO DEL FORMULARIO (2 COLUMNAS) ─── */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* ═════════ COLUMNA IZQUIERDA: CLASIFICACIÓN Y TELEMETRÍA ═════════ */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* Sección: Clasificación Primaria de Activo */}
                            <div>
                                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                                    Clasificación Primaria de Activo *
                                </label>

                                <div className="space-y-3">
                                    {/* Card: Unidad Motora (Naranja) */}
                                    <div
                                        onClick={() => handleSeleccionarTipo(idTipoMotora)}
                                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3.5 select-none ${Number(idTipoSeleccionado) === Number(idTipoMotora)
                                                ? 'border-orange-500 bg-orange-50/20 shadow-sm ring-2 ring-orange-500/10'
                                                : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                                            }`}
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                            <Truck className="w-6 h-6 stroke-[2]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                                                Unidad Motora
                                            </h4>
                                            <p className="text-[11px] text-slate-500 font-normal leading-snug mt-0.5">
                                                Cabezal tractor o rígido con tren motriz propio térmico / eléctrico.
                                            </p>
                                        </div>
                                        <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${Number(idTipoSeleccionado) === Number(idTipoMotora)
                                                    ? 'border-orange-500'
                                                    : 'border-slate-300'
                                                }`}
                                        >
                                            {Number(idTipoSeleccionado) === Number(idTipoMotora) && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Card: Acoplado / Remolque (Verde) */}
                                    <div
                                        onClick={() => handleSeleccionarTipo(idTipoAcoplado)}
                                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3.5 select-none ${Number(idTipoSeleccionado) === Number(idTipoAcoplado)
                                                ? 'border-emerald-500 bg-emerald-50/20 shadow-sm ring-2 ring-emerald-500/10'
                                                : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                                            }`}
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                            <Container className="w-6 h-6 stroke-[2]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                                                Acoplado / Remolque
                                            </h4>
                                            <p className="text-[11px] text-slate-500 font-normal leading-snug mt-0.5">
                                                Góndola tolva, plataforma porta-contenedores o semirremolque.
                                            </p>
                                        </div>
                                        <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${Number(idTipoSeleccionado) === Number(idTipoAcoplado)
                                                    ? 'border-emerald-500'
                                                    : 'border-slate-300'
                                                }`}
                                        >
                                            {Number(idTipoSeleccionado) === Number(idTipoAcoplado) && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sección: Sub-Clasificación Homologada */}
                            <div>
                                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                                    Sub-Clasificación Homologada *
                                </label>
                                <div className="relative">
                                    <select
                                        value={idClasificacion}
                                        onChange={(e) => setIdClasificacion(Number(e.target.value))}
                                        disabled={loadingData}
                                        className="w-full appearance-none px-4 py-3 bg-[#f8fafc] hover:bg-white rounded-2xl border border-slate-200 font-bold text-slate-800 text-xs sm:text-sm focus:bg-white focus:border-orange-500 focus:ring-3 focus:ring-orange-500/10 outline-none transition cursor-pointer pr-10"
                                    >
                                        {clasificacionesFiltradas.length > 0 ? (
                                            clasificacionesFiltradas.map((c) => (
                                                <option key={c.idClasificacion} value={c.idClasificacion}>
                                                    {c.nombreClasificacion}
                                                </option>
                                            ))
                                        ) : (
                                            <option value={idClasificacion}>
                                                {esUnidadMotora ? 'Chuto (Predeterminado)' : 'Cortinero (Predeterminado)'}
                                            </option>
                                        )}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                                <p className="text-[11px] text-slate-500 font-normal mt-1.5">
                                    Asigna factor de desgaste de neumáticos y consumo basal.
                                </p>
                            </div>

                            {/* Sección: Telemetría CAN-Bus */}
                            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4.5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-emerald-600" />
                                        <span className="text-xs font-bold text-slate-800">
                                            Telemetría CAN-Bus
                                        </span>
                                    </div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                        Auto-Sync
                                    </span>
                                </div>

                                <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                                    El sistema asignará el gateway IoT disponible{' '}
                                    <strong className="text-slate-800 font-bold">GW-VAL-094</strong> para enlace GPS en tiempo real, corte de inyección y lectura de RPM.
                                </p>

                                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-700">
                                        Emparejamiento inmediato
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setEmparejamientoInmediato(!emparejamientoInmediato)}
                                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${emparejamientoInmediato ? 'bg-emerald-600' : 'bg-slate-300'
                                            }`}
                                    >
                                        <div
                                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${emparejamientoInmediato ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Selector de Foto del Vehículo */}
                            <div className="pt-2 border-t border-slate-100">
                                <SelectorImagen
                                    etiqueta="Foto Técnica del Vehículo (Opcional)"
                                    archivo={fotoArchivo}
                                    quitada={quitarFoto}
                                    onSeleccionar={(file) => {
                                        setFotoArchivo(file);
                                        setQuitarFoto(false);
                                    }}
                                    onQuitar={() => {
                                        setFotoArchivo(null);
                                        setQuitarFoto(true);
                                    }}
                                />
                            </div>
                        </div>

                        {/* ═════════ COLUMNA DERECHA: DATOS DE REGISTRO TÉCNICO ═════════ */}
                        <div className="lg:col-span-7 space-y-5">
                            {/* Header técnico */}
                            <div className="flex items-center justify-between pb-1">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                                    DATOS DE REGISTRO TÉCNICO
                                </h3>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200/70 px-2.5 py-1 rounded-md tracking-wider">

                                </span>
                            </div>

                            {/* Fila 1: Placa y Año */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Placa / Matrícula */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-[11px] font-bold uppercase text-slate-600">
                                            Placa / Matrícula Oficial *
                                        </label>
                                        {vehiculoConMismaPlaca && (
                                            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tight">
                                                Ya registrada
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        className={`rounded-2xl border p-3 flex items-center gap-3 transition ${vehiculoConMismaPlaca
                                                ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-500/20'
                                                : 'bg-[#f4f7fc] hover:bg-slate-100/90 focus-within:bg-white border-slate-200/70 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10'
                                            }`}
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs ${vehiculoConMismaPlaca
                                                    ? 'bg-rose-100/80 border-rose-200 text-rose-600'
                                                    : 'bg-white/80 border-slate-200/50 text-slate-500'
                                                }`}
                                        >
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <input
                                            ref={placaRef}
                                            type="text"
                                            required
                                            value={placa}
                                            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => handleKeyDownNext(e, anioRef)}
                                            placeholder="9104-MRT"
                                            className={`w-full bg-transparent font-black text-base tracking-wider placeholder:text-slate-400 placeholder:font-normal outline-none ${vehiculoConMismaPlaca ? 'text-rose-900' : 'text-slate-900'
                                                }`}
                                        />
                                    </div>
                                    {vehiculoConMismaPlaca && (
                                        <p className="text-[11px] text-rose-600 font-semibold mt-1">
                                            Esta placa ya pertenece a: {vehiculoConMismaPlaca.marca} {vehiculoConMismaPlaca.modelo || ''}
                                        </p>
                                    )}
                                </div>

                                {/* Año de Fabricación */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Año de Fabricación *
                                    </label>
                                    <div className="bg-[#f4f7fc] hover:bg-slate-100/90 focus-within:bg-white rounded-2xl border border-slate-200/70 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 p-3 flex items-center gap-3 transition">
                                        <div className="w-8 h-8 rounded-lg bg-white/80 border border-slate-200/50 flex items-center justify-center shrink-0 text-slate-500 shadow-2xs">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <input
                                            ref={anioRef}
                                            type="number"
                                            required
                                            min={1970}
                                            max={new Date().getFullYear() + 2}
                                            value={anio}
                                            onChange={(e) => setAnio(Number(e.target.value))}
                                            onKeyDown={(e) => handleKeyDownNext(e, marcaRef)}
                                            placeholder="2024"
                                            className="w-full bg-transparent font-bold text-slate-900 text-base placeholder:text-slate-400 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Fila 2: Marca Comercial y Modelo / Versión en 2 casillas separadas */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Casilla 1: Marca Comercial */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Marca Comercial *
                                    </label>
                                    <div className="bg-[#f4f7fc] hover:bg-slate-100/90 focus-within:bg-white rounded-2xl border border-slate-200/70 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 p-3 flex items-center gap-3 transition">
                                        <div className="w-8 h-8 rounded-lg bg-white/80 border border-slate-200/50 flex items-center justify-center shrink-0 text-slate-500 shadow-2xs">
                                            <Car className="w-4 h-4" />
                                        </div>
                                        <input
                                            ref={marcaRef}
                                            type="text"
                                            required
                                            value={marca}
                                            onChange={(e) => setMarca(e.target.value)}
                                            onKeyDown={(e) => handleKeyDownNext(e, modeloRef)}
                                            placeholder="Ej. Mack"
                                            className="w-full bg-transparent font-bold text-slate-900 text-sm placeholder:text-slate-400 placeholder:font-normal outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Casilla 2: Modelo / Versión */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Modelo / Versión *
                                    </label>
                                    <div className="bg-[#f4f7fc] hover:bg-slate-100/90 focus-within:bg-white rounded-2xl border border-slate-200/70 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 p-3 flex items-center gap-3 transition">
                                        <div className="w-8 h-8 rounded-lg bg-white/80 border border-slate-200/50 flex items-center justify-center shrink-0 text-slate-500 shadow-2xs">
                                            <Car className="w-4 h-4" />
                                        </div>
                                        <input
                                            ref={modeloRef}
                                            type="text"
                                            value={modelo}
                                            onChange={(e) => setModelo(e.target.value)}
                                            onKeyDown={(e) => handleKeyDownNext(e, chasisRef)}
                                            placeholder="Ej. Granite 505"
                                            className="w-full bg-transparent font-bold text-slate-900 text-sm placeholder:text-slate-400 placeholder:font-normal outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Fila 3: Número de Chasis / Serial VIN (17 Dígitos) */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-[11px] font-bold uppercase text-slate-600">
                                        Número de Chasis / Serial VIN (17 Dígitos) *
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {vehiculoConMismoChasis && (
                                            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tight">
                                                VIN ya registrado
                                            </span>
                                        )}
                                        <span
                                            className={`text-[11px] font-mono font-semibold ${numeroChasis.length === 17
                                                    ? 'text-emerald-600 font-bold'
                                                    : 'text-slate-400'
                                                }`}
                                        >
                                            {numeroChasis.length} / 17 Caracteres
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className={`rounded-2xl border p-3 flex items-center gap-3 transition ${vehiculoConMismoChasis
                                            ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-500/20'
                                            : 'bg-[#f4f7fc] hover:bg-slate-100/90 focus-within:bg-white border-slate-200/70 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10'
                                        }`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs ${vehiculoConMismoChasis
                                                ? 'bg-rose-100/80 border-rose-200 text-rose-600'
                                                : 'bg-white/80 border-slate-200/50 text-slate-500'
                                            }`}
                                    >
                                        <Fingerprint className="w-4 h-4" />
                                    </div>
                                    <input
                                        ref={chasisRef}
                                        type="text"
                                        required
                                        maxLength={50}
                                        value={numeroChasis}
                                        onChange={(e) => setNumeroChasis(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => handleKeyDownNext(e, esUnidadMotora ? motorRef : cargaRef)}
                                        placeholder="1M2AX14C7PM094821"
                                        className={`w-full bg-transparent font-mono font-bold text-sm tracking-wider placeholder:text-slate-400 placeholder:font-normal outline-none ${vehiculoConMismoChasis ? 'text-rose-900' : 'text-slate-900'
                                            }`}
                                    />
                                </div>
                                {vehiculoConMismoChasis && (
                                    <p className="text-[11px] text-rose-600 font-semibold mt-1">
                                        Este chasis ya pertenece al vehículo con placa: {vehiculoConMismoChasis.placa}
                                    </p>
                                )}
                            </div>

                            {/* Fila 4: Número de Motor & Cilindrada */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-[11px] font-bold uppercase text-slate-600">
                                        Número de Motor & Cilindrada
                                    </label>
                                    {esUnidadMotora ? (
                                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                            OBLIGATORIO EN MOTORA
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                            OPCIONAL (NO APLICA EN REMOLQUE)
                                        </span>
                                    )}
                                </div>
                                <div
                                    className={`rounded-2xl border p-3 flex items-center gap-3 transition ${esUnidadMotora
                                            ? 'bg-[#f4f7fc] hover:bg-slate-100/90 focus-within:bg-white border-slate-200/70 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10'
                                            : 'bg-slate-100/50 border-slate-200/50 opacity-70 cursor-not-allowed'
                                        }`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-white/80 border border-slate-200/50 flex items-center justify-center shrink-0 text-slate-500 shadow-2xs">
                                        <Gauge className="w-4 h-4" />
                                    </div>
                                    <input
                                        ref={motorRef}
                                        type="text"
                                        required={esUnidadMotora}
                                        disabled={!esUnidadMotora}
                                        value={numeroMotor}
                                        onChange={(e) => setNumeroMotor(e.target.value)}
                                        onKeyDown={(e) => handleKeyDownNext(e, cargaRef)}
                                        placeholder={
                                            esUnidadMotora
                                                ? 'MP8 13L 505HP Allison Gen-5'
                                                : '(No aplica para unidades de arrastre)'
                                        }
                                        className="w-full bg-transparent font-bold text-slate-900 text-sm placeholder:text-slate-400 placeholder:font-normal outline-none disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Fila 5: Carga Útil y Arrastre Máx */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Carga Útil */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Carga Útil (Toneladas) *
                                    </label>
                                    <div className="bg-[#f4f7fc] hover:bg-slate-100/90 focus-within:bg-white rounded-2xl border border-slate-200/70 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 p-3 flex items-center gap-3 transition">
                                        <div className="w-8 h-8 rounded-lg bg-white/80 border border-slate-200/50 flex items-center justify-center shrink-0 text-slate-500 shadow-2xs">
                                            <Weight className="w-4 h-4" />
                                        </div>
                                        <input
                                            ref={cargaRef}
                                            type="number"
                                            step="0.1"
                                            min={0}
                                            required
                                            value={capacidadCarga}
                                            onChange={(e) => setCapacidadCarga(e.target.value)}
                                            onKeyDown={(e) => handleKeyDownNext(e, arrastreRef)}
                                            placeholder="32.0"
                                            className="w-full bg-transparent font-bold text-slate-900 text-base placeholder:text-slate-400 outline-none"
                                        />
                                        <span className="text-xs font-black text-slate-500 pr-1 select-none">
                                            TON
                                        </span>
                                    </div>
                                </div>

                                {/* Arrastre Máximo */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Arrastre Máx (P.B.C.)
                                    </label>
                                    <div className="bg-[#f4f7fc] hover:bg-slate-100/90 focus-within:bg-white rounded-2xl border border-slate-200/70 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 p-3 flex items-center gap-3 transition">
                                        <div className="w-8 h-8 rounded-lg bg-white/80 border border-slate-200/50 flex items-center justify-center shrink-0 text-slate-500 shadow-2xs">
                                            <Layers className="w-4 h-4" />
                                        </div>
                                        <input
                                            ref={arrastreRef}
                                            type="number"
                                            step="0.1"
                                            min={0}
                                            value={capacidadArrastre}
                                            onChange={(e) => setCapacidadArrastre(e.target.value)}
                                            onKeyDown={(e) => handleKeyDownNext(e, estadoRef)}
                                            placeholder="44.0"
                                            className="w-full bg-transparent font-bold text-slate-900 text-base placeholder:text-slate-400 outline-none"
                                        />
                                        <span className="text-xs font-black text-slate-500 pr-1 select-none">
                                            TON
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Fila 6: Estado Inicial y Acoplado Asociado */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Estado Inicial Operativo */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Estado Inicial Operativo *
                                    </label>
                                    <div className="relative">
                                        <select
                                            ref={estadoRef}
                                            value={estado}
                                            onChange={(e) =>
                                                setEstado(
                                                    e.target.value as 'Activo' | 'En_Ruta' | 'Mantenimiento' | 'Inactivo'
                                                )
                                            }
                                            onKeyDown={(e) =>
                                                handleKeyDownNext(e, esUnidadMotora ? acopladoRef : submitBtnRef)
                                            }
                                            className="w-full appearance-none px-4 py-3 bg-[#f8fafc] hover:bg-white rounded-2xl border border-slate-200 font-bold text-slate-800 text-xs focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition cursor-pointer pr-10"
                                        >
                                            <option value="Activo">Activo (Listo en Base)</option>
                                            <option value="En_Ruta">En Ruta (Operativo)</option>
                                            <option value="Mantenimiento">Mantenimiento (Taller)</option>
                                            <option value="Inactivo">Inactivo (Fuera de Servicio)</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Acoplado Asociado */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Acoplado Asociado
                                    </label>
                                    <div className="relative">
                                        <select
                                            ref={acopladoRef}
                                            value={idAcopladoActual}
                                            onChange={(e) => setIdAcopladoActual(e.target.value)}
                                            disabled={!esUnidadMotora}
                                            onKeyDown={(e) => handleKeyDownNext(e, submitBtnRef)}
                                            className={`w-full appearance-none px-4 py-3 rounded-2xl border font-bold text-xs outline-none transition pr-10 ${esUnidadMotora
                                                    ? 'bg-[#f8fafc] hover:bg-white text-slate-800 border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 cursor-pointer'
                                                    : 'bg-slate-100/60 text-slate-400 border-slate-200/60 cursor-not-allowed'
                                                }`}
                                        >
                                            <option value="">
                                                {esUnidadMotora
                                                    ? '-- Ninguno / Desacoplado --'
                                                    : 'No aplica para acoplados'}
                                            </option>
                                            {esUnidadMotora &&
                                                acopladosExistentes.map((acoplado) => (
                                                    <option key={acoplado.idVehiculo} value={acoplado.idVehiculo}>
                                                        {acoplado.placa} • {acoplado.marca} {acoplado.modelo} ({acoplado.nombreClasificacion || 'Acoplado'})
                                                    </option>
                                                ))}
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── FOOTER / ACCIONES DE ENVÍO ─── */}
                    <div className="px-6 sm:px-8 py-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 rounded-b-3xl">
                        <button
                            type="button"
                            onClick={() => navigate('/vehiculos')}
                            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition px-3 py-2 rounded-xl hover:bg-slate-200/50 cursor-pointer"
                        >
                            Cancelar
                        </button>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleGuardarBorrador}
                                className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-2xs transition cursor-pointer"
                            >
                                <FileText className="w-4 h-4 text-slate-500" />
                                <span>Guardar Borrador</span>
                            </button>

                            <button
                                ref={submitBtnRef}
                                type="submit"
                                disabled={guardando}
                                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 focus:ring-4 focus:ring-orange-500/30 active:scale-[0.98] text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl shadow-md shadow-orange-500/25 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed outline-none"
                            >
                                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                                <span>
                                    {guardando ? 'Registrando en Flota...' : 'Registrar Vehículo en Flota'}
                                </span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
