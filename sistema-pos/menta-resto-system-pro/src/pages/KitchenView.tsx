import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKitchenOrders, updateOrderStatus, testOrders, testConnection, testAllOrders, testOrderStats } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface ProductDetail {
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  observaciones?: string;
}

interface KitchenOrder {
  id_venta: number;
  fecha: string;
  mesa_numero: number | null;
  tipo_servicio: string;
  estado: 'recibido' | 'en_preparacion' | 'listo_para_servir' | 'entregado' | 'cancelado';
  total: number;
  productos: ProductDetail[];
}

interface KitchenViewProps {
  orders?: any[];
  onUpdateOrderStatus?: (saleId: string, status: string) => void;
}

export function KitchenView({ orders: propOrders, onUpdateOrderStatus }: KitchenViewProps = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Si se pasan orders y onUpdateOrderStatus como props, usar esos en vez de la consulta interna
  const { data: orders, isLoading, isError } = !propOrders
    ? useQuery<KitchenOrder[]>({ 
    queryKey: ['kitchenOrders'], 
    queryFn: getKitchenOrders,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
      })
    : { data: propOrders, isLoading: false, isError: false };

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'recibido': return 'default';
      case 'en_preparacion': return 'secondary';
      case 'listo_para_servir': return 'success'; // Assuming a success variant exists or can be defined
      case 'entregado': return 'outline';
      case 'cancelado': return 'destructive';
      default: return 'default';
    }
  };

  if (isLoading) return <div className="p-6 text-center">Cargando pedidos...</div>;
  if (isError) return <div className="p-6 text-center text-red-500">Error al cargar los pedidos.</div>;

  // Filtrar pedidos cancelados y entregados como respaldo
  const activeOrders = orders?.filter(order => 
    order.estado !== 'cancelado' && 
    order.estado !== 'entregado'
  ) || [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Panel de Cocina</h1>
        {user?.rol !== 'cocinero' && (
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                testConnection().then(data => {
                  console.log('Connection test result:', data);
                  toast({
                    title: "Prueba de Conexión",
                    description: "Conexión al backend exitosa",
                  });
                }).catch(error => {
                  console.error('Connection test error:', error);
                  toast({
                    title: "Error de Conexión",
                    description: "No se pudo conectar al backend",
                    variant: "destructive",
                  });
                });
              }}
              variant="outline"
              size="sm"
            >
              Probar Conexión
            </Button>
            <Button 
              onClick={() => {
                testOrders().then(data => {
                  console.log('Test orders result:', data);
                  toast({
                    title: "Prueba de Pedidos",
                    description: `Encontrados ${data.data?.length || 0} pedidos en la base de datos`,
                  });
                }).catch(error => {
                  console.error('Test orders error:', error);
                  toast({
                    title: "Error en Prueba",
                    description: "No se pudo acceder a los pedidos",
                    variant: "destructive",
                  });
                });
              }}
              variant="outline"
              size="sm"
            >
              Probar Pedidos
            </Button>
            <Button 
              onClick={() => {
                testAllOrders().then(data => {
                  console.log('All orders result:', data);
                  const cancelados = data.data?.filter((order: any) => order.estado === 'cancelado') || [];
                  toast({
                    title: "Todos los Pedidos",
                    description: `Total: ${data.data?.length || 0}, Cancelados: ${cancelados.length}`,
                  });
                }).catch(error => {
                  console.error('All orders error:', error);
                  toast({
                    title: "Error en Prueba",
                    description: "No se pudo acceder a todos los pedidos",
                    variant: "destructive",
                  });
                });
              }}
              variant="outline"
              size="sm"
            >
              Ver Todos
            </Button>
            <Button 
              onClick={() => {
                testOrderStats().then(data => {
                  console.log('Order stats result:', data);
                  const cancelados = data.data?.find((stat: any) => stat.estado === 'cancelado');
                  const totalCancelados = cancelados ? parseInt(cancelados.cantidad) : 0;
                  toast({
                    title: "Estadísticas (24h)",
                    description: `Total: ${data.totales?.total_pedidos || 0}, Cancelados: ${totalCancelados}`,
                  });
                }).catch(error => {
                  console.error('Order stats error:', error);
                  toast({
                    title: "Error en Estadísticas",
                    description: "No se pudo obtener las estadísticas",
                    variant: "destructive",
                  });
                });
              }}
              variant="outline"
              size="sm"
            >
              Estadísticas
            </Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeOrders.length > 0 ? (
          activeOrders.map((order) => (
            <Card key={order.id_venta} className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  Pedido #{order.id_venta}
                  {order.tipo_servicio === 'Mesa' && order.mesa_numero && (
                    <span className="ml-2 text-gray-500 text-sm">Mesa: {order.mesa_numero}</span>
                  )}
                  {order.tipo_servicio === 'Delivery' && (
                    <span className="ml-2 px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-semibold">🚚 Delivery</span>
                  )}
                  {order.tipo_servicio === 'Para Llevar' && (
                    <span className="ml-2 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">📦 Para Llevar</span>
                  )}
                </CardTitle>
                <Badge variant={getStatusVariant(order.estado || order.status || 'recibido')}>
                  {(order.estado || order.status || 'recibido').replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500">
                    {order.tipo_servicio === 'Mesa' ? 'Servicio en Mesa' : 
                     order.tipo_servicio === 'Delivery' ? 'Entrega a domicilio' : 
                     'Cliente recoge en local'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{new Date(order.fecha).toLocaleString()}</p>
                <h3 className="font-semibold mb-2">Productos:</h3>
                <ul className="list-disc pl-5 mb-4">
                  {order.productos.map((product, index) => (
                    <li key={index} className="text-sm">
                      {product.cantidad}x {product.nombre_producto} (<span translate="no">Bs</span> {product.precio_unitario.toFixed(2)})
                      {product.observaciones && <span className="text-gray-600 italic"> - {product.observaciones}</span>}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  {(order.estado || order.status) === 'recibido' && (
                    <Button 
                      onClick={() => updateStatusMutation.mutate({ saleId: (order.id_venta || order.id || '').toString(), status: 'en_preparacion' })}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? 'Actualizando...' : 'En Preparación'}
                    </Button>
                  )}
                  {(order.estado || order.status) === 'en_preparacion' && (
                    <Button 
                      onClick={() => updateStatusMutation.mutate({ saleId: (order.id_venta || order.id || '').toString(), status: 'listo_para_servir' })}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? 'Actualizando...' : 'Listo para Servir'}
                    </Button>
                  )}
                  {(order.estado || order.status) === 'listo_para_servir' && (
                    <Button 
                      onClick={() => updateStatusMutation.mutate({ saleId: (order.id_venta || order.id || '').toString(), status: 'entregado' })}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? 'Actualizando...' : 'Marcar Entregado'}
                    </Button>
                  )}
                  {(order.estado || order.status) !== 'cancelado' && (
                    <Button 
                      variant="destructive"
                      onClick={() => updateStatusMutation.mutate({ saleId: (order.id_venta || order.id || '').toString(), status: 'cancelado' })}
                      disabled={updateStatusMutation.isPending}
                    >
                      Cancelar Pedido
                    </Button>
                  )}
                </div>
                {/* Mensaje de error específico para estado inválido */}
                {updateStatusMutation.isError && updateStatusMutation.error?.response?.status === 400 && (
                  <div className="text-red-500 mt-2 text-sm">
                    {updateStatusMutation.error?.response?.data?.message || 'Error: Estado inválido o petición incorrecta.'}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-600">No hay pedidos pendientes en este momento.</p>
        )}
      </div>
    </div>
  );
}