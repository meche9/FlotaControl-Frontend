import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import { getApiErrorMessage } from '../../services/api';
import {
  Truck,
  Mail,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al procesar la solicitud. Intente nuevamente.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a1329] text-slate-100 font-sans antialiased selection:bg-orange-500 selection:text-white">

      {/* ── HEADER ── */}
      <header className="w-full bg-[#0a1329]/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-3.5 hover:opacity-90 transition-opacity">
            <div className="relative flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-md shadow-orange-500/30">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-white">
                Fleet<span className="text-orange-400">Flow</span>
              </span>
              <span className="text-[11px] text-slate-400 tracking-wide font-medium hidden sm:inline-block">
                Recuperación de Acceso
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="relative flex-1 flex items-center justify-center overflow-hidden px-4 py-12">

        {/* Fondo */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/30 via-[#0a1329] to-[#0a1329]" />
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/[0.97] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 text-slate-900 shadow-2xl border border-white/40 relative overflow-hidden">

            {/* Barra tricolor */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-600 via-amber-500 to-[#0a1329]" />

            {!success ? (
              <>
                {/* Header del formulario */}
                <div className="flex items-center justify-between mb-6 pt-1">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                      Recuperar Acceso
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
                      Restablecer Contraseña
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Ingrese su email corporativo para recibir instrucciones de restablecimiento.
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                    <Mail className="w-6 h-6 text-orange-400" />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="forgot-email">
                      Email Corporativo
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null); }}
                        placeholder="operador@fleetflow.com"
                        className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                        required
                        maxLength={150}
                        autoComplete="email"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-orange-600/35 hover:shadow-orange-600/50 transform active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Procesando solicitud...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar Instrucciones</span>
                        <ArrowRight className="w-[19px] h-[19px]" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver al inicio de sesión</span>
                  </Link>
                </div>
              </>
            ) : (
              /* Estado de éxito */
              <div className="text-center pt-2 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Solicitud Enviada
                  </h2>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    Si el email <span className="font-bold text-slate-700">{email}</span> está registrado, 
                    recibirá instrucciones para restablecer su contraseña.
                  </p>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  El enlace es válido por tiempo limitado y solo puede usarse una vez.
                  Revise también su carpeta de correo no deseado.
                </p>

                <div className="pt-2 border-t border-slate-200">
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver al inicio de sesión</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="w-full bg-[#060d1d] border-t border-white/10 text-white/80 py-3.5 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center text-xs text-slate-400 font-medium gap-4">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Proceso seguro con cifrado SSL de extremo a extremo</span>
          <span>•</span>
          <span className="text-slate-500">FleetFlow Enterprise v4.8.2</span>
        </div>
      </footer>
    </div>
  );
}
