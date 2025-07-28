import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKitchenOrders, updateOrderStatus } from '@/services/api';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { io as socketIOClient, Socket } from 'socket.io-client';
import { FaClock, FaCheckCircle, FaUtensils, FaExclamationTriangle, FaFireAlt } from 'react-icons/fa';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

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
}

interface KitchenOrder {
  id_venta: number;
  fecha: string;
  mesa_numero: number | null;
  id_mesa: number | null;
  tipo_servicio: string;
  estado: 'recibido' | 'en_preparacion' | 'listo_para_servir' | 'entregado' | 'cancelado';
  total: number;
  productos: ProductDetail[];
  comensales?: number;
}

interface KitchenViewProps {
  orders?: any[];
  onUpdateOrderStatus?: (saleId: string, status: string) => void;
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'recibido':
      return { color: 'bg-cyan-500', icon: <FaUtensils className="inline mr-1" />, label: 'Recibido' };
    case 'en_preparacion':
      return { color: 'bg-yellow-400', icon: <FaFireAlt className="inline mr-1" />, label: 'En preparación' };
    case 'listo_para_servir':
      return { color: 'bg-green-500', icon: <FaCheckCircle className="inline mr-1" />, label: 'Listo para servir' };
    case 'entregado':
      return { color: 'bg-gray-400', icon: <FaCheckCircle className="inline mr-1" />, label: 'Entregado' };
    case 'cancelado':
      return { color: 'bg-red-500', icon: <FaExclamationTriangle className="inline mr-1" />, label: 'Cancelado' };
    default:
      return { color: 'bg-cyan-500', icon: <FaUtensils className="inline mr-1" />, label: status };
  }
}

