import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChefHat, Clock, CheckCircle, AlertCircle } from 'lucide-react';
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
import { toast } from 'sonner';

interface OrderManagementProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  userRole: 'cajero' | 'admin' | 'gerente' | 'cocinero';
}

export function OrderManagement({ orders, onUpdateOrderStatus, userRole }: OrderManagementProps) {
  const [selectedStatus, setSelectedStatus] = useState<Order['status'] | 'all'>('all');

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'preparing': return 'bg-blue-100 text-blue-700';
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChefHat className="h-5 w-5" />
          Sistema de Comandas ({orders.length})
        </CardTitle>
        
        {/* Filtros de estado */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('all')}
            className={selectedStatus === 'all' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            Todas ({orders.length})
          </Button>
          <Button
            variant={selectedStatus === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('pending')}
            className={selectedStatus === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
          >
            Pendientes ({orders.filter(o => o.status === 'pending').length})
          </Button>
          <Button
            variant={selectedStatus === 'preparing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('preparing')}
            className={selectedStatus === 'preparing' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            Preparando ({orders.filter(o => o.status === 'preparing').length})
          </Button>
          <Button
            variant={selectedStatus === 'ready' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('ready')}
            className={selectedStatus === 'ready' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            Listos ({orders.filter(o => o.status === 'ready').length})
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
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
                        className="bg-green-600 hover:bg-green-700"
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
                              toast.success('Venta cancelada', { description: 'La venta ha sido cancelada exitosamente.' });
                            } catch (err) {
                              toast.error('Error al cancelar', { description: 'No se pudo cancelar la venta.' });
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

        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay comandas en este estado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
