import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMesaRealTime } from '@/hooks/useMesaRealTime';
import { MesaCardOptimized } from './MesaCardOptimized';
import { CobrarButtonOptimized } from './CobrarButtonOptimized';
import { MetodosPagoModal } from './MetodosPagoModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Coffee,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  Users,
  Settings,
  FileText,
  Receipt,
  DollarSign,
  CreditCard,
  RefreshCw,
  Grid3X3,
  Plus,
  Users2,
  Target,
  TrendingUp,
  Activity,
  Calendar,
  BookOpen,
  Link2,
  Unlink,
  Eye,
  MoveRight,
  Printer,
  Menu,
  List,
  Crown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getMesas,
  abrirMesa,
  cerrarMesa,
  liberarMesa,
  generarPrefactura,
  cerrarMesaConFactura,
  getEstadisticasMesas,
  marcarMesaComoPagada,
  limpiarEstadosMesas,
  getVentaConDetalles,
} from '@/services/api';
import MesaConfiguration from './MesaConfiguration';
import { useAuth } from '@/context/AuthContext';
import { usePlanSystem } from '@/context/PlanSystemContext';
import { Mesa } from '@/types/restaurant';

interface EstadisticasMesas {
  total_mesas: number;
  mesas_libres: number;
  mesas_en_uso: number;
  mesas_pendiente_cobro: number;
  mesas_pagadas: number;
  total_acumulado_general: number;
}

interface MesaManagementProps {
  sucursalId: number;
  idRestaurante: number;
}

