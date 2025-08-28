
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
    <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      {/* Header del Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Ejecutivo
          </h2>
          <p className="text-gray-600 mt-1">
            Análisis completo de rendimiento y métricas de negocio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1">
            <Activity className="h-4 w-4 mr-1" />
            En Tiempo Real
          </Badge>
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1">
            <TrendingUp className="h-4 w-4 mr-1" />
            Actualizado
          </Badge>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventas (periodo seleccionado / hoy por defecto) */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Ventas (período)</p>
                <p className="text-3xl font-bold text-green-800">{totalVentas}</p>
                <p className="text-xs text-green-600 mt-1">Transacciones realizadas</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pedidos Activos */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Pedidos Activos</p>
                <p className="text-3xl font-bold text-blue-800">{orders.length}</p>
                <p className="text-xs text-blue-600 mt-1">En preparación</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Productos Vendidos */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">Productos vendidos</p>
                <p className="text-3xl font-bold text-purple-800">{totalItemsVendidos}</p>
                <p className="text-xs text-purple-600 mt-1">Unidades en el período</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ticket promedio (rendimiento de venta) */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 mb-1">Ticket promedio</p>
                <p className="text-3xl font-bold text-orange-800">{promedioVenta.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</p>
                <p className="text-xs text-orange-600 mt-1">Promedio por transacción</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análisis Detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Ventas */}
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Tendencia de Ventas</h3>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                +12.5%
              </Badge>
            </div>
            <div className="h-64 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Gráfico de tendencias</p>
                <p className="text-gray-400 text-xs">Datos de ventas por día</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Productos Más Vendidos */}
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Productos Populares</h3>
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
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
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.units} unidades</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full" 
                          style={{ width: `${Math.round((product.units/maxUnits)*100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{Math.round((product.units/maxUnits)*100)}%</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas Adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-xl font-bold text-gray-800">{totalIngresos.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</p>
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
                <p className="text-xl font-bold text-gray-800">{totalVentas}</p>
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
                <p className="text-xl font-bold text-gray-800">{promedioVenta.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</p>
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
