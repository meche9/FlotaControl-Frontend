import { useState } from 'react';
import {
  Truck,
  Users,
  Gauge,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  Download,
  MoreVertical,
  Calendar,
  TrendingUp,
  Trophy,
  ChevronRight,
  CheckCircle2,
  ArrowUpRight,
  Wrench,
} from 'lucide-react';

interface FleetUnit {
  id: string;
  code: string;
  badgeNumber: string;
  badgeBg: string;
  badgeText: string;
  model: string;
  plate: string;
  driverName?: string;
  driverAvatar?: string;
  driverInitials?: string;
  status: 'En Tránsito' | 'En Base' | 'Taller Central' | 'Detenido';
  odometer: string;
  tankLevel: number;
  tankColor: string;
  nextService: string;
  nextServiceAlert?: boolean;
  nextServiceOverdue?: boolean;
}

const FLEET_UNITS: FleetUnit[] = [
  {
    id: '1',
    code: '#TR-104',
    badgeNumber: '104',
    badgeBg: 'bg-amber-100/70',
    badgeText: 'text-amber-800',
    model: 'Volvo FH 540',
    plate: '872-AJ-4',
    driverName: 'Carlos Mendoza',
    driverAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'En Tránsito',
    odometer: '184,320',
    tankLevel: 78,
    tankColor: 'bg-teal-700',
    nextService: 'en 250 km',
    nextServiceAlert: true,
  },
  {
    id: '2',
    code: '#TR-088',
    badgeNumber: '088',
    badgeBg: 'bg-sky-100/80',
    badgeText: 'text-sky-800',
    model: 'Kenworth T680',
    plate: '491-ED-1',
    driverName: 'Raúl Morales',
    driverAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'En Tránsito',
    odometer: '298,140',
    tankLevel: 62,
    tankColor: 'bg-teal-700',
    nextService: 'en 4,100 km',
  },
  {
    id: '3',
    code: '#TR-201',
    badgeNumber: '201',
    badgeBg: 'bg-indigo-100/70',
    badgeText: 'text-indigo-800',
    model: 'Freightliner Cascadia',
    plate: '120-XB-9',
    driverName: 'David Miranda',
    driverInitials: 'DM',
    status: 'En Base',
    odometer: '92,450',
    tankLevel: 95,
    tankColor: 'bg-teal-700',
    nextService: 'en 8,300 km',
  },
  {
    id: '4',
    code: '#TR-055',
    badgeNumber: '055',
    badgeBg: 'bg-orange-100/80',
    badgeText: 'text-orange-800',
    model: 'Scania R500',
    plate: '330-RT-5',
    driverName: undefined,
    status: 'Taller Central',
    odometer: '312,890',
    tankLevel: 24,
    tankColor: 'bg-orange-500',
    nextService: 'Vencido',
    nextServiceOverdue: true,
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'ruta' | 'disponibles' | 'taller' | 'detenidas'>('ruta');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* 1. Header / Top Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs"></span>
            <span className="text-[11px] font-bold text-teal-800 tracking-wider uppercase">
              Telemetría y Control Activo
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Centro de Control Operativo
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Supervisión en tiempo real de unidades activas, operadores, telemetría y mantenimiento preventivo.
          </p>
        </div>

        {/* Right Controls & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Todas las Zonas */}
            <button className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 rounded-xl transition border border-slate-200/60 shadow-2xs">
              Todas las Zonas
            </button>
          </div>

          {/* Asignar Viaje Button */}
          <button className="bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-orange-500/20 transition">
            <Truck className="w-4 h-4 stroke-[2.5]" />
            <span>Asignar Viaje</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Unidades Activas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                Unidades Activas
              </span>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-3xl font-black text-slate-900 tracking-tight">42</span>
                <span className="text-sm font-semibold text-slate-400">/ 48</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center">
              <Truck className="w-6 h-6 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>87.5% Disponibilidad</span>
              </div>
            </div>
            <span className="text-slate-400 text-[11px] font-medium">6 en base</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: '87.5%' }}></div>
          </div>
        </div>

        {/* Card 2: Operadores en Turno */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                Operadores en Turno
              </span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-3xl font-black text-slate-900 tracking-tight">38</span>
                <span className="text-xs font-bold text-teal-600">En cabina</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-100/70 text-sky-600 flex items-center justify-center">
              <Users className="w-6 h-6 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-sky-700 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
              <span>94% Puntualidad</span>
            </div>
            <span className="text-slate-400 text-[11px] font-medium">4 en relevo</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-sky-500 h-full rounded-full" style={{ width: '94%' }}></div>
          </div>
        </div>

        {/* Card 3: Kilometraje Hoy */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                Kilometraje Hoy
              </span>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-3xl font-black text-slate-900 tracking-tight">14,820</span>
                <span className="text-xs font-semibold text-slate-400">km</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center">
              <Gauge className="w-6 h-6 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2 py-0.5 rounded-full text-[10px] font-bold">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              +12.4% vs prom.
            </span>
            <span className="text-slate-400 text-[11px] font-medium">Odómetro global</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: '72%' }}></div>
          </div>
        </div>

        {/* Card 4: Alertas Críticas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                Alertas Críticas
              </span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-3xl font-black text-orange-600 tracking-tight">03</span>
                <span className="text-xs font-semibold text-slate-400">en taller</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-100/70 text-orange-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200/60 px-2 py-0.5 rounded-full text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              Atención Inmediata
            </span>
            <button className="text-slate-700 hover:text-orange-600 text-[11px] font-bold flex items-center gap-0.5 transition">
              <span>Revisar</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-orange-500 h-full rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>
      </div>

      {/* 3. Main Body Grid: Left (Table) + Right (3 Stacked Widgets) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: Gestión de Unidades y Flota (Spans 2 cols on xl) */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs p-5 lg:p-6 space-y-5">
          {/* Header & Status Filter Pills */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base lg:text-lg font-bold text-slate-900">
                Gestión de Unidades y Flota
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoreo detallado de bitácora, odómetro y telemetría por vehículo
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex items-center p-1 bg-slate-50 border border-slate-100 rounded-full gap-1">
              <button
                onClick={() => setActiveTab('ruta')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition ${activeTab === 'ruta'
                  ? 'bg-sky-100/80 text-sky-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                En Ruta (35)
              </button>
              <button
                onClick={() => setActiveTab('disponibles')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition ${activeTab === 'disponibles'
                  ? 'bg-sky-100/80 text-sky-800 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Disponibles (7)
              </button>
              <button
                onClick={() => setActiveTab('taller')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition ${activeTab === 'taller'
                  ? 'bg-sky-100/80 text-sky-800 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                En Taller (4)
              </button>
              <button
                onClick={() => setActiveTab('detenidas')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition ${activeTab === 'detenidas'
                  ? 'bg-sky-100/80 text-sky-800 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Detenidas (2)
              </button>
            </div>
          </div>

          {/* Search bar & action buttons */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por placa, unidad o nombre de operador..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
            <button
              title="Filtros avanzados"
              className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition shadow-2xs"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              title="Descargar lista"
              className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition shadow-2xs"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto -mx-5 lg:-mx-6 px-5 lg:px-6">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  <th className="pb-3 pr-4">Unidad / Modelo</th>
                  <th className="pb-3 px-4">Operador Asignado</th>
                  <th className="pb-3 px-4">Estado</th>
                  <th className="pb-3 px-4">Odómetro</th>
                  <th className="pb-3 px-4">Nivel Tanque</th>
                  <th className="pb-3 px-4">Próx. Servicio</th>
                  <th className="pb-3 pl-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {FLEET_UNITS.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50/80 transition group">
                    {/* Unidad / Modelo */}
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl ${unit.badgeBg} ${unit.badgeText} font-bold text-xs flex items-center justify-center shrink-0 border border-black/5 shadow-2xs`}
                        >
                          {unit.badgeNumber}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">
                            {unit.code}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {unit.model} • {unit.plate}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Operador Asignado */}
                    <td className="py-4 px-4">
                      {unit.driverName ? (
                        <div className="flex items-center gap-2.5">
                          {unit.driverAvatar ? (
                            <img
                              src={unit.driverAvatar}
                              alt={unit.driverName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center border border-slate-300">
                              {unit.driverInitials}
                            </div>
                          )}
                          <span className="font-semibold text-slate-800 text-xs">
                            {unit.driverName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">
                          Sin asignar
                        </span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="py-4 px-4">
                      {unit.status === 'En Tránsito' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          En Tránsito
                        </span>
                      )}
                      {unit.status === 'En Base' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          En Base
                        </span>
                      )}
                      {unit.status === 'Taller Central' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                          Taller Central
                        </span>
                      )}
                    </td>

                    {/* Odómetro */}
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-900 block text-xs">
                        {unit.odometer}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">km</span>
                    </td>

                    {/* Nivel Tanque */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${unit.tankColor}`}
                            style={{ width: `${unit.tankLevel}%` }}
                          ></div>
                        </div>
                        <span className="text-[11px] font-bold text-slate-700">
                          {unit.tankLevel}%
                        </span>
                      </div>
                    </td>

                    {/* Próx. Servicio */}
                    <td className="py-4 px-4">
                      {unit.nextServiceAlert ? (
                        <div className="flex items-center gap-1 text-orange-600 font-bold text-xs">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{unit.nextService}</span>
                        </div>
                      ) : unit.nextServiceOverdue ? (
                        <span className="text-red-500 font-bold text-xs">
                          {unit.nextService}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">
                          {unit.nextService}
                        </span>
                      )}
                    </td>

                    {/* Acción */}
                    <td className="py-4 pl-4 text-right">
                      <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 text-[11px]">
              Mostrando 4 de 48 unidades registradas
            </span>
            <div className="flex items-center gap-1">
              <button className="px-2.5 py-1 text-slate-600 hover:text-slate-900 font-medium rounded-lg hover:bg-slate-100 transition">
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(1)}
                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition ${currentPage === 1
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                1
              </button>
              <button
                onClick={() => setCurrentPage(2)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition ${currentPage === 2
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                2
              </button>
              <button
                onClick={() => setCurrentPage(3)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition ${currentPage === 3
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                3
              </button>
              <button className="px-2.5 py-1 text-slate-600 hover:text-slate-900 font-medium rounded-lg hover:bg-slate-100 transition">
                Siguiente
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 3 Stacked Cards (Reordered) */}
        <div className="space-y-6">
          {/* Posición 1: Operadores Destacados */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Operadores Destacados
                </h3>
              </div>
              <span className="bg-slate-100 text-slate-600 font-semibold text-[10px] px-2 py-0.5 rounded-md">
                Turno A
              </span>
            </div>

            <div className="space-y-3">
              {/* Operator 1 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                      alt="Miguel Ángel Cruz"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center border border-white">
                      1
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      Miguel Ángel Cruz
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      0 frenados bruscos • 8.4h
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-teal-800 leading-none block">
                    99
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider">
                    SCORE
                  </span>
                </div>
              </div>

              {/* Operator 2 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
                      alt="Carlos Mendoza"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-teal-600 text-white font-bold text-[9px] flex items-center justify-center border border-white">
                      2
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      Carlos Mendoza
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Eco-Driving +14% • 7.2h
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-teal-800 leading-none block">
                    98
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider">
                    SCORE
                  </span>
                </div>
              </div>

              {/* Operator 3 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200/60">
                      AR
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center border border-white">
                      3
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      Arturo Robledo
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Puntualidad 100% • 6.8h
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-teal-800 leading-none block">
                    96
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider">
                    SCORE
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 transition">
                <span>Ver Ranking Completo de Conducción</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Posición 2: Mantenimiento Crítico */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Mantenimiento Crítico
                </h3>
              </div>
              <span className="bg-orange-50 text-orange-600 border border-orange-200/60 font-bold text-[10px] px-2 py-0.5 rounded-full">
                3 Prioritarios
              </span>
            </div>

            <div className="space-y-3">
              {/* Item 1 */}
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    #TR-104 <span className="font-normal text-slate-700">Cambio de Aceite & Filtros</span>
                  </span>
                  <span className="bg-orange-100/70 text-orange-700 font-bold text-[10px] px-1.5 py-0.5 rounded">
                    en 250 km
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Tracto Volvo FH 540</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    #TR-088 <span className="font-normal text-slate-700">Desgaste Balatas y Frenos</span>
                  </span>
                  <span className="bg-emerald-100/80 text-emerald-800 font-bold text-[10px] px-1.5 py-0.5 rounded">
                    Programado
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Inspección de 2do eje</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-700 h-full rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    #TR-201 <span className="font-normal text-slate-700">Calibración Sensores Inyección</span>
                  </span>
                  <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-1.5 py-0.5 rounded">
                    Alerta Amarilla
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Código ECU P0087</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-800 h-full rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>

            <button className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20 transition">
              <Calendar className="w-4 h-4" />
              <span>Programar Ingreso a Taller</span>
            </button>
          </div>

          {/* Posición 3: Kilometraje Semanal */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Kilometraje Semanal
                </h3>
                <p className="text-[11px] text-slate-400">
                  Rendimiento acumulado de flota
                </p>
              </div>
              <div className="flex items-center gap-1 font-bold text-xs text-slate-800">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span>88,410 km</span>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="pt-4 pb-2">
              <div className="flex items-end justify-between h-32 gap-2 px-1">
                {/* Lunes */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full bg-indigo-100/70 hover:bg-indigo-200 rounded-t-lg transition h-[52%]"></div>
                  <span className="text-[10px] font-bold text-slate-400">L</span>
                </div>
                {/* Martes */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full bg-indigo-100/70 hover:bg-indigo-200 rounded-t-lg transition h-[68%]"></div>
                  <span className="text-[10px] font-bold text-slate-400">M</span>
                </div>
                {/* Miércoles */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full bg-teal-700 hover:bg-teal-800 rounded-t-lg transition h-[76%]"></div>
                  <span className="text-[10px] font-bold text-slate-700">M</span>
                </div>
                {/* Jueves */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full bg-indigo-100/70 hover:bg-indigo-200 rounded-t-lg transition h-[84%]"></div>
                  <span className="text-[10px] font-bold text-slate-400">J</span>
                </div>
                {/* Viernes (Peak Max) */}
                <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end relative">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mb-0.5"></span>
                  <div className="w-full bg-orange-500 hover:bg-orange-600 rounded-t-lg transition h-[90%] shadow-xs"></div>
                  <span className="text-[10px] font-bold text-orange-600">V</span>
                </div>
                {/* Sábado */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full bg-indigo-100/70 hover:bg-indigo-200 rounded-t-lg transition h-[58%]"></div>
                  <span className="text-[10px] font-bold text-slate-400">S</span>
                </div>
                {/* Domingo */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full bg-indigo-100/70 hover:bg-indigo-200 rounded-t-lg transition h-[36%]"></div>
                  <span className="text-[10px] font-bold text-slate-400">D</span>
                </div>
              </div>
            </div>

            {/* Chart Legend */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-500"></span>
                <span className="font-medium text-slate-600">Máx: Viernes (16,400 km)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-700"></span>
                <span className="font-medium text-slate-600">Media Operativa</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}