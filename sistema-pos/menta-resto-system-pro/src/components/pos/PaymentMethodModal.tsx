import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CreditCard, DollarSign, Smartphone, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: string) => void;
  mesaNumero: number;
  total: number;
  isLoading?: boolean;
  metodosPago?: Array<{id_pago: number, descripcion: string}>;
}

export function PaymentMethodModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  mesaNumero, 
  total, 
  isLoading = false,
  metodosPago = []
}: PaymentMethodModalProps) {
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const { toast } = useToast();

  // Log para debug
  console.log('🔍 PaymentMethodModal - metodosPago recibidos:', metodosPago);

  // Función para obtener el icono según el método de pago
  const getPaymentIcon = (descripcion: string) => {
    const descripcionLower = descripcion.toLowerCase();
    if (descripcionLower.includes('efectivo')) return Banknote;
    if (descripcionLower.includes('tarjeta') || descripcionLower.includes('crédito') || descripcionLower.includes('débito')) return CreditCard;
    if (descripcionLower.includes('transferencia')) return DollarSign;
    if (descripcionLower.includes('móvil') || descripcionLower.includes('movil')) return Smartphone;
    return DollarSign; // Icono por defecto
  };

  // Función para obtener el color según el método de pago
  const getPaymentColor = (descripcion: string) => {
    const descripcionLower = descripcion.toLowerCase();
    if (descripcionLower.includes('efectivo')) return 'bg-green-500';
    if (descripcionLower.includes('tarjeta') || descripcionLower.includes('crédito') || descripcionLower.includes('débito')) return 'bg-blue-500';
    if (descripcionLower.includes('transferencia')) return 'bg-purple-500';
    if (descripcionLower.includes('móvil') || descripcionLower.includes('movil')) return 'bg-orange-500';
    return 'bg-gray-500'; // Color por defecto
  };

  // Usar métodos de pago de la base de datos o métodos por defecto
  const paymentMethods = metodosPago.length > 0 
    ? metodosPago.map(metodo => ({
        id: metodo.descripcion.toLowerCase().replace(/\s+/g, '_'),
        name: metodo.descripcion,
        icon: getPaymentIcon(metodo.descripcion),
        color: getPaymentColor(metodo.descripcion)
      }))
    : [
        { id: 'efectivo', name: 'Efectivo', icon: Banknote, color: 'bg-green-500' },
        { id: 'tarjeta', name: 'Tarjeta', icon: CreditCard, color: 'bg-blue-500' },
        { id: 'transferencia', name: 'Transferencia', icon: DollarSign, color: 'bg-purple-500' },
        { id: 'otros', name: 'Otros', icon: DollarSign, color: 'bg-gray-500' }
      ];

  console.log('🔍 PaymentMethodModal - paymentMethods generados:', paymentMethods);

  const handleConfirm = () => {
    console.log('🔍 handleConfirm - selectedPayment:', selectedPayment);
    
    if (!selectedPayment) {
      console.log('❌ No hay método de pago seleccionado');
      toast({
        title: "Error",
        description: "Por favor selecciona un método de pago",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ Confirmando cobro con método:', selectedPayment);
    onConfirm(selectedPayment);
  };

  const handleClose = () => {
    setSelectedPayment('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Seleccionar Método de Pago
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Información de la mesa */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Mesa {mesaNumero}</p>
            <p className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</p>
          </div>

          {/* Métodos de pago */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Método de Pago</Label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <Button
                    key={method.id}
                    variant={selectedPayment === method.id ? "default" : "outline"}
                    onClick={() => {
                      console.log('🔍 Seleccionando método de pago:', method.id, method.name);
                      setSelectedPayment(method.id);
                    }}
                    className={`h-16 flex flex-col items-center gap-2 ${
                      selectedPayment === method.id 
                        ? `${method.color} text-white hover:${method.color}` 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-sm font-medium">{method.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isLoading || !selectedPayment}
            >
              {isLoading ? 'Procesando...' : 'Confirmar Cobro'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
