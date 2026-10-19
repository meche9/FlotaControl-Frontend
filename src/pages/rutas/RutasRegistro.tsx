import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Route as RouteIcon,
  Plus,
  Save,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  Fuel,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  MoreVertical,
  Cpu,
  ToggleLeft,
  ToggleRight,
  X,
  AlertCircle,
  Coins,
  Ticket,
  Building2,
  Copy,
  Check,
  MapPin,
  Warehouse,
  ChevronDown,
  Trash2,
  Search,
} from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  Modal,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui';
import { clientesService, type Cliente, obtenerCodigoAvatar } from '../../services/clientesService';
import { puntosCargaService, type PuntoCargaDescarga } from '../../services/puntosCargaService';
import {
  rutasService,
  type Ruta,
  type CreateRutaDto,
  type UpdateRutaDto,
  type RutaTipoCobro,
  type PeajeVzla,
  type RutaPeaje,
  type ItemRutaPeajeDto,
  type RecargoGeneral,
  type ItemRutaRecargoDto,
  type RecargoTipoCalculo,
} from '../../services/rutasService';
import { getApiErrorMessage } from '../../services/api';

// Elemento interactivo en el modal de peajes
interface PeajeModalItem {
  idPeaje: number;
  nombrePeaje: string;
  estadoUbicacion: string;
  ubicacionDetallada: string;
  selected: boolean;
  orden: number;
  costo: string;
  activo: boolean;
}

// Elemento interactivo en el modal de recargos y viáticos
interface RecargoModalItem {
  idRecargo: string;
  concepto: string;
  tipoCalculo: RecargoTipoCalculo;
  valor: number | string;
  selected: boolean;
}

