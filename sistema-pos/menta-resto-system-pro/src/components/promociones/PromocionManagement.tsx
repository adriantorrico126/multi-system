import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Percent, 
  DollarSign, 
  Tag,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { 
  crearPromocion, 
  getTodasPromociones, 
  actualizarPromocion, 
  eliminarPromocion,
  getProducts
} from '@/services/api';

interface Promocion {
  id_promocion: number;
  nombre: string;
  tipo: 'porcentaje' | 'monto_fijo' | 'precio_fijo';
  valor: number;
  fecha_inicio: string;
  fecha_fin: string;
  id_producto: number;
  nombre_producto?: string;
  precio_original?: number;
  estado_promocion?: 'activa' | 'pendiente' | 'expirada';
}

interface Producto {
  id: string;
  name: string;
  price: number;
  id_categoria: number;
}

export function PromocionManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPromocion, setSelectedPromocion] = useState<Promocion | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'porcentaje' as const,
    valor: 0,
    fecha_inicio: '',
    fecha_fin: '',
    id_producto: 0
  });

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

  // Mutaciones
  const crearPromocionMutation = useMutation({
    mutationFn: crearPromocion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promociones'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setShowCreateModal(false);
      resetForm();
      toast({
        title: "Promoción creada",
        description: "La promoción se ha creado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear la promoción.",
        variant: "destructive",
      });
    }
  });

  const actualizarPromocionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => actualizarPromocion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promociones'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setShowEditModal(false);
      resetForm();
      toast({
        title: "Promoción actualizada",
        description: "La promoción se ha actualizado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la promoción.",
        variant: "destructive",
      });
    }
  });

  const eliminarPromocionMutation = useMutation({
    mutationFn: eliminarPromocion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promociones'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setShowDeleteModal(false);
      toast({
        title: "Promoción eliminada",
        description: "La promoción se ha eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la promoción.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'porcentaje',
      valor: 0,
      fecha_inicio: '',
      fecha_fin: '',
      id_producto: 0
    });
  };

  const handleCreate = () => {
    if (!formData.nombre || !formData.valor || !formData.fecha_inicio || !formData.fecha_fin || !formData.id_producto) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    crearPromocionMutation.mutate(formData);
  };

  const handleEdit = () => {
    if (!selectedPromocion) return;

    actualizarPromocionMutation.mutate({
      id: selectedPromocion.id_promocion,
      data: formData
    });
  };

  const handleDelete = () => {
    if (!selectedPromocion) return;
    eliminarPromocionMutation.mutate(selectedPromocion.id_promocion);
  };

  const openEditModal = (promocion: Promocion) => {
    setSelectedPromocion(promocion);
    setFormData({
      nombre: promocion.nombre,
      tipo: promocion.tipo,
      valor: promocion.valor,
      fecha_inicio: promocion.fecha_inicio.split('T')[0],
      fecha_fin: promocion.fecha_fin.split('T')[0],
      id_producto: promocion.id_producto
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (promocion: Promocion) => {
    setSelectedPromocion(promocion);
    setShowDeleteModal(true);
  };

  const openDetailsModal = (promocion: Promocion) => {
    setSelectedPromocion(promocion);
    setShowDetailsModal(true);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'expirada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'porcentaje': return <Percent className="h-4 w-4" />;
      case 'monto_fijo': return <DollarSign className="h-4 w-4" />;
      case 'precio_fijo': return <Tag className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'porcentaje': return 'Porcentaje';
      case 'monto_fijo': return 'Monto Fijo';
      case 'precio_fijo': return 'Precio Fijo';
      default: return tipo;
    }
  };

  const calcularDescuento = (promocion: Promocion) => {
    if (!promocion.precio_original) return 0;
    
    switch (promocion.tipo) {
      case 'porcentaje':
        return (promocion.precio_original * promocion.valor) / 100;
      case 'monto_fijo':
        return Math.min(promocion.valor, promocion.precio_original);
      case 'precio_fijo':
        return Math.max(0, promocion.precio_original - promocion.valor);
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Promociones</h2>
          <p className="text-gray-600">Administra las promociones y descuentos de tu restaurante</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Promoción
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Activas</p>
                <p className="text-2xl font-bold text-green-600">
                  {promociones.filter(p => p.estado_promocion === 'activa').length}
                </p>
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
                <p className="text-2xl font-bold text-yellow-600">
                  {promociones.filter(p => p.estado_promocion === 'pendiente').length}
                </p>
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
                <p className="text-2xl font-bold text-red-600">
                  {promociones.filter(p => p.estado_promocion === 'expirada').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Tag className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">{promociones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Promociones */}
      <Card>
        <CardHeader>
          <CardTitle>Promociones Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingPromociones ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : promociones.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay promociones registradas</p>
              <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                Crear Primera Promoción
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promoción</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promociones.map((promocion) => (
                  <TableRow key={promocion.id_promocion}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{promocion.nombre}</p>
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
                        {promocion.tipo === 'porcentaje' ? `${promocion.valor}%` : `$${promocion.valor}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>Desde: {new Date(promocion.fecha_inicio).toLocaleDateString()}</p>
                        <p>Hasta: {new Date(promocion.fecha_fin).toLocaleDateString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getEstadoColor(promocion.estado_promocion || '')}>
                        {promocion.estado_promocion || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailsModal(promocion)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(promocion)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(promocion)}
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
          )}
        </CardContent>
      </Card>

      {/* Modal Crear Promoción */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Nueva Promoción</DialogTitle>
            <DialogDescription>
              Completa los datos para crear una nueva promoción
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre de la Promoción</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Descuento 20% en Hamburguesas"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo de Descuento</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="porcentaje">Porcentaje</SelectItem>
                    <SelectItem value="monto_fijo">Monto Fijo</SelectItem>
                    <SelectItem value="precio_fijo">Precio Fijo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  type="number"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                  placeholder={formData.tipo === 'porcentaje' ? '20' : '5'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="fecha_fin">Fecha de Fin</Label>
                <Input
                  id="fecha_fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="producto">Producto</Label>
              <Select
                value={formData.id_producto.toString()}
                onValueChange={(value) => setFormData({ ...formData, id_producto: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {productos.map((producto: Producto) => (
                    <SelectItem key={producto.id} value={producto.id}>
                      {producto.name} - ${producto.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={crearPromocionMutation.isPending}>
              {crearPromocionMutation.isPending ? 'Creando...' : 'Crear Promoción'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Promoción */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Promoción</DialogTitle>
            <DialogDescription>
              Modifica los datos de la promoción
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nombre">Nombre de la Promoción</Label>
              <Input
                id="edit-nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-tipo">Tipo de Descuento</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="porcentaje">Porcentaje</SelectItem>
                    <SelectItem value="monto_fijo">Monto Fijo</SelectItem>
                    <SelectItem value="precio_fijo">Precio Fijo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-valor">Valor</Label>
                <Input
                  id="edit-valor"
                  type="number"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-fecha-inicio">Fecha de Inicio</Label>
                <Input
                  id="edit-fecha-inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-fecha-fin">Fecha de Fin</Label>
                <Input
                  id="edit-fecha-fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-producto">Producto</Label>
              <Select
                value={formData.id_producto.toString()}
                onValueChange={(value) => setFormData({ ...formData, id_producto: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {productos.map((producto: Producto) => (
                    <SelectItem key={producto.id} value={producto.id}>
                      {producto.name} - ${producto.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={actualizarPromocionMutation.isPending}>
              {actualizarPromocionMutation.isPending ? 'Actualizando...' : 'Actualizar Promoción'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar Promoción */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Promoción</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar la promoción "{selectedPromocion?.nombre}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDelete} 
              disabled={eliminarPromocionMutation.isPending}
              variant="destructive"
            >
              {eliminarPromocionMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalles de Promoción */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles de la Promoción</DialogTitle>
            <DialogDescription>
              Información completa de la promoción seleccionada
            </DialogDescription>
          </DialogHeader>
          {selectedPromocion && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Nombre</Label>
                  <p className="text-lg font-semibold">{selectedPromocion.nombre}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Estado</Label>
                  <Badge className={getEstadoColor(selectedPromocion.estado_promocion || '')}>
                    {selectedPromocion.estado_promocion || 'N/A'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Tipo de Descuento</Label>
                  <div className="flex items-center space-x-2">
                    {getTipoIcon(selectedPromocion.tipo)}
                    <span className="text-lg">{getTipoLabel(selectedPromocion.tipo)}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Valor</Label>
                  <p className="text-lg font-semibold">
                    {selectedPromocion.tipo === 'porcentaje' ? `${selectedPromocion.valor}%` : `$${selectedPromocion.valor}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Fecha de Inicio</Label>
                  <p className="text-lg">{new Date(selectedPromocion.fecha_inicio).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Fecha de Fin</Label>
                  <p className="text-lg">{new Date(selectedPromocion.fecha_fin).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Producto Aplicable</Label>
                <p className="text-lg">{selectedPromocion.nombre_producto || 'Producto no encontrado'}</p>
              </div>

              {selectedPromocion.precio_original && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Cálculo del Descuento</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Precio Original:</span>
                      <span className="font-medium">${selectedPromocion.precio_original}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Descuento Aplicado:</span>
                      <span className="font-medium text-green-600">-${calcularDescuento(selectedPromocion).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Precio Final:</span>
                      <span className="font-semibold text-green-600">
                        ${(selectedPromocion.precio_original - calcularDescuento(selectedPromocion)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 