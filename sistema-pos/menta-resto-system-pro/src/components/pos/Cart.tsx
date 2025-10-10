import { CartItem } from '@/types/restaurant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, ShoppingCart, Tag, Sparkles, TrendingDown, CheckCircle, X } from 'lucide-react';
import { PromocionCart } from '../promociones/PromocionCart';
import { useMobile } from '@/hooks/use-mobile';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onApplyPromocion?: (promocion: any) => void;
  appliedPromociones?: any[];
}

export function Cart({ items, onUpdateQuantity, onRemoveItem, onCheckout, onApplyPromocion, appliedPromociones = [] }: CartProps) {
  const mobileInfo = useMobile();
  
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

  // Componente de carrito vacío
  const EmptyCart = () => (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Carrito Vacío</h3>
            <p className="text-gray-500 text-xs">
              Agrega productos para comenzar una venta
            </p>
          </div>
  );

  // Componente de lista de productos
  const CartItemsList = () => (
    <div className="space-y-3">
      {items.map((item, index) => {
        // Verificar si el item tiene promociones aplicadas
        const promocionesAplicadas = appliedPromociones.filter(promocion => 
          item.id_producto === promocion.id_producto || 
          promocion.tipo === 'general'
        );

        return (
          <div
            key={`${item.id}-${index}`}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg"
          >
            {/* Header del item */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight line-clamp-2">
                  {item.name}
                </h4>
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {item.category || 'Sin categoría'}
                  </span>
                  {item.notes && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      📝 {item.notes}
                    </span>
                  )}
                  {item.modificadores && item.modificadores.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                      {item.modificadores.map((mod: any, idx: number) => (
                        <span key={idx} className="text-xs text-green-600 dark:text-green-400">
                          + {mod.nombre_modificador} (Bs {parseFloat(mod.precio_extra).toFixed(2)})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Precio unitario */}
              <div className="text-right ml-3">
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Bs {Number(item.price).toFixed(2)}
                </div>
                {item.originalPrice && item.originalPrice > item.price && (
                  <div className="text-xs text-gray-500 line-through">
                    Bs {Number(item.originalPrice).toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {/* Controles de cantidad */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                  className="w-8 h-8 p-0 rounded-full hover:bg-red-50 hover:border-red-300"
                >
                  <Minus className="h-3 w-3 text-red-500" />
                </Button>
                
                <span className="font-bold text-lg w-8 text-center text-gray-900 dark:text-gray-100">
                  {item.quantity}
                </span>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 p-0 rounded-full hover:bg-green-50 hover:border-green-300"
                >
                  <Plus className="h-3 w-3 text-green-500" />
                </Button>
              </div>

              {/* Subtotal del item */}
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  Bs {(item.price * item.quantity).toFixed(2)}
                </div>
                {item.originalPrice && item.originalPrice > item.price && (
                  <div className="text-xs text-green-600">
                    Ahorras Bs {((item.originalPrice - item.price) * item.quantity).toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {/* Promociones aplicadas */}
            {promocionesAplicadas.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-yellow-600 font-medium">
                    Promociones aplicadas:
                  </span>
                </div>
                <div className="mt-1 space-y-1">
                  {promocionesAplicadas.map((promocion, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {promocion.nombre} - {promocion.descuento}% descuento
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón eliminar */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveItem(item.id)}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Componente de resumen y checkout
  const CartSummary = () => (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            Bs {subtotal.toFixed(2)}
          </span>
        </div>

        {/* Descuentos */}
        {totalDescuentos > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-600 flex items-center">
              <TrendingDown className="h-3 w-3 mr-1" />
              Descuentos:
            </span>
            <span className="font-semibold text-green-600">
              -Bs {totalDescuentos.toFixed(2)}
            </span>
          </div>
        )}

        {/* Total final */}
        <div className="flex justify-between items-center pt-3 border-t border-blue-200 dark:border-blue-800">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Total Final:</span>
          <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Bs {totalFinal.toFixed(2)}
          </span>
        </div>

        {/* Información adicional */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {items.length} producto{items.length !== 1 ? 's' : ''} en el carrito
          {appliedPromociones.length > 0 && (
            <span className="block mt-1">
              ✨ {appliedPromociones.length} promoción{appliedPromociones.length > 1 ? 'es' : ''} aplicada{appliedPromociones.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Componente de botón de checkout
  const CheckoutButton = () => (
    <Button
      onClick={onCheckout}
      disabled={items.length === 0}
      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
    >
      <CheckCircle className="h-5 w-5 mr-2" />
      Finalizar Venta
    </Button>
  );

  // Versión móvil con Sheet
  if (mobileInfo.isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl border-0"
          >
            <ShoppingCart className="h-6 w-6" />
            {items.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold">
                {items.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] bg-white/95 backdrop-blur-sm">
          <SheetHeader className="border-b border-gray-200 pb-4">
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Carrito ({items.length})
                  </h2>
                  {appliedPromociones.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Sparkles className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-yellow-600">
                        {appliedPromociones.length} promoción{appliedPromociones.length > 1 ? 'es' : ''} aplicada{appliedPromociones.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Bs {totalFinal.toFixed(2)}
                </div>
                {totalDescuentos > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-green-600">
                    <TrendingDown className="h-3 w-3" />
                    <span>Ahorras Bs {totalDescuentos.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col h-full">
            {/* Lista de productos */}
            <div className="flex-1 overflow-y-auto py-4">
              {items.length === 0 ? (
                <EmptyCart />
              ) : (
                <CartItemsList />
              )}
            </div>

            {/* Resumen y checkout */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <CartSummary />
                <CheckoutButton />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Versión desktop
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
      
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <>
        {/* Lista de productos */}
            <div className="max-h-96 overflow-y-auto">
              <CartItemsList />
                    </div>
                    
            {/* Resumen */}
            <CartSummary />

            {/* Botón de checkout */}
            <CheckoutButton />
          </>
        )}
      </CardContent>
    </Card>
  );
}
