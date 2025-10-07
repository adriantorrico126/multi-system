import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChefHat, Clock, CheckCircle, AlertCircle, Eye, Calendar, User, Package } from 'lucide-react';
import { updateOrderStatus } from '@/services/api';
// Definición local idéntica a la de POSSystem para evitar conflictos de tipos
interface Order {
  id: string;
  saleId: string;
  items: Array<{ name: string; quantity: number; notes?: string }>;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelado';
  timestamp: Date;
  table?: string;
  cashier: string;
  priority: 'normal' | 'high';
}
import { useToast } from '@/hooks/use-toast';

interface OrderManagementProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  userRole: 'cajero' | 'admin' | 'cocinero';
}

export function OrderManagement({ orders, onUpdateOrderStatus, userRole }: OrderManagementProps) {
  const [selectedStatus, setSelectedStatus] = useState<Order['status'] | 'all'>('all');
  const { toast } = useToast();
  
  // Estados para modal de información
  const [selectedOrderForInfo, setSelectedOrderForInfo] = useState<Order | null>(null);
  const [isOrderInfoDialogOpen, setIsOrderInfoDialogOpen] = useState(false);

  const openOrderInfoDialog = (order: Order) => {
    setSelectedOrderForInfo(order);
    setIsOrderInfoDialogOpen(true);
  };

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-red-700';
      case 'preparing': return 'bg-blue-600 text-white';
      case 'ready': return 'bg-green-100 text-green-700';
      case 'delivered': return 'bg-gray-100 text-gray-700';
      case 'cancelado': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'preparing': return <ChefHat className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelado': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Listo';
      case 'delivered': return 'Entregado';
      case 'cancelado': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    switch (currentStatus) {
      case 'pending': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'delivered';
      case 'delivered': return null;
      case 'cancelado': return null;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <ChefHat className="h-4 w-4 sm:h-5 sm:w-5" />
          Sistema de Comandas ({orders.length})
        </CardTitle>
        
        {/* Filtros de estado */}
        <div className="flex gap-2 flex-wrap mt-3 sm:mt-4">
          <Button
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('all')}
            className="text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Todas</span>
            <span className="sm:hidden">Todas</span> ({orders.length})
          </Button>
          <Button
            variant={selectedStatus === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('pending')}
            className={`text-xs sm:text-sm ${selectedStatus === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
          >
            <span className="hidden sm:inline">Pendientes</span>
            <span className="sm:hidden">Pend.</span> ({orders.filter(o => o.status === 'pending').length})
          </Button>
          <Button
            variant={selectedStatus === 'preparing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('preparing')}
            className={`text-xs sm:text-sm ${selectedStatus === 'preparing' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          >
            <span className="hidden sm:inline">Preparando</span>
            <span className="sm:hidden">Prep.</span> ({orders.filter(o => o.status === 'preparing').length})
          </Button>
          <Button
            variant={selectedStatus === 'ready' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('ready')}
            className="text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Listos</span>
            <span className="sm:hidden">Listos</span> ({orders.filter(o => o.status === 'ready').length})
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-6 pt-0">
        {/* Vista móvil: Cards */}
        <div className="lg:hidden space-y-3">
          {filteredOrders.map((order) => (
            <Card key={order.id} className={`hover:shadow-md transition-shadow ${order.priority === 'high' ? 'border-red-200 bg-red-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        Comanda #{order.id.slice(-6)}
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openOrderInfoDialog(order)}
                        className="p-1 h-6 w-6 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Mesa:</span>
                        <span className="text-sm font-medium text-blue-600">{order.table || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Hora:</span>
                        <span className="text-sm font-medium text-gray-600">
                          {order.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Cajero:</span>
                        <span className="text-sm font-medium text-gray-600">{order.cashier}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Estado:</span>
                        <Badge className={`${getStatusColor(order.status)} text-xs`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{getStatusText(order.status)}</span>
                        </Badge>
                      </div>
                      {order.priority === 'high' && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Prioridad:</span>
                          <Badge variant="destructive" className="text-xs">URGENTE</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Productos */}
                <div className="mb-3">
                  <span className="text-sm text-gray-600">Productos:</span>
                  <div className="mt-1 space-y-1">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium">{item.quantity}x {item.name}</span>
                        {item.notes && (
                          <div className="text-xs text-gray-500 italic">Nota: {item.notes}</div>
                        )}
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{order.items.length - 2} productos más
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col gap-2">
                  {userRole === 'cocinero' && getNextStatus(order.status) && (
                    <Button
                      size="sm"
                      onClick={() => onUpdateOrderStatus(order.id, getNextStatus(order.status)!)}
                      className="w-full text-xs"
                    >
                      {getNextStatus(order.status) === 'preparing' && 'Iniciar'}
                      {getNextStatus(order.status) === 'ready' && 'Marcar Listo'}
                      {getNextStatus(order.status) === 'delivered' && 'Entregar'}
                    </Button>
                  )}
                  {(userRole === 'admin' || userRole === 'cajero') && order.status !== 'delivered' && order.status !== 'cancelado' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full text-xs"
                      onClick={async () => {
                        if (window.confirm('¿Estás seguro de que deseas cancelar esta venta?')) {
                          try {
                            await updateOrderStatus(order.id, 'cancelado');
                            toast({ title: 'Venta cancelada', description: 'La venta ha sido cancelada exitosamente.' });
                          } catch (err) {
                            toast({ title: 'Error al cancelar', description: 'No se pudo cancelar la venta.', variant: 'destructive' });
                          }
                        }
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Vista desktop: Tabla */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comanda</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Cajero</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className={order.priority === 'high' ? 'bg-red-50' : ''}>
                    <TableCell className="font-mono text-sm">
                      #{order.id.slice(-6)}
                      {order.priority === 'high' && (
                        <Badge variant="destructive" className="ml-2 text-xs">URGENTE</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.table || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium">{item.quantity}x {item.name}</span>
                            {item.notes && (
                              <div className="text-xs text-gray-500 italic">Nota: {item.notes}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{order.cashier}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{getStatusText(order.status)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {userRole === 'cocinero' && getNextStatus(order.status) && (
                        <Button
                          size="sm"
                          onClick={() => onUpdateOrderStatus(order.id, getNextStatus(order.status)!)}
                        >
                          {getNextStatus(order.status) === 'preparing' && 'Iniciar'}
                          {getNextStatus(order.status) === 'ready' && 'Marcar Listo'}
                          {getNextStatus(order.status) === 'delivered' && 'Entregar'}
                        </Button>
                      )}
                      {(userRole === 'admin' || userRole === 'cajero') && order.status !== 'delivered' && order.status !== 'cancelado' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="ml-2"
                          onClick={async () => {
                            if (window.confirm('¿Estás seguro de que deseas cancelar esta venta?')) {
                              try {
                                await updateOrderStatus(order.id, 'cancelado');
                                toast({ title: 'Venta cancelada', description: 'La venta ha sido cancelada exitosamente.' });
                              } catch (err) {
                                toast({ title: 'Error al cancelar', description: 'No se pudo cancelar la venta.', variant: 'destructive' });
                              }
                            }
                          }}
                        >
                          Cancelar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay comandas en este estado
          </div>
        )}
      </CardContent>

      {/* Modal de información para pedidos */}
      <Dialog open={isOrderInfoDialogOpen} onOpenChange={setIsOrderInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalles del Pedido
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrderForInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Comanda</span>
                  <p className="font-medium">#{selectedOrderForInfo.id.slice(-6)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Mesa</span>
                  <p className="font-medium">{selectedOrderForInfo.table || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Hora</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {selectedOrderForInfo.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Estado</span>
                  <div className="mt-1">
                    <Badge className={`${getStatusColor(selectedOrderForInfo.status)} text-xs`}>
                      {getStatusIcon(selectedOrderForInfo.status)}
                      <span className="ml-1">{getStatusText(selectedOrderForInfo.status)}</span>
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <span className="text-gray-500">Cajero</span>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{selectedOrderForInfo.cashier}</span>
                </div>
              </div>
              
              {selectedOrderForInfo.priority === 'high' && (
                <div>
                  <span className="text-gray-500">Prioridad</span>
                  <div className="mt-1">
                    <Badge variant="destructive" className="text-xs">URGENTE</Badge>
                  </div>
                </div>
              )}
              
              <div>
                <span className="text-gray-500">Productos ({selectedOrderForInfo.items.length})</span>
                <div className="mt-2 space-y-2">
                  {selectedOrderForInfo.items.map((item, idx) => (
                    <Card key={idx} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            x{item.quantity}
                          </Badge>
                        </div>
                        {item.notes && (
                          <div className="text-sm text-gray-600 italic">
                            Nota: {item.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOrderInfoDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cerrar
            </Button>
            {selectedOrderForInfo && userRole === 'cocinero' && getNextStatus(selectedOrderForInfo.status) && (
              <Button
                variant="default"
                onClick={() => {
                  setIsOrderInfoDialogOpen(false);
                  onUpdateOrderStatus(selectedOrderForInfo.id, getNextStatus(selectedOrderForInfo.status)!);
                }}
                className="w-full sm:w-auto"
              >
                {getNextStatus(selectedOrderForInfo.status) === 'preparing' && 'Iniciar Preparación'}
                {getNextStatus(selectedOrderForInfo.status) === 'ready' && 'Marcar como Listo'}
                {getNextStatus(selectedOrderForInfo.status) === 'delivered' && 'Marcar como Entregado'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
