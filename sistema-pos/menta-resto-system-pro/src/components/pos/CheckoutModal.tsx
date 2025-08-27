import { useState } from 'react';
import { CartItem, InvoiceData } from '@/types/restaurant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { paymentMethods } from '@/data/products';
import { CheckCircle, CreditCard, Printer } from 'lucide-react';
import { printService, PrintData } from '@/services/printService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

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
  const [tipoPedido, setTipoPedido] = useState<'mesa' | 'llevar' | 'delivery'>(
    mesaNumero ? 'mesa' : 'llevar'
  );
  const lockByLlevar = !mesaNumero; // Si viene sin mesa, bloquear cambio de opción
  const [clienteInfo, setClienteInfo] = useState({
    nombre: '',
    telefono: '',
    direccion: ''
  });

  const { toast } = useToast();
  const { user } = useAuth();

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleConfirm = () => {
    onConfirmSale(selectedPayment, needsInvoice ? invoiceData : undefined);
  };

  // Función para imprimir comanda
  const handleImprimirComanda = async () => {
    try {
      // Preparar datos para impresión
      const printData: PrintData = {
        id_pedido: Date.now(), // ID temporal
        mesa: tipoPedido === 'mesa' ? `Mesa ${mesaNumero}` : 
              tipoPedido === 'llevar' ? 'Para Llevar' : 'Delivery',
        mesero: user?.nombre || 'N/A',
        productos: items.map(item => ({
          cantidad: item.quantity,
          nombre: item.name,
          precio: item.price,
          notas: item.notes || ''
        })),
        total: total,
        restauranteId: user?.id_restaurante || 1
      };

      // Usar el servicio de impresión
      const success = await printService.printComanda(printData);
      
      if (success) {
        toast({
          title: "Impresión Solicitada",
          description: "La comanda ha sido enviada a la impresora.",
        });
      } else {
        toast({
          title: "Impresión en Cola",
          description: "La comanda se agregó a la cola de impresión. Se imprimirá cuando el agente esté disponible.",
        });
      }

    } catch (error) {
      console.error('Error al solicitar la impresión:', error);
      toast({
        title: "Error de Impresión",
        description: "No se pudo enviar la comanda para impresión.",
        variant: "destructive",
      });
    }
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
          {/* Tipo de Pedido */}
          <div>
            <Label className="text-base font-semibold">Tipo de Pedido</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                variant={tipoPedido === 'mesa' ? "default" : "outline"}
                onClick={() => setTipoPedido('mesa')}
                disabled={!mesaNumero || lockByLlevar}
                className="text-xs"
              >
                Mesa {mesaNumero || 'N/A'}
              </Button>
              <Button
                variant={tipoPedido === 'llevar' ? "default" : "outline"}
                onClick={() => setTipoPedido('llevar')}
                className="text-xs"
              >
                Para Llevar
              </Button>
              <Button
                variant={tipoPedido === 'delivery' ? "default" : "outline"}
                onClick={() => setTipoPedido('delivery')}
                disabled={lockByLlevar}
                className="text-xs"
              >
                Delivery
              </Button>
            </div>
          </div>

          {/* Información del Cliente (solo para Delivery). Para Llevar no solicita datos */}
          {(tipoPedido === 'delivery') && (
            <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
              <h4 className="font-semibold text-blue-800">
                Información de Entrega (Delivery)
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="clienteNombre">Nombre del Cliente</Label>
                  <Input
                    id="clienteNombre"
                    value={clienteInfo.nombre}
                    onChange={(e) => setClienteInfo({...clienteInfo, nombre: e.target.value})}
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <Label htmlFor="clienteTelefono">Teléfono</Label>
                  <Input
                    id="clienteTelefono"
                    value={clienteInfo.telefono}
                    onChange={(e) => setClienteInfo({...clienteInfo, telefono: e.target.value})}
                    placeholder="Número de teléfono"
                  />
                </div>
                <div>
                  <Label htmlFor="clienteDireccion">Dirección de Entrega</Label>
                  <Input
                    id="clienteDireccion"
                    value={clienteInfo.direccion}
                    onChange={(e) => setClienteInfo({...clienteInfo, direccion: e.target.value})}
                    placeholder="Dirección completa"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Resumen de la venta */}
          <div>
            <h3 className="font-semibold mb-3">Resumen de la Venta</h3>
            {mesaNumero && tipoPedido === 'mesa' && (
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>Mesa:</span>
                <span>{mesaNumero}</span>
              </div>
            )}
            {tipoPedido !== 'mesa' && (
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>Tipo:</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 font-medium">
                  {tipoPedido === 'llevar' ? 'Para Llevar' : 'Delivery'}
                </Badge>
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
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 font-medium">
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
            
            {/* Botón de Imprimir */}
            <Button 
              onClick={handleImprimirComanda}
              variant="outline"
              className="border-blue-300 text-blue-800 hover:bg-blue-100 font-medium"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
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
