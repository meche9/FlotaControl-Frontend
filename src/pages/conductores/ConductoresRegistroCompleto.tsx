import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    IdCard,
    User,
    FolderPlus,
    Calendar,
    Heart,
    Droplets,
    Phone,
    Mail,
    MapPin,
    Home,
    AlertTriangle,
    Shirt,
    Building2,
    CreditCard,
    Smartphone,
    Truck,
    CheckCircle2,
    Save,
    X,
    ArrowLeft,
    ChevronDown,
    Sparkles,
    PhoneCall,
    ShieldAlert,
    ShieldCheck,
    Check,
    Activity,
} from 'lucide-react';
import { SelectorImagen, ImagenProtegida, DateInput } from '../../components/ui';
import {
    conductoresService,
    type Conductor,
    type ConductorEstado,
    type ConductorEstadoCivil,
    type ConductorSexo,
    type ConductorFormData,
    ESTADO_CONDUCTOR_LABELS,
    ESTADO_CIVIL_LABELS,
} from '../../services/conductoresService';
import { vehiculosService, type Vehiculo } from '../../services/vehiculosService';
import { getApiErrorMessage } from '../../services/api';

const BANCOS_VENEZUELA = [
    '0102 - Banco de Venezuela',
    '0134 - Banesco Banco Universal',
    '0105 - Banco Mercantil',
    '0108 - Banco Provincial (BBVA)',
    '0114 - Bancaribe',
    '0172 - Bancamiga Banco Universal',
    '0163 - Banco del Tesoro',
    '0115 - Banco Exterior',
    '0137 - Banco Sofitasa',
    '0151 - Banco Fondo Común (BFC)',
    '0166 - Banco Agrícola de Venezuela',
    '0174 - Banplus Banco Universal',
    '0175 - Banco Bicentenario',
    '0191 - Banco Nacional de Crédito (BNC)',
];

const TIPOS_SANGRE = [
    'O Positivo (O+)',
    'O Negativo (O-)',
    'A Positivo (A+)',
    'A Negativo (A-)',
    'B Positivo (B+)',
    'B Negativo (B-)',
    'AB Positivo (AB+)',
    'AB Negativo (AB-)',
];

const TALLAS_ROPA = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
const TALLAS_PANTALON = ['28', '30', '32', '34', '36', '38', '40', '42', '44'];
const TALLAS_CALZADO = ['38', '39', '40', '41', '42', '43', '44', '45', '46'];

