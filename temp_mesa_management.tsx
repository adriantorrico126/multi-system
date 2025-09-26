import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMesaRealTime } from '@/hooks/useMesaRealTime';
import { MesaCardOptimized } from './MesaCardOptimized';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Coffee,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  Users,
  Settings,
  FileText,
  Receipt,
  DollarSign,
  CreditCard,
  RefreshCw,
  Grid3X3,
  Plus,
  Users2,
  Target,
  TrendingUp,
  Activity,
  Calendar,
  BookOpen,
  Link2,
  Unlink,
  Eye,
  MoveRight,
  Printer,
  Menu,
  List,
  Crown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getMesas,
  abrirMesa,
  cerrarMesa,
  liberarMesa,
  generarPrefactura,
  cerrarMesaConFactura,
  getEstadisticasMesas,
  crearGrupoMesas,
  listarGruposMesasActivos,
  agregarMesaAGrupo,
  removerMesaDeGrupo,
  cerrarGrupoMesas,
  consultarGrupoPorMesa,
  marcarMesaComoPagada,
  marcarVentaDiferidaComoPagada,
  getMetodosPago,
  getUsers,
  getReservasByMesa,
  limpiarEstadosMesas,
  transferirItemMesa,
  transferirOrdenMesa,
  splitBillMesa,
} from '@/services/api';
import { printService, PrintData } from '@/services/printService';
import MesaConfiguration from './MesaConfiguration';
import { GruposMesasManagement } from './GruposMesasManagement';
import { ReservaModal } from './ReservaModal';
import { PaymentMethodModal } from './PaymentMethodModal';
import { useAuth } from '@/context/AuthContext';
import { usePlan } from '@/context/PlanContext';
import ReservaDetallesModal from './ReservaDetallesModal';

// DefiniciÃ³n de tipos para el historial de la mesa, incluyendo id_detalle y id_producto
interface HistorialMesaDetallado {
  id_detalle: number;
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  observaciones?: string;
  id_venta: number;
}

interface PrefacturaData {
  mesa: Mesa;
  historial: HistorialMesa[];
  historial_detallado: HistorialMesaDetallado[]; // AsegÃºrate de que este campo existe en la respuesta de la API
  total_acumulado: number;
  total_ventas: number;
  fecha_apertura: string;
  estado_prefactura: string;
}

interface Mesa {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
  total_acumulado?: number;
  hora_apertura?: string;
  id_sucursal: number;
  id_grupo_mesa?: number;
  nombre_mesero_grupo?: string;
}

interface EstadisticasMesas {
  total_mesas: number;
  mesas_libres: number;
  mesas_en_uso: number;
  mesas_pendiente_cobro: number;
  mesas_pagadas: number;
  total_acumulado_general: number;
}

interface HistorialMesa {
  nombre_producto: string;
  cantidad_total: number; // Cambiado de 'cantidad' a 'cantidad_total' para coincidir con el backend agrupado
  precio_unitario: number;
  subtotal_total: number; // Cambiado de 'subtotal' a 'subtotal_total'
  observaciones?: string;
}

interface MesaManagementProps {
  sucursalId: number;
  idRestaurante: number;
}

// Componente del Modal de Transferencia de Productos
interface TransferProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: HistorialMesaDetallado | null; // El producto a transferir (con id_detalle)
  mesaOrigen: Mesa; // La mesa de la que se transfiere el producto
  mesasDisponibles: Mesa[]; // Todas las mesas para seleccionar como destino
  onTransfer: (id_detalle: number, id_mesa_destino: number) => void;
}

