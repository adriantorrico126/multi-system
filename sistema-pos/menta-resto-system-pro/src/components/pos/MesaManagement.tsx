import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { 
  getMesas, 
  abrirMesa, 
  cerrarMesa, 
  liberarMesa,
  agregarProductosAMesa, 
  generarPrefactura,
  getEstadisticasMesas,
  cerrarMesaConFactura
} from '@/services/api';
import { Mesa, Prefactura, HistorialMesa, EstadisticasMesas } from '@/types/restaurant';
import { 
  Users, 
  Clock, 
  DollarSign, 
  Plus, 
  X, 
  FileText, 
  Receipt,
  Coffee,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';
import MesaConfiguration from './MesaConfiguration';

interface MesaManagementProps {
  sucursalId: number;
  idRestaurante: number;
}

export function MesaManagement({ sucursalId, idRestaurante }: MesaManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [showPrefactura, setShowPrefactura] = useState(false);
  const [prefacturaData, setPrefacturaData] = useState<any>(null);

  // Log para depuración
  React.useEffect(() => {
    console.log('[MesaManagement] sucursalId:', sucursalId, 'idRestaurante:', idRestaurante, 'user:', user);
  }, [sucursalId, idRestaurante, user]);

  // useQuery para mesas
  const {
    data: mesasRaw,
    isLoading: isLoadingMesas,
    refetch: refetchMesas
  } = useQuery<Mesa[]>({
    queryKey: ['mesas', sucursalId, idRestaurante],
    queryFn: () => getMesas(sucursalId),
    refetchInterval: 10000,
    enabled: !!sucursalId && !!idRestaurante,
  });
  const mesas: Mesa[] = Array.isArray(mesasRaw) ? mesasRaw : [];

  // Obtener estadísticas
  const { data: estadisticasRaw } = useQuery<EstadisticasMesas>({
    queryKey: ['estadisticas-mesas', sucursalId, idRestaurante],
    queryFn: () => getEstadisticasMesas(sucursalId),
    refetchInterval: 30000, // Refetch cada 30 segundos
    enabled: !!sucursalId && !!idRestaurante,
  });
  const estadisticas: EstadisticasMesas | undefined = estadisticasRaw;

  // Mutación para abrir mesa
  const abrirMesaMutation = useMutation({
    mutationFn: ({ numero }: { numero: number }) => abrirMesa(numero, sucursalId),
    onSuccess: (data) => {
      toast({
        title: "Mesa Abierta",
        description: `Mesa ${data.data.mesa.numero} abierta exitosamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId, idRestaurante] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-mesas', sucursalId, idRestaurante] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al abrir la mesa.",
        variant: "destructive",
      });
    },
  });

  // Mutación para cerrar mesa
  const cerrarMesaMutation = useMutation({
    mutationFn: ({ id_mesa }: { id_mesa: number }) => cerrarMesa(id_mesa),
    onSuccess: (data) => {
      toast({
        title: "Mesa Cerrada",
        description: `Mesa cerrada exitosamente. Total: ${data.data.total_final}`,
      });
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId, idRestaurante] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-mesas', sucursalId, idRestaurante] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al cerrar la mesa.",
        variant: "destructive",
      });
    },
  });

  // Mutación para liberar mesa
  const liberarMesaMutation = useMutation({
    mutationFn: ({ id_mesa }: { id_mesa: number }) => liberarMesa(id_mesa),
    onSuccess: (data) => {
      toast({
        title: "Mesa Liberada",
        description: `Mesa liberada exitosamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId, idRestaurante] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-mesas', sucursalId, idRestaurante] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al liberar la mesa.",
        variant: "destructive",
      });
    },
  });

  // Mutación para cerrar mesa con facturación
  const cerrarMesaConFacturaMutation = useMutation({
    mutationFn: (data: {
      mesa_numero: number;
      id_sucursal: number;
      paymentMethod: string;
      invoiceData?: any;
    }) => cerrarMesaConFactura(data),
    onSuccess: (data) => {
      toast({
        title: "Mesa Facturada",
        description: `Mesa ${data.data.mesa.numero} cerrada y facturada. Total: ${data.data.total_final}`,
      });
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId, idRestaurante] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-mesas', sucursalId, idRestaurante] });
      setShowPrefactura(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al facturar la mesa.",
        variant: "destructive",
      });
    },
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'libre': return 'bg-green-100 text-green-800';
      case 'en_uso': return 'bg-blue-100 text-blue-800';
      case 'pendiente_cobro': return 'bg-yellow-100 text-yellow-800';
      case 'reservada': return 'bg-purple-100 text-purple-800';
      case 'mantenimiento': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'libre': return <CheckCircle className="w-4 h-4" />;
      case 'en_uso': return <Coffee className="w-4 h-4" />;
      case 'pendiente_cobro': return <AlertCircle className="w-4 h-4" />;
      case 'reservada': return <Clock className="w-4 h-4" />;
      case 'mantenimiento': return <X className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const handleAbrirMesa = (numero: number) => {
    abrirMesaMutation.mutate({ numero });
  };

  const handleCerrarMesa = (id_mesa: number) => {
    if (confirm('¿Estás seguro de que quieres cerrar esta mesa?')) {
      cerrarMesaMutation.mutate({ id_mesa });
    }
  };

  const handleLiberarMesa = (id_mesa: number) => {
    if (confirm('¿Estás seguro de que quieres liberar esta mesa? Esto marcará la mesa como libre sin facturar.')) {
      liberarMesaMutation.mutate({ id_mesa });
    }
  };

  const handleGenerarPrefactura = async (mesa: Mesa) => {
    try {
      const data = await generarPrefactura(mesa.id_mesa, idRestaurante);
      setPrefacturaData(data.data);
      setSelectedMesa(mesa);
      setShowPrefactura(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al generar prefactura.",
        variant: "destructive",
      });
    }
  };

  const handleCerrarConFactura = (mesa: Mesa) => {
    // Aquí podrías abrir un modal para seleccionar método de pago
    const paymentMethod = prompt('Método de pago (Efectivo, Tarjeta, etc.):');
    if (paymentMethod) {
      cerrarMesaConFacturaMutation.mutate({
        mesa_numero: mesa.numero,
        id_sucursal: sucursalId,
        paymentMethod
      });
    }
  };

  if (!sucursalId) {
    return <div className="p-6 text-center text-red-600 font-bold">Error: sucursalId inválido. No se puede mostrar la gestión de mesas.</div>;
  }

  if (isLoadingMesas) {
    return <div className="p-6 text-center">Cargando mesas...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Mesas</h1>
        <div className="flex gap-2">
          <Button onClick={() => { refetchMesas(); }} variant="outline">
            Actualizar
          </Button>
        </div>
      </div>
      {/* Mensaje si no hay mesas */}
      {mesas.length === 0 && (
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded">No hay mesas disponibles para esta sucursal.</div>
      )}

      <Tabs defaultValue="management" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Coffee className="h-4 w-4" />
            Gestión Operativa
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-6">
          {/* Estadísticas */}
          {estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Mesas</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estadisticas.total_mesas}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Libres</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{estadisticas.mesas_libres}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Uso</CardTitle>
                  <Coffee className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{estadisticas.mesas_en_uso}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Acumulado</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${(Number(estadisticas.total_acumulado_general) || 0).toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Grid de Mesas */}
          {mesas.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-8">
                  <div className="text-center">
                    <Coffee className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay mesas disponibles</h3>
                    <p className="text-muted-foreground mb-4">
                      No se han configurado mesas para esta sucursal.
                    </p>
                    <Button 
                      onClick={() => {
                        const tabsTrigger = document.querySelector('[data-value="configuration"]') as HTMLElement;
                        if (tabsTrigger) tabsTrigger.click();
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar Mesas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            mesas.map((mesa) => (
              <Card key={mesa.id_mesa} className="shadow-lg hover:shadow-xl transition-shadow min-h-[260px] flex flex-col justify-between p-4">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-bold">
                    Mesa {mesa.numero}
                  </CardTitle>
                  <Badge className={getEstadoColor(mesa.estado)}>
                    {getEstadoIcon(mesa.estado)}
                    <span className="ml-1">{mesa.estado.replace('_', ' ')}</span>
                  </Badge>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Capacidad:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {mesa.capacidad} personas
                      </span>
                    </div>
                    {mesa.estado === 'en_uso' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Acumulado:</span>
                          <span className="font-medium text-green-600">
                            ${(Number(mesa.total_acumulado) || 0).toFixed(2)}
                          </span>
                        </div>
                        {mesa.hora_apertura && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Abierta desde:</span>
                            <span className="font-medium">
                              {new Date(mesa.hora_apertura).toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 mt-6">
                    {mesa.estado === 'libre' && (
                      <Button 
                        onClick={() => handleAbrirMesa(mesa.numero)}
                        size="lg"
                        className="w-full"
                        disabled={abrirMesaMutation.isPending}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Abrir
                      </Button>
                    )}
                    {mesa.estado === 'en_uso' && (
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={() => handleGenerarPrefactura(mesa)}
                          size="lg"
                          variant="outline"
                          className="w-full"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Prefactura
                        </Button>
                        <Button 
                          onClick={() => handleCerrarConFactura(mesa)}
                          size="lg"
                          variant="outline"
                          className="w-full"
                        >
                          <Receipt className="w-4 h-4 mr-1" />
                          Facturar
                        </Button>
                        <Button 
                          onClick={() => handleLiberarMesa(mesa.id_mesa)}
                          size="lg"
                          variant="outline"
                          className="w-full"
                          disabled={liberarMesaMutation.isPending}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Liberar
                        </Button>
                      </div>
                    )}
                    {mesa.estado === 'pendiente_cobro' && (
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={() => handleCerrarConFactura(mesa)}
                          size="lg"
                          variant="outline"
                          className="w-full"
                        >
                          <Receipt className="w-4 h-4 mr-1" />
                          Facturar
                        </Button>
                        <Button 
                          onClick={() => handleLiberarMesa(mesa.id_mesa)}
                          size="lg"
                          variant="outline"
                          className="w-full"
                          disabled={liberarMesaMutation.isPending}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Liberar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="configuration">
          <MesaConfiguration sucursalId={sucursalId} />
        </TabsContent>
      </Tabs>

      {/* Modal de Prefactura */}
      <Dialog open={showPrefactura} onOpenChange={setShowPrefactura}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Prefactura - Mesa {selectedMesa?.numero}
            </DialogTitle>
          </DialogHeader>
          
          {prefacturaData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Información de Mesa</h3>
                  <p>Mesa: {prefacturaData.mesa.numero}</p>
                  <p>Capacidad: {prefacturaData.mesa.capacidad} personas</p>
                  <p>Total Acumulado: ${(Number(prefacturaData.total_acumulado) || 0).toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Información de Prefactura</h3>
                  <p>Estado: {prefacturaData.prefactura?.estado}</p>
                  <p>Fecha Apertura: {new Date(prefacturaData.prefactura?.fecha_apertura).toLocaleString()}</p>
                </div>
              </div>

              {prefacturaData.historial && prefacturaData.historial.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Historial de Consumo</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Unit.</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead>Observaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prefacturaData.historial.map((item: HistorialMesa, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.nombre_producto}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>${(Number(item.precio_unitario) || 0).toFixed(2)}</TableCell>
                          <TableCell>${(Number(item.subtotal) || 0).toFixed(2)}</TableCell>
                          <TableCell>{item.observaciones || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button 
                  onClick={() => setShowPrefactura(false)}
                  variant="outline"
                >
                  Cerrar
                </Button>
                <Button 
                  onClick={() => selectedMesa && handleCerrarConFactura(selectedMesa)}
                  disabled={cerrarMesaConFacturaMutation.isPending}
                >
                  Cerrar y Facturar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 