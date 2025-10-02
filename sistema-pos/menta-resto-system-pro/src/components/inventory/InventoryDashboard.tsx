import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Package, TrendingUp, TrendingDown, Clock, DollarSign, Building, BarChart3, PieChart, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { getStockByBranch, getStockReports, getStockAlerts, getBranches } from '@/services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface Product {
  id_producto: number;
  nombre: string;
  stock_actual: number;
  precio: number;
  categoria_nombre: string;
  id_sucursal?: number;
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

interface Branch {
  id_sucursal: number;
  nombre: string;
  ciudad: string;
  direccion: string;
}

interface StockByBranch {
  id_producto: number;
  nombre_producto: string;
  categoria_nombre: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  id_sucursal: number;
  nombre_sucursal: string;
  precio: number;
}

interface StockAnalytics {
  sucursal_id: number;
  sucursal_nombre: string;
  total_productos: number;
  stock_total: number;
  valor_total: number;
  productos_sin_stock: number;
  productos_stock_bajo: number;
  productos_stock_ok: number;
}

interface StockAlert {
  id_producto: number;
  nombre_producto: string;
  categoria_nombre: string;
  stock_actual: number;
  stock_minimo: number;
  id_sucursal: number;
  nombre_sucursal: string;
  prioridad: 'critica' | 'alta' | 'media' | 'baja';
  dias_sin_stock?: number;
  valor_perdido?: number;
}

