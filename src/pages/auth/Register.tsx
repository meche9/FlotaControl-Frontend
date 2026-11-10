import { useState, useRef, useEffect, type FormEvent, type ChangeEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { getApiErrorMessage } from '../../services/api';
import {
  Truck,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Shield,
  ShieldCheck,
  Check,
  RotateCw,
  CreditCard,
  Zap,
  Headphones,
  Info,
  CheckCircle2,
  Key,
  Globe,
  SlidersHorizontal,
  X,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const PASSWORD_MIN = 4;
const PASSWORD_MAX = 64;

export default function Register() {
  const navigate = useNavigate();
  const { establecerSesion } = useAuth();

  // Paso actual: 1 (Datos de cuenta) o 2 (Verificación OTP)
  const [step, setStep] = useState<1 | 2>(1);

  // Modo de vista: split corporativo (Imagen 3) o tarjeta centrada (Imagen 1)
  const [viewMode, setViewMode] = useState<'split' | 'centered'>('split');

  // Formulario Paso 1
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [telefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Simulación de error de validación (botón en Imagen 3)
  const [simulatedError, setSimulatedError] = useState(false);

  // Formulario Paso 2 (OTP de 6 dígitos)
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Estado de carga y errores
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Temporizador para reenvío de código (60 segundos)
  const [cooldown, setCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Modal de Términos / Privacidad
  const [modalContent, setModalContent] = useState<'terms' | 'privacy' | null>(null);

  // Éxito final
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // Efecto para cuenta regresiva del botón reenviar
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 2 && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, cooldown]);

  // Enfocar el primer input del código OTP al pasar al Paso 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Validaciones de contraseña
  const passwordChecks = {
    length: password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const checksPassedCount = Object.values(passwordChecks).filter(Boolean).length;
  const isPasswordStrong = checksPassedCount === 5;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Manejo de Inputs OTP individuales
  const handleOtpChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    const newOtp = [...otp];

    if (val.length > 0) {
      newOtp[index] = val[val.length - 1]; // tomar el último dígito ingresado
      setOtp(newOtp);
      // Avanzar al siguiente input
      if (index < 5) {
        otpInputsRef.current[index + 1]?.focus();
      }
    } else {
      newOtp[index] = '';
      setOtp(newOtp);
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Enfocar el input correspondiente
    const targetIdx = Math.min(pastedData.length, 5);
    otpInputsRef.current[targetIdx]?.focus();
  };

  // Enviar formulario Paso 1
  const handleSubmitStep1 = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (simulatedError) {
      setError('El dominio corporativo ingresado no está habilitado para auto-registro. Contacte a soporte.');
      return;
    }

    if (!nombreCompleto.trim()) {
      setError('Por favor ingrese su nombre completo o razón social.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Por favor ingrese un correo corporativo válido.');
      return;
    }

    if (!passwordChecks.length) {
      setError(`La contraseña debe tener mínimo ${PASSWORD_MIN} caracteres.`);
      return;
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!acceptedTerms) {
      setError('Debe aceptar los Términos de Servicio y la Política de Privacidad.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.registerRequest({
        nombreCompleto: nombreCompleto.trim(),
        email: email.trim().toLowerCase(),
        password,
        telefono: telefono.trim() || undefined,
      });

      if (response.devCode) {
        setDevCode(response.devCode);
      }

      setStep(2);
      setCooldown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al procesar la solicitud de registro. Intente nuevamente.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Reenviar código OTP
  const handleResendCode = async () => {
    if (!canResend || isLoading) return;

    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await authService.registerResend({ email: email.trim().toLowerCase() });
      if (res.devCode) {
        setDevCode(res.devCode);
      }
      setSuccessMessage('Se ha enviado un nuevo código a su correo.');
      setCooldown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al reenviar el código. Espere un momento.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar verificación Paso 2
  const handleSubmitStep2 = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      setError('Por favor ingrese los 6 dígitos del código de verificación.');
      return;
    }

    setIsLoading(true);

    try {
      const sesion = await authService.registerVerify({
        email: email.trim().toLowerCase(),
        code: fullCode,
      });

      setRegistrationComplete(true);
      establecerSesion(sesion);

      // Redirigir al dashboard después de 1.8 segundos
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1800);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Código de verificación incorrecto o expirado.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans antialiased selection:bg-orange-500 selection:text-white">

      {/* ── HEADER SUPERIOR (Referencia Imágenes 1, 2 y 3) ── */}
      <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo y versión de plataforma */}
          <div className="flex items-center gap-3">
            <Link to="/login" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight text-slate-900">
                    Fleet<span className="text-orange-600">Flow</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    ENTERPRISE
                  </span>
                </div>
              </div>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Cloud Suite v4.2
            </span>
          </div>

          {/* Navegación y utilidades */}
          <div className="flex items-center gap-4 sm:gap-6 text-xs font-semibold text-slate-600">
            <nav className="hidden md:flex items-center gap-5 text-slate-500 hover:text-slate-900 transition-colors">
              <a href="#help" onClick={(e) => { e.preventDefault(); alert('Centro de Ayuda FleetFlow Enterprise: Documentación de integración y soporte 24/7 disponible.'); }} className="hover:text-slate-900">Help Center</a>
              <a href="#status" onClick={(e) => { e.preventDefault(); alert('Estado de los Sistemas: Todos los servicios operando normalmente (99.98% SLA).'); }} className="hover:text-slate-900">System Status</a>
              <a href="#docs" onClick={(e) => { e.preventDefault(); alert('API Docs: Swagger / OpenAPI 3.0 para orquestación de flotas.'); }} className="hover:text-slate-900">API Docs</a>
            </nav>

            {/* Alternador de vista: split vs centered (para apreciar ambas referencias) */}
            {step === 1 && (
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'split' ? 'centered' : 'split')}
                title="Alternar diseño: Vista Corporativa (Imagen 3) / Vista Tarjeta (Imagen 1)"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-slate-600 hover:text-orange-600 bg-slate-100 hover:bg-orange-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-orange-500" />
                <span>{viewMode === 'split' ? 'Vista Tarjeta' : 'Vista Corporativa'}</span>
              </button>
            )}

            <div className="flex items-center gap-2 border-l border-slate-200 pl-4 sm:pl-6">
              <button
                type="button"
                onClick={() => alert('Soporte Corporativo: Teléfono +58 (241) 800-FLEET')}
                className="flex items-center gap-1.5 text-slate-700 hover:text-orange-600 font-semibold cursor-pointer"
              >
                <Headphones className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Support</span>
              </button>

              <div className="w-8 h-8 rounded-full bg-amber-800 text-amber-100 flex items-center justify-center font-bold text-xs shadow-xs" title="Modo Onboarding">
                <ShieldCheck className="w-4 h-4 text-amber-200" />
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ── BREADCRUMB & BADGE EN MODO SPLIT (Imagen 3) ── */}
      {viewMode === 'split' && step === 1 && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1 hidden lg:flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span>Plataforma SaaS</span>
            <span>&gt;</span>
            <span>Autenticación Segura</span>
            <span>&gt;</span>
            <span className="text-emerald-700 font-bold">Onboarding Activo</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>CIFRADO DE EXTREMO A EXTREMO (AES-256)</span>
          </div>
        </div>
      )}

      {/* ── BARRA DE PROGRESO DEL STEPPER (Imagen 1 y 2) ── */}
      {(viewMode === 'centered' || step === 2) && (
        <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 pt-6 pb-2">
          <div className="flex items-center justify-between text-xs font-bold tracking-wide mb-2">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                {step === 1 ? 'PASO 1 DE 2: INFORMACIÓN DE CUENTA' : 'PASO 2 DE 2'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{step === 1 ? 'SSL 256-bit' : 'Verificación de Seguridad'}</span>
            </div>
          </div>

          {/* Barra de progreso visual */}
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>
      )}

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6">

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* CASO A: PASO 1 EN MODO SPLIT CORPORATIVO (Imagen 3)          */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {step === 1 && viewMode === 'split' ? (
          <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-auto">

            {/* COLUMNA IZQUIERDA: Tarjeta corporativa de métricas y protocolos */}
            <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950/5 via-slate-50 to-emerald-900/5 rounded-3xl p-6 sm:p-8 border border-emerald-900/10 shadow-xs flex flex-col justify-between">
              <div>
                {/* Icono corporativo */}
                <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-lg shadow-emerald-800/20 mb-6">
                  <Shield className="w-6 h-6 text-emerald-300" />
                </div>

                <span className="text-[11px] font-extrabold tracking-widest text-emerald-700 uppercase">
                  ACCESO CORPORATIVO
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 mb-3 leading-snug">
                  Control Operativo y Verificación Instantánea
                </h1>
                <p className="text-xs text-slate-600 leading-relaxed mb-8">
                  Integra tu flota, orquestación de rutas y personal en la nube empresarial más confiable de la región.
                </p>

                {/* Métricas SLA & Latencia */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 block">Disponibilidad SLA</span>
                    <span className="text-xl font-black text-slate-900 tracking-tight">99.98%</span>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-emerald-600 h-full w-[99%]" />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 block">Latencia OTP</span>
                    <span className="text-xl font-black text-slate-900 tracking-tight">&lt; 1.4s</span>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-orange-500 h-full w-[85%]" />
                    </div>
                  </div>
                </div>

                {/* Protocolos de incorporación */}
                <div>
                  <h3 className="text-xs font-black tracking-wider uppercase text-slate-700 mb-3">
                    PROTOCOLO DE INCORPORACIÓN
                  </h3>
                  <div className="space-y-3.5">
                    
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Key className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-slate-800">Validación Criptográfica Dual</span>
                        <span className="text-slate-500 text-[11px] leading-tight">
                          Códigos temporales hash con caducidad garantizada a los 10 minutos.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-slate-800">Compatibilidad Dominio Corporativo</span>
                        <span className="text-slate-500 text-[11px] leading-tight">
                          Detección y federación automática con proveedores SSO y SAML 2.0.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-slate-800">Auditoría SOC2 Tipo II</span>
                        <span className="text-slate-500 text-[11px] leading-tight">
                          Cumplimiento irrestricto de privacidad, ISO 27001 y RGPD.
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: Formulario de Registro (Imagen 3) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl shadow-slate-200/50">
              
              {/* Stepper superior */}
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">PASO 1</span>
                    <span className="text-xs font-bold text-slate-800">Datos de Cuenta</span>
                  </div>
                </div>

                <div className="flex-1 h-0.5 bg-slate-200 rounded-full" />

                <div className="flex items-center gap-2.5 opacity-60">
                  <div className="w-7 h-7 rounded-full border border-slate-300 text-slate-500 flex items-center justify-center font-bold text-xs bg-slate-50">
                    2
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">PASO 2</span>
                    <span className="text-xs font-semibold text-slate-500">Verificación de Código</span>
                  </div>
                </div>
              </div>

              {/* Títulos del Formulario */}
              <div className="mb-6">
                <span className="text-[11px] font-extrabold tracking-wider text-emerald-700 uppercase">
                  COMIENZA GRATIS
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  Crea tu cuenta
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ingresa tus datos para comenzar a gestionar tu infraestructura operativa.
                </p>
              </div>

              {/* Mensaje de Error */}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="flex-1">{error}</span>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmitStep1} className="space-y-4">
                
                {/* Campo: Nombre completo / Razón social */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nombre completo / razón social <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                      placeholder="Alejandro Silva Logistics S.A."
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-3 focus:ring-orange-500/15 transition-all"
                    />
                  </div>
                </div>

                {/* Campo: Correo corporativo con botón de simular error de validación */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Correo electrónico empresarial <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setSimulatedError(!simulatedError)}
                      className={`text-[11px] font-semibold cursor-pointer transition-colors ${
                        simulatedError ? 'text-red-600 font-bold underline' : 'text-orange-600 hover:text-orange-700'
                      }`}
                    >
                      {simulatedError ? 'Error simulado activo (clic para quitar)' : 'Simular error de validación'}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alejandro.silva@empresa.com"
                      className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                        simulatedError
                          ? 'border-red-400 focus:border-red-500 focus:ring-3 focus:ring-red-500/15'
                          : 'border-slate-200 focus:border-orange-500 focus:ring-3 focus:ring-orange-500/15'
                      }`}
                    />
                  </div>
                </div>

                {/* Contraseña y Confirmar Contraseña en 2 columnas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Contraseña <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={PASSWORD_MIN}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-3 focus:ring-orange-500/15 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Confirmar contraseña <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <RotateCw className="w-4 h-4" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className={`w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                          confirmPassword && !passwordsMatch
                            ? 'border-red-400 focus:border-red-500 focus:ring-3 focus:ring-red-500/15'
                            : 'border-slate-200 focus:border-orange-500 focus:ring-3 focus:ring-orange-500/15'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Indicador de Fuerza de Contraseña (Imagen 3) */}
                <div className="pt-1 pb-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className={`h-1.5 flex-1 rounded-full ${passwordChecks.length ? 'bg-emerald-600' : password ? 'bg-amber-400' : 'bg-slate-200'}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${checksPassedCount >= 3 ? 'bg-emerald-600' : passwordChecks.length ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${isPasswordStrong ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Criterios de seguridad (mín. {PASSWORD_MIN} caracteres)</span>
                    <span className={`font-bold ${passwordChecks.length ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {isPasswordStrong
                        ? 'Seguridad de clave: Fuerte (Criterios cumplidos)'
                        : passwordChecks.length
                        ? 'Seguridad de clave: Válida (Mínimo 4 caracteres)'
                        : 'Seguridad de clave: Incompleta (Mín. 4 caracteres)'}
                    </span>
                  </div>
                </div>

                {/* Términos y Condiciones */}
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="terms-split"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <label htmlFor="terms-split" className="text-xs text-slate-600 leading-snug cursor-pointer">
                    Acepto los{' '}
                    <button
                      type="button"
                      onClick={() => setModalContent('terms')}
                      className="font-bold text-orange-600 hover:underline cursor-pointer"
                    >
                      Términos de Servicio
                    </button>{' '}
                    y la{' '}
                    <button
                      type="button"
                      onClick={() => setModalContent('privacy')}
                      className="font-bold text-orange-600 hover:underline cursor-pointer"
                    >
                      Política de Privacidad
                    </button>{' '}
                    de FleetFlow.
                  </label>
                </div>

                {/* Botón Principal de Envío */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs tracking-wide text-white bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-md shadow-orange-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Procesando solicitud...</span>
                    </>
                  ) : (
                    <>
                      <span>Registrarse y Enviar Código</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Enlace para volver al login */}
                <div className="text-center pt-2">
                  <span className="text-xs text-slate-500">¿Ya tienes una cuenta? </span>
                  <Link to="/login" className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline">
                    Inicia sesión aquí
                  </Link>
                </div>

              </form>
            </div>
          </div>
        ) : null}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* CASO B: PASO 1 EN MODO TARJETA CENTRADA (Imagen 1)          */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {step === 1 && viewMode === 'centered' ? (
          <div className="max-w-md w-full">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
              
              {/* Icono central de camión naranja */}
              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center mx-auto shadow-md shadow-orange-500/25 mb-4">
                <Truck className="w-6 h-6" />
              </div>

              {/* Título y subtítulo */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Crea tu cuenta
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ingresa tus datos para comenzar tu prueba enterprise
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmitStep1} className="space-y-4">
                
                {/* Nombre */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nombre completo o razón social
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                      placeholder="Alejandro Silva o Logística Polar C.A."
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-3 focus:ring-orange-500/15 transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Correo electrónico corporativo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alejandro.silva@empresa.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-3 focus:ring-orange-500/15 transition-all"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={PASSWORD_MIN}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 4 caracteres"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-3 focus:ring-orange-500/15 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Barra de Fuerza (Imagen 1) */}
                  <div className="pt-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={`h-1 flex-1 rounded-full ${passwordChecks.length ? 'bg-emerald-500' : password ? 'bg-amber-400' : 'bg-slate-200'}`} />
                      <div className={`h-1 flex-1 rounded-full ${checksPassedCount >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      <div className={`h-1 flex-1 rounded-full ${checksPassedCount >= 4 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      <div className={`h-1 flex-1 rounded-full ${isPasswordStrong ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Fuerza de la contraseña (mín. {PASSWORD_MIN} caracteres)</span>
                      <span className={passwordChecks.length ? 'text-emerald-600 font-bold' : ''}>
                        {isPasswordStrong ? 'Seguridad Alta' : passwordChecks.length ? 'Seguridad Media' : 'Mínimo 4 caracteres'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confirmar Contraseña */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <RotateCw className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu contraseña"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-3 focus:ring-orange-500/15 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Checkbox Términos */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms-centered"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="terms-centered" className="text-xs text-slate-600 leading-snug cursor-pointer">
                    Acepto los{' '}
                    <button
                      type="button"
                      onClick={() => setModalContent('terms')}
                      className="text-slate-800 underline font-medium hover:text-orange-600 cursor-pointer"
                    >
                      Términos de Servicio
                    </button>{' '}
                    y la{' '}
                    <button
                      type="button"
                      onClick={() => setModalContent('privacy')}
                      className="text-slate-800 underline font-medium hover:text-orange-600 cursor-pointer"
                    >
                      Política de Privacidad
                    </button>{' '}
                    de FleetFlow.
                  </label>
                </div>

                {/* Botón Verde (Imagen 1) */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs tracking-wide text-white bg-emerald-800 hover:bg-emerald-900 shadow-md shadow-emerald-900/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <span>Registrarse y Enviar Código</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Link Iniciar Sesión */}
                <div className="text-center pt-2">
                  <span className="text-xs text-slate-500">¿Ya tienes una cuenta? </span>
                  <Link to="/login" className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline">
                    Inicia sesión aquí
                  </Link>
                </div>

              </form>
            </div>

            {/* Badges inferiores (Imagen 1) */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sin tarjeta requerida</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Acceso instantáneo</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-blue-500" />
                <span>Soporte dedicado</span>
              </span>
            </div>

          </div>
        ) : null}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* CASO C: PASO 2 - VERIFICACIÓN DE CÓDIGO OTP (Imagen 2)       */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="max-w-md w-full">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 text-center">
              
              {/* Icono circular verde menta con sobre y check (Imagen 2) */}
              <div className="relative w-16 h-16 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center border-2 border-white shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>

              {/* Título y descripción */}
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Verifica tu correo electrónico
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Hemos enviado un código de 6 dígitos a
              </p>
              <div className="font-bold text-xs text-slate-800 mt-0.5 mb-2">
                {email}
              </div>

              {/* Badge entregado hace 1 min */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Entregado • Hace 1 min</span>
              </div>

              {/* Tarjeta de ayuda para desarrollo si hay código OTP emitido */}
              {devCode && (
                <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold block flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Código de prueba (Modo Dev):
                    </span>
                    <span className="font-mono text-base font-black tracking-widest text-amber-700">
                      {devCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = devCode.split('');
                      setOtp(digits);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs cursor-pointer transition-colors"
                  >
                    Auto-llenar
                  </button>
                </div>
              )}

              {/* Mensajes de error o éxito */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 text-left">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Formulario de 6 dígitos OTP */}
              <form onSubmit={handleSubmitStep2} className="space-y-6">
                
                {/* 6 Casillas de entrada */}
                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpInputsRef.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-3 focus:ring-orange-500/20 shadow-xs transition-all"
                    />
                  ))}
                </div>

                {/* Enlace Reenviar código */}
                <div>
                  <button
                    type="button"
                    disabled={!canResend || isLoading}
                    onClick={handleResendCode}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                      canResend && !isLoading
                        ? 'text-orange-600 hover:text-orange-700'
                        : 'text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>
                      {canResend ? 'Reenviar código' : `Reenviar código (${cooldown}s)`}
                    </span>
                  </button>
                </div>

                {/* Botón Naranja Activar Cuenta (Imagen 2) */}
                <button
                  type="submit"
                  disabled={isLoading || registrationComplete}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wide text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Verificando y activando...</span>
                    </>
                  ) : registrationComplete ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>¡Cuenta Activada! Redirigiendo...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Verificar y Activar Cuenta</span>
                    </>
                  )}
                </button>

                {/* Enlace para volver a cambiar correo */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Cambiar dirección de correo</span>
                  </button>
                </div>

                {/* Caja de Información "¿No encuentras el correo?" (Imagen 2) */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-left flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <strong className="block text-slate-800 font-bold mb-0.5">
                      ¿No encuentras el correo?
                    </strong>
                    Revisa tu carpeta de spam, promociones o correo no deseado. Si tu organización tiene filtros de firewall estrictos, añade a{' '}
                    <span className="font-mono text-[11px] text-orange-600 font-semibold">auth@fleetflow.io</span>{' '}
                    como remitente seguro.
                  </div>
                </div>

              </form>
            </div>
          </div>
        )}

      </main>

      {/* ── BARRA INFERIOR DE CERTIFICADO DE SEGURIDAD (Imagen 3) ── */}
      <div className="w-full bg-white/60 border-t border-slate-200/60 py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Certificado TLS 1.3 de grado bancario</span>
          </div>

          <div className="font-mono text-[11px] text-slate-400">
            Identificador de Sesión: <span className="font-semibold text-slate-600">FF-AUTH-9948X-2025</span>
          </div>
        </div>
      </div>

      {/* ── FOOTER CORPORATIVO (Referencia Imágenes 1, 2 y 3) ── */}
      <footer className="w-full bg-white border-t border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            © 2025 FleetFlow Cloud Technologies Inc. All rights reserved.
          </div>

          <div className="flex items-center gap-5 font-medium">
            <button
              type="button"
              onClick={() => setModalContent('privacy')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setModalContent('terms')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Terms of Service
            </button>
            <a
              href="#soc2"
              onClick={(e) => { e.preventDefault(); alert('FleetFlow cuenta con certificación SOC2 Tipo II e ISO 27001 auditada anualmente.'); }}
              className="hover:text-slate-900"
            >
              Security Compliance (SOC2)
            </a>
          </div>
        </div>
      </footer>

      {/* ── MODAL DE TÉRMINOS Y POLÍTICA DE PRIVACIDAD ── */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-slate-900 text-base">
                  {modalContent === 'terms' ? 'Términos de Servicio' : 'Política de Privacidad'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalContent(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-xs text-slate-600 space-y-3 leading-relaxed">
              {modalContent === 'terms' ? (
                <>
                  <p className="font-bold text-slate-800">1. Aceptación del Servicio Corporativo</p>
                  <p>Al registrarse en FleetFlow Enterprise, la entidad o usuario acepta cumplir con los lineamientos de uso ético, seguridad operacional y confidencialidad para la orquestación logística de flotas pesadas y básculas.</p>
                  <p className="font-bold text-slate-800">2. Seguridad de Credenciales y Cuentas</p>
                  <p>El usuario es responsable de custodiar sus credenciales de acceso. FleetFlow implementa autenticación criptográfica dual y rotación de tokens protegidos para resguardar la integridad operativa.</p>
                  <p className="font-bold text-slate-800">3. Disponibilidad y SLA</p>
                  <p>La plataforma ofrece un SLA garantizado del 99.98% de disponibilidad para los módulos de despacho, telemetría y control de viajes.</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-slate-800">1. Protección de Datos y Privacidad</p>
                  <p>FleetFlow Cloud Technologies Inc. cumple estrictamente con normativas SOC2 Tipo II, ISO 27001 y RGPD. Ninguna información sensible de su empresa o conductores es compartida con terceros no autorizados.</p>
                  <p className="font-bold text-slate-800">2. Tratamiento de Códigos y Contraseñas</p>
                  <p>Las contraseñas se almacenan mediante algoritmos de hash criptográfico de un solo sentido (bcrypt) y los códigos OTP temporales expiran automáticamente en 10 minutos.</p>
                  <p className="font-bold text-slate-800">3. Auditoría y Trazabilidad</p>
                  <p>Cada inicio de sesión y operación queda registrada con sellos de tiempo precisos e identificación de dirección IP para auditorías de seguridad.</p>
                </>
              )}
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setModalContent(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Entendido y de acuerdo
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
