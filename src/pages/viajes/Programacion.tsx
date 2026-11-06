import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Save,
  Loader2,
  FileText,
  X,
  Calendar,
  Building2,
  Users,
  Trash2
} from 'lucide-react';
import {
  programacionService,
  type TripItem,
  type SchedulePreviewResponse,
  type ClienteDetectado
} from '../../services/programacionService';

interface InfoFechaNormalizada {
  isoKey: string;
  tituloCompleto: string;
  pildoraCorta: string;
  timestamp: number;
}

const DIAS_SEMANA_COMPLETOS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const MESES_COMPLETOS = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function normalizarFecha(fechaStr?: string): InfoFechaNormalizada {
  if (!fechaStr || !fechaStr.trim()) {
    return {
      isoKey: '9999-99-99',
      tituloCompleto: 'FECHA POR DEFINIR',
      pildoraCorta: 'Sin Fecha',
      timestamp: 9999999999999,
    };
  }

  const limpia = fechaStr.trim().replace(/\./g, '/').replace(/-/g, '/');
  let dia = 0;
  let mes = 0;
  let anio = 0;

  // 1. Formato DD/MM/YYYY
  const matchDMY = limpia.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (matchDMY) {
    dia = parseInt(matchDMY[1], 10);
    mes = parseInt(matchDMY[2], 10) - 1;
    let y = parseInt(matchDMY[3], 10);
    if (y < 100) y += 2000;
    anio = y;
  } else {
    // 2. Formato YYYY/MM/DD
    const matchYMD = limpia.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
    if (matchYMD) {
      anio = parseInt(matchYMD[1], 10);
      mes = parseInt(matchYMD[2], 10) - 1;
      dia = parseInt(matchYMD[3], 10);
    } else {
      // 3. Fallback buscar cualquier DD/MM/YYYY o DD/MM dentro del string
      const matchAny = limpia.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      if (matchAny) {
        dia = parseInt(matchAny[1], 10);
        mes = parseInt(matchAny[2], 10) - 1;
        let y = parseInt(matchAny[3], 10);
        if (y < 100) y += 2000;
        anio = y;
      } else {
        const parseado = new Date(limpia);
        if (!isNaN(parseado.getTime())) {
          anio = parseado.getFullYear();
          mes = parseado.getMonth();
          dia = parseado.getDate();
        }
      }
    }
  }

  if (anio >= 2000 && anio <= 2100 && mes >= 0 && mes <= 11 && dia >= 1 && dia <= 31) {
    const d = new Date(anio, mes, dia, 12, 0, 0);
    const isoKey = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const diaSemana = DIAS_SEMANA_COMPLETOS[d.getDay()];
    const mesNombre = MESES_COMPLETOS[mes];
    const tituloCompleto = `${diaSemana} ${dia} DE ${mesNombre} ${anio}`;
    const pildoraCorta = `${DIAS_CORTOS[d.getDay()]} ${dia} ${MESES_CORTOS[mes]}`;
    return {
      isoKey,
      tituloCompleto,
      pildoraCorta,
      timestamp: d.getTime(),
    };
  }

  return {
    isoKey: limpia,
    tituloCompleto: `PROGRAMACIÓN ${limpia.toUpperCase()}`,
    pildoraCorta: limpia,
    timestamp: 0,
  };
}

export function parsearHoraMinutos(horaStr?: string): number {
  if (!horaStr) return 0;
  const clean = horaStr.trim().toUpperCase();
  const match = clean.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3];
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export interface GrupoCronologicoDia {
  isoKey: string;
  titulo: string;
  pildora: string;
  timestamp: number;
  viajes: TripItem[];
  ventanaHoraria: string;
  kmTotalesEstimados: number;
}

export interface GrupoPlanta {
  key: string;
  codigo: string;
  nombre: string;
  titulo: string;
  viajes: TripItem[];
  ventanaHoraria: string;
  kmTotalesEstimados: number;
  destinosUnicos: number;
}

