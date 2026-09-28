import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Truck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Radio,
  Smartphone,
  Monitor,
  Receipt,
  Route,
  CreditCard,
  Wrench,
  ChevronRight,
  MapPin,
  UserPlus,
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, error, clearError, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberStation, setRememberStation] = useState(true);
  const [selectedModule, setSelectedModule] = useState('despacho');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login({ email, password });
      navigate('/dashboard', { replace: true });
    } catch {
      // Error ya se maneja en el contexto
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a1329] text-slate-100 font-sans antialiased selection:bg-orange-500 selection:text-white">

      {/* ── HEADER ── */}
      <header className="w-full bg-[#0a1329]/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-md shadow-orange-500/30">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  Fleet<span className="text-orange-400">Flow</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-widest uppercase bg-white/10 text-orange-300 border border-orange-400/30">
                  Mack Pro v4.8
                </span>
              </div>
              <span className="text-[11px] text-slate-400 tracking-wide font-medium hidden sm:inline-block">
                Gestión Logística Integral & Góndolas Mack de Servicio Pesado
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-300 tracking-wide">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>48 Góndolas en Rastreo</span>
              </span>
              <span className="flex items-center gap-1">
                <Radio className="w-4 h-4 text-orange-400" />
                <span>Estaciones de Báscula</span>
              </span>
              <span>Soporte Central</span>
            </nav>
          </div>
        </div>
      </header>

      {/* ── HERO PRINCIPAL ── */}
      <main className="relative flex-1 flex flex-col justify-between overflow-hidden">

        {/* Fondo con gradiente y textura */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/90 via-orange-700/85 to-[#0a1329]/95" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1329] via-[#0a1329]/40 to-transparent" />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none" />
        </div>

        {/* Contenido del Hero */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            {/* ── Columna Izquierda: Info ── */}
            <div className="lg:col-span-7 space-y-6 text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide text-orange-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sistema Central de Carga Pesada y Tolvas Mack</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white drop-shadow-md">
                  Control de Flota <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-orange-200">
                    100% Conectado
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-white/90 max-w-xl font-normal leading-relaxed drop-shadow-sm pt-1">
                  Despacho en tiempo real de góndolas Mack Granite, monitoreo de tonelaje en tolva, básculas inteligentes y proformas de liquidación de fletes.
                </p>
              </div>

              {/* Referencias de acceso */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 bg-black/25 backdrop-blur-sm p-3 rounded-xl border border-white/10 max-w-lg hover:border-orange-400/40 transition-colors">
                  <Monitor className="w-6 h-6 text-orange-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-200 block">Terminal Web Logística Central:</span>
                    <span className="text-xs font-mono text-white/90">https://central.fleetflow.internal/dispatch</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-black/25 backdrop-blur-sm p-3 rounded-xl border border-white/10 max-w-lg hover:border-emerald-500/40 transition-colors">
                  <Smartphone className="w-6 h-6 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 block">App Móvil para Operadores de Góndola:</span>
                    <span className="text-xs font-mono text-white/90">fleetflow://mobile.operator.app/login</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-black/25 backdrop-blur-sm p-3 rounded-xl border border-white/10 max-w-lg hover:border-sky-400/40 transition-colors">
                  <Receipt className="w-6 h-6 text-sky-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-200 block">Portal Financiero & Proformas de Flete:</span>
                    <span className="text-xs font-mono text-white/90">https://billing.fleetflow.internal/proformas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Columna Derecha: Formulario de Login ── */}
            <div className="lg:col-span-5" id="login-box">
              <div className="bg-white/[0.97] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 text-slate-900 shadow-2xl border border-white/40 relative overflow-hidden">

                {/* Barra tricolor superior */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-600 via-emerald-500 to-[#0a1329]" />

                <div className="flex items-center justify-between mb-5 pt-1">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                      Acceso Seguro SSL
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
                      Iniciar Turno / Sesión
                    </h2>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                    <Lock className="w-6 h-6 text-orange-400" />
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2 animate-shake">
                    <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="operator-id">
                      Carnet de Operador / ID Corporativo
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        id="operator-id"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); clearError(); }}
                        placeholder="Ej. operador@fleetflow.com"
                        className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                        required
                        autoComplete="email"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="password">
                        Contraseña
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                      >
                        ¿Olvidó su contraseña?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); clearError(); }}
                        placeholder="Ingrese su clave secreta"
                        className="block w-full pl-11 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                        required
                        autoComplete="current-password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-[19px] h-[19px]" /> : <Eye className="w-[19px] h-[19px]" />}
                      </button>
                    </div>
                  </div>

                  {/* Module Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="module-select">
                      Módulo de Servicio
                    </label>
                    <div className="relative">
                      <select
                        id="module-select"
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(e.target.value)}
                        className="block w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 appearance-none cursor-pointer"
                        disabled={isLoading}
                      >
                        <option value="despacho">Despacho y Báscula (Operación de Patio)</option>
                        <option value="telemetria">Telemetría Mack Granite (Rastreo de Tolvas)</option>
                        <option value="facturacion">Facturación & Proformas de Fletes</option>
                        <option value="mantenimiento">Mantenimiento & Taller de Base</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>

                  {/* Remember + 2FA badge */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberStation}
                        onChange={(e) => setRememberStation(e.target.checked)}
                        className="w-4 h-4 rounded text-orange-600 border-slate-300 focus:ring-orange-500 accent-orange-600"
                      />
                      <span className="text-xs font-medium text-slate-600">Recordar estación</span>
                    </label>
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>2FA Activo</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 px-5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-orange-600/35 hover:shadow-orange-600/50 transform active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Verificando credenciales...</span>
                      </>
                    ) : (
                      <>
                        <span>Iniciar Sesión en FleetFlow</span>
                        <ArrowRight className="w-[19px] h-[19px]" />
                      </>
                    )}
                  </button>

                  {/* Alt auth */}
                  <div className="pt-2 border-t border-slate-200 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pb-2">
                      <Smartphone className="w-4 h-4 text-slate-400" />
                      <span>Autenticar con Token Digital / OTP Móvil</span>
                    </div>
                  </div>

                  {/* Register prompt */}
                  <div className="bg-slate-100/80 rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">¿Nuevo en la flota?</span>
                      <span className="text-slate-500 text-[11px]">Solicita tu credencial de chofer</span>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:border-orange-500 rounded-lg font-bold text-orange-600 hover:text-orange-700 transition-colors shadow-xs flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Registrar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* ── TARJETAS DE SERVICIOS ── */}
        <section className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Tarjeta Operativa */}
            <div className="bg-gradient-to-b from-orange-600/90 to-orange-700/95 rounded-2xl p-5 text-white shadow-xl flex flex-col justify-between min-h-[170px] border border-white/20 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  <h3 className="font-extrabold text-base tracking-tight">Fase Operativa</h3>
                </div>
                <span className="text-[10px] font-mono uppercase bg-black/20 px-2 py-0.5 rounded text-white/90">Tolvas Mack</span>
              </div>
              <p className="text-xs text-white/90 leading-snug my-2">
                Control de 48 góndolas Mack Granite en ruta activa, sensor de ángulo de volteo y odómetro calibrado.
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-white/20">
                <span className="text-xs font-bold text-white underline underline-offset-4 flex items-center gap-1 cursor-pointer hover:text-amber-200 transition-colors">
                  Ver telemetría <ChevronRight className="w-4 h-4" />
                </span>
                <span className="text-[11px] font-bold text-white/90">24.2 Ton prom.</span>
              </div>
            </div>

            {/* Tarjeta Logística */}
            <div className="bg-gradient-to-b from-emerald-500/90 to-emerald-600/95 rounded-2xl p-5 text-white shadow-xl flex flex-col justify-between min-h-[170px] border border-white/20 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  <h3 className="font-extrabold text-base tracking-tight">Fase Logística</h3>
                </div>
                <span className="text-[10px] font-mono uppercase bg-black/20 px-2 py-0.5 rounded text-white/90">19 Rutas</span>
              </div>
              <p className="text-xs text-white/90 leading-snug my-2">
                Asignación de viajes Querétaro - Bajío, pesaje de báscula bruta/tara y despacho automatizado en patio.
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-white/20">
                <span className="text-xs font-bold text-white underline underline-offset-4 flex items-center gap-1 cursor-pointer hover:text-emerald-100 transition-colors">
                  Ver rutas activas <ChevronRight className="w-4 h-4" />
                </span>
                <span className="text-[11px] font-bold text-white/90">Tiempos al 98%</span>
              </div>
            </div>

            {/* Tarjeta Financiera */}
            <div className="bg-gradient-to-b from-sky-500/90 to-sky-600/95 rounded-2xl p-5 text-white shadow-xl flex flex-col justify-between min-h-[170px] border border-white/20 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  <h3 className="font-extrabold text-base tracking-tight">Fase Financiera</h3>
                </div>
                <span className="text-[10px] font-mono uppercase bg-black/20 px-2 py-0.5 rounded text-white/90">Fletes</span>
              </div>
              <p className="text-xs text-white/90 leading-snug my-2">
                Generación inmediata de proformas por tonelada métrica, diesel subvencionado y anticipos para operadores.
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-white/20">
                <span className="text-xs font-bold text-white underline underline-offset-4 flex items-center gap-1 cursor-pointer hover:text-sky-100 transition-colors">
                  Consultar tarifas <ChevronRight className="w-4 h-4" />
                </span>
                <span className="text-[11px] font-bold text-white/90">$482,500 MXN</span>
              </div>
            </div>

            {/* Tarjeta Taller */}
            <div className="bg-gradient-to-b from-amber-500/90 to-amber-600/95 rounded-2xl p-5 text-white shadow-xl flex flex-col justify-between min-h-[170px] border border-white/20 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  <h3 className="font-extrabold text-base tracking-tight">Taller y Asistencia</h3>
                </div>
                <span className="text-[10px] font-mono uppercase bg-black/20 px-2 py-0.5 rounded text-white/90">24 / 7</span>
              </div>
              <p className="text-xs text-white/90 leading-snug my-2">
                Auxilio vial carretero, control de desgaste en neumáticos pesados y cambio programado de filtros Mack.
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-white/20">
                <span className="text-xs font-bold text-white underline underline-offset-4 flex items-center gap-1 cursor-pointer hover:text-yellow-100 transition-colors">
                  Reportar avería <ChevronRight className="w-4 h-4" />
                </span>
                <span className="text-[11px] font-bold text-white/90">Base Querétaro</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="w-full bg-[#060d1d] border-t border-white/10 text-white/80 py-3.5 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 font-semibold">
            <div className="flex items-center gap-2 text-white">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              <span>{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Red Satelital Iridium: En Línea</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 font-mono text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 uppercase font-sans">Diesel Base:</span>
              <span className="text-amber-400 font-bold">$24.85 / L</span>
            </div>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 uppercase font-sans">Flete Ton/Km:</span>
              <span className="text-emerald-400 font-bold">$1.82 MXN</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
            <span className="hover:text-white transition-colors cursor-pointer">Términos de Flota</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer">Seguridad Mack</span>
            <span>•</span>
            <span className="text-slate-500">FleetFlow Enterprise v4.8.2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}