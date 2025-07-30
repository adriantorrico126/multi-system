import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { aceptarPedidoMesero, rechazarPedidoMesero, getPedidosMeseroPendientes } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, XCircle, Utensils, User, Table, ListPlus, Clock } from 'lucide-react';

interface PedidosMeseroCajeroProps {
  sucursalId?: number;
  idRestaurante?: number;
}

export const PedidosMeseroCajero: React.FC<PedidosMeseroCajeroProps> = (props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rechazarOpen, setRechazarOpen] = useState(false);
  const [pedidoRechazar, setPedidoRechazar] = useState<any | null>(null);
  const [motivo, setMotivo] = useState('');

  const sucursalId = props.sucursalId ?? user?.sucursal?.id;
  const idRestaurante = props.idRestaurante ?? user?.id_restaurante;

  const { data: pedidos = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['pedidos-mesero', sucursalId, idRestaurante],
    queryFn: () => getPedidosMeseroPendientes(sucursalId, idRestaurante),
    enabled: !!sucursalId && !!idRestaurante,
    refetchInterval: 10000,
  });

  // Mutaciones para aprobar y rechazar
  const aprobarMutation = useMutation({
    mutationFn: async (id_venta: number) => {
      await aceptarPedidoMesero(id_venta);
    },
    onSuccess: () => {
      toast({ title: 'Pedido aprobado', description: 'El pedido fue aprobado y enviado a cocina.' });
      refetch();
      queryClient.invalidateQueries(['pedidos-mesero', sucursalId, idRestaurante]);
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo aprobar el pedido.', variant: 'destructive' });
    }
  });

  const rechazarMutation = useMutation({
    mutationFn: async ({ id_venta, motivo }: { id_venta: number, motivo: string }) => {
      await rechazarPedidoMesero(id_venta, motivo);
    },
    onSuccess: () => {
      toast({ title: 'Pedido rechazado', description: 'El pedido fue rechazado correctamente.' });
      setRechazarOpen(false);
      setPedidoRechazar(null);
      setMotivo('');
      refetch();
      queryClient.invalidateQueries(['pedidos-mesero', sucursalId, idRestaurante]);
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo rechazar el pedido.', variant: 'destructive' });
    }
  });

  return (
    <div className="p-6 w-full h-full flex flex-col items-center bg-gradient-to-br from-blue-50/80 via-white/80 to-blue-100/60 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Utensils className="w-7 h-7 text-blue-500" /> Pedidos de Mesero</h2>
      <p className="text-gray-500 text-lg mb-8 text-center max-w-xl">
        Aquí se muestran los pedidos enviados por los meseros y pendientes de validación. El cajero puede aprobar o rechazar estos pedidos antes de enviarlos a cocina y registrarlos como venta.
      </p>
      {isLoading ? (
        <div className="text-gray-400 text-lg">Cargando pedidos...</div>
      ) : isError ? (
        <div className="text-red-500 text-lg mb-4">Error al cargar pedidos. <button onClick={() => refetch()} className="underline">Reintentar</button></div>
      ) : pedidos.length === 0 ? (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 shadow-inner w-full max-w-2xl text-center text-gray-400">
          No hay pedidos pendientes de mesero en este momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {pedidos.map((pedido: any) => (
            <Card key={pedido.id_venta || pedido.id} className="rounded-2xl shadow-xl border border-blue-100/60 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md hover:scale-[1.02] transition-transform duration-200">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <Table className="w-6 h-6 text-blue-500" />
                <CardTitle className="text-lg font-bold">Mesa {pedido.mesa_numero || pedido.id_mesa || '-'}</CardTitle>
                <Badge className="ml-auto px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 animate-pulse">{pedido.estado || 'Pendiente'}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200"><User className="w-4 h-4" /> {pedido.mesero_nombre || pedido.mesero || `Mesero #${pedido.id_vendedor || '-'}`}</div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200"><ListPlus className="w-4 h-4" /> Total: <span className="font-bold">Bs {Number(pedido.total || 0).toFixed(2)}</span></div>
                <div className="flex items-center gap-2 text-gray-500 text-xs"><Clock className="w-4 h-4" /> {pedido.fecha ? new Date(pedido.fecha).toLocaleTimeString() : (pedido.created_at ? new Date(pedido.created_at).toLocaleTimeString() : '-')}</div>
                {pedido.observaciones && <div className="text-blue-700 dark:text-blue-300 text-xs italic">{pedido.observaciones}</div>}
                {/* Detalles de productos si están disponibles */}
                {pedido.items && Array.isArray(pedido.items) && pedido.items.length > 0 && (
                  <div className="mt-2 bg-blue-50/60 dark:bg-gray-800/60 rounded-lg p-2">
                    <div className="font-semibold text-xs text-blue-900 dark:text-blue-200 mb-1">Productos:</div>
                    <ul className="text-xs text-gray-700 dark:text-gray-200 space-y-1">
                      {pedido.items.map((item: any, idx: number) => (
                        <li key={`item-${idx}`} className="flex justify-between">
                          <span>{item.nombre || item.name} x{item.cantidad || item.quantity}</span>
                          <span>Bs {Number(item.precio_unitario || item.price).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="default" className="font-bold flex items-center gap-2 bg-green-500 text-white hover:bg-green-600 shadow-md" onClick={() => aprobarMutation.mutate(pedido.id_venta || pedido.id)} disabled={aprobarMutation.isPending}>
                    <CheckCircle className="w-4 h-4" /> Aprobar
                  </Button>
                  <Button size="sm" variant="outline" className="font-bold flex items-center gap-2 text-red-700 border-red-300 hover:bg-red-50 hover:border-red-500" onClick={() => { setPedidoRechazar(pedido); setRechazarOpen(true); }}>
                    <XCircle className="w-4 h-4" /> Rechazar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Modal para motivo de rechazo */}
      <Dialog open={rechazarOpen} onOpenChange={setRechazarOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Motivo de Rechazo</DialogTitle>
          </DialogHeader>
          <Textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Motivo del rechazo (opcional)" rows={3} />
          <DialogFooter>
            <Button onClick={() => pedidoRechazar && rechazarMutation.mutate({ id_venta: pedidoRechazar.id_venta || pedidoRechazar.id, motivo })} disabled={rechazarMutation.isPending} className="font-bold flex items-center gap-2 text-red-700">
              <XCircle className="w-4 h-4" /> Rechazar Pedido
            </Button>
            <Button variant="outline" onClick={() => setRechazarOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 