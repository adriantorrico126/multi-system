import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { getMesas, api } from '@/services/api';
import { SplitBillModal } from './SplitBillModal';
import { SelectMesaDestinoModal } from './SelectMesaDestinoModal';
import { EditarProductoModal } from './EditarProductoModal';
import { GrupoMesasMesero } from './GrupoMesasMesero';
import { Table, LogOut } from 'lucide-react';
import { ModalPedidoMesero } from './ModalPedidoMesero';
import { MesaProductosConTransferencia } from './MesaProductosConTransferencia';

interface Mesa {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
  id_sucursal: number;
  id_mesero_actual?: number | null;
}

export function MesasMesero({ sucursalId }: { sucursalId: number }) {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [splitMesaId, setSplitMesaId] = React.useState<number | null>(null);
  const [splitItems, setSplitItems] = React.useState<any[]>([]);
  const [splitOpen, setSplitOpen] = React.useState(false);
  const [transferItem, setTransferItem] = React.useState<{ mesaId: number, id_detalle: number } | null>(null);
  const [transferOrder, setTransferOrder] = React.useState<number | null>(null);
  const [selectMesaOpen, setSelectMesaOpen] = React.useState(false);
  const [productoEditar, setProductoEditar] = React.useState<any | null>(null);
  const [editarOpen, setEditarOpen] = React.useState(false);
  const [productosRefreshKey, setProductosRefreshKey] = React.useState(0);
  const [modalPedidoOpen, setModalPedidoOpen] = React.useState(false);
  const [mesaParaPedido, setMesaParaPedido] = React.useState<Mesa | null>(null);

  // Mesas asignadas al mesero
  const { data: mesasAsignadas = [], refetch: refetchAsignadas, isLoading: loadingAsignadas } = useQuery<Mesa[]>({
    queryKey: ['mesas-mesero-asignadas'],
    queryFn: async () => {
      const res = await api.get('/api/v1/mesas/mis-mesas');
      return res.data.data;
    },
    refetchInterval: 10000,
    enabled: !!user,
  });

  // Mesas libres de la sucursal
  const { data: mesasLibres = [], refetch: refetchLibres, isLoading: loadingLibres } = useQuery<Mesa[]>({
    queryKey: ['mesas-libres', sucursalId],
    queryFn: async () => {
      const res = await getMesas(sucursalId);
      return (res || []).filter((m: Mesa) => m.estado === 'libre');
    },
    refetchInterval: 10000,
    enabled: !!sucursalId,
  });

  // Filtrar duplicados de mesas libres por número de mesa
  const mesasLibresUnicas = React.useMemo(() => {
    const seen = new Set<number>();
    return mesasLibres.filter((mesa) => {
      if (seen.has(mesa.numero)) return false;
      seen.add(mesa.numero);
      return true;
    });
  }, [mesasLibres]);

  // Detectar duplicados
  const duplicados = mesasLibres.filter((m, i, arr) => arr.findIndex(x => x.numero === m.numero) !== i).map(m => m.numero);

  // Mutación para tomar mesa
  const asignarMesaMutation = useMutation({
    mutationFn: async (id_mesa: number) => {
      await api.post(`/api/v1/mesas/${id_mesa}/asignar`);
    },
    onSuccess: () => {
      refetchAsignadas();
      refetchLibres();
    },
  });

  // Mutación para liberar mesa
  const liberarMesaMutation = useMutation({
    mutationFn: async (id_mesa: number) => {
      await api.post(`/api/v1/mesas/${id_mesa}/liberar-mesero`);
    },
    onSuccess: () => {
      refetchAsignadas();
      refetchLibres();
    },
  });

  // Mutación para transferir ítem
  const transferirItemMutation = useMutation({
    mutationFn: async ({ id_detalle, id_mesa_destino }: { id_detalle: number, id_mesa_destino: number }) => {
      await api.post('/api/v1/mesas/transferir-item', { id_detalle, id_mesa_destino });
    },
    onSuccess: () => {
      setTransferItem(null);
      setSelectMesaOpen(false);
      refetchAsignadas();
    },
  });

  // Mutación para transferir orden
  const transferirOrdenMutation = useMutation({
    mutationFn: async ({ id_venta, id_mesa_destino }: { id_venta: number, id_mesa_destino: number }) => {
      await api.post('/api/v1/mesas/transferir-orden', { id_venta, id_mesa_destino });
    },
    onSuccess: () => {
      setTransferOrder(null);
      setSelectMesaOpen(false);
      refetchAsignadas();
    },
  });

  // Función para abrir el modal de split bill
  const handleOpenSplit = async (mesa: Mesa) => {
    // Obtener los ítems actuales de la mesa (puedes ajustar el endpoint según tu backend)
    const res = await api.get(`/api/v1/mesas/${mesa.id_mesa}/prefactura`);
    const items = (res.data?.data?.historial || []).map((item: any) => ({
      id_detalle: item.id_detalle,
      nombre_producto: item.nombre_producto,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      observaciones: item.observaciones || '',
    }));
    setSplitItems(items);
    setSplitMesaId(mesa.id_mesa);
    setSplitOpen(true);
  };

  useEffect(() => {
    refetchAsignadas();
    refetchLibres();
  }, [sucursalId]);

  return (
    <div className="p-6">
      {/* Encabezado profesional */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">¡Hola, {user.nombre}!</h1>
          <div className="text-gray-500 font-medium text-lg">Mesero en {user.sucursal?.nombre || 'Sucursal'}</div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-blue-50 rounded-xl px-4 py-2 flex flex-col items-center shadow">
            <span className="text-2xl font-bold text-blue-700">{mesasAsignadas.length}</span>
            <span className="text-xs text-blue-700 font-semibold">Mesas Asignadas</span>
          </div>
          <div className="bg-green-50 rounded-xl px-4 py-2 flex flex-col items-center shadow">
            <span className="text-2xl font-bold text-green-700">{mesasLibres.length}</span>
            <span className="text-xs text-green-700 font-semibold">Mesas Libres</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-2 flex items-center gap-1"
            onClick={logout}
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </Button>
        </div>
      </div>

      {/* Grid de mesas asignadas */}
      <h2 className="text-xl font-bold mb-4">Mis Mesas</h2>
      {loadingAsignadas ? (
        <div>Cargando mesas asignadas...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {mesasAsignadas.length === 0 && <div className="col-span-full text-gray-400">No tienes mesas asignadas.</div>}
          {mesasAsignadas.map((mesa) => (
            <div key={mesa.id_mesa} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col border border-gray-100 hover:shadow-2xl transition-all duration-200 min-h-[220px]">
              <div className="flex items-center gap-2 mb-2">
                <Table className="w-7 h-7 text-blue-500" />
                <span className="text-2xl font-extrabold text-gray-800">Mesa {mesa.numero}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-500 font-medium flex items-center gap-1"><span className="text-base">👥</span>Capacidad: {mesa.capacidad}</span>
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mb-3">En uso</span>
              <div className="flex flex-wrap gap-2 mb-2">
                <Button size="sm" variant="outline" onClick={() => liberarMesaMutation.mutate(mesa.id_mesa)} disabled={liberarMesaMutation.isPending}>Liberar</Button>
                <Button size="sm" variant="outline" onClick={() => handleOpenSplit(mesa)}>Dividir Cuenta</Button>
                <Button size="sm" variant="outline" onClick={async () => { const res = await api.get(`/api/v1/mesas/${mesa.id_mesa}/prefactura`); const id_venta = res.data?.data?.historial?.[0]?.id_venta; if (id_venta) { setTransferOrder(id_venta); setSelectMesaOpen(true); }}}>Transferir</Button>
                <Button size="sm" variant="default" onClick={() => { setMesaParaPedido(mesa); setModalPedidoOpen(true); }}>Tomar Pedido</Button>
              </div>
              <div className="mt-2">
                <div className="font-bold mb-1">Productos:</div>
                <MesaProductosConTransferencia
                  mesaId={mesa.id_mesa}
                  onTransferirItem={(id_detalle) => { setTransferItem({ mesaId: mesa.id_mesa, id_detalle }); setSelectMesaOpen(true); }}
                  onEditarProducto={(producto) => { setProductoEditar(producto); setEditarOpen(true); }}
                  onEliminarProducto={() => setProductosRefreshKey(k => k + 1)}
                  refreshKey={productosRefreshKey}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid de mesas libres (igual que antes, pero con mejor espaciado y feedback visual) */}
      <h2 className="text-xl font-bold mb-4">Mesas Libres</h2>
      {loadingLibres ? (
        <div>Cargando mesas libres...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mesasLibresUnicas.length === 0 && <div className="col-span-full text-gray-500">No hay mesas libres.</div>}
          {mesasLibresUnicas.map((mesa) => (
            <div
              key={mesa.id_mesa}
              className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-between border border-gray-100 hover:shadow-2xl transition-all duration-200 min-h-[180px]"
            >
              <div className="flex items-center gap-2 mb-2">
                <Table className="w-7 h-7 text-blue-500" />
                <span className="text-2xl font-extrabold text-gray-800">Mesa {mesa.numero}</span>
                {duplicados.includes(mesa.numero) && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">¡Duplicada!</span>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-500 font-medium flex items-center gap-1"><span className="text-base">👥</span>Capacidad: {mesa.capacidad}</span>
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 mb-3">Libre</span>
              <Button
                variant="default"
                size="lg"
                className="w-full font-bold text-base flex items-center justify-center gap-2 shadow-md hover:scale-105 transition-transform"
                onClick={() => { setMesaParaPedido(mesa); setModalPedidoOpen(true); }}
                disabled={asignarMesaMutation.isPending}
              >
                <Table className="w-5 h-5 mr-1" /> Tomar Mesa
              </Button>
            </div>
          ))}
        </div>
      )}
      <SplitBillModal
        open={splitOpen}
        onClose={() => setSplitOpen(false)}
        mesaId={splitMesaId || 0}
        items={splitItems}
        onSuccess={() => {
          setSplitOpen(false);
          refetchAsignadas();
        }}
      />
      <SelectMesaDestinoModal
        open={selectMesaOpen}
        onClose={() => { setSelectMesaOpen(false); setTransferItem(null); setTransferOrder(null); }}
        sucursalId={sucursalId}
        onSelect={(id_mesa_destino) => {
          if (transferItem) {
            transferirItemMutation.mutate({ id_detalle: transferItem.id_detalle, id_mesa_destino });
          } else if (transferOrder) {
            transferirOrdenMutation.mutate({ id_venta: transferOrder, id_mesa_destino });
          }
        }}
      />
      <EditarProductoModal
        open={editarOpen}
        onClose={() => setEditarOpen(false)}
        producto={productoEditar}
        onSuccess={() => setProductosRefreshKey(k => k + 1)}
      />
      <ModalPedidoMesero
        open={modalPedidoOpen}
        onClose={() => setModalPedidoOpen(false)}
        mesa={mesaParaPedido || { id_mesa: 0, numero: 0 }}
        sucursalId={sucursalId}
        idRestaurante={user.id_restaurante}
        idVendedor={user.id_vendedor}
        onSuccess={() => {
          setModalPedidoOpen(false);
          setMesaParaPedido(null);
          refetchAsignadas();
        }}
      />
      {/* Mostrar gestión de grupos solo para mesero */}
      {user.rol?.toString() === 'mesero' && (
        <GrupoMesasMesero sucursalId={sucursalId} idRestaurante={user.id_restaurante} />
      )}
    </div>
  );
} 