export default function MesaManagement({ sucursalId, idRestaurante }: MesaManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasFeature } = usePlanSystem();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showPrefactura, setShowPrefactura] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState<any | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ventaDetalles, setVentaDetalles] = useState<any>(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [showMetodosPago, setShowMetodosPago] = useState(false);
  const [mesaParaPago, setMesaParaPago] = useState<any | null>(null);

  // Hook optimizado para mesas en tiempo real
  const {
    mesas,
    isLoading: isLoadingMesas,
    invalidateMesaData,
    resetMesaInCache,
    forceRefresh
  } = useMesaRealTime({
    sucursalId,
    refetchInterval: 3000, // Actualizar cada 3 segundos
    enabled: true
  });

  // Función optimizada para refrescar datos
  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      await forceRefresh();
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar el reset de una mesa específica
  const handleResetMesa = (mesaId: number) => {
    resetMesaInCache(mesaId);
    // También invalidar queries para asegurar sincronización
    invalidateMesaData();
    // Forzar actualización inmediata
    setTimeout(() => {
      forceRefresh();
    }, 100);
  };

  const handleShowMetodosPago = (mesa: any) => {
    setMesaParaPago(mesa);
    setShowMetodosPago(true);
  };

  const handleCloseMetodosPago = () => {
    setShowMetodosPago(false);
    setMesaParaPago(null);
  };


  // Query para estadísticas
  const { data: estadisticas } = useQuery<EstadisticasMesas>({
    queryKey: ['estadisticas-mesas', sucursalId],
    queryFn: () => getEstadisticasMesas(sucursalId),
    enabled: !!sucursalId,
  });

  // Mutación para liberar mesa - OPTIMIZADA
  const liberarMesaMutation = useMutation({
    mutationFn: ({ id_mesa }: { id_mesa: number }) => liberarMesa(id_mesa),
    onSuccess: (data) => {
      toast({
        title: "Mesa Liberada",
        description: `Mesa ${data.data.mesa.numero} liberada exitosamente. Total anterior: $${data.data.total_final}`,
      });
      // Resetear mesa inmediatamente en cache
      resetMesaInCache(data.data.mesa.id_mesa);
      // Invalidar queries relacionadas
      invalidateMesaData();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al liberar la mesa.",
        variant: "destructive",
      });
    },
  });

  // Mutación para marcar como pagado - OPTIMIZADA
  const marcarComoPagadoMutation = useMutation({
    mutationFn: ({ id_mesa }: { id_mesa: number }) => marcarMesaComoPagada({ id_mesa }),
    onSuccess: (data: any) => {
      toast({
        title: "Mesa Marcada como Pagada",
        description: `Mesa ${data.data.mesa.numero} marcada como pagada exitosamente. Total cobrado: $${data.data.total_final}`,
      });
      // Resetear mesa inmediatamente en cache
      resetMesaInCache(data.data.mesa.id_mesa);
      // Invalidar queries relacionadas
      invalidateMesaData();
      setShowPrefactura(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al marcar como pagado.",
        variant: "destructive",
      });
    },
  });

  // Mutación para limpiar estados
  const limpiarEstadosMesasMutation = useMutation({
    mutationFn: () => limpiarEstadosMesas(),
    onSuccess: (data) => {
      toast({
        title: "Estados Limpiados",
        description: `${data.data.mesasActualizadas} mesas actualizadas exitosamente.`,
      });
      invalidateMesaData();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al limpiar estados de mesas.",
        variant: "destructive",
      });
    },
  });

  if (!sucursalId) {
    return <div className="p-6 text-center text-red-600 font-bold">Error: sucursalId inválido. No se puede mostrar la gestión de mesas.</div>;
  }

  if (isLoadingMesas) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mesas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Mesas</h2>
          <p className="text-gray-600">Administra las mesas de tu restaurante</p>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Grid3X3 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-lg font-bold text-gray-900">{estadisticas.total_mesas}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Libres</p>
                  <p className="text-lg font-bold text-green-600">{estadisticas.mesas_libres}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Coffee className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">En Uso</p>
                  <p className="text-lg font-bold text-blue-600">{estadisticas.mesas_en_uso}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Acumulado</p>
                  <p className="text-lg font-bold text-yellow-600">${Number(estadisticas.total_acumulado_general || 0).toFixed(2)}</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Controles principales */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Botón de menú móvil */}
        <Button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          variant="outline"
          size="sm"
          className="lg:hidden flex items-center space-x-2"
        >
          <Menu className="h-4 w-4" />
          <span>Menú</span>
        </Button>

        {/* Botones de escritorio */}
        <div className="hidden lg:flex items-center space-x-3">
          <Button
            onClick={handleRefreshData}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>
          
          
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={() => limpiarEstadosMesasMutation.mutate()}
            disabled={limpiarEstadosMesasMutation.isPending}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <RefreshCw className={`h-4 w-4 ${limpiarEstadosMesasMutation.isPending ? 'animate-spin' : ''}`} />
            <span>Limpiar Estados</span>
          </Button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {showMobileMenu && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-3">
              {/* Botón de actualizar */}
              <Button
                onClick={() => { 
                  handleRefreshData(); 
                  setShowMobileMenu(false); 
                }}
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center space-x-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualizar Datos</span>
              </Button>
              

              {/* Selector de vista */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setViewMode('grid');
                    setShowMobileMenu(false);
                  }}
                  className="flex-1"
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span>Vista Grid</span>
                </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setViewMode('list');
                      setShowMobileMenu(false);
                    }}
                    className="flex-1"
                  >
                    <List className="h-4 w-4" />
                    <span>Vista Lista</span>
                  </Button>
              </div>

              <Button
                onClick={() => {
                  limpiarEstadosMesasMutation.mutate();
                  setShowMobileMenu(false);
                }}
                disabled={limpiarEstadosMesasMutation.isPending}
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center space-x-2 text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <RefreshCw className={`h-4 w-4 ${limpiarEstadosMesasMutation.isPending ? 'animate-spin' : ''}`} />
                <span>Limpiar Estados</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal con pestañas */}
      <Tabs defaultValue="operational" className="space-y-6">
        <TabsList>
          <TabsTrigger value="operational">Gestión Operativa</TabsTrigger>
          <TabsTrigger value="configuration">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="operational" className="space-y-6">
          <div className="space-y-6">
            {/* Grid de Mesas Optimizado */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {Array.isArray(mesas) && mesas.map((mesa) => (
                  <MesaCardOptimized
                    key={mesa.id_mesa}
                    mesa={mesa}
                    sucursalId={sucursalId}
                    onShowPrefactura={async (mesa) => {
                      console.log('🔍 [PREFACTURA] Mesa seleccionada:', mesa);
                      setSelectedMesa(mesa);
                      setShowPrefactura(true);
                      
                      // Obtener detalles de la venta si existe
                      if (mesa.id_venta_actual) {
                        console.log('🔍 [PREFACTURA] Obteniendo detalles para venta:', mesa.id_venta_actual);
                        setLoadingDetalles(true);
                        try {
                          const response = await getVentaConDetalles(mesa.id_venta_actual);
                          console.log('🔍 [PREFACTURA] Respuesta recibida:', response);
                          
                          if (response && response.data) {
                            setVentaDetalles(response.data);
                          } else {
                            console.log('⚠️ [PREFACTURA] Respuesta sin datos válidos');
                            setVentaDetalles(null);
                          }
                        } catch (error) {
                          console.error('❌ [PREFACTURA] Error al obtener detalles:', error);
                          // Crear datos de prueba para debugging
                          setVentaDetalles({
                            id_venta: mesa.id_venta_actual,
                            total: mesa.total_acumulado,
                            detalles: [
                              {
                                id_detalle: 1,
                                producto_nombre: 'Producto de Prueba',
                                cantidad: 1,
                                precio_unitario: mesa.total_acumulado || 0,
                                subtotal: mesa.total_acumulado || 0,
                                observaciones: 'Producto de prueba para debugging'
                              }
                            ]
                          });
                        } finally {
                          setLoadingDetalles(false);
                        }
                      } else {
                        console.log('⚠️ [PREFACTURA] No hay id_venta_actual en la mesa');
                        setVentaDetalles(null);
                      }
                    }}
                    onResetMesa={handleResetMesa}
                    onShowMetodosPago={handleShowMetodosPago}
                  />
                ))}
              </div>
            )}

            {/* List View de Mesas */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="min-w-full divide-y divide-gray-200">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mesa
                        </TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          Estado
                        </TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          Capacidad
                        </TableHead>
                        <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          Total Acumulado
                        </TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(mesas) && mesas.map((mesa) => (
                        <TableRow key={mesa.id_mesa} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-white font-bold text-sm">{mesa.numero}</span>
                              </div>
                              <div className="text-sm font-medium text-gray-900">Mesa {mesa.numero}</div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                            <Badge className={
                              mesa.estado === 'libre' ? 'bg-green-100 text-green-800' :
                              mesa.estado === 'en_uso' ? 'bg-blue-100 text-blue-800' :
                              mesa.estado === 'pendiente_cobro' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {mesa.estado.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                            {mesa.capacidad} personas
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right hidden lg:table-cell">
                            ${Number(mesa.total_acumulado || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              {(mesa.estado === 'en_uso' || mesa.estado === 'pendiente_cobro') && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedMesa(mesa);
                                      setShowPrefactura(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => liberarMesaMutation.mutate({ id_mesa: mesa.id_mesa })}
                                    disabled={liberarMesaMutation.isPending}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Liberar
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {(!mesas || (Array.isArray(mesas) && mesas.length === 0)) && (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Grid3X3 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mesas configuradas</h3>
                <p className="text-gray-500">Configura las mesas en la pestaña de configuración</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <MesaConfiguration sucursalId={sucursalId} />
        </TabsContent>
      </Tabs>

      {/* Modal de Prefactura */}
      <Dialog open={showPrefactura} onOpenChange={setShowPrefactura}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto mobile-modal prefactura-modal">
          <DialogHeader className="mobile-header prefactura-header">
            <DialogTitle className="mobile-text-xl">Prefactura - Mesa {selectedMesa?.numero}</DialogTitle>
            <DialogDescription className="mobile-text-sm">
              Detalles de consumo y opciones de pago
            </DialogDescription>
          </DialogHeader>
          
          {selectedMesa && (
            <div className="space-y-4 mobile-p-4 prefactura-content">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg mobile-spacing prefactura-summary">
                <div className="mb-2 sm:mb-0">
                  <h3 className="text-lg font-semibold mobile-text-lg">Mesa {selectedMesa.numero}</h3>
                  <p className="text-gray-600 mobile-text-sm">Capacidad: {selectedMesa.capacidad} personas</p>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <p className="text-2xl font-bold text-green-600 mobile-text-xl prefactura-total">
                    ${Number(selectedMesa.total_acumulado || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mobile-text-xs">Total Acumulado</p>
                </div>
              </div>

              {/* Detalles de productos consumidos */}
              {loadingDetalles ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Cargando detalles...</span>
                </div>
              ) : ventaDetalles && ventaDetalles.detalles && ventaDetalles.detalles.length > 0 ? (
                <div className="bg-white border rounded-lg mobile-card">
                  <div className="p-4 border-b mobile-p-3">
                    <h4 className="text-lg font-semibold text-gray-900 mobile-text-lg">Productos Consumidos</h4>
                  </div>
                  <div className="overflow-x-auto mobile-scroll">
                    <Table className="mobile-table prefactura-table">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="mobile-text-sm">Producto</TableHead>
                          <TableHead className="text-center mobile-text-sm">Cantidad</TableHead>
                          <TableHead className="text-right mobile-text-sm">Precio Unit.</TableHead>
                          <TableHead className="text-right mobile-text-sm">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ventaDetalles.detalles.map((detalle: any) => (
                          <TableRow key={detalle.id_detalle}>
                            <TableCell className="font-medium mobile-text-sm">
                              {detalle.producto_nombre || 'Producto no encontrado'}
                              {detalle.observaciones && (
                                <p className="text-sm text-gray-500 mt-1 mobile-text-xs">{detalle.observaciones}</p>
                              )}
                            </TableCell>
                            <TableCell className="text-center mobile-text-sm">{detalle.cantidad}</TableCell>
                            <TableCell className="text-right mobile-text-sm">${Number(detalle.precio_unitario || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right mobile-text-sm">${Number(detalle.subtotal || 0).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="p-4 border-t bg-gray-50 mobile-p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold mobile-text-lg">Total:</span>
                      <span className="text-xl font-bold text-green-600 mobile-text-xl">
                        ${Number(ventaDetalles.total || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : selectedMesa && selectedMesa.total_acumulado && selectedMesa.total_acumulado > 0 ? (
                <div className="bg-white border rounded-lg">
                  <div className="p-4 border-b">
                    <h4 className="text-lg font-semibold text-gray-900">Información de la Mesa</h4>
                  </div>
                  <div className="p-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Backend no disponible - Mostrando información básica
                        </span>
                      </div>
                      <p className="text-sm text-blue-700">
                        No se pudieron obtener los detalles de productos porque el backend no está respondiendo.
                        El total acumulado de la mesa es de ${Number(selectedMesa.total_acumulado).toFixed(2)}.
                      </p>
                    </div>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total Acumulado:</span>
                        <span className="text-xl font-bold text-green-600">
                          ${Number(selectedMesa.total_acumulado).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-400">
                      <p>Debug: ID Venta Actual: {selectedMesa.id_venta_actual || 'null'}</p>
                      <p>Debug: Estado: {selectedMesa.estado}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No hay productos registrados para esta mesa</p>
                  {selectedMesa && (
                    <div className="mt-4 text-sm text-gray-400">
                      <p>Debug: ID Venta Actual: {selectedMesa.id_venta_actual || 'null'}</p>
                      <p>Debug: Estado: {selectedMesa.estado}</p>
                      <p>Debug: Total: ${Number(selectedMesa.total_acumulado || 0).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 mobile-gap-2 prefactura-buttons">
                {selectedMesa.estado === 'pendiente_cobro' && (
                  <Button
                    onClick={() => marcarComoPagadoMutation.mutate({ id_mesa: selectedMesa.id_mesa })}
                    disabled={marcarComoPagadoMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 mobile-button mobile-touch-target"
                  >
                    <CreditCard className="h-4 w-4 mr-2 mobile-icon" />
                    <span className="mobile-text-sm">Cobrar ${Number(selectedMesa.total_acumulado || 0).toFixed(2)}</span>
                  </Button>
                )}
                <Button
                  onClick={() => liberarMesaMutation.mutate({ id_mesa: selectedMesa.id_mesa })}
                  disabled={liberarMesaMutation.isPending}
                  variant="destructive"
                  className="flex-1 mobile-button mobile-touch-target"
                >
                  <X className="h-4 w-4 mr-2 mobile-icon" />
                  <span className="mobile-text-sm">Liberar Mesa</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Métodos de Pago */}
      <MetodosPagoModal
        isOpen={showMetodosPago}
        onClose={handleCloseMetodosPago}
        mesa={mesaParaPago}
        sucursalId={sucursalId}
        onSuccess={() => {
          forceRefresh();
          handleCloseMetodosPago();
        }}
        onResetMesa={handleResetMesa}
      />
    </div>
  );
}
