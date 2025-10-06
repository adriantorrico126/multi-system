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
  X,
  Package,
  Settings,
  Trash
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
  const [activeTab, setActiveTab] = useState<'productos' | 'configuracion'>('productos');
  
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
               className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl hover:shadow-2xl border-0 relative transform hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
             >
               <ShoppingCart className="h-7 w-7" />
               {cart.length > 0 && (
                 <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] h-6 flex items-center justify-center animate-pulse">
                   {cart.length}
                 </Badge>
               )}
             </Button>
           </div>
         </SheetTrigger>
        
        <SheetContent 
          side="bottom" 
          className="h-[90vh] bg-white/95 backdrop-blur-sm flex flex-col [&>button]:!hidden"
        >
          <SheetHeader className="border-b border-gray-200 pb-4 flex-shrink-0">
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
                onClick={() => {
                  if (cart.length > 0) {
                    if (window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
                      // Vaciar carrito
                      cart.forEach(item => onRemoveItem(item.id));
                    }
                  } else {
                    setIsOpen(false);
                  }
                }}
                className={`p-2 rounded-lg transition-colors ${
                  cart.length > 0 
                    ? 'hover:bg-red-50 hover:text-red-600 text-red-500' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={cart.length > 0 ? "Vaciar carrito" : "Cerrar carrito"}
              >
                {cart.length > 0 ? (
                  <Trash className="h-5 w-5" />
                ) : (
                  <X className="h-5 w-5" />
                )}
              </Button>
            </SheetTitle>
            
            {/* Pestañas */}
            <div className="flex space-x-1 mt-4">
              <Button
                variant={activeTab === 'productos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('productos')}
                className={`flex-1 justify-start space-x-2 ${
                  activeTab === 'productos' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Package className="h-4 w-4" />
                <span className="font-medium">Productos</span>
                <Badge className="ml-auto bg-white/20 text-white text-xs">
                  {cart.length}
                </Badge>
              </Button>
              
              <Button
                variant={activeTab === 'configuracion' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('configuracion')}
                className={`flex-1 justify-start space-x-2 ${
                  activeTab === 'configuracion' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span className="font-medium">Configuración</span>
              </Button>
            </div>
          </SheetHeader>
          
          {/* Contenido principal con scroll */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 px-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 mobile-cart-scroll pb-8">
            {/* Pestaña de Productos */}
            {activeTab === 'productos' && (
              <div className="space-y-3">
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
                      } ${index === cart.length - 1 ? 'mb-4' : ''}`}
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
                        
                        {/* Controles mejorados para táctil */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                            className="h-8 w-8 p-0 bg-white border-gray-300 shadow-sm touch-manipulation active:scale-95 transition-transform duration-150"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <span className="w-8 text-center text-sm font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded">
                            {item.quantity}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 p-0 bg-white border-gray-300 shadow-sm touch-manipulation active:scale-95 transition-transform duration-150"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onRemoveItem(item.id)}
                            className="h-8 w-8 p-0 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-sm touch-manipulation active:scale-95 transition-transform duration-150"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Pestaña de Configuración */}
            {activeTab === 'configuracion' && (
              <div className="space-y-4">
                {/* Resumen de Total */}
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200 space-y-3">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Resumen del Pedido</h3>
                  <div className="space-y-2">
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
                    
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-base font-bold text-gray-800">Total Final:</span>
                      <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        <span translate="no">Bs</span> {total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tipo de Servicio */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              </div>
            )}
          </div>
          
          {/* Footer fijo con botón de checkout */}
          <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4 flex-shrink-0 mobile-cart-footer">
            {/* Botón de Checkout */}
            <Button
              onClick={() => {
                onCheckout();
                setIsOpen(false);
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-200 py-4 text-base font-semibold rounded-lg transform hover:scale-[1.02]"
              size="lg"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Procesar Venta - <span translate="no">Bs</span> {total.toFixed(2)}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
