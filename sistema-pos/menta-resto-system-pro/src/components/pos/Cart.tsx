import { CartItem } from '@/types/restaurant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, ShoppingCart, Tag, Sparkles, TrendingDown, CheckCircle } from 'lucide-react';
import { PromocionCart } from '../promociones/PromocionCart';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onApplyPromocion?: (promocion: any) => void;
  appliedPromociones?: any[];
}

export function Cart({ items, onUpdateQuantity, onRemoveItem, onCheckout, onApplyPromocion, appliedPromociones = [] }: CartProps) {
  // Calcular subtotal usando originalPrice y total usando price (con descuentos)
  const subtotal = items.reduce((sum, item) => {
    const originalPrice = item.originalPrice || item.price;
    return sum + (originalPrice * item.quantity);
  }, 0);
  
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calcular descuentos como la diferencia entre subtotal y total
  const totalDescuentos = subtotal - total;

  // El total ya incluye los descuentos aplicados
  const totalFinal = total;

  if (items.length === 0) {
    return (
      <Card className="w-full bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <div className="p-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">Carrito de Compras</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Carrito Vacío</h3>
            <p className="text-gray-500 text-xs">
              Agrega productos para comenzar una venta
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-800">
                Carrito ({items.length})
              </span>
              {appliedPromociones.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-yellow-600 font-medium">
                    {appliedPromociones.length} promoción{appliedPromociones.length > 1 ? 'es' : ''} aplicada{appliedPromociones.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              <span translate="no">Bs</span> {totalFinal.toFixed(2)}
            </div>
            {totalDescuentos > 0 && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingDown className="h-3 w-3" />
                <span>Ahorras Bs {totalDescuentos.toFixed(2)}</span>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Lista de productos */}
        <div className="space-y-2">
          {items.map((item, index) => {
            // Verificar si el item tiene promociones aplicadas
            const promocionesAplicadas = appliedPromociones.filter(promocion => 
              item.id_producto === promocion.id_producto || 
              parseInt(item.id) === promocion.id_producto
            );
            
            const tienePromocion = promocionesAplicadas.length > 0;
            
            return (
              <div 
                key={`${item.id}-${index}-${item.notes || ''}`} 
                className={`relative p-3 rounded-lg transition-all duration-300 ${
                  tienePromocion 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-md' 
                    : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Indicador de promoción */}
                {tienePromocion && (
                  <div className="absolute -top-1 -right-1 z-10">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-1.5 py-0.5 shadow-lg">
                      <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                      Promo
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className={`font-semibold text-xs ${tienePromocion ? 'text-green-800' : 'text-gray-800'}`}>
                        {item.name}
                      </h4>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          {tienePromocion && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500 line-through">
                                Bs {item.originalPrice || item.price}
                              </span>
                              <span className="text-xs font-semibold text-green-600">
                                Bs {item.price}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className={`text-xs font-semibold ${tienePromocion ? 'text-green-600' : 'text-gray-600'}`}>
                          Bs {item.price} c/u
                        </p>
                      </div>
                    </div>
                    
                    {/* Notas del producto */}
                    {item.notes && (
                      <p className="text-xs text-gray-600 italic mb-1 bg-gray-50 px-1.5 py-0.5 rounded">
                        📝 {item.notes}
                      </p>
                    )}
                    
                    {/* Modificadores */}
                    {item.modificadores && item.modificadores.length > 0 && (
                      <div className="mb-1">
                        <p className="text-xs font-medium text-blue-700 mb-0.5">Modificadores:</p>
                        <ul className="text-xs text-blue-600 space-y-0.5">
                          {item.modificadores.map((mod, idx) => (
                            <li key={mod.id_modificador || idx} className="flex items-center gap-1">
                              <CheckCircle className="h-2.5 w-2.5" />
                              {mod.nombre_modificador}
                              {mod.precio_extra > 0 && (
                                <span className="text-green-600 font-medium">
                                  (+Bs {mod.precio_extra})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Información de promoción aplicada */}
                    {tienePromocion && (
                      <div className="mt-1 p-1.5 bg-green-100 rounded border border-green-200">
                        <div className="flex items-center gap-1">
                          <Tag className="h-2.5 w-2.5 text-green-600" />
                          <span className="text-xs font-medium text-green-700">
                            {promocionesAplicadas[0].nombre} - {promocionesAplicadas[0].valor}% descuento
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Controles de cantidad */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                      className="h-6 w-6 p-0 bg-white/90 backdrop-blur-sm border-gray-300 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </Button>
                    
                    <span className="w-6 text-center text-xs font-bold text-gray-700">
                      {item.quantity}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="h-6 w-6 p-0 bg-white/90 backdrop-blur-sm border-gray-300 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="h-6 w-6 p-0 ml-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Promociones aplicables */}
        {items.length > 0 && onApplyPromocion && (
          <div className="border-t border-gray-200/50 pt-3">
            <PromocionCart 
              cartItems={items} 
              onApplyPromocion={onApplyPromocion}
            />
          </div>
        )}
        
        {/* Resumen de totales */}
        <div className="border-t border-gray-200/50 pt-3 space-y-2">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">Subtotal:</span>
              <span className="text-xs font-semibold text-gray-700">
                <span translate="no">Bs</span> {subtotal.toFixed(2)}
              </span>
            </div>
            
            {totalDescuentos > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                  <TrendingDown className="h-2.5 w-2.5" />
                  Descuentos:
                </span>
                <span className="text-xs font-semibold text-green-600">
                  -<span translate="no">Bs</span> {totalDescuentos.toFixed(2)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-1 border-t border-gray-200">
              <span className="text-sm font-bold text-gray-800">Total Final:</span>
              <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                <span translate="no">Bs</span> {totalFinal.toFixed(2)}
              </span>
            </div>
          </div>
          
          <Button
            onClick={onCheckout}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-200 py-2 text-sm font-semibold"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Procesar Venta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
