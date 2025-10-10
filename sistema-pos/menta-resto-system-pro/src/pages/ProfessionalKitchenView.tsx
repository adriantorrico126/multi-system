import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKitchenOrders, updateOrderStatus } from '@/services/api';
import { api } from '@/services/api';
import { PlanGate } from '@/components/plan/PlanGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { io as socketIOClient, Socket } from 'socket.io-client';
import { 
  Clock, 
  CheckCircle, 
  ChefHat, 
  AlertTriangle, 
  Flame, 
  Bell, 
  BellRing,
  Timer,
  Users,
  MapPin,
  Receipt,
  Zap,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Truck,
  ShoppingBag,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductDetail {
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  observaciones?: string;
  id_detalle?: number;
  prioridad?: string;
  estacion_cocina?: string;
  tiempo_estimado?: number;
  modificadores?: Array<{
    id_modificador: number;
    nombre_modificador: string;
    cantidad?: number;
    tipo_modificador?: string;
  }>;
}

interface KitchenOrder {
  id_venta: number;
  fecha: string;
  mesa_numero: number | null;
  id_mesa: number | null;
  tipo_servicio: string;
  estado: 'recibido' | 'en_preparacion' | 'entregado' | 'cancelado';
  total: number;
  productos: ProductDetail[];
  comensales?: number;
  mesero_nombre?: string;
}

interface KitchenViewProps {
  orders?: any[];
  onUpdateOrderStatus?: (saleId: string, status: string) => void;
}

// Configuración de notificaciones
const NOTIFICATION_CONFIG = {
  enabled: true,
  sound: true,
  vibration: true,
  vibrationPattern: [200, 100, 200], // Patrón de vibración
};

// Sonidos de notificación
const playNotificationSound = () => {
  if (NOTIFICATION_CONFIG.sound) {
    try {
      // Crear un sonido de notificación usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('No se pudo reproducir sonido de notificación');
    }
  }
};

// Vibración
const triggerVibration = () => {
  if (NOTIFICATION_CONFIG.vibration && 'vibrate' in navigator) {
    try {
      navigator.vibrate(NOTIFICATION_CONFIG.vibrationPattern);
    } catch (error) {
      console.log('Vibración no disponible');
    }
  }
};

// Funciones helper para servicios
const getServiceIcon = (tipoServicio: string) => {
  switch (tipoServicio?.toLowerCase()) {
    case 'delivery':
      return <Truck className="h-6 w-6" />;
    case 'para llevar':
    case 'takeaway':
      return <ShoppingBag className="h-6 w-6" />;
    case 'domicilio':
      return <Home className="h-6 w-6" />;
    default:
      return <MapPin className="h-6 w-6" />;
  }
};

const getServiceTitle = (tipoServicio: string, mesaNumero: number | null) => {
  if (mesaNumero) {
    return `Mesa ${mesaNumero}`;
  }
  
  switch (tipoServicio?.toLowerCase()) {
    case 'delivery':
      return 'Delivery';
    case 'para llevar':
    case 'takeaway':
      return 'Para Llevar';
    case 'domicilio':
      return 'Domicilio';
    case 'mesa':
      return 'Mesa';
    default:
      return tipoServicio || 'Servicio';
  }
};

function getStatusInfo(status: string) {
  switch (status) {
    case 'recibido':
      return { 
        color: 'bg-gradient-to-r from-blue-500 to-cyan-500', 
        icon: <Bell className="w-4 h-4" />, 
        label: 'NUEVO',
        textColor: 'text-white',
        pulse: true
      };
    case 'en_preparacion':
      return { 
        color: 'bg-gradient-to-r from-orange-500 to-red-500', 
        icon: <Flame className="w-4 h-4" />, 
        label: 'PREPARANDO',
        textColor: 'text-white',
        pulse: false
      };
    case 'entregado':
      return { 
        color: 'bg-gradient-to-r from-green-500 to-emerald-500', 
        icon: <CheckCircle className="w-4 h-4" />, 
        label: 'LISTO',
        textColor: 'text-white',
        pulse: false
      };
    case 'cancelado':
      return { 
        color: 'bg-gradient-to-r from-gray-500 to-slate-500', 
        icon: <AlertTriangle className="w-4 h-4" />, 
        label: 'CANCELADO',
        textColor: 'text-white',
        pulse: false
      };
    default:
      return { 
        color: 'bg-gray-400', 
        icon: <ChefHat className="w-4 h-4" />, 
        label: status.toUpperCase(),
        textColor: 'text-white',
        pulse: false
      };
  }
}

function getPriorityInfo(priority?: string) {
  switch (priority) {
    case 'urgente':
      return { 
        color: 'bg-red-500 text-white animate-pulse', 
        label: 'URGENTE',
        icon: <Zap className="w-3 h-3" />
      };
    case 'alta':
      return { 
        color: 'bg-orange-500 text-white', 
        label: 'ALTA',
        icon: <AlertTriangle className="w-3 h-3" />
      };
    default:
      return { 
        color: 'bg-gray-200 text-gray-700', 
        label: 'NORMAL',
        icon: <Clock className="w-3 h-3" />
      };
  }
}

function timeSince(date: string) {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

function getTimeColor(minutes: number) {
  if (minutes < 5) return 'text-green-600';
  if (minutes < 15) return 'text-yellow-600';
  if (minutes < 30) return 'text-orange-600';
  return 'text-red-600';
}

// Componente de restricción para KitchenView
const KitchenRestricted = () => (
  <div className="container mx-auto p-6">
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-center text-blue-800">
          🔒 Vista de Cocina - Plan Básico Requerido
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-blue-700">
          La funcionalidad de <strong>Vista de Cocina</strong> está disponible únicamente en el plan <strong>Básico</strong> o superior.
        </p>
        <p className="text-sm text-blue-600">
          Esta funcionalidad incluye gestión de pedidos en tiempo real, estados de preparación y notificaciones automáticas.
        </p>
        <div className="flex justify-center space-x-4">
          <Button variant="outline" className="border-blue-300 text-blue-700">
            📞 Contactar Soporte
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            👑 Actualizar Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

export function ProfessionalKitchenView({ orders: propOrders, onUpdateOrderStatus }: KitchenViewProps = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estados
  const [realtimeOrders, setRealtimeOrders] = useState<KitchenOrder[]>([]);
  const [detalleUpdates, setDetalleUpdates] = useState<{ [id_detalle: number]: any }>({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Configurar audio para notificaciones
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7bllHgU6k9n1unEiBC13yO/eizEIHWq+8+OWT';
    audioRef.current.volume = 0.3;
  }, []);

  const { data: orders, isLoading, isError } = !propOrders
    ? useQuery<KitchenOrder[]>({ 
        queryKey: ['kitchenOrders'], 
        queryFn: getKitchenOrders,
        refetchInterval: 3000, // Refetch every 3 seconds for real-time updates
      })
    : { data: propOrders, isLoading: false, isError: false };

  // Detectar nuevos pedidos y activar notificaciones
  useEffect(() => {
    if (orders && orders.length > 0) {
      console.log('🔔 [Notifications] Verificando nuevos pedidos:', {
        currentCount: orders.length,
        lastCount: lastOrderCount,
        notificationsEnabled,
        soundEnabled
      });
      
      if (orders.length > lastOrderCount && lastOrderCount > 0) {
        const newOrdersCount = orders.length - lastOrderCount;
        const newOrders = orders.slice(0, newOrdersCount);
        const hasNewReceivedOrders = newOrders.some(order => order.estado === 'recibido' || order.estado === 'pending');
        
        console.log('🔔 [Notifications] Nuevos pedidos detectados:', {
          newOrdersCount,
          hasNewReceivedOrders,
          newOrders
        });
        
        if (hasNewReceivedOrders && notificationsEnabled) {
          console.log('🔔 [Notifications] Activando notificaciones...');
          
          // Reproducir sonido
          if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {
              console.log('🔔 [Notifications] Fallback a playNotificationSound');
              playNotificationSound();
            });
          }
          
          // Activar vibración
          triggerVibration();
          
          // Mostrar notificación toast
          toast({
            title: "🔔 Nuevo Pedido",
            description: `${newOrdersCount} nuevo${newOrdersCount > 1 ? 's' : ''} pedido${newOrdersCount > 1 ? 's' : ''} en cocina`,
            duration: 5000,
            className: "bg-green-600 text-white"
          });
          
          console.log('🔔 [Notifications] Notificación mostrada');
        }
      }
      
      setLastOrderCount(orders.length);
    }
  }, [orders, notificationsEnabled, soundEnabled, toast]);

  // Configurar WebSocket
  useEffect(() => {
    if (!propOrders) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'https://api.forkast.vip';
      const socket = socketIOClient(socketUrl);
      socketRef.current = socket;
      
      socket.on('connect', () => {
        console.log('🔗 Conectado a KDS (socket.io)', socket.id);
      });
      
      socket.on('nueva-orden-cocina', (orden: any) => {
        console.log('🔔 Nueva orden recibida:', orden);
        queryClient.setQueryData(['kitchenOrders'], (old: any[] = []) => [orden, ...old.filter(o => o.id_venta !== orden.id_venta)]);
      });
      
      socket.on('actualizar-detalle-kds', (detalle: any) => {
        setDetalleUpdates(prev => ({ ...prev, [detalle.id_detalle]: detalle }));
      });
      
      return () => {
        socket.disconnect();
      };
    }
  }, [propOrders, queryClient]);

  // Función para entrar/salir de pantalla completa
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Detectar cambios en pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const allOrders = React.useMemo(() => {
    if (propOrders) return propOrders;
    const ids = new Set();
    const combined = [...realtimeOrders, ...(orders || [])].filter(order => {
      if (ids.has(order.id_venta)) return false;
      ids.add(order.id_venta);
      return true;
    });
    return combined;
  }, [orders, realtimeOrders, propOrders]);

  const activeOrders = allOrders?.filter(order => 
    order.estado !== 'cancelado' && order.estado !== 'entregado'
  ) || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ saleId, status }: { saleId: string; status: string }) => {
      if (onUpdateOrderStatus) {
        onUpdateOrderStatus(saleId, status);
        return Promise.resolve();
      }
      return updateOrderStatus(saleId, status);
    },
    onSuccess: (data, variables) => {
      if (!onUpdateOrderStatus) {
        queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
        if (variables.status === 'cancelado') {
          queryClient.refetchQueries({ queryKey: ['kitchenOrders'] });
        }
      }
      toast({
        title: "✅ Estado Actualizado",
        description: `Pedido #${variables.saleId} → ${variables.status.toUpperCase()}`,
        duration: 2000,
      });
    },
    onError: (error, variables) => {
      console.error('Error updating order status:', { error, variables });
      toast({
        title: "❌ Error",
        description: `No se pudo actualizar el pedido #${variables.saleId}`,
        variant: "destructive",
      });
    },
  });

  const handleUpdateDetalle = async (id_detalle: number, fields: { prioridad?: string; tiempo_estimado?: number; estacion_cocina?: string }) => {
    try {
      await api.patch(`/api/v1/detalle-ventas/${id_detalle}`, fields);
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: 'Error al actualizar detalle: ' + (error.response?.data?.message || error.message),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4" />
          <p className="text-xl">Error al cargar los pedidos</p>
        </div>
      </div>
    );
  }

  return (
    <PlanGate feature="cocina" fallback={<KitchenRestricted />} requiredPlan="basico">
      <div 
        ref={containerRef}
        className={cn(
          "min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 transition-all duration-300",
          isFullscreen && "p-0"
        )}
      >
        {/* Header Profesional */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
          <div className="px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Título y estadísticas */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                    <ChefHat className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      Panel de Cocina
                    </h1>
                    <p className="text-purple-200 text-sm">
                      Pedidos activos: <span className="font-bold text-orange-400">{activeOrders.length}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Controles */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Notificaciones */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={cn(
                    "text-white hover:bg-white/10",
                    !notificationsEnabled && "opacity-50"
                  )}
                >
                  {notificationsEnabled ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                </Button>

                {/* Sonido */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={cn(
                    "text-white hover:bg-white/10",
                    !soundEnabled && "opacity-50"
                  )}
                >
                  {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>

                {/* Vista */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="text-white hover:bg-white/10"
                >
                  {viewMode === 'grid' ? <Monitor className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                </Button>

                {/* Pantalla completa */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/10"
                >
                  {isFullscreen ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className={cn(
          "p-4 sm:p-6",
          isFullscreen && "p-2"
        )}>
          {activeOrders.length > 0 ? (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6" 
                : "space-y-4"
            )}>
              {activeOrders.map((order) => {
                const statusInfo = getStatusInfo(order.estado);
                const timeElapsed = Math.floor((new Date().getTime() - new Date(order.fecha).getTime()) / 60000);
                
                return (
                  <Card 
                    key={`order-${order.id_venta}-${order.fecha}-${order.mesa_numero || 'no-mesa'}`} 
                    className={cn(
                      "kitchen-order-card kitchen-glass-dark shadow-2xl",
                      statusInfo.pulse && "new-order",
                      order.productos.some(p => p.prioridad === 'urgente') && "urgent",
                      viewMode === 'list' && "flex"
                    )}
                  >
                    {/* Header del Pedido */}
                    <CardHeader className={cn(
                      "bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-white/10",
                      viewMode === 'list' && "flex-shrink-0 w-48"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {order.mesa_numero || getServiceIcon(order.tipo_servicio)}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {getServiceTitle(order.tipo_servicio, order.mesa_numero)}
                            </h3>
                            <p className="text-purple-200 text-sm">
                              #{order.id_venta} • {order.tipo_servicio}
                            </p>
                          </div>
                        </div>
                        
                        <div className={cn(
                          "kitchen-status-badge flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-bold",
                          statusInfo.color
                        )}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </div>
                      </div>

                      {/* Información adicional */}
                      <div className="flex items-center gap-4 text-sm text-purple-200">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className={cn(
                            "kitchen-timer",
                            getTimeColor(timeElapsed),
                            timeElapsed > 15 && "warning",
                            timeElapsed > 30 && "critical"
                          )}>
                            {timeSince(order.fecha)}
                          </span>
                        </div>
                        {order.comensales && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{Number(order.comensales) || 0} personas</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Receipt className="h-4 w-4" />
                          <span>Bs {(Number(order.total) || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Productos */}
                    <CardContent className={cn(
                      "p-4",
                      viewMode === 'list' && "flex-1"
                    )}>
                      <div className="space-y-3">
                        {order.productos.map((item: any, itemIndex: number) => {
                          const detalle = detalleUpdates[item.id_detalle] ? { ...item, ...detalleUpdates[item.id_detalle] } : item;
                          const priorityInfo = getPriorityInfo(detalle.prioridad);
                          
                          return (
                            <div 
                              key={`product-${order.id_venta}-${item.id_detalle || item.id_producto}-${item.nombre_producto}-${itemIndex}`} 
                              className="bg-white/5 rounded-lg p-3 border border-white/10"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-white text-sm sm:text-base">
                                      {detalle.nombre_producto}
                                    </h4>
                                    <Badge 
                                      variant="secondary" 
                                      className="bg-orange-500/20 text-orange-200 border-orange-500/30"
                                    >
                                      x{Number(detalle.cantidad) || 1}
                                    </Badge>
                                    <Badge className={priorityInfo.color}>
                                      {priorityInfo.icon}
                                      {priorityInfo.label}
                                    </Badge>
                                  </div>
                                  
                                  {detalle.observaciones && (
                                    <p className="text-pink-300 text-sm bg-pink-500/10 rounded px-2 py-1 mt-1">
                                      📝 {detalle.observaciones}
                                    </p>
                                  )}
                                  
                                  {/* Mostrar modificadores/toppings */}
                                  {detalle.modificadores && detalle.modificadores.length > 0 && (
                                    <div className="mt-2 space-y-1 bg-green-500/10 rounded-lg p-2 border border-green-500/30">
                                      <p className="text-green-200 text-xs font-semibold mb-1">✨ Extras:</p>
                                      {detalle.modificadores.map((mod, idx) => (
                                        <div key={idx} className="text-green-300 text-sm flex items-center gap-2">
                                          <span className="text-green-400">+</span>
                                          <span className="font-medium">{mod.nombre_modificador}</span>
                                          {mod.cantidad && mod.cantidad > 1 && (
                                            <Badge variant="secondary" className="bg-green-500/20 text-green-200 text-xs">
                                              x{mod.cantidad}
                                            </Badge>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {detalle.estacion_cocina && (
                                    <p className="text-blue-300 text-xs mt-1">
                                      🏪 {detalle.estacion_cocina}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                        {(() => {
                          let nextStatus = '';
                          let btnText = '';
                          let btnIcon = null;
                          let btnColor = '';
                          
                          if (order.estado === 'recibido') {
                            nextStatus = 'en_preparacion';
                            btnText = 'INICIAR';
                            btnIcon = <Play className="w-4 h-4" />;
                            btnColor = 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600';
                          } else if (order.estado === 'en_preparacion') {
                            nextStatus = 'entregado';
                            btnText = 'ENTREGAR';
                            btnIcon = <CheckCircle className="w-4 h-4" />;
                            btnColor = 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600';
                          }
                          
                          return (
                            <>
                              {nextStatus && (
                                <Button
                                  size="sm"
                                  onClick={() => updateStatusMutation.mutate({ 
                                    saleId: order.id_venta.toString(), 
                                    status: nextStatus 
                                  })}
                                  className={cn(
                                    "kitchen-button text-white font-bold px-4 py-2 rounded-lg transition-all duration-200",
                                    btnColor
                                  )}
                                >
                                  {btnIcon}
                                  {btnText}
                                </Button>
                              )}
                              
                            </>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
                <ChefHat className="h-16 w-16 text-white/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No hay pedidos activos
                </h3>
                <p className="text-purple-200">
                  Los nuevos pedidos aparecerán aquí automáticamente
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer con información del sistema */}
        <div className="bg-black/20 backdrop-blur-sm border-t border-white/10 p-4">
          <div className="flex items-center justify-between text-sm text-purple-200">
            <div className="flex items-center gap-4">
              <span>👨‍🍳 {user?.nombre || 'Cocinero'}</span>
              <span>🕐 {new Date().toLocaleTimeString('es-ES')}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className={cn(
                "flex items-center gap-1",
                notificationsEnabled ? "text-green-400" : "text-gray-400"
              )}>
                {notificationsEnabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                Notificaciones
              </span>
              <span className={cn(
                "flex items-center gap-1",
                soundEnabled ? "text-green-400" : "text-gray-400"
              )}>
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                Sonido
              </span>
            </div>
          </div>
        </div>
      </div>
    </PlanGate>
  );
}

export default ProfessionalKitchenView;
