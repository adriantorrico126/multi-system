import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/services/api';
import { useAuth } from '../context/AuthContext';
import { usePlanSystem } from '../context/PlanSystemContext';
import { InventarioBasicoFeatureGate, InventarioAvanzadoFeatureGate, ReportesAvanzadosFeatureGate } from '../components/plans';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNavigate } from 'react-router-dom';
import { InventoryDashboard } from '../components/inventory/InventoryDashboard';
import { LotesManagement } from '../components/inventory/LotesManagement';
import { InventoryReports } from '../components/inventory/InventoryReports';
import { StockByBranchManagement } from '../components/inventory/StockByBranchManagement';
import { updateStockByBranch } from '../services/api';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Package, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  Download,
  Settings,
  Eye,
  Menu,
  Calendar,
  User,
  DollarSign,
  Crown,
  ArrowUp,
  Building
} from 'lucide-react';
import { 
  getLotesPorVencer,
  getProductosStockBajo,
  crearLote,
  actualizarLote,
  eliminarLote
} from '../services/api';

interface Product {
  id_producto: number;
  nombre: string;
  stock_actual: number;
  precio: number;
  categoria_nombre: string;
  stock_minimo?: number;
  stock_maximo?: number;
}

interface Movement {
  id_movimiento: number;
  fecha_movimiento: string;
  tipo_movimiento: string;
  cantidad: number;
  stock_anterior: number;
  stock_actual: number;
  producto_nombre: string;
  vendedor_username: string;
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

// Componente para mostrar mensajes de upgrade
const UpgradeMessage: React.FC<{ message: string; title: string }> = ({ message, title }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-full p-6 mb-6">
      <Crown className="h-12 w-12 text-blue-600" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 mb-6 max-w-md">{message}</p>
    <div className="flex items-center gap-2 text-blue-600 font-medium">
      <ArrowUp className="h-4 w-4" />
      <span>Actualiza tu plan para desbloquear esta funcionalidad</span>
    </div>
  </div>
);

const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const { currentPlan, hasFeature } = usePlanSystem();
  const navigate = useNavigate();
  const role = user?.rol || '';

