import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Download, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package,
  Calendar,
  BarChart3,
  AlertTriangle
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
    const totalValue = filteredInventory.reduce((sum, p) => sum + ((p.precio || 0) * (p.stock_actual || 0)), 0);
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
      .sort(([,a], [,b]) => b - a)
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
        return value;
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
          <div className="space-y-6">
            {/* Resumen ejecutivo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Resumen Ejecutivo del Inventario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{reportStats.totalProducts}</div>
                    <div className="text-sm text-blue-600">Total Productos</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">Bs {reportStats.totalValue.toFixed(2)}</div>
                    <div className="text-sm text-green-600">Valor Total</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{reportStats.lowStockProducts}</div>
                    <div className="text-sm text-orange-600">Stock Bajo</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{reportStats.outOfStockProducts}</div>
                    <div className="text-sm text-red-600">Sin Stock</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Análisis de movimientos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Análisis de Movimientos ({dateRange} días)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Total Movimientos:</span>
                          <Badge variant="outline">{reportStats.totalMovements}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Entradas:</span>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            {reportStats.entradaMovements}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Salidas:</span>
                          <Badge variant="default" className="bg-red-100 text-red-800">
                            {reportStats.salidaMovements}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Productos más movidos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Productos Más Movidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {reportStats.topProducts.map(([product, count], index) => (
                          <div key={product} className="flex justify-between items-center">
                            <span className="text-sm">{index + 1}. {product}</span>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                              {count} movimientos
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Productos Críticos
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        );

      case 'movements':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Reporte de Movimientos ({dateRange} días)
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        );

      case 'lotes':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Reporte de Lotes
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                            <div className="font-medium">
                              Bs {lote.precio_compra && lote.cantidad_actual ? 
                                (lote.precio_compra * lote.cantidad_actual).toFixed(2) : '0.00'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Bs {lote.precio_compra ? lote.precio_compra.toFixed(2) : '0.00'} c/u
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles del reporte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generador de Reportes de Inventario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="reportType">Tipo de Reporte</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
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
              <Label htmlFor="dateRange">Rango de Fechas</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
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
              <Label htmlFor="categoryFilter">Categoría</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
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
              <Label>Acciones</Label>
              <div className="flex gap-2">
                <Button 
                  onClick={exportInventoryReport} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Inventario
                </Button>
                <Button 
                  onClick={exportMovementsReport} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Movimientos
                </Button>
                <Button 
                  onClick={exportLotesReport} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Lotes
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido del reporte */}
      {renderReport()}
    </div>
  );
};
