import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { 
  Building, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRightLeft,
  Plus,
  Edit,
  Eye,
  RefreshCw,
  Download,
  Filter,
  Search,
  BarChart3,
  Settings,
  SortAsc,
  SortDesc,
  X,
  SlidersHorizontal,
  Tag,
  Hash
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { 
  getBranches, 
  getProducts, 
  getStockByBranch, 
  updateStockByBranch, 
  transferStockBetweenBranches,
  getStockAlerts,
  getStockReports
} from '../../services/api';

interface StockByBranch {
  id_producto: number;
  nombre_producto: string;
  categoria_nombre: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  precio: number;
  estado_stock: 'ok' | 'bajo' | 'critico' | 'sin_stock';
}

interface Branch {
  id_sucursal: number;
  nombre: string;
  ciudad: string;
  direccion: string;
  activo: boolean;
}

interface StockAlert {
  id_producto: number;
  nombre_producto: string;
  id_sucursal: number;
  nombre_sucursal: string;
  stock_actual: number;
  stock_minimo: number;
  tipo_alerta: 'stock_bajo' | 'stock_critico' | 'sin_stock';
  fecha_alerta: string;
}

interface StockTransfer {
  id_producto: number;
  cantidad: number;
  sucursal_origen: number;
  sucursal_destino: number;
  observaciones?: string;
}

interface StockByBranchManagementProps {
  onStockUpdate?: () => void;
}

export function StockByBranchManagement({ onStockUpdate }: StockByBranchManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados principales
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showOnlyAlerts, setShowOnlyAlerts] = useState<boolean>(false);
  const [stockRange, setStockRange] = useState<{min: number, max: number}>({min: 0, max: 1000});
  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'transfer' | 'alerts' | 'reports'>('overview');
  
  // Estados para modales
  const [isEditStockOpen, setIsEditStockOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockByBranch | null>(null);
  const [editingStock, setEditingStock] = useState({
    stock_actual: 0,
    stock_minimo: 0,
    stock_maximo: 0
  });
  const [transferData, setTransferData] = useState<StockTransfer>({
    id_producto: 0,
    cantidad: 0,
    sucursal_origen: 0,
    sucursal_destino: 0,
    observaciones: ''
  });

  // Queries
  const { data: branches = [], isLoading: loadingBranches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: getBranches,
    enabled: !!user
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products', selectedBranch],
    queryFn: () => getProducts({ id_sucursal: selectedBranch }),
    enabled: !!selectedBranch && !!user
  });

  const { data: stockByBranch = [], isLoading: loadingStock } = useQuery<StockByBranch[]>({
    queryKey: ['stock-by-branch', selectedBranch],
    queryFn: () => getStockByBranch(selectedBranch!),
    enabled: !!selectedBranch && !!user
  });

  const { data: stockAlerts = [], isLoading: loadingAlerts } = useQuery<StockAlert[]>({
    queryKey: ['stock-alerts'],
    queryFn: getStockAlerts,
    enabled: !!user,
    refetchInterval: 30000 // Refrescar cada 30 segundos
  });

  // Mutations
  const updateStockMutation = useMutation({
    mutationFn: ({ id_producto, id_sucursal, stockData }: { 
      id_producto: number; 
      id_sucursal: number; 
      stockData: { stock_actual: number; stock_minimo: number; stock_maximo: number } 
    }) => updateStockByBranch(id_producto, id_sucursal, stockData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-by-branch'] });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      // Notificar al componente padre para refrescar datos
      if (onStockUpdate) {
        onStockUpdate();
      }
      toast({
        title: "Stock actualizado",
        description: "El stock del producto se ha actualizado correctamente.",
      });
      setIsEditStockOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al actualizar el stock.",
        variant: "destructive",
      });
    }
  });

  const transferStockMutation = useMutation({
    mutationFn: (transferData: StockTransfer) => transferStockBetweenBranches(transferData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-by-branch'] });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      // Notificar al componente padre para refrescar datos
      if (onStockUpdate) {
        onStockUpdate();
      }
      toast({
        title: "Transferencia exitosa",
        description: "El stock se ha transferido correctamente entre sucursales.",
      });
      setIsTransferOpen(false);
      setTransferData({
        id_producto: 0,
        cantidad: 0,
        sucursal_origen: 0,
        sucursal_destino: 0,
        observaciones: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al transferir el stock.",
        variant: "destructive",
      });
    }
  });

  // Efectos - Inicializar sucursal del usuario
  useEffect(() => {
    console.log('🔄 [StockByBranch] useEffect ejecutado:', {
      branchesLength: branches.length,
      selectedBranch,
      user: user ? { id: user.id_vendedor, username: user.username, sucursal: user.sucursal } : null
    });
    
    if (branches.length > 0 && !selectedBranch) {
      // Usar la sucursal del usuario autenticado si está disponible
      // El objeto user tiene la estructura: user.sucursal.id
      const userBranchId = user?.sucursal?.id || user?.id_sucursal || branches[0].id_sucursal;
      
      console.log('🔍 [StockByBranch] Inicializando sucursal...');
      console.log('   Usuario completo:', user);
      console.log('   user.sucursal?.id:', user?.sucursal?.id);
      console.log('   user.id_sucursal:', user?.id_sucursal);
      console.log('   Sucursal del usuario (calculada):', userBranchId);
      console.log('   Sucursales disponibles:', branches.map(b => ({ id: b.id_sucursal, nombre: b.nombre })));
      
      // Verificar que la sucursal del usuario esté en la lista
      const userBranch = branches.find(b => b.id_sucursal === userBranchId);
      
      if (userBranch) {
        setSelectedBranch(userBranchId);
        console.log('✅ [StockByBranch] Sucursal seleccionada del usuario:', userBranchId, '-', userBranch.nombre);
      } else {
        // Si no está, usar la primera disponible
        const fallbackId = branches[0].id_sucursal;
        setSelectedBranch(fallbackId);
        console.log('⚠️ [StockByBranch] Usando primera sucursal disponible:', fallbackId, '-', branches[0].nombre);
      }
    }
  }, [branches, selectedBranch, user]);

  // Limpiar filtros cuando cambie la sucursal
  useEffect(() => {
    if (selectedBranch) {
      clearAllFilters();
    }
  }, [selectedBranch]);

  // Obtener categorías únicas para el filtro
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(stockByBranch.map(item => item.categoria_nombre)));
    return uniqueCategories.sort();
  }, [stockByBranch]);

  // Filtros y cálculos
  const filteredStock = useMemo(() => {
    let filtered = stockByBranch.filter(item => {
      // Filtro de búsqueda por nombre
      const matchesSearch = item.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por estado de stock
      const matchesStatus = filterStatus === 'all' || item.estado_stock === filterStatus;
      
      // Filtro por categoría
      const matchesCategory = filterCategory === 'all' || item.categoria_nombre === filterCategory;
      
      // Filtro por rango de stock
      const matchesStockRange = item.stock_actual >= stockRange.min && item.stock_actual <= stockRange.max;
      
      // Filtro de solo alertas
      const matchesAlerts = !showOnlyAlerts || ['bajo', 'critico', 'sin_stock'].includes(item.estado_stock);
      
      return matchesSearch && matchesStatus && matchesCategory && matchesStockRange && matchesAlerts;
    });

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'nombre':
          aValue = a.nombre_producto.toLowerCase();
          bValue = b.nombre_producto.toLowerCase();
          break;
        case 'categoria':
          aValue = a.categoria_nombre.toLowerCase();
          bValue = b.categoria_nombre.toLowerCase();
          break;
        case 'stock':
          aValue = a.stock_actual;
          bValue = b.stock_actual;
          break;
        case 'precio':
          aValue = a.precio;
          bValue = b.precio;
          break;
        case 'estado':
          const estadoOrder = { 'sin_stock': 0, 'critico': 1, 'bajo': 2, 'ok': 3 };
          aValue = estadoOrder[a.estado_stock as keyof typeof estadoOrder] ?? 4;
          bValue = estadoOrder[b.estado_stock as keyof typeof estadoOrder] ?? 4;
          break;
        default:
          aValue = a.nombre_producto.toLowerCase();
          bValue = b.nombre_producto.toLowerCase();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [stockByBranch, searchTerm, filterStatus, filterCategory, stockRange, showOnlyAlerts, sortBy, sortOrder]);

  const stockStats = useMemo(() => {
    const total = stockByBranch.length;
    const ok = stockByBranch.filter(s => s.estado_stock === 'ok').length;
    const bajo = stockByBranch.filter(s => s.estado_stock === 'bajo').length;
    const critico = stockByBranch.filter(s => s.estado_stock === 'critico').length;
    const sinStock = stockByBranch.filter(s => s.estado_stock === 'sin_stock').length;
    
    return { total, ok, bajo, critico, sinStock };
  }, [stockByBranch]);

  const criticalAlerts = useMemo(() => {
    return stockAlerts.filter(alert => 
      alert.tipo_alerta === 'stock_critico' || alert.tipo_alerta === 'sin_stock'
    );
  }, [stockAlerts]);

  // Handlers
  const handleEditStock = (product: StockByBranch) => {
    setSelectedProduct(product);
    setEditingStock({
      stock_actual: product.stock_actual,
      stock_minimo: product.stock_minimo,
      stock_maximo: product.stock_maximo
    });
    setIsEditStockOpen(true);
  };

  const handleSaveStock = () => {
    if (selectedProduct && selectedBranch) {
      console.log('🔍 [StockByBranch] Guardando stock:', {
        id_producto: selectedProduct.id_producto,
        id_sucursal: selectedBranch,
        stockData: editingStock
      });
      
      updateStockMutation.mutate({
        id_producto: selectedProduct.id_producto,
        id_sucursal: selectedBranch,
        stockData: editingStock
      });
    } else {
      console.error('❌ [StockByBranch] Error: selectedProduct o selectedBranch es null', {
        selectedProduct,
        selectedBranch
      });
      
      toast({
        title: "Error",
        description: "No se pudo actualizar el stock. Intenta seleccionar una sucursal primero.",
        variant: "destructive",
      });
    }
  };

  const handleTransferStock = (product: StockByBranch) => {
    setSelectedProduct(product);
    setTransferData({
      id_producto: product.id_producto,
      cantidad: 0,
      sucursal_origen: selectedBranch!,
      sucursal_destino: 0,
      observaciones: ''
    });
    setIsTransferOpen(true);
  };

  const handleSaveTransfer = () => {
    if (transferData.cantidad > 0 && transferData.sucursal_destino > 0) {
      transferStockMutation.mutate(transferData);
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800';
      case 'bajo': return 'bg-yellow-100 text-yellow-800';
      case 'critico': return 'bg-orange-100 text-orange-800';
      case 'sin_stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'ok': return 'Stock OK';
      case 'bajo': return 'Stock Bajo';
      case 'critico': return 'Stock Crítico';
      case 'sin_stock': return 'Sin Stock';
      default: return 'Desconocido';
    }
  };

  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterCategory('all');
    setShowOnlyAlerts(false);
    setStockRange({min: 0, max: 1000});
    setSortBy('nombre');
    setSortOrder('asc');
  };

  // Función para aplicar filtros predefinidos
  const applyQuickFilter = (filterType: string) => {
    clearAllFilters();
    switch (filterType) {
      case 'critical':
        setFilterStatus('critico');
        setShowOnlyAlerts(true);
        break;
      case 'low':
        setFilterStatus('bajo');
        setShowOnlyAlerts(true);
        break;
      case 'out_of_stock':
        setFilterStatus('sin_stock');
        setShowOnlyAlerts(true);
        break;
      case 'high_stock':
        setFilterStatus('ok');
        setStockRange({min: 50, max: 1000});
        break;
    }
  };

  if (loadingBranches) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando sucursales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con selector de sucursal */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Stock por Sucursal</h2>
          <p className="text-gray-600">Administra el stock de productos por sucursal</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedBranch?.toString()} onValueChange={(value) => setSelectedBranch(parseInt(value))}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Seleccionar sucursal" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id_sucursal} value={branch.id_sucursal.toString()}>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>{branch.nombre}</span>
                    <Badge variant={branch.activo ? "default" : "secondary"} className="ml-2">
                      {branch.activo ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['stock-by-branch'] })}
            disabled={loadingStock}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingStock ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Alertas críticas */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{criticalAlerts.length} alertas críticas</strong> - Hay productos con stock crítico o sin stock
          </AlertDescription>
        </Alert>
      )}

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">{stockStats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock OK</p>
                <p className="text-2xl font-bold text-green-600">{stockStats.ok}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-yellow-600">{stockStats.bajo}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Crítico</p>
                <p className="text-2xl font-bold text-orange-600">{stockStats.critico}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sin Stock</p>
                <p className="text-2xl font-bold text-red-600">{stockStats.sinStock}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="manage">Gestionar</TabsTrigger>
          <TabsTrigger value="transfer">Transferir</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Resumen de Stock - {branches.find(b => b.id_sucursal === selectedBranch)?.nombre}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStock ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Cargando stock...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Panel de Filtros Profesional */}
                  <Card className="mb-6">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <SlidersHorizontal className="h-5 w-5" />
                          Filtros y Ordenamiento
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-sm">
                            {filteredStock.length} de {stockByBranch.length} productos
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Limpiar
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Filtros Rápidos */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Filtros Rápidos</Label>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applyQuickFilter('critical')}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Stock Crítico
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applyQuickFilter('low')}
                            className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                          >
                            <TrendingDown className="h-4 w-4 mr-1" />
                            Stock Bajo
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applyQuickFilter('out_of_stock')}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Sin Stock
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applyQuickFilter('high_stock')}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Stock Alto
                          </Button>
                        </div>
                      </div>

                      {/* Fila 1: Búsqueda y Estado */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Buscar Producto
                          </Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Nombre del producto..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Estado de Stock
                          </Label>
                          <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  Todos los estados
                                </div>
                              </SelectItem>
                              <SelectItem value="ok">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  Stock OK
                                </div>
                              </SelectItem>
                              <SelectItem value="bajo">
                                <div className="flex items-center gap-2">
                                  <TrendingDown className="h-4 w-4 text-yellow-600" />
                                  Stock Bajo
                                </div>
                              </SelectItem>
                              <SelectItem value="critico">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                                  Stock Crítico
                                </div>
                              </SelectItem>
                              <SelectItem value="sin_stock">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                  Sin Stock
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Categoría
                          </Label>
                          <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas las categorías</SelectItem>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Fila 2: Rango de Stock y Opciones */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            Rango de Stock
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="Mín"
                              value={stockRange.min}
                              onChange={(e) => setStockRange(prev => ({...prev, min: parseInt(e.target.value) || 0}))}
                              className="w-20"
                            />
                            <span className="text-gray-500">-</span>
                            <Input
                              type="number"
                              placeholder="Máx"
                              value={stockRange.max}
                              onChange={(e) => setStockRange(prev => ({...prev, max: parseInt(e.target.value) || 1000}))}
                              className="w-20"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Opciones</Label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="showOnlyAlerts"
                              checked={showOnlyAlerts}
                              onChange={(e) => setShowOnlyAlerts(e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="showOnlyAlerts" className="text-sm">
                              Solo productos con alertas
                            </Label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                            Ordenar por
                          </Label>
                          <div className="flex gap-2">
                            <Select value={sortBy} onValueChange={setSortBy}>
                              <SelectTrigger className="flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nombre">Nombre</SelectItem>
                                <SelectItem value="categoria">Categoría</SelectItem>
                                <SelectItem value="stock">Stock Actual</SelectItem>
                                <SelectItem value="precio">Precio</SelectItem>
                                <SelectItem value="estado">Estado</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                              className="px-3"
                            >
                              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Indicadores de filtros activos */}
                      {(searchTerm || filterStatus !== 'all' || filterCategory !== 'all' || showOnlyAlerts || stockRange.min > 0 || stockRange.max < 1000) && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <span className="text-sm text-gray-600">Filtros activos:</span>
                          {searchTerm && (
                            <Badge variant="secondary" className="text-xs">
                              Búsqueda: "{searchTerm}"
                            </Badge>
                          )}
                          {filterStatus !== 'all' && (
                            <Badge variant="secondary" className="text-xs">
                              Estado: {getStockStatusText(filterStatus)}
                            </Badge>
                          )}
                          {filterCategory !== 'all' && (
                            <Badge variant="secondary" className="text-xs">
                              Categoría: {filterCategory}
                            </Badge>
                          )}
                          {showOnlyAlerts && (
                            <Badge variant="secondary" className="text-xs">
                              Solo alertas
                            </Badge>
                          )}
                          {(stockRange.min > 0 || stockRange.max < 1000) && (
                            <Badge variant="secondary" className="text-xs">
                              Stock: {stockRange.min}-{stockRange.max}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tabla de productos */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Stock Actual</TableHead>
                          <TableHead>Stock Mínimo</TableHead>
                          <TableHead>Stock Máximo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStock.map((item) => (
                          <TableRow key={item.id_producto}>
                            <TableCell className="font-medium">{item.nombre_producto}</TableCell>
                            <TableCell>{item.categoria_nombre}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-lg font-bold">
                                {item.stock_actual}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.stock_minimo}</TableCell>
                            <TableCell>{item.stock_maximo}</TableCell>
                            <TableCell>
                              <Badge className={getStockStatusColor(item.estado_stock)}>
                                {getStockStatusText(item.estado_stock)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditStock(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTransferStock(item)}
                                >
                                  <ArrowRightLeft className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Gestionar */}
        <TabsContent value="manage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gestionar Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Selecciona un producto del resumen para editarlo o usa los botones de acción en la tabla.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Transferir */}
        <TabsContent value="transfer" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Transferir Stock entre Sucursales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Selecciona un producto del resumen para transferirlo a otra sucursal.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Alertas */}
        <TabsContent value="alerts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas de Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAlerts ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Cargando alertas...</span>
                </div>
              ) : stockAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-gray-600">No hay alertas de stock activas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stockAlerts.map((alert) => (
                    <Alert key={`${alert.id_producto}-${alert.id_sucursal}`} className={
                      alert.tipo_alerta === 'sin_stock' ? 'border-red-200 bg-red-50' :
                      alert.tipo_alerta === 'stock_critico' ? 'border-orange-200 bg-orange-50' :
                      'border-yellow-200 bg-yellow-50'
                    }>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <div>
                            <strong>{alert.nombre_producto}</strong> en {alert.nombre_sucursal}
                            <br />
                            <span className="text-sm">
                              Stock actual: {alert.stock_actual} | Mínimo: {alert.stock_minimo}
                            </span>
                          </div>
                          <Badge className={
                            alert.tipo_alerta === 'sin_stock' ? 'bg-red-100 text-red-800' :
                            alert.tipo_alerta === 'stock_critico' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {alert.tipo_alerta === 'sin_stock' ? 'Sin Stock' :
                             alert.tipo_alerta === 'stock_critico' ? 'Crítico' : 'Bajo'}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Reportes */}
        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reportes de Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Download className="h-6 w-6 mb-2" />
                  <span>Reporte de Stock Actual</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <TrendingDown className="h-6 w-6 mb-2" />
                  <span>Productos con Stock Bajo</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <ArrowRightLeft className="h-6 w-6 mb-2" />
                  <span>Historial de Transferencias</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span>Análisis de Movimientos</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Editar Stock */}
      <Dialog open={isEditStockOpen} onOpenChange={setIsEditStockOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Stock - {selectedProduct?.nombre_producto}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="stock_actual">Stock Actual</Label>
              <Input
                id="stock_actual"
                type="number"
                value={editingStock.stock_actual}
                onChange={(e) => setEditingStock(prev => ({ ...prev, stock_actual: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <Label htmlFor="stock_minimo">Stock Mínimo</Label>
              <Input
                id="stock_minimo"
                type="number"
                value={editingStock.stock_minimo}
                onChange={(e) => setEditingStock(prev => ({ ...prev, stock_minimo: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <Label htmlFor="stock_maximo">Stock Máximo</Label>
              <Input
                id="stock_maximo"
                type="number"
                value={editingStock.stock_maximo}
                onChange={(e) => setEditingStock(prev => ({ ...prev, stock_maximo: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditStockOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveStock}
              disabled={updateStockMutation.isPending}
            >
              {updateStockMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Transferir Stock */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transferir Stock - {selectedProduct?.nombre_producto}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="cantidad">Cantidad a Transferir</Label>
              <Input
                id="cantidad"
                type="number"
                value={transferData.cantidad}
                onChange={(e) => setTransferData(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 0 }))}
                max={selectedProduct?.stock_actual}
              />
              <p className="text-sm text-gray-500 mt-1">
                Stock disponible: {selectedProduct?.stock_actual}
              </p>
            </div>
            
            <div>
              <Label htmlFor="sucursal_destino">Sucursal Destino</Label>
              <Select 
                value={transferData.sucursal_destino.toString()} 
                onValueChange={(value) => setTransferData(prev => ({ ...prev, sucursal_destino: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {branches
                    .filter(branch => branch.id_sucursal !== transferData.sucursal_origen)
                    .map((branch) => (
                      <SelectItem key={branch.id_sucursal} value={branch.id_sucursal.toString()}>
                        {branch.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="observaciones">Observaciones (Opcional)</Label>
              <Input
                id="observaciones"
                value={transferData.observaciones}
                onChange={(e) => setTransferData(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Motivo de la transferencia..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveTransfer}
              disabled={transferStockMutation.isPending || transferData.cantidad <= 0 || transferData.sucursal_destino === 0}
            >
              {transferStockMutation.isPending ? 'Transferiendo...' : 'Transferir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
