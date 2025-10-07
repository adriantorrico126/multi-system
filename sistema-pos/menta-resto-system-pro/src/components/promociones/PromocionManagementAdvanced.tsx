import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Crown,
  BarChart3,
  Settings,
  Zap,
  Clock,
  Target,
  Star,
  AlertCircle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { 
  crearPromocion, 
  getTodasPromociones, 
  actualizarPromocion, 
  eliminarPromocion,
  getProducts
} from '@/services/api';
import { AdvancedPromocionModal } from './AdvancedPromocionModal';
import { PromocionesAnalytics } from './PromocionesAnalytics';

interface Promocion {
  id_promocion: number;
  nombre: string;
  descripcion?: string;
  tipo: 'porcentaje' | 'monto_fijo' | 'precio_fijo' | 'x_uno_gratis' | 'combo';
  valor: number;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio?: string;
  hora_fin?: string;
  aplicar_horarios?: boolean;
  id_producto: number;
  nombre_producto?: string;
  precio_original?: number;
  estado_promocion?: 'activa' | 'pendiente' | 'expirada' | 'fuera_horario';
  limite_usos?: number;
  limite_usos_por_cliente?: number;
  monto_minimo?: number;
  monto_maximo?: number;
  destacada?: boolean;
  requiere_codigo?: boolean;
  codigo_promocion?: string;
  segmento_cliente?: string;
  usos_actuales?: number;
  usos_disponibles?: number;
}

interface Producto {
  id: string;
  name: string;
  price: number;
  id_categoria: number;
}

