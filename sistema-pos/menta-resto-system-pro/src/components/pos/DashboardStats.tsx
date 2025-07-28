
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  RefreshCw
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getVentasHoy, getVentasOrdenadas } from '@/services/api';
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

  // Calcular estadísticas
  const totalVentas = ventasFiltradas.length;
  const totalIngresos = ventasFiltradas.reduce((sum, venta) => sum + (venta.total || 0), 0);
  const promedioVenta = totalVentas > 0 ? totalIngresos / totalVentas : 0;
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
    <div className="space-y-6">
      {/* Header del Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
            Dashboard Ejecutivo
          </h2>
          <p className="text-gray-600 mt-1">
            Análisis completo de rendimiento y métricas de negocio
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries()}
            className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(selectedDate, 'dd MMM yyyy', { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-2xl rounded-2xl">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date || new Date());
                  setIsCalendarOpen(false);
                }}
                initialFocus
                className="rounded-xl"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventas Totales */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-blue-700">Ventas Totales</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-900">{totalVentas}</p>
                <div className="flex items-center mt-1">
                  {crecimientoVentas >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    crecimientoVentas >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {Math.abs(crecimientoVentas).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                Hoy
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Ingresos Totales */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-green-700">Ingresos Totales</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-900">
                  Bs {totalIngresos.toLocaleString('es-BO')}
                </p>
                <div className="flex items-center mt-1">
                  {crecimientoIngresos >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    crecimientoIngresos >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {Math.abs(crecimientoIngresos).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                Promedio: Bs {promedioVenta.toFixed(2)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Productos Activos */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-purple-700">Productos Activos</CardTitle>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-900">{productosActivos}</p>
                <p className="text-sm text-purple-600 mt-1">Disponibles</p>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                {((productosActivos / products.length) * 100).toFixed(0)}% Activos
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pedidos Pendientes */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-orange-700">Pedidos Pendientes</CardTitle>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-900">{pedidosPendientes}</p>
                <p className="text-sm text-orange-600 mt-1">En preparación</p>
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                {orders.length > 0 ? ((pedidosPendientes / orders.length) * 100).toFixed(0) : 0}% Pendientes
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y Análisis Detallados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Análisis de Ventas por Hora */}
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Análisis de Ventas por Hora
              </CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ventasFiltradas.length > 0 ? (
                <div className="space-y-3">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const ventasEnHora = ventasFiltradas.filter(v => 
                      new Date(v.timestamp).getHours() === hour
                    );
                    const porcentaje = (ventasEnHora.length / ventasFiltradas.length) * 100;
                    
                    return (
                      <div key={hour} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600 w-12">
                          {hour.toString().padStart(2, '0')}:00
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                          {ventasEnHora.length}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No hay datos de ventas para mostrar</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Rendimiento */}
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Métricas de Rendimiento
              </CardTitle>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">Tasa de Conversión</p>
                    <p className="text-sm text-blue-600">Ventas por visitante</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-900">
                    {totalVentas > 0 ? ((totalVentas / (totalVentas + pedidosPendientes)) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">Eficiencia Operativa</p>
                    <p className="text-sm text-green-600">Productos activos vs total</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-900">
                    {products.length > 0 ? ((productosActivos / products.length) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900">Satisfacción del Cliente</p>
                    <p className="text-sm text-purple-600">Pedidos completados</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-purple-900">
                    {orders.length > 0 ? (((orders.length - pedidosPendientes) / orders.length) * 100).toFixed(1) : 0}%
                  </p>
                </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </div>
  );
});