function getPriorityColor(priority?: string) {
  switch (priority) {
    case 'urgente': return 'bg-red-500 text-white';
    case 'alta': return 'bg-yellow-400 text-black';
    default: return 'bg-gray-200 text-gray-800';
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

export function KitchenView({ orders: propOrders, onUpdateOrderStatus }: KitchenViewProps = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  // LOG de depuración para ver el usuario actual
  console.log('Usuario actual (user):', user);
  const [realtimeOrders, setRealtimeOrders] = React.useState<KitchenOrder[]>([]);
  const [detalleUpdates, setDetalleUpdates] = React.useState<{ [id_detalle: number]: any }>({});
  const socketRef = React.useRef<Socket | null>(null);
  const [detallePedido, setDetallePedido] = useState<{ open: boolean; order: any | null }>({ open: false, order: null });

  const { data: orders, isLoading, isError } = !propOrders
    ? useQuery<KitchenOrder[]>({ 
    queryKey: ['kitchenOrders'], 
    queryFn: getKitchenOrders,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
      })
    : { data: propOrders, isLoading: false, isError: false };

  // LOG de depuración para ver los pedidos que llegan del backend
  console.log('Pedidos recibidos del backend (orders):', orders);

  React.useEffect(() => {
    if (!propOrders) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
      const socket = socketIOClient(socketUrl);
      socketRef.current = socket;
      socket.on('connect', () => {
        console.log('Conectado a KDS (socket.io)', socket.id);
      });
      socket.on('nueva-orden-cocina', (orden: any) => {
        // Actualizar la cache de React Query en tiempo real
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
    order.estado !== 'cancelado' && 
    order.estado !== 'entregado'
  ) || [];

  // LOG de depuración para ver los pedidos que se van a renderizar
  console.log('Pedidos activos a renderizar (activeOrders):', activeOrders);

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
        title: "Estado Actualizado",
        description: `El pedido #${variables.saleId} ha sido actualizado a: ${variables.status}`,
      });
    },
    onError: (error, variables) => {
      console.error('Error updating order status:', { error, variables });
      toast({
        title: "Error",
        description: `No se pudo actualizar el estado del pedido #${variables.saleId}. ${error.message || 'Error desconocido'}`,
        variant: "destructive",
      });
    },
  });

  const handleUpdateDetalle = async (id_detalle: number, fields: { prioridad?: string; tiempo_estimado?: number; estacion_cocina?: string }) => {
    try {
      await api.patch(`/api/v1/detalle-ventas/${id_detalle}`, fields);
    } catch (error: any) {
      alert('Error al actualizar detalle: ' + (error.response?.data?.message || error.message));
    }
  };

  if (isLoading) return <div className="p-6 text-center">Cargando pedidos...</div>;
  if (isError) return <div className="p-6 text-center text-red-500">Error al cargar los pedidos.</div>;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Panel de Cocina</h1>
          <span className="text-gray-500 text-sm">Pedidos activos: <span className="font-semibold text-cyan-600">{activeOrders.length}</span></span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {activeOrders.length > 0 ? (
          activeOrders.map((order) => {
            const statusInfo = getStatusInfo(order.estado);
            return (
              <Card key={order.id_venta} className="shadow-2xl rounded-2xl border-0 bg-white/90 hover:scale-[1.01] transition-transform duration-200">
                <CardHeader className="pb-2 border-b flex flex-col gap-2 bg-gradient-to-r from-cyan-100 to-pink-100 rounded-t-2xl">
                  {/* DATOS ESENCIALES DE LA COMANDA */}
                  <div className="mb-2">
                    <div className="flex flex-wrap items-center gap-4 mb-1">
                      <span className="font-bold text-lg text-cyan-700">Comanda #{order.id_venta}</span>
                      <span className="text-xs text-gray-500">{order.fecha && !isNaN(new Date(order.fecha).getTime()) ? new Date(order.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                      <span>Mesa: <span className="font-semibold">{order.mesa_numero ? order.mesa_numero : '-'}</span></span>
                      <span>Mesero/a: <span className="font-semibold">date</span></span>
                      <span>Servicio: <span className="font-semibold">{order.tipo_servicio || '-'}</span></span>
                      {order.comensales && <span>Comensales: <span className="font-semibold">{order.comensales}</span></span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-cyan-600 text-white text-xl font-bold shadow-lg">
                        {order.mesa_numero ? order.mesa_numero : '-'}
                      </span>
                      <span className="text-lg font-semibold">Mesa</span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-white text-xs font-bold ${statusInfo.color}`}>
                      {statusInfo.icon}{statusInfo.label}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    {order.fecha && !isNaN(new Date(order.fecha).getTime()) && (
                      <span className="text-xs text-gray-500 flex items-center gap-1"><FaClock /> {new Date(order.fecha).toLocaleTimeString()} ({timeSince(order.fecha)})</span>
                    )}
                    <span className="text-xs text-gray-400">#{order.id_venta}</span>
                    <span className="text-xs text-gray-400">{order.tipo_servicio}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 pb-2">
                  <div className="space-y-3">
                    {order.productos.map((item: any) => {
                      const detalle = detalleUpdates[item.id_detalle] ? { ...item, ...detalleUpdates[item.id_detalle] } : item;
                      return (
                        <div key={item.id_detalle || item.id_producto} className="rounded-xl bg-gray-50 border border-gray-200 p-3 flex flex-col md:flex-row md:items-center gap-2 shadow-sm">
                          <div className="flex-1 flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base text-gray-800">{detalle.nombre_producto}</span>
                              <span className="text-xs bg-cyan-100 text-cyan-800 rounded px-2 py-0.5 font-semibold">x{detalle.cantidad}</span>
                              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${getPriorityColor(detalle.prioridad)}`}>{detalle.prioridad ? detalle.prioridad.charAt(0).toUpperCase() + detalle.prioridad.slice(1) : 'Normal'}</span>
                            </div>
                            {detalle.observaciones && (
                              <div className="text-xs text-pink-600 mt-1 font-medium">{detalle.observaciones}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 mt-6 justify-end items-center">
                    {(() => {
                      let nextStatus = '';
                      let btnText = '';
                      let btnIcon = null;
                      if (order.estado === 'recibido') {
                        nextStatus = 'en_preparacion';
                        btnText = 'Preparar';
                        btnIcon = <FaFireAlt className="inline mr-2" />;
                      } else if (order.estado === 'en_preparacion') {
                        nextStatus = 'listo_para_servir';
                        btnText = 'Listo para Servir';
                        btnIcon = <FaCheckCircle className="inline mr-2" />;
                      } else if (order.estado === 'listo_para_servir') {
                        nextStatus = 'entregado';
                        btnText = 'Entregado';
                        btnIcon = <FaCheckCircle className="inline mr-2" />;
                      }
                      return (
                        <>
                          {nextStatus && (
                            <Button
                              size="md"
                              variant="outline"
                              className="font-bold border-cyan-500 text-cyan-700 hover:bg-cyan-50 px-6 py-2 rounded-lg"
                              onClick={() => updateStatusMutation.mutate({ saleId: order.id_venta.toString(), status: nextStatus })}
                            >
                              {btnIcon}{btnText}
                            </Button>
                          )}
                          <Button
                            size="md"
                            variant="secondary"
                            className="ml-2 px-6 py-2 rounded-lg font-bold"
                            onClick={() => setDetallePedido({ open: true, order })}
                          >
                            DETALLE DE PEDIDO
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center text-muted-foreground">No hay pedidos activos.</div>
        )}
      </div>
      {/* Modal Detalle de Pedido */}
      <Dialog open={detallePedido.open} onOpenChange={open => setDetallePedido({ open, order: open ? detallePedido.order : null })}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>Detalle de Pedido</DialogTitle>
            <DialogDescription>
              Comanda #{detallePedido.order?.id_venta} | Mesa: {detallePedido.order?.mesa_numero || '-'}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm mt-4">
              <thead>
                <tr className="bg-cyan-100">
                  <th className="px-3 py-2 border">Cant.</th>
                  <th className="px-3 py-2 border">Plato / Producto</th>
                  <th className="px-3 py-2 border">Modificaciones / Notas</th>
                  <th className="px-3 py-2 border">Prioridad</th>
                </tr>
              </thead>
              <tbody>
                {detallePedido.order?.productos?.map((prod: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="px-3 py-2 border text-center">{prod.cantidad || 1}</td>
                    <td className="px-3 py-2 border">{prod.nombre_producto || '-'}</td>
                    <td className="px-3 py-2 border">{prod.observaciones || '-'}</td>
                    <td className="px-3 py-2 border text-center">{prod.prioridad ? prod.prioridad.charAt(0).toUpperCase() + prod.prioridad.slice(1) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetallePedido({ open: false, order: null })}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}