export function PromocionManagementAdvanced() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('gestion');
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPromocion, setSelectedPromocion] = useState<Promocion | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Obtener promociones
  const { data: promociones = [], isLoading: isLoadingPromociones } = useQuery({
    queryKey: ['promociones'],
    queryFn: getTodasPromociones
  });

  // Obtener productos para el selector
  const { data: productos = [] } = useQuery({
    queryKey: ['productos'],
    queryFn: () => getProducts(false) // Sin descuentos para evitar recursión
  });

  // Obtener ventas para analytics (placeholder)
  const { data: ventas = [] } = useQuery({
    queryKey: ['ventas'],
    queryFn: () => Promise.resolve([]) // Placeholder - implementar cuando esté disponible
  });

  // Mutaciones
  const crearPromocionMutation = useMutation({
    mutationFn: crearPromocion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promociones'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setShowAdvancedModal(false);
      toast({
        title: "✅ Promoción Creada",
        description: "La promoción avanzada se ha creado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "Error al crear la promoción.",
        variant: "destructive",
      });
    },
  });

  const actualizarPromocionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => actualizarPromocion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promociones'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setShowAdvancedModal(false);
      toast({
        title: "✅ Promoción Actualizada",
        description: "La promoción se ha actualizado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "Error al actualizar la promoción.",
        variant: "destructive",
      });
    }
  });

  const eliminarPromocionMutation = useMutation({
    mutationFn: eliminarPromocion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promociones'] });
      setShowDeleteModal(false);
      toast({
        title: "✅ Promoción Eliminada",
        description: "La promoción se ha eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "Error al eliminar la promoción.",
        variant: "destructive",
      });
    }
  });

  // Handlers
  const handleCreatePromocion = () => {
    setModalMode('create');
    setSelectedPromocion(null);
    setShowAdvancedModal(true);
  };

  const handleEditPromocion = (promocion: Promocion) => {
    setModalMode('edit');
    setSelectedPromocion(promocion);
    setShowAdvancedModal(true);
  };

  const handleDeletePromocion = (promocion: Promocion) => {
    setSelectedPromocion(promocion);
    setShowDeleteModal(true);
  };

  const handleViewDetails = (promocion: Promocion) => {
    setSelectedPromocion(promocion);
    setShowDetailsModal(true);
  };

  const handleSavePromocion = async (promocionData: any) => {
    try {
      if (modalMode === 'create') {
        await crearPromocionMutation.mutateAsync(promocionData);
      } else {
        await actualizarPromocionMutation.mutateAsync({
          id: selectedPromocion!.id_promocion,
          data: promocionData
        });
      }
    } catch (error) {
      console.error('Error saving promoción:', error);
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedPromocion) {
      await eliminarPromocionMutation.mutateAsync(selectedPromocion.id_promocion);
    }
  };

  // Helper functions
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'expirada': return 'bg-red-100 text-red-800';
      case 'fuera_horario': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'porcentaje': return <TrendingUp className="h-4 w-4" />;
      case 'monto_fijo': return <Target className="h-4 w-4" />;
      case 'precio_fijo': return <Star className="h-4 w-4" />;
      case 'x_uno_gratis': return <Zap className="h-4 w-4" />;
      case 'combo': return <Settings className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'porcentaje': return 'Porcentaje';
      case 'monto_fijo': return 'Monto Fijo';
      case 'precio_fijo': return 'Precio Fijo';
      case 'x_uno_gratis': return 'X Uno Gratis';
      case 'combo': return 'Combo';
      default: return tipo;
    }
  };

  // Calcular métricas
  const metricas = {
    total: promociones.length,
    activas: promociones.filter(p => p.estado_promocion === 'activa').length,
    pendientes: promociones.filter(p => p.estado_promocion === 'pendiente').length,
    expiradas: promociones.filter(p => p.estado_promocion === 'expirada').length,
    destacadas: promociones.filter(p => p.destacada).length,
    conHorarios: promociones.filter(p => p.aplicar_horarios).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="h-6 w-6 text-purple-600" />
            Sistema Avanzado de Promociones
          </h2>
          <p className="text-gray-600">Gestión profesional con análisis y promociones por horarios</p>
        </div>
        <Button 
          onClick={handleCreatePromocion} 
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Promoción Avanzada
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-purple-600">{metricas.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Activas</p>
                <p className="text-2xl font-bold text-green-600">{metricas.activas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{metricas.pendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Expiradas</p>
                <p className="text-2xl font-bold text-red-600">{metricas.expiradas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Destacadas</p>
                <p className="text-2xl font-bold text-orange-600">{metricas.destacadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Por Horarios</p>
                <p className="text-2xl font-bold text-blue-600">{metricas.conHorarios}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gestion" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Gestión de Promociones
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics y Reportes
          </TabsTrigger>
        </TabsList>

        {/* Tab: Gestión */}
        <TabsContent value="gestion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Promociones</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPromociones ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : promociones.length === 0 ? (
                <div className="text-center py-8">
                  <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay promociones</h3>
                  <p className="text-gray-500 mb-4">Crea tu primera promoción avanzada</p>
                  <Button onClick={handleCreatePromocion} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Promoción
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Promoción</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vigencia</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Configuración</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promociones.map((promocion) => (
                        <TableRow key={promocion.id_promocion}>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{promocion.nombre}</p>
                                {promocion.destacada && (
                                  <Star className="h-4 w-4 text-orange-500" />
                                )}
                                {promocion.requiere_codigo && (
                                  <Badge variant="outline" className="text-xs">
                                    {promocion.codigo_promocion}
                                  </Badge>
                                )}
                              </div>
                              {promocion.descripcion && (
                                <p className="text-sm text-gray-500">{promocion.descripcion}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-gray-600">
                              {promocion.nombre_producto || 'Producto no encontrado'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTipoIcon(promocion.tipo)}
                              <span className="text-sm">{getTipoLabel(promocion.tipo)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {promocion.tipo === 'porcentaje' ? `${promocion.valor}%` : `Bs ${promocion.valor}`}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>Desde: {new Date(promocion.fecha_inicio).toLocaleDateString()}</p>
                              <p>Hasta: {new Date(promocion.fecha_fin).toLocaleDateString()}</p>
                              {promocion.aplicar_horarios && (
                                <p className="text-blue-600">
                                  {promocion.hora_inicio} - {promocion.hora_fin}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getEstadoColor(promocion.estado_promocion || '')}>
                              {promocion.estado_promocion || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-xs">
                              {promocion.limite_usos > 0 && (
                                <span className="text-gray-600">
                                  Límite: {promocion.limite_usos}
                                </span>
                              )}
                              {promocion.monto_minimo > 0 && (
                                <span className="text-gray-600">
                                  Mín: Bs {promocion.monto_minimo}
                                </span>
                              )}
                              {promocion.segmento_cliente && promocion.segmento_cliente !== 'todos' && (
                                <span className="text-gray-600">
                                  {promocion.segmento_cliente}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(promocion)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditPromocion(promocion)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeletePromocion(promocion)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <PromocionesAnalytics 
            promociones={promociones}
            ventas={ventas}
            isLoading={isLoadingPromociones}
          />
        </TabsContent>
      </Tabs>

      {/* Modal Avanzado */}
      <AdvancedPromocionModal
        isOpen={showAdvancedModal}
        onClose={() => setShowAdvancedModal(false)}
        onSave={handleSavePromocion}
        promocion={selectedPromocion}
        productos={productos}
        sucursales={[]} // Placeholder - implementar cuando esté disponible
        mode={modalMode}
      />

      {/* Modal de Eliminación */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Promoción</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              ¿Estás seguro de que deseas eliminar la promoción "{selectedPromocion?.nombre}"?
            </p>
            <p className="text-sm text-red-600 mt-2">
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={eliminarPromocionMutation.isPending}
            >
              {eliminarPromocionMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalles */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-600" />
              Detalles de la Promoción
            </DialogTitle>
          </DialogHeader>
          
          {selectedPromocion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Nombre</Label>
                  <p className="font-semibold">{selectedPromocion.nombre}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Estado</Label>
                  <Badge className={getEstadoColor(selectedPromocion.estado_promocion || '')}>
                    {selectedPromocion.estado_promocion}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Tipo</Label>
                  <p className="font-medium">{getTipoLabel(selectedPromocion.tipo)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Valor</Label>
                  <p className="font-medium">
                    {selectedPromocion.tipo === 'porcentaje' ? `${selectedPromocion.valor}%` : `Bs ${selectedPromocion.valor}`}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Producto</Label>
                  <p className="font-medium">{selectedPromocion.nombre_producto}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Precio Original</Label>
                  <p className="font-medium">Bs {selectedPromocion.precio_original}</p>
                </div>
              </div>
              
              {selectedPromocion.descripcion && (
                <div>
                  <Label className="text-sm text-gray-500">Descripción</Label>
                  <p className="text-gray-700">{selectedPromocion.descripcion}</p>
                </div>
              )}

              {selectedPromocion.aplicar_horarios && (
                <div>
                  <Label className="text-sm text-gray-500">Horarios</Label>
                  <p className="text-blue-600">
                    {selectedPromocion.hora_inicio} - {selectedPromocion.hora_fin}
                  </p>
                </div>
              )}

              {selectedPromocion.requiere_codigo && (
                <div>
                  <Label className="text-sm text-gray-500">Código de Promoción</Label>
                  <p className="font-mono bg-gray-100 p-2 rounded">{selectedPromocion.codigo_promocion}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
