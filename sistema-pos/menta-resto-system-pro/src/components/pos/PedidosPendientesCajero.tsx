import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, User, ShoppingCart, UtensilsCrossed, AlertCircle, RefreshCw, DollarSign } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPedidosPendientesAprobacion, aprobarPedidoMesero, rechazarPedidoMesero } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

interface PedidoPendiente {
  id_venta: number;
  fecha: string;
  total: number;
  tipo_servicio: string;
  mesa_numero?: number;
  estado: string;
  nombre_mesero: string;
  username_mesero: string;
  productos: Array<{
    id_producto: number;
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
    observaciones?: string;
    modificadores?: Array<{ nombre: string; precio_adicional: number }>;
  }>;
}

export const PedidosPendientesCajero = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // DEBUG: Log user info
  useEffect(() => {
    console.log('🔍 PedidosPendientesCajero: User info:', {
      id: user?.id,
      username: user?.username,
      rol: user?.rol,
      id_restaurante: user?.id_restaurante,
      sucursal: user?.sucursal
    });
  }, [user]);

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoPendiente | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showRechazarDialog, setShowRechazarDialog] = useState(false);

  const { data: pedidosPendientes = [], isLoading, isFetching, refetch } = useQuery<PedidoPendiente[]>({
    queryKey: ['pedidos-pendientes-aprobacion'],
    queryFn: async () => {
      console.log('🔍 PedidosPendientesCajero: Llamando a getPedidosPendientesAprobacion');
      try {
        const result = await getPedidosPendientesAprobacion();
        console.log('🔍 PedidosPendientesCajero: Resultado de API:', result);
        return result;
      } catch (error) {
        console.error('❌ PedidosPendientesCajero: Error en API:', error);
        throw error;
      }
    },
    refetchInterval: 15000,
    staleTime: 10000,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  // Verificar y limpiar los datos de pedidosPendientes
  const pedidosPendientesLimpios = useMemo(() => {
    if (!Array.isArray(pedidosPendientes)) {
      console.warn('pedidosPendientes no es un array:', pedidosPendientes);
      return [];
    }
    
    return pedidosPendientes.filter(pedido => {
      // Verificar que el pedido tenga las propiedades necesarias
      if (!pedido || typeof pedido !== 'object') {
        console.warn('Pedido inválido:', pedido);
        return false;
      }
      
      // Verificar que total sea un número válido
      if (typeof pedido.total !== 'number' || isNaN(pedido.total)) {
        console.warn('Total inválido en pedido:', pedido.id_venta, pedido.total);
        return false;
      }
      
      // Verificar que productos sea un array
      if (!Array.isArray(pedido.productos)) {
        console.warn('Productos no es un array en pedido:', pedido.id_venta);
        return false;
      }
      
      return true;
    });
  }, [pedidosPendientes]);

  const aprobarMutation = useMutation({
    mutationFn: aprobarPedidoMesero,
    onSuccess: (data) => {
      toast({
        title: "✅ Pedido Aprobado",
        description: `El pedido #${data.id_venta} ha sido aprobado y enviado a cocina.`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['pedidos-pendientes-aprobacion'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
    },
    onError: (error: any) => {
      console.error("Error approving order:", error);
      toast({
        title: "❌ Error al Aprobar Pedido",
        description: error.response?.data?.message || "No se pudo aprobar el pedido. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const rechazarMutation = useMutation({
    mutationFn: ({ ventaId, motivo }: { ventaId: number; motivo: string }) =>
      rechazarPedidoMesero(ventaId, motivo),
    onSuccess: (data) => {
      toast({
        title: "🚫 Pedido Rechazado",
        description: `El pedido #${data.id_venta} ha sido rechazado.`,
        variant: "default",
      });
      setShowRechazarDialog(false);
      setMotivoRechazo('');
      setPedidoSeleccionado(null);
      queryClient.invalidateQueries({ queryKey: ['pedidos-pendientes-aprobacion'] });
    },
    onError: (error: any) => {
      console.error("Error rejecting order:", error);
      toast({
        title: "❌ Error al Rechazar Pedido",
        description: error.response?.data?.message || "No se pudo rechazar el pedido. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleAprobar = useCallback((pedido: PedidoPendiente) => {
    aprobarMutation.mutate(pedido.id_venta);
  }, [aprobarMutation]);

  const handleRechazar = useCallback((pedido: PedidoPendiente) => {
    setPedidoSeleccionado(pedido);
    setMotivoRechazo('');
    setShowRechazarDialog(true);
  }, []);

  const confirmarRechazo = useCallback(() => {
    if (pedidoSeleccionado) {
      rechazarMutation.mutate({
        ventaId: pedidoSeleccionado.id_venta,
        motivo: motivoRechazo.trim() || 'Sin motivo especificado'
      });
    }
  }, [pedidoSeleccionado, motivoRechazo, rechazarMutation]);

  // --- Renderizado del componente ---

  if (isLoading && !isFetching) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950 z-[9999]">
        <div className="text-center p-8 bg-card rounded-xl shadow-2xl animate-fade-in-up">
          <div className="relative">
            <Clock className="h-20 w-20 text-blue-500 dark:text-blue-400 mx-auto mb-6 animate-spin-slow transform rotate-15" />
            <div className="absolute inset-0 m-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse-light"></div>
          </div>
          <h3 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 mb-3 drop-shadow-md">
            Cargando Pedidos Pendientes...
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Obteniendo las últimas solicitudes de los meseros.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Por favor, espera un momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    // Contenedor principal que ocupa todo el ancho y alto disponible, sin max-w externo
    // Se ajusta el padding para que el contenido no se pegue tanto a los bordes.
    <div className="w-full h-full p-6 lg:p-8 flex flex-col items-center dark:bg-gray-900 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 animate-fade-in overflow-y-auto custom-scrollbar">
      {/* Contenedor centralizado para el contenido, pero que no limita el ancho horizontalmente */}
      <div className="w-full flex flex-col items-center">
        {/* Header Principal con diseño más pulido */}
        <div className="text-center mb-8 p-6 bg-card rounded-xl shadow-2xl border border-border dark:border-gray-700 w-full max-w-4xl transform transition-all duration-300 hover:scale-[1.01] hover:shadow-3xl relative overflow-hidden">
          {/* Fondo sutil con gradiente */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-xl blur-lg opacity-50 z-0"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-4 shadow-lg animate-bounce-in">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-orange-600 via-red-600 to-purple-600 bg-clip-text text-transparent mb-3 drop-shadow-md animate-fade-in-down">
              Pedidos Pendientes de Aprobación
            </h1>
            <p className="text-base text-gray-700 dark:text-gray-300 mb-5">
              Una vista rápida y eficiente para aprobar o rechazar pedidos de meseros.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2 text-lg font-semibold rounded-full shadow-md animate-pop-in">
                {pedidosPendientesLimpios.length} pedido{pedidosPendientesLimpios.length !== 1 ? 's' : ''} pendiente{pedidosPendientesLimpios.length !== 1 ? 's' : ''}
              </Badge>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900 transition-all duration-300 relative overflow-hidden group"
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                <span className="relative z-10 group-hover:text-blue-800 dark:group-hover:text-blue-300">
                  {isFetching ? 'Actualizando...' : 'Actualizar Lista'}
                </span>
                <span className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
              </Button>
            </div>
          </div>
        </div>

        {/* Métricas en Cards - Ahora ocupan el ancho completo del contenedor central, hasta un max de 6xl */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full max-w-6xl px-4"> {/* Aumentado a max-w-6xl y añadido px-4 */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950 dark:to-blue-900 dark:border-blue-700 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{pedidosPendientesLimpios.length}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Pendientes</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950 dark:to-green-900 dark:border-green-700 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {pedidosPendientesLimpios.filter(p => p.tipo_servicio === 'Mesa').length}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Pedidos Mesa</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                  <UtensilsCrossed className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950 dark:to-purple-900 dark:border-purple-700 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {pedidosPendientesLimpios.filter(p => p.tipo_servicio !== 'Mesa').length}
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Para Llevar</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 dark:from-orange-950 dark:to-orange-900 dark:border-orange-700 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                    Bs {pedidosPendientesLimpios.reduce((total, p) => total + (Number(p.total) || 0), 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Total Valor</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-md">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Contenido Principal: Lista de Pedidos o Mensaje de Éxito */}
        {pedidosPendientesLimpios.length === 0 ? (
          <div className="flex items-center justify-center w-full max-w-2xl animate-fade-in-up px-4"> {/* Se mantiene max-w-2xl para el mensaje de éxito para que no sea demasiado ancho */}
            <Card className="w-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800 shadow-2xl transform transition-all duration-300 hover:scale-[1.01] hover:shadow-3xl">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-6 shadow-lg animate-scale-in">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-4">
                  ¡Excelente trabajo!
                </h3>
                <p className="text-lg text-green-600 dark:text-green-400 mb-4">
                  No hay pedidos pendientes de aprobación en este momento.
                </p>
                <p className="text-green-500 dark:text-green-500 text-sm italic">
                  Todos los pedidos han sido procesados correctamente. Relájate un momento.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-5 w-5 animate-pulse" />
                  <span className="font-semibold text-base">Sistema actualizado</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Las tarjetas de pedido individual ahora ocupan todo el ancho disponible, pero con un padding razonable.
          // max-w-full asegura que se adapten al 100% de su contenedor padre, evitando scrolls horizontales innecesarios.
          <div className="w-full max-w-full space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar animate-fade-in px-4">
            {pedidosPendientesLimpios.map((pedido) => (
              <Card key={pedido.id_venta} className="bg-card border-border dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 border-b border-orange-200 dark:border-orange-800 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-md group-hover:rotate-6 transition-transform duration-300">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                          Pedido #<span className="font-extrabold">{pedido.id_venta}</span>
                        </CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium">{dayjs(pedido.fecha).format('dddd, D [de] MMMM [de] YYYY')}</span>
                          <span className="mx-1">•</span>
                          <span className="font-mono text-xs">{dayjs(pedido.fecha).format('HH:mm A')}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent drop-shadow-sm">
                        Bs {(Number(pedido.total) || 0).toFixed(2)}
                      </p>
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white mt-1 text-xs px-3 py-1 rounded-full shadow-sm">
                        Pendiente de Aprobación
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 bg-background dark:bg-gray-850">
                  {/* Información del mesero */}
                  <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors duration-200">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Mesero</p>
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                        {pedido.nombre_mesero} <span className="text-gray-500 dark:text-gray-400 text-xs">({pedido.username_mesero})</span>
                      </p>
                    </div>
                  </div>

                  {/* Información del servicio */}
                  <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700 transition-colors duration-200">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                      {pedido.tipo_servicio === 'Mesa' ? (
                        <UtensilsCrossed className="h-4 w-4 text-white" />
                      ) : (
                        <ShoppingCart className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Tipo de Servicio</p>
                      <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                        {pedido.tipo_servicio}
                        {pedido.mesa_numero && <span className="ml-1 text-gray-600 dark:text-gray-400 font-normal"> - Mesa #{pedido.mesa_numero}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Sección de Productos - Ajustado para mejor visualización */}
                  <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2 text-sm">
                      <ShoppingCart className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      Productos del Pedido ({pedido.productos.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2"> {/* Aumentado max-h y añadido scrollbar */}
                      {pedido.productos.map((producto, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 shadow-sm">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                              {producto.cantidad}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-800 dark:text-gray-100 text-sm truncate">
                                {producto.nombre_producto}
                              </p>
                              {producto.observaciones && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 italic truncate">
                                  "Notas: {producto.observaciones}"
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-2 flex-shrink-0">
                            <p className="text-sm font-bold text-green-700 dark:text-green-300">
                              Bs {((Number(producto.cantidad) || 0) * (Number(producto.precio_unitario) || 0)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-5"> {/* Cambiado a flex-col en móviles, sm:flex-row en desktop */}
                    <Button
                      onClick={() => handleAprobar(pedido)}
                      disabled={aprobarMutation.isPending}
                      className="w-full h-11 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      {aprobarMutation.isPending ? 'Aprobando...' : 'Aprobar Pedido'}
                    </Button>
                    <Button
                      onClick={() => handleRechazar(pedido)}
                      disabled={rechazarMutation.isPending}
                      variant="destructive"
                      className="w-full h-11 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      {rechazarMutation.isPending ? 'Rechazando...' : 'Rechazar Pedido'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog para rechazar pedido - Mejorado */}
        <Dialog open={showRechazarDialog} onOpenChange={setShowRechazarDialog}>
          <DialogContent className="max-w-md p-6 bg-card dark:bg-gray-800 rounded-lg shadow-2xl border border-border dark:border-gray-700 animate-scale-in">
            <DialogHeader className="pb-4 border-b border-border dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Rechazar Pedido <span className="text-red-500">#{pedidoSeleccionado?.id_venta}</span></DialogTitle>
                  <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Estás a punto de rechazar este pedido. Por favor, indica el motivo.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="motivo" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Motivo del rechazo <span className="text-xs text-gray-500">(opcional, pero recomendado)</span>
                </Label>
                <Textarea
                  id="motivo"
                  placeholder="Ej: Producto agotado, error en el pedido, información incompleta..."
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  className="mt-1 min-h-[80px] bg-input dark:bg-gray-700 border-border dark:border-gray-600 focus-visible:ring-ring focus-visible:border-ring text-gray-800 dark:text-gray-200"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 p-2 bg-yellow-50 dark:bg-yellow-950 rounded-md border border-yellow-200 dark:border-yellow-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Esta acción no se puede deshacer una vez confirmada.</span>
              </div>
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:gap-3 pt-4 border-t border-border dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRechazarDialog(false);
                  setMotivoRechazo('');
                  setPedidoSeleccionado(null);
                }}
                className="w-full sm:w-auto text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmarRechazo}
                disabled={rechazarMutation.isPending}
                className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold shadow-md transition-all duration-300"
              >
                {rechazarMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Rechazando...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" /> Confirmar Rechazo
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};