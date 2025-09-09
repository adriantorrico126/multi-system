import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Download, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package,
  Calendar,
  BarChart3,
  AlertTriangle,
  Eye,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InventoryReportProps {
  inventory: any[];
  lotes: any[];
  movements: any[];
}

export const InventoryReports: React.FC<InventoryReportProps> = ({
  inventory,
  lotes,
  movements
}) => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState('30');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Estados para modales de información
  const [selectedProductForInfo, setSelectedProductForInfo] = useState<any>(null);
  const [isProductInfoDialogOpen, setIsProductInfoDialogOpen] = useState(false);
  const [selectedMovementForInfo, setSelectedMovementForInfo] = useState<any>(null);
  const [isMovementInfoDialogOpen, setIsMovementInfoDialogOpen] = useState(false);
  const [selectedLoteForInfo, setSelectedLoteForInfo] = useState<any>(null);
  const [isLoteInfoDialogOpen, setIsLoteInfoDialogOpen] = useState(false);

  const openProductInfoDialog = (product: any) => {
    setSelectedProductForInfo(product);
    setIsProductInfoDialogOpen(true);
  };

  const openMovementInfoDialog = (movement: any) => {
    setSelectedMovementForInfo(movement);
    setIsMovementInfoDialogOpen(true);
  };

  const openLoteInfoDialog = (lote: any) => {
    setSelectedLoteForInfo(lote);
    setIsLoteInfoDialogOpen(true);
  };

  // Categorías únicas
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(inventory.map(p => p.categoria_nombre).filter(Boolean))];
    return uniqueCategories.sort();
  }, [inventory]);

  // Filtros aplicados
  const filteredInventory = useMemo(() => {
    if (categoryFilter === 'all') return inventory;
    return inventory.filter(p => p.categoria_nombre === categoryFilter);
  }, [inventory, categoryFilter]);

  // Filtros de movimientos por fecha
  const filteredMovements = useMemo(() => {
    const days = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return movements.filter(m => new Date(m.fecha_movimiento) >= cutoffDate);
  }, [movements, dateRange]);

  // Estadísticas del reporte
  const reportStats = useMemo(() => {
    const totalProducts = filteredInventory.length;
    const totalValue = filteredInventory.reduce((sum, p) => sum + ((Number(p.precio) || 0) * (Number(p.stock_actual) || 0)), 0);
    const lowStockProducts = filteredInventory.filter(p => (p.stock_actual || 0) <= 10).length;
    const outOfStockProducts = filteredInventory.filter(p => (p.stock_actual || 0) === 0).length;
    
    // Análisis de movimientos
    const totalMovements = filteredMovements.length;
    const entradaMovements = filteredMovements.filter(m => m.tipo_movimiento === 'entrada').length;
    const salidaMovements = filteredMovements.filter(m => m.tipo_movimiento === 'salida').length;
    
    // Productos más movidos
    const productMovements = filteredMovements.reduce((acc, m) => {
      acc[m.producto_nombre] = (acc[m.producto_nombre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topProducts = Object.entries(productMovements)
      .sort(([,a], [,b]) => Number(b) - Number(a))
      .slice(0, 5);

    return {
      totalProducts,
      totalValue,
      lowStockProducts,
      outOfStockProducts,
      totalMovements,
      entradaMovements,
      salidaMovements,
      topProducts
    };
  }, [filteredInventory, filteredMovements]);

  // Función para exportar a CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay datos para exportar",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return String(value || '');
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportación exitosa",
      description: `Reporte exportado como ${filename}.csv`,
    });
  };

  // Función para exportar reporte de inventario
  const exportInventoryReport = () => {
    const reportData = filteredInventory.map(product => ({
      'ID Producto': product.id_producto,
      'Nombre': product.nombre,
      'Categoría': product.categoria_nombre,
      'Stock Actual': product.stock_actual,
      'Precio': product.precio,
      'Valor Total': (product.precio * product.stock_actual).toFixed(2),
      'Estado': (product.stock_actual || 0) === 0 ? 'Sin Stock' : 
                (product.stock_actual || 0) <= 10 ? 'Stock Bajo' : 'Stock OK'
    }));

    exportToCSV(reportData, `inventario_${new Date().toISOString().split('T')[0]}`);
  };

  // Función para exportar reporte de movimientos
  const exportMovementsReport = () => {
    const reportData = filteredMovements.map(movement => ({
      'Fecha': new Date(movement.fecha_movimiento).toLocaleDateString(),
      'Producto': movement.producto_nombre,
      'Tipo': movement.tipo_movimiento,
      'Cantidad': movement.cantidad,
      'Stock Anterior': movement.stock_anterior,
      'Stock Actual': movement.stock_actual,
      'Vendedor': movement.vendedor_username
    }));

    exportToCSV(reportData, `movimientos_${dateRange}dias_${new Date().toISOString().split('T')[0]}`);
  };

  // Función para exportar reporte de lotes
  const exportLotesReport = () => {
    const reportData = lotes.map(lote => {
      const daysUntilExpiry = Math.ceil(
        (new Date(lote.fecha_caducidad).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return {
        'ID Lote': lote.id_lote,
        'Número Lote': lote.numero_lote,
        'Producto': lote.producto_nombre || `Producto ${lote.id_producto}`,
        'Cantidad Inicial': lote.cantidad_inicial,
        'Cantidad Actual': lote.cantidad_actual,
        'Fecha Fabricación': new Date(lote.fecha_fabricacion).toLocaleDateString(),
        'Fecha Caducidad': new Date(lote.fecha_caducidad).toLocaleDateString(),
        'Días hasta Caducidad': daysUntilExpiry,
        'Precio Compra': lote.precio_compra,
        'Valor Total': (lote.precio_compra * lote.cantidad_actual).toFixed(2),
        'Estado': daysUntilExpiry < 0 ? 'Caducado' : 
                  daysUntilExpiry <= 7 ? 'Crítico' : 
                  daysUntilExpiry <= 30 ? 'Por Caducar' : 'Activo'
      };
    });

    exportToCSV(reportData, `lotes_${new Date().toISOString().split('T')[0]}`);
  };

  // Renderizar reporte según el tipo
  const renderReport = () => {
    switch (reportType) {
      case 'summary':
        return (
          <div className="space-y-4 sm:space-y-6">
            {/* Resumen ejecutivo */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Resumen Ejecutivo del Inventario
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-blue-600">{reportStats.totalProducts}</div>
                    <div className="text-xs sm:text-sm text-blue-600">Total Productos</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-green-600">Bs {reportStats.totalValue.toFixed(2)}</div>
                    <div className="text-xs sm:text-sm text-green-600">Valor Total</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-orange-600">{reportStats.lowStockProducts}</div>
                    <div className="text-xs sm:text-sm text-orange-600">Stock Bajo</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-red-600">{reportStats.outOfStockProducts}</div>
                    <div className="text-xs sm:text-sm text-red-600">Sin Stock</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Análisis de movimientos */}
                  <Card>
                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="text-base sm:text-lg">Análisis de Movimientos ({dateRange} días)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm sm:text-base">Total Movimientos:</span>
                          <Badge variant="outline" className="text-xs sm:text-sm">{reportStats.totalMovements}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm sm:text-base">Entradas:</span>
                          <Badge variant="default" className="bg-green-100 text-green-800 text-xs sm:text-sm">
                            {reportStats.entradaMovements}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm sm:text-base">Salidas:</span>
                          <Badge variant="default" className="bg-red-100 text-red-800 text-xs sm:text-sm">
                            {reportStats.salidaMovements}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Productos más movidos */}
                  <Card>
                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="text-base sm:text-lg">Productos Más Movidos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
                      <div className="space-y-2">
                        {reportStats.topProducts.map(([product, count], index) => (
                          <div key={String(product)} className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm truncate">{index + 1}. {String(product)}</span>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs sm:text-sm">
                              {String(count)} movimientos
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de productos críticos */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-red-700 text-lg sm:text-xl">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                  Productos Críticos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                {/* Vista móvil: Tarjetas */}
                <div className="lg:hidden space-y-3">
                  {filteredInventory
                    .filter(p => (p.stock_actual || 0) <= 10)
                    .sort((a, b) => (a.stock_actual || 0) - (b.stock_actual || 0))
                    .map((product) => (
                      <Card key={product.id_producto} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900 truncate">{product.nombre}</h3>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openProductInfoDialog(product)}
                                  className="p-1 h-6 w-6 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <span className="truncate">{product.categoria_nombre}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Stock:</span>
                                  <Badge variant={product.stock_actual === 0 ? "destructive" : "secondary"} className="text-xs">
                                    {product.stock_actual || 0}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Precio:</span>
                                  <span className="text-sm font-medium text-green-600">
                                    Bs {product.precio?.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Valor:</span>
                                  <span className="text-sm font-medium text-blue-600">
                                    Bs {((product.precio || 0) * (product.stock_actual || 0)).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Estado:</span>
                                  <Badge variant={product.stock_actual === 0 ? "destructive" : "secondary"} className="text-xs">
                                    {product.stock_actual === 0 ? 'Sin Stock' : 'Stock Bajo'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {/* Vista desktop: Tabla */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Stock Actual</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory
                        .filter(p => (p.stock_actual || 0) <= 10)
                        .sort((a, b) => (a.stock_actual || 0) - (b.stock_actual || 0))
                        .map((product) => (
                          <TableRow key={product.id_producto}>
                            <TableCell className="font-medium">{product.nombre}</TableCell>
                            <TableCell>{product.categoria_nombre}</TableCell>
                            <TableCell>
                              <Badge variant={product.stock_actual === 0 ? "destructive" : "secondary"}>
                                {product.stock_actual || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>Bs {product.precio?.toFixed(2)}</TableCell>
                            <TableCell>Bs {((product.precio || 0) * (product.stock_actual || 0)).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={product.stock_actual === 0 ? "destructive" : "secondary"}>
                                {product.stock_actual === 0 ? 'Sin Stock' : 'Stock Bajo'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'movements':
        return (
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                Reporte de Movimientos ({dateRange} días)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {/* Vista móvil: Tarjetas */}
              <div className="lg:hidden space-y-3">
                {filteredMovements.map((movement) => (
                  <Card key={movement.id_movimiento} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 truncate">{movement.producto_nombre}</h3>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openMovementInfoDialog(movement)}
                              className="p-1 h-6 w-6 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(movement.fecha_movimiento).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Tipo:</span>
                              <Badge variant={movement.tipo_movimiento === 'entrada' ? 'default' : 'secondary'} className="text-xs">
                                {movement.tipo_movimiento}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Cantidad:</span>
                              <span className="text-sm font-medium text-blue-600">{movement.cantidad}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Stock Anterior:</span>
                              <span className="text-sm font-medium text-gray-600">{movement.stock_anterior}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Stock Actual:</span>
                              <span className="text-sm font-medium text-green-600">{movement.stock_actual}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <User className="h-3 w-3" />
                              <span className="truncate">{movement.vendedor_username}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Vista desktop: Tabla */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Stock Anterior</TableHead>
                      <TableHead>Stock Actual</TableHead>
                      <TableHead>Vendedor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.map((movement) => (
                      <TableRow key={movement.id_movimiento}>
                        <TableCell>{new Date(movement.fecha_movimiento).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{movement.producto_nombre}</TableCell>
                        <TableCell>
                          <Badge variant={movement.tipo_movimiento === 'entrada' ? 'default' : 'secondary'}>
                            {movement.tipo_movimiento}
                          </Badge>
                        </TableCell>
                        <TableCell>{movement.cantidad}</TableCell>
                        <TableCell>{movement.stock_anterior}</TableCell>
                        <TableCell>{movement.stock_actual}</TableCell>
                        <TableCell>{movement.vendedor_username}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );

      case 'lotes':
        return (
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                Reporte de Lotes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {/* Vista móvil: Tarjetas */}
              <div className="lg:hidden space-y-3">
                {lotes.map((lote) => {
                  const daysUntilExpiry = Math.ceil(
                    (new Date(lote.fecha_caducidad).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <Card key={lote.id_lote} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {lote.producto_nombre || `Producto ${lote.id_producto}`}
                              </h3>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openLoteInfoDialog(lote)}
                                className="p-1 h-6 w-6 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Lote:</span>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {lote.numero_lote}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Stock:</span>
                                <span className="text-sm font-medium text-blue-600">
                                  {lote.cantidad_actual} / {lote.cantidad_inicial}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Fabricación:</span>
                                <span className="text-sm font-medium text-gray-600">
                                  {new Date(lote.fecha_fabricacion).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Caducidad:</span>
                                <span className="text-sm font-medium text-gray-600">
                                  {new Date(lote.fecha_caducidad).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Estado:</span>
                                <Badge 
                                  variant={daysUntilExpiry < 0 ? "destructive" : 
                                          daysUntilExpiry <= 7 ? "destructive" : 
                                          daysUntilExpiry <= 30 ? "secondary" : "default"}
                                  className="text-xs"
                                >
                                  {daysUntilExpiry < 0 ? 'Caducado' : 
                                   daysUntilExpiry <= 7 ? 'Crítico' : 
                                   daysUntilExpiry <= 30 ? 'Por Caducar' : 'Activo'}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Valor:</span>
                                <span className="text-sm font-medium text-green-600">
                                  Bs {(lote.precio_compra * lote.cantidad_actual).toFixed(2)}
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
                      <TableHead>Lote</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Fechas</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lotes.map((lote) => {
                      const daysUntilExpiry = Math.ceil(
                        (new Date(lote.fecha_caducidad).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      );
                      
                      return (
                        <TableRow key={lote.id_lote}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {lote.numero_lote}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {lote.producto_nombre || `Producto ${lote.id_producto}`}
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="font-medium">{lote.cantidad_actual}</div>
                              <div className="text-xs text-gray-500">de {lote.cantidad_inicial}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Fab: {new Date(lote.fecha_fabricacion).toLocaleDateString()}</div>
                              <div>Cad: {new Date(lote.fecha_caducidad).toLocaleDateString()}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={daysUntilExpiry < 0 ? "destructive" : 
                                      daysUntilExpiry <= 7 ? "destructive" : 
                                      daysUntilExpiry <= 30 ? "secondary" : "default"}
                            >
                              {daysUntilExpiry < 0 ? 'Caducado' : 
                               daysUntilExpiry <= 7 ? 'Crítico' : 
                               daysUntilExpiry <= 30 ? 'Por Caducar' : 'Activo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-right">
                              <div className="font-medium">Bs {(lote.precio_compra * lote.cantidad_actual).toFixed(2)}</div>
                              <div className="text-xs text-gray-500">Bs {lote.precio_compra.toFixed(2)} c/u</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Controles del reporte */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            Generador de Reportes de Inventario
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="space-y-2">
              <Label htmlFor="reportType" className="text-sm">Tipo de Reporte</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Resumen Ejecutivo</SelectItem>
                  <SelectItem value="movements">Movimientos de Stock</SelectItem>
                  <SelectItem value="lotes">Reporte de Lotes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRange" className="text-sm">Rango de Fechas</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecciona rango" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 días</SelectItem>
                  <SelectItem value="30">Últimos 30 días</SelectItem>
                  <SelectItem value="90">Últimos 90 días</SelectItem>
                  <SelectItem value="365">Último año</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryFilter" className="text-sm">Categoría</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Acciones</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={exportInventoryReport} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2 text-xs"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Inventario</span>
                  <span className="sm:hidden">Inv.</span>
                </Button>
                <Button 
                  onClick={exportMovementsReport} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2 text-xs"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Movimientos</span>
                  <span className="sm:hidden">Mov.</span>
                </Button>
                <Button 
                  onClick={exportLotesReport} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2 text-xs"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Lotes</span>
                  <span className="sm:hidden">Lot.</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido del reporte */}
      {renderReport()}

      {/* Modal de información para productos */}
      <Dialog open={isProductInfoDialogOpen} onOpenChange={setIsProductInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalles del Producto
            </DialogTitle>
          </DialogHeader>
          
          {selectedProductForInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">ID</Label>
                  <p className="font-medium">{selectedProductForInfo.id_producto}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Categoría</Label>
                  <p className="font-medium">{selectedProductForInfo.categoria_nombre}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Nombre del Producto</Label>
                <p className="font-medium">{selectedProductForInfo.nombre}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Stock Actual</Label>
                  <div className="mt-1">
                    <Badge variant={selectedProductForInfo.stock_actual === 0 ? "destructive" : "secondary"}>
                      {selectedProductForInfo.stock_actual || 0}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Estado</Label>
                  <div className="mt-1">
                    <Badge variant={selectedProductForInfo.stock_actual === 0 ? "destructive" : "secondary"}>
                      {selectedProductForInfo.stock_actual === 0 ? 'Sin Stock' : 'Stock Bajo'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Precio</Label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <span className="text-lg font-bold text-green-600">
                    Bs {selectedProductForInfo.precio?.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Valor Total</Label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-400" />
                  <span className="text-lg font-bold text-blue-600">
                    Bs {((selectedProductForInfo.precio || 0) * (selectedProductForInfo.stock_actual || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsProductInfoDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de información para movimientos */}
      <Dialog open={isMovementInfoDialogOpen} onOpenChange={setIsMovementInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalles del Movimiento
            </DialogTitle>
          </DialogHeader>
          
          {selectedMovementForInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">ID Movimiento</Label>
                  <p className="font-medium">{selectedMovementForInfo.id_movimiento}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Fecha</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{new Date(selectedMovementForInfo.fecha_movimiento).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Producto</Label>
                <p className="font-medium">{selectedMovementForInfo.producto_nombre}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Tipo de Movimiento</Label>
                  <div className="mt-1">
                    <Badge variant={selectedMovementForInfo.tipo_movimiento === 'entrada' ? 'default' : 'secondary'}>
                      {selectedMovementForInfo.tipo_movimiento}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Cantidad</Label>
                  <p className="text-lg font-bold text-blue-600">{selectedMovementForInfo.cantidad}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Stock Anterior</Label>
                  <p className="font-medium text-gray-600">{selectedMovementForInfo.stock_anterior}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Stock Actual</Label>
                  <p className="font-medium text-green-600">{selectedMovementForInfo.stock_actual}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Vendedor</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-400" />
                  <span className="font-medium">{selectedMovementForInfo.vendedor_username}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsMovementInfoDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de información para lotes */}
      <Dialog open={isLoteInfoDialogOpen} onOpenChange={setIsLoteInfoDialogOpen}>
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
                  {selectedLoteForInfo.producto_nombre || `Producto ${selectedLoteForInfo.id_producto}`}
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
              
              <div>
                <Label className="text-gray-500">Estado del Lote</Label>
                <div className="mt-1">
                  {(() => {
                    const daysUntilExpiry = Math.ceil(
                      (new Date(selectedLoteForInfo.fecha_caducidad).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <Badge 
                        variant={daysUntilExpiry < 0 ? "destructive" : 
                                daysUntilExpiry <= 7 ? "destructive" : 
                                daysUntilExpiry <= 30 ? "secondary" : "default"}
                      >
                        {daysUntilExpiry < 0 ? 'Caducado' : 
                         daysUntilExpiry <= 7 ? 'Crítico' : 
                         daysUntilExpiry <= 30 ? 'Por Caducar' : 'Activo'}
                      </Badge>
                    );
                  })()}
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Precio de Compra</Label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <span className="text-lg font-bold text-green-600">
                    Bs {selectedLoteForInfo.precio_compra.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Valor total: Bs {(selectedLoteForInfo.precio_compra * selectedLoteForInfo.cantidad_actual).toFixed(2)}
                </div>
              </div>
              
              {(() => {
                const daysUntilExpiry = Math.ceil(
                  (new Date(selectedLoteForInfo.fecha_caducidad).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
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
              onClick={() => setIsLoteInfoDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
