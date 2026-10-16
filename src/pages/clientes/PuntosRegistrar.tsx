import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Save,
  ArrowLeft,
  Target,
  ArrowLeftRight,
  Clock,
  Phone,
  User,
  Compass,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';
import { Card } from '../../components/ui';
import {
  puntosCargaService,
  type CreatePuntoCargaDto,
} from '../../services/puntosCargaService';
import {
  clientesService,
  type Cliente,
} from '../../services/clientesService';
import { getApiErrorMessage } from '../../services/api';

const ESTADOS_VENEZUELA = [
  'Carabobo',
  'Miranda',
  'Distrito Capital',
  'Aragua',
  'Lara',
  'Zulia',
  'Anzoátegui',
  'Bolívar',
  'Portuguesa',
  'Yaracuy',
  'Guárico',
  'Falcón',
  'Monagas',
  'Táchira',
  'Mérida',
  'Trujillo',
  'Barinas',
  'Sucre',
  'Cojedes',
  'Nueva Esparta',
];

const COORDENADAS_CIUDADES: Record<string, { lat: number; lng: number }> = {
  'san joaquín': { lat: 10.2642, lng: -67.7891 },
  'valencia': { lat: 10.162, lng: -67.9966 },
  'puerto cabello': { lat: 10.48, lng: -68.01 },
  'caracas': { lat: 10.4912, lng: -66.8288 },
  'maracay': { lat: 10.2469, lng: -67.5958 },
  'barquisimeto': { lat: 10.0647, lng: -69.357 },
  'maracaibo': { lat: 10.6427, lng: -71.6125 },
  'barcelona': { lat: 10.1362, lng: -64.6862 },
  'acarigua': { lat: 9.5545, lng: -69.1979 },
  'guatire': { lat: 10.4744, lng: -66.5414 },
};

