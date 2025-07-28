import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';

interface MesaProductosConTransferenciaProps {
  mesaId: number;
  onTransferirItem: (id_detalle: number) => void;
  onEditarProducto: (producto: any) => void;
  onEliminarProducto: () => void;
  refreshKey?: number;
}

export function MesaProductosConTransferencia({ mesaId, onTransferirItem, onEditarProducto, onEliminarProducto, refreshKey }: MesaProductosConTransferenciaProps) {
  const [productos, setProductos] = useState<any[]>([]);
  useEffect(() => {
    api.get(`/api/v1/mesas/${mesaId}/prefactura`).then(res => {
      setProductos(res.data?.data?.historial || []);
    });
  }, [mesaId, refreshKey]);
  const eliminarMutation = useMutation({
    mutationFn: async (id_detalle: number) => {
      await api.delete(`/api/v1/mesas/detalle/${id_detalle}`);
    },
    onSuccess: () => {
      onEliminarProducto();
    },
  });
  if (productos.length === 0) return <div className="text-gray-400 text-sm">Sin productos</div>;
  return (
    <div className="space-y-1">
      {productos.map((item) => (
        <div key={item.id_detalle} className="flex items-center justify-between border-b py-1 hover:bg-blue-50 transition-all rounded-lg px-2">
          <div className="flex flex-col">
            <span className="font-medium text-gray-800">{item.nombre_producto}</span>
            {item.observaciones && <span className="text-xs text-blue-700 font-semibold italic">{item.observaciones}</span>}
            {/* Si hay modificadores, mostrarlos aquí como badges */}
            {item.modificadores && item.modificadores.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {item.modificadores.map((mod: any, idx: number) => (
                  <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-0.5 font-semibold">{mod.nombre_modificador}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => onTransferirItem(item.id_detalle)}>Transferir</Button>
            <Button size="sm" variant="outline" onClick={() => onEditarProducto(item)}>Editar</Button>
            <Button size="sm" variant="outline" onClick={() => eliminarMutation.mutate(item.id_detalle)} disabled={eliminarMutation.isPending}>Eliminar</Button>
          </div>
        </div>
      ))}
    </div>
  );
} 