export default function RutasRegistro() {
  const [searchParams] = useSearchParams();

  // Referencias para navegación secuencial con Enter en el formulario de registro
  const clienteRef = useRef<HTMLSelectElement>(null);
  const puntoOrigenRef = useRef<HTMLSelectElement>(null);
  const ciudadOrigenRef = useRef<HTMLInputElement>(null);
  const puntoDestinoRef = useRef<HTMLSelectElement>(null);
  const ciudadDestinoRef = useRef<HTMLInputElement>(null);
  const distanciaKmRef = useRef<HTMLInputElement>(null);
  const tiempoEstimadoHorasRef = useRef<HTMLInputElement>(null);
  const consumoEstimadoGasoilRef = useRef<HTMLInputElement>(null);
  const nombreRutaRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  // Referencias para modal de tarifas
  const tarifaTipoCobroRef = useRef<HTMLSelectElement>(null);
  const tarifaMonedaRef = useRef<HTMLSelectElement>(null);
  const tarifaMontoTarifaRef = useRef<HTMLInputElement>(null);
  const tarifaSubmitBtnRef = useRef<HTMLButtonElement>(null);

  // Salto secuencial de foco al presionar Enter
  const handleKeyDownNext = (
    e: React.KeyboardEvent,
    target: React.RefObject<HTMLElement | null>
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      target.current?.focus();
    }
  };

  // Estados de datos principales
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [puntosCliente, setPuntosCliente] = useState<PuntoCargaDescarga[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [selectedRuta, setSelectedRuta] = useState<Ruta | null>(null);

  // Estados de interfaz y filtrado
  const [saving, setSaving] = useState<boolean>(false);
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'activas' | 'inactivas'>('todas');
  const [openMenuRutaId, setOpenMenuRutaId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Modales interactivos
  const [modalTarifaOpen, setModalTarifaOpen] = useState(false);
  const [modalPeajesOpen, setModalPeajesOpen] = useState(false);
  const [modalRecargosOpen, setModalRecargosOpen] = useState(false);
  const [modalMatrizOpen, setModalMatrizOpen] = useState(false);
  const [activeModalRuta, setActiveModalRuta] = useState<Ruta | null>(null);

  // Estados locales para el modal de tarifas
  const [tarifaSaving, setTarifaSaving] = useState<boolean>(false);
  const [tarifaForm, setTarifaForm] = useState<{
    tipoCobro: RutaTipoCobro;
    montoTarifa: string;
    moneda: string;
  }>({
    tipoCobro: 'Por_Viaje_Fijo',
    montoTarifa: '0.00',
    moneda: 'USD',
  });

  // Estados locales para peajes de Venezuela y asignación a rutas
  const [catalogoPeajesVzla, setCatalogoPeajesVzla] = useState<PeajeVzla[]>([]);
  const [peajesModalItems, setPeajesModalItems] = useState<PeajeModalItem[]>([]);
  const [peajesLoading, setPeajesLoading] = useState<boolean>(false);
  const [peajesSaving, setPeajesSaving] = useState<boolean>(false);
  const [peajesFiltroTexto, setPeajesFiltroTexto] = useState<string>('');

  // Estados locales para recargos generales y asignación a rutas
  const [catalogoRecargosGenerales, setCatalogoRecargosGenerales] = useState<RecargoGeneral[]>([]);
  const [recargosModalItems, setRecargosModalItems] = useState<RecargoModalItem[]>([]);
  const [recargosLoading, setRecargosLoading] = useState<boolean>(false);
  const [recargosSaving, setRecargosSaving] = useState<boolean>(false);

  // Formulario Ficha Paramétrica de la Ruta
  const [formData, setFormData] = useState({
    nombreRuta: '',
    idPuntoOrigen: '',
    idPuntoDestino: '',
    ciudadOrigen: '',
    ciudadDestino: '',
    distanciaKm: '158.40',
    tiempoEstimadoHoras: '3.5',
    consumoEstimadoGasoil: '66.500000',
    montoTarifa: '0.00',
    tipoCobro: 'Por_Viaje_Fijo' as RutaTipoCobro,
    moneda: 'USD',
    activo: true,
  });

  // 1. Cargar Clientes al montar
  useEffect(() => {
    async function loadInitial() {
      try {
        const clientesList = await clientesService.getClientes();
        setClientes(clientesList);

        // Preseleccionar cliente de URL o Polar si existe, o el primero
        const urlClienteId = searchParams.get('clienteId');
        let initialId = '';

        if (urlClienteId && clientesList.some((c) => c.idCliente === urlClienteId)) {
          initialId = urlClienteId;
        } else {
          const polar = clientesList.find(
            (c) =>
              c.razonSocial.toLowerCase().includes('polar') ||
              c.rif.includes('00006372')
          );
          initialId = polar ? polar.idCliente : clientesList[0]?.idCliente || '';
        }

        setSelectedClienteId(initialId);
      } catch (err) {
        setFeedbackMsg({
          tipo: 'error',
          texto: getApiErrorMessage(err, 'No se pudieron cargar los clientes.'),
        });
      }
    }
    loadInitial();
  }, [searchParams]);

  // Cargar catálogo nacional de peajes (peajes_vzla)
  useEffect(() => {
    async function fetchCatalogoPeajes() {
      try {
        const vzla = await rutasService.getPeajesVzla();
        setCatalogoPeajesVzla(vzla);
      } catch (err) {
        console.error('Error al cargar catálogo de peajes vzla:', err);
      }
    }
    fetchCatalogoPeajes();
  }, []);

  // 2. Al cambiar el cliente seleccionado, cargar sus puntos y rutas
  useEffect(() => {
    if (!selectedClienteId) return;

    async function loadClienteData() {
      try {
        const [puntos, rutasData] = await Promise.all([
          puntosCargaService.getPuntosByCliente(selectedClienteId),
          rutasService.getRutasByCliente(selectedClienteId),
        ]);

        setPuntosCliente(puntos);
        setRutas(rutasData);

        // Si se especificó una ruta en la URL, cargarla; de lo contrario iniciar formulario de nueva ruta
        const urlRutaId = searchParams.get('rutaId');
        const rutaEncontrada = urlRutaId
          ? rutasData.find((r) => r.idRuta === urlRutaId)
          : null;

        if (rutaEncontrada) {
          cargarRutaEnFormulario(rutaEncontrada);
        } else {
          iniciarNuevaRuta(selectedClienteId, puntos);
        }
      } catch (err) {
        console.error('Error al cargar datos del cliente:', err);
        setFeedbackMsg({
          tipo: 'error',
          texto: getApiErrorMessage(err, 'No se pudieron cargar las rutas y sedes del cliente seleccionado.'),
        });
      }
    }

    loadClienteData();
  }, [selectedClienteId, searchParams]);

  // Cliente actual seleccionado
  const clienteActual = useMemo(() => {
    return clientes.find((c) => c.idCliente === selectedClienteId);
  }, [clientes, selectedClienteId]);

  // Filtrar puntos para Origen (no descarga / no destino, incluye ambos)
  const puntosOrigen = useMemo(() => {
    return puntosCliente.filter((p) => {
      const tipo = ((p.tipoPunto || (p as any).tipo_punto || '') as string).toLowerCase().trim();
      return tipo !== 'descarga' && tipo !== 'destino';
    });
  }, [puntosCliente]);

  // Filtrar puntos para Destino (no carga / no origen, incluye ambos)
  const puntosDestino = useMemo(() => {
    return puntosCliente.filter((p) => {
      const tipo = ((p.tipoPunto || (p as any).tipo_punto || '') as string).toLowerCase().trim();
      return tipo !== 'carga' && tipo !== 'origen';
    });
  }, [puntosCliente]);

  // Inicializar o cargar una ruta existente en el formulario
  const cargarRutaEnFormulario = (ruta: Ruta) => {
    setSelectedRuta(ruta);
    setFormData({
      nombreRuta: ruta.nombreRuta || '',
      idPuntoOrigen: ruta.idPuntoOrigen || '',
      idPuntoDestino: ruta.idPuntoDestino || '',
      ciudadOrigen: ruta.ciudadOrigen || '',
      ciudadDestino: ruta.ciudadDestino || '',
      distanciaKm: ruta.distanciaKm != null ? String(ruta.distanciaKm) : '0',
      tiempoEstimadoHoras:
        ruta.tiempoEstimadoHoras != null ? String(ruta.tiempoEstimadoHoras) : '0',
      consumoEstimadoGasoil:
        ruta.consumoEstimadoGasoil != null ? String(ruta.consumoEstimadoGasoil) : '0',
      montoTarifa: ruta.montoTarifa != null ? String(ruta.montoTarifa) : '0.00',
      tipoCobro: (ruta.tipoCobro as RutaTipoCobro) || 'Por_Viaje_Fijo',
      moneda: ruta.moneda || 'USD',
      activo: Boolean(ruta.activo),
    });
  };

  // Modo "+ Nueva Ruta"
  const iniciarNuevaRuta = (_clienteId = selectedClienteId, puntos = puntosCliente) => {
    setSelectedRuta(null);
    const validosOrigen = puntos.filter((p) => {
      const tipo = ((p.tipoPunto || (p as any).tipo_punto || '') as string).toLowerCase().trim();
      return tipo !== 'descarga' && tipo !== 'destino';
    });

    const pOrigen = validosOrigen[0] || puntos[0];

    setFormData({
      nombreRuta: '',
      idPuntoOrigen: pOrigen ? pOrigen.idPunto : '',
      idPuntoDestino: '',
      ciudadOrigen: pOrigen ? `${pOrigen.ciudad}, ${pOrigen.estado}` : '',
      ciudadDestino: '',
      distanciaKm: '100.00',
      tiempoEstimadoHoras: '2.0',
      consumoEstimadoGasoil: '42.000000',
      montoTarifa: '0.00',
      tipoCobro: 'Por_Viaje_Fijo',
      moneda: 'USD',
      activo: true,
    });
  };

  // Recargar rutas del cliente seleccionado
  const recargarRutasCliente = async (clienteId = selectedClienteId) => {
    if (!clienteId) return;
    try {
      const rutasData = await rutasService.getRutasByCliente(clienteId);
      setRutas(rutasData);
    } catch (err) {
      console.error('Error al recargar rutas:', err);
    }
  };

  // Abrir modal de tarifas para una ruta dada (carga datos actuales de tarifa de la ruta)
  const abrirModalTarifas = (ruta: Ruta) => {
    setActiveModalRuta(ruta);
    setTarifaForm({
      tipoCobro: (ruta.tipoCobro as RutaTipoCobro) || 'Por_Viaje_Fijo',
      montoTarifa: ruta.montoTarifa != null ? String(Number(ruta.montoTarifa)) : '0.00',
      moneda: ruta.moneda || 'USD',
    });
    setModalTarifaOpen(true);
  };

  // Guardar (actualizar) tarifa directamente en la tabla rutas
  const handleGuardarTarifa = async () => {
    if (!activeModalRuta) return;

    if (
      tarifaForm.montoTarifa === '' ||
      isNaN(Number(tarifaForm.montoTarifa)) ||
      Number(tarifaForm.montoTarifa) < 0
    ) {
      setFeedbackMsg({
        tipo: 'error',
        texto: 'Por favor ingrese un monto de tarifa válido mayor o igual a 0.',
      });
      return;
    }

    setTarifaSaving(true);
    try {
      const payload: UpdateRutaDto = {
        montoTarifa: parseFloat(tarifaForm.montoTarifa) || 0,
        tipoCobro: tarifaForm.tipoCobro,
        moneda: tarifaForm.moneda || 'USD',
      };

      const updated = await rutasService.updateRuta(activeModalRuta.idRuta, payload);

      // Actualizar listado de rutas en memoria
      setRutas((prev) =>
        prev.map((r) => (r.idRuta === updated.idRuta ? { ...r, ...updated } : r))
      );

      // Si la ruta modificada coincide con la seleccionada en el formulario, actualizarla
      if (selectedRuta && selectedRuta.idRuta === updated.idRuta) {
        setSelectedRuta((prev) => (prev ? { ...prev, ...updated } : null));
        setFormData((prev) => ({
          ...prev,
          montoTarifa: updated.montoTarifa != null ? String(updated.montoTarifa) : prev.montoTarifa,
          tipoCobro: (updated.tipoCobro as RutaTipoCobro) || prev.tipoCobro,
          moneda: updated.moneda || prev.moneda,
        }));
      }

      await recargarRutasCliente();
      setActiveModalRuta(updated);
      setModalTarifaOpen(false);

      setFeedbackMsg({
        tipo: 'success',
        texto: `Tarifa de la ruta "${updated.nombreRuta}" actualizada exitosamente: $${Number(updated.montoTarifa).toFixed(2)} ${updated.moneda} (${updated.tipoCobro?.replace(/_/g, ' ')}).`,
      });
    } catch (err) {
      setFeedbackMsg({
        tipo: 'error',
        texto: getApiErrorMessage(err, 'Error al actualizar la tarifa de la ruta.'),
      });
    } finally {
      setTarifaSaving(false);
    }
  };

  // Abrir modal de asignación de peajes para una ruta
  const abrirModalPeajes = async (ruta: Ruta) => {
    setActiveModalRuta(ruta);
    setPeajesLoading(true);
    setPeajesFiltroTexto('');
    setModalPeajesOpen(true);

    try {
      // 1. Obtener catálogo nacional de peajes (peajes_vzla)
      let vzla = catalogoPeajesVzla;
      if (vzla.length === 0) {
        vzla = await rutasService.getPeajesVzla();
        setCatalogoPeajesVzla(vzla);
      }

      // 2. Obtener peajes ya asignados a esta ruta (rutas_peajes)
      const asignados = await rutasService.getPeajesByRuta(ruta.idRuta);

      // Mapa de peajes asignados indexados por nombre normalizado
      const asignadosMap = new Map<string, RutaPeaje>();
      asignados.forEach((a) => {
        asignadosMap.set(a.nombrePeaje.trim().toLowerCase(), a);
      });

      let maxOrden = 0;
      asignados.forEach((a) => {
        if (a.orden > maxOrden) maxOrden = a.orden;
      });

      // 3. Cruzar catálogo con peajes asignados
      const items: PeajeModalItem[] = vzla.map((p) => {
        const asignado = asignadosMap.get(p.nombrePeaje.trim().toLowerCase());
        if (asignado) {
          return {
            idPeaje: p.idPeaje,
            nombrePeaje: p.nombrePeaje,
            estadoUbicacion: p.estadoUbicacion,
            ubicacionDetallada: p.ubicacionDetallada || '',
            selected: true,
            orden: asignado.orden,
            costo: String(Number(asignado.costo).toFixed(2)),
            activo: Boolean(asignado.activo),
          };
        } else {
          return {
            idPeaje: p.idPeaje,
            nombrePeaje: p.nombrePeaje,
            estadoUbicacion: p.estadoUbicacion,
            ubicacionDetallada: p.ubicacionDetallada || '',
            selected: false,
            orden: maxOrden + 1,
            costo: '2.50',
            activo: true,
          };
        }
      });

      // Ordenar: primero los peajes asignados por su orden, luego el resto alfabéticamente
      items.sort((a, b) => {
        if (a.selected && !b.selected) return -1;
        if (!a.selected && b.selected) return 1;
        if (a.selected && b.selected) return a.orden - b.orden;
        return a.nombrePeaje.localeCompare(b.nombrePeaje);
      });

      setPeajesModalItems(items);
    } catch (err) {
      setFeedbackMsg({
        tipo: 'error',
        texto: getApiErrorMessage(err, 'No se pudieron cargar los peajes de la ruta.'),
      });
    } finally {
      setPeajesLoading(false);
    }
  };

  // Alternar selección de un peaje en el modal
  const handleTogglePeaje = (idPeaje: number, selected: boolean) => {
    setPeajesModalItems((prev) => {
      const nextOrden = Math.max(0, ...prev.filter((p) => p.selected).map((p) => p.orden)) + 1;
      return prev.map((p) => {
        if (p.idPeaje === idPeaje) {
          return {
            ...p,
            selected,
            orden: selected && p.orden === 1 && nextOrden > 1 ? nextOrden : p.orden,
          };
        }
        return p;
      });
    });
  };

  // Modificar campo individual de un peaje en el modal
  const handleUpdatePeajeField = (
    idPeaje: number,
    field: 'orden' | 'costo' | 'activo',
    value: any
  ) => {
    setPeajesModalItems((prev) =>
      prev.map((p) => (p.idPeaje === idPeaje ? { ...p, [field]: value } : p))
    );
  };

  // Renumerar orden de peajes seleccionados correlativamente de 1 a N
  const handleRenumerarPeajes = () => {
    setPeajesModalItems((prev) => {
      const seleccionados = prev.filter((p) => p.selected).sort((a, b) => a.orden - b.orden);
      const ordenMap = new Map<number, number>();
      seleccionados.forEach((p, idx) => {
        ordenMap.set(p.idPeaje, idx + 1);
      });
      return prev.map((p) =>
        ordenMap.has(p.idPeaje) ? { ...p, orden: ordenMap.get(p.idPeaje)! } : p
      );
    });
  };

  // Guardar asignación de peajes para la ruta activa en rutas_peajes
  const handleGuardarPeajes = async () => {
    if (!activeModalRuta) return;

    const seleccionados = peajesModalItems.filter((p) => p.selected);

    // Validar costos
    for (const p of seleccionados) {
      if (isNaN(Number(p.costo)) || Number(p.costo) < 0) {
        setFeedbackMsg({
          tipo: 'error',
          texto: `El costo del peaje "${p.nombrePeaje}" debe ser un monto numérico válido mayor o igual a 0.`,
        });
        return;
      }
    }

    setPeajesSaving(true);
    try {
      const payload: ItemRutaPeajeDto[] = seleccionados
        .sort((a, b) => a.orden - b.orden)
        .map((p) => ({
          nombrePeaje: p.nombrePeaje,
          ubicacion: p.ubicacionDetallada || p.estadoUbicacion || null,
          orden: Number(p.orden) || 1,
          costo: parseFloat(p.costo) || 0,
          activo: p.activo,
        }));

      await rutasService.asignarPeajesRuta(activeModalRuta.idRuta, payload);

      // Actualizar conteo de peajes en memoria para la ruta
      setRutas((prev) =>
        prev.map((r) =>
          r.idRuta === activeModalRuta.idRuta
            ? {
              ...r,
              _count: {
                ...r._count,
                rutaPeajes: seleccionados.length,
              },
            }
            : r
        )
      );

      setModalPeajesOpen(false);
      setFeedbackMsg({
        tipo: 'success',
        texto: `Se asignaron ${seleccionados.length} estaciones de peaje a la ruta "${activeModalRuta.nombreRuta}".`,
      });
    } catch (err) {
      setFeedbackMsg({
        tipo: 'error',
        texto: getApiErrorMessage(err, 'Error al guardar los peajes de la ruta.'),
      });
    } finally {
      setPeajesSaving(false);
    }
  };

  // Filtrado de peajes en el modal
  const peajesFiltradosModal = useMemo(() => {
    if (!peajesFiltroTexto.trim()) return peajesModalItems;
    const q = peajesFiltroTexto.toLowerCase().trim();
    return peajesModalItems.filter(
      (p) =>
        p.nombrePeaje.toLowerCase().includes(q) ||
        p.estadoUbicacion.toLowerCase().includes(q) ||
        (p.ubicacionDetallada && p.ubicacionDetallada.toLowerCase().includes(q))
    );
  }, [peajesModalItems, peajesFiltroTexto]);

  // Totales de peajes seleccionados
  const peajesSeleccionados = useMemo(() => {
    return peajesModalItems.filter((p) => p.selected);
  }, [peajesModalItems]);

  const peajesSeleccionadosActivos = useMemo(() => {
    return peajesModalItems.filter((p) => p.selected && p.activo);
  }, [peajesModalItems]);

  const costoTotalPeajes = useMemo(() => {
    return peajesSeleccionadosActivos.reduce(
      (acc, p) => acc + (parseFloat(p.costo) || 0),
      0
    );
  }, [peajesSeleccionadosActivos]);

  // Abrir modal de asignación de recargos y viáticos para una ruta
  const abrirModalRecargos = async (ruta: Ruta) => {
    setActiveModalRuta(ruta);
    setRecargosLoading(true);
    setModalRecargosOpen(true);

    try {
      // 1. Obtener catálogo general de recargos (recargos_generales)
      let catalogo = catalogoRecargosGenerales;
      if (catalogo.length === 0) {
        catalogo = await rutasService.getRecargosGenerales();
        setCatalogoRecargosGenerales(catalogo);
      }

      // 2. Obtener recargos ya asignados a esta ruta (rutas_recargos)
      const asignados = await rutasService.getRecargosByRuta(ruta.idRuta);

      // Set de conceptos asignados
      const asignadosConceptos = new Set(
        asignados.map((a) => a.concepto.trim().toLowerCase())
      );

      // 3. Mapear catálogo cruzándolo con recargos ya asignados
      const items: RecargoModalItem[] = catalogo.map((rg) => ({
        idRecargo: rg.idRecargo,
        concepto: rg.concepto,
        tipoCalculo: rg.tipoCalculo,
        valor: rg.valor,
        selected: asignadosConceptos.has(rg.concepto.trim().toLowerCase()),
      }));

      // Ordenar: seleccionados primero, luego alfabéticamente
      items.sort((a, b) => {
        if (a.selected && !b.selected) return -1;
        if (!a.selected && b.selected) return 1;
        return a.concepto.localeCompare(b.concepto);
      });

      setRecargosModalItems(items);
    } catch (err) {
      setFeedbackMsg({
        tipo: 'error',
        texto: getApiErrorMessage(err, 'No se pudieron cargar los recargos de la ruta.'),
      });
    } finally {
      setRecargosLoading(false);
    }
  };

  // Alternar selección de un recargo en el modal (multiselección sin checkboxes)
  const handleToggleRecargo = (idRecargo: string) => {
    setRecargosModalItems((prev) =>
      prev.map((item) =>
        item.idRecargo === idRecargo
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  };

  // Guardar asignación de recargos seleccionados en rutas_recargos
  const handleGuardarRecargos = async () => {
    if (!activeModalRuta) return;

    const seleccionados = recargosModalItems.filter((r) => r.selected);
    setRecargosSaving(true);
    try {
      const payload: ItemRutaRecargoDto[] = seleccionados.map((r) => ({
        concepto: r.concepto,
        tipoCalculo: r.tipoCalculo,
        valor: parseFloat(String(r.valor)) || 0,
      }));

      await rutasService.asignarRecargosRuta(activeModalRuta.idRuta, payload);

      // Actualizar conteo de recargos en memoria para la ruta
      setRutas((prev) =>
        prev.map((r) =>
          r.idRuta === activeModalRuta.idRuta
            ? {
              ...r,
              _count: {
                ...r._count,
                rutaRecargos: seleccionados.length,
              },
            }
            : r
        )
      );

      setModalRecargosOpen(false);
      setFeedbackMsg({
        tipo: 'success',
        texto: `Se asignaron ${seleccionados.length} recargos a la ruta "${activeModalRuta.nombreRuta}".`,
      });
    } catch (err) {
      setFeedbackMsg({
        tipo: 'error',
        texto: getApiErrorMessage(err, 'Error al guardar los recargos de la ruta.'),
      });
    } finally {
      setRecargosSaving(false);
    }
  };


  // Verificar si ya existe una ruta para el origen y destino seleccionados
  const verificarRutaExistente = (
    idPuntoOrigen: string,
    idPuntoDestino: string,
    rutaActualId?: string | null
  ): Ruta | null => {
    if (!idPuntoOrigen || !idPuntoDestino) return null;

    return (
      rutas.find((r) => {
        // Si estamos editando una ruta específica, ignorar esa misma ruta
        if (rutaActualId && r.idRuta === rutaActualId) {
          return false;
        }

        // 1. Coincidencia directa por idPunto si ambos están presentes
        if (r.idPuntoOrigen && r.idPuntoDestino) {
          return (
            r.idPuntoOrigen === idPuntoOrigen &&
            r.idPuntoDestino === idPuntoDestino
          );
        }

        // 2. Coincidencia complementaria (por puntos o ciudades normalizadas)
        const pOrigen = puntosCliente.find((p) => p.idPunto === idPuntoOrigen);
        const pDestino = puntosCliente.find((p) => p.idPunto === idPuntoDestino);

        const origenCoincide =
          r.idPuntoOrigen === idPuntoOrigen ||
          (pOrigen &&
            r.ciudadOrigen?.trim().toLowerCase() ===
            `${pOrigen.ciudad}, ${pOrigen.estado}`.trim().toLowerCase());

        const destinoCoincide =
          r.idPuntoDestino === idPuntoDestino ||
          (pDestino &&
            r.ciudadDestino?.trim().toLowerCase() ===
            `${pDestino.ciudad}, ${pDestino.estado}`.trim().toLowerCase());

        return Boolean(origenCoincide && destinoCoincide);
      }) || null
    );
  };

  // Autocompletar ciudad y estado al cambiar punto de origen
  const handleSelectOrigen = (idPunto: string) => {
    const p = puntosCliente.find((item) => item.idPunto === idPunto);
    setFormData((prev) => ({
      ...prev,
      idPuntoOrigen: idPunto,
      ciudadOrigen: p ? `${p.ciudad}, ${p.estado}` : prev.ciudadOrigen,
    }));
  };

  // Autocompletar ciudad y estado al cambiar punto de destino
  const handleSelectDestino = (idPunto: string) => {
    const p = puntosCliente.find((item) => item.idPunto === idPunto);
    const nuevaCiudadDestino = p ? `${p.ciudad}, ${p.estado}` : '';

    setFormData((prev) => ({
      ...prev,
      idPuntoDestino: idPunto,
      ciudadDestino: p ? nuevaCiudadDestino : prev.ciudadDestino,
    }));
  };

  // Generar nombre canónico de la ruta automáticamente
  const generarNombreCanonico = () => {
    const pOrigen = puntosCliente.find((p) => p.idPunto === formData.idPuntoOrigen);
    const pDestino = puntosCliente.find((p) => p.idPunto === formData.idPuntoDestino);

    const origenStr = pOrigen ? pOrigen.nombreSede : formData.ciudadOrigen || 'Origen';
    const destinoStr = pDestino ? pDestino.nombreSede : formData.ciudadDestino || 'Destino';

    const nombreSugerido = `Ruta Troncal: ${origenStr} — ${destinoStr}`;
    setFormData((prev) => ({ ...prev, nombreRuta: nombreSugerido }));
  };

  // Recálculo inteligente con el Modelo Energético v2.5
  const recalcularModeloEnergetico = (kmInput: string) => {
    const km = parseFloat(kmInput);
    if (!isNaN(km) && km > 0) {
      const horas = (km / 45.2).toFixed(1);
      const gasoil = (km * 0.420).toFixed(6);

      setFormData((prev) => ({
        ...prev,
        distanciaKm: kmInput,
        tiempoEstimadoHoras: horas,
        consumoEstimadoGasoil: gasoil,
      }));
    } else {
      setFormData((prev) => ({ ...prev, distanciaKm: kmInput }));
    }
  };

  // Guardar (Crear o Actualizar) Ruta en el Backend
  const handleGuardarRuta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClienteId) {
      setFeedbackMsg({ tipo: 'error', texto: 'Seleccione un cliente contratante.' });
      return;
    }

    if (!formData.nombreRuta.trim()) {
      setFeedbackMsg({ tipo: 'error', texto: 'Indique el nombre canónico de la ruta.' });
      return;
    }

    if (!formData.ciudadOrigen.trim() || !formData.ciudadDestino.trim()) {
      setFeedbackMsg({
        tipo: 'error',
        texto: 'Especifique la ciudad de origen y ciudad de destino.',
      });
      return;
    }

    setSaving(true);
    setFeedbackMsg(null);

    const payload: CreateRutaDto = {
      idCliente: selectedClienteId,
      nombreRuta: formData.nombreRuta.trim(),
      ciudadOrigen: formData.ciudadOrigen.trim(),
      ciudadDestino: formData.ciudadDestino.trim(),
      idPuntoOrigen: formData.idPuntoOrigen || null,
      idPuntoDestino: formData.idPuntoDestino || null,
      distanciaKm: parseFloat(formData.distanciaKm) || 0,
      tiempoEstimadoHoras: parseFloat(formData.tiempoEstimadoHoras) || null,
      consumoEstimadoGasoil: parseFloat(formData.consumoEstimadoGasoil) || 0,
      montoTarifa: parseFloat(formData.montoTarifa) || 0,
      tipoCobro: formData.tipoCobro,
      moneda: formData.moneda || 'USD',
      activo: formData.activo,
    };

    try {
      if (selectedRuta) {
        // Modo Edición: Actualizar la ruta existente seleccionada
        const duplicada = verificarRutaExistente(
          formData.idPuntoOrigen,
          formData.idPuntoDestino,
          selectedRuta.idRuta
        );

        if (duplicada) {
          setFeedbackMsg({
            tipo: 'error',
            texto: `Ya existe otra ruta registrada ("${duplicada.nombreRuta}") con este mismo origen y destino.`,
          });
          setSaving(false);
          return;
        }

        const updated = await rutasService.updateRuta(selectedRuta.idRuta, payload);
        setRutas((prev) =>
          prev.map((r) => (r.idRuta === updated.idRuta ? updated : r))
        );
        setSelectedRuta(updated);
        setFeedbackMsg({
          tipo: 'success',
          texto: `Ruta "${updated.nombreRuta}" actualizada correctamente.`,
        });
      } else {
        // Modo Creación: Registrar nueva ruta sin sobreescribir rutas anteriores
        const duplicada = verificarRutaExistente(
          formData.idPuntoOrigen,
          formData.idPuntoDestino,
          null
        );

        if (duplicada) {
          setFeedbackMsg({
            tipo: 'error',
            texto: `Ya existe una ruta ("${duplicada.nombreRuta}") para este mismo origen y destino. Puede seleccionarla en la lista para editarla o elegir otro trayecto.`,
          });
          setSaving(false);
          return;
        }

        const created = await rutasService.createRuta(payload);
        setRutas((prev) => [created, ...prev]);

        // Mantener el formulario listo para seguir registrando más rutas sin sobreescribir la recién creada
        iniciarNuevaRuta(selectedClienteId, puntosCliente);

        setFeedbackMsg({
          tipo: 'success',
          texto: `Nueva ruta "${created.nombreRuta}" registrada exitosamente.`,
        });
      }
    } catch (err) {
      setFeedbackMsg({
        tipo: 'error',
        texto: getApiErrorMessage(err, 'Ocurrió un error al guardar la ruta.'),
      });
    } finally {
      setSaving(false);
    }
  };

  // Alternar estado activo / inactivo
  const handleToggleEstado = async (idRuta: string) => {
    try {
      const updated = await rutasService.toggleEstado(idRuta);
      setRutas((prev) =>
        prev.map((r) => (r.idRuta === idRuta ? { ...r, activo: updated.activo } : r))
      );
      if (selectedRuta && selectedRuta.idRuta === idRuta) {
        setSelectedRuta((prev) => (prev ? { ...prev, activo: updated.activo } : null));
        setFormData((prev) => ({ ...prev, activo: updated.activo }));
      }
      setFeedbackMsg({
        tipo: 'success',
        texto: `Estado de la ruta cambiado a ${updated.activo ? 'Activa' : 'Inactiva'}.`,
      });
    } catch (err) {
      setFeedbackMsg({
        tipo: 'error',
        texto: getApiErrorMessage(err, 'No se pudo cambiar el estado de la ruta.'),
      });
    }
  };

  // Eliminar ruta
  const handleEliminarRuta = async (idRuta: string, nombre: string) => {
    if (!window.confirm(`¿Está seguro de eliminar la ruta "${nombre}"?`)) return;

    try {
      await rutasService.deleteRuta(idRuta);
      setRutas((prev) => prev.filter((r) => r.idRuta !== idRuta));
      if (selectedRuta?.idRuta === idRuta) {
        const restantes = rutas.filter((r) => r.idRuta !== idRuta);
        if (restantes.length > 0) {
          cargarRutaEnFormulario(restantes[0]);
        } else {
          iniciarNuevaRuta();
        }
      }
      setFeedbackMsg({ tipo: 'success', texto: 'Ruta eliminada correctamente.' });
    } catch (err) {
      setFeedbackMsg({
        tipo: 'error',
        texto: getApiErrorMessage(err, 'No se pudo eliminar la ruta.'),
      });
    }
  };

  // Filtrado de rutas del cliente
  const rutasFiltradas = useMemo(() => {
    if (filtroEstado === 'activas') return rutas.filter((r) => r.activo);
    if (filtroEstado === 'inactivas') return rutas.filter((r) => !r.activo);
    return rutas;
  }, [rutas, filtroEstado]);

  // Avatar del cliente seleccionado
  const avatarCliente = useMemo(() => {
    return obtenerCodigoAvatar(clienteActual || {});
  }, [clienteActual]);

  // Estado para feedback de copiado de RIF
  const [copiedRif, setCopiedRif] = useState(false);
  const handleCopyRif = (rif: string) => {
    navigator.clipboard.writeText(rif);
    setCopiedRif(true);
    setTimeout(() => setCopiedRif(false), 2000);
  };

  // Formato de código visible para la ruta
  const getCodigoRuta = (ruta: Ruta | null) => {
    const anioActual = new Date().getFullYear();
    if (!ruta) return `RUT-${anioActual}-NUEVA`;
    return `RUT-${anioActual}-${ruta.idRuta.slice(-4).toUpperCase()}`;
  };

  // Cálculo de minutos equivalentes
  const minutosEstimados = useMemo(() => {
    const hrs = parseFloat(formData.tiempoEstimadoHoras);
    return isNaN(hrs) ? 0 : Math.round(hrs * 60);
  }, [formData.tiempoEstimadoHoras]);

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Encabezado Superior ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div>
          {/* Breadcrumb & Badges Superiores con componente Badge */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
              DESPACHO & RUTAS /
            </span>

          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            <span className="text-teal-900"> Gestión de Rutas</span>

          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Control de Rutas-Tarifas-Peajes-Recargos
          </p>
        </div>

        {/* Controles de Ruta en Edición y Botón UI Nueva Ruta */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-1">
              <RouteIcon className="w-3 h-3" />
              {selectedRuta ? 'RUTA EN EDICIÓN' : 'MODO REGISTRO'}
            </span>
            <select
              value={selectedRuta?.idRuta || ''}
              onChange={(e) => {
                if (!e.target.value) {
                  iniciarNuevaRuta();
                } else {
                  const r = rutas.find((item) => item.idRuta === e.target.value);
                  if (r) cargarRutaEnFormulario(r);
                }
              }}
              className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs focus:ring-2 focus:ring-orange-500 max-w-[280px] truncate"
            >
              <option value="">[+ Nueva Ruta en Creación]</option>
              {rutas.map((r) => (
                <option key={r.idRuta} value={r.idRuta}>
                  {getCodigoRuta(r)} | {r.ciudadOrigen.split(',')[0]} → {r.ciudadDestino.split(',')[0]}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant={selectedRuta ? 'primary' : 'outline'}
            size="md"
            iconLeft={<Plus className="w-4 h-4 stroke-[2.5]" />}
            onClick={() => iniciarNuevaRuta()}
            className="shadow-sm"
          >
            + + NUEVA RUTA
          </Button>
        </div>
      </div>

      {/* Alerta de feedback con estilo consistente */}
      {feedbackMsg && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold ${feedbackMsg.tipo === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.tipo === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.texto}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="p-1 hover:bg-black/5 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── Grid Principal de Dos Columnas ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── COLUMNA IZQUIERDA: Ficha Paramétrica con Card UI (7 cols) ─── */}
        <Card className="lg:col-span-7 p-6 space-y-6 border-slate-200 shadow-xs">
          {/* Subencabezado de la Ficha */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-100/70 border border-orange-200 flex items-center justify-center text-orange-600">
                <RouteIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800">
                    ID: {getCodigoRuta(selectedRuta)}
                  </span>
                  <Badge variant={selectedRuta ? 'amber' : 'emerald'} size="sm" dot={false}>
                    {selectedRuta ? 'Modo Edición' : 'Nueva Ruta'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {selectedRuta
                    ? `Editando ficha paramétrica de: ${selectedRuta.nombreRuta}`
                    : 'Ficha paramétrica para registro de nueva ruta'}
                </p>
              </div>
            </div>

            {/* Toggle Estado (activo) */}
            <div className="flex items-center gap-2 text-right">
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-bold text-slate-600">
                  Estado (activo)
                </span>
                <span
                  className={`text-[10px] font-black flex items-center gap-1 ${formData.activo ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${formData.activo ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                  />
                  {formData.activo ? 'Activo (1)' : 'Inactivo (0)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, activo: !prev.activo }))}
                className="cursor-pointer text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {formData.activo ? (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-300" />
                )}
              </button>
            </div>
          </div>

          <form onSubmit={handleGuardarRuta} className="space-y-6">
            {/* ─── SECCIÓN 1: Cliente Titular de la Carga ─── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[11px] font-black flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-sm font-extrabold text-slate-800">
                    Cliente Titular de la Carga
                  </h2>
                </div>
              </div>

              {/* Selector de Cliente Matriz */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-orange-600" />
                    <span>Seleccionar Cuenta Matriz Contratante:</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {clientes.length} cuentas registradas
                  </span>
                </div>
                <div className="relative">
                  <select
                    ref={clienteRef}
                    value={selectedClienteId}
                    onChange={(e) => setSelectedClienteId(e.target.value)}
                    onKeyDown={(e) => handleKeyDownNext(e, puntoOrigenRef)}
                    className="w-full appearance-none text-xs font-bold text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 shadow-2xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition cursor-pointer"
                  >
                    {clientes.map((c) => {
                      const sedesCount = c._count?.puntosCargaDescarga || c.puntosCargaDescarga?.length || 0;
                      const rutCount = c._count?.rutas ?? (c.rutas?.length || 0);
                      return (
                        <option key={c.idCliente} value={c.idCliente}>
                          {c.razonSocial} — RIF: {c.rif} ({sedesCount} Sedes • {rutCount} Rutas)
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Ficha Resumen Destacada del Cliente Seleccionado */}
              {clienteActual ? (
                <div className="relative overflow-hidden rounded-2xl border-2 border-orange-300/90 bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.03] to-white p-4 sm:p-5 shadow-sm ring-4 ring-orange-500/10 transition-all">
                  {/* Destello decorativo de fondo */}
                  <div className="absolute -top-12 -right-12 w-36 h-36 bg-orange-400/15 rounded-full blur-2xl pointer-events-none" />

                  {/* Barra Superior de Estado y Contexto Activo */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3.5 border-b border-orange-200/60">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                        Cliente en Operación Activa
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                        • Toda sede y ruta configurada aplicará a esta cuenta
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="orange" size="sm" dot={false} className="font-extrabold text-[10px] shadow-2xs">
                        Titular de la Carga
                      </Badge>
                    </div>
                  </div>

                  {/* Contenido Principal de la Ficha del Cliente */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Identidad e Información */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      {/* Avatar de Marca con iniciales e insignia */}
                      <div
                        className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-sm sm:text-base tracking-wider shadow-sm border-2 shrink-0 ${avatarCliente.estilo || 'bg-slate-900 text-white border-slate-700'}`}
                      >
                        {avatarCliente.codigo}
                      </div>

                      <div className="min-w-0 space-y-1.5 flex-1">
                        {/* Nombre del Cliente */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                            {clienteActual.razonSocial}
                          </h3>
                          {clienteActual.nombreComercial && clienteActual.nombreComercial !== clienteActual.razonSocial && (
                            <span className="text-[11px] font-bold text-orange-700 bg-orange-100/80 border border-orange-200/90 px-2 py-0.5 rounded-md">
                              {clienteActual.nombreComercial}
                            </span>
                          )}
                        </div>

                        {/* RIF con acción de copiado y Badge de Estado */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => handleCopyRif(clienteActual.rif)}
                            title="Copiar RIF al portapapeles"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition active:scale-95 cursor-pointer group"
                          >
                            <span className="text-amber-600 font-extrabold">RIF:</span>
                            <span>{clienteActual.rif}</span>
                            {copiedRif ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                            )}
                          </button>

                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                            <span>{clienteActual.estadoFiscal || 'Solvente (AAA)'}</span>
                          </span>
                        </div>

                        {/* Ubicación y Persona de Contacto */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium pt-0.5">
                          {clienteActual.direccionFiscal ? (
                            <span className="flex items-center gap-1 truncate max-w-xs sm:max-w-md" title={clienteActual.direccionFiscal}>
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{clienteActual.direccionFiscal}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">Sede central registrada</span>
                          )}

                          {clienteActual.personaContacto && (
                            <span className="hidden sm:flex items-center gap-1 text-slate-500">
                              <span>• Contacto:</span>
                              <span className="font-semibold text-slate-700">{clienteActual.personaContacto}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Métricas Operativas Rápidas del Cliente */}
                    <div className="flex sm:flex-row lg:flex-col items-center sm:items-end justify-between lg:justify-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-orange-200/50 shrink-0">
                      <div className="flex items-center gap-2">
                        {/* Contador de Sedes */}
                        <div className="bg-white/95 border border-orange-200/90 rounded-xl px-3.5 py-2 text-center shadow-2xs min-w-[90px]">
                          <div className="text-base font-black text-slate-900 leading-none">
                            {puntosCliente.length}
                          </div>
                          <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mt-1 flex items-center justify-center gap-1">
                            <Warehouse className="w-2.5 h-2.5 text-orange-500" />
                            <span>Sedes</span>
                          </div>
                        </div>

                        {/* Contador de Rutas */}
                        <div className="bg-white/95 border border-orange-200/90 rounded-xl px-3.5 py-2 text-center shadow-2xs min-w-[90px]">
                          <div className="text-base font-black text-orange-600 leading-none">
                            {rutas.length}
                          </div>
                          <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mt-1 flex items-center justify-center gap-1">
                            <RouteIcon className="w-2.5 h-2.5 text-orange-500" />
                            <span>Rutas</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Andenes Habilitados</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-500">
                  Ningún cliente seleccionado. Seleccione un cliente en el menú superior.
                </div>
              )}
            </div>

            {/* ─── SECCIÓN 2: Puntos de Carga y Descarga ─── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[11px] font-black flex items-center justify-center">
                  2
                </span>
                <h2 className="text-sm font-extrabold text-slate-800">
                  Puntos de Carga y Descarga
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Subcard Origen / Carga con Card UI */}
                <Card className="p-3.5 bg-white border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase tracking-wide">
                      <span className="w-2.5 h-2.5 rounded-full ring-2 ring-emerald-500 bg-emerald-500" />
                      ORIGEN / CARGA
                    </div>

                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Instalación Origen:
                    </label>
                    <select
                      ref={puntoOrigenRef}
                      value={formData.idPuntoOrigen}
                      onChange={(e) => handleSelectOrigen(e.target.value)}
                      onKeyDown={(e) => handleKeyDownNext(e, ciudadOrigenRef)}
                      className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="">-- Seleccionar Instalación Origen --</option>
                      {puntosOrigen.map((p) => (
                        <option key={p.idPunto} value={p.idPunto}>
                          {p.nombreSede} ({p.ciudad})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-slate-500">
                        Ciudad Origen
                      </label>
                    </div>
                    <input
                      ref={ciudadOrigenRef}
                      type="text"
                      value={formData.ciudadOrigen}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, ciudadOrigen: e.target.value }))
                      }
                      onKeyDown={(e) => handleKeyDownNext(e, puntoDestinoRef)}
                      placeholder="San Joaquín, Carabobo"
                      className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                </Card>

                {/* Subcard Destino / Descarga con Card UI */}
                <Card className="p-3.5 bg-white border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-orange-800 uppercase tracking-wide">
                      <span className="w-2.5 h-2.5 rounded-full ring-2 ring-orange-500 bg-orange-500" />
                      DESTINO / DESCARGA
                    </div>

                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Instalación Destino:
                    </label>
                    <select
                      ref={puntoDestinoRef}
                      value={formData.idPuntoDestino}
                      onChange={(e) => handleSelectDestino(e.target.value)}
                      onKeyDown={(e) => handleKeyDownNext(e, ciudadDestinoRef)}
                      className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    >
                      <option value="">-- Seleccionar Instalación Destino --</option>
                      {puntosDestino.map((p) => (
                        <option key={p.idPunto} value={p.idPunto}>
                          {p.nombreSede} ({p.ciudad})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-slate-500">
                        Ciudad Destino
                      </label>

                    </div>
                    <input
                      ref={ciudadDestinoRef}
                      type="text"
                      value={formData.ciudadDestino}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, ciudadDestino: e.target.value }))
                      }
                      onKeyDown={(e) => handleKeyDownNext(e, distanciaKmRef)}
                      placeholder="Caracas, Miranda"
                      className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                </Card>
              </div>
            </div>

            {/* ─── SECCIÓN 3: Parámetros Cinemáticos y Energéticos ─── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[11px] font-black flex items-center justify-center">
                    3
                  </span>
                  <h2 className="text-sm font-extrabold text-slate-800">
                    Parámetros Cinemáticos y Energéticos
                  </h2>
                </div>

                <Badge variant="amber" size="sm" dot={false} className="font-bold">
                  <Cpu className="w-3.5 h-3.5 text-amber-600 mr-1" />
                  Modelo Energético
                </Badge>
              </div>

              {/* 3 Tarjetas de Métricas Cinemáticas con Card UI */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Card 1: KM ESTIMADO */}
                <Card className="p-3 bg-white border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      KM ESTIMADO
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <input
                      ref={distanciaKmRef}
                      type="number"
                      step="0.01"
                      value={formData.distanciaKm}
                      onChange={(e) => recalcularModeloEnergetico(e.target.value)}
                      onKeyDown={(e) => handleKeyDownNext(e, tiempoEstimadoHorasRef)}
                      className="w-full text-2xl font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none"
                    />
                    <span className="text-xs font-extrabold text-slate-500">Km</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    distancia_km
                  </div>
                </Card>

                {/* Card 2: HORAS ESTIMADAS */}
                <Card className="p-3 bg-white border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      HORAS ESTIMADAS
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <input
                      ref={tiempoEstimadoHorasRef}
                      type="number"
                      step="0.1"
                      value={formData.tiempoEstimadoHoras}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tiempoEstimadoHoras: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => handleKeyDownNext(e, consumoEstimadoGasoilRef)}
                      className="w-16 text-2xl font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none"
                    />
                    <span className="text-xs font-extrabold text-slate-500">hrs</span>
                    <span className="text-[11px] font-bold text-slate-400 ml-auto">
                      ({minutosEstimados} min)
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    tiempo_estimado_horas
                  </div>
                </Card>

                {/* Card 3: COMBUSTIBLE ESTIMADO (Destacada en naranja cálido con Card UI) */}
                <Card className="p-3 bg-gradient-to-br from-orange-50/70 via-amber-50/40 to-orange-50/60 border-2 border-orange-400/90 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] font-extrabold text-orange-900 uppercase tracking-wider">
                      <Fuel className="w-3 h-3 text-orange-600" />
                      COMBUSTIBLE ESTIMADO
                    </div>

                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <input
                      ref={consumoEstimadoGasoilRef}
                      type="number"
                      step="0.000001"
                      value={formData.consumoEstimadoGasoil}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          consumoEstimadoGasoil: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => handleKeyDownNext(e, nombreRutaRef)}
                      className="w-full text-2xl font-black text-orange-950 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none"
                    />
                    <span className="text-xs font-extrabold text-orange-800">Lts</span>
                  </div>
                  <div className="text-[10px] font-mono text-orange-700/80">
                    consumo_estimado_gasoil
                  </div>
                </Card>
              </div>

              {/* Nombre Canónico de la Ruta */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold text-slate-700">
                    Nombre Canónico de la Ruta
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    nombre_ruta (VARCHAR 150)
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    ref={nombreRutaRef}
                    type="text"
                    required
                    value={formData.nombreRuta}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nombreRuta: e.target.value }))
                    }
                    onKeyDown={(e) => handleKeyDownNext(e, submitBtnRef)}
                    placeholder="Ruta Troncal ARC: Planta San Joaquín — C.D. Los Cortijos"
                    className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 shadow-2xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={generarNombreCanonico}
                    title="Autogenerar nombre canónico sugerido"
                    className="absolute right-2 p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ─── Botones de Acción al pie de la Ficha con Button UI ─── */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              {selectedRuta && (
                <Button
                  type="button"
                  variant="danger"
                  size="md"
                  iconLeft={<Trash2 className="w-4 h-4" />}
                  onClick={() =>
                    handleEliminarRuta(selectedRuta.idRuta, selectedRuta.nombreRuta)
                  }
                  className="mr-auto"
                >
                  Eliminar Ruta
                </Button>
              )}

              {selectedRuta && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  iconLeft={<Plus className="w-4 h-4" />}
                  onClick={() => iniciarNuevaRuta()}
                >
                  Registrar Nueva Ruta
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                size="md"
                iconLeft={<RotateCcw className="w-4 h-4" />}
                onClick={() => {
                  if (selectedRuta) {
                    cargarRutaEnFormulario(selectedRuta);
                  } else {
                    iniciarNuevaRuta();
                  }
                }}
              >
                Revertir
              </Button>

              <Button
                ref={submitBtnRef}
                type="submit"
                variant="primary"
                size="md"
                isLoading={saving}
                iconLeft={<Save className="w-4 h-4" />}
                className="px-6"
              >
                {selectedRuta ? 'Actualizar Ruta' : 'Guardar Nueva Ruta'}
              </Button>
            </div>
          </form>
        </Card>

        {/* ─── COLUMNA DERECHA: Rutas Registradas del Cliente (5 cols) ─── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Encabezado del Catálogo de Rutas con Card UI */}
          <Card className="p-4 border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <RouteIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-extrabold text-slate-900">
                    Rutas Registradas del Cliente
                  </h2>
                  <Badge variant="emerald" size="sm" dot={false}>
                    {rutas.length} Rutas
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Catálogo paramétrico activo asignado a {clienteActual?.razonSocial || 'Cliente'}
                </p>
              </div>
            </div>

            {/* Filtro dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500">Filtro:</span>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as any)}
                className="text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="todas">Todas las Rutas ({rutas.length})</option>
                <option value="activas">
                  Solo Activas ({rutas.filter((r) => r.activo).length})
                </option>
                <option value="inactivas">
                  Solo Inactivas ({rutas.filter((r) => !r.activo).length})
                </option>
              </select>
            </div>
          </Card>

          {/* Listado de Tarjetas de Rutas con Card UI */}
          <div className="space-y-3">
            {rutasFiltradas.length === 0 ? (
              <Card className="border-dashed border-slate-300 p-8 text-center space-y-2">
                <RouteIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">
                  No hay rutas registradas para este filtro
                </p>
                <p className="text-[11px] text-slate-400">
                  Haga clic en "+ + NUEVA RUTA" para registrar la primera ruta del cliente.
                </p>
              </Card>
            ) : (
              rutasFiltradas.map((ruta) => {
                const isSelected = selectedRuta?.idRuta === ruta.idRuta;
                const codigo = getCodigoRuta(ruta);

                return (
                  <Card
                    key={ruta.idRuta}
                    hoverable
                    onClick={() => cargarRutaEnFormulario(ruta)}
                    className={`p-4 space-y-3 cursor-pointer transition-all ${isSelected
                      ? 'bg-orange-50/15 border-2 border-orange-500 shadow-md shadow-orange-500/10'
                      : 'bg-white border-slate-200 hover:border-orange-300'
                      }`}
                  >
                    {/* Fila Superior: Código + Título + Badges + Menú */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${isSelected
                              ? 'bg-orange-100 text-orange-900'
                              : 'bg-slate-100 text-slate-700'
                              }`}
                          >
                            {codigo}
                          </span>

                          <h3 className="text-xs font-black text-slate-900 leading-tight">
                            {ruta.nombreRuta}
                          </h3>

                          {isSelected && (
                            <Badge variant="orange" size="sm" dot={false} className="uppercase font-black text-[9px] py-0">
                              EN EDICIÓN
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Badge
                          variant={ruta.activo ? 'emerald' : 'gray'}
                          size="sm"
                          dot={true}
                        >
                          {ruta.activo ? 'Activa' : 'Inactiva'}
                        </Badge>

                        {/* Menú de 3 puntos */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuRutaId(
                                openMenuRutaId === ruta.idRuta ? null : ruta.idRuta
                              )
                            }
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openMenuRutaId === ruta.idRuta && (
                            <div className="absolute right-0 top-6 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  cargarRutaEnFormulario(ruta);
                                  setOpenMenuRutaId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                              >
                                Editar Ficha
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleToggleEstado(ruta.idRuta);
                                  setOpenMenuRutaId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                              >
                                {ruta.activo ? 'Desactivar' : 'Activar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleEliminarRuta(ruta.idRuta, ruta.nombreRuta);
                                  setOpenMenuRutaId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 font-semibold border-t border-slate-100"
                              >
                                Eliminar Ruta
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Fila de Métricas: Trayecto | Distancia/Duración | Gasoil */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 text-slate-800">
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">
                          TRAYECTO
                        </div>
                        <div className="text-[11px] font-extrabold text-slate-800 truncate" title={`${ruta.ciudadOrigen} — ${ruta.ciudadDestino}`}>
                          {ruta.ciudadOrigen.split(',')[0]} → {ruta.ciudadDestino.split(',')[0]}
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">
                          DISTANCIA / DURACIÓN
                        </div>
                        <div className="text-[11px] font-extrabold text-slate-800 truncate">
                          {Number(ruta.distanciaKm).toFixed(2)} Km | {ruta.tiempoEstimadoHoras ? `${Number(ruta.tiempoEstimadoHoras).toFixed(1)} hrs` : '-'}
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">
                          GASOIL ESTIMADO
                        </div>
                        <div className="text-[11px] font-extrabold text-orange-950 truncate">
                          {Number(ruta.consumoEstimadoGasoil).toFixed(2)} Lts
                        </div>
                      </div>


                    </div>

                    {/* Botones de acción auxiliares con Button UI */}
                    <div
                      className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100/80 min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto no-scrollbar py-0.5 min-w-0">
                        <Button
                          variant="outline"
                          size="sm"
                          iconLeft={<DollarSign className="w-3 h-3 text-emerald-600 shrink-0" />}
                          onClick={() => {
                            abrirModalTarifas(ruta);
                          }}
                          className="py-1 px-2 text-[10px] whitespace-nowrap shrink-0"
                        >
                          <span>
                            Tarifa:<span className="text-emerald-700">{Number(ruta.montoTarifa || 0) > 0 ? ` ${Number(ruta.montoTarifa).toFixed(2)} ${ruta.moneda || 'USD'}` : ' Configurar Tarifa'}</span>
                          </span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          iconLeft={<Ticket className="w-3 h-3 text-amber-600 shrink-0" />}
                          onClick={() => {
                            abrirModalPeajes(ruta);
                          }}
                          className="py-1 px-2 text-[10px] whitespace-nowrap shrink-0"
                        >
                          <span>
                            Peajes: <span className="text-amber-800 font-bold">{ruta._count?.rutaPeajes ? `${ruta._count.rutaPeajes} Asignados` : '+ Asignar Peajes'}</span>
                          </span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          iconLeft={<Coins className="w-3 h-3 text-orange-600 shrink-0" />}
                          onClick={() => {
                            abrirModalRecargos(ruta);
                          }}
                          className="py-1 px-2 text-[10px] whitespace-nowrap shrink-0"
                        >
                          <span>
                            Recargos:{' '}
                            <span className="text-orange-800 font-bold">
                              {ruta._count?.rutaRecargos ? `${ruta._count.rutaRecargos} Asignados` : '+ Asignar Recargos'}
                            </span>
                          </span>
                        </Button>
                      </div>


                    </div>

                  </Card>
                );
              })
            )}
          </div>

          {/* Banner inferior de sincronización con Card UI */}
          <Card className="p-3.5 border-slate-200 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-medium text-slate-600 leading-snug">
                Sincronización de tarifas y peajes en tiempo real con sistema de despacho
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalMatrizOpen(true)}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 shrink-0 group transition"
            >
              <span>Ver Matriz Tarifaria General</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Card>
        </div>
      </div>

      {/* ─── MODAL 1: Tarifa Única de la Ruta con Modal UI ─── */}
      <Modal
        isOpen={modalTarifaOpen}
        onClose={() => setModalTarifaOpen(false)}
        title={
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-orange-700 font-bold italic text-base sm:text-xl leading-tight">
                *** Gestión de Tarifa de Ruta ***
              </span>
              {activeModalRuta?.montoTarifa != null && Number(activeModalRuta.montoTarifa) > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ${Number(activeModalRuta.montoTarifa).toFixed(2)} {activeModalRuta.moneda || 'USD'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  Sin Tarifa
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-700 mt-1 flex items-center gap-1.5 flex-wrap">
              <RouteIcon className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
              <span>{activeModalRuta?.nombreRuta || ''}</span>
              <span className="text-slate-400 font-normal text-xs">
                ({activeModalRuta?.ciudadOrigen.split(',')[0]} → {activeModalRuta?.ciudadDestino.split(',')[0]})
              </span>
              {activeModalRuta?.cliente && (
                <span className="text-slate-500 font-medium text-[11px] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  {activeModalRuta.cliente.razonSocial}
                </span>
              )}
            </span>
          </div>
        }
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalTarifaOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              ref={tarifaSubmitBtnRef}
              variant="primary"
              size="sm"
              disabled={tarifaSaving}
              onClick={handleGuardarTarifa}
            >
              {tarifaSaving ? 'Actualizando...' : 'Actualizar Tarifa'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Configure la tarifa comercial de la ruta para el cálculo automático en guías de viaje y facturación de despacho. Los cambios se actualizarán directamente en la tabla <span className="font-semibold text-slate-700">rutas</span>.
          </p>

          {/* Ficha rápida de la ruta */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Distancia</span>
              <span className="text-xs font-black text-slate-800">{Number(activeModalRuta?.distanciaKm || 0).toFixed(2)} Km</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Tiempo Est.</span>
              <span className="text-xs font-black text-slate-800">{activeModalRuta?.tiempoEstimadoHoras ? `${Number(activeModalRuta.tiempoEstimadoHoras).toFixed(1)} hrs` : '-'}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Gasoil Estimado</span>
              <span className="text-xs font-black text-orange-900">{Number(activeModalRuta?.consumoEstimadoGasoil || 0).toFixed(2)} Lts</span>
            </div>
          </div>

          {/* Formulario: Modalidad de Cobro y Moneda */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Modalidad de Cobro:
              </label>
              <div className="relative">
                <select
                  ref={tarifaTipoCobroRef}
                  value={tarifaForm.tipoCobro}
                  onChange={(e) =>
                    setTarifaForm((prev) => ({
                      ...prev,
                      tipoCobro: e.target.value as RutaTipoCobro,
                    }))
                  }
                  onKeyDown={(e) => handleKeyDownNext(e, tarifaMonedaRef)}
                  className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 appearance-none"
                >
                  <option value="Por_Viaje_Fijo">Por Viaje Fijo (Tarifa Plana)</option>
                  <option value="Por_Tonelada">Por Tonelada Transportada</option>
                  <option value="Por_Kilometro">Por Kilómetro Recorrido</option>
                  <option value="Por_Volumen_M3">Por Volumen (M³)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {tarifaForm.tipoCobro === 'Por_Viaje_Fijo' && 'Flete con monto global fijo independiente del tonelaje o kilometraje.'}
                {tarifaForm.tipoCobro === 'Por_Tonelada' && 'Tarifa unitaria por cada tonelada métrica transportada.'}
                {tarifaForm.tipoCobro === 'Por_Kilometro' && 'Monto multiplicado por los kilómetros recorridos en la ruta.'}
                {tarifaForm.tipoCobro === 'Por_Volumen_M3' && 'Tarifa unitaria según los metros cúbicos de carga.'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Moneda:
              </label>
              <div className="relative">
                <select
                  ref={tarifaMonedaRef}
                  value={tarifaForm.moneda}
                  onChange={(e) =>
                    setTarifaForm((prev) => ({ ...prev, moneda: e.target.value }))
                  }
                  onKeyDown={(e) => handleKeyDownNext(e, tarifaMontoTarifaRef)}
                  className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 appearance-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="VES">VES (Bs.)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Divisa contractual
              </span>
            </div>
          </div>

          {/* Formulario: Monto de la Tarifa */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Monto Tarifa {tarifaForm.tipoCobro === 'Por_Kilometro' ? 'por Km' : tarifaForm.tipoCobro === 'Por_Tonelada' ? 'por Tonelada' : tarifaForm.tipoCobro === 'Por_Volumen_M3' ? 'por M³' : 'Base por Viaje'}:
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-600">
                {tarifaForm.moneda}
              </span>
              <input
                ref={tarifaMontoTarifaRef}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={tarifaForm.montoTarifa}
                onChange={(e) =>
                  setTarifaForm((prev) => ({ ...prev, montoTarifa: e.target.value }))
                }
                onKeyDown={(e) => handleKeyDownNext(e, tarifaSubmitBtnRef)}
                className="w-full text-xs font-extrabold text-slate-900 border border-slate-200 rounded-r-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Ingrese el valor numérico de la tarifa a actualizar en la tabla rutas.
            </span>
          </div>

          {/* Banner de Proyección Económica */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
            <div>
              <span className="font-bold text-emerald-950 block">
                Proyección Económica Estimada:
              </span>
              <span className="text-[11px] text-emerald-800">
                {tarifaForm.tipoCobro === 'Por_Kilometro'
                  ? `${activeModalRuta?.distanciaKm || 0} Km recorrido × ${tarifaForm.montoTarifa || 0} ${tarifaForm.moneda}/Km`
                  : tarifaForm.tipoCobro === 'Por_Viaje_Fijo'
                    ? 'Tarifa plana aplicable por viaje completo'
                    : `Cobro en función de la carga (${tarifaForm.tipoCobro.replace(/_/g, ' ')})`}
              </span>
            </div>
            <div className="text-right">
              <span className="font-black text-emerald-900 text-sm block">
                {tarifaForm.tipoCobro === 'Por_Kilometro'
                  ? `$${(Number(activeModalRuta?.distanciaKm || 0) * Number(tarifaForm.montoTarifa || 0)).toFixed(2)} ${tarifaForm.moneda}`
                  : `$${Number(tarifaForm.montoTarifa || 0).toFixed(2)} ${tarifaForm.moneda}`}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">
                Consumo: {Number(activeModalRuta?.consumoEstimadoGasoil || 0).toFixed(2)} Lts Gasoil
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* ─── MODAL 2: Asignar Peajes Venvías con Modal UI ─── */}
      <Modal
        isOpen={modalPeajesOpen}
        onClose={() => setModalPeajesOpen(false)}
        title={
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-amber-800 font-bold text-base sm:text-lg flex items-center gap-1.5">
                <Ticket className="w-5 h-5 text-amber-600" />
                Estaciones de Peaje Venvías — Catálogo Nacional
              </span>
            </div>
            {activeModalRuta && (
              <span className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-700">{activeModalRuta.nombreRuta}</span>
                <span>•</span>
                <span>
                  {activeModalRuta.ciudadOrigen.split(',')[0]} → {activeModalRuta.ciudadDestino.split(',')[0]}
                </span>
                {activeModalRuta.cliente && (
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                    {activeModalRuta.cliente.razonSocial}
                  </span>
                )}
              </span>
            )}
          </div>
        }
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-slate-500 font-medium hidden sm:block">
              <span className="font-bold text-slate-800">{peajesSeleccionados.length}</span> de{' '}
              {peajesModalItems.length} peajes seleccionados ({peajesSeleccionadosActivos.length} activos)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalPeajesOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={peajesSaving}
                onClick={handleGuardarPeajes}
                iconLeft={<Save className="w-4 h-4" />}
              >
                Guardar Peajes en Ruta
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Seleccione las estaciones de peaje de la tabla <span className="font-semibold text-slate-700">peajes_vzla</span> por las que transita esta ruta. Configure el orden de paso y el costo por viaje para registrarlos en <span className="font-semibold text-slate-700">rutas_peajes</span>.
          </p>

          {/* Barra de Búsqueda y Acciones Rápidas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={peajesFiltroTexto}
                onChange={(e) => setPeajesFiltroTexto(e.target.value)}
                placeholder="Buscar peaje por nombre, estado o ubicación..."
                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {peajesFiltroTexto && (
                <button
                  type="button"
                  onClick={() => setPeajesFiltroTexto('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRenumerarPeajes}
                className="text-[11px] py-1.5 px-2.5"
                title="Renumerar orden de 1 a N según el orden actual de selección"
              >
                Renumerar (1..N)
              </Button>
            </div>
          </div>

          {/* Listado de Peajes Nacionales */}
          {peajesLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <Ticket className="w-6 h-6 text-amber-500 animate-pulse mx-auto mb-2" />
              Cargando catálogo de peajes de Venezuela y asignaciones de la ruta...
            </div>
          ) : peajesFiltradosModal.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              No se encontraron estaciones de peaje con el criterio de búsqueda "{peajesFiltroTexto}".
            </div>
          ) : (
            <div className="max-h-[46vh] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
              {peajesFiltradosModal.map((peaje) => (
                <div
                  key={peaje.idPeaje}
                  className={`p-3 rounded-xl border transition-all ${peaje.selected
                    ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
                    : 'bg-white border-slate-200/90 hover:border-slate-300'
                    }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Checkbox + Datos del Peaje */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        id={`peaje-${peaje.idPeaje}`}
                        checked={peaje.selected}
                        onChange={(e) => handleTogglePeaje(peaje.idPeaje, e.target.checked)}
                        className="w-4 h-4 mt-1 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label
                            htmlFor={`peaje-${peaje.idPeaje}`}
                            className="text-xs font-black text-slate-900 cursor-pointer hover:text-amber-800"
                          >
                            {peaje.nombrePeaje}
                          </label>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {peaje.estadoUbicacion}
                          </span>
                          {peaje.selected && (
                            <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100/90 border border-amber-200 px-1.5 py-0.2 rounded">
                              Paso #{peaje.orden}
                            </span>
                          )}
                        </div>
                        {peaje.ubicacionDetallada && (
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate" title={peaje.ubicacionDetallada}>
                            {peaje.ubicacionDetallada}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Parámetros para la tabla rutas_peajes si está seleccionado */}
                    {peaje.selected ? (
                      <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/60">
                        {/* Orden */}
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                            Orden
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={peaje.orden}
                            onChange={(e) =>
                              handleUpdatePeajeField(peaje.idPeaje, 'orden', parseInt(e.target.value) || 1)
                            }
                            className="w-14 text-center text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg py-1 px-1 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                          />
                        </div>

                        {/* Costo USD */}
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                            Costo USD
                          </span>
                          <div className="flex items-center">
                            <span className="text-xs font-bold text-slate-400 px-1">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={peaje.costo}
                              onChange={(e) => handleUpdatePeajeField(peaje.idPeaje, 'costo', e.target.value)}
                              className="w-20 text-xs font-black text-slate-900 bg-white border border-slate-300 rounded-lg py-1 px-1.5 focus:ring-1 focus:ring-amber-500 text-right shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Activo */}
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                            Activo
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdatePeajeField(peaje.idPeaje, 'activo', !peaje.activo)}
                            className="mt-1 cursor-pointer focus:outline-none"
                            title={peaje.activo ? 'Peaje activo en la ruta' : 'Peaje inactivo en la ruta'}
                          >
                            {peaje.activo ? (
                              <ToggleRight className="w-6 h-6 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-slate-300" />
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic shrink-0 hidden sm:inline">
                        No incluido en ruta
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Banner de Resumen y Liquidación */}
          <div className="p-3.5 bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-amber-950 block">
                  Resumen de Peajes en Trayecto:
                </span>
                <span className="text-[11px] text-amber-800">
                  {peajesSeleccionadosActivos.length} activos de {peajesSeleccionados.length} seleccionados para liquidación en proforma
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-black text-amber-950 text-base block">
                ${costoTotalPeajes.toFixed(2)} USD
              </span>
              <span className="text-[10px] text-amber-700 font-semibold">
                Total peajes por viaje
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* ─── MODAL 3: Recargos y Viáticos con Modal UI ─── */}
      <Modal
        isOpen={modalRecargosOpen}
        onClose={() => setModalRecargosOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block">
                Recargos y Viáticos — {activeModalRuta?.nombreRuta || 'Ruta'}
              </span>
              <span className="text-[11px] text-slate-500 font-normal block">
                Seleccione los conceptos generales que aplican a este corredor
              </span>
            </div>
          </div>
        }
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-slate-500 font-medium">
              {recargosModalItems.filter((r) => r.selected).length} de {recargosModalItems.length} seleccionados
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalRecargosOpen(false)}
                disabled={recargosSaving}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGuardarRecargos}
                disabled={recargosSaving || recargosLoading}
                iconLeft={
                  recargosSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )
                }
              >
                {recargosSaving ? 'Guardando...' : 'Asignar a Ruta'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-gradient-to-r from-orange-50 via-amber-50/60 to-orange-50/40 border border-orange-200/80 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-orange-600 shrink-0" />
              <div>
                <span className="font-bold text-orange-950 block">Catálogo de Recargos Generales:</span>
                <span className="text-[11px] text-orange-800">
                  Haz clic sobre cada concepto para seleccionarlo o deseleccionarlo
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-black text-orange-950 text-sm block">
                {recargosModalItems.filter((r) => r.selected).length}
              </span>
              <span className="text-[10px] text-orange-700 font-semibold">Activos</span>
            </div>
          </div>

          {recargosLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
              <p className="text-xs font-medium">Cargando catálogo de recargos generales...</p>
            </div>
          ) : recargosModalItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No hay conceptos registrados en la tabla de recargos generales.
            </div>
          ) : (
            <div className="space-y-2">
              {recargosModalItems.map((recargo) => {
                const isSelected = recargo.selected;
                const tipoTexto = recargo.tipoCalculo
                  ? recargo.tipoCalculo.replace(/_/g, ' ')
                  : 'Monto Fijo';

                return (
                  <div
                    key={recargo.idRecargo}
                    onClick={() => handleToggleRecargo(recargo.idRecargo)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleRecargo(recargo.idRecargo);
                      }
                    }}
                    className={`p-3.5 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-all duration-150 select-none ${isSelected
                      ? 'border-2 border-orange-500 bg-gradient-to-r from-orange-50/90 via-amber-50/60 to-orange-50/90 shadow-xs ring-2 ring-orange-400/20'
                      : 'border border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300 shadow-xs'
                      }`}
                  >
                    <div className="space-y-0.5">
                      <div className={`font-bold ${isSelected ? 'text-orange-950' : 'text-slate-800'}`}>
                        {recargo.concepto}
                      </div>
                      <div className={`text-[11px] ${isSelected ? 'text-orange-700 font-medium' : 'text-slate-400'}`}>
                        {tipoTexto}
                      </div>
                    </div>

                    <div>
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-600 text-white font-bold text-[10px] tracking-wide uppercase shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          Seleccionado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-500 font-semibold text-[10px] uppercase hover:bg-slate-200 transition-colors">
                          + Seleccionar
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* ─── MODAL 4: Matriz Tarifaria General con Table UI ─── */}
      <Modal
        isOpen={modalMatrizOpen}
        onClose={() => setModalMatrizOpen(false)}
        title="Matriz Tarifaria y Analítica de Rutas"
        size="xl"
        footer={
          <div className="flex justify-end w-full">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setModalMatrizOpen(false)}
            >
              Cerrar Matriz
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Vista consolidada de todas las rutas paramétricas activas en el sistema, balance de combustible y autonomía operativa.
          </p>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre Canónico</TableHead>
                  <TableHead>Distancia (Km)</TableHead>
                  <TableHead>Tiempo (Hrs)</TableHead>
                  <TableHead>Gasoil (Lts)</TableHead>
                  <TableHead>Tarifa Base</TableHead>
                  <TableHead>Modalidad Cobro</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rutas.map((r) => (
                  <TableRow key={r.idRuta}>
                    <TableCell className="font-mono font-bold text-slate-800">
                      {getCodigoRuta(r)}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      {r.nombreRuta}
                    </TableCell>
                    <TableCell className="font-bold text-slate-800">
                      {Number(r.distanciaKm).toFixed(2)} Km
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {r.tiempoEstimadoHoras ? `${Number(r.tiempoEstimadoHoras).toFixed(1)} hrs` : '-'}
                    </TableCell>
                    <TableCell className="font-black text-orange-900">
                      {Number(r.consumoEstimadoGasoil).toFixed(2)} Lts
                    </TableCell>
                    <TableCell className="font-black text-emerald-800">
                      {Number(r.montoTarifa || 0) > 0
                        ? `$${Number(r.montoTarifa).toFixed(2)} ${r.moneda || 'USD'}`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-slate-600 text-[11px] font-medium">
                      {r.tipoCobro ? r.tipoCobro.replace(/_/g, ' ') : 'Por Viaje Fijo'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={r.activo ? 'emerald' : 'gray'}
                        size="sm"
                        dot={true}
                      >
                        {r.activo ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Modal>
    </div>
  );
}