import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Sparkles,
  TrendingDown,
  X
} from 'lucide-react';
import { CartItem } from '@/types/restaurant';
import { useMobile } from '@/hooks/use-mobile';

interface MobileCartProps {
  cart: CartItem[];
  total: number;
  subtotal: number;
  totalDescuentos: number;
  appliedPromociones: any[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  tipoServicio: string;
  setTipoServicio: (tipo: string) => void;
  mesaNumero: number | null;
  setMesaNumero: (numero: number | null) => void;
  config?: any;
}

export function MobileCart({ 
  cart, 
  total, 
  subtotal, 
  totalDescuentos, 
  appliedPromociones,
  onUpdateQuantity, 
  onRemoveItem, 
  onCheckout,
  tipoServicio,
  setTipoServicio,
  mesaNumero,
  setMesaNumero,
  config
}: MobileCartProps) {
  // Solo mostrar en móviles
  const mobileInfo = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  
  if (!mobileInfo.isMobile) {
    return null;
  }

  if (cart.length === 0) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg"
          disabled
        >
          <ShoppingCart className="h-7 w-7 text-gray-400" />
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Botón flotante del carrito */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
                 <SheetTrigger asChild>
           <div className="fixed bottom-4 right-4 z-50">
             <Button
               variant="default"
               size="sm"
               className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl hover:shadow-2xl border-0 relative transform hover:scale-105 transition-all duration-200"
             >
               <ShoppingCart className="h-7 w-7" />
               <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] h-6 flex items-center justify-center animate-pulse">
                 {cart.length}
               </Badge>
             </Button>
           </div>
         </SheetTrigger>
        
        <SheetContent side="bottom" className="h-[85vh] bg-white/95 backdrop-blur-sm">
          <SheetHeader className="border-b border-gray-200 pb-4">
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Carrito de Compras</h2>
                  <p className="text-sm text-gray-600">{cart.length} producto{cart.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="p-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col h-full">
            {/* Lista de productos */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item, index) => {
                const itemIdNum = Number((item as any).id_producto ?? item.id);
                const promocionesAplicadas = appliedPromociones.filter(promocion => 
                  itemIdNum === promocion.id_producto
                );
                
                const tienePromocion = promocionesAplicadas.length > 0;
                
                return (
                  <div 
                    key={`${item.id}-${index}-${item.notes || ''}`} 
                    className={`relative p-3 rounded-lg transition-all duration-300 ${
                      tienePromocion 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-sm' 
                        : 'bg-white border border-gray-200 shadow-sm'
                    }`}
                  >
                    {/* Badge de Promoción */}
                    {tienePromocion && (
                      <div className="absolute -top-1 -right-1 z-10">
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-1 py-0.5 shadow-lg">
                          <Sparkles className="h-2 w-2 mr-0.5" />
                          Promo
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className={`font-semibold text-sm truncate ${tienePromocion ? 'text-green-800' : 'text-gray-800'}`}>
                            {item.name}
                          </h4>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-sm font-semibold ${tienePromocion ? 'text-green-600' : 'text-gray-600'}`}>
                              Bs {item.price}
                            </p>
                            {tienePromocion && (
                              <p className="text-xs text-green-600 font-bold">
                                -{promocionesAplicadas[0].valor}%
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Notas */}
                        {item.notes && (
                          <p className="text-xs text-gray-600 italic mb-1 bg-gray-50 px-1.5 py-0.5 rounded">
                            📝 {item.notes}
                          </p>
                        )}
                        
                        {/* Modificadores */}
                        {item.modificadores && item.modificadores.length > 0 && (
                          <div className="mb-1">
                            <ul className="text-xs text-blue-600 space-y-0.5">
                              {item.modificadores.slice(0, 2).map((mod, idx) => (
                                <li key={mod.id_modificador || idx} className="flex items-center gap-1">
                                  <span className="text-green-500">✓</span>
                                  <span className="truncate">{mod.nombre_modificador}</span>
                                  {mod.precio_extra > 0 && (
                                    <span className="text-green-600 font-medium text-xs">
                                      +Bs {mod.precio_extra}
                                    </span>
                                  )}
                                </li>
                              ))}
                              {item.modificadores.length > 2 && (
                                <li className="text-xs text-gray-500">
                                  +{item.modificadores.length - 2} más...
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      {/* Controles */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                          className="h-7 w-7 p-0 bg-white border-gray-300 shadow-sm"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="w-8 text-center text-sm font-bold text-gray-700">
                          {item.quantity}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="h-7 w-7 p-0 bg-white border-gray-300 shadow-sm"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onRemoveItem(item.id)}
                          className="h-7 w-7 p-0 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-sm"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Footer con total y opciones */}
            <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4 space-y-3">
              {/* Resumen de Total */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Subtotal:</span>
                  <span className="text-sm font-semibold text-gray-700">
                    <span translate="no">Bs</span> {subtotal.toFixed(2)}
                  </span>
                </div>
                
                {appliedPromociones.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Descuentos:
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      -<span translate="no">Bs</span> {totalDescuentos.toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                  <span className="text-base font-bold text-gray-800">Total Final:</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    <span translate="no">Bs</span> {total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Tipo de Servicio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tipo de Servicio
                </label>
                <select
                  value={tipoServicio}
                  onChange={(e) => {
                    const newTipo = e.target.value as 'Mesa' | 'Delivery' | 'Para Llevar';
                    setTipoServicio(newTipo);
                    if (newTipo !== 'Mesa') {
                      setMesaNumero(null);
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all text-sm"
                >
                  {(config?.tiposServicio?.mesa ?? true) && <option value="Mesa">🍽️ En Mesa</option>}
                  {(config?.tiposServicio?.delivery ?? false) && <option value="Delivery">🚚 Delivery</option>}
                  {(config?.tiposServicio?.pickup ?? true) && <option value="Para Llevar">📦 Para Llevar</option>}
                </select>
              </div>

              {/* Número de Mesa */}
              {tipoServicio === 'Mesa' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Número de Mesa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Ej. 5"
                    value={mesaNumero === null ? '' : mesaNumero}
                    onChange={(e) => setMesaNumero(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                    required
                    min="1"
                  />
                </div>
              )}

              {/* Botón de Checkout */}
              <Button
                onClick={() => {
                  onCheckout();
                  setIsOpen(false);
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-200 py-3 text-base font-semibold rounded-lg"
                size="lg"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Procesar Venta
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
