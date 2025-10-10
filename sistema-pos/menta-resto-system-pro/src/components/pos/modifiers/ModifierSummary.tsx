import React from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface SelectedModifier {
  id_modificador: number;
  nombre_modificador: string;
  precio_aplicado: number;
  cantidad: number;
}

interface ModifierSummaryProps {
  productName: string;
  productPrice: number;
  selectedModifiers: SelectedModifier[];
  total: number;
}

export function ModifierSummary({
  productName,
  productPrice,
  selectedModifiers,
  total
}: ModifierSummaryProps) {
  if (selectedModifiers.length === 0) {
    return null;
  }

  const totalModifiers = selectedModifiers.reduce((sum, mod) => 
    sum + (mod.precio_aplicado * mod.cantidad), 0
  );

  return (
    <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200">
      <h4 className="font-semibold mb-3 text-gray-700 flex items-center gap-2">
        <span className="w-2 h-2 bg-primary rounded-full"></span>
        Resumen del pedido
      </h4>
      
      <div className="space-y-2 text-sm">
        {/* Producto base */}
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">{productName}</span>
          <span className="font-semibold">Bs {productPrice.toFixed(2)}</span>
        </div>

        {/* Modificadores */}
        {selectedModifiers.length > 0 && (
          <>
            <div className="pl-4 space-y-1.5 border-l-2 border-primary/30">
              {selectedModifiers.map((modifier, index) => (
                <div key={index} className="flex justify-between text-gray-600 text-xs sm:text-sm">
                  <span className="flex-1">
                    + {modifier.nombre_modificador}
                    {modifier.cantidad > 1 && (
                      <span className="text-primary font-semibold ml-1">
                        x{modifier.cantidad}
                      </span>
                    )}
                  </span>
                  <span className="font-medium ml-2">
                    Bs {(modifier.precio_aplicado * modifier.cantidad).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 pt-1">
              <span>Subtotal modificadores:</span>
              <span>Bs {totalModifiers.toFixed(2)}</span>
            </div>
          </>
        )}

        <Separator className="my-2" />

        {/* Total */}
        <div className="flex justify-between items-center font-bold text-base sm:text-lg pt-1">
          <span className="text-gray-700">Total</span>
          <span className="text-primary text-xl">Bs {total.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}