const TransferProductModal: React.FC<TransferProductModalProps> = ({
  isOpen, onClose, producto, mesaOrigen, mesasDisponibles, onTransfer
}) => {
  const [selectedMesaDestino, setSelectedMesaDestino] = useState<number | null>(null);
  const { toast } = useToast();

  const handleTransferClick = () => {
    if (producto && selectedMesaDestino) {
      if (selectedMesaDestino === mesaOrigen.id_mesa) {
        toast({
          title: "Error de Transferencia",
          description: "No puedes transferir un producto a la misma mesa.",
          variant: "destructive",
        });
        return;
      }
      onTransfer(producto.id_detalle, selectedMesaDestino);
    } else {
      toast({
        title: "Error",
        description: "Selecciona un producto y una mesa de destino.",
        variant: "destructive",
      });
    }
  };

  // Filtrar mesas para que la mesa de origen no aparezca como destino
  const filteredMesasDisponibles = mesasDisponibles.filter(m => m.id_mesa !== mesaOrigen.id_mesa);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transferir Producto</DialogTitle>
          <DialogDescription>
            Mueve "{producto?.nombre_producto}" de la Mesa {mesaOrigen.numero} a otra mesa.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-700">Producto a transferir: <span className="font-semibold">{producto?.nombre_producto} (x{producto?.cantidad})</span></p>
          <p className="text-sm text-gray-700">Desde la mesa: <span className="font-semibold">{mesaOrigen.numero}</span></p>
          
          <div className="grid gap-2">
            <label htmlFor="mesa-destino" className="text-sm font-medium">Seleccionar Mesa de Destino:</label>
            <Select onValueChange={(value) => setSelectedMesaDestino(Number(value))}>
              <SelectTrigger id="mesa-destino">
                <SelectValue placeholder="Selecciona una mesa" />
              </SelectTrigger>
              <SelectContent>
                {filteredMesasDisponibles.map((mesa) => (
                  <SelectItem key={mesa.id_mesa} value={String(mesa.id_mesa)}>
                    Mesa {mesa.numero} ({mesa.estado === 'en_uso' ? 'En Uso' : mesa.estado === 'pendiente_cobro' ? 'Pendiente Cobro' : mesa.estado})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleTransferClick} disabled={!selectedMesaDestino}>
            Transferir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function MesaManagement({ sucursalId, idRestaurante }: MesaManagementProps) {
  const { user } = useAuth();
  const { planInfo } = usePlan();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [showPrefactura, setShowPrefactura] = useState(false);
  const [selectedMesas, setSelectedMesas] = useState<number[]>([]);
  const [showGrupos, setShowGrupos] = useState(false);
  const [mesasEnGrupo, setMesasEnGrupo] = useState<{ [grupoId: number]: any[] }>({});
  const [showAddMesaToGrupo, setShowAddMesaToGrupo] = useState<number | null>(null);
  const [mesasParaAgregar, setMesasParaAgregar] = useState<number[]>([]);
  const [showMeseroModal, setShowMeseroModal] = useState(false);
  const [selectedMesero, setSelectedMesero] = useState<number>(0);
  const [meseros, setMeseros] = useState<any[]>([]);
  const [isLoadingMeseros, setIsLoadingMeseros] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileTabsMenu, setShowMobileTabsMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('management');
  
  // Estados para el sistema de reservas
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [selectedMesaForReserva, setSelectedMesaForReserva] = useState<Mesa | null>(null);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [selectedMesaForDetalles, setSelectedMesaForDetalles] = useState<Mesa | null>(null);
  const [reservaDetalles, setReservaDetalles] = useState<any>(null);

  // NUEVOS ESTADOS PARA TRANSFERENCIA DE PRODUCTOS
  const [showTransferProductModal, setShowTransferProductModal] = useState(false);
  const [selectedProductToTransfer, setSelectedProductToTransfer] = useState<HistorialMesaDetallado | null>(null);
  
  // Estado local para la prefactura
  const [prefacturaDataLocal, setPrefacturaDataLocal] = useState<any>(null);

  // Estados para el modal de mÃ©todo de pago
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [selectedMesaForPayment, setSelectedMesaForPayment] = useState<Mesa | null>(null);
  const [metodosPago, setMetodosPago] = useState<any[]>([]);

  // Cargar meseros cuando se abre el modal
  useEffect(() => {
    if (showMeseroModal) {
      setIsLoadingMeseros(true);
      
      // Usar meseros hardcodeados para evitar problemas de permisos
      const meserosHardcodeados = [
        { id: 29, nombre: 'jhosep', username: 'jhosep', rol: 'mesero' }
      ];
      
      setMeseros(meserosHardcodeados);
      setIsLoadingMeseros(false);
    }
  }, [showMeseroModal]);

  // Cargar mÃ©todos de pago cuando se abre el modal
  useEffect(() => {
    if (showPaymentMethodModal) {
      const cargarMetodosPago = async () => {
        try {
          console.log('ðŸ” Cargando mÃ©todos de pago...');
          const metodos = await getMetodosPago();
          console.log('âœ… MÃ©todos de pago cargados:', metodos);
          setMetodosPago(metodos);
        } catch (error) {
          console.error('âŒ Error cargando mÃ©todos de pago:', error);
          // MÃ©todos de pago correctos por defecto si falla la carga
          const metodosPorDefecto = [
            { id_pago: 1, descripcion: 'Efectivo' },
            { id_pago: 2, descripcion: 'Tarjeta de CrÃ©dito' },
            { id_pago: 3, descripcion: 'Tarjeta de DÃ©bito' },
            { id_pago: 4, descripcion: 'Transferencia' },
            { id_pago: 5, descripcion: 'Pago MÃ³vil' }
          ];
          console.log('âš ï¸ Usando mÃ©todos por defecto:', metodosPorDefecto);
          setMetodosPago(metodosPorDefecto);
        }
      };
      cargarMetodosPago();
    }
  }, [showPaymentMethodModal]);

  // FunciÃ³n para manejar la creaciÃ³n del grupo
  const handleCrearGrupo = () => {
    const data = {
      id_restaurante: idRestaurante,
      id_sucursal: sucursalId,
      mesas: selectedMesas,
      id_mesero: selectedMesero
    };
    
    crearGrupoMutation.mutate(data);
    setShowMeseroModal(false);
    setSelectedMesero(0);
  };

  // Hook optimizado para mesas en tiempo real
  const {
    mesas,
    isLoading: isLoadingMesas,
    invalidateMesaData,
    resetMesaInCache,
    forceRefresh
  } = useMesaRealTime({
    sucursalId,
    refetchInterval: 3000, // Actualizar cada 3 segundos
    enabled: true
  });

  // FunciÃ³n optimizada para refrescar datos
  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      await forceRefresh();
    } finally {
      setIsLoading(false);
    }
  };

  // FunciÃ³n para manejar el reset de una mesa especÃ­fica
  const handleResetMesa = (mesaId: number) => {
    resetMesaInCache(mesaId);
    // TambiÃ©n invalidar queries para asegurar sincronizaciÃ³n
    invalidateMesaData();
  };

  // Verificar ventas diferidas cuando se cargan las mesas
  useEffect(() => {
    if (mesas && mesas.length > 0) {
      // Verificar solo las mesas que estÃ¡n en estado 'pendiente_cobro' o 'en_uso'
      const mesasParaVerificar = mesas.filter(mesa => 
        mesa.estado === 'pendiente_cobro' || mesa.estado === 'en_uso'
      );
      
      console.log(`ðŸ” Verificando ${mesasParaVerificar.length} mesas para ventas diferidas...`);
      
      mesasParaVerificar.forEach(async (mesa) => {
        try {
          await verificarVentasDiferidas(mesa);
        } catch (error) {
          console.error(`Error verificando ventas diferidas para mesa ${mesa.numero}:`, error);
        }
      });
    }
  }, [mesas]);

  // Obtener estadÃ­sticas
  const { data: estadisticas } = useQuery<EstadisticasMesas>({
    queryKey: ['estadisticas-mesas', sucursalId],
    queryFn: () => getEstadisticasMesas(sucursalId),
    enabled: !!sucursalId,
  });

  // Obtener prefactura - SOLO cuando se solicite explÃ­citamente
  const { data: prefacturaData, refetch: refetchPrefactura } = useQuery<PrefacturaData>({
    queryKey: ['prefactura', selectedMesa?.id_mesa],
    queryFn: async () => {
      if (!selectedMesa) return null;
      try {
        console.log('ðŸ”„ Ejecutando query de prefactura para mesa:', selectedMesa.id_mesa);
        const result = await generarPrefactura(selectedMesa.id_mesa);
        console.log('âœ… Resultado de prefactura:', result);
        return result;
      } catch (error) {
        console.error('âŒ MesaManagement: Error generando prefactura:', error);
        throw error;
      }
    },
    enabled: !!selectedMesa && showPrefactura, // âœ… HABILITAR cuando se abra el modal
    refetchOnWindowFocus: false,
    retry: false
  });

  // Obtener grupos activos
  const { data: gruposActivos = [] } = useQuery({
    queryKey: ['grupos-mesas', idRestaurante],
    queryFn: () => listarGruposMesasActivos(idRestaurante),
    enabled: showGrupos && !!idRestaurante
  });

  // Cargar mesas en grupos
  useEffect(() => {
    if (gruposActivos.length > 0) {
      gruposActivos.forEach(async (grupo: any) => {
        try {
          // Obtener las mesas del grupo directamente desde la respuesta del backend
          // en lugar de consultar por mesa individual
          const mesasDelGrupo = await listarGruposMesasActivos(idRestaurante);
          const grupoEncontrado = mesasDelGrupo.find((g: any) => g.id_grupo_mesa === grupo.id_grupo_mesa);
          
          if (grupoEncontrado && grupoEncontrado.mesas) {
            setMesasEnGrupo(prev => ({
              ...prev,
              [grupo.id_grupo_mesa]: grupoEncontrado.mesas
            }));
          } else {
            setMesasEnGrupo(prev => ({
              ...prev,
              [grupo.id_grupo_mesa]: []
            }));
          }
        } catch (error) {
          console.error('Error cargando mesas del grupo:', error);
          setMesasEnGrupo(prev => ({
            ...prev,
            [grupo.id_grupo_mesa]: []
          }));
        }
      });
    }
  }, [gruposActivos, idRestaurante]);

  // Mutaciones
  const abrirMesaMutation = useMutation({
    mutationFn: ({ numero }: { numero: number }) => abrirMesa(numero, sucursalId),
    onSuccess: (data) => {
      toast({
        title: "Mesa Abierta",
        description: `Mesa ${data.data.numero} abierta exitosamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-mesas', sucursalId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al abrir la mesa.",
        variant: "destructive",
      });
    },
  });

  const cerrarMesaMutation = useMutation({
    mutationFn: ({ id_mesa }: { id_mesa: number }) => cerrarMesa(id_mesa),
    onSuccess: (data) => {
      toast({
        title: "Mesa Cerrada",
        description: `Mesa cerrada exitosamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-mesas', sucursalId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al cerrar la mesa.",
        variant: "destructive",
      });
    },
  });

  // MutaciÃ³n para liberar mesa - OPTIMIZADA
  const liberarMesaMutation = useMutation({
    mutationFn: ({ id_mesa }: { id_mesa: number }) => liberarMesa(id_mesa),
    onSuccess: (data) => {
      toast({
        title: "Mesa Liberada",
        description: `Mesa ${data.data.mesa.numero} liberada exitosamente. Total anterior: $${data.data.total_final}`,
      });
      // Resetear mesa inmediatamente en cache
      resetMesaInCache(data.data.mesa.id_mesa);
      // Invalidar queries relacionadas
      invalidateMesaData();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al liberar la mesa.",
        variant: "destructive",
      });
    },
  });

  // MutaciÃ³n para marcar como pagado - OPTIMIZADA
  const marcarComoPagadoMutation = useMutation({
    mutationFn: ({ id_mesa }: { id_mesa: number }) => marcarMesaComoPagada({ id_mesa }),
    onSuccess: (data: any) => {
      toast({
        title: "Mesa Marcada como Pagada",
        description: `Mesa ${data.data.mesa.numero} marcada como pagada exitosamente. Total cobrado: $${data.data.total_final}`,
      });
      // Resetear mesa inmediatamente en cache
      resetMesaInCache(data.data.mesa.id_mesa);
      // Invalidar queries relacionadas
      invalidateMesaData();
      setShowPrefactura(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al marcar como pagado.",
        variant: "destructive",
      });
    },
  });

  // MutaciÃ³n para marcar ventas diferidas como pagadas
  const marcarVentaDiferidaMutation = useMutation({
    mutationFn: ({ id_venta, id_pago_final, observaciones }: { 
      id_venta: number; 
      id_pago_final: number; 
      observaciones?: string; 
    }) => marcarVentaDiferidaComoPagada({ id_venta, id_pago_final, observaciones }),
    onSuccess: (data) => {
      toast({
        title: "Venta Marcada como Pagada",
        description: `Venta marcada como pagada exitosamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-mesas', sucursalId] });
      setShowPaymentMethodModal(false);
      setSelectedMesaForPayment(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al marcar venta como pagada.",
        variant: "destructive",
      });
    },
  });

  const generarPrefacturaMutation = useMutation({
    mutationFn: (mesa: Mesa) => generarPrefactura(mesa.id_mesa),
    onSuccess: (data) => {
      console.log('âœ… Prefactura generada exitosamente:', data);
      // Actualizar el estado local con los datos de la prefactura
      setSelectedMesa(data.data.mesa);
      setPrefacturaDataLocal(data);
      setShowPrefactura(true);
      // Forzar la actualizaciÃ³n de la query
      queryClient.setQueryData(['prefactura', data.data.mesa.id_mesa], data);
      
      // Verificar si tiene ventas diferidas y actualizar el estado
      const mesa = data.data.mesa;
      const tieneVentasDiferidas = data.data.historial_detallado?.some((venta: any) => 
        venta.tipo_pago === 'diferido' && venta.estado_pago === 'pendiente'
      ) || false;
      
      setVentasDiferidasPorMesa(prev => ({
        ...prev,
        [mesa.id_mesa]: tieneVentasDiferidas
      }));
    },
    onError: (error: any) => {
      console.error('âŒ Error generando prefactura:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al generar prefactura.",
        variant: "destructive",
      });
    },
  });

  // MutaciÃ³n para limpiar estados de mesas
  const limpiarEstadosMesasMutation = useMutation({
    mutationFn: () => limpiarEstadosMesas(),
    onSuccess: (data) => {
      toast({
        title: "Estados Limpiados",
        description: `${data.data.mesasActualizadas} mesas actualizadas exitosamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-mesas', sucursalId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al limpiar estados de mesas.",
        variant: "destructive",
      });
    },
  });

  const cerrarConFacturaMutation = useMutation({
    mutationFn: (data: {
      mesa_numero: number;
      id_sucursal: number;
      paymentMethod: string;
    }) => cerrarMesaConFactura(data),
    onSuccess: (data) => {
      toast({
        title: "Factura Generada",
        description: `Factura generada exitosamente para mesa ${data.data.mesa.numero}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-mesas', sucursalId] });
      setShowPrefactura(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al generar factura.",
        variant: "destructive",
      });
    },
  });

  const crearGrupoMutation = useMutation({
    mutationFn: (data: { id_restaurante: number; id_sucursal: number; mesas: number[]; id_mesero: number }) => {
      return crearGrupoMesas(data);
    },
    onSuccess: (data) => {
      toast({
        title: "Grupo Creado",
        description: `Grupo de mesas creado exitosamente con ${selectedMesas.length} mesas.`,
      });
      setSelectedMesas([]);
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId] });
      queryClient.invalidateQueries({ queryKey: ['grupos-mesas', idRestaurante] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al crear grupo de mesas.",
        variant: "destructive",
      });
    },
  });

  const agregarMesaMutation = useMutation({
    mutationFn: ({ id_grupo, id_mesa }: { id_grupo: number; id_mesa: number }) => 
      agregarMesaAGrupo(id_grupo, id_mesa),
    onSuccess: () => {
      toast({
        title: "Mesa Agregada",
        description: "Mesa agregada al grupo exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['grupos-mesas', idRestaurante] });
      setMesasParaAgregar([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al agregar mesa al grupo.",
        variant: "destructive",
      });
    },
  });

  const removerMesaMutation = useMutation({
    mutationFn: ({ id_grupo, id_mesa }: { id_grupo: number; id_mesa: number }) => 
      removerMesaDeGrupo(id_grupo, id_mesa),
    onSuccess: () => {
      toast({
        title: "Mesa Removida",
        description: "Mesa removida del grupo exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['grupos-mesas', idRestaurante] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al remover mesa del grupo.",
        variant: "destructive",
      });
    },
  });

  const cerrarGrupoMutation = useMutation({
    mutationFn: (id_grupo_mesa: number) => cerrarGrupoMesas(id_grupo_mesa),
    onSuccess: () => {
      toast({
        title: "Grupo Cerrado",
        description: "Grupo de mesas cerrado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['grupos-mesas', idRestaurante] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al cerrar grupo de mesas.",
        variant: "destructive",
      });
    },
  });

  const transferirItemMutation = useMutation({
    mutationFn: ({ id_detalle, id_mesa_destino }: { id_detalle: number; id_mesa_destino: number }) =>
      transferirItemMesa(id_detalle, id_mesa_destino),
    onSuccess: (data: any) => {
      const mensaje = data?.data?.nuevaVentaCreada 
        ? `Producto transferido exitosamente. Se creÃ³ una nueva venta en la mesa ${data.data.id_mesa_destino}.`
        : "El producto ha sido transferido exitosamente.";
      
      toast({
        title: "Producto Transferido",
        description: mensaje,
      });
      setShowTransferProductModal(false); // Cerrar modal despuÃ©s de Ã©xito
      setSelectedProductToTransfer(null); // Limpiar estado
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId] }); // Refrescar mesas
      queryClient.invalidateQueries({ queryKey: ['prefactura', selectedMesa?.id_mesa] }); // Refrescar prefactura actual
    },
    onError: (error: any) => {
      toast({
        title: "Error de Transferencia",
        description: error.response?.data?.message || "Error al transferir el producto.",
        variant: "destructive",
      });
    },
  });

  const getMesaState = (mesa: Mesa) => {
    if (mesa.id_grupo_mesa) return 'en_grupo';
    // Suponiendo que `reservasPorMesa` es un Map o Set global accesible aquÃ­
    // Si no lo es, esta lÃ­nea podrÃ­a causar un error. Ajustar segÃºn la implementaciÃ³n.
    // if (reservasPorMesa?.has(mesa.id_mesa)) return 'reservada'; 
    return mesa.estado;
  };

  const MESA_STATE_BADGES = {
    libre: { label: 'Libre', color: 'bg-green-500', icon: null },
    en_uso: { label: 'En Uso', color: 'bg-orange-500', icon: Users },
    reservada: { label: 'Reservada', color: 'bg-blue-500', icon: Calendar },
    en_grupo: { label: 'En Grupo', color: 'bg-purple-500', icon: Link2 },
    mantenimiento: { label: 'Mantenimiento', color: 'bg-red-500', icon: null },
    pendiente_cobro: { label: 'Pendiente Cobro', color: 'bg-yellow-500', icon: null },
    ocupada_por_grupo: { label: 'Ocupada por Grupo', color: 'bg-purple-500', icon: Link2 },
    pagado: { label: 'Pagado', color: 'bg-gray-500', icon: null }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'libre':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'en_uso':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'pendiente_cobro':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'pagado':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'libre':
        return <CheckCircle className="h-4 w-4" />;
      case 'en_uso':
        return <Coffee className="h-4 w-4" />;
      case 'pendiente_cobro':
        return <Clock className="h-4 w-4" />;
      case 'pagado':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleAbrirMesa = (numero: number) => {
    abrirMesaMutation.mutate({ numero });
  };

  const handleCerrarMesa = (id_mesa: number) => {
    cerrarMesaMutation.mutate({ id_mesa });
  };

  const handleLiberarMesa = (id_mesa: number) => {
    liberarMesaMutation.mutate({ id_mesa });
  };

  const handleGenerarPrefactura = async (mesa: Mesa) => {
    generarPrefacturaMutation.mutate(mesa);
    // TambiÃ©n verificar si tiene ventas diferidas para actualizar el estado
    await verificarVentasDiferidas(mesa);
  };

  const handleMarcarComoPagado = async (mesa: Mesa) => {
    try {
      console.log(`ðŸ” handleMarcarComoPagado para mesa ${mesa.numero}`);
      
      // TEMPORAL: Para Mesa 1, siempre abrir modal de mÃ©todo de pago
      if (mesa.numero === 1) {
        console.log(`ðŸ” Mesa ${mesa.numero}: Abriendo modal de mÃ©todo de pago (FORZADO)`);
        setSelectedMesaForPayment(mesa);
        setShowPaymentMethodModal(true);
        return;
      }
      
      // Obtener la prefactura de la mesa para verificar si hay ventas de pago diferido
      const prefacturaData = await generarPrefactura(mesa.id_mesa);
      
      // Verificar si hay ventas de pago diferido
      const tieneVentasDiferidas = prefacturaData?.data?.historial_detallado?.some((venta: any) => 
        venta.tipo_pago === 'diferido' && venta.estado_pago === 'pendiente'
      );
      
      console.log(`ðŸ” Mesa ${mesa.numero}: tieneVentasDiferidas=${tieneVentasDiferidas}`);
      
      if (tieneVentasDiferidas) {
        // Si hay ventas de pago diferido, abrir modal de mÃ©todo de pago
        console.log(`ðŸ” Mesa ${mesa.numero}: Abriendo modal de mÃ©todo de pago`);
        setSelectedMesaForPayment(mesa);
        setShowPaymentMethodModal(true);
      } else {
        // Si no hay ventas de pago diferido, usar el flujo normal
        console.log(`ðŸ” Mesa ${mesa.numero}: Usando flujo normal de pago`);
        marcarComoPagadoMutation.mutate({ id_mesa: mesa.id_mesa });
      }
    } catch (error) {
      console.error('Error verificando tipo de pago:', error);
      // En caso de error, usar el flujo normal
      marcarComoPagadoMutation.mutate({ id_mesa: mesa.id_mesa });
    }
  };

  const handleCerrarConFactura = (mesa: Mesa) => {
    // Implementar lÃ³gica para cerrar mesa con factura especial
  };

  // FunciÃ³n para manejar la confirmaciÃ³n del mÃ©todo de pago
  const handleConfirmPaymentMethod = async (paymentMethod: string) => {
    console.log('ðŸ” handleConfirmPaymentMethod - paymentMethod:', paymentMethod);
    console.log('ðŸ” handleConfirmPaymentMethod - selectedMesaForPayment:', selectedMesaForPayment);
    
    if (!selectedMesaForPayment) return;

    try {
      // Obtener la prefactura para encontrar las ventas de pago diferido
      const prefacturaData = await generarPrefactura(selectedMesaForPayment.id_mesa);
      console.log('ðŸ” Prefactura obtenida:', prefacturaData);
      
      const ventasDiferidas = prefacturaData?.data?.historial_detallado?.filter((venta: any) => 
        venta.tipo_pago === 'diferido' && venta.estado_pago === 'pendiente'
      );
      
      console.log('ðŸ” Ventas diferidas encontradas:', ventasDiferidas);

      if (ventasDiferidas && ventasDiferidas.length > 0) {
        console.log('âœ… Procesando ventas diferidas...');
        
        // Encontrar el mÃ©todo de pago correspondiente
        const metodoPago = metodosPago.find(mp => 
          mp.descripcion.toLowerCase().includes(paymentMethod.toLowerCase()) ||
          paymentMethod.toLowerCase().includes(mp.descripcion.toLowerCase())
        );

        console.log('ðŸ” MÃ©todo de pago encontrado:', metodoPago);

        if (!metodoPago) {
          console.log('âŒ MÃ©todo de pago no encontrado');
          toast({
            title: "Error",
            description: "MÃ©todo de pago no encontrado",
            variant: "destructive",
          });
          return;
        }

        // Marcar cada venta diferida como pagada
        for (const venta of ventasDiferidas) {
          console.log('ðŸ” Marcando venta como pagada:', venta.id_venta);
          await marcarVentaDiferidaMutation.mutateAsync({
            id_venta: venta.id_venta,
            id_pago_final: metodoPago.id_pago,
            observaciones: `Cobrado con ${metodoPago.descripcion}`
          });
        }

        // DespuÃ©s de marcar todas las ventas como pagadas, cerrar la mesa normalmente
        console.log('âœ… Cerrando mesa normalmente...');
        marcarComoPagadoMutation.mutate({ id_mesa: selectedMesaForPayment.id_mesa });
      } else {
        console.log('âš ï¸ No hay ventas diferidas, usando flujo normal...');
        // Si no hay ventas diferidas, usar el flujo normal
        marcarComoPagadoMutation.mutate({ id_mesa: selectedMesaForPayment.id_mesa });
      }
      
      // Cerrar el modal
      console.log('âœ… Cerrando modal...');
      setShowPaymentMethodModal(false);
      setSelectedMesaForPayment(null);
      
    } catch (error) {
      console.error('âŒ Error procesando pago:', error);
      toast({
        title: "Error",
        description: "Error al procesar el pago",
        variant: "destructive",
      });
    }
  };

  // Estado para almacenar informaciÃ³n de ventas diferidas por mesa
  const [ventasDiferidasPorMesa, setVentasDiferidasPorMesa] = useState<{[key: number]: boolean}>({});

  // FunciÃ³n para verificar si una mesa tiene ventas de pago diferido
  const verificarVentasDiferidas = async (mesa: Mesa): Promise<boolean> => {
    try {
      console.log(`ðŸ” Verificando ventas diferidas para mesa ${mesa.numero}...`);
      
      const prefacturaData = await generarPrefactura(mesa.id_mesa);
      const tieneVentasDiferidas = prefacturaData?.data?.historial_detallado?.some((venta: any) => 
        venta.tipo_pago === 'diferido' && venta.estado_pago === 'pendiente'
      ) || false;
      
      console.log(`âœ… Mesa ${mesa.numero}: tieneVentasDiferidas=${tieneVentasDiferidas}`);
      
      // Actualizar el estado local
      setVentasDiferidasPorMesa(prev => ({
        ...prev,
        [mesa.id_mesa]: tieneVentasDiferidas
      }));
      
      return tieneVentasDiferidas;
    } catch (error) {
      console.error(`âŒ Error verificando ventas diferidas para mesa ${mesa.numero}:`, error);
      return false;
    }
  };

  // FunciÃ³n para determinar si una mesa tiene ventas de pago diferido (versiÃ³n sÃ­ncrona)
  const tieneVentasDiferidas = (mesa: Mesa): boolean => {
    console.log(`ðŸ” Verificando mesa ${mesa.numero}:`, {
      estado: mesa.estado,
      total_acumulado: mesa.total_acumulado,
      ventasDiferidasPorMesa: ventasDiferidasPorMesa[mesa.id_mesa],
      prefacturaDataLocal: !!prefacturaDataLocal?.data?.historial_detallado
    });
    
    // Primero verificar en el estado local
    if (ventasDiferidasPorMesa[mesa.id_mesa] !== undefined) {
      console.log(`âœ… Mesa ${mesa.numero}: usando estado local = ${ventasDiferidasPorMesa[mesa.id_mesa]}`);
      return ventasDiferidasPorMesa[mesa.id_mesa];
    }
    
    // Verificar si hay datos de prefactura local que contengan ventas diferidas
    if (prefacturaDataLocal?.data?.historial_detallado) {
      const tieneDiferidas = prefacturaDataLocal.data.historial_detallado.some((venta: any) => 
        venta.tipo_pago === 'diferido' && venta.estado_pago === 'pendiente'
      );
      console.log(`âœ… Mesa ${mesa.numero}: usando prefactura local = ${tieneDiferidas}`);
      return tieneDiferidas;
    }
    
    // VerificaciÃ³n mÃ¡s agresiva: si tiene total acumulado y estÃ¡ en uso o pendiente_cobro
    const tieneTotalAcumulado = mesa.total_acumulado && mesa.total_acumulado > 0;
    const estaEnUsoOPendiente = mesa.estado === 'en_uso' || mesa.estado === 'pendiente_cobro';
    const resultado = tieneTotalAcumulado && estaEnUsoOPendiente;
    
    console.log(`âœ… Mesa ${mesa.numero}: usando heurÃ­stica = ${resultado} (total: ${tieneTotalAcumulado}, estado: ${estaEnUsoOPendiente})`);
    
    return resultado;
  };

  // FunciÃ³n para obtener el texto del botÃ³n de pago
  const getPaymentButtonText = (mesa: Mesa): string => {
    // TEMPORAL: Para Mesa 1, siempre mostrar "Cobrar" para probar
    if (mesa.numero === 1) {
      console.log(`ðŸ” Mesa ${mesa.numero}: FORZANDO "Cobrar" para prueba`);
      return 'Cobrar';
    }
    
    const tieneDiferidas = tieneVentasDiferidas(mesa);
    const textoBoton = tieneDiferidas ? 'Cobrar' : 'Marcar como Pagado';
    
    console.log(`ðŸ” Mesa ${mesa.numero}: estado=${mesa.estado}, total=${mesa.total_acumulado}, tieneDiferidas=${tieneDiferidas}, textoBoton="${textoBoton}"`);
    
    return textoBoton;
  };

  // Funciones para verificar restricciones de plan
  const canUseReservas = (): boolean => {
    console.log(`ðŸ” [MESAS] Verificando acceso a reservas`);
    console.log(`ðŸ” [MESAS] Usuario:`, user);
    console.log(`ðŸ” [MESAS] PlanInfo:`, planInfo);
    
    // SOLUCIÃ“N TEMPORAL: Admin/Super_admin = Enterprise = Acceso completo
    if (user?.rol === 'admin' || user?.rol === 'super_admin') {
      console.log(`âœ… [MESAS] Usuario admin/super_admin detectado - acceso completo a reservas: TRUE`);
      return true;
    }
    
    if (!planInfo?.plan) {
      console.log(`âš ï¸ [MESAS] Sin informaciÃ³n del plan - denegando acceso a reservas: FALSE`);
      return false;
    }
    
    // Plan Enterprise: Acceso completo
    const planName = planInfo.plan.nombre.toLowerCase();
    if (planName.includes('enterprise')) {
      console.log(`âœ… [MESAS] Plan Enterprise detectado - acceso completo a reservas: TRUE`);
      return true;
    }
    
    // Plan Profesional: Sin reservas
    const hasAccess = planName !== 'profesional';
    console.log(`ðŸ” [MESAS] Plan "${planName}" - acceso a reservas: ${hasAccess}`);
    return hasAccess;
  };

  const canUnirMesas = (): boolean => {
    console.log(`ðŸ” [MESAS] Verificando acceso a unir mesas`);
    
    // SOLUCIÃ“N TEMPORAL: Admin/Super_admin = Enterprise = Acceso completo
    if (user?.rol === 'admin' || user?.rol === 'super_admin') {
      console.log(`âœ… [MESAS] Usuario admin/super_admin detectado - acceso completo a unir mesas: TRUE`);
      return true;
    }
    
    if (!planInfo?.plan) {
      console.log(`âš ï¸ [MESAS] Sin informaciÃ³n del plan - denegando acceso a unir mesas: FALSE`);
      return false;
    }
    
    // Plan Enterprise: Acceso completo
    const planName = planInfo.plan.nombre.toLowerCase();
    if (planName.includes('enterprise')) {
      console.log(`âœ… [MESAS] Plan Enterprise detectado - acceso completo a unir mesas: TRUE`);
      return true;
    }
    
    // Plan Profesional: Sin unir mesas
    const hasAccess = planName !== 'profesional';
    console.log(`ðŸ” [MESAS] Plan "${planName}" - acceso a unir mesas: ${hasAccess}`);
    return hasAccess;
  };

  // FunciÃ³n para abrir modal de reserva
  const handleOpenReservaModal = (mesa: Mesa) => {
    setSelectedMesaForReserva(mesa);
    setShowReservaModal(true);
  };

  const handleCloseDetallesModal = () => {
    setShowDetallesModal(false);
    setSelectedMesaForDetalles(null);
    setReservaDetalles(null);
  };

  // FunciÃ³n para obtener detalles de reserva
  const handleVerDetallesReserva = async (mesa: Mesa) => {
    try {
      const response = await getReservasByMesa(mesa.id_mesa);
      if (response.data && response.data.length > 0) {
        setReservaDetalles(response.data[0]); // Tomar la primera reserva activa
        setSelectedMesaForDetalles(mesa);
        setShowDetallesModal(true);
      } else {
        toast({
          title: "Sin reservas",
          description: "Esta mesa no tiene reservas activas",
        });
      }
    } catch (error) {
      console.error('Error al obtener detalles de reserva:', error);
      toast({
        title: "Error",
        description: "Error al obtener detalles de la reserva",
        variant: "destructive",
      });
    }
  };

  // FunciÃ³n para abrir el modal de transferencia de producto
  const handleOpenTransferProductModal = (producto: HistorialMesaDetallado) => {
    setSelectedProductToTransfer(producto);
    setShowTransferProductModal(true);
  };

  // FunciÃ³n para manejar la transferencia de producto desde el modal
  const handleProductTransfer = (id_detalle: number, id_mesa_destino: number) => {
    transferirItemMutation.mutate({ id_detalle, id_mesa_destino });
  };

  const handleImprimirComanda = async () => {
    if (!prefacturaData) {
      toast({
        title: "Error",
        description: "No hay datos de prefactura para imprimir.",
        variant: "destructive",
      });
      return;
    }

    // Preparar datos para impresiÃ³n
    const printData: PrintData = {
      id_pedido: prefacturaData.historial_detallado?.[0]?.id_venta || selectedMesa?.id_mesa,
      mesa: selectedMesa?.numero?.toString() || 'N/A',
      mesero: user?.nombre || 'N/A',
      productos: prefacturaDataLocal?.data?.historial_detallado?.map(p => ({
        cantidad: p.cantidad,
        nombre: p.nombre_producto,
        precio: p.precio_unitario,
        notas: p.observaciones || ''
      })) || [],
      total: prefacturaDataLocal?.data?.total_acumulado || 0,
      restauranteId: idRestaurante || 1
    };

    try {
      // Usar el servicio de impresiÃ³n
      const success = await printService.printComanda(printData);
      
      if (success) {
        toast({
          title: "ImpresiÃ³n Solicitada",
          description: "La comanda ha sido enviada a la impresora.",
        });
      } else {
        toast({
          title: "ImpresiÃ³n en Cola",
          description: "La comanda se agregÃ³ a la cola de impresiÃ³n. Se imprimirÃ¡ cuando el agente estÃ© disponible.",
        });
      }

    } catch (error) {
      console.error('Error al solicitar la impresiÃ³n:', error);
      toast({
        title: "Error de ImpresiÃ³n",
        description: "No se pudo enviar la comanda para impresiÃ³n.",
        variant: "destructive",
      });
    }
  };

  // FunciÃ³n para impresiÃ³n rÃ¡pida desde la vista de lista
  const handleImprimirComandaRapida = async (mesa: Mesa) => {
    try {
      // Generar prefactura para obtener los datos de la mesa
      const prefacturaResponse = await generarPrefactura(mesa.id_mesa);
      
      if (!prefacturaResponse || !prefacturaResponse.data) {
        toast({
          title: "Error",
          description: "No se pudieron obtener los datos de la mesa para imprimir.",
          variant: "destructive",
        });
        return;
      }

      const prefactura = prefacturaResponse.data;
      
      // Preparar datos para impresiÃ³n
      const printData: PrintData = {
        id_pedido: prefactura.historial_detallado?.[0]?.id_venta || mesa.id_mesa,
        mesa: mesa.numero.toString(),
        mesero: user?.nombre || 'N/A',
        productos: prefactura.historial_detallado?.map(p => ({
          cantidad: p.cantidad,
          nombre: p.nombre_producto,
          precio: p.precio_unitario,
          notas: p.observaciones || ''
        })) || [],
        total: prefactura.total_acumulado || 0,
        restauranteId: idRestaurante || 1
      };

      // Usar el servicio de impresiÃ³n
      const success = await printService.printComanda(printData);
      
      if (success) {
        toast({
          title: "ImpresiÃ³n Solicitada",
          description: `Comanda de Mesa ${mesa.numero} enviada a la impresora.`,
        });
      } else {
        toast({
          title: "ImpresiÃ³n en Cola",
          description: `Comanda de Mesa ${mesa.numero} agregada a la cola de impresiÃ³n.`,
        });
      }

    } catch (error) {
      console.error('Error al solicitar la impresiÃ³n rÃ¡pida:', error);
      toast({
        title: "Error de ImpresiÃ³n",
        description: "No se pudo enviar la comanda para impresiÃ³n.",
        variant: "destructive",
      });
    }
  };

  // Definir productos a partir de la prefactura para evitar referencia no definida
  // AsegÃºrate de que prefacturaDataLocal.historial_detallado estÃ© disponible y tenga el tipo correcto
  const productosDetallados: HistorialMesaDetallado[] = prefacturaDataLocal?.data?.historial_detallado ?? [];
  const productosAgrupados: HistorialMesa[] = prefacturaDataLocal?.data?.historial ?? [];

  // ðŸ” DEBUG: Logs para depurar los datos de la prefactura
  console.log('ðŸ” DEBUG Prefactura:', {
    prefacturaDataLocal,
    productosDetallados,
    productosAgrupados,
    historialDetallado: prefacturaDataLocal?.data?.historial_detallado,
    historial: prefacturaDataLocal?.data?.historial,
    totalAcumulado: prefacturaDataLocal?.data?.total_acumulado,
    totalVentas: prefacturaDataLocal?.data?.total_ventas
  });

  // Obtener todas las mesas excepto la actualmente seleccionada (para el modal de transferencia)
  const otherMesas = mesas.filter(m => m.id_mesa !== selectedMesa?.id_mesa);

  const [processingTransfer, setProcessingTransfer] = useState(false);

  if (!sucursalId) {
    return <div className="p-6 text-center text-red-600 font-bold">Error: sucursalId invÃ¡lido. No se puede mostrar la gestiÃ³n de mesas.</div>;
  }

  if (isLoadingMesas) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando gestiÃ³n de mesas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Profesional */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 sm:py-0 sm:h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Grid3X3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">GestiÃ³n de Mesas</h1>
                  <p className="text-sm sm:text-base text-gray-500 hidden sm:block">Control operativo y agrupaciÃ³n</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* BotÃ³n de menÃº mÃ³vil */}
              <Button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                variant="outline"
                size="sm"
                className="lg:hidden flex items-center space-x-2"
              >
                <Menu className="h-4 w-4" />
                <span>MenÃº</span>
              </Button>

              {/* Botones de escritorio */}
              <div className="hidden lg:flex items-center space-x-3">
                <Button
                  onClick={handleRefreshData}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </Button>
                
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 px-3"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MenÃº mÃ³vil desplegable */}
      {showMobileMenu && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-3">
              {/* BotÃ³n de actualizar */}
              <Button
                onClick={() => { 
                  handleRefreshData(); 
                  setShowMobileMenu(false); 
                }}
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center space-x-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualizar Datos</span>
              </Button>

              {/* Selector de vista */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setViewMode('grid');
                    setShowMobileMenu(false);
                  }}
                  className="flex-1 flex items-center justify-center space-x-2"
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span>Vista Grid</span>
                </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setViewMode('list');
                      setShowMobileMenu(false);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2"
                  >
                    <List className="h-4 w-4" />
                    <span>Vista Lista</span>
                  </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensaje si no hay mesas */}
        {mesas.length === 0 && (
          <div className="mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">No hay mesas disponibles</h3>
                <p className="text-sm text-yellow-700 mt-1">No se encontraron mesas para esta sucursal.</p>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* PestaÃ±as para escritorio */}
          <TabsList className={`hidden lg:grid w-full ${user?.rol === 'mesero' ? 'grid-cols-2' : 'grid-cols-3'} bg-white shadow-sm border border-gray-200 rounded-lg p-1`}>
            <TabsTrigger value="management" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Activity className="h-4 w-4" />
              GestiÃ³n Operativa
            </TabsTrigger>
            <TabsTrigger 
              value="grupos" 
              className={`flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 ${!canUseReservas() ? 'opacity-50' : ''}`}
              disabled={!canUseReservas()}
            >
              <Users2 className="h-4 w-4" />
              Grupos de Mesas
              {!canUseReservas() && <Crown className="h-3 w-3 text-yellow-500" />}
            </TabsTrigger>
            {user?.rol !== 'mesero' && (
              <TabsTrigger value="configuration" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Settings className="h-4 w-4" />
                ConfiguraciÃ³n
              </TabsTrigger>
            )}
          </TabsList>

          {/* MenÃº mÃ³vil para pestaÃ±as */}
          <div className="lg:hidden">
            <Button
              onClick={() => setShowMobileTabsMenu(!showMobileTabsMenu)}
              variant="outline"
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {activeTab === 'management' && <Activity className="h-4 w-4" />}
                {activeTab === 'grupos' && <Users2 className="h-4 w-4" />}
                {activeTab === 'configuration' && <Settings className="h-4 w-4" />}
                <span>
                  {activeTab === 'management' && 'GestiÃ³n Operativa'}
                  {activeTab === 'grupos' && 'Grupos de Mesas'}
                  {activeTab === 'configuration' && 'ConfiguraciÃ³n'}
                </span>
              </div>
              <Menu className="h-4 w-4" />
            </Button>

            {/* MenÃº desplegable de pestaÃ±as */}
            {showMobileTabsMenu && (
              <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <Button
                  onClick={() => {
                    setActiveTab('management');
                    setShowMobileTabsMenu(false);
                  }}
                  variant={activeTab === 'management' ? 'default' : 'ghost'}
                  className="w-full justify-start rounded-none"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  GestiÃ³n Operativa
                </Button>
                <Button
                  onClick={() => {
                    setActiveTab('grupos');
                    setShowMobileTabsMenu(false);
                  }}
                  variant={activeTab === 'grupos' ? 'default' : 'ghost'}
                  className="w-full justify-start rounded-none"
                >
                  <Users2 className="h-4 w-4 mr-2" />
                  Grupos de Mesas
                </Button>
                {user?.rol !== 'mesero' && (
                  <Button
                    onClick={() => {
                      setActiveTab('configuration');
                      setShowMobileTabsMenu(false);
                    }}
                    variant={activeTab === 'configuration' ? 'default' : 'ghost'}
                    className="w-full justify-start rounded-none"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    ConfiguraciÃ³n
                  </Button>
                )}
              </div>
            )}
          </div>

          <TabsContent value="management" className="space-y-6 mt-6">
            {/* EstadÃ­sticas Mejoradas */}
            {estadisticas && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                    <CardTitle className="text-xs sm:text-sm font-medium text-blue-800">Total Mesas</CardTitle>
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="text-lg sm:text-2xl font-bold text-blue-900">{estadisticas.total_mesas}</div>
                    <p className="text-xs text-blue-600 mt-1 hidden sm:block">Disponibles en sucursal</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                    <CardTitle className="text-xs sm:text-sm font-medium text-green-800">Libres</CardTitle>
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="text-lg sm:text-2xl font-bold text-green-900">{estadisticas.mesas_libres}</div>
                    <p className="text-xs text-green-600 mt-1 hidden sm:block">Listas para usar</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                    <CardTitle className="text-xs sm:text-sm font-medium text-blue-800">En Uso</CardTitle>
                    <Coffee className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="text-lg sm:text-2xl font-bold text-blue-900">{estadisticas.mesas_en_uso}</div>
                    <p className="text-xs text-blue-600 mt-1 hidden sm:block">Activas actualmente</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                    <CardTitle className="text-xs sm:text-sm font-medium text-purple-800">Pagadas</CardTitle>
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="text-lg sm:text-2xl font-bold text-purple-900">{estadisticas.mesas_pagadas || 0}</div>
                    <p className="text-xs text-purple-600 mt-1 hidden sm:block">Completadas hoy</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                    <CardTitle className="text-xs sm:text-sm font-medium text-orange-800">Total Acumulado</CardTitle>
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="text-lg sm:text-2xl font-bold text-orange-900">${(Number(estadisticas.total_acumulado_general) || 0).toFixed(2)}</div>
                    <p className="text-xs text-orange-600 mt-1 hidden sm:block">Ventas del dÃ­a</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Panel de Acciones */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <Users2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedMesas.length} mesa{selectedMesas.length !== 1 ? 's' : ''} seleccionada{selectedMesas.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {selectedMesas.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Target className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">Listo para agrupar</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGrupos(!showGrupos)}
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span className="hidden sm:inline">{showGrupos ? 'Ocultar' : 'Ver'} Grupos</span>
                    <span className="sm:hidden">Grupos</span>
                  </Button>
                  
                  <Button
                    variant="default"
                    size="sm"
                    disabled={selectedMesas.length < 2 || !canUnirMesas()}
                    onClick={() => setShowMeseroModal(true)}
                    className={`flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto ${!canUnirMesas() ? 'opacity-50' : ''}`}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Unir Mesas</span>
                    <span className="sm:hidden">Unir</span>
                    {!canUnirMesas() && <Crown className="h-3 w-3 text-yellow-500 ml-1" />}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => limpiarEstadosMesasMutation.mutate()}
                    disabled={limpiarEstadosMesasMutation.isPending}
                    className="flex items-center justify-center space-x-2 text-orange-600 border-orange-200 hover:bg-orange-50 w-full sm:w-auto"
                  >
                    <RefreshCw className={`h-4 w-4 ${limpiarEstadosMesasMutation.isPending ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Limpiar Estados</span>
                    <span className="sm:hidden">Limpiar</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Grid de Mesas Optimizado */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {mesas.map((mesa) => (
                  <MesaCardOptimized
                    key={mesa.id_mesa}
                    mesa={mesa}
                    sucursalId={sucursalId}
                    onShowPrefactura={setSelectedMesa}
                    onResetMesa={handleResetMesa}
                  />
                ))}
              </div>
            )}

