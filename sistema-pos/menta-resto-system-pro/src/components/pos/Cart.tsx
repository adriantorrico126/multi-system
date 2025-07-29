import { CartItem } from '@/types/restaurant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}



export function Cart({ items, onUpdateQuantity, onRemoveItem, onCheckout }: CartProps) {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (items.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito de Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay productos en el carrito
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito ({items.length})
          </span>
          <Badge variant="success" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg">
            <span translate="no">Bs</span> {total.toFixed(2)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Lista de productos */}
        <div className="space-y-3 mb-4">
          {items.map((item, index) => (
            <div key={`${item.id}-${index}-${item.notes || ''}`} className="flex items-center justify-between p-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{item.name}</h4>
                {item.notes && <p className="text-xs text-muted-foreground italic">Notas: {item.notes}</p>}
                {item.modificadores && item.modificadores.length > 0 && (
                  <ul className="text-xs text-blue-700 mt-1 pl-4 list-disc">
                    {item.modificadores.map((mod, idx) => (
                      <li key={mod.id_modificador || idx}>
                        {mod.nombre_modificador} {mod.precio_extra > 0 ? `(+${mod.precio_extra})` : ''}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                  Bs {item.price} c/u
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                  className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                
                <span className="w-8 text-center text-sm font-semibold text-gray-700">
                  {item.quantity}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  className="h-8 w-8 p-0 ml-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Total y botón de checkout */}
        <div className="border-t border-gray-200/50 pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-gray-700">Total:</span>
            <span className="font-bold text-lg bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              <span translate="no">Bs</span> {total.toFixed(2)}
            </span>
          </div>
          
          <Button
            onClick={onCheckout}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            Procesar Venta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
