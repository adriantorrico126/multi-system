import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShoppingCart, Users } from 'lucide-react';

interface ConfirmarAgregarMesaOcupadaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  mesa: {
    numero: number;
    estado: string;
    total_acumulado: number;
    capacidad: number;
  };
  productos: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalNuevo: number;
}

export function ConfirmarAgregarMesaOcupada({
  isOpen,
  onClose,
  onConfirm,
  mesa,
  productos,
  totalNuevo
}: ConfirmarAgregarMesaOcupadaProps) {
  const estadoDescripcion = {
    'en_uso': 'en uso',
    'pendiente_cobro': 'pendiente de cobro',
    'libre': 'libre',
    'reservada': 'reservada',
    'mantenimiento': 'en mantenimiento'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Mesa Ocupada
          </DialogTitle>
          <DialogDescription>
            La mesa {mesa.numero} está actualmente {estadoDescripcion[mesa.estado as keyof typeof estadoDescripcion] || mesa.estado}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información de la mesa */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Mesa {mesa.numero}</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Capacidad: {mesa.capacidad} personas</p>
              <p>Estado: {estadoDescripcion[mesa.estado as keyof typeof estadoDescripcion] || mesa.estado}</p>
              <p>Total actual: ${Number(mesa.total_acumulado || 0).toFixed(2)}</p>
            </div>
          </div>

          {/* Productos a agregar */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Productos a agregar</span>
            </div>
            <div className="space-y-1">
              {productos.map((producto, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{producto.quantity}x {producto.name}</span>
                  <span className="font-medium">${(Number(producto.quantity || 0) * Number(producto.price || 0)).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-blue-200 mt-2 pt-2">
              <div className="flex justify-between font-medium text-blue-800">
                <span>Total nuevo:</span>
                <span>${Number(totalNuevo || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Mensaje de confirmación */}
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>¿Deseas agregar estos productos a la cuenta de la mesa {mesa.numero}?</strong>
            </p>
            <p className="text-xs text-orange-700 mt-1">
              Los productos se sumarán al total acumulado de la mesa.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            Sí, Agregar a la Mesa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
