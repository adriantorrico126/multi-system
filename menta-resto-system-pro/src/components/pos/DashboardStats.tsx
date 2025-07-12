
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sale } from '@/types/restaurant';
import { TrendingUp, DollarSign, ShoppingCart, Clock, Users, Package, Calendar as CalendarIcon } from 'lucide-react';
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
  const totalRevenue = ventasFiltradas.reduce((sum: number, venta: any) => {
    const total = venta?.total;
    if (total === undefined || total === null) {
      console.warn('Venta with undefined total:', venta);
      return sum;
    }
    return sum + parseFloat(total);
  }, 0);
  const totalVentas = ventasFiltradas.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const activeProducts = products.filter(p => p.available).length;
  const averageTicket = totalVentas > 0 ? totalRevenue / totalVentas : 0;

  // Calcular porcentaje de ventas del día vs total
  const totalRevenueGeneral = ventasOrdenadas.reduce((sum: number, venta: any) => {
    const total = venta?.total;
    if (total === undefined || total === null) {
      console.warn('Venta ordenada with undefined total:', venta);
      return sum;
    }
    return sum + parseFloat(total);
  }, 0);
  const porcentajeDelDia = totalRevenueGeneral > 0 ? (totalRevenue / totalRevenueGeneral) * 100 : 0;

  const statsData = [
    {
      title: selectedDate && format(selectedDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd') 
        ? "Ventas del Día" 
        : "Total de Ventas",
      value: totalVentas,
      subtitle: `Bs ${totalRevenue.toFixed(2)}`,
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: selectedDate && format(selectedDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd') 
        ? "Ingresos del Día" 
        : "Total de Ingresos",
      value: `Bs ${totalRevenue.toFixed(2)}`,
      subtitle: `${totalVentas} ventas`,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Ticket Promedio",
      value: `Bs ${averageTicket.toFixed(2)}`,
      subtitle: "Por venta",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Órdenes Pendientes",
      value: pendingOrders,
      subtitle: `${orders.length} total`,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Productos Activos",
      value: activeProducts,
      subtitle: `${products.length} total`,
      icon: Package,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    {
      title: "Usuarios Activos",
      value: "3",
      subtitle: "En línea",
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Selector de Fecha */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resumen de Ventas</h2>
          <p className="text-gray-600">Estadísticas detalladas de las ventas</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setSelectedDate(new Date())}
            className={cn(
              "text-sm",
              format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && 
              "bg-blue-50 border-blue-200 text-blue-700"
            )}
          >
            Todas las fechas
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setSelectedDate(new Date('2025-07-11'))}
            className={cn(
              "text-sm",
              format(selectedDate, 'yyyy-MM-dd') === format(new Date('2025-07-11'), 'yyyy-MM-dd') && 
              "bg-green-50 border-green-200 text-green-700"
            )}
          >
            Hoy
          </Button>
          
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Estado de Carga */}
      {isLoadingVentas && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando ventas...</p>
        </div>
      )}

      {/* Mostrar errores si los hay */}
      {(errorVentas || errorOrdenadas) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-semibold mb-2">Error al cargar datos</h3>
          {errorVentas && (
            <p className="text-red-600 text-sm">Error ventas: {errorVentas.message}</p>
          )}
          {errorOrdenadas && (
            <p className="text-red-600 text-sm">Error ventas ordenadas: {errorOrdenadas.message}</p>
          )}
        </div>
      )}

      {/* Estadísticas */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {statsData.map((stat, index) => (
        <Card key={stat.title} className="hover:shadow-lg transition-all duration-300 pos-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </h3>
                  {stat.subtitle && (
                    <span className="text-sm text-gray-500">{stat.subtitle}</span>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
              {index === 0 && totalRevenue > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                    +{porcentajeDelDia.toFixed(1)}% del total
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      </div>

      {/* Lista de Ventas del Día */}
      {ventasFiltradas.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ventas del {format(selectedDate, "PPP", { locale: es })}
            </h3>
            <div className="space-y-3">
              {ventasFiltradas.slice(0, 10).map((venta: any) => (
                <div key={venta.id_venta} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Venta #{venta.id_venta}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(venta.fecha), "HH:mm")} - {venta.vendedor_nombre}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">Bs {venta.total ? parseFloat(venta.total).toFixed(2) : '0.00'}</p>
                    <p className="text-sm text-gray-500">{venta.metodo_pago || 'N/A'}</p>
                  </div>
                </div>
              ))}
              {ventasFiltradas.length > 10 && (
                <p className="text-sm text-gray-500 text-center">
                  Mostrando 10 de {ventasFiltradas.length} ventas
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay ventas */}
      {!isLoadingVentas && ventasFiltradas.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay ventas</h3>
            <p className="text-gray-500">
              No se registraron ventas el {format(selectedDate, "PPP", { locale: es })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';
