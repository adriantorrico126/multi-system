import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Package, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id_producto: number;
  nombre: string;
  stock_actual: number;
  precio: number;
  categoria_nombre: string;
}

interface Lote {
  id_lote: number;
  id_producto: number;
  numero_lote: string;
  cantidad_inicial: number;
  cantidad_actual: number;
  fecha_fabricacion: string;
  fecha_caducidad: string;
  precio_compra: number;
  ubicacion_especifica?: string;
  proveedor?: string;
  certificacion_organica: boolean;
  id_restaurante: number;
  producto_nombre?: string;
  categoria_nombre?: string;
  estado_caducidad?: string;
  estado_stock?: string;
}

interface InventoryDashboardProps {
  inventory: Product[];
  lotes: Lote[];
  onFilterChange: (filters: any) => void;
  onExportData: () => void;
}

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({
  inventory,
  lotes,
  onFilterChange,
  onExportData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');

  // Estadísticas generales
  const stats = useMemo(() => {
    const totalProductos = inventory.length;
    const totalStock = inventory.reduce((sum, p) => sum + (p.stock_actual || 0), 0);
    const valorTotal = inventory.reduce((sum, p) => sum + ((p.stock_actual || 0) * (p.precio || 0)), 0);
    const productosSinStock = inventory.filter(p => (p.stock_actual || 0) === 0).length;
    const productosStockBajo = inventory.filter(p => (p.stock_actual || 0) <= 10 && (p.stock_actual || 0) > 0).length;

    return {
      totalProductos,
      totalStock,
      valorTotal,
      productosSinStock,
      productosStockBajo
    };
  }, [inventory]);

  // Lotes por vencer (próximos 7 días)
  const lotesPorVencer = useMemo(() => {
    const sieteDias = new Date();
    sieteDias.setDate(sieteDias.getDate() + 7);
    
    return lotes.filter(lote => {
      if (!lote.fecha_caducidad) return false;
      const fechaCaducidad = new Date(lote.fecha_caducidad);
      return fechaCaducidad <= sieteDias && fechaCaducidad >= new Date();
    });
  }, [lotes]);

  // Productos con stock crítico
  const productosStockCritico = useMemo(() => {
    return inventory.filter(p => (p.stock_actual || 0) <= 5);
  }, [inventory]);

  const handleFilterChange = () => {
    onFilterChange({
      searchTerm,
      selectedCategoria,
      filteredInventory: inventory.filter(product => {
        const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.categoria_nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategoria = selectedCategoria === 'all' || 
                                product.categoria_nombre === selectedCategoria;
        return matchesSearch && matchesCategoria;
      })
    });
  };

  React.useEffect(() => {
    handleFilterChange();
  }, [searchTerm, selectedCategoria]);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Filtros de Inventario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Buscar Producto</label>
              <Input
                placeholder="Nombre o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Categoría</label>
              <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {Array.from(new Set(inventory.map(p => p.categoria_nombre))).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold">{stats.totalProductos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Stock Total</p>
                <p className="text-2xl font-bold">{stats.totalStock.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold">Bs {stats.valorTotal.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Sin Stock</p>
                <p className="text-2xl font-bold">{stats.productosSinStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold">{stats.productosStockBajo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lotes por Vencer */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Clock className="h-5 w-5" />
              Lotes por Vencer (Próximos 7 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lotesPorVencer.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay lotes por vencer</p>
            ) : (
              <div className="space-y-2">
                {lotesPorVencer.slice(0, 5).map((lote) => (
                  <div key={lote.id_lote} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                    <div>
                      <p className="font-medium">{lote.producto_nombre || 'Producto'}</p>
                      <p className="text-sm text-gray-600">Lote: {lote.numero_lote}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{lote.cantidad_actual} unidades</p>
                      <p className="text-xs text-orange-600">
                        Vence: {new Date(lote.fecha_caducidad).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {lotesPorVencer.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    Y {lotesPorVencer.length - 5} lotes más...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Productos con Stock Crítico */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Stock Crítico (≤5 unidades)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productosStockCritico.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay productos con stock crítico</p>
            ) : (
              <div className="space-y-2">
                {productosStockCritico.slice(0, 5).map((producto) => (
                  <div key={producto.id_producto} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <div>
                      <p className="font-medium">{producto.nombre}</p>
                      <p className="text-sm text-gray-600">{producto.categoria_nombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">{producto.stock_actual} unidades</p>
                      <p className="text-xs text-gray-500">Bs {producto.precio}</p>
                    </div>
                  </div>
                ))}
                {productosStockCritico.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    Y {productosStockCritico.length - 5} productos más...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