  const [inventory, setInventory] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [changeAmount, setChangeAmount] = useState<string>('');
  const [movementType, setMovementType] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'productos' | 'lotes' | 'stock-sucursal' | 'reportes'>('dashboard');
  const [filteredInventory, setFilteredInventory] = useState<Product[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [productSearchTerm, setProductSearchTerm] = useState<string>(''); // Search term for products
  
  // Estados para modales de información y menú móvil
  const [selectedProductForInfo, setSelectedProductForInfo] = useState<Product | null>(null);
  const [isProductInfoDialogOpen, setIsProductInfoDialogOpen] = useState(false);
  const [selectedMovementForInfo, setSelectedMovementForInfo] = useState<Movement | null>(null);
  const [isMovementInfoDialogOpen, setIsMovementInfoDialogOpen] = useState(false);
  const [showMobileTabsMenu, setShowMobileTabsMenu] = useState(false);

  // Funciones para verificar restricciones de plan usando el nuevo sistema
  const isTabAvailable = (tabName: string): boolean => {
    console.log(`🔍 [INVENTARIO] Verificando acceso a pestaña "${tabName}"`);
    console.log(`🔍 [INVENTARIO] Usuario:`, user);
    console.log(`🔍 [INVENTARIO] CurrentPlan:`, currentPlan);
    
    // Usar el sistema de planes para todos los usuarios
    switch (tabName) {
      case 'dashboard':
        return hasFeature('incluye_reportes_avanzados'); // Dashboard requiere reportes avanzados
      case 'productos':
        return hasFeature('incluye_inventario_basico');
      case 'lotes':
        return hasFeature('incluye_inventario_avanzado');
      case 'stock-sucursal':
        return hasFeature('incluye_inventario_avanzado') && (role === 'admin' || role === 'super_admin');
      case 'reportes':
        return hasFeature('incluye_reportes_avanzados');
      default:
        return false;
    }
  };

  const getTabInfo = (tabName: string) => {
    switch (tabName) {
      case 'dashboard':
        return {
          icon: BarChart3,
          text: 'Dashboard',
          available: isTabAvailable('dashboard'),
          description: 'Panel de control con estadísticas y métricas del inventario',
          upgradeMessage: 'Accede a análisis avanzados y métricas en tiempo real con el plan Avanzado'
        };
      case 'productos':
        return {
          icon: Package,
          text: 'Productos',
          available: isTabAvailable('productos'),
          description: hasFeature('incluye_inventario_basico') ? 'Gestión completa de productos e inventario' : 'Plan Básico: Solo lectura',
          upgradeMessage: hasFeature('incluye_inventario_basico') ? '' : 'Actualiza tu plan para gestionar productos'
        };
      case 'lotes':
        return {
          icon: FileText,
          text: 'Lotes',
          available: isTabAvailable('lotes'),
          description: hasFeature('incluye_inventario_avanzado') ? 'Control de lotes y fechas de vencimiento' : 'Plan Básico: No disponible',
          upgradeMessage: hasFeature('incluye_inventario_avanzado') ? '' : 'Actualiza tu plan para gestionar lotes'
        };
      case 'stock-sucursal':
        return {
          icon: Building,
          text: 'Stock por Sucursal',
          available: isTabAvailable('stock-sucursal'),
          description: hasFeature('incluye_inventario_avanzado') && (role === 'admin' || role === 'super_admin') ? 'Gestión avanzada de stock por sucursal' : 'Solo administradores con plan Avanzado',
          upgradeMessage: hasFeature('incluye_inventario_avanzado') && (role === 'admin' || role === 'super_admin') ? '' : 'Funcionalidad exclusiva para administradores con plan Avanzado'
        };
      case 'reportes':
        return {
          icon: TrendingUp,
          text: 'Reportes',
          available: isTabAvailable('reportes'),
          description: hasFeature('incluye_reportes_avanzados') ? 'Reportes detallados y análisis de inventario' : 'Plan Básico: No disponible',
          upgradeMessage: hasFeature('incluye_reportes_avanzados') ? '' : 'Obtén reportes avanzados y análisis predictivos con el plan Avanzado'
        };
      default:
        return {
          icon: Package,
          text: tabName,
          available: true,
          description: '',
          upgradeMessage: ''
        };
    }
  };

  // Establecer pestaña activa por defecto según el plan
  useEffect(() => {
    if (currentPlan) {
      const planName = currentPlan.toLowerCase();
      // Solo establecer 'productos' como pestaña activa por defecto si no hay pestaña activa
      if (!activeTab || (activeTab === 'dashboard' && !isTabAvailable('dashboard')) || (activeTab === 'reportes' && !isTabAvailable('reportes'))) {
        setActiveTab('productos');
      }
    }
  }, [currentPlan]); // Remover activeTab de las dependencias para evitar loop

  const openProductInfoDialog = (product: Product) => {
    setSelectedProductForInfo(product);
    setIsProductInfoDialogOpen(true);
  };

  const openMovementInfoDialog = (movement: Movement) => {
    setSelectedMovementForInfo(movement);
    setIsMovementInfoDialogOpen(true);
  };

  const fetchInventoryData = async (branchId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('jwtToken');
      
      // Usar el branchId proporcionado directamente, sin depender del estado selectedBranch
      // Si branchId es undefined, significa que se deben cargar todos los productos
      const currentBranchId = branchId;
      
      // Construir URL para productos según si hay filtro de sucursal
      let productosUrl = `${import.meta.env.VITE_BACKEND_URL}/productos/inventario/resumen`;
      if (currentBranchId) {
        productosUrl = `${import.meta.env.VITE_BACKEND_URL}/productos?id_sucursal=${currentBranchId}`;
      }
      
      console.log('🔍 Frontend: fetchInventoryData called with branchId:', branchId);
      console.log('🔍 Frontend: currentBranchId:', currentBranchId);
      console.log('🔍 Frontend: selectedBranch:', selectedBranch);
      console.log('🔍 Frontend: productosUrl:', productosUrl);
      
      const [inventoryResponse, movementsResponse, lotesResponse] = await Promise.all([
        api.get(productosUrl, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`${import.meta.env.VITE_BACKEND_URL}/productos/inventario/movimientos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`${import.meta.env.VITE_BACKEND_URL}/inventario-lotes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const productos = inventoryResponse.data.data || [];
      console.log('🔍 Frontend: Productos recibidos:', productos.length);
      console.log('🔍 Frontend: Primeros productos:', productos.slice(0, 3).map(p => ({
        id: p.id_producto,
        nombre: p.nombre,
        stock: p.stock_actual
      })));
      
      setInventory(productos);
      setMovements(movementsResponse.data.data || []);
      setLotes(lotesResponse.data.data || []);
      setFilteredInventory(productos);

    } catch (err) {
      console.error('❌ Frontend: Error fetching inventory data:', err);
      console.error('❌ Frontend: Error response:', err.response?.data);
      setError('Error al cargar los datos de inventario. Asegúrate de tener permisos.');
      toast.error('Error al cargar los datos de inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'admin' || role === 'gerente') {
      fetchInventoryData();
    }
  }, [role]);

  const handleUpdateStock = async () => {
    if (!selectedProduct || !changeAmount || !movementType) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      const cantidad = parseFloat(changeAmount);
      
      let nuevaCantidad = selectedProduct.stock_actual || 0;
      if (movementType === 'entrada' || movementType === 'ajuste_positivo') {
        nuevaCantidad += cantidad;
      } else {
        nuevaCantidad -= cantidad;
      }

      // Usar el endpoint de stock por sucursal para mantener consistencia
      const currentBranchId = selectedBranch !== 'all' ? parseInt(selectedBranch) : 1; // Default a sucursal 1 si no hay sucursal específica
      
      console.log('🔄 Frontend: Actualizando stock usando stock-sucursal endpoint');
      console.log('🔄 Frontend: Producto:', selectedProduct.id_producto, 'Sucursal:', currentBranchId, 'Nueva cantidad:', nuevaCantidad);
      
      await updateStockByBranch(selectedProduct.id_producto, currentBranchId, {
        stock_actual: nuevaCantidad,
        stock_minimo: selectedProduct.stock_minimo || 0,
        stock_maximo: selectedProduct.stock_maximo || 100
      });

      toast.success('Stock actualizado correctamente');
      setChangeAmount('');
      setMovementType('');
      setSelectedProduct(null);
      
      // Recargar datos manteniendo el filtro de sucursal actual
      const reloadBranchId = selectedBranch !== 'all' ? parseInt(selectedBranch) : undefined;
      fetchInventoryData(reloadBranchId);
    } catch (err) {
      console.error('Error updating stock:', err);
      toast.error('Error al actualizar el stock');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: any) => {
    console.log('🔍 Frontend: handleFilterChange called with filters:', filters);
    console.log('🔍 Frontend: current selectedBranch:', selectedBranch);
    console.log('🔍 Frontend: current inventory length:', inventory.length);
    
    // Solo actualizar filteredInventory si no es un cambio de sucursal
    // Para cambios de sucursal, fetchInventoryData ya actualiza filteredInventory
    if (!filters.selectedBranch || filters.selectedBranch === selectedBranch) {
      setFilteredInventory(filters.filteredInventory || inventory);
    }
    
    // Si cambió la sucursal seleccionada, recargar datos
    if (filters.selectedBranch && filters.selectedBranch !== selectedBranch) {
      console.log('🔍 Frontend: Branch changed from', selectedBranch, 'to', filters.selectedBranch);
      setSelectedBranch(filters.selectedBranch);
      if (filters.selectedBranch === 'all') {
        console.log('🔍 Frontend: Loading all products (no branch filter)');
        fetchInventoryData(undefined); // Cargar todos los productos (sin filtro de sucursal)
      } else {
        console.log('🔍 Frontend: Loading products for branch:', filters.selectedBranch);
        fetchInventoryData(parseInt(filters.selectedBranch)); // Cargar productos de la sucursal específica
      }
    }
  };

  const handleExportData = () => {
    toast.info('Exportación', { description: 'Usa la pestaña de Reportes para exportar datos específicos.' });
  };

  // Filtrar productos por término de búsqueda
  const searchedProducts = useMemo(() => {
    if (!productSearchTerm.trim()) {
      return filteredInventory;
    }
    
    const searchLower = productSearchTerm.toLowerCase();
    return filteredInventory.filter(product => 
      product.nombre.toLowerCase().includes(searchLower) ||
      product.categoria_nombre.toLowerCase().includes(searchLower)
    );
  }, [filteredInventory, productSearchTerm]);

  const handleSaveLote = async (loteData: Lote) => {
    try {
      if (loteData.id_lote) {
        await actualizarLote(loteData.id_lote, loteData);
        toast.success("Lote actualizado");
      } else {
        await crearLote(loteData);
        toast.success('Lote creado');
      }
      fetchInventoryData();
    } catch (err) {
      setError('Error al guardar el lote.');
      toast.error('Error', { description: 'Error al guardar el lote.' });
      throw err;
    }
  };

  const handleDeleteLote = async (id: number) => {
    try {
      await eliminarLote(id);
      toast.success('Lote eliminado');
      fetchInventoryData();
    } catch (err) {
      setError('Error al eliminar el lote.');
      toast.error('Error', { description: 'Error al eliminar el lote.' });
      throw err;
    }
  };

  if (role !== 'admin' && role !== 'gerente') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso denegado</h2>
        <p className="text-gray-700 mb-6">No tienes permisos para ver el inventario.</p>
        <Button onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Gestión de Inventario Profesional</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Sistema completo de gestión de inventario para restaurantes</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Cargando datos...</p>
          </div>
        </div>
      )}

      {!loading && (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          {/* Vista desktop: TabsList normal */}
          <TabsList className="hidden md:grid w-full grid-cols-4">
            <TabsTrigger 
              value="dashboard" 
              className={`flex items-center gap-2 ${!isTabAvailable('dashboard') ? 'opacity-50' : ''}`}
              disabled={!isTabAvailable('dashboard')}
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
              {!isTabAvailable('dashboard') && <Crown className="h-3 w-3 text-yellow-500" />}
            </TabsTrigger>
            <TabsTrigger 
              value="productos" 
              className={`flex items-center gap-2 ${!isTabAvailable('productos') ? 'opacity-50' : ''}`}
              disabled={!isTabAvailable('productos')}
            >
              <Package className="h-4 w-4" />
              Productos
              {!isTabAvailable('productos') && <Crown className="h-3 w-3 text-yellow-500" />}
            </TabsTrigger>
            <TabsTrigger 
              value="lotes" 
              className={`flex items-center gap-2 ${!isTabAvailable('lotes') ? 'opacity-50' : ''}`}
              disabled={!isTabAvailable('lotes')}
            >
              <FileText className="h-4 w-4" />
              Lotes
              {!isTabAvailable('lotes') && <Crown className="h-3 w-3 text-yellow-500" />}
            </TabsTrigger>
            <TabsTrigger 
              value="reportes" 
              className={`flex items-center gap-2 ${!isTabAvailable('reportes') ? 'opacity-50' : ''}`}
              disabled={!isTabAvailable('reportes')}
            >
              <TrendingUp className="h-4 w-4" />
              Reportes
              {!isTabAvailable('reportes') && <Crown className="h-3 w-3 text-yellow-500" />}
            </TabsTrigger>
          </TabsList>

          {/* Vista móvil: Botón con menú desplegable */}
          <div className="md:hidden mb-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setShowMobileTabsMenu(!showMobileTabsMenu)}
                className="flex items-center gap-2 w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  {React.createElement(getTabInfo(activeTab).icon, { className: "h-4 w-4" })}
                  <span>{getTabInfo(activeTab).text}</span>
                </div>
                <Menu className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Menú desplegable móvil */}
            {showMobileTabsMenu && (
              <div className="mt-2 space-y-2">
                <Button
                  variant={activeTab === 'dashboard' ? 'default' : 'outline'}
                  onClick={() => {
                    if (isTabAvailable('dashboard')) {
                      setActiveTab('dashboard');
                    }
                    setShowMobileTabsMenu(false);
                  }}
                  className={`w-full justify-start ${!isTabAvailable('dashboard') ? 'opacity-50' : ''}`}
                  disabled={!isTabAvailable('dashboard')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                  {!isTabAvailable('dashboard') && <Crown className="h-3 w-3 text-yellow-500 ml-auto" />}
                </Button>
                <Button
                  variant={activeTab === 'productos' ? 'default' : 'outline'}
                  onClick={() => {
                    if (isTabAvailable('productos')) {
                      setActiveTab('productos');
                    }
                    setShowMobileTabsMenu(false);
                  }}
                  className={`w-full justify-start ${!isTabAvailable('productos') ? 'opacity-50' : ''}`}
                  disabled={!isTabAvailable('productos')}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Productos
                  {!isTabAvailable('productos') && <Crown className="h-3 w-3 text-yellow-500 ml-auto" />}
                </Button>
                <Button
                  variant={activeTab === 'lotes' ? 'default' : 'outline'}
                  onClick={() => {
                    if (isTabAvailable('lotes')) {
                      setActiveTab('lotes');
                    }
                    setShowMobileTabsMenu(false);
                  }}
                  className={`w-full justify-start ${!isTabAvailable('lotes') ? 'opacity-50' : ''}`}
                  disabled={!isTabAvailable('lotes')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Lotes
                  {!isTabAvailable('lotes') && <Crown className="h-3 w-3 text-yellow-500 ml-auto" />}
                </Button>
                <Button
                  variant={activeTab === 'reportes' ? 'default' : 'outline'}
                  onClick={() => {
                    if (isTabAvailable('reportes')) {
                      setActiveTab('reportes');
                    }
                    setShowMobileTabsMenu(false);
                  }}
                  className={`w-full justify-start ${!isTabAvailable('reportes') ? 'opacity-50' : ''}`}
                  disabled={!isTabAvailable('reportes')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Reportes
                  {!isTabAvailable('reportes') && <Crown className="h-3 w-3 text-yellow-500 ml-auto" />}
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="dashboard" className="mt-6">
            <InventoryDashboard
              inventory={inventory}
              lotes={lotes}
              onFilterChange={handleFilterChange}
              onExportData={handleExportData}
              selectedBranch={selectedBranch}
              onStockUpdate={fetchInventoryData}
            />
          </TabsContent>

          <TabsContent value="productos" className="mt-4 sm:mt-6">
            <InventarioBasicoFeatureGate>
              <div className="space-y-4 sm:space-y-6">
              
              {/* Buscador de productos */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Buscar productos por nombre o categoría..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    {productSearchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setProductSearchTerm('')}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    )}
                  </div>
                  {productSearchTerm && (
                    <div className="mt-2 text-sm text-gray-600">
                      {searchedProducts.length} producto{searchedProducts.length !== 1 ? 's' : ''} encontrado{searchedProducts.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resumen de inventario */}
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                    Resumen de Inventario
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  {/* Vista móvil: Tarjetas */}
                  <div className="lg:hidden space-y-3">
                    {searchedProducts.map((product) => (
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
                                  <Badge 
                                    variant={
                                      (product.stock_actual || 0) === 0 ? "destructive" : 
                                      (product.stock_actual || 0) <= 10 ? "secondary" : "default"
                                    }
                                    className="text-xs"
                                  >
                                    {product.stock_actual || 0}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Precio:</span>
                                  <span className="text-sm font-medium text-green-600">
                                    Bs {(typeof product.precio === 'number' ? product.precio : parseFloat(product.precio) || 0).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Estado:</span>
                                  <Badge 
                                    variant={
                                      (product.stock_actual || 0) === 0 ? "destructive" : 
                                      (product.stock_actual || 0) <= 10 ? "secondary" : "default"
                                    }
                                    className="text-xs"
                                  >
                                    {(product.stock_actual || 0) === 0 ? 'Sin Stock' : 
                                     (product.stock_actual || 0) <= 10 ? 'Stock Bajo' : 'Stock OK'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setSelectedProduct(product)}
                                  className="text-xs"
                                >
                                  Ajustar Stock
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Ajustar Stock de {selectedProduct?.nombre}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="changeAmount" className="text-right text-sm">
                                      Cantidad
                                    </Label>
                                    <Input
                                      id="changeAmount"
                                      type="number"
                                      value={changeAmount}
                                      onChange={(e) => setChangeAmount(e.target.value)}
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="movementType" className="text-right text-sm">
                                      Tipo de Movimiento
                                    </Label>
                                    <Select onValueChange={setMovementType} value={movementType}>
                                      <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecciona tipo" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="entrada">Entrada</SelectItem>
                                        <SelectItem value="salida">Salida</SelectItem>
                                        <SelectItem value="ajuste_positivo">Ajuste Positivo</SelectItem>
                                        <SelectItem value="ajuste_negativo">Ajuste Negativo</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={handleUpdateStock} disabled={loading} className="w-full sm:w-auto">
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
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
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchedProducts.map((product) => (
                          <TableRow key={product.id_producto}>
                            <TableCell className="font-medium">{product.nombre}</TableCell>
                            <TableCell>{product.categoria_nombre}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  (product.stock_actual || 0) === 0 ? "destructive" : 
                                  (product.stock_actual || 0) <= 10 ? "secondary" : "default"
                                }
                              >
                                {product.stock_actual || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>Bs {(typeof product.precio === 'number' ? product.precio : parseFloat(product.precio) || 0).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  (product.stock_actual || 0) === 0 ? "destructive" : 
                                  (product.stock_actual || 0) <= 10 ? "secondary" : "default"
                                }
                              >
                                {(product.stock_actual || 0) === 0 ? 'Sin Stock' : 
                                 (product.stock_actual || 0) <= 10 ? 'Stock Bajo' : 'Stock OK'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setSelectedProduct(product)}
                                  >
                                    Ajustar Stock
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Ajustar Stock de {selectedProduct?.nombre}</DialogTitle>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="changeAmount" className="text-right">
                                        Cantidad
                                      </Label>
                                      <Input
                                        id="changeAmount"
                                        type="number"
                                        value={changeAmount}
                                        onChange={(e) => setChangeAmount(e.target.value)}
                                        className="col-span-3"
                                      />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="movementType" className="text-right">
                                        Tipo de Movimiento
                                      </Label>
                                      <Select onValueChange={setMovementType} value={movementType}>
                                        <SelectTrigger className="col-span-3">
                                          <SelectValue placeholder="Selecciona tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="entrada">Entrada</SelectItem>
                                          <SelectItem value="salida">Salida</SelectItem>
                                          <SelectItem value="ajuste_positivo">Ajuste Positivo</SelectItem>
                                          <SelectItem value="ajuste_negativo">Ajuste Negativo</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button onClick={handleUpdateStock} disabled={loading}>
                                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Historial de movimientos */}
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    Historial de Movimientos de Stock
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  {/* Vista móvil: Tarjetas */}
                  <div className="lg:hidden space-y-3">
                    {movements.map((movement) => (
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
                                  <span>{new Date(movement.fecha_movimiento).toLocaleString()}</span>
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
                        {movements.map((movement) => (
                          <TableRow key={movement.id_movimiento}>
                            <TableCell>{new Date(movement.fecha_movimiento).toLocaleString()}</TableCell>
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
              </div>
            </InventarioBasicoFeatureGate>
          </TabsContent>

          <TabsContent value="lotes" className="mt-4 sm:mt-6">
            <InventarioAvanzadoFeatureGate>
              <LotesManagement
                lotes={lotes}
                products={inventory}
                onSave={handleSaveLote}
                onDelete={handleDeleteLote}
                loading={loading}
              />
            </InventarioAvanzadoFeatureGate>
          </TabsContent>

          <TabsContent value="stock-sucursal" className="mt-4 sm:mt-6">
            <InventarioAvanzadoFeatureGate>
              {isTabAvailable('stock-sucursal') ? (
                <StockByBranchManagement onStockUpdate={fetchInventoryData} />
              ) : (
                <UpgradeMessage 
                  title="Stock por Sucursal - Plan Avanzado Requerido"
                  message="La gestión avanzada de stock por sucursal está disponible únicamente para administradores con plan Avanzado o superior."
                />
              )}
            </InventarioAvanzadoFeatureGate>
          </TabsContent>

          <TabsContent value="reportes" className="mt-4 sm:mt-6">
            <ReportesAvanzadosFeatureGate>
              <InventoryReports
                inventory={inventory}
                lotes={lotes}
                movements={movements}
                selectedBranch={selectedBranch}
              />
            </ReportesAvanzadosFeatureGate>
          </TabsContent>
        </Tabs>
      )}

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
                    <Badge 
                      variant={
                        (selectedProductForInfo.stock_actual || 0) === 0 ? "destructive" : 
                        (selectedProductForInfo.stock_actual || 0) <= 10 ? "secondary" : "default"
                      }
                    >
                      {selectedProductForInfo.stock_actual || 0}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Estado</Label>
                  <div className="mt-1">
                    <Badge 
                      variant={
                        (selectedProductForInfo.stock_actual || 0) === 0 ? "destructive" : 
                        (selectedProductForInfo.stock_actual || 0) <= 10 ? "secondary" : "default"
                      }
                    >
                      {(selectedProductForInfo.stock_actual || 0) === 0 ? 'Sin Stock' : 
                       (selectedProductForInfo.stock_actual || 0) <= 10 ? 'Stock Bajo' : 'Stock OK'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Precio</Label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <span className="text-lg font-bold text-green-600">
                    Bs {(typeof selectedProductForInfo.precio === 'number' ? selectedProductForInfo.precio : parseFloat(selectedProductForInfo.precio) || 0).toFixed(2)}
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
                    <span className="font-medium">{new Date(selectedMovementForInfo.fecha_movimiento).toLocaleString()}</span>
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
    </div>
  );
};

export default InventoryPage;
