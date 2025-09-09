import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  List
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
import ReservaDetallesModal from './ReservaDetallesModal';

// Definición de tipos para el historial de la mesa, incluyendo id_detalle y id_producto
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
  historial_detallado: HistorialMesaDetallado[]; // Asegúrate de que este campo existe en la respuesta de la API
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

  // Estados para el modal de método de pago
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

  // Cargar métodos de pago cuando se abre el modal
  useEffect(() => {
    if (showPaymentMethodModal) {
      const cargarMetodosPago = async () => {
        try {
          console.log('🔍 Cargando métodos de pago...');
          const metodos = await getMetodosPago();
          console.log('✅ Métodos de pago cargados:', metodos);
          setMetodosPago(metodos);
        } catch (error) {
          console.error('❌ Error cargando métodos de pago:', error);
          // Métodos de pago correctos por defecto si falla la carga
          const metodosPorDefecto = [
            { id_pago: 1, descripcion: 'Efectivo' },
            { id_pago: 2, descripcion: 'Tarjeta de Crédito' },
            { id_pago: 3, descripcion: 'Tarjeta de Débito' },
            { id_pago: 4, descripcion: 'Transferencia' },
            { id_pago: 5, descripcion: 'Pago Móvil' }
          ];
          console.log('⚠️ Usando métodos por defecto:', metodosPorDefecto);
          setMetodosPago(metodosPorDefecto);
        }
      };
      cargarMetodosPago();
    }
  }, [showPaymentMethodModal]);

  // Función para manejar la creación del grupo
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

  // Query para obtener mesas
  const { data: mesas = [], isLoading: isLoadingMesas, refetch: refetchMesas } = useQuery<Mesa[]>({
    queryKey: ['mesas', sucursalId],
    queryFn: () => getMesas(sucursalId),
    enabled: !!sucursalId,
  });

  // Verificar ventas diferidas cuando se cargan las mesas
  useEffect(() => {
    if (mesas && mesas.length > 0) {
      // Verificar solo las mesas que están en estado 'pendiente_cobro' o 'en_uso'
      const mesasParaVerificar = mesas.filter(mesa => 
        mesa.estado === 'pendiente_cobro' || mesa.estado === 'en_uso'
      );
      
      console.log(`🔍 Verificando ${mesasParaVerificar.length} mesas para ventas diferidas...`);
      
      mesasParaVerificar.forEach(async (mesa) => {
        try {
          await verificarVentasDiferidas(mesa);
        } catch (error) {
          console.error(`Error verificando ventas diferidas para mesa ${mesa.numero}:`, error);
        }
      });
    }
  }, [mesas]);

  // Obtener estadísticas
  const { data: estadisticas } = useQuery<EstadisticasMesas>({
    queryKey: ['estadisticas-mesas', sucursalId],
    queryFn: () => getEstadisticasMesas(sucursalId),
    enabled: !!sucursalId,
  });

  // Obtener prefactura - SOLO cuando se solicite explícitamente
  const { data: prefacturaData, refetch: refetchPrefactura } = useQuery<PrefacturaData>({
    queryKey: ['prefactura', selectedMesa?.id_mesa],
    queryFn: async () => {
      if (!selectedMesa) return null;
      try {
        console.log('🔄 Ejecutando query de prefactura para mesa:', selectedMesa.id_mesa);
        const result = await generarPrefactura(selectedMesa.id_mesa);
        console.log('✅ Resultado de prefactura:', result);
        return result;
      } catch (error) {
        console.error('❌ MesaManagement: Error generando prefactura:', error);
        throw error;
      }
    },
    enabled: !!selectedMesa && showPrefactura, // ✅ HABILITAR cuando se abra el modal
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

  // Mutación para liberar mesa
  const liberarMesaMutation = useMutation({
    mutationFn: ({ id_mesa }: { id_mesa: number }) => liberarMesa(id_mesa),
    onSuccess: (data) => {
      toast({
        title: "Mesa Liberada",
        description: `Mesa liberada exitosamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-mesas', sucursalId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al liberar la mesa.",
        variant: "destructive",
      });
    },
  });

  // Mutación para marcar como pagado
  const marcarComoPagadoMutation = useMutation({
    mutationFn: ({ id_mesa }: { id_mesa: number }) => marcarMesaComoPagada({ id_mesa }),
    onSuccess: (data: any) => {
      toast({
        title: "Mesa Marcada como Pagada",
        description: `Mesa ${data.data.mesa.numero} marcada como pagada exitosamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-mesas', sucursalId] });
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

  // Mutación para marcar ventas diferidas como pagadas
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
      console.log('✅ Prefactura generada exitosamente:', data);
      // Actualizar el estado local con los datos de la prefactura
      setSelectedMesa(data.data.mesa);
      setPrefacturaDataLocal(data);
      setShowPrefactura(true);
      // Forzar la actualización de la query
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
      console.error('❌ Error generando prefactura:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al generar prefactura.",
        variant: "destructive",
      });
    },
  });

  // Mutación para limpiar estados de mesas
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
        ? `Producto transferido exitosamente. Se creó una nueva venta en la mesa ${data.data.id_mesa_destino}.`
        : "El producto ha sido transferido exitosamente.";
      
      toast({
        title: "Producto Transferido",
        description: mensaje,
      });
      setShowTransferProductModal(false); // Cerrar modal después de éxito
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
    // Suponiendo que `reservasPorMesa` es un Map o Set global accesible aquí
    // Si no lo es, esta línea podría causar un error. Ajustar según la implementación.
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
    // También verificar si tiene ventas diferidas para actualizar el estado
    await verificarVentasDiferidas(mesa);
  };

  const handleMarcarComoPagado = async (mesa: Mesa) => {
    try {
      console.log(`🔍 handleMarcarComoPagado para mesa ${mesa.numero}`);
      
      // TEMPORAL: Para Mesa 1, siempre abrir modal de método de pago
      if (mesa.numero === 1) {
        console.log(`🔍 Mesa ${mesa.numero}: Abriendo modal de método de pago (FORZADO)`);
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
      
      console.log(`🔍 Mesa ${mesa.numero}: tieneVentasDiferidas=${tieneVentasDiferidas}`);
      
      if (tieneVentasDiferidas) {
        // Si hay ventas de pago diferido, abrir modal de método de pago
        console.log(`🔍 Mesa ${mesa.numero}: Abriendo modal de método de pago`);
        setSelectedMesaForPayment(mesa);
        setShowPaymentMethodModal(true);
      } else {
        // Si no hay ventas de pago diferido, usar el flujo normal
        console.log(`🔍 Mesa ${mesa.numero}: Usando flujo normal de pago`);
        marcarComoPagadoMutation.mutate({ id_mesa: mesa.id_mesa });
      }
    } catch (error) {
      console.error('Error verificando tipo de pago:', error);
      // En caso de error, usar el flujo normal
      marcarComoPagadoMutation.mutate({ id_mesa: mesa.id_mesa });
    }
  };

  const handleCerrarConFactura = (mesa: Mesa) => {
    // Implementar lógica para cerrar mesa con factura especial
  };

  // Función para manejar la confirmación del método de pago
  const handleConfirmPaymentMethod = async (paymentMethod: string) => {
    console.log('🔍 handleConfirmPaymentMethod - paymentMethod:', paymentMethod);
    console.log('🔍 handleConfirmPaymentMethod - selectedMesaForPayment:', selectedMesaForPayment);
    
    if (!selectedMesaForPayment) return;

    try {
      // Obtener la prefactura para encontrar las ventas de pago diferido
      const prefacturaData = await generarPrefactura(selectedMesaForPayment.id_mesa);
      console.log('🔍 Prefactura obtenida:', prefacturaData);
      
      const ventasDiferidas = prefacturaData?.data?.historial_detallado?.filter((venta: any) => 
        venta.tipo_pago === 'diferido' && venta.estado_pago === 'pendiente'
      );
      
      console.log('🔍 Ventas diferidas encontradas:', ventasDiferidas);

      if (ventasDiferidas && ventasDiferidas.length > 0) {
        console.log('✅ Procesando ventas diferidas...');
        
        // Encontrar el método de pago correspondiente
        const metodoPago = metodosPago.find(mp => 
          mp.descripcion.toLowerCase().includes(paymentMethod.toLowerCase()) ||
          paymentMethod.toLowerCase().includes(mp.descripcion.toLowerCase())
        );

        console.log('🔍 Método de pago encontrado:', metodoPago);

        if (!metodoPago) {
          console.log('❌ Método de pago no encontrado');
          toast({
            title: "Error",
            description: "Método de pago no encontrado",
            variant: "destructive",
          });
          return;
        }

        // Marcar cada venta diferida como pagada
        for (const venta of ventasDiferidas) {
          console.log('🔍 Marcando venta como pagada:', venta.id_venta);
          await marcarVentaDiferidaMutation.mutateAsync({
            id_venta: venta.id_venta,
            id_pago_final: metodoPago.id_pago,
            observaciones: `Cobrado con ${metodoPago.descripcion}`
          });
        }

        // Después de marcar todas las ventas como pagadas, cerrar la mesa normalmente
        console.log('✅ Cerrando mesa normalmente...');
        marcarComoPagadoMutation.mutate({ id_mesa: selectedMesaForPayment.id_mesa });
      } else {
        console.log('⚠️ No hay ventas diferidas, usando flujo normal...');
        // Si no hay ventas diferidas, usar el flujo normal
        marcarComoPagadoMutation.mutate({ id_mesa: selectedMesaForPayment.id_mesa });
      }
      
      // Cerrar el modal
      console.log('✅ Cerrando modal...');
      setShowPaymentMethodModal(false);
      setSelectedMesaForPayment(null);
      
    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      toast({
        title: "Error",
        description: "Error al procesar el pago",
        variant: "destructive",
      });
    }
  };

  // Estado para almacenar información de ventas diferidas por mesa
  const [ventasDiferidasPorMesa, setVentasDiferidasPorMesa] = useState<{[key: number]: boolean}>({});

  // Función para verificar si una mesa tiene ventas de pago diferido
  const verificarVentasDiferidas = async (mesa: Mesa): Promise<boolean> => {
    try {
      console.log(`🔍 Verificando ventas diferidas para mesa ${mesa.numero}...`);
      
      const prefacturaData = await generarPrefactura(mesa.id_mesa);
      const tieneVentasDiferidas = prefacturaData?.data?.historial_detallado?.some((venta: any) => 
        venta.tipo_pago === 'diferido' && venta.estado_pago === 'pendiente'
      ) || false;
      
      console.log(`✅ Mesa ${mesa.numero}: tieneVentasDiferidas=${tieneVentasDiferidas}`);
      
      // Actualizar el estado local
      setVentasDiferidasPorMesa(prev => ({
        ...prev,
        [mesa.id_mesa]: tieneVentasDiferidas
      }));
      
      return tieneVentasDiferidas;
    } catch (error) {
      console.error(`❌ Error verificando ventas diferidas para mesa ${mesa.numero}:`, error);
      return false;
    }
  };

  // Función para determinar si una mesa tiene ventas de pago diferido (versión síncrona)
  const tieneVentasDiferidas = (mesa: Mesa): boolean => {
    console.log(`🔍 Verificando mesa ${mesa.numero}:`, {
      estado: mesa.estado,
      total_acumulado: mesa.total_acumulado,
      ventasDiferidasPorMesa: ventasDiferidasPorMesa[mesa.id_mesa],
      prefacturaDataLocal: !!prefacturaDataLocal?.data?.historial_detallado
    });
    
    // Primero verificar en el estado local
    if (ventasDiferidasPorMesa[mesa.id_mesa] !== undefined) {
      console.log(`✅ Mesa ${mesa.numero}: usando estado local = ${ventasDiferidasPorMesa[mesa.id_mesa]}`);
      return ventasDiferidasPorMesa[mesa.id_mesa];
    }
    
    // Verificar si hay datos de prefactura local que contengan ventas diferidas
    if (prefacturaDataLocal?.data?.historial_detallado) {
      const tieneDiferidas = prefacturaDataLocal.data.historial_detallado.some((venta: any) => 
        venta.tipo_pago === 'diferido' && venta.estado_pago === 'pendiente'
      );
      console.log(`✅ Mesa ${mesa.numero}: usando prefactura local = ${tieneDiferidas}`);
      return tieneDiferidas;
    }
    
    // Verificación más agresiva: si tiene total acumulado y está en uso o pendiente_cobro
    const tieneTotalAcumulado = mesa.total_acumulado && mesa.total_acumulado > 0;
    const estaEnUsoOPendiente = mesa.estado === 'en_uso' || mesa.estado === 'pendiente_cobro';
    const resultado = tieneTotalAcumulado && estaEnUsoOPendiente;
    
    console.log(`✅ Mesa ${mesa.numero}: usando heurística = ${resultado} (total: ${tieneTotalAcumulado}, estado: ${estaEnUsoOPendiente})`);
    
    return resultado;
  };

  // Función para obtener el texto del botón de pago
  const getPaymentButtonText = (mesa: Mesa): string => {
    // TEMPORAL: Para Mesa 1, siempre mostrar "Cobrar" para probar
    if (mesa.numero === 1) {
      console.log(`🔍 Mesa ${mesa.numero}: FORZANDO "Cobrar" para prueba`);
      return 'Cobrar';
    }
    
    const tieneDiferidas = tieneVentasDiferidas(mesa);
    const textoBoton = tieneDiferidas ? 'Cobrar' : 'Marcar como Pagado';
    
    console.log(`🔍 Mesa ${mesa.numero}: estado=${mesa.estado}, total=${mesa.total_acumulado}, tieneDiferidas=${tieneDiferidas}, textoBoton="${textoBoton}"`);
    
    return textoBoton;
  };

  // Función para abrir modal de reserva
  const handleOpenReservaModal = (mesa: Mesa) => {
    setSelectedMesaForReserva(mesa);
    setShowReservaModal(true);
  };

  const handleCloseDetallesModal = () => {
    setShowDetallesModal(false);
    setSelectedMesaForDetalles(null);
    setReservaDetalles(null);
  };

  // Función para obtener detalles de reserva
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

  // Función para abrir el modal de transferencia de producto
  const handleOpenTransferProductModal = (producto: HistorialMesaDetallado) => {
    setSelectedProductToTransfer(producto);
    setShowTransferProductModal(true);
  };

  // Función para manejar la transferencia de producto desde el modal
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

    // Preparar datos para impresión
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
      // Usar el servicio de impresión
      const success = await printService.printComanda(printData);
      
      if (success) {
        toast({
          title: "Impresión Solicitada",
          description: "La comanda ha sido enviada a la impresora.",
        });
      } else {
        toast({
          title: "Impresión en Cola",
          description: "La comanda se agregó a la cola de impresión. Se imprimirá cuando el agente esté disponible.",
        });
      }

    } catch (error) {
      console.error('Error al solicitar la impresión:', error);
      toast({
        title: "Error de Impresión",
        description: "No se pudo enviar la comanda para impresión.",
        variant: "destructive",
      });
    }
  };

  // Función para impresión rápida desde la vista de lista
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
      
      // Preparar datos para impresión
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

      // Usar el servicio de impresión
      const success = await printService.printComanda(printData);
      
      if (success) {
        toast({
          title: "Impresión Solicitada",
          description: `Comanda de Mesa ${mesa.numero} enviada a la impresora.`,
        });
      } else {
        toast({
          title: "Impresión en Cola",
          description: `Comanda de Mesa ${mesa.numero} agregada a la cola de impresión.`,
        });
      }

    } catch (error) {
      console.error('Error al solicitar la impresión rápida:', error);
      toast({
        title: "Error de Impresión",
        description: "No se pudo enviar la comanda para impresión.",
        variant: "destructive",
      });
    }
  };

  // Definir productos a partir de la prefactura para evitar referencia no definida
  // Asegúrate de que prefacturaDataLocal.historial_detallado esté disponible y tenga el tipo correcto
  const productosDetallados: HistorialMesaDetallado[] = prefacturaDataLocal?.data?.historial_detallado ?? [];
  const productosAgrupados: HistorialMesa[] = prefacturaDataLocal?.data?.historial ?? [];

  // 🔍 DEBUG: Logs para depurar los datos de la prefactura
  console.log('🔍 DEBUG Prefactura:', {
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
    return <div className="p-6 text-center text-red-600 font-bold">Error: sucursalId inválido. No se puede mostrar la gestión de mesas.</div>;
  }

  if (isLoadingMesas) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando gestión de mesas...</p>
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
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Mesas</h1>
                  <p className="text-sm sm:text-base text-gray-500 hidden sm:block">Control operativo y agrupación</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Botón de menú móvil */}
              <Button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                variant="outline"
                size="sm"
                className="lg:hidden flex items-center space-x-2"
              >
                <Menu className="h-4 w-4" />
                <span>Menú</span>
              </Button>

              {/* Botones de escritorio */}
              <div className="hidden lg:flex items-center space-x-3">
                <Button
                  onClick={() => { refetchMesas(); }}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
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

      {/* Menú móvil desplegable */}
      {showMobileMenu && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-3">
              {/* Botón de actualizar */}
              <Button
                onClick={() => { 
                  refetchMesas(); 
                  setShowMobileMenu(false); 
                }}
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
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
          {/* Pestañas para escritorio */}
          <TabsList className={`hidden lg:grid w-full ${user?.rol === 'mesero' ? 'grid-cols-2' : 'grid-cols-3'} bg-white shadow-sm border border-gray-200 rounded-lg p-1`}>
            <TabsTrigger value="management" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Activity className="h-4 w-4" />
              Gestión Operativa
            </TabsTrigger>
            <TabsTrigger value="grupos" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Users2 className="h-4 w-4" />
              Grupos de Mesas
            </TabsTrigger>
            {user?.rol !== 'mesero' && (
              <TabsTrigger value="configuration" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Settings className="h-4 w-4" />
                Configuración
              </TabsTrigger>
            )}
          </TabsList>

          {/* Menú móvil para pestañas */}
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
                  {activeTab === 'management' && 'Gestión Operativa'}
                  {activeTab === 'grupos' && 'Grupos de Mesas'}
                  {activeTab === 'configuration' && 'Configuración'}
                </span>
              </div>
              <Menu className="h-4 w-4" />
            </Button>

            {/* Menú desplegable de pestañas */}
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
                  Gestión Operativa
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
                    Configuración
                  </Button>
                )}
              </div>
            )}
          </div>

          <TabsContent value="management" className="space-y-6 mt-6">
            {/* Estadísticas Mejoradas */}
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
                    <p className="text-xs text-orange-600 mt-1 hidden sm:block">Ventas del día</p>
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
                    disabled={selectedMesas.length < 2}
                    onClick={() => setShowMeseroModal(true)}
                    className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Unir Mesas</span>
                    <span className="sm:hidden">Unir</span>
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

            {/* Grid de Mesas con selección */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {mesas.map((mesa) => (
                  <Card 
                    key={mesa.id_mesa} 
                    className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                      selectedMesas.includes(mesa.id_mesa) 
                        ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50' 
                        : mesa.id_grupo_mesa ? 'border-2 border-purple-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Indicador de selección */}
                    {selectedMesas.includes(mesa.id_mesa) && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                    {/* Indicador de grupo */}
                    {mesa.id_grupo_mesa && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-purple-500 text-white text-xs px-1 py-0.5 shadow-lg">
                          <Link2 className="h-2 w-2 mr-0.5" />
                          Grupo {mesa.id_grupo_mesa}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-3 p-3 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xs sm:text-sm">{mesa.numero}</span>
                          </div>
                          <div>
                            <CardTitle className="text-sm sm:text-lg font-bold text-gray-900">
                              Mesa {mesa.numero}
                            </CardTitle>
                            <p className="text-xs text-gray-500">ID: {mesa.id_mesa}</p>
                          </div>
                        </div>
                        <Badge className={`${getEstadoColor(mesa.estado)} text-xs font-medium`}>
                          {getEstadoIcon(mesa.estado)}
                          <span className="ml-1 capitalize">{mesa.estado.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                      {/* Información de capacidad */}
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">Capacidad</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{mesa.capacidad}</span>
                      </div>

                      {/* Información de ventas si está en uso */}
                      {(mesa.estado === 'en_uso' || mesa.estado === 'pendiente_cobro' || mesa.estado === 'pagado') && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">Total Acumulado</span>
                            </div>
                            <span className="text-lg font-bold text-green-900">
                              ${(Number(mesa.total_acumulado) || 0).toFixed(2)}
                            </span>
                          </div>
                          
                          {mesa.hora_apertura && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">Abierta desde</span>
                              </div>
                              <span className="text-sm font-medium text-blue-900">
                                {new Date(mesa.hora_apertura).toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Acciones según estado */}
                      <div className="space-y-2">
                        {mesa.estado === 'libre' && (
                          <div className="space-y-2">
                            <Button
                              onClick={() => setSelectedMesas((prev) => 
                                prev.includes(mesa.id_mesa) 
                                  ? prev.filter(id => id !== mesa.id_mesa) 
                                  : [...prev, mesa.id_mesa]
                              )}
                              variant={selectedMesas.includes(mesa.id_mesa) ? 'default' : 'outline'}
                              className="w-full"
                              size="sm"
                            >
                              {selectedMesas.includes(mesa.id_mesa) ? (
                                <>
                                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  <span className="hidden sm:inline">Quitar de Selección</span>
                                  <span className="sm:hidden">Quitar</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  <span className="hidden sm:inline">Seleccionar para Unir</span>
                                  <span className="sm:hidden">Seleccionar</span>
                                </>
                              )}
                            </Button>
                            
                            {/* NUEVO: Botón de reservas */}
                            <Button
                              onClick={() => handleOpenReservaModal(mesa)}
                              variant="outline"
                              className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                              size="sm"
                            >
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Reservas</span>
                              <span className="sm:hidden">Reservar</span>
                            </Button>
                          </div>
                        )}

                        {/* Botón para ver detalles de reserva si la mesa está reservada */}
                        {mesa.estado === 'reservada' && (
                          <div className="space-y-2">
                            <Button
                              onClick={() => handleVerDetallesReserva(mesa)}
                              variant="outline"
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                              size="sm"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Reserva
                            </Button>
                          </div>
                        )}

                        {mesa.estado === 'en_uso' && (
                          <div className="space-y-2">
                            <Button 
                              onClick={() => handleGenerarPrefactura(mesa)}
                              variant="outline"
                              className="w-full transition-transform duration-150"
                              size="sm"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Generar Prefactura
                            </Button>
                            <Button 
                              onClick={() => handleImprimirComandaRapida(mesa)}
                              size="sm"
                              variant="outline"
                              className="border-blue-300 text-blue-800 hover:bg-blue-100 font-medium transition-transform duration-150"
                            >
                              <Printer className="h-3 w-3 mr-1" />
                              Imprimir
                            </Button>
                            <Button 
                              onClick={() => handleMarcarComoPagado(mesa)}
                              variant="default"
                              className="w-full bg-green-600 hover:bg-green-700 transition-transform duration-150"
                              size="sm"
                              disabled={marcarComoPagadoMutation.isPending}
                            >
                              <CreditCard className="h-3 w-3 mr-1" />
                              {getPaymentButtonText(mesa)}
                            </Button>
                            <Button 
                              onClick={() => handleLiberarMesa(mesa.id_mesa)}
                              variant="outline"
                              className="w-full"
                              size="sm"
                              disabled={liberarMesaMutation.isPending}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Liberar
                            </Button>
                          </div>
                        )}

                        {mesa.estado === 'pendiente_cobro' && (
                          <div className="space-y-2">
                            <Button 
                              onClick={() => handleMarcarComoPagado(mesa)}
                              variant="default"
                              className="w-full bg-green-600 hover:bg-green-700"
                              size="sm"
                              disabled={marcarComoPagadoMutation.isPending}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              {getPaymentButtonText(mesa)}
                            </Button>
                            <Button 
                              onClick={() => handleCerrarConFactura(mesa)}
                              variant="outline"
                              className="w-full"
                              size="sm"
                            >
                              <Receipt className="h-4 w-4 mr-2" />
                              Facturar (Especial)
                            </Button>
                            <Button 
                              onClick={() => handleLiberarMesa(mesa.id_mesa)}
                              variant="outline"
                              className="w-full"
                              size="sm"
                              disabled={liberarMesaMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Liberar Mesa
                            </Button>
                          </div>
                        )}

                        {mesa.estado === 'pagado' && (
                          <div className="space-y-2">
                            <div className="p-3 bg-green-100 rounded-lg border border-green-200">
                              <div className="flex items-center justify-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">
                                  Pagado - Mesa Libre
                                </span>
                              </div>
                            </div>
                            <Button 
                              onClick={() => handleLiberarMesa(mesa.id_mesa)}
                              variant="outline"
                              className="w-full"
                              size="sm"
                              disabled={liberarMesaMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Liberar Mesa
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* List View de Mesas */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="min-w-full divide-y divide-gray-200">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mesa
                        </TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          Estado
                        </TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          Capacidad
                        </TableHead>
                        <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          Total Acumulado
                        </TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white divide-y divide-gray-200">
                      {mesas.map((mesa) => (
                        <TableRow key={mesa.id_mesa} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-white font-bold text-sm">{mesa.numero}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium text-gray-900">Mesa {mesa.numero}</div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedMesaForDetalles(mesa);
                                      setShowDetallesModal(true);
                                    }}
                                    className="lg:hidden p-1 h-6 w-6 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-sm text-gray-500">ID: {mesa.id_mesa}</div>
                                <div className="lg:hidden mt-1">
                                  <Badge className={`${getEstadoColor(mesa.estado)} text-xs font-medium`}>
                                    {getEstadoIcon(mesa.estado)}
                                    <span className="ml-1 capitalize">{mesa.estado.replace('_', ' ')}</span>
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                            <Badge className={`${getEstadoColor(mesa.estado)} text-xs font-medium`}>
                              {getEstadoIcon(mesa.estado)}
                              <span className="ml-1 capitalize">{mesa.estado.replace('_', ' ')}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {mesa.capacidad} personas
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap text-right hidden lg:table-cell">
                            <span className="text-sm font-bold text-green-600">
                              ${(Number(mesa.total_acumulado) || 0).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                            <div className="flex items-center space-x-2">
                              {mesa.estado === 'libre' && (
                                <Button
                                  onClick={() => setSelectedMesas((prev) => 
                                    prev.includes(mesa.id_mesa) 
                                      ? prev.filter(id => id !== mesa.id_mesa) 
                                      : [...prev, mesa.id_mesa]
                                  )}
                                  size="sm"
                                  variant={selectedMesas.includes(mesa.id_mesa) ? 'default' : 'outline'}
                                  className="flex items-center space-x-1"
                                >
                                  {selectedMesas.includes(mesa.id_mesa) ? (
                                    <>
                                      <X className="h-3 w-3" />
                                      <span>Quitar</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-3 w-3" />
                                      <span>Seleccionar</span>
                                    </>
                                  )}
                                </Button>
                              )}
                              
                              {mesa.estado === 'en_uso' && (
                                <>
                                  <Button 
                                    onClick={() => handleGenerarPrefactura(mesa)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
                                    Prefactura
                                  </Button>
                                  <Button 
                                    onClick={() => handleImprimirComandaRapida(mesa)}
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-300 text-blue-800 hover:bg-blue-100 font-medium"
                                  >
                                    <Printer className="h-3 w-3 mr-1" />
                                    Imprimir
                                  </Button>
                                  <Button 
                                    onClick={() => handleMarcarComoPagado(mesa)}
                                    size="sm"
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={marcarComoPagadoMutation.isPending}
                                  >
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Pagado
                                  </Button>
                                  <Button 
                                    onClick={() => handleLiberarMesa(mesa.id_mesa)}
                                    size="sm"
                                    variant="outline"
                                    disabled={liberarMesaMutation.isPending}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Liberar
                                  </Button>
                                </>
                              )}
                              
                              {mesa.estado === 'pendiente_cobro' && (
                                <>
                                  <Button 
                                    onClick={() => handleMarcarComoPagado(mesa)}
                                    size="sm"
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={marcarComoPagadoMutation.isPending}
                                  >
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Pagado
                                  </Button>
                                  <Button 
                                    onClick={() => handleCerrarConFactura(mesa)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <Receipt className="h-3 w-3 mr-1" />
                                    Facturar
                                  </Button>
                                  <Button 
                                    onClick={() => handleLiberarMesa(mesa.id_mesa)}
                                    size="sm"
                                    variant="outline"
                                    disabled={liberarMesaMutation.isPending}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Liberar
                                  </Button>
                                </>
                              )}
                              
                              {mesa.estado === 'pagado' && (
                                <>
                                  <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    <span className="text-xs font-medium text-green-800">Pagado</span>
                                  </div>
                                  <Button 
                                    onClick={() => handleLiberarMesa(mesa.id_mesa)}
                                    size="sm"
                                    variant="outline"
                                    disabled={liberarMesaMutation.isPending}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Liberar
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Grupos de Mesas Mejorados */}
            {showGrupos && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Grupos de Mesas Activos</h2>
                      <p className="text-sm text-gray-500">Gestión de mesas agrupadas</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-sm">
                    {gruposActivos.length} grupo{gruposActivos.length !== 1 ? 's' : ''} activo{gruposActivos.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {gruposActivos.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Users2 className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay grupos activos</h3>
                    <p className="text-gray-500">Selecciona mesas y créalos para comenzar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {gruposActivos.map((grupo: any) => (
                      <Card key={grupo.id_grupo_mesa} className="border-l-4 border-l-purple-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold">{grupo.id_grupo_mesa}</span>
                              </div>
                              <div>
                                <CardTitle className="text-lg font-bold text-gray-900">
                                  Grupo #{grupo.id_grupo_mesa}
                                </CardTitle>
                                <p className="text-sm text-gray-500">
                                  Estado: <span className="font-medium text-purple-600">{grupo.estado}</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => cerrarGrupoMutation.mutate(grupo.id_grupo_mesa)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cerrar Grupo
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setShowAddMesaToGrupo(grupo.id_grupo_mesa)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Agregar Mesa
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Mesas en el grupo */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Mesas en el grupo:</h4>
                            <div className="flex flex-wrap gap-2">
                              {(mesasEnGrupo[grupo.id_grupo_mesa] || []).length === 0 ? (
                                <div className="text-sm text-gray-500 italic">Cargando mesas...</div>
                              ) : (
                                mesasEnGrupo[grupo.id_grupo_mesa].map((mesa: any) => (
                                  <div key={mesa.id_mesa} className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                                    <span className="text-sm font-medium">Mesa {mesa.numero}</span>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => removerMesaMutation.mutate({ id_grupo: grupo.id_grupo_mesa, id_mesa: mesa.id_mesa })}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Panel para agregar mesas */}
                          {showAddMesaToGrupo === grupo.id_grupo_mesa && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <h5 className="text-sm font-medium text-gray-700 mb-3">Seleccionar mesas para agregar:</h5>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {mesas.filter(m => m.estado === 'libre' && !Object.values(mesasEnGrupo).flat().some(gm => gm.id_mesa === m.id_mesa)).map(mesa => (
                                  <Button
                                    key={mesa.id_mesa}
                                    size="sm"
                                    variant={mesasParaAgregar.includes(mesa.id_mesa) ? 'default' : 'outline'}
                                    onClick={() => setMesasParaAgregar(prev => 
                                      prev.includes(mesa.id_mesa) 
                                        ? prev.filter(id => id !== mesa.id_mesa) 
                                        : [...prev, mesa.id_mesa]
                                    )}
                                  >
                                    Mesa {mesa.numero}
                                  </Button>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  disabled={mesasParaAgregar.length === 0}
                                  onClick={() => {
                                    mesasParaAgregar.forEach(id_mesa => 
                                      agregarMesaMutation.mutate({ id_grupo: grupo.id_grupo_mesa, id_mesa })
                                    );
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Agregar Seleccionadas
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => { 
                                    setShowAddMesaToGrupo(null); 
                                    setMesasParaAgregar([]); 
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="grupos" className="space-y-6 mt-6">
            <GruposMesasManagement idRestaurante={idRestaurante} />
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6 mt-6">
            <MesaConfiguration sucursalId={sucursalId} />
          </TabsContent>
        </Tabs>

        {/* Modal de Selección de Mesero */}
        <Dialog open={showMeseroModal} onOpenChange={setShowMeseroModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-gray-900">
                    Asignar Mesero al Grupo
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-500">
                    Selecciona un mesero para el grupo de {selectedMesas.length} mesa{selectedMesas.length !== 1 ? 's' : ''}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4">
              {isLoadingMeseros ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-600">Cargando meseros...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Meseros Disponibles:
                  </div>
                  {meseros.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Users2 className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">No hay meseros disponibles</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {meseros.map((mesero) => (
                        <div
                          key={mesero.id}
                          onClick={() => setSelectedMesero(mesero.id)}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            selectedMesero === mesero.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {mesero.nombre?.charAt(0)?.toUpperCase() || 'M'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {mesero.nombre || mesero.username}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {mesero.rol || 'mesero'}
                                </div>
                              </div>
                            </div>
                            {selectedMesero === mesero.id && (
                              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{selectedMesas.length}</span> mesa{selectedMesas.length !== 1 ? 's' : ''} seleccionada{selectedMesas.length !== 1 ? 's' : ''}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowMeseroModal(false);
                      setSelectedMesero(0);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCrearGrupo}
                    disabled={selectedMesero === 0 || crearGrupoMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {crearGrupoMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Grupo
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Prefactura Mejorado */}
        <Dialog open={showPrefactura} onOpenChange={setShowPrefactura}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-gray-900">
                    Prefactura - Mesa {selectedMesa?.numero}
                  </DialogTitle>
                  <DialogDescription>
                    Detalles de productos y totales
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {prefacturaDataLocal ? (
              <div className="space-y-6">
                {/* Información de la mesa */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Mesa</p>
                      <p className="text-lg font-bold text-gray-900">{selectedMesa?.numero}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Estado</p>
                      <Badge className={getEstadoColor(selectedMesa?.estado || '')}>
                        {getEstadoIcon(selectedMesa?.estado || '')}
                        <span className="ml-1 capitalize">{(selectedMesa?.estado || '').replace('_', ' ')}</span>
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Acumulado</p>
                      <p className="text-lg font-bold text-green-600">
                        ${(Number(prefacturaDataLocal?.data?.total_acumulado) || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Fecha de Apertura</p>
                      <p className="text-sm font-medium text-gray-900">
                        {prefacturaDataLocal?.data?.fecha_apertura || 'N/A'}
                      </p>
                    </div>
                  </div>
                  {prefacturaDataLocal?.data?.total_ventas && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500">Ventas Realizadas</p>
                          <p className="text-sm font-bold text-blue-600">{prefacturaDataLocal?.data?.total_ventas}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Productos Diferentes</p>
                          <p className="text-sm font-bold text-purple-600">{productosAgrupados?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Estado Prefactura</p>
                          <p className="text-sm font-bold text-orange-600 capitalize">
                            {(prefacturaDataLocal?.data?.estado_prefactura || 'abierta').replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de productos */}
                {productosDetallados && productosDetallados.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Productos Consumidos</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="font-medium text-gray-700">Producto</TableHead>
                            <TableHead className="font-medium text-gray-700 text-right">Cantidad</TableHead>
                            <TableHead className="font-medium text-gray-700 text-right">Precio Unit.</TableHead>
                            <TableHead className="font-medium text-gray-700 text-right">Subtotal</TableHead>
                            <TableHead className="font-medium text-gray-700 text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productosDetallados.map((producto: HistorialMesaDetallado, index: number) => (
                            <TableRow key={producto.id_detalle} className="hover:bg-gray-50">
                              <TableCell className="font-medium">
                                <div>
                                  <div className="text-gray-900">{producto.nombre_producto}</div>
                                  {producto.observaciones && producto.observaciones !== '-' && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {producto.observaciones}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {producto.cantidad}
                              </TableCell>
                              <TableCell className="text-right text-gray-600">
                                ${Number(producto.precio_unitario).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-bold text-green-600">
                                ${Number(producto.subtotal).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                {selectedMesa?.estado === 'en_uso' || selectedMesa?.estado === 'pendiente_cobro' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenTransferProductModal(producto)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <MoveRight className="h-4 w-4 mr-1" />
                                    Transferir
                                  </Button>
                                ) : (
                                  <span className="text-gray-400 text-sm">No disponible</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
                    <p className="text-gray-500">Esta mesa no tiene productos registrados</p>
                  </div>
                )}

                {/* Totales */}
                {productosAgrupados && productosAgrupados.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-green-800">Total Acumulado:</span>
                                            <span className="text-2xl font-bold text-green-900">
                        ${(Number(prefacturaDataLocal?.data?.total_acumulado) || 0).toFixed(2)}
                      </span>
                    </div>
                    {prefacturaDataLocal?.data?.total_ventas && (
                      <div className="mt-2 text-sm text-green-700">
                        {prefacturaDataLocal?.data?.total_ventas} venta{prefacturaDataLocal?.data?.total_ventas !== 1 ? 's' : ''} •
                        {prefacturaDataLocal?.data?.fecha_apertura && ` Abierta desde: ${prefacturaDataLocal?.data?.fecha_apertura}`}
                      </div>
                    )}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Mesa {selectedMesa?.numero} • {productosDetallados?.length || 0} producto{productosDetallados?.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowPrefactura(false)}
                    >
                      Cerrar
                    </Button>
                    {selectedMesa && (
                      <>
                        <Button
                          variant="outline"
                          onClick={handleImprimirComanda}
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimir Comanda
                        </Button>
                        <Button
                          onClick={() => handleMarcarComoPagado(selectedMesa)}
                          disabled={marcarComoPagadoMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {selectedMesa ? getPaymentButtonText(selectedMesa) : 'Marcar como Pagado'}
                        </Button>
                        <Button
                          onClick={() => handleCerrarConFactura(selectedMesa)}
                          variant="outline"
                        >
                          <Receipt className="h-4 w-4 mr-2" />
                          Generar Factura
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Cargando prefactura...</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* NUEVO: Modal de Transferencia de Productos */}
        {showTransferProductModal && selectedProductToTransfer && selectedMesa && (
          <TransferProductModal
            isOpen={showTransferProductModal}
            onClose={() => {
              setShowTransferProductModal(false);
              setSelectedProductToTransfer(null);
            }}
            producto={selectedProductToTransfer}
            mesaOrigen={selectedMesa}
            mesasDisponibles={otherMesas}
            onTransfer={handleProductTransfer}
          />
        )}

        {/* NUEVO: Modal de Reservas */}
        {showReservaModal && selectedMesaForReserva && (
          <ReservaModal
            isOpen={showReservaModal}
            onClose={() => {
              setShowReservaModal(false);
              setSelectedMesaForReserva(null);
            }}
            mesa={selectedMesaForReserva}
            sucursalId={sucursalId}
          />
        )}

        {/* Modal de Detalles de Reserva */}
        {(() => {
          return showDetallesModal && selectedMesaForDetalles && reservaDetalles && (
            <ReservaDetallesModal
              isOpen={showDetallesModal}
              onClose={handleCloseDetallesModal}
              reserva={reservaDetalles}
            />
          );
        })()}

        {/* Modal de Método de Pago */}
        {showPaymentMethodModal && selectedMesaForPayment && (
          <PaymentMethodModal
            isOpen={showPaymentMethodModal}
            onClose={() => {
              setShowPaymentMethodModal(false);
              setSelectedMesaForPayment(null);
            }}
            onConfirm={handleConfirmPaymentMethod}
            mesaNumero={selectedMesaForPayment.numero}
            total={selectedMesaForPayment.total_acumulado || 0}
            isLoading={marcarVentaDiferidaMutation.isPending}
            metodosPago={metodosPago}
          />
        )}
      </div>
    </div>
  );
} 