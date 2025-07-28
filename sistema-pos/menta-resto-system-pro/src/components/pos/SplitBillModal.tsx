import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';

interface Item {
  id_detalle: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  observaciones?: string;
}

interface SplitBillModalProps {
  open: boolean;
  onClose: () => void;
  mesaId: number;
  items: Item[];
  onSuccess?: () => void;
}

export function SplitBillModal({ open, onClose, mesaId, items, onSuccess }: SplitBillModalProps) {
  const [subcuentas, setSubcuentas] = useState<{ [key: string]: number[] }>({ 1: items.map(i => i.id_detalle) });
  const [nextSubcuenta, setNextSubcuenta] = useState(2);

  // Mover ítem a otra subcuenta
  const moverItem = (id_detalle: number, subcuenta: string) => {
    setSubcuentas(prev => {
      const nuevo = { ...prev };
      // Quitar de todas las subcuentas
      Object.keys(nuevo).forEach(key => {
        nuevo[key] = nuevo[key].filter(id => id !== id_detalle);
      });
      // Agregar a la subcuenta destino
      nuevo[subcuenta] = [...(nuevo[subcuenta] || []), id_detalle];
      return nuevo;
    });
  };

  // Agregar nueva subcuenta
  const agregarSubcuenta = () => {
    setSubcuentas(prev => ({ ...prev, [nextSubcuenta]: [] }));
    setNextSubcuenta(n => n + 1);
  };

  // Mutación para dividir cuenta
  const splitBillMutation = useMutation({
    mutationFn: async () => {
      // Construir asignaciones
      const asignaciones: { id_detalle: number; subcuenta: string }[] = [];
      Object.entries(subcuentas).forEach(([sub, ids]) => {
        ids.forEach(id => asignaciones.push({ id_detalle: id, subcuenta: sub }));
      });
      await api.post(`/api/v1/mesas/${mesaId}/split-bill`, { asignaciones });
    },
    onSuccess: () => {
      onClose();
      if (onSuccess) onSuccess();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Dividir Cuenta (Split Bill)</DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <Button variant="outline" onClick={agregarSubcuenta}>Agregar Subcuenta</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(subcuentas).map(([sub, ids]) => (
            <div key={sub} className="border rounded-lg p-3">
              <div className="font-bold mb-2">Subcuenta {sub}</div>
              {items.filter(i => ids.includes(i.id_detalle)).length === 0 && <div className="text-gray-400 text-sm">Sin ítems</div>}
              {items.filter(i => ids.includes(i.id_detalle)).map(item => (
                <div key={item.id_detalle} className="flex items-center justify-between border-b py-1">
                  <div>
                    <span className="font-medium">{item.nombre_producto}</span> x{item.cantidad}
                    {item.observaciones && <span className="ml-2 text-xs text-gray-500">({item.observaciones})</span>}
                  </div>
                  <select
                    value={sub}
                    onChange={e => moverItem(item.id_detalle, e.target.value)}
                    className="ml-2 border rounded px-2 py-1 text-xs"
                  >
                    {Object.keys(subcuentas).map(key => (
                      <option key={key} value={key}>Subcuenta {key}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            onClick={() => splitBillMutation.mutate()}
            disabled={splitBillMutation.isLoading}
          >
            Confirmar División
          </Button>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 