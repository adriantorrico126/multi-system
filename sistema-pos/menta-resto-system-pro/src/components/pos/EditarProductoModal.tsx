import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';

interface EditarProductoModalProps {
  open: boolean;
  onClose: () => void;
  producto: {
    id_detalle: number;
    nombre_producto: string;
    cantidad: number;
    observaciones?: string;
  } | null;
  onSuccess?: () => void;
}

export function EditarProductoModal({ open, onClose, producto, onSuccess }: EditarProductoModalProps) {
  const [cantidad, setCantidad] = useState(producto?.cantidad || 1);
  const [observaciones, setObservaciones] = useState(producto?.observaciones || '');

  React.useEffect(() => {
    setCantidad(producto?.cantidad || 1);
    setObservaciones(producto?.observaciones || '');
  }, [producto]);

  const editarMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/api/v1/mesas/detalle/${producto?.id_detalle}`, {
        cantidad,
        observaciones,
      });
    },
    onSuccess: () => {
      onClose();
      if (onSuccess) onSuccess();
    },
  });

  if (!producto) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
        </DialogHeader>
        <div className="mb-2 font-bold">{producto.nombre_producto}</div>
        <div className="mb-2">
          <label className="block text-sm font-medium mb-1">Cantidad</label>
          <Input
            type="number"
            min={1}
            value={cantidad}
            onChange={e => setCantidad(Number(e.target.value))}
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium mb-1">Observaciones</label>
          <Textarea
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            rows={2}
          />
        </div>
        <DialogFooter>
          <Button onClick={() => editarMutation.mutate()} disabled={editarMutation.isLoading}>
            Guardar Cambios
          </Button>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 