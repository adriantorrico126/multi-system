import { useState } from 'react';
import { CartItem, InvoiceData } from '@/types/restaurant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { paymentMethods } from '@/data/products';
import { CheckCircle, CreditCard } from 'lucide-react';

interface CheckoutModalProps {
  items: CartItem[];
  onConfirmSale: (paymentMethod: string, invoiceData?: InvoiceData) => void;
  onCancel: () => void;
  mesaNumero?: number | null; // Add mesaNumero prop
}

export function CheckoutModal({ items, onConfirmSale, onCancel, mesaNumero }: CheckoutModalProps) {
  const [selectedPayment, setSelectedPayment] = useState<string>('Efectivo');
  const [needsInvoice, setNeedsInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    nit: '',
    businessName: '',
    customerName: ''
  });

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleConfirm = () => {
    onConfirmSale(selectedPayment, needsInvoice ? invoiceData : undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Procesar Venta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resumen de la venta */}
          <div>
            <h3 className="font-semibold mb-3">Resumen de la Venta</h3>
            {mesaNumero && (
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>Mesa:</span>
                <span>{mesaNumero}</span>
              </div>
            )}
            <div className="space-y-2 mb-4">
              {items.map((item, index) => (
                <div key={item.id + '-' + (item.notes || '') + '-' + index} className="flex justify-between text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  <span><span translate="no">Bs</span> {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total:</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <span translate="no">Bs</span> {total.toFixed(2)}
              </Badge>
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <Label className="text-base font-semibold">Método de Pago</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {paymentMethods.map((method) => (
                <Button
                  key={method}
                  variant={selectedPayment === method ? "default" : "outline"}
                  onClick={() => setSelectedPayment(method)}
                >
                  {method}
                </Button>
              ))}
            </div>
          </div>

          {/* Facturación */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="needsInvoice"
                checked={needsInvoice}
                onChange={(e) => setNeedsInvoice(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="needsInvoice" className="text-base font-semibold">
                Requiere Factura
              </Label>
            </div>

            {needsInvoice && (
              <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                <div>
                  <Label htmlFor="nit">NIT</Label>
                  <Input
                    id="nit"
                    value={invoiceData.nit}
                    onChange={(e) => setInvoiceData({...invoiceData, nit: e.target.value})}
                    placeholder="Ingrese el NIT"
                  />
                </div>
                <div>
                  <Label htmlFor="businessName">Razón Social</Label>
                  <Input
                    id="businessName"
                    value={invoiceData.businessName}
                    onChange={(e) => setInvoiceData({...invoiceData, businessName: e.target.value})}
                    placeholder="Ingrese la razón social"
                  />
                </div>
                <div>
                  <Label htmlFor="customerName">Nombre del Cliente (Opcional)</Label>
                  <Input
                    id="customerName"
                    value={invoiceData.customerName}
                    onChange={(e) => setInvoiceData({...invoiceData, customerName: e.target.value})}
                    placeholder="Nombre del cliente"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              className="flex-1"
              disabled={needsInvoice && (!invoiceData.nit || !invoiceData.businessName)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Venta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
