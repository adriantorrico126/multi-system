import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Package, Clock, DollarSign, Plus, Edit, Trash2, Eye, Calendar, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Lote {
  id_lote: number;
  id_producto: number;
  numero_lote: string;
  cantidad_inicial: number;
  cantidad_actual: number;
  fecha_fabricacion: string;
  fecha_caducidad: string;
  precio_compra: number | null;
  id_restaurante: number;
  producto_nombre?: string;
  categoria_nombre?: string;
}

interface Product {
  id_producto: number;
  nombre: string;
  stock_actual: number;
  precio: number;
  categoria_nombre: string;
}

interface LotesManagementProps {
  lotes: Lote[];
  products: Product[];
  onSave: (lote: Lote) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  loading: boolean;
}

export const LotesManagement: React.FC<LotesManagementProps> = ({
  lotes,
  products,
  onSave,
  onDelete,
  loading
}) => {
  const { toast } = useToast();
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  
  // Estados para modal de información
  const [selectedLoteForInfo, setSelectedLoteForInfo] = useState<Lote | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const openInfoDialog = (lote: Lote) => {
    setSelectedLoteForInfo(lote);
    setIsInfoDialogOpen(true);
  };

  // Mapeo de productos para mostrar nombres
  const productMap = useMemo(() => {
    return products.reduce((map, product) => {
      map[product.id_producto] = product;
      return map;
    }, {} as Record<number, Product>);
  }, [products]);

  // Lotes filtrados
  const filteredLotes = useMemo(() => {
    // Debug: verificar estructura de lotes
    console.log('🔍 LotesManagement Debug - lotes:', lotes);
    console.log('🔍 LotesManagement Debug - primer lote:', lotes[0]);
    console.log('🔍 LotesManagement Debug - precio_compra del primer lote:', lotes[0]?.precio_compra, 'tipo:', typeof lotes[0]?.precio_compra);
    
    return lotes.filter(lote => {
      const product = productMap[lote.id_producto];
      const matchesSearch = product?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lote.numero_lote.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesProduct = productFilter === 'all' || product?.id_producto.toString() === productFilter;
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'expired' && new Date(lote.fecha_caducidad) < new Date()) ||
        (statusFilter === 'expiring' && new Date(lote.fecha_caducidad) > new Date() && 
         new Date(lote.fecha_caducidad) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) ||
        (statusFilter === 'active' && new Date(lote.fecha_caducidad) > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      
      return matchesSearch && matchesProduct && matchesStatus;
    });
  }, [lotes, products, searchTerm, statusFilter, productFilter]);

  // Estadísticas de lotes
  const stats = useMemo(() => {
    const totalLotes = lotes.length;
    const expiredLotes = lotes.filter(l => new Date(l.fecha_caducidad) < new Date()).length;
    const expiringLotes = lotes.filter(l => {
      const expiryDate = new Date(l.fecha_caducidad);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;
    const totalValue = lotes.reduce((sum, l) => sum + ((l.precio_compra || 0) * l.cantidad_actual), 0);
    const lowStockLotes = lotes.filter(l => l.cantidad_actual <= 5 && l.cantidad_actual > 0).length;

    return { totalLotes, expiredLotes, expiringLotes, totalValue, lowStockLotes };
  }, [lotes]);

  // Función para calcular días hasta caducidad
  const getDaysUntilExpiry = (fechaCaducidad: string) => {
    const expiryDate = new Date(fechaCaducidad);
    const today = new Date();
    return Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Función para obtener el estado del lote
  const getLoteStatus = (lote: Lote) => {
    const daysUntilExpiry = getDaysUntilExpiry(lote.fecha_caducidad);
    
    if (daysUntilExpiry < 0) {
      return { label: 'Caducado', variant: 'destructive' as const, icon: AlertTriangle };
    } else if (daysUntilExpiry <= 7) {
      return { label: 'Crítico', variant: 'destructive' as const, icon: Clock };
    } else if (daysUntilExpiry <= 30) {
      return { label: 'Por Caducar', variant: 'secondary' as const, icon: Clock };
    } else {
      return { label: 'Activo', variant: 'default' as const, icon: Package };
    }
  };

  // Función para obtener el estado del stock
  const getStockStatus = (lote: Lote) => {
    if (lote.cantidad_actual === 0) {
      return { label: 'Sin Stock', variant: 'destructive' as const };
    } else if (lote.cantidad_actual <= 5) {
      return { label: 'Stock Bajo', variant: 'secondary' as const };
    } else {
      return { label: 'Stock OK', variant: 'default' as const };
    }
  };

  const handleSave = async (loteData: Lote) => {
    try {
      await onSave(loteData);
      toast({
        title: selectedLote ? "Lote Actualizado" : "Lote Creado",
        description: selectedLote ? "El lote ha sido actualizado exitosamente" : "El lote ha sido creado exitosamente",
      });
      setIsDialogOpen(false);
      setSelectedLote(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el lote",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este lote?')) {
      try {
        await onDelete(id);
        toast({
          title: "Lote Eliminado",
          description: "El lote ha sido eliminado exitosamente",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el lote",
          variant: "destructive",
        });
      }
    }
  };

  const openCreateDialog = () => {
    setSelectedLote(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (lote: Lote) => {
    setSelectedLote(lote);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-800">Total Lotes</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-blue-900">{stats.totalLotes}</div>
            <p className="text-xs text-blue-600 hidden sm:block">Lotes registrados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-red-800">Caducados</CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-red-900">{stats.expiredLotes}</div>
            <p className="text-xs text-red-600 hidden sm:block">Lotes vencidos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-orange-800">Por Caducar</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-orange-900">{stats.expiringLotes}</div>
            <p className="text-xs text-orange-600 hidden sm:block">≤ 30 días</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-yellow-800">Stock Bajo</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-yellow-900">{stats.lowStockLotes}</div>
            <p className="text-xs text-yellow-600 hidden sm:block">≤ 5 unidades</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-800">Valor Total</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-green-900">Bs {stats.totalValue.toFixed(2)}</div>
            <p className="text-xs text-green-600 hidden sm:block">Valor en lotes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y acciones */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-lg sm:text-xl">Gestión de Lotes</CardTitle>
            <Button onClick={openCreateDialog} className="flex items-center gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Crear Lote</span>
              <span className="sm:hidden">Crear</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Lote o producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Producto</label>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Todos los productos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los productos</SelectItem>
                  {products.map(product => (
                    <SelectItem key={product.id_producto} value={product.id_producto.toString()}>
                      {product.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="expiring">Por Caducar</SelectItem>
                  <SelectItem value="expired">Caducados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Resultados</label>
              <div className="text-sm text-gray-500 pt-2">
                {filteredLotes.length} lotes encontrados
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de lotes */}
      <Card>
        <CardContent className="p-3 sm:p-6 pt-3 sm:pt-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Cargando lotes...</p>
            </div>
          ) : (
            <>
              {/* Vista móvil: Tarjetas */}
              <div className="lg:hidden space-y-3">
                {filteredLotes.map((lote) => {
                  const product = productMap[lote.id_producto];
                  const loteStatus = getLoteStatus(lote);
                  const stockStatus = getStockStatus(lote);
                  const daysUntilExpiry = getDaysUntilExpiry(lote.fecha_caducidad);
                  
                  return (
                    <Card key={lote.id_lote} className={cn(
                      "hover:shadow-md transition-shadow",
                      daysUntilExpiry < 0 && "bg-red-50 border-red-200",
                      daysUntilExpiry <= 7 && daysUntilExpiry > 0 && "bg-orange-50 border-orange-200"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {product?.nombre || `Producto ${lote.id_producto}`}
                              </h3>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openInfoDialog(lote)}
                                className="p-1 h-6 w-6 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <span className="truncate">{product?.categoria_nombre}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Lote:</span>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {lote.numero_lote}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Stock:</span>
                                <Badge variant={stockStatus.variant} className="text-xs">
                                  {lote.cantidad_actual} / {lote.cantidad_inicial}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Estado:</span>
                                <Badge variant={loteStatus.variant} className="flex items-center gap-1 text-xs">
                                  <loteStatus.icon className="h-2 w-2" />
                                  {loteStatus.label}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Precio:</span>
                                <span className="text-sm font-medium text-green-600">
                                  Bs {(() => {
                                    const precio = lote.precio_compra;
                                    if (precio === null || precio === undefined) return '0.00';
                                    if (typeof precio === 'string') return parseFloat(precio).toFixed(2);
                                    if (typeof precio === 'number') return precio.toFixed(2);
                                    return '0.00';
                                  })()}
                                </span>
                              </div>
                              {daysUntilExpiry > 0 && (
                                <div className="text-xs text-gray-500">
                                  {daysUntilExpiry} días restantes
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(lote)}
                            className="text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(lote.id_lote)}
                            className="text-xs"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Vista desktop: Tabla */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Número de Lote</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Fechas</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Precio Compra</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLotes.map((lote) => {
                      const product = productMap[lote.id_producto];
                      const loteStatus = getLoteStatus(lote);
                      const stockStatus = getStockStatus(lote);
                      const daysUntilExpiry = getDaysUntilExpiry(lote.fecha_caducidad);
                      
                      return (
                        <TableRow key={lote.id_lote} className={cn(
                          daysUntilExpiry < 0 && "bg-red-50",
                          daysUntilExpiry <= 7 && daysUntilExpiry > 0 && "bg-orange-50"
                        )}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product?.nombre || `Producto ${lote.id_producto}`}</p>
                              <p className="text-sm text-gray-500">{product?.categoria_nombre}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {lote.numero_lote}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={stockStatus.variant}>
                                  {lote.cantidad_actual} / {lote.cantidad_inicial}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500">
                                {((lote.cantidad_actual / lote.cantidad_inicial) * 100).toFixed(1)}% restante
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                <span className="font-medium">Fab:</span> {new Date(lote.fecha_fabricacion).toLocaleDateString()}
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Cad:</span> {new Date(lote.fecha_caducidad).toLocaleDateString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={loteStatus.variant} className="flex items-center gap-1">
                              <loteStatus.icon className="h-3 w-3" />
                              {loteStatus.label}
                            </Badge>
                            {daysUntilExpiry > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {daysUntilExpiry} días restantes
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-right">
                              <div className="font-medium">
                                Bs {(() => {
                                  const precio = lote.precio_compra;
                                  console.log('🔍 Debug precio_compra:', precio, 'tipo:', typeof precio);
                                  if (precio === null || precio === undefined) return '0.00';
                                  if (typeof precio === 'string') return parseFloat(precio).toFixed(2);
                                  if (typeof precio === 'number') return precio.toFixed(2);
                                  return '0.00';
                                })()}
                              </div>
                              <div className="text-xs text-gray-500">
                                Total: Bs {(() => {
                                  const precio = lote.precio_compra || 0;
                                  const cantidad = lote.cantidad_actual || 0;
                                  return (precio * cantidad).toFixed(2);
                                })()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(lote)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(lote.id_lote)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Lote */}
      <LoteDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedLote(null);
        }}
        onSave={handleSave}
        products={products}
        lote={selectedLote}
      />

      {/* Modal de información para lotes */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalles del Lote
            </DialogTitle>
          </DialogHeader>
          
          {selectedLoteForInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">ID Lote</Label>
                  <p className="font-medium">{selectedLoteForInfo.id_lote}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Número de Lote</Label>
                  <Badge variant="outline" className="font-mono">
                    {selectedLoteForInfo.numero_lote}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Producto</Label>
                <p className="font-medium">
                  {productMap[selectedLoteForInfo.id_producto]?.nombre || `Producto ${selectedLoteForInfo.id_producto}`}
                </p>
                <p className="text-sm text-gray-500">
                  {productMap[selectedLoteForInfo.id_producto]?.categoria_nombre}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Cantidad Inicial</Label>
                  <p className="font-medium">{selectedLoteForInfo.cantidad_inicial}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Cantidad Actual</Label>
                  <p className="font-medium">{selectedLoteForInfo.cantidad_actual}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Fecha Fabricación</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{new Date(selectedLoteForInfo.fecha_fabricacion).toLocaleDateString()}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Fecha Caducidad</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{new Date(selectedLoteForInfo.fecha_caducidad).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Estado del Lote</Label>
                  <div className="mt-1">
                    {(() => {
                      const loteStatus = getLoteStatus(selectedLoteForInfo);
                      return (
                        <Badge variant={loteStatus.variant} className="flex items-center gap-1">
                          <loteStatus.icon className="h-3 w-3" />
                          {loteStatus.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Estado del Stock</Label>
                  <div className="mt-1">
                    {(() => {
                      const stockStatus = getStockStatus(selectedLoteForInfo);
                      return (
                        <Badge variant={stockStatus.variant}>
                          {stockStatus.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Precio de Compra</Label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <span className="text-lg font-bold text-green-600">
                    Bs {(() => {
                      const precio = selectedLoteForInfo.precio_compra;
                      if (precio === null || precio === undefined) return '0.00';
                      if (typeof precio === 'string') return parseFloat(precio).toFixed(2);
                      if (typeof precio === 'number') return precio.toFixed(2);
                      return '0.00';
                    })()}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Valor total: Bs {(() => {
                    const precio = selectedLoteForInfo.precio_compra || 0;
                    const cantidad = selectedLoteForInfo.cantidad_actual || 0;
                    return (precio * cantidad).toFixed(2);
                  })()}
                </div>
              </div>
              
              {(() => {
                const daysUntilExpiry = getDaysUntilExpiry(selectedLoteForInfo.fecha_caducidad);
                if (daysUntilExpiry > 0) {
                  return (
                    <div>
                      <Label className="text-gray-500">Días Restantes</Label>
                      <p className="font-medium text-blue-600">{daysUntilExpiry} días</p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsInfoDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cerrar
            </Button>
            {selectedLoteForInfo && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsInfoDialogOpen(false);
                    openEditDialog(selectedLoteForInfo);
                  }}
                  className="w-full sm:w-auto"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsInfoDialogOpen(false);
                    handleDelete(selectedLoteForInfo.id_lote);
                  }}
                  className="w-full sm:w-auto text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Componente del modal de lote (simplificado)
interface LoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lote: Lote) => Promise<void>;
  lote: Lote | null;
  products: Product[];
}

const LoteDialog: React.FC<LoteDialogProps> = ({ isOpen, onClose, onSave, lote, products }) => {
  const [formData, setFormData] = useState<Partial<Lote>>(lote || {});

  useEffect(() => {
    const initialData = lote ? {
      ...lote,
      fecha_fabricacion: lote.fecha_fabricacion ? new Date(lote.fecha_fabricacion).toISOString().split('T')[0] : '',
      fecha_caducidad: lote.fecha_caducidad ? new Date(lote.fecha_caducidad).toISOString().split('T')[0] : '',
    } : {};
    setFormData(initialData);
  }, [lote, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, id_producto: parseInt(value, 10) });
  };

  const handleSave = () => {
    onSave(formData as Lote);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{lote ? 'Editar Lote' : 'Crear Lote'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id_producto" className="text-sm">Producto</Label>
              <Select onValueChange={handleSelectChange} value={formData.id_producto?.toString() || ''}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id_producto} value={product.id_producto.toString()}>
                      {product.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numero_lote" className="text-sm">Número de Lote</Label>
              <Input
                id="numero_lote"
                name="numero_lote"
                value={formData.numero_lote || ''}
                onChange={handleChange}
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cantidad_inicial" className="text-sm">Cantidad Inicial</Label>
              <Input
                id="cantidad_inicial"
                name="cantidad_inicial"
                type="number"
                value={formData.cantidad_inicial || ''}
                onChange={handleChange}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cantidad_actual" className="text-sm">Cantidad Actual</Label>
              <Input
                id="cantidad_actual"
                name="cantidad_actual"
                type="number"
                value={formData.cantidad_actual || ''}
                onChange={handleChange}
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_fabricacion" className="text-sm">Fecha de Fabricación</Label>
              <Input
                id="fecha_fabricacion"
                name="fecha_fabricacion"
                type="date"
                value={formData.fecha_fabricacion || ''}
                onChange={handleChange}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fecha_caducidad" className="text-sm">Fecha de Caducidad</Label>
              <Input
                id="fecha_caducidad"
                name="fecha_caducidad"
                type="date"
                value={formData.fecha_caducidad || ''}
                onChange={handleChange}
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="precio_compra" className="text-sm">Precio de Compra</Label>
            <Input
              id="precio_compra"
              name="precio_compra"
              type="number"
              step="0.01"
              value={formData.precio_compra || ''}
              onChange={handleChange}
              className="text-sm"
            />
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancelar</Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
