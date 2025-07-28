import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';
import { CheckCircle, XCircle, Utensils, User, Table, ListPlus } from 'lucide-react';

interface Pedido {
  id_venta: number;
  id_mesa: number;
  id_vendedor: number;
  total: number;
  estado: string;
  observaciones?: string;
  created_at: string;
  // Puedes expandir con más campos si tu backend los envía
}

export function PedidosPendientesCajero({ sucursalId, idRestaurante }: { sucursalId: number, idRestaurante: number }) {
  const queryClient = useQueryClient();
  const [rechazarOpen, setRechazarOpen] = useState(false);
  const [pedidoRechazar, setPedidoRechazar] = useState<Pedido | null>(null);
  const [motivo, setMotivo] = useState('');

  // Pedidos pendientes
  const { data: pedidos = [], isLoading, refetch } = useQuery<Pedido[]>({
    queryKey: ['pedidos-pendientes', sucursalId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/ventas/pendientes-aprobacion?id_sucursal=${sucursalId}`);
      return res.data?.data || [];
    },
    refetchInterval: 10000,
    enabled: !!sucursalId,
  });

  // Aceptar pedido
  const aceptarMutation = useMutation({
    mutationFn: async (id_venta: number) => {
      await api.patch(`/api/v1/ventas/${id_venta}/aceptar`);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries(['pedidos-pendientes', sucursalId]);
    },
  });

  // Rechazar pedido
  const rechazarMutation = useMutation({
    mutationFn: async ({ id_venta, motivo }: { id_venta: number, motivo: string }) => {
      await api.patch(`/api/v1/ventas/${id_venta}/rechazar`, { motivo });
    },
    onSuccess: () => {
      setRechazarOpen(false);
      setPedidoRechazar(null);
      setMotivo('');
      refetch();
      queryClient.invalidateQueries(['pedidos-pendientes', sucursalId]);
    },
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Utensils className="w-7 h-7 text-blue-500" /> Pedidos Pendientes de Aprobación</h2>
      {isLoading ? (
        <div>Cargando pedidos...</div>
      ) : pedidos.length === 0 ? (
        <div className="text-gray-500">No hay pedidos pendientes.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pedidos.map((pedido) => (
            <Card key={pedido.id_venta} className="rounded-xl shadow-lg border border-gray-100 bg-white flex flex-col justify-between">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <Table className="w-6 h-6 text-blue-500" />
                <CardTitle className="text-lg font-bold">Mesa {pedido.id_mesa}</CardTitle>
                <Badge className="ml-auto px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Pendiente</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-gray-700"><User className="w-4 h-4" /> Mesero #{pedido.id_vendedor}</div>
                <div className="flex items-center gap-2 text-gray-700"><ListPlus className="w-4 h-4" /> Total: <span className="font-bold">${Number(pedido.total).toFixed(2)}</span></div>
                <div className="flex items-center gap-2 text-gray-500 text-xs"><span>🕒</span> {new Date(pedido.created_at).toLocaleString()}</div>
                {pedido.observaciones && <div className="text-blue-700 text-xs italic">{pedido.observaciones}</div>}
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="default" className="font-bold flex items-center gap-2" onClick={() => aceptarMutation.mutate(pedido.id_venta)} disabled={aceptarMutation.isPending}>
                    <CheckCircle className="w-4 h-4" /> Aceptar
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
            <Button onClick={() => pedidoRechazar && rechazarMutation.mutate({ id_venta: pedidoRechazar.id_venta, motivo })} disabled={rechazarMutation.isPending} className="font-bold flex items-center gap-2 text-red-700">
              <XCircle className="w-4 h-4" /> Rechazar Pedido
            </Button>
            <Button variant="outline" onClick={() => setRechazarOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 