export default function ConductoresRegistroCompleto() {
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();
    const isEditing = Boolean(id);

    // Estados de datos maestros
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
    const [mensajeExito, setMensajeExito] = useState<string | null>(null);

    // Datos originales del conductor si se está editando
    const [conductorOriginal, setConductorOriginal] = useState<Conductor | null>(null);

    // 1. Datos Personales e Identidad
    const [cedulaIdentidad, setCedulaIdentidad] = useState('');
    const [nombres, setNombres] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('1988-06-14');
    const [sexo, setSexo] = useState<ConductorSexo>('M');
    const [nacionalidad, setNacionalidad] = useState('Venezolana (V)');
    const [estadoCivil, setEstadoCivil] = useState<ConductorEstadoCivil>('Casado_a');
    const [cargaFamiliar, setCargaFamiliar] = useState<number>(3);
    const [tipoSangre, setTipoSangre] = useState('O Positivo (O+)');

    // 2. Contacto & Localización Habitacional
    const [telefono, setTelefono] = useState('');
    const [telefonoAuxiliar, setTelefonoAuxiliar] = useState('');
    const [email, setEmail] = useState('');
    const [estadoCiudadMunicipio, setEstadoCiudadMunicipio] = useState('Carabobo, Valencia');
    const [urbBarrioParroquia, setUrbBarrioParroquia] = useState('');
    const [avCalle, setAvCalle] = useState('');
    const [edifCasa, setEdifCasa] = useState('');
    const [aptoPiso, setAptoPiso] = useState('');
    const [direccion, setDireccion] = useState('');

    // 3. Contacto de Emergencia & Tallas de Dotación (EPP)
    const [personaContacto, setPersonaContacto] = useState('');
    const [telefonoContacto, setTelefonoContacto] = useState('');
    const [tallaCamisa, setTallaCamisa] = useState('L');
    const [tallaPantalon, setTallaPantalon] = useState('34');
    const [tallaChemise, setTallaChemise] = useState('L');
    const [tallaFranela, setTallaFranela] = useState('L');
    const [tallaCalzado, setTallaCalzado] = useState('42');

    // 4. Datos Financieros / Nómina & Unidad Habitual
    const [banco, setBanco] = useState('0102 - Banco de Venezuela');
    const [nroCuenta, setNroCuenta] = useState('');
    const [pagoMovil, setPagoMovil] = useState('');
    const [estado, setEstado] = useState<ConductorEstado>('Activo');
    const [idVehiculoHabitual, setIdVehiculoHabitual] = useState<string>('');
    const [fechaIngreso, setFechaIngreso] = useState<string>(
        new Date().toISOString().slice(0, 10)
    );

    // Foto de Perfil
    const [fotoArchivo, setFotoArchivo] = useState<File | null>(null);
    const [quitarFoto, setQuitarFoto] = useState(false);

    // Referencias para navegación con la tecla Enter
    const cedulaRef = useRef<HTMLInputElement>(null);
    const nombresRef = useRef<HTMLInputElement>(null);
    const apellidosRef = useRef<HTMLInputElement>(null);
    const fechaNacimientoRef = useRef<HTMLInputElement>(null);
    const sexoRef = useRef<HTMLSelectElement>(null);
    const nacionalidadRef = useRef<HTMLSelectElement>(null);
    const estadoCivilRef = useRef<HTMLSelectElement>(null);
    const cargaFamiliarRef = useRef<HTMLInputElement>(null);
    const tipoSangreRef = useRef<HTMLSelectElement>(null);

    const telefonoRef = useRef<HTMLInputElement>(null);
    const telefonoAuxiliarRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const estadoCiudadMunicipioRef = useRef<HTMLInputElement>(null);
    const urbBarrioParroquiaRef = useRef<HTMLInputElement>(null);
    const avCalleRef = useRef<HTMLInputElement>(null);
    const edifCasaRef = useRef<HTMLInputElement>(null);
    const aptoPisoRef = useRef<HTMLInputElement>(null);
    const direccionRef = useRef<HTMLInputElement>(null);

    const personaContactoRef = useRef<HTMLInputElement>(null);
    const telefonoContactoRef = useRef<HTMLInputElement>(null);
    const tallaCamisaRef = useRef<HTMLSelectElement>(null);
    const tallaPantalonRef = useRef<HTMLSelectElement>(null);
    const tallaChemiseRef = useRef<HTMLSelectElement>(null);
    const tallaFranelaRef = useRef<HTMLSelectElement>(null);
    const tallaCalzadoRef = useRef<HTMLSelectElement>(null);

    const bancoRef = useRef<HTMLSelectElement>(null);
    const nroCuentaRef = useRef<HTMLInputElement>(null);
    const pagoMovilRef = useRef<HTMLInputElement>(null);
    const estadoRef = useRef<HTMLSelectElement>(null);
    const idVehiculoHabitualRef = useRef<HTMLSelectElement>(null);
    const fechaIngresoRef = useRef<HTMLInputElement>(null);
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

    // Autofoco en el primer campo (Cédula de Identidad) al entrar a la página
    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => {
                cedulaRef.current?.focus();
            }, 80);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    // Cargar datos iniciales
    useEffect(() => {
        async function cargarDatos() {
            setLoading(true);
            setErrorGlobal(null);
            try {
                const [listaVehiculos] = await Promise.all([
                    vehiculosService.getVehiculos().catch((err) => {
                        console.warn('Error cargando vehículos:', err);
                        return [] as Vehiculo[];
                    }),
                ]);
                setVehiculos(listaVehiculos);

                if (id) {
                    const c = await conductoresService.getConductor(id);
                    setConductorOriginal(c);

                    // Rellenar campos con datos existentes
                    setCedulaIdentidad(c.cedulaIdentidad || '');
                    setNombres(c.nombres || '');
                    setApellidos(c.apellidos || '');
                    setFechaNacimiento(
                        c.fechaNacimiento ? c.fechaNacimiento.slice(0, 10) : ''
                    );
                    setFechaIngreso(
                        c.fechaIngreso
                            ? c.fechaIngreso.slice(0, 10)
                            : new Date().toISOString().slice(0, 10)
                    );
                    setSexo(c.sexo || 'M');
                    setNacionalidad(c.nacionalidad || 'Venezolana (V)');
                    setEstadoCivil(c.estadoCivil || 'Soltero_a');
                    setCargaFamiliar(c.cargaFamiliar ?? 0);
                    setTipoSangre(c.tipoSangre || 'O Positivo (O+)');

                    setTelefono(c.telefono || '');
                    setTelefonoAuxiliar(c.telefonoAuxiliar || '');
                    setEmail(c.email || '');
                    setEstadoCiudadMunicipio(
                        c.estadoCiudadMunicipio || 'Carabobo, Valencia, San Diego'
                    );
                    setUrbBarrioParroquia(c.urbBarrioParroquia || '');
                    setAvCalle(c.avCalle || '');
                    setEdifCasa(c.edifCasa || '');
                    setAptoPiso(c.aptoPiso || '');
                    setDireccion(c.direccion || '');

                    setPersonaContacto(c.personaContacto || '');
                    setTelefonoContacto(c.telefonoContacto || '');

                    setTallaCamisa(c.tallaCamisa || 'L');
                    setTallaPantalon(c.tallaPantalon || '34');
                    setTallaChemise(c.tallaChemise || 'L');
                    setTallaFranela(c.tallaFranela || 'L');
                    setTallaCalzado(c.tallaCalzado || '42');

                    setBanco(c.banco || '0102 - Banco de Venezuela');
                    setNroCuenta(c.nroCuenta || '');
                    setPagoMovil(c.pagoMovil || '');
                    setEstado(c.estado || 'Activo');
                    setIdVehiculoHabitual(c.idVehiculoHabitual || '');
                }
            } catch (err: any) {
                console.error('Error cargando información:', err);
                setErrorGlobal(
                    getApiErrorMessage(err, 'No se pudo cargar la información del operador')
                );
            } finally {
                setLoading(false);
            }
        }

        cargarDatos();
    }, [id]);

    // Vehículo seleccionado actualmente para la credencial en vivo
    const vehiculoSeleccionado = useMemo(() => {
        return vehiculos.find((v) => v.idVehiculo === idVehiculoHabitual);
    }, [vehiculos, idVehiculoHabitual]);

    // Extracción del tipo de sangre simplificado (ej: "O+" desde "O Positivo (O+)")
    const tipoSangreCorto = useMemo(() => {
        const match = tipoSangre.match(/\(([^)]+)\)/);
        return match ? match[1] : tipoSangre;
    }, [tipoSangre]);

    // Manejo del Envío del Formulario
    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setErrorGlobal(null);
        setMensajeExito(null);

        // Validaciones obligatorias
        if (!cedulaIdentidad.trim()) {
            setErrorGlobal('La Cédula de Identidad es obligatoria');
            return;
        }
        if (!nombres.trim()) {
            setErrorGlobal('Los Nombres son obligatorios');
            return;
        }
        if (!apellidos.trim()) {
            setErrorGlobal('Los Apellidos son obligatorios');
            return;
        }
        if (!telefono.trim()) {
            setErrorGlobal('El Teléfono Principal es obligatorio');
            return;
        }

        setGuardando(true);
        try {
            const payload: ConductorFormData = {
                cedulaIdentidad: cedulaIdentidad.trim().toUpperCase(),
                nombres: nombres.trim(),
                apellidos: apellidos.trim(),
                fechaNacimiento: fechaNacimiento ? fechaNacimiento.trim() : undefined,
                fechaIngreso: fechaIngreso ? fechaIngreso.trim() : undefined,
                sexo: sexo || undefined,
                nacionalidad: nacionalidad.trim() || undefined,
                estadoCivil: estadoCivil || undefined,
                cargaFamiliar: cargaFamiliar !== undefined ? Number(cargaFamiliar) : 0,
                tipoSangre: tipoSangreCorto.trim() || undefined,

                telefono: telefono.trim(),
                telefonoAuxiliar: telefonoAuxiliar.trim() || undefined,
                email: email.trim() || undefined,

                direccion: direccion.trim() || undefined,
                urbBarrioParroquia: urbBarrioParroquia.trim() || undefined,
                avCalle: avCalle.trim() || undefined,
                edifCasa: edifCasa.trim() || undefined,
                aptoPiso: aptoPiso.trim() || undefined,
                estadoCiudadMunicipio: estadoCiudadMunicipio.trim() || undefined,

                personaContacto: personaContacto.trim() || undefined,
                telefonoContacto: telefonoContacto.trim() || undefined,

                tallaCamisa: tallaCamisa || undefined,
                tallaPantalon: tallaPantalon || undefined,
                tallaChemise: tallaChemise || undefined,
                tallaFranela: tallaFranela || undefined,
                tallaCalzado: tallaCalzado || undefined,

                banco: banco.trim() || undefined,
                nroCuenta: nroCuenta.trim() || undefined,
                pagoMovil: pagoMovil.trim() || undefined,

                estado: estado || 'Activo',
                idVehiculoHabitual: idVehiculoHabitual && idVehiculoHabitual.trim() !== ''
                    ? idVehiculoHabitual
                    : null,
            };

            if (isEditing && id) {
                // Actualizar conductor
                await conductoresService.updateConductor(id, payload);

                // Subir o quitar foto
                if (fotoArchivo) {
                    await conductoresService.subirFoto(id, fotoArchivo);
                } else if (quitarFoto && conductorOriginal?.foto) {
                    await conductoresService.eliminarFoto(id);
                }

                setMensajeExito(`Expediente de ${nombres} ${apellidos} actualizado exitosamente`);
                setTimeout(() => {
                    navigate('/conductores');
                }, 1200);
            } else {
                // Crear nuevo conductor
                const nuevo = await conductoresService.createConductor(payload);

                if (fotoArchivo) {
                    try {
                        await conductoresService.subirFoto(nuevo.idConductor, fotoArchivo);
                    } catch (err) {
                        console.warn('Error subiendo fotografía:', err);
                    }
                }

                setMensajeExito(`Conductor ${nuevo.nombres} ${nuevo.apellidos} registrado exitosamente`);
                setTimeout(() => {
                    navigate('/conductores');
                }, 1200);
            }
        } catch (err: any) {
            console.error('Error guardando conductor:', err);
            setErrorGlobal(
                getApiErrorMessage(err, 'Ocurrió un error al guardar en la base de datos')
            );
        } finally {
            setGuardando(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[500px] flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Cargando expediente del operador...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-16">
            {/* ══════════ ENCABEZADO SUPERIOR ══════════ */}
            <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                                {isEditing
                                    ? `Ficha de Edición: ${conductorOriginal?.nombres || nombres} ${conductorOriginal?.apellidos || apellidos}`
                                    : 'Ficha de Alta: Registro de Conductor'}
                            </h1>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200/60">
                                • {isEditing ? 'Edición Completa SQL' : 'Formulario Completo SQL'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {isEditing
                                ? 'Modifica los datos del operador para actualizar su expediente laboral, carnet digital corporativo y vinculación de unidad.'
                                : 'Ingresa los datos del nuevo operador para generar su expediente laboral, carnet digital corporativo y vinculación de unidad motriz.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <button
                            type="button"
                            disabled={guardando}
                            onClick={() => navigate('/conductores')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/90 transition cursor-pointer disabled:opacity-50"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span>Descartar / Cancelar</span>
                        </button>

                        <button
                            type="button"
                            disabled={guardando}
                            onClick={() => handleSubmit()}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/25 transition cursor-pointer active:scale-98 disabled:opacity-50"
                        >
                            {guardando ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Guardar en Base de Datos</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Alertas Globales */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
                {errorGlobal && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
                        <span>{errorGlobal}</span>
                    </div>
                )}

                {mensajeExito && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                        <span>{mensajeExito}</span>
                    </div>
                )}
            </div>

            {/* ══════════ CUERPO PRINCIPAL A 2 COLUMNAS ══════════ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* ══════════ COLUMNA IZQUIERDA: FORMULARIO COMPLETO SQL (8 cols) ══════════ */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* ─── 1. DATOS PERSONALES E IDENTIDAD ─── */}
                        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5 stroke-[2.2]" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-slate-900 tracking-tight">
                                            1. Datos Personales e Identidad
                                        </h2>
                                        <p className="text-xs text-slate-400 font-medium">
                                            Identificación legal y registro civil del operador
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200/70 px-2.5 py-1 rounded-md tracking-wider uppercase font-mono">
                                    SQL: PERSONAL DATA
                                </span>
                            </div>

                            {/* Fila 1: Cédula, Nombres, Apellidos */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-[11px] font-bold uppercase text-slate-600">
                                            Cédula Identidad <span className="text-rose-500">*</span>
                                        </label>
                                    </div>
                                    <div className="relative">
                                        <input
                                            ref={cedulaRef}
                                            autoFocus
                                            type="text"
                                            required
                                            value={cedulaIdentidad}
                                            onChange={(e) => setCedulaIdentidad(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => handleKeyDownNext(e, nombresRef)}
                                            placeholder="V-24.891.102"
                                            className="w-full px-3.5 py-2.5 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder-slate-400 outline-none transition"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                                        Datos con Validación RIF
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Nombres <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        ref={nombresRef}
                                        type="text"
                                        required
                                        value={nombres}
                                        onChange={(e) => setNombres(e.target.value)}
                                        onKeyDown={(e) => handleKeyDownNext(e, apellidosRef)}
                                        placeholder="José Rafael"
                                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Apellidos <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        ref={apellidosRef}
                                        type="text"
                                        required
                                        value={apellidos}
                                        onChange={(e) => setApellidos(e.target.value)}
                                        onKeyDown={(e) => handleKeyDownNext(e, fechaNacimientoRef)}
                                        placeholder="Paredes Morán"
                                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Fila 2: Fecha de Nacimiento, Sexo, Nacionalidad */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Fecha de Nacimiento <span className="text-rose-500">*</span>
                                    </label>
                                    <DateInput
                                        ref={fechaNacimientoRef}
                                        required
                                        value={fechaNacimiento}
                                        onChange={setFechaNacimiento}
                                        onKeyDown={(e) => handleKeyDownNext(e, sexoRef)}
                                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-medium text-slate-800 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Sexo
                                    </label>
                                    <div className="relative">
                                        <select
                                            ref={sexoRef}
                                            value={sexo}
                                            onChange={(e) => setSexo(e.target.value as ConductorSexo)}
                                            onKeyDown={(e) => handleKeyDownNext(e, nacionalidadRef)}
                                            className="w-full appearance-none px-3.5 py-2.5 pr-8 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-semibold text-slate-800 outline-none transition cursor-pointer"
                                        >
                                            <option value="M">Masculino</option>
                                            <option value="F">Femenino</option>
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Nacionalidad
                                    </label>
                                    <div className="relative">
                                        <select
                                            ref={nacionalidadRef}
                                            value={nacionalidad}
                                            onChange={(e) => setNacionalidad(e.target.value)}
                                            onKeyDown={(e) => handleKeyDownNext(e, estadoCivilRef)}
                                            className="w-full appearance-none px-3.5 py-2.5 pr-8 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-semibold text-slate-800 outline-none transition cursor-pointer"
                                        >
                                            <option value="Venezolana (V)">Venezolana (V)</option>
                                            <option value="Extranjera (E)">Extranjera (E)</option>
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Fila 3: Estado Civil, Carga Familiar, Tipo de Sangre */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Estado Civil
                                    </label>
                                    <div className="relative">
                                        <select
                                            ref={estadoCivilRef}
                                            value={estadoCivil}
                                            onChange={(e) => setEstadoCivil(e.target.value as ConductorEstadoCivil)}
                                            onKeyDown={(e) => handleKeyDownNext(e, cargaFamiliarRef)}
                                            className="w-full appearance-none px-3.5 py-2.5 pr-8 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-semibold text-slate-800 outline-none transition cursor-pointer"
                                        >
                                            <option value="Casado_a">Casado/a</option>
                                            <option value="Soltero_a">Soltero/a</option>
                                            <option value="Divorciado_a">Divorciado/a</option>
                                            <option value="Viudo_a">Viudo/a</option>
                                            <option value="Concubinato">Concubinato</option>
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Carga Familiar (Hijos / Cónyuge)
                                    </label>
                                    <input
                                        ref={cargaFamiliarRef}
                                        type="number"
                                        min={0}
                                        value={cargaFamiliar}
                                        onChange={(e) => setCargaFamiliar(Number(e.target.value))}
                                        onKeyDown={(e) => handleKeyDownNext(e, tipoSangreRef)}
                                        placeholder="3"
                                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-bold text-slate-900 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Tipo de Sangre <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            ref={tipoSangreRef}
                                            value={tipoSangre}
                                            onChange={(e) => setTipoSangre(e.target.value)}
                                            onKeyDown={(e) => handleKeyDownNext(e, telefonoRef)}
                                            className="w-full appearance-none px-3.5 py-2.5 pr-8 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-bold text-rose-700 outline-none transition cursor-pointer"
                                        >
                                            {TIPOS_SANGRE.map((ts) => (
                                                <option key={ts} value={ts}>
                                                    {ts}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ─── 2. CONTACTO & LOCALIZACIÓN HABITACIONAL ─── */}
                        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 stroke-[2.2]" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-slate-900 tracking-tight">
                                            2. Contacto & Localización Habitacional
                                        </h2>
                                        <p className="text-xs text-slate-400 font-medium">
                                            Dirección domiciliaria detallada y canales telemáticos
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200/70 px-2.5 py-1 rounded-md tracking-wider uppercase font-mono">
                                    SQL: CONTACT & GEO-DATA
                                </span>
                            </div>

                            {/* Fila 1: Teléfono Principal, Teléfono Auxiliar, Correo Electrónico */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Teléfono Principal <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        ref={telefonoRef}
                                        type="text"
                                        required
                                        value={telefono}
                                        onChange={(e) => setTelefono(e.target.value)}
                                        onKeyDown={(e) => handleKeyDownNext(e, telefonoAuxiliarRef)}
                                        placeholder="+58 414-7892011"
                                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Teléfono Auxiliar
                                    </label>
                                    <input
                                        ref={telefonoAuxiliarRef}
                                        type="text"
                                        value={telefonoAuxiliar}
                                        onChange={(e) => setTelefonoAuxiliar(e.target.value)}
                                        onKeyDown={(e) => handleKeyDownNext(e, emailRef)}
                                        placeholder="+58 424-9821443"
                                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Correo Electrónico <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        ref={emailRef}
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyDown={(e) => handleKeyDownNext(e, estadoCiudadMunicipioRef)}
                                        placeholder="j.paredes@fleetflow.com"
                                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Fila 2: Estado / Ciudad / Municipio, Urb. / Barrio */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Estado / Ciudad / Municipio <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        ref={estadoCiudadMunicipioRef}
                                        type="text"
                                        required
                                        value={estadoCiudadMunicipio}
                                        onChange={(e) => setEstadoCiudadMunicipio(e.target.value)}
                                        onKeyDown={(e) => handleKeyDownNext(e, urbBarrioParroquiaRef)}
                                        placeholder="Carabobo, Valencia, Municipio San Diego"
                                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Urb. / Barrio / Parroquia
                                    </label>
                                    <input
                                        ref={urbBarrioParroquiaRef}
                                        type="text"
                                        value={urbBarrioParroquia}
                                        onChange={(e) => setUrbBarrioParroquia(e.target.value)}
                                        onKeyDown={(e) => handleKeyDownNext(e, avCalleRef)}
                                        placeholder="Urb. La Esmeralda, Manzana F"
                                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Fila 3: Av. / Calle, Edificio / Casa, Apto / Piso */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Av. / Calle
                                    </label>
                                    <input
                                        ref={avCalleRef}
                                        type="text"
                                        value={avCalle}
                                        onChange={(e) => setAvCalle(e.target.value)}
                                        onKeyDown={(e) => handleKeyDownNext(e, edifCasaRef)}
                                        placeholder="Av. Principal Nro 4"
                                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Edificio / Casa
                                    </label>
                                    <input
                                        ref={edifCasaRef}
                                        type="text"
                                        value={edifCasa}
                                        onChange={(e) => setEdifCasa(e.target.value)}
                                        onKeyDown={(e) => handleKeyDownNext(e, aptoPisoRef)}
                                        placeholder="Casa Quinta Nº 12"
                                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Apto / Piso
                                    </label>
                                    <input
                                        ref={aptoPisoRef}
                                        type="text"
                                        value={aptoPiso}
                                        onChange={(e) => setAptoPiso(e.target.value)}
                                        onKeyDown={(e) => handleKeyDownNext(e, direccionRef)}
                                        placeholder="P.B."
                                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Fila 4: Dirección Domiciliaria Completa */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                    Dirección Domiciliaria Completa (Punto de Referencia)
                                </label>
                                <input
                                    ref={direccionRef}
                                    type="text"
                                    value={direccion}
                                    onChange={(e) => setDireccion(e.target.value)}
                                    onKeyDown={(e) => handleKeyDownNext(e, personaContactoRef)}
                                    placeholder="Av. Principal La Esmeralda, frente a la panadería El Trigal, San Diego, Edo. Carabobo."
                                    className="w-full px-3.5 py-2.5 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition"
                                />
                            </div>
                        </div>

                        {/* ─── 3. CONTACTO DE EMERGENCIA & TALLAS DE DOTACIÓN (EPP) ─── */}
                        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                        <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-slate-900 tracking-tight">
                                            3. Contacto de Emergencia & Tallas de Dotación (EPP)
                                        </h2>
                                        <p className="text-xs text-slate-400 font-medium">
                                            Protocolo SOS en ruta e inventario de uniforme reglamentario
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200/70 px-2.5 py-1 rounded-md tracking-wider uppercase font-mono">
                                    SQL: SOS & EPP
                                </span>
                            </div>

                            {/* Ficha SOS Inmediata */}
                            <div className="bg-rose-50/50 border border-rose-200/70 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                                    <PhoneCall className="w-4 h-4 text-rose-600" />
                                    <span>Contacto de Emergencia en Ruta (Ficha SOS Inmediata)</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                                            Persona de Contacto (Parentesco)
                                        </label>
                                        <input
                                            ref={personaContactoRef}
                                            type="text"
                                            value={personaContacto}
                                            onChange={(e) => setPersonaContacto(e.target.value)}
                                            onKeyDown={(e) => handleKeyDownNext(e, telefonoContactoRef)}
                                            placeholder="María Elena de Paredes (Esposa)"
                                            className="w-full px-3.5 py-2.5 bg-white border border-rose-200/70 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                                            Teléfono SOS Contacto
                                        </label>
                                        <input
                                            ref={telefonoContactoRef}
                                            type="text"
                                            value={telefonoContacto}
                                            onChange={(e) => setTelefonoContacto(e.target.value)}
                                            onKeyDown={(e) => handleKeyDownNext(e, tallaCamisaRef)}
                                            placeholder="+58 412-6819920"
                                            className="w-full px-3.5 py-2.5 bg-white border border-rose-200/70 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Fila Tallas de Dotación */}
                            <div>
                                <span className="block text-[11px] font-bold uppercase text-slate-600 mb-2">
                                    Dotación Reglamentaria de Uniforme
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                            TALLA CAMISA
                                        </label>
                                        <div className="relative">
                                            <select
                                                ref={tallaCamisaRef}
                                                value={tallaCamisa}
                                                onChange={(e) => setTallaCamisa(e.target.value)}
                                                onKeyDown={(e) => handleKeyDownNext(e, tallaPantalonRef)}
                                                className="w-full appearance-none px-3 py-2 pr-7 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition cursor-pointer"
                                            >
                                                {TALLAS_ROPA.map((t) => (
                                                    <option key={t} value={t}>
                                                        {t}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                            TALLA PANTALÓN
                                        </label>
                                        <div className="relative">
                                            <select
                                                ref={tallaPantalonRef}
                                                value={tallaPantalon}
                                                onChange={(e) => setTallaPantalon(e.target.value)}
                                                onKeyDown={(e) => handleKeyDownNext(e, tallaChemiseRef)}
                                                className="w-full appearance-none px-3 py-2 pr-7 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition cursor-pointer"
                                            >
                                                {TALLAS_PANTALON.map((t) => (
                                                    <option key={t} value={t}>
                                                        {t}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                            TALLA CHEMISE
                                        </label>
                                        <div className="relative">
                                            <select
                                                ref={tallaChemiseRef}
                                                value={tallaChemise}
                                                onChange={(e) => setTallaChemise(e.target.value)}
                                                onKeyDown={(e) => handleKeyDownNext(e, tallaFranelaRef)}
                                                className="w-full appearance-none px-3 py-2 pr-7 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition cursor-pointer"
                                            >
                                                {TALLAS_ROPA.map((t) => (
                                                    <option key={t} value={t}>
                                                        {t}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                            TALLA FRANELA
                                        </label>
                                        <div className="relative">
                                            <select
                                                ref={tallaFranelaRef}
                                                value={tallaFranela}
                                                onChange={(e) => setTallaFranela(e.target.value)}
                                                onKeyDown={(e) => handleKeyDownNext(e, tallaCalzadoRef)}
                                                className="w-full appearance-none px-3 py-2 pr-7 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition cursor-pointer"
                                            >
                                                {TALLAS_ROPA.map((t) => (
                                                    <option key={t} value={t}>
                                                        {t}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                            TALLA CALZADO
                                        </label>
                                        <div className="relative">
                                            <select
                                                ref={tallaCalzadoRef}
                                                value={tallaCalzado}
                                                onChange={(e) => setTallaCalzado(e.target.value)}
                                                onKeyDown={(e) => handleKeyDownNext(e, bancoRef)}
                                                className="w-full appearance-none px-3 py-2 pr-7 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition cursor-pointer"
                                            >
                                                {TALLAS_CALZADO.map((t) => (
                                                    <option key={t} value={t}>
                                                        {t}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ─── 4. DATOS FINANCIEROS / NÓMINA & UNIDAD HABITUAL ─── */}
                        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                                        <Building2 className="w-5 h-5 stroke-[2.2]" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-slate-900 tracking-tight">
                                            4. Datos Financieros / Nómina & Unidad Habitual
                                        </h2>
                                        <p className="text-xs text-slate-400 font-medium">
                                            Cuentas receptoras de viáticos y asignación técnica de flota
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200/70 px-2.5 py-1 rounded-md tracking-wider uppercase font-mono">
                                    SQL: PAYROLL & TRUCK
                                </span>
                            </div>

                            {/* Fila 1: Banco, Cuenta, Pago Móvil */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Banco Receptor
                                    </label>
                                    <div className="relative">
                                        <select
                                            ref={bancoRef}
                                            value={banco}
                                            onChange={(e) => setBanco(e.target.value)}
                                            onKeyDown={(e) => handleKeyDownNext(e, nroCuentaRef)}
                                            className="w-full appearance-none px-3.5 py-2.5 pr-8 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-semibold text-slate-800 outline-none transition cursor-pointer"
                                        >
                                            {BANCOS_VENEZUELA.map((b) => (
                                                <option key={b} value={b}>
                                                    {b}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Número de Cuenta (20 Dígitos)
                                    </label>
                                    <input
                                        ref={nroCuentaRef}
                                        type="text"
                                        maxLength={30}
                                        value={nroCuenta}
                                        onChange={(e) => setNroCuenta(e.target.value)}
                                        onKeyDown={(e) => handleKeyDownNext(e, pagoMovilRef)}
                                        placeholder="0102 0182 9901 0000 1234"
                                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder-slate-400 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Pago Móvil (Teléfono)
                                    </label>
                                    <input
                                        ref={pagoMovilRef}
                                        type="text"
                                        value={pagoMovil}
                                        onChange={(e) => setPagoMovil(e.target.value)}
                                        onKeyDown={(e) => handleKeyDownNext(e, estadoRef)}
                                        placeholder="0414-7892011"
                                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Fila 2: Estado Operativo, Unidad Asignada, Fecha de Ingreso */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Estado Operativo Inicial (ENUM) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            ref={estadoRef}
                                            value={estado}
                                            onChange={(e) => setEstado(e.target.value as ConductorEstado)}
                                            onKeyDown={(e) => handleKeyDownNext(e, idVehiculoHabitualRef)}
                                            className="w-full appearance-none px-3.5 py-2.5 pr-8 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-bold text-slate-800 outline-none transition cursor-pointer"
                                        >
                                            <option value="Activo">Activo (Disponible en Base)</option>
                                            <option value="En_Ruta">En Ruta (Operativo)</option>
                                            <option value="Vacaciones">Vacaciones (Permiso)</option>
                                            <option value="Inactivo">Inactivo (Reposo Médico)</option>
                                            <option value="Suspendido">Suspendido (Auditoría)</option>
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Vehículo Habitual Asignado
                                    </label>
                                    <div className="relative">
                                        <select
                                            ref={idVehiculoHabitualRef}
                                            value={idVehiculoHabitual}
                                            onChange={(e) => setIdVehiculoHabitual(e.target.value)}
                                            onKeyDown={(e) => handleKeyDownNext(e, fechaIngresoRef)}
                                            className="w-full appearance-none px-3.5 py-2.5 pr-8 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-semibold text-slate-800 outline-none transition cursor-pointer truncate"
                                        >
                                            <option value="">Sin Asignar / Reserva</option>
                                            {vehiculos.map((v) => (
                                                <option key={v.idVehiculo} value={v.idVehiculo}>
                                                    {v.placa} - {v.marca} {v.modelo || ''}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                                        Fecha de Ingreso <span className="text-rose-500">*</span>
                                    </label>
                                    <DateInput
                                        ref={fechaIngresoRef}
                                        required
                                        value={fechaIngreso}
                                        onChange={setFechaIngreso}
                                        onKeyDown={(e) => handleKeyDownNext(e, submitBtnRef)}
                                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl text-xs font-medium text-slate-800 outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Selector de Fotografía de Perfil */}
                            <div className="pt-2 border-t border-slate-100">
                                <SelectorImagen
                                    forma="circulo"
                                    etiqueta="Fotografía Oficial del Operador"
                                    urlActual={conductorOriginal?.fotoUrl}
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

                    </div>

                    {/* ══════════ COLUMNA DERECHA: CARNET EN VIVO & ACCIONES (4 cols) ══════════ */}
                    <div className="lg:col-span-4 sticky top-20 space-y-4">
                        {/* Header del Carnet */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <IdCard className="w-4 h-4 text-emerald-600" />
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                                    FICHA TÉCNICA & CARNET EN VIVO
                                </h3>
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200/60 font-mono">
                                Sincronización Realtime
                            </span>
                        </div>

                        {/* ─── CREDENCIAL DIGITAL DEL OPERADOR ─── */}
                        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden transition-all duration-300">
                            {/* Franja Superior Naranja */}
                            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-3.5 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-xs">
                                        FF
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black tracking-wider leading-none">
                                            FLEETFLOW ENTERPRISE
                                        </h4>
                                        <span className="text-[9px] font-medium text-orange-100 tracking-tight">
                                            CREDENCIAL DIGITAL DEL OPERADOR
                                        </span>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 rounded-md bg-black/25 backdrop-blur-xs text-[10px] font-mono font-bold text-amber-200">
                                    ID: {cedulaIdentidad || 'PF-2024-001'}
                                </span>
                            </div>

                            {/* Contenido de la Credencial */}
                            <div className="p-4 space-y-3.5">
                                {/* Cabecera del Operador: Foto + Nombre + Estado */}
                                <div className="flex items-start gap-3">
                                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs flex items-center justify-center">
                                        {fotoArchivo ? (
                                            <img
                                                src={URL.createObjectURL(fotoArchivo)}
                                                alt="Previsualización"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : conductorOriginal?.fotoUrl && !quitarFoto ? (
                                            <ImagenProtegida
                                                url={conductorOriginal.fotoUrl}
                                                alt={nombres}
                                                className="w-full h-full object-cover"
                                                fallback={
                                                    <span className="font-black text-slate-400 text-base">
                                                        {nombres ? nombres.charAt(0) : 'O'}
                                                        {apellidos ? apellidos.charAt(0) : 'P'}
                                                    </span>
                                                }
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-orange-600 font-black text-lg">
                                                {nombres ? nombres.charAt(0) : 'O'}
                                                {apellidos ? apellidos.charAt(0) : 'P'}
                                            </div>
                                        )}
                                        <span className="absolute bottom-0 right-0 bg-slate-900 text-amber-300 text-[8px] font-black px-1 rounded-tl-md">
                                            PRO
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                                                {cedulaIdentidad || 'V-00.000.000'}
                                            </span>
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${estado === 'Activo'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : estado === 'En_Ruta'
                                                        ? 'bg-sky-100 text-sky-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                    }`}
                                            >
                                                • {ESTADO_CONDUCTOR_LABELS[estado] || 'Activo'}
                                            </span>
                                        </div>

                                        <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate mt-1 leading-tight">
                                            {nombres || apellidos ? `${nombres} ${apellidos}` : 'Nombre del Operador'}
                                        </h3>

                                        <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1">
                                            <span>🏢 Base Operativa:</span>
                                            <span className="font-semibold text-slate-700">
                                                {estadoCiudadMunicipio || 'Valencia Central'}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* 4 Bloques Clave de Datos */}
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div className="p-2 rounded-xl bg-rose-50/80 border border-rose-100 flex items-center gap-2">
                                        <Droplets className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                        <div className="truncate">
                                            <span className="text-[9px] uppercase font-bold text-rose-700 block leading-tight">
                                                Grupo Sanguíneo
                                            </span>
                                            <span className="font-black text-rose-950 truncate">
                                                {tipoSangreCorto || 'O+'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <div className="truncate">
                                            <span className="text-[9px] uppercase font-bold text-emerald-700 block leading-tight">
                                                Teléfono Móvil
                                            </span>
                                            <span className="font-bold text-emerald-950 truncate">
                                                {telefono || '+58 414-0000000'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-2 rounded-xl bg-sky-50/80 border border-sky-100 flex items-center gap-2 col-span-2">
                                        <Truck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                        <div className="truncate">
                                            <span className="text-[9px] uppercase font-bold text-sky-700 block leading-tight">
                                                Tractocamión Asignado
                                            </span>
                                            <span className="font-bold text-sky-950 truncate">
                                                {vehiculoSeleccionado
                                                    ? `${vehiculoSeleccionado.placa} - ${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo || ''}`
                                                    : 'Sin Asignación / Reserva'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-100 flex items-center gap-2 col-span-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        <div className="truncate">
                                            <span className="text-[9px] uppercase font-bold text-amber-700 block leading-tight">
                                                Contacto SOS en Ruta
                                            </span>
                                            <span className="font-semibold text-amber-950 truncate">
                                                {personaContacto || 'No asignado'}{' '}
                                                {telefonoContacto ? `(${telefonoContacto})` : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tallas de Dotación Uniforme & EPP */}
                                <div className="pt-2 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <Shirt className="w-3 h-3 text-slate-400" />
                                            <span className="text-[10px] font-bold uppercase text-slate-600">
                                                Dotación Uniforme & EPP
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                            Tallaje Registrado
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-5 gap-1 text-center font-mono text-[9px]">
                                        <div className="bg-slate-50 rounded-lg p-1 border border-slate-100">
                                            <span className="text-slate-400 block text-[8px]">CAMISA</span>
                                            <span className="font-bold text-slate-800">{tallaCamisa}</span>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-1 border border-slate-100">
                                            <span className="text-slate-400 block text-[8px]">PANTALÓN</span>
                                            <span className="font-bold text-slate-800">{tallaPantalon}</span>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-1 border border-slate-100">
                                            <span className="text-slate-400 block text-[8px]">CHEMISE</span>
                                            <span className="font-bold text-slate-800">{tallaChemise}</span>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-1 border border-slate-100">
                                            <span className="text-slate-400 block text-[8px]">FRANELA</span>
                                            <span className="font-bold text-slate-800">{tallaFranela}</span>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-1 border border-slate-100">
                                            <span className="text-slate-400 block text-[8px]">CALZADO</span>
                                            <span className="font-bold text-slate-800">{tallaCalzado}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Código de barras y Validación ERP */}
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-1 opacity-70">
                                        <div className="flex gap-[2px] items-center h-4">
                                            <div className="w-[1.5px] h-full bg-slate-800" />
                                            <div className="w-[3px] h-full bg-slate-800" />
                                            <div className="w-[1px] h-full bg-slate-800" />
                                            <div className="w-[2px] h-full bg-slate-800" />
                                            <div className="w-[4px] h-full bg-slate-800" />
                                            <div className="w-[1px] h-full bg-slate-800" />
                                            <div className="w-[2px] h-full bg-slate-800" />
                                            <div className="w-[3px] h-full bg-slate-800" />
                                            <div className="w-[1.5px] h-full bg-slate-800" />
                                        </div>
                                        <span className="text-[8px] font-mono font-bold text-slate-400">
                                            FLEETFLOW ERP
                                        </span>
                                    </div>

                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        Validado ERP
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Botones de Acción de la Columna Lateral */}
                        <div className="space-y-2 pt-2">
                            <button
                                ref={submitBtnRef}
                                type="button"
                                disabled={guardando}
                                onClick={() => handleSubmit()}
                                className="w-full py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                            >
                                {guardando ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Guardando en Servidor...</span>
                                    </>
                                ) : (
                                    <>
                                        <User className="w-4 h-4" />
                                        <span>
                                            {isEditing
                                                ? 'Guardar Cambios del Conductor'
                                                : 'Registrar Conductor en Sistema'}
                                        </span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                disabled={guardando}
                                onClick={() => navigate('/conductores')}
                                className="w-full py-2.5 rounded-2xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200/80 transition flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Descartar / Volver al Directorio</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