export default function Programacion() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modo de visualización: Por Día vs Por Planta (Sede Origen)
  const [modoVista, setModoVista] = useState<'dia' | 'planta'>('dia');

  // Estados principales
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [archivosCargados, setArchivosCargados] = useState<string[]>([]);
  const [cargandoPdf, setCargandoPdf] = useState<boolean>(false);
  const [mensajeCarga, setMensajeCarga] = useState<string>('Extrayendo PDF...');
  const [guardandoBd, setGuardandoBd] = useState<boolean>(false);
  const [guardandoTripId, setGuardandoTripId] = useState<string | null>(null);
  const [guardandoGrupoKey, setGuardandoGrupoKey] = useState<string | null>(null);
  const [clienteDetectado, setClienteDetectado] = useState<ClienteDetectado | null>(null);
  const [mensajeToast, setMensajeToast] = useState<{ tipo: 'ok' | 'err' | 'warn'; texto: string } | null>(null);

  // Filtros
  const [filtroFecha, setFiltroFecha] = useState<string>('todos');
  const [filtroPlanta, setFiltroPlanta] = useState<string>('todas');
  const [filtroSoloColisiones, setFiltroSoloColisiones] = useState<boolean>(false);
  const [busqueda, setBusqueda] = useState<string>('');

  // Secciones colapsadas (por clave de grupo)
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({});

  // Asegurar unicidad absoluta de IDs en la lista de viajes para evitar que dos filas compartan id
  useEffect(() => {
    setTrips((prev) => {
      const idsVistos = new Set<string>();
      let hayDuplicados = false;
      const corregidos = prev.map((t) => {
        if (!t.id || idsVistos.has(t.id)) {
          hayDuplicados = true;
          const nuevoId =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? `trip-${crypto.randomUUID()}`
              : `trip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          idsVistos.add(nuevoId);
          return { ...t, id: nuevoId };
        }
        idsVistos.add(t.id);
        return t;
      });
      return hayDuplicados ? corregidos : prev;
    });
  }, []);

  // Manejar subida de archivo(s) PDF emitidos por el cliente (acumulativo)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).filter((f) =>
      f.name.toLowerCase().endsWith('.pdf')
    );

    if (files.length === 0) {
      mostrarToast('warn', 'Por favor seleccione uno o más archivos PDF emitidos por el cliente.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setCargandoPdf(true);
    let totalViajesNuevos = 0;
    let totalColisiones = 0;
    let rechazadosPorDistintoCliente = 0;
    const nuevosArchivosExitosos: string[] = [];

    try {
      let viajesBase = [...trips];
      let clienteActual: ClienteDetectado | null = clienteActivo;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setMensajeCarga(
          files.length > 1
            ? `Extrayendo (${i + 1}/${files.length}): ${file.name}...`
            : `Extrayendo ${file.name}...`
        );

        try {
          const resp: SchedulePreviewResponse = await programacionService.subirPdfPrograma(file);

          // Determinar cliente del manifiesto mediante la respuesta del extractor o de las unidades de origen
          let clienteNuevo: ClienteDetectado | null = resp.clienteDetectado || null;
          if (!clienteNuevo) {
            for (const t of resp.trips) {
              if (t.origenSalida.idCliente || t.origenSalida.clienteNombre) {
                clienteNuevo = {
                  idCliente: t.origenSalida.idCliente || '',
                  razonSocial: t.origenSalida.clienteNombre || 'Cliente Detectado',
                  nombreComercial: t.origenSalida.clienteNombre,
                  rif: t.origenSalida.clienteRif,
                };
                break;
              }
            }
          }

          // REGLA: Si los manifiestos no pertenecen al mismo cliente, no permitir procesar
          if (
            clienteActual &&
            clienteNuevo &&
            clienteActual.idCliente &&
            clienteNuevo.idCliente &&
            clienteActual.idCliente !== clienteNuevo.idCliente
          ) {
            rechazadosPorDistintoCliente++;
            mostrarToast(
              'err',
              `Bloqueo de Ingesta: "${file.name}" pertenece a "${clienteNuevo.nombreComercial || clienteNuevo.razonSocial}", el cual es DIFERENTE al cliente del lote actual ("${clienteActual.nombreComercial || clienteActual.razonSocial}"). Todos los manifiestos deben pertenecer al mismo cliente.`
            );
            continue; // Se rechaza este archivo y no se procesan sus viajes
          }

          // Si es el primer manifiesto con cliente detectado, fijarlo como el cliente del lote
          if (!clienteActual && clienteNuevo) {
            clienteActual = clienteNuevo;
            setClienteDetectado(clienteNuevo);
          }

          nuevosArchivosExitosos.push(file.name);

          // Combinar viajes evitando duplicados por nroTransporte real
          const tripKey = (t: TripItem) => {
            const nro = t.nroTransporte?.trim().toUpperCase();
            if (nro && nro !== 'S/N' && nro !== 'PENDIENTE' && !nro.startsWith('TR-AUTO-')) {
              return nro;
            }
            return null;
          };

          for (const tripNuevo of resp.trips) {
            const key = tripKey(tripNuevo);
            const idx = key ? viajesBase.findIndex((t) => tripKey(t) === key) : -1;

            if (idx >= 0) {
              // Ya existía en la tabla acumulada: actualizar información preservando su ID único existente
              viajesBase[idx] = {
                ...tripNuevo,
                id: viajesBase[idx].id,
                puntoRegreso: viajesBase[idx].puntoRegreso || tripNuevo.puntoRegreso,
                observacion: tripNuevo.observacion || viajesBase[idx].observacion,
                seleccionado: !tripNuevo.colision,
              };
            } else {
              // Asignar ID único e irrepetible para evitar colisiones entre manifiestos
              const idUnico =
                tripNuevo.id && !viajesBase.some((t) => t.id === tripNuevo.id)
                  ? tripNuevo.id
                  : (typeof crypto !== 'undefined' && crypto.randomUUID
                    ? `trip-${crypto.randomUUID()}`
                    : `trip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

              viajesBase.push({
                ...tripNuevo,
                id: idUnico,
                seleccionado: !tripNuevo.colision,
              });
              totalViajesNuevos++;
            }

            if (tripNuevo.colision || tripNuevo.yaExiste) {
              totalColisiones++;
            }
          }
        } catch (err: any) {
          console.error(`Error procesando archivo ${file.name}:`, err);
          const msg = err.response?.data?.message || err.message || 'Error al procesar archivo';
          mostrarToast('err', `Error en "${file.name}": ${msg}`);
        }
      }

      setTrips(viajesBase);
      setArchivosCargados((prev) => [...prev, ...nuevosArchivosExitosos]);

      // Resetear filtros para que el usuario visualice la totalidad de viajes acumulados
      setFiltroFecha('todos');
      setFiltroPlanta('todas');

      if (nuevosArchivosExitosos.length > 0) {
        const nombreClienteStr = clienteActual ? ` [${clienteActual.nombreComercial || clienteActual.razonSocial}]` : '';
        if (totalColisiones > 0) {
          mostrarToast(
            'warn',
            `Se procesó(eron) ${nuevosArchivosExitosos.length} manifiesto(s)${nombreClienteStr}. Total acumulado: ${viajesBase.length} viajes (${totalColisiones} con colisión en BD).`
          );
        } else {
          mostrarToast(
            'ok',
            `Manifiesto(s) agregado(s) con éxito (+${totalViajesNuevos} viajes)${nombreClienteStr}. Total acumulado: ${viajesBase.length} viajes.`
          );
        }
      } else if (rechazadosPorDistintoCliente > 0) {
        mostrarToast('err', `No se procesó ningún viaje debido a discrepancias en el cliente.`);
      }
    } catch (error: any) {
      console.error('Error general al subir PDF:', error);
      mostrarToast('err', `Error al levantar programa: ${error.message || 'Error de conexión'}`);
    } finally {
      setCargandoPdf(false);
      setMensajeCarga('Extrayendo PDF...');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Limpiar pantalla / Iniciar nuevo proceso de carga
  const handleLimpiarPantalla = () => {
    if (trips.length > 0) {
      const confirmar = window.confirm(
        '¿Desea limpiar la pantalla e iniciar un nuevo proceso de carga? Se descartarán los viajes en pantalla que no hayan sido guardados.'
      );
      if (!confirmar) return;
    }

    setTrips([]);
    setArchivosCargados([]);
    setClienteDetectado(null);
    setFiltroFecha('todos');
    setFiltroPlanta('todas');
    setFiltroSoloColisiones(false);
    setBusqueda('');
    setSeccionesAbiertas({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    mostrarToast('ok', 'Pantalla lista para iniciar nuevo proceso de carga de manifiestos.');
  };

  // Cliente activo determinado a partir de las unidades de origen del lote cargado
  const clienteActivo = useMemo((): ClienteDetectado | null => {
    if (clienteDetectado) return clienteDetectado;
    for (const t of trips) {
      if (t.origenSalida.idCliente || t.origenSalida.clienteNombre) {
        return {
          idCliente: t.origenSalida.idCliente || '',
          razonSocial: t.origenSalida.clienteNombre || 'Cliente Detectado',
          nombreComercial: t.origenSalida.clienteNombre,
          rif: t.origenSalida.clienteRif,
        };
      }
    }
    return null;
  }, [clienteDetectado, trips]);

  const mostrarToast = (tipo: 'ok' | 'err' | 'warn', texto: string) => {
    setMensajeToast({ tipo, texto });
    setTimeout(() => setMensajeToast(null), 6000);
  };

  // Lista única de días disponibles para los filtros de píldora
  const diasDisponibles = useMemo(() => {
    const mapaDias = new Map<string, { isoKey: string; pildora: string; timestamp: number; total: number }>();
    for (const trip of trips) {
      const norm = normalizarFecha(trip.fechaProgramadaCarga);
      const existente = mapaDias.get(norm.isoKey);
      if (existente) {
        existente.total += 1;
      } else {
        mapaDias.set(norm.isoKey, {
          isoKey: norm.isoKey,
          pildora: norm.pildoraCorta,
          timestamp: norm.timestamp,
          total: 1,
        });
      }
    }
    return Array.from(mapaDias.values()).sort(
      (a, b) => a.timestamp - b.timestamp || a.isoKey.localeCompare(b.isoKey)
    );
  }, [trips]);

  // Lista única de plantas (origen) disponibles para los filtros de píldora
  const plantasDisponibles = useMemo(() => {
    const mapaPlantas = new Map<string, { key: string; codigo: string; nombre: string; total: number }>();
    for (const trip of trips) {
      const cod = (trip.origenSalida.codigo || '').trim();
      const nom = (trip.origenSalida.nombre || 'Planta Origen').trim();
      const key = (cod || nom).toUpperCase();
      const existente = mapaPlantas.get(key);
      if (existente) {
        existente.total += 1;
      } else {
        mapaPlantas.set(key, {
          key,
          codigo: cod,
          nombre: nom,
          total: 1,
        });
      }
    }
    return Array.from(mapaPlantas.values()).sort((a, b) => b.total - a.total);
  }, [trips]);

  // Métricas calculadas
  const metricas = useMemo(() => {
    const total = trips.length;
    const colisiones = trips.filter((t) => (t.yaExiste || t.colision) && !t.registradoEnSesion).length;
    const seleccionadosValidos = trips.filter((t) => !t.colision && !t.yaExiste && !t.registradoEnSesion).length;
    return { total, colisiones, seleccionadosValidos };
  }, [trips]);

  // Lista filtrada común
  const tripsFiltrados = useMemo(() => {
    return trips.filter((t) => {
      // Filtro de colisión
      if (filtroSoloColisiones && (!t.colision || t.registradoEnSesion)) return false;

      // Filtro según la vista activa
      if (modoVista === 'dia') {
        if (filtroFecha !== 'todos') {
          const norm = normalizarFecha(t.fechaProgramadaCarga);
          if (norm.isoKey !== filtroFecha) return false;
        }
      } else {
        if (filtroPlanta !== 'todas') {
          const key = (t.origenSalida.codigo || t.origenSalida.nombre || '').trim().toUpperCase();
          if (key !== filtroPlanta) return false;
        }
      }

      // Filtro de texto
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const coincideNro = t.nroTransporte.toLowerCase().includes(q);
        const coincideOrigen = t.origenSalida.nombre.toLowerCase().includes(q) || t.origenSalida.codigo.toLowerCase().includes(q);
        const coincideDestino = t.destinoLlegada.nombre.toLowerCase().includes(q) || t.destinoLlegada.codigo.toLowerCase().includes(q);
        const coincideRetorno = t.nroRetorno?.toLowerCase().includes(q) || t.puntoRegreso?.toLowerCase().includes(q);
        const coincideObs = t.observacion?.toLowerCase().includes(q);
        return coincideNro || coincideOrigen || coincideDestino || coincideRetorno || coincideObs;
      }
      return true;
    });
  }, [trips, filtroSoloColisiones, modoVista, filtroFecha, filtroPlanta, busqueda]);

  // Agrupación 1: Corte cronológico por fechaProgramadaCarga (Día)
  const gruposCronologicos = useMemo((): GrupoCronologicoDia[] => {
    const map = new Map<string, { info: InfoFechaNormalizada; viajes: TripItem[] }>();

    for (const trip of tripsFiltrados) {
      const info = normalizarFecha(trip.fechaProgramadaCarga);
      if (!map.has(info.isoKey)) {
        map.set(info.isoKey, { info, viajes: [] });
      }
      map.get(info.isoKey)!.viajes.push(trip);
    }

    const lista = Array.from(map.values()).map(({ info, viajes }) => {
      viajes.sort((a, b) => {
        const tA = parsearHoraMinutos(a.horaProgramadaCarga);
        const tB = parsearHoraMinutos(b.horaProgramadaCarga);
        return tA - tB;
      });

      let horaMin = '';
      let horaMax = '';
      if (viajes.length > 0) {
        horaMin = viajes[0].horaProgramadaCarga || '06:00 AM';
        let maxM = -1;
        let maxStr = viajes[0].horaEntregaEstimada || viajes[0].horaProgramadaCarga;
        for (const v of viajes) {
          const m = parsearHoraMinutos(v.horaEntregaEstimada || v.horaProgramadaCarga);
          if (m > maxM) {
            maxM = m;
            maxStr = v.horaEntregaEstimada || v.horaProgramadaCarga;
          }
        }
        horaMax = maxStr || '08:00 PM';
      }

      const ventanaHoraria = horaMin && horaMax ? `VENTANA: ${horaMin} - ${horaMax}` : 'VENTANA DIURNA';
      const kmTotalesEstimados = viajes.length * 175;

      return {
        isoKey: info.isoKey,
        titulo: info.tituloCompleto,
        pildora: info.pildoraCorta,
        timestamp: info.timestamp,
        viajes,
        ventanaHoraria,
        kmTotalesEstimados,
      };
    });

    lista.sort((a, b) => a.timestamp - b.timestamp || a.isoKey.localeCompare(b.isoKey));
    return lista;
  }, [tripsFiltrados]);

  // Agrupación 2: Corte por Planta / Sede Origen
  const gruposPorPlanta = useMemo((): GrupoPlanta[] => {
    const map = new Map<string, { codigo: string; nombre: string; viajes: TripItem[] }>();

    for (const trip of tripsFiltrados) {
      const cod = (trip.origenSalida.codigo || '').trim();
      const nom = (trip.origenSalida.nombre || 'Planta Origen').trim();
      const key = (cod || nom).toUpperCase();

      if (!map.has(key)) {
        map.set(key, { codigo: cod, nombre: nom, viajes: [] });
      }
      map.get(key)!.viajes.push(trip);
    }

    const lista = Array.from(map.entries()).map(([key, { codigo, nombre, viajes }]) => {
      // Ordenar cronológicamente viajes de esta planta
      viajes.sort((a, b) => {
        const normA = normalizarFecha(a.fechaProgramadaCarga).timestamp + parsearHoraMinutos(a.horaProgramadaCarga) * 60000;
        const normB = normalizarFecha(b.fechaProgramadaCarga).timestamp + parsearHoraMinutos(b.horaProgramadaCarga) * 60000;
        return normA - normB;
      });

      let horaMin = viajes[0]?.horaProgramadaCarga || '06:00 AM';
      let horaMax = viajes[viajes.length - 1]?.horaEntregaEstimada || viajes[viajes.length - 1]?.horaProgramadaCarga || '08:00 PM';
      const ventanaHoraria = `VENTANA: ${horaMin} - ${horaMax}`;
      const destinos = new Set(viajes.map((v) => v.destinoLlegada.codigo || v.destinoLlegada.nombre)).size;
      const kmTotalesEstimados = viajes.length * 180;

      const tagCod = codigo ? `[${codigo}] ` : '';
      const titulo = `PLANTA ${tagCod}${nombre.toUpperCase()}`;

      return {
        key,
        codigo,
        nombre,
        titulo,
        viajes,
        ventanaHoraria,
        kmTotalesEstimados,
        destinosUnicos: destinos,
      };
    });

    return lista.sort((a, b) => b.viajes.length - a.viajes.length);
  }, [tripsFiltrados]);

  // Guardar / Confirmar en base de datos
  const handleConfirmarYGuardar = async () => {
    const validos = trips.filter((t) => !t.colision && !t.yaExiste && !t.registradoEnSesion);
    if (validos.length === 0) {
      mostrarToast('warn', 'No hay viajes pendientes por registrar.');
      return;
    }

    setGuardandoBd(true);
    try {
      const res = await programacionService.confirmarProgramacion(validos, clienteActivo?.idCliente);
      if (res.success) {
        mostrarToast('ok', `Éxito: Se registraron ${res.guardados} viajes en la tabla guias_viajes.`);
        const validosIds = new Set(validos.map((v) => v.id));
        const validosNros = new Set(validos.map((v) => v.nroTransporte));
        setTrips((prev) =>
          prev.map((t) => {
            if (validosIds.has(t.id) || validosNros.has(t.nroTransporte)) {
              return { ...t, registradoEnSesion: true, yaExiste: false, colision: false };
            }
            return t;
          })
        );
      } else {
        mostrarToast('warn', res.message || 'No se pudo guardar la programación.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al persistir en la base de datos.';
      mostrarToast('err', `Error al guardar: ${msg}`);
    } finally {
      setGuardandoBd(false);
    }
  };

  // Guardar un viaje individual directamente en BD
  const handleGuardarViajeIndividual = async (trip: TripItem) => {
    if (trip.registradoEnSesion) {
      mostrarToast('ok', `El viaje ${trip.nroTransporte} ya fue registrado en esta sesión.`);
      return;
    }
    if (trip.colision || trip.yaExiste) {
      mostrarToast('warn', `El viaje ${trip.nroTransporte} ya existe en la base de datos (colisión).`);
      return;
    }

    setGuardandoTripId(trip.id);
    try {
      const res = await programacionService.confirmarProgramacion(
        [trip],
        trip.origenSalida.idCliente || clienteActivo?.idCliente
      );
      if (res.success && res.guardados > 0) {
        mostrarToast('ok', `Viaje ${trip.nroTransporte} registrado con éxito en base de datos.`);
        setTrips((prev) =>
          prev.map((t) =>
            t.id === trip.id
              ? { ...t, registradoEnSesion: true, yaExiste: false, colision: false }
              : t
          )
        );
      } else {
        mostrarToast('warn', res.message || `No se pudo registrar el viaje ${trip.nroTransporte}.`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al persistir en la base de datos.';
      mostrarToast('err', `Error al registrar viaje ${trip.nroTransporte}: ${msg}`);
    } finally {
      setGuardandoTripId(null);
    }
  };

  // Eliminar renglón o viaje de la lista en pantalla
  const handleEliminarViaje = (tripId: string, nroTransporte: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
    mostrarToast('ok', `Viaje ${nroTransporte} eliminado de la lista.`);
  };

  // Guardar/confirmar en BD únicamente los viajes de un grupo (día específico o planta)
  const handleGuardarGrupo = async (viajesGrupo: TripItem[], nombreGrupo: string, grupoKey: string) => {
    const validos = viajesGrupo.filter((t) => !t.colision && !t.yaExiste && !t.registradoEnSesion);
    if (validos.length === 0) {
      mostrarToast('warn', `No hay viajes pendientes o aptos para registrar en ${nombreGrupo}.`);
      return;
    }

    setGuardandoGrupoKey(grupoKey);
    try {
      const res = await programacionService.confirmarProgramacion(validos, clienteActivo?.idCliente);
      if (res.success && res.guardados > 0) {
        mostrarToast('ok', `Éxito: Se registraron ${res.guardados} viajes de ${nombreGrupo} en guias_viajes.`);
        const validosIds = new Set(validos.map((v) => v.id));
        const validosNros = new Set(validos.map((v) => v.nroTransporte));
        setTrips((prev) =>
          prev.map((t) => {
            if (validosIds.has(t.id) || validosNros.has(t.nroTransporte)) {
              return { ...t, registradoEnSesion: true, yaExiste: false, colision: false };
            }
            return t;
          })
        );
      } else {
        mostrarToast('warn', res.message || `No se pudo registrar la programación de ${nombreGrupo}.`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al persistir en la base de datos.';
      mostrarToast('err', `Error al registrar ${nombreGrupo}: ${msg}`);
    } finally {
      setGuardandoGrupoKey(null);
    }
  };

  // Renderizador unificado y reutilizable de la tabla de viajes
  const renderTablaDeViajes = (viajesGrupo: TripItem[], grupoId: string) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/70 text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
              <th className="py-2.5 px-3">N° TRANSPORTE</th>
              <th className="py-2.5 px-3">ORIGEN SALIDA</th>
              <th className="py-2.5 px-3">DESTINO LLEGADA</th>
              <th className="py-2.5 px-3">OBSERVACIÓN MANIFIESTO</th>
              <th className="py-2.5 px-3">ESTADO INGESTA</th>
              <th className="py-2.5 px-3 text-center">ACCIONES RÁPIDAS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {viajesGrupo.map((trip) => {
              const esRegistrado = Boolean(trip.registradoEnSesion);
              const esColision = !esRegistrado && (trip.yaExiste || trip.colision);

              return (
                <tr
                  key={`${grupoId}-${trip.id}`}
                  className={`transition hover:bg-orange-50/40 ${
                    esRegistrado
                      ? 'bg-emerald-50/30'
                      : esColision
                        ? 'bg-rose-50/30'
                        : 'bg-white'
                  }`}
                >
                  {/* N° Guía / Despacho */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-gray-900 tracking-tight text-xs">
                          {trip.nroTransporte}
                        </span>
                        {esRegistrado ? (
                          <span
                            title="Este viaje acaba de ser registrado exitosamente en guias_viajes"
                            className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 rounded border border-emerald-300"
                          >
                            ✓ Registrado
                          </span>
                        ) : esColision ? (
                          <span
                            title="Este viaje ya está registrado en la tabla guias_viajes"
                            className="bg-rose-100 text-rose-800 text-[10px] font-black px-1.5 py-0.2 rounded border border-rose-300"
                          >
                            ⚠️ Ya en BD
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[10px] text-gray-500 flex items-center space-x-1 mt-0.5">
                        <span>🕒</span>
                        <span>
                          {trip.fechaProgramadaCarga} • {trip.horaProgramadaCarga}
                        </span>
                      </span>
                    </div>
                  </td>

                  {/* Origen Salida */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">
                        <span className="text-emerald-700 font-extrabold">[{trip.origenSalida.codigo}]</span>{' '}
                        {trip.origenSalida.nombre}
                      </span>
                    </div>
                  </td>

                  {/* Destino Llegada */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">
                        <span className="text-blue-700 font-extrabold">[{trip.destinoLlegada.codigo}]</span>{' '}
                        {trip.destinoLlegada.nombre}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Pr. Est. {trip.fechaEntregaEstimada} {trip.horaEntregaEstimada}
                      </span>
                    </div>
                  </td>

                  {/* Observación del Manifiesto */}
                  <td className="py-2.5 px-3">
                    <div className="flex flex-col max-w-[260px]">
                      <input
                        type="text"
                        value={trip.observacion ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTrips((prev) =>
                            prev.map((t) => (t.id === trip.id ? { ...t, observacion: val } : t))
                          );
                        }}
                        placeholder="Sin observación"
                        title={trip.observacion ? `Observación: ${trip.observacion}` : 'Sin observación en manifiesto (editable)'}
                        className="w-full text-xs font-semibold text-gray-800 bg-transparent hover:bg-gray-100/70 focus:bg-white border border-transparent hover:border-gray-300 focus:border-orange-500 rounded-lg px-2 py-1 placeholder:italic placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
                      />
                    </div>
                  </td>

                  {/* Estado Ingesta */}
                  <td className="py-3 px-3">
                    {esRegistrado ? (
                      <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>Registrado en BD</span>
                      </span>
                    ) : esColision ? (
                      <span className="inline-flex items-center space-x-1 bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                        <span>Colisión en BD</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Apto para Registrar</span>
                      </span>
                    )}
                  </td>

                  {/* Acciones Rápidas */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      {/* Guardar / Registrar Viaje */}
                      <button
                        type="button"
                        onClick={() => handleGuardarViajeIndividual(trip)}
                        disabled={esColision || esRegistrado || guardandoTripId === trip.id}
                        title={
                          esRegistrado
                            ? 'Este viaje ya fue registrado exitosamente'
                            : esColision
                              ? 'Este viaje ya está registrado en base de datos'
                              : 'Guardar / Registrar este viaje en base de datos'
                        }
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                          esColision || esRegistrado
                            ? 'bg-gray-100 text-gray-300 border border-gray-200 cursor-not-allowed opacity-60'
                            : 'bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 border border-orange-300 shadow-xs cursor-pointer active:scale-95'
                        }`}
                      >
                        {guardandoTripId === trip.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Eliminar renglón de la lista */}
                      <button
                        type="button"
                        onClick={() => handleEliminarViaje(trip.id, trip.nroTransporte)}
                        title="Eliminar renglón o viaje de la lista"
                        className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 flex items-center justify-center transition cursor-pointer shadow-xs active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 select-none font-sans">
      {/* Toast Alert Flotante */}
      {mensajeToast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 ${
            mensajeToast.tipo === 'ok'
              ? 'bg-emerald-600 text-white'
              : mensajeToast.tipo === 'warn'
                ? 'bg-amber-500 text-white'
                : 'bg-rose-600 text-white'
          }`}
        >
          {mensajeToast.tipo === 'ok' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
          {mensajeToast.tipo === 'warn' && <AlertTriangle className="w-5 h-5 shrink-0" />}
          {mensajeToast.tipo === 'err' && <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{mensajeToast.texto}</span>
          <button onClick={() => setMensajeToast(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input oculto para subida de PDF(s) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 0. Barra de Retorno a InicialProgramación y Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 pb-3">
        <Link
          to="/scheduling"
          className="inline-flex items-center space-x-2 text-xs font-bold text-gray-700 hover:text-orange-600 bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 px-3.5 py-2 rounded-xl shadow-2xs transition group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-gray-500 group-hover:text-orange-600 group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver a Programación Inicial</span>
        </Link>

        <div className="flex items-center space-x-2 text-[11px] font-bold tracking-wider uppercase text-gray-400">
          <Link to="/scheduling" className="hover:text-gray-600 transition cursor-pointer">Logístico</Link>
          <span className="text-gray-300 font-normal">&gt;</span>
          <Link to="/scheduling" className="text-orange-600 font-extrabold hover:text-orange-700 transition cursor-pointer">Programación de Viajes</Link>
          <span className="text-gray-300 font-normal">&gt;</span>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Ingesta de Manifiesto</span>
        </div>
      </div>

      {/* 1. Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Consola de Ingesta y Programación de Viajes
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Matriz de alta densidad para ingesta de manifiestos, validación de colisiones en base de datos y confirmación de despachos.
          </p>
        </div>

        {/* Acciones Superiores */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/scheduling"
            className="flex items-center space-x-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer shadow-xs active:scale-95 group"
            title="Volver a la pantalla de Programación Inicial"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Volver a Inicial</span>
          </Link>

          <Link
            to="/asignacion-conductores"
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer shadow-md active:scale-95"
            title="Ir a Asignación de Conductores"
          >
            <Users className="w-4 h-4 text-orange-400" />
            <span>Asignación de Conductores</span>
          </Link>

          <button
            onClick={handleLimpiarPantalla}
            title="Limpiar la consola para iniciar un nuevo proceso de carga de manifiestos"
            className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer shadow-xs active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Limpiar / Iniciar Carga</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={cargandoPdf}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {cargandoPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mensajeCarga}</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>+ Adjuntar Manifiesto (.pdf)</span>
              </>
            )}
          </button>

          {/* Cliente Determinado por Unidad de Origen */}
          {clienteActivo ? (
            <div
              className="flex items-center space-x-2.5 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-500 text-orange-950 px-3.5 py-1.5 rounded-xl shadow-xs"
              title={`Cliente determinado por la unidad de origen: ${clienteActivo.razonSocial} (${clienteActivo.rif || 'Sin RIF'})`}
            >
              <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-black uppercase text-orange-700 tracking-wider">
                    Cliente del Manifiesto
                  </span>
                  {clienteActivo.rif && (
                    <span className="text-[10px] font-bold text-gray-500 bg-white/80 px-1 py-0.2 rounded border border-orange-200">
                      {clienteActivo.rif}
                    </span>
                  )}
                </div>
                <span className="font-black text-xs text-gray-900 truncate max-w-[280px]">
                  {clienteActivo.nombreComercial || clienteActivo.razonSocial}
                </span>
              </div>
            </div>
          ) : (
            archivosCargados.length > 0 && (
              <div className="flex items-center space-x-2 bg-gray-100 border border-gray-300 text-gray-600 px-3 py-1.5 rounded-xl text-xs">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[11px] font-bold italic">Origen Sin Cliente Vinculado</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* 2. Barra de Métricas y Estado de Colisión */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Badge Nombre Archivo & Colisiones */}
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-700">
            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
            <span
              className="font-semibold text-gray-800 max-w-[200px] truncate cursor-help"
              title={
                archivosCargados.length > 0
                  ? archivosCargados.map((a, i) => `${i + 1}. ${a}`).join('\n')
                  : 'Sin archivos cargados'
              }
            >
              {archivosCargados.length === 0
                ? 'Sin manifiestos'
                : archivosCargados.length === 1
                  ? archivosCargados[0]
                  : `${archivosCargados.length} manifiestos acumulados`}
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center space-x-1 text-emerald-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{metricas.total} detectados</span>
            </span>
            <span className="text-gray-400">•</span>
            {metricas.colisiones > 0 ? (
              <span className="flex items-center space-x-1 text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{metricas.colisiones} colisiones en BD</span>
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold">0 colisiones</span>
            )}
          </div>

          {/* Badge Total */}
          <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
            TOTAL: {metricas.total} Viajes
          </div>

          {/* Badge Aptos para Ingesta */}
          <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Aptos para Ingesta: <strong className="font-bold text-emerald-950">{metricas.seleccionadosValidos}</strong> / {metricas.total}</span>
          </div>

          {/* Badge Retornos */}
          <div className="bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1">
            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
            <span>Retornos: 100% Geocercados</span>
          </div>
        </div>

        {/* Botón Guardar en Base de Datos */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleConfirmarYGuardar}
            disabled={guardandoBd || metricas.seleccionadosValidos === 0}
            className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-orange-500/20 transition transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {guardandoBd ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registrando en guias_viajes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Confirmar y Registrar Viajes ({metricas.seleccionadosValidos} Nuevos)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerta Destacada si existen Colisiones en guias_viajes */}
      {metricas.colisiones > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-2xl flex items-start space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-rose-800 text-sm">
              Colisión detectada: {metricas.colisiones} viaje(s) ya existen en la tabla guias_viajes
            </p>
            <p className="text-rose-700 mt-0.5">
              El sistema identificó que estos códigos de despacho ya fueron ingresados previamente. Se han resaltado en color ámbar/rojo y desmarcado por seguridad para evitar duplicaciones en la flota.
            </p>
          </div>
        </div>
      )}

      {/* 3. Selector de Pestaña Principal: Corte por Día vs Corte por Planta */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setModoVista('dia')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              modoVista === 'dia'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Calendar className={`w-4 h-4 ${modoVista === 'dia' ? 'text-orange-400' : 'text-gray-400'}`} />
            <span>Corte por Día (Cronológico)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                modoVista === 'dia' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {diasDisponibles.length} Días
            </span>
          </button>

          <button
            onClick={() => setModoVista('planta')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              modoVista === 'planta'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Building2 className={`w-4 h-4 ${modoVista === 'planta' ? 'text-emerald-400' : 'text-gray-400'}`} />
            <span>Corte por Planta (Sede Origen)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                modoVista === 'planta' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {plantasDisponibles.length} Plantas
            </span>
          </button>
        </div>

        <span className="text-[11px] text-gray-400 hidden sm:inline font-medium">
          {modoVista === 'dia' ? 'Agrupación temporal por fecha de despacho' : 'Agrupación logística por centro de carga'}
        </span>
      </div>

      {/* 4. Filtros Dinámicos y Buscador */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
        {/* Píldoras de Filtro Dinámicas */}
        {modoVista === 'dia' ? (
          // Píldoras por DÍA
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFiltroFecha('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filtroFecha === 'todos'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos <span className="ml-1 opacity-80">{trips.length}</span>
            </button>

            {diasDisponibles.map((dia) => (
              <button
                key={dia.isoKey}
                onClick={() => setFiltroFecha(dia.isoKey)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filtroFecha === dia.isoKey
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{dia.pildora}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                  {dia.total}
                </span>
              </button>
            ))}
          </div>
        ) : (
          // Píldoras por PLANTA
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFiltroPlanta('todas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filtroPlanta === 'todas'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas las Plantas <span className="ml-1 opacity-80">{trips.length}</span>
            </button>

            {plantasDisponibles.map((p) => (
              <button
                key={p.key}
                onClick={() => setFiltroPlanta(p.key)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filtroPlanta === p.key
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{p.codigo ? `[${p.codigo}] ` : ''}{p.nombre}</span>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                  {p.total}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Filtros Rápidos y Buscador */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Toggle Solo Colisiones */}
          {metricas.colisiones > 0 && (
            <button
              onClick={() => setFiltroSoloColisiones((prev) => !prev)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                filtroSoloColisiones
                  ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{metricas.colisiones} Colisiones</span>
            </button>
          )}

          {/* Input Buscador */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar guía TR-, origen, destino, obs..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* 5. Matriz de Viajes Agrupados (Acordeones Dinámicos) o Estado Vacío */}
      {trips.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-inner">
            <Upload className="w-8 h-8" />
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-black text-gray-900 tracking-tight">
              Consola Lista para Iniciar Proceso de Carga
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              No hay viajes en pantalla. Adjunte uno o más archivos PDF del mismo cliente para acumular sus despachos en la matriz sin sobreescribir los anteriores.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={cargandoPdf}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>+ Adjuntar Manifiesto(s) (.pdf)</span>
            </button>
          </div>
        </div>
      ) : tripsFiltrados.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500 text-xs font-medium">
          No se encontraron viajes que coincidan con los filtros de búsqueda aplicados.
        </div>
      ) : (
        <div className="space-y-4">
          {modoVista === 'dia' ? (
            // VISTA: CORTE POR DÍA
            gruposCronologicos.map((grupo) => {
              const estaAbierto = seccionesAbiertas[grupo.isoKey] !== undefined ? seccionesAbiertas[grupo.isoKey] : true;
              const viajesAptos = grupo.viajes.filter((v) => !v.colision && !v.yaExiste && !v.registradoEnSesion).length;
              const viajesTotal = grupo.viajes.length;

              return (
                <div key={grupo.isoKey} className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                  {/* Encabezado del Acordeón por Día */}
                  <div
                    onClick={() =>
                      setSeccionesAbiertas((prev) => ({ ...prev, [grupo.isoKey]: !estaAbierto }))
                    }
                    className="p-4 bg-gradient-to-r from-gray-50 to-white hover:bg-gray-100/70 border-b border-gray-200 flex items-center justify-between cursor-pointer transition select-none"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                        {estaAbierto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-gray-900 tracking-wide uppercase">
                          {grupo.titulo} —{' '}
                          <span className="text-gray-500 font-semibold">
                            {grupo.viajes.length} VIAJES PROGRAMADOS | {grupo.kmTotalesEstimados.toLocaleString()} KM TOTALES | {grupo.ventanaHoraria}
                          </span>
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] px-2.5 py-1 rounded-xl">
                        {viajesAptos}/{viajesTotal} Aptos para Ingesta
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGuardarGrupo(grupo.viajes, `el día ${grupo.pildora}`, grupo.isoKey);
                        }}
                        disabled={viajesAptos === 0 || guardandoGrupoKey === grupo.isoKey}
                        title={
                          viajesAptos === 0
                            ? 'Todos los viajes de este día ya están registrados en base de datos'
                            : `Registrar ${viajesAptos} viaje(s) de este día en base de datos`
                        }
                        className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-xs active:scale-95 ${
                          viajesAptos === 0
                            ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                            : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white border border-orange-600 shadow-sm shadow-orange-500/20 cursor-pointer'
                        }`}
                      >
                        {guardandoGrupoKey === grupo.isoKey ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Registrando...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Registro Diario</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tabla de Viajes */}
                  {estaAbierto && renderTablaDeViajes(grupo.viajes, `dia-${grupo.isoKey}`)}
                </div>
              );
            })
          ) : (
            // VISTA: CORTE POR PLANTA
            gruposPorPlanta.map((grupo) => {
              const estaAbierto = seccionesAbiertas[grupo.key] !== undefined ? seccionesAbiertas[grupo.key] : true;
              const viajesAptos = grupo.viajes.filter((v) => !v.colision && !v.yaExiste && !v.registradoEnSesion).length;
              const viajesTotal = grupo.viajes.length;

              return (
                <div key={grupo.key} className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                  {/* Encabezado del Acordeón por Planta */}
                  <div
                    onClick={() =>
                      setSeccionesAbiertas((prev) => ({ ...prev, [grupo.key]: !estaAbierto }))
                    }
                    className="p-4 bg-gradient-to-r from-emerald-50/40 to-white hover:bg-emerald-50/70 border-b border-gray-200 flex items-center justify-between cursor-pointer transition select-none"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        {estaAbierto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-gray-900 tracking-wide uppercase">
                          {grupo.titulo} —{' '}
                          <span className="text-gray-500 font-semibold">
                            {grupo.viajes.length} VIAJES PROGRAMADOS | {grupo.destinosUnicos} DESTINOS | {grupo.ventanaHoraria}
                          </span>
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] px-2.5 py-1 rounded-xl">
                        {viajesAptos}/{viajesTotal} Aptos para Ingesta
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGuardarGrupo(grupo.viajes, grupo.titulo, grupo.key);
                        }}
                        disabled={viajesAptos === 0 || guardandoGrupoKey === grupo.key}
                        title={
                          viajesAptos === 0
                            ? 'Todos los viajes de esta planta ya están registrados en base de datos'
                            : `Registrar ${viajesAptos} viaje(s) de esta planta en base de datos`
                        }
                        className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-xs active:scale-95 ${
                          viajesAptos === 0
                            ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                            : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white border border-orange-600 shadow-sm shadow-orange-500/20 cursor-pointer'
                        }`}
                      >
                        {guardandoGrupoKey === grupo.key ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Registrando...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Registrar Planta</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tabla de Viajes */}
                  {estaAbierto && renderTablaDeViajes(grupo.viajes, `planta-${grupo.key}`)}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
