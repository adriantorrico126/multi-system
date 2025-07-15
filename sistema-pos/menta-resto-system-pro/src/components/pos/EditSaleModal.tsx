
import { useState } from 'react';
import { Sale, CartItem } from '@/types/restaurant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, X, Plus, Minus } from 'lucide-react';

const paymentMethods = ['Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia', 'Pago Móvil'];

interface EditSaleModalProps {
  sale: Sale;
  onSave: (editedSale: Sale) => void;
  onCancel: () => void;
}

export function EditSaleModal({ sale, onSave, onCancel }: EditSaleModalProps) {
  const [editedItems, setEditedItems] = useState<CartItem[]>([...sale.items]);
  const [paymentMethod, setPaymentMethod] = useState(sale.paymentMethod);
  const [notes, setNotes] = useState('');

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setEditedItems(items => items.filter(item => item.id !== id));
      return;
    }
    setEditedItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const total = editedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSave = () => {
    const editedSale: Sale = {
      ...sale,
      items: editedItems,
      total,
      paymentMethod,
      timestamp: new Date() // Actualizar timestamp para mostrar que fue editada
    };
    onSave(editedSale);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Editar Venta #{sale.id}</span>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información de la venta */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium">Cajero</Label>
              <p className="text-sm">{sale.cashier}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Sucursal</Label>
              <p className="text-sm">{sale.branch}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Fecha Original</Label>
              <p className="text-sm">{sale.timestamp.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Total Original</Label>
              <Badge variant="secondary">Bs {sale.total.toFixed(2)}</Badge>
            </div>
          </div>

          {/* Productos */}
          <div>
            <Label className="text-base font-semibold">Productos</Label>
            <div className="space-y-3 mt-2">
              {editedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">Bs {item.price} c/u</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    
                    <span className="ml-2 text-sm font-medium">
                      Bs {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <Label className="text-base font-semibold">Método de Pago</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div>
            <Label htmlFor="notes">Notas de Edición</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo de la edición..."
            />
          </div>

          {/* Nuevo total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Nuevo Total:</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-lg">
                Bs {total.toFixed(2)}
              </Badge>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              className="flex-1"
              disabled={editedItems.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
