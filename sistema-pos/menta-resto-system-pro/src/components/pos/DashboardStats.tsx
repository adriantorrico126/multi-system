
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sale } from '@/types/restaurant';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Clock, 
  Users, 
  Package, 
  Calendar as CalendarIcon,
  BarChart3,
  Activity,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  RefreshCw,
  Info
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getVentasHoy, getVentasOrdenadas, getProducts } from '@/services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface Order {
  id: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
}

interface Product {
  available: boolean;
}

interface DashboardStatsProps {
  sales: Sale[];
  orders: Order[];
  products: Product[];
}

export const DashboardStats = React.memo(({ sales, orders, products }: DashboardStatsProps) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // Cambiar la fecha por defecto para mostrar todas las fechas
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Estados para modal de información de productos
  const [selectedProductForInfo, setSelectedProductForInfo] = useState<any | null>(null);
  const [isProductInfoDialogOpen, setIsProductInfoDialogOpen] = useState(false);

  // Obtener la sucursal actual del localStorage
  const getCurrentSucursalId = () => {
    const savedSucursalId = localStorage.getItem('selectedSucursalId');
    return savedSucursalId ? parseInt(savedSucursalId) : (user?.sucursal?.id || 1);
  };

  const currentSucursalId = getCurrentSucursalId();

  // Efecto para actualizar cuando cambie la sucursal
  useEffect(() => {
    const handleSucursalChange = () => {
      // Invalidar queries cuando cambie la sucursal
      queryClient.invalidateQueries({ queryKey: ['ventas-dia'] });
      queryClient.invalidateQueries({ queryKey: ['ventas-ordenadas'] });
      console.log('🔄 Dashboard: Queries invalidadas por cambio de sucursal');
    };

    // Escuchar cambios en localStorage
    const handleLocalStorageChange = (e) => {
      if (e.key === 'selectedSucursalId') {
        handleSucursalChange();
      }
    };

    // Escuchar eventos personalizados
    window.addEventListener('sucursal-changed', handleSucursalChange);
    window.addEventListener('storage', handleLocalStorageChange);
    
    return () => {
      window.removeEventListener('sucursal-changed', handleSucursalChange);
      window.removeEventListener('storage', handleLocalStorageChange);
    };
  }, [queryClient]);

  // Query para obtener ventas del día seleccionado
  const { data: ventasDelDia = [], isLoading: isLoadingVentas, error: errorVentas } = useQuery({
    queryKey: ['ventas-dia', format(selectedDate, 'yyyy-MM-dd'), currentSucursalId],
    queryFn: () => getVentasHoy(format(selectedDate, 'yyyy-MM-dd')),
    enabled: true, // Habilitar siempre para debugging
  });

  // Query para obtener ventas ordenadas (últimas 50)
  const { data: ventasOrdenadas = [], error: errorOrdenadas } = useQuery({
    queryKey: ['ventas-ordenadas', currentSucursalId],
    queryFn: () => getVentasOrdenadas(50),
    enabled: true, // Habilitar siempre para debugging
  });

  // Query para obtener productos con detalles completos
  const { data: productosCompletos = [] } = useQuery({
    queryKey: ['products-detailed'],
    queryFn: () => getProducts(),
    enabled: true,
  });

  // Función para abrir modal de información de producto
  const openProductInfoDialog = (productName: string, unitsSold: number, percentage: number) => {
    // Buscar el producto completo en la lista de productos
    const productComplete = productosCompletos.find((p: any) => p.name === productName);
    if (productComplete) {
      setSelectedProductForInfo({
        ...productComplete,
        unitsSold: unitsSold,
        percentage: percentage
      });
      setIsProductInfoDialogOpen(true);
    }
  };

  // Usar ventas ordenadas para mostrar todas las fechas, o ventas del día si se selecciona una fecha específica
  const ventasFiltradas = selectedDate && format(selectedDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd') 
    ? ventasDelDia 
    : ventasOrdenadas;
  
  // Debug: Log the data structure
  console.log('DashboardStats - isAuthenticated:', isAuthenticated);
  console.log('DashboardStats - user:', user);
  console.log('DashboardStats - currentSucursalId:', currentSucursalId);
  console.log('DashboardStats - ventasDelDia:', ventasDelDia);
  console.log('DashboardStats - ventasOrdenadas:', ventasOrdenadas);
  console.log('DashboardStats - ventasFiltradas:', ventasFiltradas);

  // Calcular estadísticas en base a datos del backend
  const totalVentas = ventasFiltradas.length;
  const totalIngresos = ventasFiltradas.reduce((sum, venta) => sum + (venta.total || 0), 0);
  const promedioVenta = totalVentas > 0 ? totalIngresos / totalVentas : 0;
  const totalItemsVendidos = ventasFiltradas.reduce((sum, venta:any) => sum + (venta.items || []).reduce((s:any, it:any) => s + (Number(it.quantity)||0), 0), 0);
  const productosActivos = products.filter(p => p.available).length;
  const pedidosPendientes = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;

  // Calcular crecimiento vs día anterior
  const ventasHoy = ventasFiltradas.filter(v => 
    format(new Date(v.timestamp), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );
  const ventasAyer = ventasFiltradas.filter(v => 
    format(new Date(v.timestamp), 'yyyy-MM-dd') === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')
  );
  
  const crecimientoVentas = ventasAyer.length > 0 
    ? ((ventasHoy.length - ventasAyer.length) / ventasAyer.length) * 100 
    : 0;
  
  const crecimientoIngresos = ventasAyer.length > 0 
    ? ((ventasHoy.reduce((sum, v) => sum + (v.total || 0), 0) - ventasAyer.reduce((sum, v) => sum + (v.total || 0), 0)) / ventasAyer.reduce((sum, v) => sum + (v.total || 0), 0)) * 100 
    : 0;

  return (
    <div className="space-y-4 sm:space-y-6 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Ejecutivo
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Análisis completo de rendimiento y métricas de negocio
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 sm:px-3 py-1 text-xs sm:text-sm">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden sm:inline">En Tiempo Real</span>
            <span className="sm:hidden">Real</span>
          </Badge>
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2 sm:px-3 py-1 text-xs sm:text-sm">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden sm:inline">Actualizado</span>
            <span className="sm:hidden">Act</span>
          </Badge>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Ventas (periodo seleccionado / hoy por defecto) */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-300 group hover:scale-105">
          <CardContent className="p-4 sm:p-6 relative overflow-hidden">
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Ventas (período)</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-800">{totalVentas}</p>
                <p className="text-xs text-green-600 mt-1">Transacciones realizadas</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pedidos Activos */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all duration-300 group hover:scale-105">
          <CardContent className="p-4 sm:p-6 relative overflow-hidden">
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Pedidos Activos</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-800">{orders.length}</p>
                <p className="text-xs text-blue-600 mt-1">En preparación</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Productos Vendidos */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:shadow-lg transition-all duration-300 group hover:scale-105">
          <CardContent className="p-4 sm:p-6 relative overflow-hidden">
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">Productos vendidos</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-800">{totalItemsVendidos}</p>
                <p className="text-xs text-purple-600 mt-1">Unidades en el período</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ticket promedio (rendimiento de venta) */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:shadow-lg transition-all duration-300 group hover:scale-105">
          <CardContent className="p-4 sm:p-6 relative overflow-hidden">
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-orange-700 mb-1">Ticket promedio</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-orange-800">{promedioVenta.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</p>
                <p className="text-xs text-orange-600 mt-1">Promedio por transacción</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análisis Detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Gráfico de Ventas */}
        <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200 hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Tendencia de Ventas
              </h3>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse">
                +{crecimientoVentas.toFixed(1)}%
              </Badge>
            </div>
            <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 flex items-center justify-center relative overflow-hidden">
              {/* Efecto de ondas animadas */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-transparent to-indigo-400/20 animate-pulse"></div>
              <div className="text-center relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-700 text-sm font-medium">Análisis de Rendimiento</p>
                <p className="text-gray-500 text-xs">Ventas: {totalVentas} | Ingresos: {totalIngresos.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Productos Más Vendidos */}
        <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Productos Populares
              </h3>
              <Badge className="bg-gradient-to-r from-purple-500 to-violet-500 text-white">
                Top 5
              </Badge>
            </div>
            <div className="space-y-3">
              {(() => {
                const mapa:any = {};
                (ventasFiltradas || []).forEach((venta:any) => {
                  (venta.items || []).forEach((it:any) => {
                    const key = it.id || it.id_producto || it.name;
                    if (!mapa[key]) mapa[key] = { name: it.name || `Producto ${key}`, units: 0 };
                    mapa[key].units += Number(it.quantity) || 0;
                  });
                });
                const top = Object.values(mapa).sort((a:any,b:any)=>b.units-a.units).slice(0,5) as any[];
                const maxUnits = Math.max(1, ...top.map(t=>t.units));
                return top.map((product:any, index:number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-100 hover:shadow-md transition-all duration-200 group">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow duration-200">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-medium text-gray-800 break-words">{product.name}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openProductInfoDialog(product.name, product.units, Math.round((product.units/maxUnits)*100))}
                            className="p-1 h-5 w-5 hover:bg-purple-100 text-purple-600 hover:text-purple-700 flex-shrink-0 transition-colors duration-200"
                          >
                            <Info className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-violet-500 h-full rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${Math.min(100, (product.units/maxUnits)*100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 font-medium">{product.units} unidades</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas Adicionales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{totalIngresos.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Transacciones</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{totalVentas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Promedio</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">{promedioVenta.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="flex flex-col items-center gap-2">
                <Eye className="h-6 w-6 text-blue-600" />
                <span className="font-semibold">Ver Reporte Detallado</span>
                <span className="text-sm text-gray-600">Análisis completo</span>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="flex flex-col items-center gap-2">
                <Download className="h-6 w-6 text-green-600" />
                <span className="font-semibold">Exportar Datos</span>
                <span className="text-sm text-gray-600">CSV, Excel, PDF</span>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="flex flex-col items-center gap-2">
                <BarChart3 className="h-6 w-6 text-purple-600" />
                <span className="font-semibold">Configurar Alertas</span>
                <span className="text-sm text-gray-600">Notificaciones</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de información de productos */}
      <Dialog open={isProductInfoDialogOpen} onOpenChange={setIsProductInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Detalles del Producto
            </DialogTitle>
          </DialogHeader>
          
          {selectedProductForInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Nombre</span>
                  <p className="font-medium">{selectedProductForInfo.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Categoría</span>
                  <p className="font-medium">{selectedProductForInfo.category || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Precio</span>
                  <p className="font-medium text-green-600">
                    <span translate="no">Bs</span> {selectedProductForInfo.price?.toFixed(2) || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Stock Actual</span>
                  <p className="font-medium">{selectedProductForInfo.stock_actual || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Estado</span>
                  <div className="mt-1">
                    <Badge variant={selectedProductForInfo.available ? "default" : "secondary"} className="text-xs">
                      {selectedProductForInfo.available ? 'Disponible' : 'No Disponible'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Unidades Vendidas</span>
                  <p className="font-medium text-blue-600">{selectedProductForInfo.unitsSold || 0}</p>
                </div>
              </div>
              
              {/* Barra de porcentaje de popularidad */}
              <div>
                <span className="text-gray-500">Popularidad</span>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${selectedProductForInfo.percentage || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                    {selectedProductForInfo.percentage || 0}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Relativo al producto más vendido
                </p>
              </div>
              
              {selectedProductForInfo.price_original && selectedProductForInfo.price_original !== selectedProductForInfo.price && (
                <div>
                  <span className="text-gray-500">Precio Original</span>
                  <p className="font-medium text-gray-600 line-through">
                    <span translate="no">Bs</span> {selectedProductForInfo.price_original.toFixed(2)}
                  </p>
                </div>
              )}
              
              {selectedProductForInfo.discount_applied && selectedProductForInfo.discount_applied > 0 && (
                <div>
                  <span className="text-gray-500">Descuento Aplicado</span>
                  <p className="font-medium text-red-600">
                    {selectedProductForInfo.discount_applied}%
                  </p>
                </div>
              )}
              
              {selectedProductForInfo.imagen_url && (
                <div>
                  <span className="text-gray-500">Imagen</span>
                  <div className="mt-2">
                    <img 
                      src={selectedProductForInfo.imagen_url} 
                      alt={selectedProductForInfo.name}
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end">
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
    </div>
  );
});

