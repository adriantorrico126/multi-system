import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { useMutation } from '@tanstack/react-query';
import { Plus, CheckCircle, XCircle, Search, Utensils, ListPlus } from 'lucide-react';

interface Producto {
  id_producto: number;
  nombre: string;
  precio: number;
  categoria?: string;
  modificadores?: any[];
}

interface Mesa {
  id_mesa: number;
  numero: number;
}

interface ModalPedidoMeseroProps {
  open: boolean;
  onClose: () => void;
  mesa: Mesa;
  sucursalId: number;
  idRestaurante: number;
  idVendedor: number;
  onSuccess?: () => void;
}

export function ModalPedidoMesero({ open, onClose, mesa, sucursalId, idRestaurante, idVendedor, onSuccess }: ModalPedidoMeseroProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [pedido, setPedido] = useState<any[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [categoria, setCategoria] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Cargar productos
  useEffect(() => {
    api.get(`/api/v1/productos?id_restaurante=${idRestaurante}`).then(res => {
      setProductos(res.data?.data || []);
    });
  }, [idRestaurante]);

  // Filtrar productos
  const productosFiltrados = productos.filter(p =>
    (!categoria || p.categoria === categoria) &&
    (!busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // Añadir producto al pedido
  const agregarProducto = (producto: Producto) => {
    setPedido(prev => {
      const existente = prev.find((p: any) => p.id_producto === producto.id_producto);
      if (existente) {
        return prev.map((p: any) =>
          p.id_producto === producto.id_producto ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      }
      return [...prev, { ...producto, cantidad: 1, observaciones: '', modificadores: [] }];
    });
  };

  // Modificar cantidad, observaciones, modificadores
  const actualizarItem = (id_producto: number, cambios: any) => {
    setPedido(prev => prev.map((p: any) =>
      p.id_producto === id_producto ? { ...p, ...cambios } : p
    ));
  };

  // Eliminar producto del pedido
  const eliminarItem = (id_producto: number) => {
    setPedido(prev => prev.filter((p: any) => p.id_producto !== id_producto));
  };

  // Calcular total
  const total = pedido.reduce((acc, item) => acc + item.cantidad * item.precio, 0);

  // Enviar pedido
  const crearPedidoMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/v1/ventas/pedido-mesero', {
        id_mesa: mesa.id_mesa,
        id_sucursal: sucursalId,
        id_restaurante: idRestaurante,
        id_vendedor: idVendedor,
        items: pedido.map(({ id_producto, cantidad, precio, observaciones, modificadores }) => ({
          id_producto, cantidad, precio_unitario: precio, observaciones, modificadores
        })),
        observaciones,
      });
    },
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Pedido enviado al cajero correctamente.' });
      setPedido([]);
      setObservaciones('');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1200);
    },
    onError: () => {
      setFeedback({ type: 'error', message: 'Error al enviar el pedido. Intenta de nuevo.' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Utensils className="w-6 h-6 text-blue-500" /> Tomar Pedido - Mesa {mesa.numero}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sección productos */}
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input placeholder="Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
            <div className="max-h-64 overflow-y-auto grid grid-cols-1 gap-2">
              {productosFiltrados.map(producto => (
                <div key={producto.id_producto} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 shadow-sm">
                  <div>
                    <span className="font-semibold text-gray-800">{producto.nombre}</span>
                    <span className="ml-2 text-gray-500 font-medium">${Number(producto.precio).toFixed(2)}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => agregarProducto(producto)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {productosFiltrados.length === 0 && <div className="text-gray-400 text-sm">Sin productos</div>}
            </div>
          </div>
          {/* Sección pedido */}
          <div className="flex-1 min-w-[220px]">
            <div className="font-bold mb-2 flex items-center gap-2"><ListPlus className="w-5 h-5 text-blue-500" /> Pedido</div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pedido.map(item => (
                <div key={item.id_producto} className="flex flex-col bg-white rounded-lg border p-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{item.nombre}</span>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => actualizarItem(item.id_producto, { cantidad: Math.max(1, item.cantidad - 1) })}>-</Button>
                      <span className="mx-2 font-bold">{item.cantidad}</span>
                      <Button size="sm" variant="outline" onClick={() => actualizarItem(item.id_producto, { cantidad: item.cantidad + 1 })}>+</Button>
                      <Button size="sm" variant="ghost" onClick={() => eliminarItem(item.id_producto)}><XCircle className="w-4 h-4 text-red-400" /></Button>
                    </div>
                  </div>
                  <Textarea
                    className="mt-1"
                    placeholder="Observaciones (ej: sin cebolla, extra queso)"
                    value={item.observaciones || ''}
                    onChange={e => actualizarItem(item.id_producto, { observaciones: e.target.value })}
                    rows={1}
                  />
                  {/* Aquí podrías agregar selección de modificadores si tu sistema los soporta */}
                </div>
              ))}
              {pedido.length === 0 && <div className="text-gray-400 text-sm">Agrega productos al pedido</div>}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <label className="font-semibold">Observaciones generales</label>
              <Textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2} placeholder="Observaciones generales para el pedido" />
            </div>
            <div className="mt-4 flex items-center justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Button
              className="mt-4 w-full font-bold flex items-center gap-2"
              size="lg"
              variant="default"
              onClick={() => crearPedidoMutation.mutate()}
              disabled={pedido.length === 0 || crearPedidoMutation.isPending}
            >
              <CheckCircle className="w-5 h-5" /> Enviar a cajero
            </Button>
            {feedback && (
              <div className={`mt-2 text-center font-semibold ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{feedback.message}</div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 