export default function PuntosRegistrar() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const clienteIdUrl = searchParams.get('clienteId') || '';

  const isEditing = Boolean(id);

  // Referencias para navegación secuencial fluida con la tecla Enter
  const idClienteRef = useRef<HTMLSelectElement>(null);
  const nombreSedeRef = useRef<HTMLInputElement>(null);
  const estadoRef = useRef<HTMLSelectElement>(null);
  const ciudadRef = useRef<HTMLInputElement>(null);
  const codigoPostalRef = useRef<HTMLInputElement>(null);
  const direccionRef = useRef<HTMLInputElement>(null);
  const contactoAlmacenRef = useRef<HTMLInputElement>(null);
  const telefonoAlmacenRef = useRef<HTMLInputElement>(null);
  const horarioAtencionRef = useRef<HTMLInputElement>(null);
  const instruccionesAccesoRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const topSubmitBtnRef = useRef<HTMLButtonElement>(null);

  // Salto secuencial de foco al presionar Enter
  const handleKeyDownNext = (
    e: React.KeyboardEvent,
    target: React.RefObject<any>
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      target.current?.focus();
    }
  };

  // Clientes para vincular
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreatePuntoCargaDto>({
    idCliente: clienteIdUrl,
    nombreSede: '',
    tipoPunto: 'Origen',
    direccion: '',
    ciudad: 'San Joaquín',
    estado: 'Carabobo',
    codigoPostal: '',
    contactoAlmacen: '',
    telefonoAlmacen: '',
    horarioAtencion: '24/7 (3 Turnos Rotativos)',
    instruccionesAcceso: 'Acceso con EPP completo & Precinto',
    activo: true,
  });

  // Coordenadas simuladas/calculadas
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lng: number }>({
    lat: 10.2642,
    lng: -67.7891,
  });

  // Cargar lista de clientes
  useEffect(() => {
    async function fetchClientes() {
      try {
        const res = await clientesService.getClientes();
        if (res && res.length > 0) {
          setClientes(res);
          // Si no hay idCliente seleccionado aún y vino clienteIdUrl o el primero
          if (!formData.idCliente) {
            setFormData((prev) => ({
              ...prev,
              idCliente: clienteIdUrl || res[0].idCliente,
            }));
          }
        }
      } catch (err) {
        console.error('Error cargando clientes:', err);
      }
    }
    fetchClientes();
  }, [clienteIdUrl]);

  // Si estamos en modo edición, cargar datos del punto
  useEffect(() => {
    if (isEditing && id) {
      async function fetchPunto() {
        try {
          setLoading(true);
          const punto = await puntosCargaService.getPuntoById(id!);
          if (punto) {
            setFormData({
              idCliente: punto.idCliente,
              nombreSede: punto.nombreSede,
              tipoPunto: punto.tipoPunto,
              direccion: punto.direccion,
              ciudad: punto.ciudad,
              estado: punto.estado,
              codigoPostal: punto.codigoPostal || '',
              contactoAlmacen: punto.contactoAlmacen || '',
              telefonoAlmacen: punto.telefonoAlmacen || '',
              horarioAtencion: punto.horarioAtencion || '',
              instruccionesAcceso: punto.instruccionesAcceso || '',
              activo: punto.activo,
            });
            // Coordenadas asociadas
            const ciudadKey = punto.ciudad.toLowerCase().trim();
            if (COORDENADAS_CIUDADES[ciudadKey]) {
              setCoordenadas(COORDENADAS_CIUDADES[ciudadKey]);
            }
          }
        } catch (err) {
          console.error('Error cargando punto a editar:', err);
          setErrorMsg('No se pudo cargar la información del punto logístico.');
        } finally {
          setLoading(false);
        }
      }
      fetchPunto();
    }
  }, [isEditing, id]);

  // Autofoco inicial en el primer campo interactivo
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (formData.idCliente) {
          nombreSedeRef.current?.focus();
        } else {
          idClienteRef.current?.focus();
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Manejar cambio en ciudad para autocalcular coordenadas estimadas PostGIS
  const handleCiudadChange = (ciudad: string) => {
    setFormData((prev) => ({ ...prev, ciudad }));
    const ciudadKey = ciudad.toLowerCase().trim();
    if (COORDENADAS_CIUDADES[ciudadKey]) {
      setCoordenadas(COORDENADAS_CIUDADES[ciudadKey]);
    }
  };

  // Verificación: Validación de campos obligatorios requeridos
  const isDatosCompletos = Boolean(
    formData.idCliente?.trim() &&
    formData.nombreSede?.trim() &&
    formData.estado?.trim() &&
    formData.ciudad?.trim() &&
    formData.direccion?.trim()
  );

  const puedeGuardar = isDatosCompletos;

  // Enviar formulario
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!isDatosCompletos) {
      if (!formData.idCliente) {
        setErrorMsg('Debes seleccionar un cliente corporativo vinculado.');
        idClienteRef.current?.focus();
      } else if (!formData.nombreSede.trim()) {
        setErrorMsg('El nombre de la sede es obligatorio.');
        nombreSedeRef.current?.focus();
      } else if (!formData.estado.trim()) {
        setErrorMsg('El estado geográfico es obligatorio.');
        estadoRef.current?.focus();
      } else if (!formData.ciudad.trim()) {
        setErrorMsg('La ciudad o municipio es obligatoria.');
        ciudadRef.current?.focus();
      } else if (!formData.direccion.trim()) {
        setErrorMsg('La dirección física detallada es obligatoria.');
        direccionRef.current?.focus();
      }
      return;
    }

    setGuardando(true);
    try {
      if (isEditing && id) {
        await puntosCargaService.updatePunto(id, formData);
        setSuccessToast('Punto logístico actualizado correctamente');
      } else {
        await puntosCargaService.createPunto(formData);
        setSuccessToast('Nuevo punto logístico registrado exitosamente');
      }

      setTimeout(() => {
        navigate('/clientes/puntos-carga-descarga');
      }, 900);
    } catch (err) {
      console.error('Error al guardar punto:', err);
      const msg = getApiErrorMessage(
        err,
        'No se pudo guardar el punto. Verifique los datos o conexión con el servidor.'
      );
      setErrorMsg(msg);
      setTimeout(() => {
        navigate('/clientes/puntos-carga-descarga');
      }, 1500);
    } finally {
      setGuardando(false);
    }
  };

  const geocodigoFormateado = `${coordenadas.lat.toFixed(4)}° N, ${Math.abs(coordenadas.lng).toFixed(4)}° W`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">
          Cargando expediente del punto logístico...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto bg-slate-50/50 min-h-screen">
      {/* Toast de éxito */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ─── 1. BREADCRUMB & HEADER ─── */}
      <div className="space-y-3">
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span
            className="hover:text-slate-600 transition cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            Logístico
          </span>
          <span className="text-slate-300">&gt;</span>
          <span
            className="hover:text-slate-600 transition cursor-pointer"
            onClick={() => navigate('/clients')}
          >
            Clientes &amp; Destinos
          </span>
          <span className="text-slate-300">&gt;</span>
          <span
            className="hover:text-slate-600 transition cursor-pointer"
            onClick={() => navigate('/clientes/puntos-carga-descarga')}
          >

            Puntos de Carga y Descarga
          </span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-700 font-bold">
            {isEditing ? 'Editar Sede' : 'Nuevo Registro'}
          </span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/clientes/puntos-carga-descarga')}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer shadow-2xs"
                title="Regresar a puntos de carga"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                <span className="text-teal-900"> {isEditing ? 'Editar Punto Logístico' : 'Registrar Nuevo Punto de Carga y Descarga'}  </span>

              </h1>
            </div>

          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            {/* Indicador de estado en cabecera */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold">
              {puedeGuardar ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Listo para Guardar
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  Campos requeridos pendientes
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/clientes/puntos-carga-descarga')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              ref={topSubmitBtnRef}
              type="button"
              onClick={() => handleSubmit()}
              disabled={!puedeGuardar || guardando}
              title={
                !isDatosCompletos
                  ? 'Completa todos los campos obligatorios (*)'
                  : isEditing
                    ? 'Actualizar Punto'
                    : 'Guardar Punto Logístico'
              }
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition select-none ${puedeGuardar && !guardando
                ? 'text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 active:scale-98 cursor-pointer'
                : 'text-slate-400 bg-slate-200 border border-slate-300 cursor-not-allowed opacity-60'
                }`}
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  {puedeGuardar ? (
                    <Save className="w-4 h-4" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  <span>{isEditing ? 'Actualizar Punto' : 'Guardar Punto Logístico'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Error si aplica */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ─── FORMULARIO EN SECCIONES TIPO TARJETA ─── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECCIÓN 1: VINCULACIÓN CORPORATIVA & TIPO OPERATIVO */}
        <Card className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-orange-50 border border-orange-100 text-orange-600">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                1. Vinculación Corporativa &amp; Tipo Operativo
              </h2>
              <p className="text-xs text-slate-400">
                Define la empresa titular y el rol logístico de este punto en la red de transporte.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cliente Corporativo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Cliente Corporativo Vinculado <span className="text-orange-500">*</span>
              </label>
              <select
                ref={idClienteRef}
                value={formData.idCliente}
                onChange={(e) => setFormData({ ...formData, idCliente: e.target.value })}
                onKeyDown={(e) => handleKeyDownNext(e, nombreSedeRef)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition cursor-pointer"
                required
              >
                <option value="">-- Selecciona el cliente titular ({clientes.length} disponibles) --</option>
                {clientes.map((c) => (
                  <option key={c.idCliente} value={c.idCliente}>
                    {c.razonSocial} {c.nombreComercial ? `(${c.nombreComercial}) ` : ''}[RIF: {c.rif}]
                  </option>
                ))}
              </select>
            </div>

            {/* Nombre de la Sede */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Nombre de la Sede / Almacén / Andén <span className="text-orange-500">*</span>
              </label>
              <input
                ref={nombreSedeRef}
                type="text"
                value={formData.nombreSede}
                onChange={(e) => setFormData({ ...formData, nombreSede: e.target.value })}
                onKeyDown={(e) => handleKeyDownNext(e, estadoRef)}
                placeholder="Ej. Planta San Joaquín - Silos Sur"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                required
              />
            </div>
          </div>

          {/* Selector de Tipo de Punto con Tarjetas Interactivas */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-700">
              Tipo de Punto Logístico <span className="text-orange-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Opción 1: Origen */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipoPunto: 'Origen' })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setFormData({ ...formData, tipoPunto: 'Origen' });
                    estadoRef.current?.focus();
                  }
                }}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${formData.tipoPunto === 'Origen'
                  ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
              >
                <div
                  className={`p-2 rounded-lg ${formData.tipoPunto === 'Origen'
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                    }`}
                >
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Origen (Carga)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Planta de manufactura, molinos o silos de despacho.
                  </p>
                </div>
              </button>

              {/* Opción 2: Destino */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipoPunto: 'Destino' })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setFormData({ ...formData, tipoPunto: 'Destino' });
                    estadoRef.current?.focus();
                  }
                }}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${formData.tipoPunto === 'Destino'
                  ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
              >
                <div
                  className={`p-2 rounded-lg ${formData.tipoPunto === 'Destino'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                    }`}
                >
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Destino (Descarga)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Centro de distribución, terminal portuario o cliente final.
                  </p>
                </div>
              </button>

              {/* Opción 3: Ambos */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipoPunto: 'Ambos' })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setFormData({ ...formData, tipoPunto: 'Ambos' });
                    estadoRef.current?.focus();
                  }
                }}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${formData.tipoPunto === 'Ambos'
                  ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
              >
                <div
                  className={`p-2 rounded-lg ${formData.tipoPunto === 'Ambos'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                    }`}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Ambos (Mixto)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Habilitado simultáneamente para cargue y descargue.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </Card>

        {/* SECCIÓN 2: UBICACIÓN GEOGRÁFICA & POSTGIS */}
        <Card className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  2. Ubicación Física &amp; Georreferenciación
                </h2>
                <p className="text-xs text-slate-400">
                  Coordenadas y dirección estandarizada para cálculo de kilometraje y tiempos de ruta.
                </p>
              </div>
            </div>

            {/* Geocódigo Preview */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 text-xs font-mono font-bold">
              <Compass className="w-4 h-4 text-sky-500" />
              <span>{geocodigoFormateado}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Estado */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Estado <span className="text-orange-500">*</span>
              </label>
              <select
                ref={estadoRef}
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                onKeyDown={(e) => handleKeyDownNext(e, ciudadRef)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition cursor-pointer"
                required
              >
                {ESTADOS_VENEZUELA.map((est) => (
                  <option key={est} value={est}>
                    {est}
                  </option>
                ))}
              </select>
            </div>

            {/* Ciudad */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Ciudad / Municipio <span className="text-orange-500">*</span>
              </label>
              <input
                ref={ciudadRef}
                type="text"
                value={formData.ciudad}
                onChange={(e) => handleCiudadChange(e.target.value)}
                onKeyDown={(e) => handleKeyDownNext(e, codigoPostalRef)}
                placeholder="Ej. San Joaquín, Puerto Cabello, Caracas"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                required
              />
            </div>

            {/* Código Postal */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Código Postal</label>
              <input
                ref={codigoPostalRef}
                type="text"
                value={formData.codigoPostal || ''}
                onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                onKeyDown={(e) => handleKeyDownNext(e, direccionRef)}
                placeholder="Ej. 2005"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>

          {/* Dirección Completa */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Dirección Detallada / Zona Industrial <span className="text-orange-500">*</span>
            </label>
            <input
              ref={direccionRef}
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              onKeyDown={(e) => handleKeyDownNext(e, contactoAlmacenRef)}
              placeholder="Ej. Carretera Panamericana Km 104, Zona Industrial San Joaquín, Galpón 4"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              required
            />
          </div>
        </Card>

        {/* SECCIÓN 3: CONTACTO DE ALMACÉN & OPERACIONES */}
        <Card className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-teal-50 border border-teal-100 text-teal-600">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                3. Contacto en Almacén &amp; Coordinación de Patio
              </h2>
              <p className="text-xs text-slate-400">
                Persona encargada de recepción de conductores y validación de guías de carga.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Contacto Almacén */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Nombre del Contacto / Jefe de Despacho
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={contactoAlmacenRef}
                  type="text"
                  value={formData.contactoAlmacen || ''}
                  onChange={(e) => setFormData({ ...formData, contactoAlmacen: e.target.value })}
                  onKeyDown={(e) => handleKeyDownNext(e, telefonoAlmacenRef)}
                  placeholder="Ej. Ing. Roberto Da Silva"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
              </div>
            </div>

            {/* Teléfono Almacén */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Teléfono Directo de Patio / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={telefonoAlmacenRef}
                  type="text"
                  value={formData.telefonoAlmacen || ''}
                  onChange={(e) => setFormData({ ...formData, telefonoAlmacen: e.target.value })}
                  onKeyDown={(e) => handleKeyDownNext(e, horarioAtencionRef)}
                  placeholder="Ej. +58 414-2391024"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* SECCIÓN 4: HORARIOS, RESTRICCIONES & ESTADO */}
        <Card className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                4. Horarios de Operación &amp; Restricciones de Acceso
              </h2>
              <p className="text-xs text-slate-400">
                Normativas de seguridad industrial y turnos de andenes para los conductores.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Horario de Atención */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Horario de Atención / Turnos
              </label>
              <input
                ref={horarioAtencionRef}
                type="text"
                value={formData.horarioAtencion || ''}
                onChange={(e) => setFormData({ ...formData, horarioAtencion: e.target.value })}
                onKeyDown={(e) => handleKeyDownNext(e, instruccionesAccesoRef)}
                placeholder="Ej. 24/7 (3 Turnos Rotativos) o Lun-Sáb: 06:00 - 19:00"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>

            {/* Restricciones e Instrucciones de Acceso */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Instrucciones &amp; Restricciones de Seguridad (EPP / Precinto)
              </label>
              <input
                ref={instruccionesAccesoRef}
                type="text"
                value={formData.instruccionesAcceso || ''}
                onChange={(e) => setFormData({ ...formData, instruccionesAcceso: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitBtnRef.current?.focus();
                  }
                }}
                placeholder="Ej. Acceso con EPP completo, precinto obligatorio y botas de seguridad"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>

          {/* Estado Activo Toggle */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-800">Estado de Operación</span>
              <p className="text-[11px] text-slate-400">
                Las sedes inactivas no estarán disponibles para la creación de nuevas guías ni proformas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, activo: !formData.activo })}
              className="inline-flex items-center gap-2 cursor-pointer select-none"
            >
              <div
                className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-200 ${formData.activo ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-200 ${formData.activo ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </div>
              <span className="text-xs font-bold text-slate-700">
                {formData.activo ? 'Activo' : 'Inactivo'}
              </span>
            </button>
          </div>
        </Card>

        {/* Barra Inferior de Acción */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200/60">
          <div className="flex items-center gap-2 text-xs">
            {puedeGuardar ? (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 font-semibold shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Listo para guardar el punto logístico.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 font-medium">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Completa todos los campos obligatorios (*) para habilitar el guardado.</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/clientes/puntos-carga-descarga')}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              ref={submitBtnRef}
              type="submit"
              disabled={!puedeGuardar || guardando}
              title={
                !isDatosCompletos
                  ? 'Completa todos los campos obligatorios (*)'
                  : isEditing
                    ? 'Actualizar Punto'
                    : 'Guardar Punto Logístico'
              }
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition select-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 ${puedeGuardar && !guardando
                ? 'text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 active:scale-98 cursor-pointer'
                : 'text-slate-400 bg-slate-200 border border-slate-300 cursor-not-allowed opacity-60'
                }`}
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  {puedeGuardar ? (
                    <Save className="w-4 h-4" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  <span>{isEditing ? 'Actualizar Punto' : 'Guardar Punto Logístico'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
