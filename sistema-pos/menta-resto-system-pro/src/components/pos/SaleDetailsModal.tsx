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
  Trash2,
  Sparkles,
  TrendingDown,
  Percent,
  DollarSign,
  Tag
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
  
  // Calcular subtotal si no existe
  const subtotal = sale.subtotal || sale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calcular descuentos si no existen
  const totalDescuentos = sale.totalDescuentos || 0;
  
  // Calcular total final
  const totalFinal = sale.total;

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'porcentaje': return <Percent className="h-4 w-4" />;
      case 'monto_fijo': return <DollarSign className="h-4 w-4" />;
      case 'precio_fijo': return <Tag className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'porcentaje': return 'Porcentaje';
      case 'monto_fijo': return 'Monto Fijo';
      case 'precio_fijo': return 'Precio Fijo';
      default: return tipo;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg -mt-6 -mx-6 px-6 py-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white">
                  Detalles de Venta #{sale.id}
                </DialogTitle>
                <p className="text-blue-100 font-medium">
                  Información completa y detallada de la transacción
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información General */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Receipt className="h-6 w-6 text-blue-600" />
                </div>
                Información de la Venta
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="font-semibold text-gray-700">Fecha y Hora</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {formatDate(sale.timestamp)}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="font-semibold text-gray-700">Cajero</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {sale.cashier}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Building className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="font-semibold text-gray-700">Sucursal</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {sale.branch}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <CreditCard className="h-5 w-5 text-orange-600" />
                    </div>
                    <span className="font-semibold text-gray-700">Método de Pago</span>
                  </div>
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold px-3 py-1">
                    {sale.paymentMethod}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productos */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                Productos ({totalItems} items)
                {sale.appliedPromociones && sale.appliedPromociones.length > 0 && (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold ml-2">
                    <Sparkles className="h-4 w-4 mr-1" />
                    {sale.appliedPromociones.length} Promoción{sale.appliedPromociones.length !== 1 ? 'es' : ''}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <TableRow>
                      <TableHead className="font-bold text-gray-700 text-base p-4">Producto</TableHead>
                      <TableHead className="font-bold text-gray-700 text-center text-base p-4">Cantidad</TableHead>
                      <TableHead className="font-bold text-gray-700 text-right text-base p-4">Precio Unitario</TableHead>
                      <TableHead className="font-bold text-gray-700 text-right text-base p-4">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.items.map((item, index) => {
                      // Buscar promociones aplicadas a este item
                      const promocionesAplicadas = sale.appliedPromociones?.filter(promocion => 
                        item.id_producto === promocion.id_producto || 
                        parseInt(item.id) === promocion.id_producto
                      ) || [];
                      
                      const tienePromocion = promocionesAplicadas.length > 0;
                      
                      // Calcular precio original y descuento
                      const precioOriginal = item.price;
                      let precioConDescuento = precioOriginal;
                      let descuentoAplicado = 0;
                      
                      if (tienePromocion) {
                        const promocion = promocionesAplicadas[0]; // Tomar la primera promoción
                        switch (promocion.tipo) {
                          case 'porcentaje':
                            descuentoAplicado = precioOriginal * (promocion.valor / 100);
                            precioConDescuento = precioOriginal - descuentoAplicado;
                            break;
                          case 'monto_fijo':
                            descuentoAplicado = Math.min(promocion.valor, precioOriginal);
                            precioConDescuento = precioOriginal - descuentoAplicado;
                            break;
                          case 'precio_fijo':
                            descuentoAplicado = Math.max(0, precioOriginal - promocion.valor);
                            precioConDescuento = promocion.valor;
                            break;
                        }
                      }
                      
                      return (
                        <TableRow key={index} className={`hover:bg-gray-50 transition-colors duration-200 ${tienePromocion ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500' : ''}`}>
                          <TableCell className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${tienePromocion ? 'bg-green-100' : 'bg-gray-100'}`}>
                                  <Package className={`h-5 w-5 ${tienePromocion ? 'text-green-600' : 'text-gray-600'}`} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-gray-900">{item.name}</span>
                                    {tienePromocion && (
                                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        PROMOCIÓN APLICADA
                                      </Badge>
                                    )}
                                  </div>
                                  
                            {item.notes && (
                                    <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg mt-2 border-l-2 border-l-blue-500">
                                      <span className="font-medium">Notas:</span> {item.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {tienePromocion && promocionesAplicadas.map((promocion, idx) => (
                                <div key={idx} className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-xl p-4">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-green-200 rounded-lg">
                                      {getTipoIcon(promocion.tipo)}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-bold text-green-800 text-lg">{promocion.nombre}</h4>
                                      <Badge variant="outline" className="text-green-700 border-green-400 font-medium">
                                        {getTipoLabel(promocion.tipo)}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="text-sm text-green-700 space-y-1">
                                    {promocion.tipo === 'porcentaje' && (
                                      <div className="flex items-center gap-2">
                                        <Percent className="h-4 w-4" />
                                        <span>Descuento del <span className="font-bold">{promocion.valor}%</span> sobre el precio original</span>
                                      </div>
                                    )}
                                    {promocion.tipo === 'monto_fijo' && (
                                      <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        <span>Descuento fijo de <span className="font-bold">{promocion.valor} Bs</span> por unidad</span>
                                      </div>
                                    )}
                                    {promocion.tipo === 'precio_fijo' && (
                                      <div className="flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        <span>Precio especial de <span className="font-bold">{promocion.valor} Bs</span> por unidad</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-center p-4">
                            <div className="bg-gray-100 rounded-lg px-4 py-2 inline-block">
                              <span className="text-2xl font-bold text-gray-900">{item.quantity}</span>
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-right p-4">
                            <div className="space-y-2">
                              {tienePromocion ? (
                                <>
                                  <div className="text-sm text-gray-500 line-through font-medium">
                                    Precio original: Bs{precioOriginal.toFixed(2)}
                                  </div>
                                  <div className="text-lg font-bold text-green-600">
                                    Precio con descuento: Bs{precioConDescuento.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-green-600 font-semibold bg-green-100 px-2 py-1 rounded">
                                    Ahorro: -Bs{descuentoAplicado.toFixed(2)}
                                  </div>
                                </>
                              ) : (
                                <div className="text-lg font-bold text-gray-900">
                                  Bs{precioOriginal.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                          
                          <TableCell className="text-right p-4">
                            <div className="space-y-2">
                              {tienePromocion ? (
                                <>
                                  <div className="text-sm text-gray-500 line-through font-medium">
                                    Subtotal original: Bs{(precioOriginal * item.quantity).toFixed(2)}
                                  </div>
                                  <div className="text-xl font-bold text-green-600">
                                    Subtotal con descuento: Bs{(precioConDescuento * item.quantity).toFixed(2)}
                                  </div>
                                  <div className="text-sm text-green-600 font-semibold bg-green-100 px-2 py-1 rounded">
                                    Ahorro total: -Bs{(descuentoAplicado * item.quantity).toFixed(2)}
                                  </div>
                                </>
                              ) : (
                                <div className="text-xl font-bold text-gray-900">
                                  Bs{(precioOriginal * item.quantity).toFixed(2)}
                                </div>
                              )}
                            </div>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Promociones Aplicadas */}
          {sale.appliedPromociones && sale.appliedPromociones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  Promociones Aplicadas ({sale.appliedPromociones.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sale.appliedPromociones.map((promocion, index) => {
                    // Calcular estadísticas de la promoción
                    const productosAplicados = sale.items.filter(item => 
                      item.id_producto === promocion.id_producto || 
                      parseInt(item.id) === promocion.id_producto
                    );
                    
                    const totalProductos = productosAplicados.reduce((sum, item) => sum + item.quantity, 0);
                    const totalDescuento = productosAplicados.reduce((sum, item) => {
                      let descuento = 0;
                      switch (promocion.tipo) {
                        case 'porcentaje':
                          descuento = (item.price * promocion.valor / 100) * item.quantity;
                          break;
                        case 'monto_fijo':
                          descuento = Math.min(promocion.valor, item.price) * item.quantity;
                          break;
                        case 'precio_fijo':
                          descuento = Math.max(0, item.price - promocion.valor) * item.quantity;
                          break;
                      }
                      return sum + descuento;
                    }, 0);

                    return (
                      <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-green-100 rounded-lg">
                                {getTipoIcon(promocion.tipo)}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-lg">{promocion.nombre}</h4>
                                <Badge variant="outline" className="text-green-700 border-green-300 font-medium">
                                  {getTipoLabel(promocion.tipo)}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Package className="h-4 w-4" />
                                <span>Aplica a: <span className="font-semibold text-gray-900">{promocion.nombre_producto || 'Producto no encontrado'}</span></span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="h-4 w-4" />
                                <span>Válida hasta: <span className="font-semibold text-gray-900">{new Date(promocion.fecha_fin).toLocaleDateString('es-ES', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}</span></span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-gray-600">
                                <TrendingDown className="h-4 w-4" />
                                <span>Productos con descuento: <span className="font-semibold text-gray-900">{totalProductos}</span></span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="bg-white rounded-lg p-3 border border-green-200">
                              <div className="text-2xl font-bold text-green-600 mb-1">
                                {promocion.tipo === 'porcentaje' ? `${promocion.valor}%` : `Bs ${promocion.valor}`}
                              </div>
                              <div className="text-xs text-green-600 font-medium">Descuento por unidad</div>
                              <div className="text-sm font-bold text-green-700 mt-2">
                                -Bs{totalDescuento.toFixed(2)}
                              </div>
                              <div className="text-xs text-green-600">Total ahorrado</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="text-sm font-semibold text-gray-700 mb-2">Detalles del Descuento:</div>
                          <div className="text-xs text-gray-600 space-y-1">
                            {promocion.tipo === 'porcentaje' && (
                              <div>• Descuento del {promocion.valor}% sobre el precio original</div>
                            )}
                            {promocion.tipo === 'monto_fijo' && (
                              <div>• Descuento fijo de {promocion.valor} Bs por unidad</div>
                            )}
                            {promocion.tipo === 'precio_fijo' && (
                              <div>• Precio especial de {promocion.valor} Bs por unidad</div>
                            )}
                            <div>• Aplicado a {totalProductos} producto{totalProductos !== 1 ? 's' : ''}</div>
                            <div>• Ahorro total: Bs{totalDescuento.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumen */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Receipt className="h-6 w-6 text-blue-600" />
                </div>
                Resumen de la Venta
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 shadow-sm">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <Package className="h-5 w-5 text-gray-600" />
                      Subtotal Original:
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      Bs{subtotal.toFixed(2)}
                    </span>
                  </div>
                  
                  {totalDescuentos > 0 && (
                    <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border border-green-200">
                      <span className="text-lg font-semibold text-green-700 flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-green-600" />
                        Total Descuentos:
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        -Bs{totalDescuentos.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border-2 border-green-300">
                    <span className="text-2xl font-bold text-green-800 flex items-center gap-3">
                      <Receipt className="h-7 w-7 text-green-600" />
                      Total Final:
                    </span>
                    <span className="text-3xl font-bold text-green-900">
                      Bs{totalFinal.toFixed(2)}
                  </span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
                      <div className="text-sm text-blue-700 font-medium">Productos</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{sale.items.length}</div>
                      <div className="text-sm text-purple-700 font-medium">Tipos Diferentes</div>
                    </div>
                    {sale.appliedPromociones && sale.appliedPromociones.length > 0 && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{sale.appliedPromociones.length}</div>
                        <div className="text-sm text-green-700 font-medium">Promociones Aplicadas</div>
                      </div>
                    )}
                  </div>
                </div>
                
                {totalDescuentos > 0 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-800 mb-2">
                        🎉 ¡Excelente! Ahorraste Bs{totalDescuentos.toFixed(2)}
                      </div>
                      <div className="text-sm text-green-700">
                        Gracias por aprovechar nuestras promociones
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border">
                  <span className="font-semibold">Venta #{sale.id}</span> • {totalItems} producto{totalItems !== 1 ? 's' : ''} • {formatDate(sale.timestamp)}
                </div>
                {sale.appliedPromociones && sale.appliedPromociones.length > 0 && (
                  <div className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                    <span className="font-semibold">💰 Ahorro:</span> Bs{totalDescuentos.toFixed(2)}
                  </div>
                )}
            </div>
              <div className="flex space-x-3">
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(sale.id);
                  onClose();
                }}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
              >
                <Trash2 className="h-4 w-4" />
                  Eliminar Venta
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                  className="flex items-center gap-2 border-2 hover:bg-gray-50"
              >
                  <X className="h-4 w-4" />
                Cerrar
              </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 