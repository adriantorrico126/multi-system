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
  onConfirmSale: (paymentMethod: string, invoiceData?: InvoiceData, additionalData?: any) => void;
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
  
  // Nuevos estados para pago diferido
  const [tipoPago, setTipoPago] = useState<'anticipado' | 'diferido'>('anticipado');
  const [observacionesPago, setObservacionesPago] = useState<string>('');

  const { toast } = useToast();
  const { user } = useAuth();

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleConfirm = () => {
    // Preparar datos adicionales para pago diferido
    const additionalData = {
      tipo_pago: tipoPago,
      observaciones_pago: tipoPago === 'diferido' ? observacionesPago : null
    };
    
    onConfirmSale(selectedPayment, needsInvoice ? invoiceData : undefined, additionalData);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            Procesar Venta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6 pt-0">
          {/* Tipo de Pedido */}
          <div>
            <Label className="text-sm sm:text-base font-semibold">Tipo de Pedido</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              <Button
                variant={tipoPedido === 'mesa' ? "default" : "outline"}
                onClick={() => setTipoPedido('mesa')}
                disabled={!mesaNumero || lockByLlevar}
                className="text-xs sm:text-sm h-10 sm:h-auto"
              >
                Mesa {mesaNumero || 'N/A'}
              </Button>
              <Button
                variant={tipoPedido === 'llevar' ? "default" : "outline"}
                onClick={() => setTipoPedido('llevar')}
                className="text-xs sm:text-sm h-10 sm:h-auto"
              >
                Para Llevar
              </Button>
              <Button
                variant={tipoPedido === 'delivery' ? "default" : "outline"}
                onClick={() => setTipoPedido('delivery')}
                disabled={lockByLlevar}
                className="text-xs sm:text-sm h-10 sm:h-auto"
              >
                Delivery
              </Button>
            </div>
          </div>

          {/* Información del Cliente (solo para Delivery). Para Llevar no solicita datos */}
          {(tipoPedido === 'delivery') && (
            <div className="space-y-3 p-3 sm:p-4 border rounded-lg bg-blue-50">
              <h4 className="font-semibold text-blue-800 text-sm sm:text-base">
                Información de Entrega (Delivery)
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="clienteNombre" className="text-xs sm:text-sm">Nombre del Cliente</Label>
                  <Input
                    id="clienteNombre"
                    value={clienteInfo.nombre}
                    onChange={(e) => setClienteInfo({...clienteInfo, nombre: e.target.value})}
                    placeholder="Nombre completo"
                    className="text-xs sm:text-sm h-8 sm:h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="clienteTelefono" className="text-xs sm:text-sm">Teléfono</Label>
                  <Input
                    id="clienteTelefono"
                    value={clienteInfo.telefono}
                    onChange={(e) => setClienteInfo({...clienteInfo, telefono: e.target.value})}
                    placeholder="Número de teléfono"
                    className="text-xs sm:text-sm h-8 sm:h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="clienteDireccion" className="text-xs sm:text-sm">Dirección de Entrega</Label>
                  <Input
                    id="clienteDireccion"
                    value={clienteInfo.direccion}
                    onChange={(e) => setClienteInfo({...clienteInfo, direccion: e.target.value})}
                    placeholder="Dirección completa"
                    className="text-xs sm:text-sm h-8 sm:h-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Resumen de la venta */}
          <div>
            <h3 className="font-semibold mb-3 text-sm sm:text-base">Resumen de la Venta</h3>
            {mesaNumero && tipoPedido === 'mesa' && (
              <div className="flex justify-between text-xs sm:text-sm font-medium mb-2">
                <span>Mesa:</span>
                <span>{mesaNumero}</span>
              </div>
            )}
            {tipoPedido !== 'mesa' && (
              <div className="flex justify-between text-xs sm:text-sm font-medium mb-2">
                <span>Tipo:</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 font-medium text-xs">
                  {tipoPedido === 'llevar' ? 'Para Llevar' : 'Delivery'}
                </Badge>
              </div>
            )}
            <div className="space-y-2 mb-4">
              {items.map((item, index) => (
                <div key={item.id + '-' + (item.notes || '') + '-' + index} className="flex justify-between text-xs sm:text-sm">
                  <span className="flex-1 min-w-0 mr-2">{item.name} x{item.quantity}</span>
                  <span className="font-medium whitespace-nowrap"><span translate="no">Bs</span> {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold text-sm sm:text-base">
              <span>Total:</span>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 font-medium text-xs sm:text-sm">
                <span translate="no">Bs</span> {total.toFixed(2)}
              </Badge>
            </div>
          </div>

          {/* Tipo de Pago */}
          <div>
            <Label className="text-sm sm:text-base font-semibold">Tipo de Pago</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <Button
                variant={tipoPago === 'anticipado' ? "default" : "outline"}
                onClick={() => setTipoPago('anticipado')}
                className="flex items-center gap-2 text-xs sm:text-sm h-10 sm:h-auto"
              >
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                Pago Anticipado
              </Button>
              <Button
                variant={tipoPago === 'diferido' ? "default" : "outline"}
                onClick={() => setTipoPago('diferido')}
                className="flex items-center gap-2 text-xs sm:text-sm h-10 sm:h-auto"
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                Pago al Final
              </Button>
            </div>
            
            {tipoPago === 'diferido' && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs sm:text-sm text-yellow-800 font-medium mb-2">
                  💡 Información sobre Pago Diferido
                </p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• El cliente pagará al finalizar el consumo</li>
                  <li>• Se registrará el método de pago cuando se cobre</li>
                  <li>• El pedido se procesará normalmente</li>
                </ul>
                <div className="mt-2">
                  <Label htmlFor="observacionesPago" className="text-xs font-medium">
                    Observaciones (opcional)
                  </Label>
                  <Input
                    id="observacionesPago"
                    value={observacionesPago}
                    onChange={(e) => setObservacionesPago(e.target.value)}
                    placeholder="Ej: Cliente conocido, pagará con tarjeta..."
                    className="text-xs h-8 sm:h-10"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Método de pago - Solo mostrar si es pago anticipado */}
          {tipoPago === 'anticipado' && (
            <div>
              <Label className="text-sm sm:text-base font-semibold">Método de Pago</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {paymentMethods.map((method) => (
                  <Button
                    key={method}
                    variant={selectedPayment === method ? "default" : "outline"}
                    onClick={() => setSelectedPayment(method)}
                    className="text-xs sm:text-sm h-10 sm:h-auto"
                  >
                    {method}
                  </Button>
                ))}
              </div>
            </div>
          )}

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
              <Label htmlFor="needsInvoice" className="text-sm sm:text-base font-semibold">
                Requiere Factura
              </Label>
            </div>

            {needsInvoice && (
              <div className="space-y-3 p-3 sm:p-4 border rounded-lg bg-gray-50">
                <div>
                  <Label htmlFor="nit" className="text-xs sm:text-sm">NIT</Label>
                  <Input
                    id="nit"
                    value={invoiceData.nit}
                    onChange={(e) => setInvoiceData({...invoiceData, nit: e.target.value})}
                    placeholder="Ingrese el NIT"
                    className="text-xs sm:text-sm h-8 sm:h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="businessName" className="text-xs sm:text-sm">Razón Social</Label>
                  <Input
                    id="businessName"
                    value={invoiceData.businessName}
                    onChange={(e) => setInvoiceData({...invoiceData, businessName: e.target.value})}
                    placeholder="Ingrese la razón social"
                    className="text-xs sm:text-sm h-8 sm:h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="customerName" className="text-xs sm:text-sm">Nombre del Cliente (Opcional)</Label>
                  <Input
                    id="customerName"
                    value={invoiceData.customerName}
                    onChange={(e) => setInvoiceData({...invoiceData, customerName: e.target.value})}
                    placeholder="Nombre del cliente"
                    className="text-xs sm:text-sm h-8 sm:h-10"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1 h-10 sm:h-auto text-xs sm:text-sm">
              Cancelar
            </Button>
            
            {/* Botón de Imprimir */}
            <Button 
              onClick={handleImprimirComanda}
              variant="outline"
              className="border-blue-300 text-blue-800 hover:bg-blue-100 font-medium h-10 sm:h-auto text-xs sm:text-sm"
            >
              <Printer className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Imprimir</span>
              <span className="sm:hidden">Impr.</span>
            </Button>
            
            <Button 
              onClick={handleConfirm}
              className="flex-1 h-10 sm:h-auto text-xs sm:text-sm"
              disabled={needsInvoice && (!invoiceData.nit || !invoiceData.businessName)}
            >
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Confirmar Venta</span>
              <span className="sm:hidden">Confirmar</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
