import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { Loader2 } from 'lucide-react';
import io from 'socket.io-client';

interface MesaProductosConTransferenciaProps {
  mesaId: number;
  idRestaurante: number;
  onEditarProducto: (producto: any) => void;
  onEliminarProducto: () => void;
  refreshKey?: number;
}

export function MesaProductosConTransferencia({ mesaId, idRestaurante, onEditarProducto, onEliminarProducto, refreshKey }: MesaProductosConTransferenciaProps) {
  const queryClient = useQueryClient();

  const { data: productos = [], isLoading } = useQuery<any[]>({ 
    queryKey: ['productosMesa', mesaId, refreshKey], 
    queryFn: async () => {
      const res = await api.get(`/api/v1/mesas/${mesaId}/prefactura`);
      return res.data?.data?.historial_detallado || [];
    },
    enabled: !!mesaId,
  });

  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001');
    const roomName = `restaurante_${idRestaurante}_mesa_${mesaId}`;

    socket.on('connect', () => {
      socket.emit('join_room', roomName);
    });

    socket.on('orden_actualizada', (data) => {
      if (data.id_mesa === mesaId) {
        queryClient.invalidateQueries({ queryKey: ['productosMesa', mesaId] });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [mesaId, idRestaurante, queryClient]);

  const eliminarMutation = useMutation({
    mutationFn: async (id_detalle: number) => {
      await api.delete(`/api/v1/mesas/detalle/${id_detalle}`);
    },
    onSuccess: () => {
      onEliminarProducto();
      queryClient.invalidateQueries({ queryKey: ['productosMesa', mesaId] });
    },
  });

  const getStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'info' | 'destructive' => {
    switch (status) {
      case 'entregado':
      case 'listo':
        return 'success';
      case 'pendiente':
        return 'warning';
      case 'recibido':
      case 'en_preparacion':
        return 'info';
      case 'cancelado':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (isLoading) return <div className="flex items-center justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;
  if (productos.length === 0) return <div className="text-gray-400 text-sm p-4 text-center">Sin productos</div>;

  return (
    <div className="space-y-1">
      {productos.map((item) => (
        <div key={item.id_detalle} className="flex items-center justify-between border-b py-2 hover:bg-blue-50 transition-all rounded-lg px-2">
          <div className="flex-grow flex flex-col">
            <span className="font-medium text-gray-800">{item.nombre_producto} (x{item.cantidad})</span>
            {item.observaciones && <span className="text-xs text-blue-700 font-semibold italic">{item.observaciones}</span>}
            {item.estado && (
              <Badge variant={getStatusVariant(item.estado)} className="mt-1 w-fit text-xs">
                {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
              </Badge>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0 ml-2">
            <Button size="sm" variant="outline" onClick={() => onEditarProducto(item)}>Editar</Button>
            <Button size="sm" variant="destructive_outline" onClick={() => eliminarMutation.mutate(item.id_detalle)} disabled={eliminarMutation.isPending}>Eliminar</Button>
          </div>
        </div>
      ))}
    </div>
  );
}