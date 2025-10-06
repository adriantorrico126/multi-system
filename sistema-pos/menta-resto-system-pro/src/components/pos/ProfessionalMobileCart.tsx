import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Trash,
  ChevronUp,
  ChevronDown,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { CartItem } from '@/types/restaurant';
import { useMobile } from '@/hooks/use-mobile';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface ProfessionalMobileCartProps {
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

export function ProfessionalMobileCart({ 
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
}: ProfessionalMobileCartProps) {
  const mobileInfo = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'items' | 'config'>('items');
  
  // Debug: Verificar que el componente se renderiza
  console.log('🛒 ProfessionalMobileCart renderizando:', { cartLength: cart.length, isMobile: mobileInfo.isMobile });

  // Solo mostrar en móviles
  if (!mobileInfo.isMobile) {
    return null;
  }

  // Carrito vacío - mostrar botón flotante deshabilitado
  if (cart.length === 0) {
    return (
      <div className="fixed bottom-5 right-5 z-50">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 flex items-center justify-center shadow-lg opacity-60">
          <ShoppingCart className="h-6 w-6 text-gray-400" />
        </div>
      </div>
    );
  }

  // Vaciar carrito con confirmación
  const handleClearCart = () => {
    if (window.confirm('¿Vaciar todo el carrito?')) {
      cart.forEach(item => onRemoveItem(item.id));
    }
  };

  // Componente de item del carrito
  const CartItemComponent = ({ item, index }: { item: CartItem; index: number }) => {
    const [isRemoving, setIsRemoving] = useState(false);
    const itemIdNum = Number((item as any).id_producto ?? item.id);
    const promocionesAplicadas = appliedPromociones.filter(promocion => 
      itemIdNum === promocion.id_producto
    );
    const tienePromocion = promocionesAplicadas.length > 0;

    const handleRemove = () => {
      setIsRemoving(true);
      setTimeout(() => {
        onRemoveItem(item.id);
        setIsRemoving(false);
      }, 200);
    };

    return (
      <div 
        className={`relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ${
          isRemoving ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        } ${tienePromocion ? 'ring-2 ring-green-200 bg-gradient-to-r from-green-50 to-emerald-50' : ''}`}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Badge de promoción */}
        {tienePromocion && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 shadow-lg animate-pulse">
              <Sparkles className="h-3 w-3 mr-1" />
              Promo
            </Badge>
          </div>
        )}

        <div className="p-4">
          {/* Header del item */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 pr-3">
              <h4 className={`font-bold text-base leading-tight ${tienePromocion ? 'text-green-800' : 'text-gray-800'}`}>
                {item.name}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">{item.category || 'Sin categoría'}</span>
                {item.notes && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    📝 {item.notes}
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-lg font-bold ${tienePromocion ? 'text-green-600' : 'text-gray-800'}`}>
                Bs {item.price.toFixed(2)}
              </div>
              {item.originalPrice && item.originalPrice > item.price && (
                <div className="text-sm text-gray-400 line-through">
                  Bs {item.originalPrice.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Modificadores */}
          {item.modificadores && item.modificadores.length > 0 && (
            <div className="mb-3 p-2 bg-blue-50 rounded-lg">
              <div className="text-xs text-blue-600 font-medium mb-1">Modificadores:</div>
              <div className="flex flex-wrap gap-1">
                {item.modificadores.slice(0, 3).map((mod, idx) => (
                  <span key={mod.id_modificador || idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    ✓ {mod.nombre_modificador}
                    {mod.precio_extra > 0 && ` +Bs${mod.precio_extra}`}
                  </span>
                ))}
                {item.modificadores.length > 3 && (
                  <span className="text-xs text-blue-500">+{item.modificadores.length - 3} más</span>
                )}
              </div>
            </div>
          )}

          {/* Controles de cantidad */}
          <div className="flex items-center justify-between">
            <div className="flex items-center bg-gray-50 rounded-full p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                className="h-8 w-8 p-0 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <div className="w-12 text-center">
                <span className="text-lg font-bold text-gray-800">{item.quantity}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="h-8 w-8 p-0 rounded-full hover:bg-green-100 hover:text-green-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-right">
              <div className="text-xl font-bold text-blue-600">
                Bs {(item.price * item.quantity).toFixed(2)}
              </div>
              {item.originalPrice && item.originalPrice > item.price && (
                <div className="text-sm text-green-600 font-medium">
                  Ahorras Bs {((item.originalPrice - item.price) * item.quantity).toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Botón eliminar */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar producto
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* Botón flotante del carrito */}
      <SheetTrigger asChild>
        <div className="fixed bottom-5 right-5 z-50">
          <Button
            variant="default"
            size="sm"
            className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white shadow-2xl hover:shadow-3xl border-0 relative transform hover:scale-110 active:scale-95 transition-all duration-300 touch-manipulation ring-4 ring-white/20 hover:ring-white/30"
          >
            {/* Logo del carrito mejorado */}
            <div className="relative">
              <ShoppingCart className="h-6 w-6 drop-shadow-lg" />
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-white/20 rounded-full blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            {/* Badge de cantidad mejorado */}
            {cart.length > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center animate-bounce shadow-lg border-2 border-white">
                {cart.length > 99 ? '99+' : cart.length}
              </Badge>
            )}
            
            {/* Indicador de pulso cuando hay productos */}
            {cart.length > 0 && (
              <div className="absolute inset-0 rounded-full bg-green-400/30 animate-ping"></div>
            )}
          </Button>
        </div>
      </SheetTrigger>
      
      {/* Contenido del carrito en Sheet */}
      <SheetContent 
        side="bottom" 
        className="h-[90vh] bg-white/95 backdrop-blur-sm flex flex-col [&>button]:!hidden"
      >
        <SheetHeader className="border-b border-gray-200 pb-4 flex-shrink-0">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Carrito de Compras</h2>
                <p className="text-sm text-gray-600">{cart.length} producto{cart.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Bs {total.toFixed(2)}
              </div>
              {totalDescuentos > 0 && (
                <div className="text-sm text-green-600 font-medium">
                  Ahorras Bs {totalDescuentos.toFixed(2)}
                </div>
              )}
            </div>
          </SheetTitle>
          
          {/* Pestañas */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mt-4">
            <button
              onClick={() => setActiveSection('items')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                activeSection === 'items'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              Productos ({cart.length})
            </button>
            <button
              onClick={() => setActiveSection('config')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                activeSection === 'config'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Configuración
            </button>
          </div>
        </SheetHeader>
        
        {/* Contenido principal con scroll */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 px-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 mobile-cart-scroll pb-8">
          {/* Pestaña de Productos */}
          {activeSection === 'items' && (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <CartItemComponent key={`${item.id}-${index}`} item={item} index={index} />
              ))}
            </div>
          )}
          
          {/* Pestaña de Configuración */}
          {activeSection === 'config' && (
            <div className="space-y-6">
              {/* Resumen */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                  Resumen del Pedido
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">Bs {subtotal.toFixed(2)}</span>
                  </div>
                  {totalDescuentos > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center">
                        <TrendingDown className="h-4 w-4 mr-1" />
                        Descuentos:
                      </span>
                      <span className="font-semibold">-Bs {totalDescuentos.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-lg font-bold text-gray-800">Total:</span>
                    <span className="text-xl font-bold text-green-600">Bs {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Tipo de servicio */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  <User className="h-4 w-4 inline mr-2" />
                  Tipo de Servicio
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {(config?.tiposServicio?.mesa ?? true) && (
                    <button
                      onClick={() => {
                        setTipoServicio('Mesa');
                        if (tipoServicio !== 'Mesa') setMesaNumero(null);
                      }}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                        tipoServicio === 'Mesa'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🍽️</span>
                        <div>
                          <div className="font-semibold">En Mesa</div>
                          <div className="text-sm opacity-75">Servicio en el restaurante</div>
                        </div>
                      </div>
                    </button>
                  )}
                  
                  {(config?.tiposServicio?.delivery ?? false) && (
                    <button
                      onClick={() => {
                        setTipoServicio('Delivery');
                        setMesaNumero(null);
                      }}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                        tipoServicio === 'Delivery'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🚚</span>
                        <div>
                          <div className="font-semibold">Delivery</div>
                          <div className="text-sm opacity-75">Entrega a domicilio</div>
                        </div>
                      </div>
                    </button>
                  )}
                  
                  {(config?.tiposServicio?.pickup ?? true) && (
                    <button
                      onClick={() => {
                        setTipoServicio('Para Llevar');
                        setMesaNumero(null);
                      }}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                        tipoServicio === 'Para Llevar'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">📦</span>
                        <div>
                          <div className="font-semibold">Para Llevar</div>
                          <div className="text-sm opacity-75">Recoger en el local</div>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Número de mesa */}
              {tipoServicio === 'Mesa' && (
                <div className="bg-white rounded-2xl p-4 border border-gray-200">
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Número de Mesa
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Ej: 5"
                    value={mesaNumero === null ? '' : mesaNumero}
                    onChange={(e) => setMesaNumero(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 text-lg font-semibold"
                    required
                    min="1"
                  />
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer fijo con botón de checkout */}
        <div className="border-t border-gray-200 bg-white p-3 flex-shrink-0 shadow-lg relative z-50">
          {/* Botón principal de checkout */}
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🛒 ProfessionalMobileCart: Procesar Venta clickeado');
              console.log('🛒 Cart length:', cart.length);
              console.log('🛒 Total:', total);
              console.log('🛒 Tipo servicio:', tipoServicio);
              console.log('🛒 Mesa número:', mesaNumero);
              console.log('🛒 onCheckout function:', typeof onCheckout);
              
              // Validaciones
              if (cart.length === 0) {
                alert('El carrito está vacío');
                return;
              }
              
              if (tipoServicio === 'Mesa' && !mesaNumero) {
                alert('Por favor selecciona un número de mesa');
                return;
              }
              
              // Ejecutar checkout
              try {
                onCheckout();
                setIsOpen(false);
                console.log('✅ Checkout ejecutado correctamente');
              } catch (error) {
                console.error('❌ Error en checkout:', error);
                alert('Error al procesar la venta');
              }
            }}
            disabled={cart.length === 0}
            className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-lg mb-2"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Procesar Venta - Bs {total.toFixed(2)}
          </Button>
          
          {/* Botón secundario de vaciar */}
          <Button
            variant="outline"
            onClick={handleClearCart}
            className="w-full h-10 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg font-medium text-sm"
          >
            <Trash className="h-4 w-4 mr-2" />
            Vaciar Carrito
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
