import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getMesas } from '@/services/api';

interface SelectMesaDestinoModalProps {
  open: boolean;
  onClose: () => void;
  sucursalId: number;
  onSelect: (id_mesa: number) => void;
  excludeMesas?: number[];
}

export function SelectMesaDestinoModal({ open, onClose, sucursalId, onSelect, excludeMesas = [] }: SelectMesaDestinoModalProps) {
  const { data: mesas = [], isLoading } = useQuery({
    queryKey: ['mesas', sucursalId],
    queryFn: () => getMesas(sucursalId),
    enabled: !!sucursalId,
  });
  const [selected, setSelected] = useState<number | null>(null);

  const mesasDisponibles = mesas.filter((m: any) => !excludeMesas.includes(m.id_mesa));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Seleccionar Mesa Destino</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div>Cargando mesas...</div>
        ) : (
          <div className="space-y-2">
            {mesasDisponibles.length === 0 && <div className="text-gray-500">No hay mesas disponibles.</div>}
            {mesasDisponibles.map((mesa: any) => (
              <div key={mesa.id_mesa} className={`flex items-center gap-2 p-2 border rounded ${selected === mesa.id_mesa ? 'bg-blue-100' : ''}`}
                onClick={() => setSelected(mesa.id_mesa)}
                style={{ cursor: 'pointer' }}
              >
                <span className="font-bold">Mesa {mesa.numero}</span>
                <span className="text-xs text-gray-500">({mesa.estado})</span>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={() => selected && onSelect(selected)}
            disabled={!selected}
          >
            Confirmar
          </Button>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 