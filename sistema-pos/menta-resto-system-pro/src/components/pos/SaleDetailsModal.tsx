import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Receipt, 
  User, 
  Building, 
  CreditCard, 
  Package, 
  Calendar, 
  Clock,
  X,
  Edit,
  Trash2
} from 'lucide-react';
import { Sale } from '@/types/restaurant';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SaleDetailsModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (saleId: string) => void;
}

export function SaleDetailsModal({ sale, isOpen, onClose, onDelete }: SaleDetailsModalProps) {
  if (!sale) return null;

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: es });
  };

  const calculateSubtotal = (price: number, quantity: number) => {
    return price * quantity;
  };

  const totalItems = sale.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Detalles de Venta #{sale.id}
                </DialogTitle>
                <p className="text-sm text-gray-600">
                  Información completa de la transacción
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5" />
                Información de la Venta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Fecha y Hora</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(sale.timestamp)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Cajero</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {sale.cashier}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="h-4 w-4" />
                    <span className="font-medium">Sucursal</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {sale.branch}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-medium">Método de Pago</span>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {sale.paymentMethod}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Productos ({totalItems} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-medium text-gray-700">Producto</TableHead>
                      <TableHead className="font-medium text-gray-700 text-right">Cantidad</TableHead>
                      <TableHead className="font-medium text-gray-700 text-right">Precio Unit.</TableHead>
                      <TableHead className="font-medium text-gray-700 text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.items.map((item, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div>
                            <div className="text-gray-900">{item.name}</div>
                            {item.notes && (
                              <div className="text-xs text-gray-500 mt-1">
                                {item.notes}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right text-gray-600">
                          Bs{item.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          Bs{calculateSubtotal(item.price, item.quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5" />
                Resumen de la Venta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-green-800">Total Final:</span>
                  <span className="text-2xl font-bold text-green-900">
                    Bs{sale.total.toFixed(2)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-green-700">
                  {totalItems} producto{totalItems !== 1 ? 's' : ''} • {sale.items.length} tipo{sale.items.length !== 1 ? 's' : ''} diferente{sale.items.length !== 1 ? 's' : ''}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Venta #{sale.id} • {totalItems} producto{totalItems !== 1 ? 's' : ''} • {formatDate(sale.timestamp)}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(sale.id);
                  onClose();
                }}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 