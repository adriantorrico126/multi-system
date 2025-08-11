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
import { Table, LogOut, Users, Loader2, Wand2, ArrowRight, ClipboardList, RefreshCw, Clock, DollarSign, Trash2 } from 'lucide-react';
import { ModalPedidoMesero } from './ModalPedidoMesero';
import { MesaProductosConTransferencia } from './MesaProductosConTransferencia';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
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

  const isAdminOrCajero = user.rol === 'admin' || user.rol === 'cajero' || user.rol === 'super_admin' || user.rol === 'mesero';

  async function eliminarMesasDuplicadas() {
    try {
      await api.delete(`/api/v1/mesas/duplicadas?id_sucursal=${sucursalId}`);
      toast({ title: 'Mesas duplicadas eliminadas', description: 'Se limpiaron mesas duplicadas libres en la sucursal.' });
      // refrescar listas
      queryClient.invalidateQueries({ queryKey: ['mesas-mesero-asignadas'] });
      queryClient.invalidateQueries({ queryKey: ['mesas-libres', sucursalId] });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.response?.data?.message || 'No se pudo limpiar mesas duplicadas.', variant: 'destructive' });
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Encabezado unificado */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 drop-shadow-sm">
          Sistema de Gestión de Mesas
        </h1>
        <p className="mt-2 text-sm md:text-base text-gray-600 max-w-3xl">
          Visualiza el estado de las mesas en tiempo real, gestiona órdenes y realiza acciones como liberar, transferir o dividir cuentas.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { queryClient.invalidateQueries({ queryKey: ['mesas-mesero-asignadas'] }); queryClient.invalidateQueries({ queryKey: ['mesas-libres', sucursalId] }); }}>
            <RefreshCw className="w-4 h-4" /> Refrescar Mesas
          </Button>
          {isAdminOrCajero && (
            <Button variant="outline" size="sm" className="gap-2" onClick={eliminarMesasDuplicadas} title="Eliminar mesas duplicadas (libres)">
              <Trash2 className="w-4 h-4 text-red-600" /> Limpiar Duplicadas
            </Button>
          )}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            <Card className="bg-white/70 backdrop-blur border border-blue-200/50 shadow-sm">
              <CardContent className="px-4 py-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">{user.sucursal?.nombre || 'Sucursal'}</span>
              </CardContent>
            </Card>
            <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={logout} title="Cerrar sesión">
              <LogOut className="w-4 h-4" /> Salir
            </Button>
          </div>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-blue-700">Mesas Asignadas</div>
              <div className="text-2xl font-bold text-blue-900">{mesasAsignadas.length}</div>
            </div>
            <Users className="w-6 h-6 text-blue-600" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/50 shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-emerald-700">Mesas Libres</div>
              <div className="text-2xl font-bold text-emerald-900">{mesasLibres.length}</div>
            </div>
            <Table className="w-6 h-6 text-emerald-600" />
          </CardContent>
        </Card>
      </div>

      {/* Grid de mesas asignadas */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Mis Mesas</h2>
      {loadingAsignadas ? (
        <div className="flex items-center gap-2 text-gray-600 mb-8"><Loader2 className="w-4 h-4 animate-spin" /> Cargando mesas asignadas...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {mesasAsignadas.length === 0 && (
            <Card className="col-span-full bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
              <CardContent className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                <ClipboardList className="w-8 h-8 text-gray-400" />
                No tienes mesas asignadas.
              </CardContent>
            </Card>
          )}
          {mesasAsignadas.map((mesa) => (
            <Card key={mesa.id_mesa} className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Table className="w-6 h-6 text-indigo-600" />
                  <span className="text-xl font-extrabold text-gray-900">Mesa {mesa.numero}</span>
                </div>
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <span className="font-medium flex items-center gap-1"><span className="text-base">👥</span>Capacidad: {mesa.capacidad}</span>
                </div>
                <Badge className="mb-3 bg-blue-100 text-blue-700">En uso</Badge>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Button size="sm" variant="outline" onClick={() => liberarMesaMutation.mutate(mesa.id_mesa)} disabled={liberarMesaMutation.isPending}>Liberar</Button>
                  <Button size="sm" variant="outline" onClick={() => handleOpenSplit(mesa)}>
                    <Wand2 className="w-4 h-4 mr-1" /> Dividir
                  </Button>
                  <Button size="sm" variant="outline" onClick={async () => { const res = await api.get(`/api/v1/mesas/${mesa.id_mesa}/prefactura`); const id_venta = res.data?.data?.historial?.[0]?.id_venta; if (id_venta) { setTransferOrder(id_venta); setSelectMesaOpen(true); } else { toast({ title: 'Sin venta activa', description: 'No se encontró una venta activa para transferir.', variant: 'destructive' }); } }}>
                    Transferir <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                  <Button size="sm" variant="default" onClick={() => { setMesaParaPedido(mesa); setModalPedidoOpen(true); }}>Tomar Pedido</Button>
                </div>
                <div className="mt-2">
                  <div className="font-bold mb-1">Productos</div>
                  <MesaProductosConTransferencia
                    mesaId={mesa.id_mesa}
                    onTransferirItem={(id_detalle) => { setTransferItem({ mesaId: mesa.id_mesa, id_detalle }); setSelectMesaOpen(true); }}
                    onEditarProducto={(producto) => { setProductoEditar(producto); setEditarOpen(true); }}
                    onEliminarProducto={() => setProductosRefreshKey(k => k + 1)}
                    refreshKey={productosRefreshKey}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Grid de mesas libres */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Mesas Libres</h2>
      {loadingLibres ? (
        <div className="flex items-center gap-2 text-gray-600"><Loader2 className="w-4 h-4 animate-spin" /> Cargando mesas libres...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mesasLibresUnicas.length === 0 && (
            <Card className="col-span-full bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
              <CardContent className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                <ClipboardList className="w-8 h-8 text-gray-400" />
                No hay mesas libres.
              </CardContent>
            </Card>
          )}
          {mesasLibresUnicas.map((mesa) => (
            <Card
              key={mesa.id_mesa}
              className="bg-gradient-to-br from-white to-emerald-50 border border-emerald-200/60 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <CardContent className="p-5 flex flex-col items-center justify-between min-h-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <Table className="w-6 h-6 text-emerald-600" />
                  <span className="text-xl font-extrabold text-gray-800">Mesa {mesa.numero}</span>
                  {duplicados.includes(mesa.numero) && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">¡Duplicada!</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <span className="font-medium flex items-center gap-1"><span className="text-base">👥</span>Capacidad: {mesa.capacidad}</span>
                </div>
                <Badge className="mb-3 bg-green-100 text-green-700">Libre</Badge>
                <Button
                  variant="default"
                  size="lg"
                  className="w-full font-bold text-base flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition-transform"
                  onClick={() => { setMesaParaPedido(mesa); setModalPedidoOpen(true); }}
                  disabled={asignarMesaMutation.isPending}
                >
                  <Table className="w-5 h-5 mr-1" /> Tomar Mesa
                </Button>
              </CardContent>
            </Card>
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