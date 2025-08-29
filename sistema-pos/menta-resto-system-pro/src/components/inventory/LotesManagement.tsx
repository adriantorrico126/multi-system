import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Package, Clock, DollarSign, Plus, Edit, Trash2, Eye } from 'lucide-react';
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
  precio_compra: number;
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

  // Mapeo de productos para mostrar nombres
  const productMap = useMemo(() => {
    return products.reduce((map, product) => {
      map[product.id_producto] = product;
      return map;
    }, {} as Record<number, Product>);
  }, [products]);

  // Lotes filtrados
  const filteredLotes = useMemo(() => {
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
    const totalValue = lotes.reduce((sum, l) => sum + (l.precio_compra * l.cantidad_actual), 0);
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
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Lotes</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalLotes}</div>
            <p className="text-xs text-blue-600">Lotes registrados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Caducados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{stats.expiredLotes}</div>
            <p className="text-xs text-red-600">Lotes vencidos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Por Caducar</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.expiringLotes}</div>
            <p className="text-xs text-orange-600">≤ 30 días</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Stock Bajo</CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{stats.lowStockLotes}</div>
            <p className="text-xs text-yellow-600">≤ 5 unidades</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">Bs {stats.totalValue.toFixed(2)}</div>
            <p className="text-xs text-green-600">Valor en lotes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y acciones */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gestión de Lotes</CardTitle>
            <Button onClick={openCreateDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Crear Lote
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Lote o producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Producto</label>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger>
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
                <SelectTrigger>
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
              <label className="text-sm font-medium">Acciones</label>
              <div className="text-sm text-gray-500 pt-2">
                {filteredLotes.length} lotes encontrados
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de lotes */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Cargando lotes...</p>
            </div>
          ) : (
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
                          <div className="font-medium">Bs {lote.precio_compra.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">
                            Total: Bs {(lote.precio_compra * lote.cantidad_actual).toFixed(2)}
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{lote ? 'Editar Lote' : 'Crear Lote'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id_producto">Producto</Label>
              <Select onValueChange={handleSelectChange} value={formData.id_producto?.toString() || ''}>
                <SelectTrigger>
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
              <Label htmlFor="numero_lote">Número de Lote</Label>
              <Input
                id="numero_lote"
                name="numero_lote"
                value={formData.numero_lote || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cantidad_inicial">Cantidad Inicial</Label>
              <Input
                id="cantidad_inicial"
                name="cantidad_inicial"
                type="number"
                value={formData.cantidad_inicial || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cantidad_actual">Cantidad Actual</Label>
              <Input
                id="cantidad_actual"
                name="cantidad_actual"
                type="number"
                value={formData.cantidad_actual || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_fabricacion">Fecha de Fabricación</Label>
              <Input
                id="fecha_fabricacion"
                name="fecha_fabricacion"
                type="date"
                value={formData.fecha_fabricacion || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fecha_caducidad">Fecha de Caducidad</Label>
              <Input
                id="fecha_caducidad"
                name="fecha_caducidad"
                type="date"
                value={formData.fecha_caducidad || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="precio_compra">Precio de Compra</Label>
            <Input
              id="precio_compra"
              name="precio_compra"
              type="number"
              step="0.01"
              value={formData.precio_compra || ''}
              onChange={handleChange}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