interface InventoryDashboardProps {
  inventory: Product[];
  lotes: Lote[];
  onFilterChange: (filters: any) => void;
  onExportData: () => void;
  selectedBranch?: string;
  onStockUpdate?: () => void;
}

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({
  inventory,
  lotes,
  onFilterChange,
  onExportData,
  selectedBranch: parentSelectedBranch,
  onStockUpdate
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');
  // Usar el estado del padre como fuente única de verdad
  const selectedBranch = parentSelectedBranch || 'all';
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stockByBranch, setStockByBranch] = useState<StockByBranch[]>([]);
  const [stockAnalytics, setStockAnalytics] = useState<StockAnalytics[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'general' | 'branch' | 'comparison' | 'alerts'>('general');

  // Cargar datos de sucursales al montar el componente
  useEffect(() => {
    loadBranchesData();
  }, [user]);

  // Función para actualizar selectedBranch en el padre
  const updateSelectedBranch = (newBranch: string) => {
    console.log('🔄 InventoryDashboard: updateSelectedBranch called with:', newBranch);
    console.log('🔄 InventoryDashboard: current selectedBranch:', selectedBranch);
    
    // Notificar al padre para que recargue los datos
    onFilterChange({
      searchTerm,
      selectedCategoria,
      selectedBranch: newBranch,
      filteredInventory: inventory // Usar inventory en lugar de filteredInventory
    });
  };

  // Cargar datos de stock por sucursal
  useEffect(() => {
    console.log('🔄 useEffect triggered - selectedBranch:', selectedBranch);
    if (selectedBranch !== 'all' && selectedBranch && branches.length > 0) {
      console.log('📌 Cargando datos para sucursal específica:', selectedBranch);
      loadStockByBranch(parseInt(selectedBranch));
    } else if (selectedBranch === 'all' && branches.length > 0) {
      console.log('🌍 Cargando datos para todas las sucursales');
      loadAllStockAnalytics('all');
    }
  }, [selectedBranch, branches]);

  const loadBranchesData = async () => {
    if (!user?.restaurante?.id) return;
    
    try {
      setLoading(true);
      const branchesData = await getBranches();
      setBranches(branchesData);
    } catch (error) {
      console.error('Error cargando sucursales:', error);
      // Fallback a datos de ejemplo si falla la API
      const fallbackData: Branch[] = [
        {
          id_sucursal: user.sucursal?.id || 1,
          nombre: user.sucursal?.nombre || 'Sucursal Principal',
          ciudad: user.sucursal?.ciudad || 'Ciudad Demo',
          direccion: user.sucursal?.direccion || 'Dirección Demo'
        }
      ];
      setBranches(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const loadStockByBranch = async (branchId: number) => {
    try {
      setLoading(true);
      console.log('🔍 Cargando stock para sucursal:', branchId);
      const stockData = await getStockByBranch(branchId);
      console.log('📊 Datos de stock recibidos:', stockData);
      setStockByBranch(stockData);
      
      // También crear un análisis para esta sucursal específica
      if (stockData && stockData.length > 0) {
        const branchAnalytics = {
          sucursal_id: branchId,
          sucursal_nombre: branches.find(b => b.id_sucursal === branchId)?.nombre || 'Sucursal',
          total_productos: stockData.length,
          stock_total: stockData.reduce((sum: number, p: any) => sum + Number(p.stock_actual || 0), 0),
          valor_total: stockData.reduce((sum: number, p: any) => sum + (Number(p.stock_actual || 0) * Number(p.precio || 0)), 0),
          productos_sin_stock: stockData.filter((p: any) => Number(p.stock_actual || 0) === 0).length,
          productos_stock_bajo: stockData.filter((p: any) => Number(p.stock_actual || 0) <= 10 && Number(p.stock_actual || 0) > 0).length,
          productos_stock_ok: stockData.filter((p: any) => Number(p.stock_actual || 0) > 10).length,
          rotacion_promedio: 0, // Calculado por el backend
          categoria_distribucion: stockData.reduce((acc: any, p: any) => {
            acc[p.categoria_nombre] = (acc[p.categoria_nombre] || 0) + Number(p.stock_actual || 0);
            return acc;
          }, {})
        };
        setStockAnalytics([branchAnalytics]);
      }
    } catch (error) {
      console.error('Error cargando stock por sucursal:', error);
      // Limpiar datos en caso de error
      setStockByBranch([]);
      setStockAnalytics([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllStockAnalytics = async (branchId?: string) => {
    try {
      setLoading(true);
      const reportsData = await getStockReports({
        fecha_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Últimos 30 días
        fecha_fin: new Date().toISOString().split('T')[0],
        tipo_reporte: 'analytics',
        id_sucursal: branchId && branchId !== 'all' ? parseInt(branchId) : undefined
      });
      setStockAnalytics(reportsData.analytics || []);
    } catch (error) {
      console.error('Error cargando análisis de stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStockAlerts = async () => {
    try {
      setLoading(true);
      const alertsData = await getStockAlerts();
      setStockAlerts(alertsData || []);
    } catch (error) {
      console.error('Error cargando alertas de stock:', error);
    } finally {
      setLoading(false);
    }
  };

  // Estadísticas generales
  const stats = useMemo(() => {
    const totalProductos = inventory.length;
    const totalStock = inventory.reduce((sum, p) => sum + Number(p.stock_actual || 0), 0);
    const valorTotal = inventory.reduce((sum, p) => sum + (Number(p.stock_actual || 0) * Number(p.precio || 0)), 0);
    const productosSinStock = inventory.filter(p => Number(p.stock_actual || 0) === 0).length;
    const productosStockBajo = inventory.filter(p => Number(p.stock_actual || 0) <= 10 && Number(p.stock_actual || 0) > 0).length;

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

  // Función para filtrar inventario basado en búsqueda y categoría
  const filteredInventory = useMemo(() => {
    return inventory.filter(product => {
      const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.categoria_nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategoria = selectedCategoria === 'all' || 
                              product.categoria_nombre === selectedCategoria;
      const matchesBranch = selectedBranch === 'all' || 
                           (product.id_sucursal && product.id_sucursal.toString() === selectedBranch);
      return matchesSearch && matchesCategoria && matchesBranch;
    });
  }, [inventory, searchTerm, selectedCategoria, selectedBranch]);

  const handleFilterChange = () => {
    onFilterChange({
      searchTerm,
      selectedCategoria,
      selectedBranch,
      filteredInventory: inventory // Usar inventory en lugar de filteredInventory
    });
  };

  // Llamar handleFilterChange solo cuando cambien los filtros de búsqueda/categoría
  React.useEffect(() => {
    handleFilterChange();
  }, [searchTerm, selectedCategoria]);

  // No necesitamos useEffect para selectedBranch ya que usamos el estado del padre

  // Función para manejar reabastecimiento de stock
  const handleReabastecer = async (stockAlert: StockAlert) => {
    try {
      // Aquí implementarías la lógica de reabastecimiento
      console.log('Reabasteciendo producto:', stockAlert.nombre_producto, 'en sucursal:', stockAlert.nombre_sucursal);
      
      // Por ahora solo mostramos un mensaje
      window.alert('Función de reabastecimiento en desarrollo. Producto: ' + stockAlert.nombre_producto);
    } catch (error) {
      console.error('Error en reabastecimiento:', error);
    }
  };

  // Función para ver detalles del producto
  const handleVerDetalles = (stockAlert: StockAlert) => {
    console.log('Ver detalles del producto:', stockAlert);
    // Aquí podrías abrir un modal con detalles del producto
    window.alert(`Detalles del producto: ${stockAlert.nombre_producto}\nSucursal: ${stockAlert.nombre_sucursal}\nStock actual: ${stockAlert.stock_actual}\nStock mínimo: ${stockAlert.stock_minimo}`);
  };

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategoria('all');
    // No resetear selectedBranch para mantener la selección del usuario
    setViewMode('general');
  };

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedCategoria !== 'all') count++;
    if (selectedBranch !== 'all') count++;
    return count;
  }, [searchTerm, selectedCategoria, selectedBranch]);

  // Eliminado useEffect que causaba bucle infinito
  // handleFilterChange se llamará solo cuando sea necesario

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Filtros de Inventario
            </div>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} activo{activeFiltersCount > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Selector de modo de vista */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'general' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('general')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Vista General
              </Button>
              <Button
                variant={viewMode === 'branch' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setViewMode('branch');
                  // Si hay una sucursal seleccionada, cargar sus datos
                  if (selectedBranch !== 'all' && selectedBranch) {
                    loadStockByBranch(parseInt(selectedBranch));
                  }
                }}
                className="flex items-center gap-2"
              >
                <Building className="h-4 w-4" />
                Por Sucursal
              </Button>
              <Button
                variant={viewMode === 'comparison' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('comparison')}
                className="flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                Comparación
              </Button>
              <Button
                variant={viewMode === 'alerts' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setViewMode('alerts');
                  loadStockAlerts();
                }}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Alertas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <span>Limpiar</span>
              </Button>
            </div>

            {/* Filtros principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                <label className="text-sm font-medium">Sucursal</label>
                <Select value={selectedBranch} onValueChange={updateSelectedBranch}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Todas las sucursales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las sucursales</SelectItem>
                    {branches.map(branch => (
                      <SelectItem key={branch.id_sucursal} value={branch.id_sucursal.toString()}>
                        {branch.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas Generales */}
      <div className="stats-grid">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
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

        <Card className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
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

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
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

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
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

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
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

      {/* Análisis por Sucursal */}
      {viewMode === 'branch' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Análisis de Sucursal: {selectedBranch === 'all' ? 'Selecciona una Sucursal' : branches.find(b => b.id_sucursal.toString() === selectedBranch)?.nombre || 'Sucursal'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedBranch === 'all' ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecciona una Sucursal</h3>
                  <p className="text-gray-600">Por favor selecciona una sucursal específica para ver su análisis de inventario</p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-6 w-6 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Productos en Stock</p>
                          <p className="text-xl font-bold">{stockByBranch.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-50 to-teal-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Stock Total</p>
                          <p className="text-xl font-bold">
                            {stockByBranch.reduce((sum, p) => sum + Number(p.stock_actual || 0), 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-yellow-50 to-amber-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-6 w-6 text-yellow-600" />
                        <div>
                          <p className="text-sm text-gray-600">Valor Total</p>
                          <p className="text-xl font-bold">
                            Bs {stockByBranch.reduce((sum, p) => sum + ((p.stock_actual || 0) * (p.precio || 0)), 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de distribución de stock por categoría */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Distribución por Categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stockByBranch.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={Object.entries(
                          stockByBranch.reduce((acc, p) => {
                            acc[p.categoria_nombre] = (acc[p.categoria_nombre] || 0) + p.stock_actual;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([categoria, stock]) => ({ categoria, stock }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="stock"
                        label={({ categoria, stock }) => `${categoria}: ${stock}`}
                      >
                        {Object.entries(
                          stockByBranch.reduce((acc, p) => {
                            acc[p.categoria_nombre] = (acc[p.categoria_nombre] || 0) + p.stock_actual;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparación entre Sucursales */}
      {viewMode === 'comparison' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Comparación entre Sucursales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : stockAnalytics.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockAnalytics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sucursal_nombre" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="stock_total" fill="#8884d8" name="Stock Total" />
                      <Bar dataKey="productos_sin_stock" fill="#ff6b6b" name="Sin Stock" />
                      <Bar dataKey="productos_stock_bajo" fill="#ffa726" name="Stock Bajo" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay datos de comparación disponibles</p>
              )}
            </CardContent>
          </Card>

          {/* Tabla de comparación */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen por Sucursal</CardTitle>
            </CardHeader>
            <CardContent>
              {stockAnalytics.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Sucursal</th>
                        <th className="text-right p-2">Productos</th>
                        <th className="text-right p-2">Stock Total</th>
                        <th className="text-right p-2">Valor Total</th>
                        <th className="text-right p-2">Sin Stock</th>
                        <th className="text-right p-2">Stock Bajo</th>
                        <th className="text-right p-2">Stock OK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockAnalytics.map((analytics) => (
                        <tr key={analytics.sucursal_id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{analytics.sucursal_nombre}</td>
                          <td className="p-2 text-right">{analytics.total_productos}</td>
                          <td className="p-2 text-right">{analytics.stock_total.toLocaleString()}</td>
                          <td className="p-2 text-right">Bs {analytics.valor_total.toLocaleString()}</td>
                          <td className="p-2 text-right">
                            <Badge variant="destructive">{analytics.productos_sin_stock}</Badge>
                          </td>
                          <td className="p-2 text-right">
                            <Badge variant="secondary">{analytics.productos_stock_bajo}</Badge>
                          </td>
                          <td className="p-2 text-right">
                            <Badge variant="default">{analytics.productos_stock_ok}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertas de Stock */}
      {viewMode === 'alerts' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas de Stock por Sucursal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : stockAlerts.length > 0 ? (
                <div className="space-y-4">
                  {/* Resumen de alertas */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-6 w-6 text-red-600" />
                          <div>
                            <p className="text-sm text-gray-600">Críticas</p>
                            <p className="text-xl font-bold text-red-600">
                              {stockAlerts.filter(a => a.prioridad === 'critica').length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-6 w-6 text-orange-600" />
                          <div>
                            <p className="text-sm text-gray-600">Altas</p>
                            <p className="text-xl font-bold text-orange-600">
                              {stockAlerts.filter(a => a.prioridad === 'alta').length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-6 w-6 text-yellow-600" />
                          <div>
                            <p className="text-sm text-gray-600">Medias</p>
                            <p className="text-xl font-bold text-yellow-600">
                              {stockAlerts.filter(a => a.prioridad === 'media').length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-6 w-6 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">Bajas</p>
                            <p className="text-xl font-bold text-blue-600">
                              {stockAlerts.filter(a => a.prioridad === 'baja').length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Lista de alertas */}
                  <div className="space-y-3">
                    {stockAlerts.map((alert) => (
                      <Card 
                        key={`${alert.id_producto}-${alert.id_sucursal}`}
                        className={`border-l-4 ${
                          alert.prioridad === 'critica' ? 'border-l-red-500 bg-red-50' :
                          alert.prioridad === 'alta' ? 'border-l-orange-500 bg-orange-50' :
                          alert.prioridad === 'media' ? 'border-l-yellow-500 bg-yellow-50' :
                          'border-l-blue-500 bg-blue-50'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-gray-900">{alert.nombre_producto}</h4>
                                <Badge 
                                  variant={
                                    alert.prioridad === 'critica' ? 'destructive' :
                                    alert.prioridad === 'alta' ? 'secondary' :
                                    alert.prioridad === 'media' ? 'outline' : 'default'
                                  }
                                  className="text-xs"
                                >
                                  {alert.prioridad.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Sucursal:</span>
                                  <p className="font-medium">{alert.nombre_sucursal}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Categoría:</span>
                                  <p className="font-medium">{alert.categoria_nombre}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Stock Actual:</span>
                                  <p className={`font-medium ${alert.stock_actual === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                                    {alert.stock_actual} unidades
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Stock Mínimo:</span>
                                  <p className="font-medium">{alert.stock_minimo} unidades</p>
                                </div>
                              </div>
                              {alert.dias_sin_stock && alert.dias_sin_stock > 0 && (
                                <div className="mt-2">
                                  <Badge variant="destructive" className="text-xs">
                                    Sin stock por {alert.dias_sin_stock} días
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs"
                                onClick={() => handleReabastecer(alert)}
                              >
                                Reabastecer
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-xs"
                                onClick={() => handleVerDetalles(alert)}
                              >
                                Ver Detalles
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay alertas</h3>
                  <p className="text-gray-600">Todos los productos tienen stock adecuado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
