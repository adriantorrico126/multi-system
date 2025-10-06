import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  Users,
  Package,
  CreditCard,
  Eye,
  MoreHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Zap,
  Target,
  Award,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle,
  AlertCircle,
  Info,
  Star,
  Crown,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Sale } from '@/types/restaurant';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdvancedAnalytics } from './AdvancedAnalytics';

interface ProfessionalSalesHistoryProps {
  sales: Sale[];
  onDeleteSale: (saleId: string) => void;
  userRole: 'cajero' | 'admin' | 'cocinero';
  onRefresh?: () => void;
  loading?: boolean;
}

interface SalesMetrics {
  totalVentas: number;
  totalIngresos: number;
  promedioVenta: number;
  ventasHoy: number;
  ventasAyer: number;
  crecimiento: number;
  topVendedor: string;
  metodoPagoPopular: string;
  horaPico: string;
  ventasSemana: number;
  ventasMes: number;
  ventaMasAlta: number;
  ventaMasBaja: number;
  tipoServicioPopular: string;
  totalProductosVendidos: number;
  promedioProductosPorVenta: number;
}

interface FilterState {
  searchTerm: string;
  dateRange: 'hoy' | 'ayer' | 'semana' | 'mes' | 'todos';
  status: 'todos' | 'completada' | 'pendiente' | 'cancelada';
  tipoServicio: 'todos' | 'Mesa' | 'Delivery' | 'Para Llevar';
  rangoPrecio: 'todos' | 'bajo' | 'medio' | 'alto';
  sortBy: 'fecha' | 'total' | 'estado' | 'id';
  sortOrder: 'asc' | 'desc';
}

export function ProfessionalSalesHistory({
  sales,
  onDeleteSale,
  userRole,
  onRefresh,
  loading = false
}: ProfessionalSalesHistoryProps) {
  const { isMobile } = useMobile();
  const { toast } = useToast();
  
  // Estados principales
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'analytics' | 'export'>('overview');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  
  // Estado de filtros
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    dateRange: 'todos',
    status: 'todos',
    tipoServicio: 'todos',
    rangoPrecio: 'todos',
    sortBy: 'fecha',
    sortOrder: 'desc'
  });

  // Formatear moneda en Bolivianos
  const formatCurrency = (amount: number) => {
    return `Bs ${Number(amount).toFixed(2)}`;
  };

  // Formatear fecha
  const formatDate = (dateInput: string | Date) => {
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Obtener fecha de venta
  const getSaleDate = (sale: Sale): Date | null => {
    if (sale.fecha) {
      const date = new Date(sale.fecha);
      if (!isNaN(date.getTime())) return date;
    }
    if (sale.timestamp) {
      const date = new Date(sale.timestamp);
      if (!isNaN(date.getTime())) return date;
    }
    return null;
  };

  // Calcular métricas reales basadas en los datos de ventas
  const metrics: SalesMetrics = useMemo(() => {
    if (!sales || sales.length === 0) {
      return {
        totalVentas: 0,
        totalIngresos: 0,
        promedioVenta: 0,
        ventasHoy: 0,
        ventasAyer: 0,
        crecimiento: 0,
        topVendedor: 'Sin datos',
        metodoPagoPopular: 'Sin datos',
        horaPico: 'Sin datos',
        ventasSemana: 0,
        ventasMes: 0,
        ventaMasAlta: 0,
        ventaMasBaja: 0,
        tipoServicioPopular: 'Sin datos',
        totalProductosVendidos: 0,
        promedioProductosPorVenta: 0
      };
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Filtrar ventas de hoy
    const ventasHoy = sales.filter(sale => {
      const saleDate = getSaleDate(sale);
      return saleDate && saleDate.toDateString() === today.toDateString();
    });

    // Filtrar ventas de ayer
    const ventasAyer = sales.filter(sale => {
      const saleDate = getSaleDate(sale);
      return saleDate && saleDate.toDateString() === yesterday.toDateString();
    });

    // Calcular totales reales
    const totalIngresos = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const promedioVenta = sales.length > 0 ? totalIngresos / sales.length : 0;
    
    // Calcular crecimiento real
    const crecimiento = ventasAyer.length > 0 
      ? ((ventasHoy.length - ventasAyer.length) / ventasAyer.length) * 100 
      : ventasHoy.length > 0 ? 100 : 0; // Si no hay ventas ayer pero sí hoy, es 100% crecimiento

    // Análisis real de métodos de pago
    const metodosPago = sales.reduce((acc, sale) => {
      const metodo = sale.paymentMethod || 'No especificado';
      acc[metodo] = (acc[metodo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const metodoPagoPopular = Object.entries(metodosPago).length > 0
      ? Object.entries(metodosPago).sort(([,a], [,b]) => b - a)[0][0]
      : 'Sin datos';

    // Análisis real de horas pico
    const horas = sales.reduce((acc, sale) => {
      const saleDate = getSaleDate(sale);
      if (saleDate) {
        const hora = saleDate.getHours();
        acc[hora] = (acc[hora] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    const horaPico = Object.entries(horas).length > 0
      ? `${Object.entries(horas).sort(([,a], [,b]) => b - a)[0][0]}:00`
      : 'Sin datos';

    // Análisis real de vendedores/cajeros
    const vendedores = sales.reduce((acc, sale) => {
      const vendedor = sale.cashier || 'No especificado';
      acc[vendedor] = (acc[vendedor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topVendedor = Object.entries(vendedores).length > 0
      ? Object.entries(vendedores).sort(([,a], [,b]) => b - a)[0][0]
      : 'Sin datos';

    // Calcular ventas de la semana
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const ventasSemana = sales.filter(sale => {
      const saleDate = getSaleDate(sale);
      return saleDate && saleDate >= weekAgo;
    }).length;

    // Calcular ventas del mes
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    const ventasMes = sales.filter(sale => {
      const saleDate = getSaleDate(sale);
      return saleDate && saleDate >= monthAgo;
    }).length;

    // Calcular venta más alta y más baja
    const ventasTotales = sales.map(sale => sale.total || 0).filter(total => total > 0);
    const ventaMasAlta = ventasTotales.length > 0 ? Math.max(...ventasTotales) : 0;
    const ventaMasBaja = ventasTotales.length > 0 ? Math.min(...ventasTotales) : 0;

    // Análisis real de tipos de servicio
    const tiposServicio = sales.reduce((acc, sale) => {
      const tipo = sale.tipo_servicio || 'No especificado';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tipoServicioPopular = Object.entries(tiposServicio).length > 0
      ? Object.entries(tiposServicio).sort(([,a], [,b]) => b - a)[0][0]
      : 'Sin datos';

    // Calcular total de productos vendidos
    const totalProductosVendidos = sales.reduce((sum, sale) => {
      if (sale.items && sale.items.length > 0) {
        return sum + sale.items.reduce((itemSum, item) => itemSum + (item.quantity || 1), 0);
      }
      return sum + 1; // Si no hay items, contar como 1 producto
    }, 0);

    const promedioProductosPorVenta = sales.length > 0 ? totalProductosVendidos / sales.length : 0;

    return {
      totalVentas: sales.length,
      totalIngresos,
      promedioVenta,
      ventasHoy: ventasHoy.length,
      ventasAyer: ventasAyer.length,
      crecimiento,
      topVendedor,
      metodoPagoPopular,
      horaPico,
      ventasSemana,
      ventasMes,
      ventaMasAlta,
      ventaMasBaja,
      tipoServicioPopular,
      totalProductosVendidos,
      promedioProductosPorVenta
    };
  }, [sales]);

  // Filtrar y ordenar ventas
  const filteredAndSortedSales = useMemo(() => {
    let filtered = sales.filter(sale => {
      // Filtro de búsqueda
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          sale.id.toString().includes(searchLower) ||
          (sale.tipo_servicio && sale.tipo_servicio.toLowerCase().includes(searchLower)) ||
          (sale.mesa_numero && sale.mesa_numero.toString().includes(searchLower)) ||
          (sale.estado && sale.estado.toLowerCase().includes(searchLower)) ||
          sale.total.toString().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Filtro de fecha
      if (filters.dateRange !== 'todos') {
        const saleDate = getSaleDate(sale);
        if (!saleDate) return false;
        
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);

        switch (filters.dateRange) {
          case 'hoy':
            if (saleDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'ayer':
            if (saleDate.toDateString() !== yesterday.toDateString()) return false;
            break;
          case 'semana':
            if (saleDate < weekAgo) return false;
            break;
          case 'mes':
            if (saleDate < monthAgo) return false;
            break;
        }
      }

      // Filtro de estado
      if (filters.status !== 'todos' && sale.estado !== filters.status) {
        return false;
      }

      // Filtro de tipo de servicio
      if (filters.tipoServicio !== 'todos' && sale.tipo_servicio !== filters.tipoServicio) {
        return false;
      }

      // Filtro de rango de precio
      if (filters.rangoPrecio !== 'todos') {
        const total = sale.total || 0;
        switch (filters.rangoPrecio) {
          case 'bajo':
            if (total >= 50) return false;
            break;
          case 'medio':
            if (total < 50 || total >= 200) return false;
            break;
          case 'alto':
            if (total < 200) return false;
            break;
        }
      }

      return true;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'fecha':
          aValue = getSaleDate(a) || new Date(0);
          bValue = getSaleDate(b) || new Date(0);
          break;
        case 'total':
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        case 'estado':
          aValue = a.estado || '';
          bValue = b.estado || '';
          break;
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        default:
          aValue = getSaleDate(a) || new Date(0);
          bValue = getSaleDate(b) || new Date(0);
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [sales, filters]);

  // Toggle expandir venta
  const toggleSale = (saleId: string) => {
    const newExpanded = new Set(expandedSales);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedSales(newExpanded);
  };

  // Redirigir automáticamente si el usuario no es admin y está en un tab restringido
  useEffect(() => {
    if (userRole !== 'admin' && (activeTab === 'analytics' || activeTab === 'export')) {
      setActiveTab('overview');
      toast({
        title: "Acceso Restringido",
        description: "Solo los administradores pueden acceder a Analytics y Exportar.",
        variant: "destructive",
      });
    }
  }, [activeTab, userRole, toast]);

  // Manejar exportación
  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    toast({
      title: "Exportación",
      description: `Exportando ventas en formato ${format.toUpperCase()}...`,
    });
    // Aquí se implementaría la lógica de exportación
  };

  // Componente de métricas
  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = 'blue',
    trend,
    trendValue 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-indigo-500',
      green: 'from-green-500 to-emerald-500',
      purple: 'from-purple-500 to-pink-500',
      orange: 'from-orange-500 to-red-500',
      red: 'from-red-500 to-pink-500'
    };

    const trendIcons = {
      up: ArrowUpRight,
      down: ArrowDownRight,
      neutral: Minus
    };

    const trendColors = {
      up: 'text-green-600',
      down: 'text-red-600',
      neutral: 'text-gray-600'
    };

    return (
      <Card className="bg-gradient-to-br from-white to-gray-50/50 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
              {trend && trendValue && (
                <div className={cn("flex items-center mt-2 text-xs font-medium", trendColors[trend])}>
                  {React.createElement(trendIcons[trend], { className: "h-3 w-3 mr-1" })}
                  {trendValue}
                </div>
              )}
            </div>
            <div className={cn(
              "p-3 rounded-full bg-gradient-to-r text-white shadow-lg",
              colorClasses[color]
            )}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 professional-sales-mobile">
      {/* Header con gradiente profesional - Responsive */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <BarChart3 className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold drop-shadow-md">Historial de Ventas</h1>
              <p className="text-xs sm:text-sm opacity-90 mt-1">Gestión profesional de ventas y analytics</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="text-white hover:bg-white/20 transition-all duration-200 p-2"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            )}
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs sm:text-sm">
              {filteredAndSortedSales.length} ventas
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs de navegación - Responsive */}
      <div className="px-3 sm:px-6 pt-4 sm:pt-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className={cn(
            "grid w-full bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-lg",
            userRole === 'admin' ? "grid-cols-4 h-10 sm:h-12" : "grid-cols-2 h-10 sm:h-12"
          )}>
            <TabsTrigger
              value="overview"
              className={cn(
                "text-xs sm:text-sm font-medium transition-all duration-200 rounded-lg px-2 sm:px-3",
                activeTab === 'overview' ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Resumen</span>
              <span className="sm:hidden">Resumen</span>
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className={cn(
                "text-xs sm:text-sm font-medium transition-all duration-200 rounded-lg px-2 sm:px-3",
                activeTab === 'sales' ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Ventas</span>
              <span className="sm:hidden">Ventas</span>
            </TabsTrigger>
            {userRole === 'admin' && (
              <>
                <TabsTrigger
                  value="analytics"
                  className={cn(
                    "text-xs sm:text-sm font-medium transition-all duration-200 rounded-lg px-2 sm:px-3",
                    activeTab === 'analytics' ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">Analytics</span>
                </TabsTrigger>
                <TabsTrigger
                  value="export"
                  className={cn(
                    "text-xs sm:text-sm font-medium transition-all duration-200 rounded-lg px-2 sm:px-3",
                    activeTab === 'export' ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Exportar</span>
                  <span className="sm:hidden">Exportar</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>
      </div>

      {/* Contenido de los tabs - Responsive */}
      <div className="p-3 sm:p-6">
        {/* Tab: Resumen */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Métricas principales - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="professional-sales-mobile-card professional-sales-mobile-stagger-1">
                <MetricCard
                  title="Total Ventas"
                  value={metrics.totalVentas}
                  subtitle="Ventas registradas"
                  icon={FileText}
                  color="blue"
                  trend={metrics.crecimiento > 0 ? 'up' : metrics.crecimiento < 0 ? 'down' : 'neutral'}
                  trendValue={metrics.crecimiento !== 0 ? `${Math.abs(metrics.crecimiento).toFixed(1)}%` : 'Sin cambio'}
                />
              </div>
              <div className="professional-sales-mobile-card professional-sales-mobile-stagger-2">
                <MetricCard
                  title="Ingresos Totales"
                  value={formatCurrency(metrics.totalIngresos)}
                  subtitle="Ingresos acumulados"
                  icon={DollarSign}
                  color="green"
                />
              </div>
              <div className="professional-sales-mobile-card professional-sales-mobile-stagger-3">
                <MetricCard
                  title="Promedio por Venta"
                  value={formatCurrency(metrics.promedioVenta)}
                  subtitle="Ticket promedio"
                  icon={Target}
                  color="purple"
                />
              </div>
              <div className="professional-sales-mobile-card professional-sales-mobile-stagger-4">
                <MetricCard
                  title="Ventas Hoy"
                  value={metrics.ventasHoy}
                  subtitle={`vs ${metrics.ventasAyer} ayer`}
                  icon={Activity}
                  color="orange"
                  trend={metrics.ventasHoy > metrics.ventasAyer ? 'up' : metrics.ventasHoy < metrics.ventasAyer ? 'down' : 'neutral'}
                  trendValue={metrics.ventasAyer > 0 ? `${Math.round(((metrics.ventasHoy - metrics.ventasAyer) / metrics.ventasAyer) * 100)}%` : 'N/A'}
                />
              </div>
            </div>

            {/* Métricas secundarias - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full text-white">
                      <CreditCard className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Método de Pago Popular</p>
                      <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">{metrics.metodoPagoPopular}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-green-50/30 border-green-200 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-white">
                      <Clock className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Hora Pico</p>
                      <p className="text-sm sm:text-lg font-bold text-gray-900">{metrics.horaPico}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-purple-50/30 border-purple-200 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white">
                      <Award className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Top Vendedor</p>
                      <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">{metrics.topVendedor}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-orange-50/30 border-orange-200 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white">
                      <Package className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Tipo de Servicio Popular</p>
                      <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">{metrics.tipoServicioPopular}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Métricas adicionales - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <MetricCard
                title="Ventas Esta Semana"
                value={metrics.ventasSemana}
                subtitle="Últimos 7 días"
                icon={Calendar}
                color="blue"
              />
              
              <MetricCard
                title="Ventas Este Mes"
                value={metrics.ventasMes}
                subtitle="Últimos 30 días"
                icon={Calendar}
                color="green"
              />
              
              <MetricCard
                title="Venta Más Alta"
                value={formatCurrency(metrics.ventaMasAlta)}
                subtitle="Ticket máximo"
                icon={TrendingUp}
                color="purple"
              />
              
              <MetricCard
                title="Productos Vendidos"
                value={metrics.totalProductosVendidos}
                subtitle={`Promedio: ${metrics.promedioProductosPorVenta.toFixed(1)} por venta`}
                icon={Package}
                color="orange"
              />
            </div>

            {/* Ventas recientes */}
            <Card className="bg-gradient-to-br from-white to-gray-50/30 border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <span>Ventas Recientes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredAndSortedSales.slice(0, 5).map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Venta #{sale.id}</p>
                          <p className="text-sm text-gray-500">{formatDate(getSaleDate(sale) || '')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(sale.total || 0)}</p>
                        <Badge 
                          variant={sale.estado === 'completada' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {sale.estado || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab: Ventas */}
        {activeTab === 'sales' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Filtros y búsqueda - Responsive */}
            <Card className="bg-gradient-to-br from-white to-gray-50/30 border-gray-200 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* Búsqueda */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar ventas por ID, servicio, mesa, estado..."
                        value={filters.searchTerm}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Filtros rápidos - Responsive */}
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value as any }))}
                    >
                      <SelectTrigger className="w-28 sm:w-32 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="hoy">Hoy</SelectItem>
                        <SelectItem value="ayer">Ayer</SelectItem>
                        <SelectItem value="semana">Semana</SelectItem>
                        <SelectItem value="mes">Mes</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
                    >
                      <SelectTrigger className="w-28 sm:w-32 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="completada">Completada</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Filtros</span>
                      {showFilters ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Filtros avanzados - Responsive */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Servicio</label>
                        <Select
                          value={filters.tipoServicio}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, tipoServicio: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="Mesa">Mesa</SelectItem>
                            <SelectItem value="Delivery">Delivery</SelectItem>
                            <SelectItem value="Para Llevar">Para Llevar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Rango de Precio</label>
                        <Select
                          value={filters.rangoPrecio}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, rangoPrecio: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="bajo">Bs 0 - 50</SelectItem>
                            <SelectItem value="medio">Bs 50 - 200</SelectItem>
                            <SelectItem value="alto">Bs 200+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Ordenar por</label>
                        <div className="flex space-x-2">
                          <Select
                            value={filters.sortBy}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as any }))}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fecha">Fecha</SelectItem>
                              <SelectItem value="total">Total</SelectItem>
                              <SelectItem value="estado">Estado</SelectItem>
                              <SelectItem value="id">ID</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilters(prev => ({ 
                              ...prev, 
                              sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                            }))}
                          >
                            {filters.sortOrder === 'asc' ? '↑' : '↓'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lista de ventas - Responsive */}
            <div className="space-y-3 sm:space-y-4">
              {filteredAndSortedSales.length > 0 ? (
                filteredAndSortedSales.map((sale, index) => (
                  <Card
                    key={sale.id}
                    className={`bg-gradient-to-br from-white to-gray-50/30 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 professional-sales-mobile-card professional-sales-touch-feedback professional-sales-mobile-stagger-${(index % 5) + 1}`}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1 gap-1 sm:gap-0">
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">Venta #{sale.id}</h3>
                              <Badge 
                                variant={sale.estado === 'completada' ? 'default' : 'secondary'}
                                className="text-xs w-fit"
                              >
                                {sale.estado || 'N/A'}
                              </Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-600 gap-1 sm:gap-0">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span className="truncate">{formatDate(getSaleDate(sale) || '')}</span>
                              </div>
                              {sale.tipo_servicio && (
                                <div className="flex items-center space-x-1">
                                  <Package className="h-3 w-3" />
                                  <span className="truncate">{sale.tipo_servicio}</span>
                                </div>
                              )}
                              {sale.mesa_numero && (
                                <div className="flex items-center space-x-1">
                                  <Users className="h-3 w-3" />
                                  <span>Mesa {sale.mesa_numero}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
                          <div className="text-left sm:text-right">
                            <p className="text-lg sm:text-2xl font-bold text-green-600">
                              {formatCurrency(sale.total || 0)}
                            </p>
                            {sale.paymentMethod && (
                              <p className="text-xs sm:text-sm text-gray-500 truncate">{sale.paymentMethod}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSale(sale);
                                setShowDetailsModal(true);
                              }}
                              className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Ver</span>
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                                  <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => toggleSale(sale.id)}>
                                  {expandedSales.has(sale.id) ? (
                                    <>
                                      <ChevronUp className="h-4 w-4 mr-2" />
                                      Contraer
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4 mr-2" />
                                      Expandir
                                    </>
                                  )}
                                </DropdownMenuItem>
                                {userRole === 'admin' && (
                                  <DropdownMenuItem 
                                    onClick={() => onDeleteSale(sale.id)}
                                    className="text-red-600"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>

                      {/* Detalles expandidos - Responsive */}
                      {expandedSales.has(sale.id) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                            <div>
                              <p className="font-medium text-gray-700">Información General</p>
                              <div className="mt-2 space-y-1 text-gray-600">
                                <p><span className="font-medium">ID:</span> {sale.id}</p>
                                <p><span className="font-medium">Fecha:</span> {formatDate(getSaleDate(sale) || '')}</p>
                                <p><span className="font-medium">Estado:</span> {sale.estado || 'N/A'}</p>
                                <p><span className="font-medium">Método de Pago:</span> {sale.paymentMethod || 'N/A'}</p>
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">Detalles del Servicio</p>
                              <div className="mt-2 space-y-1 text-gray-600">
                                <p><span className="font-medium">Tipo:</span> {sale.tipo_servicio || 'N/A'}</p>
                                <p><span className="font-medium">Mesa:</span> {sale.mesa_numero || 'N/A'}</p>
                                <p><span className="font-medium">Total:</span> {formatCurrency(sale.total || 0)}</p>
                                {sale.appliedPromociones && sale.appliedPromociones.length > 0 && (
                                  <p><span className="font-medium">Promociones:</span> {sale.appliedPromociones.length} aplicada{sale.appliedPromociones.length !== 1 ? 's' : ''}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-gradient-to-br from-white to-gray-50/30 border-gray-200 shadow-lg">
                  <CardContent className="p-12">
                    <div className="text-center text-gray-500">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-xl font-medium mb-2">No se encontraron ventas</p>
                      <p className="text-sm">
                        {filters.searchTerm || Object.values(filters).some(f => f !== 'todos') 
                          ? 'Intenta ajustar los filtros de búsqueda' 
                          : 'No hay ventas registradas'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Tab: Analytics */}
        {activeTab === 'analytics' && userRole === 'admin' && (
          <div className="space-y-6">
            <AdvancedAnalytics userRole={userRole} />
          </div>
        )}

        {/* Tab: Exportar */}
        {activeTab === 'export' && userRole === 'admin' && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-white to-orange-50/30 border-orange-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5 text-orange-600" />
                  <span>Exportar Ventas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleExport('pdf')}>
                    <CardContent className="p-6 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-red-500" />
                      <h4 className="text-lg font-semibold mb-2">Exportar PDF</h4>
                      <p className="text-sm text-gray-600">Reporte profesional en formato PDF</p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleExport('excel')}>
                    <CardContent className="p-6 text-center">
                      <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <h4 className="text-lg font-semibold mb-2">Exportar Excel</h4>
                      <p className="text-sm text-gray-600">Hoja de cálculo con gráficos</p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleExport('csv')}>
                    <CardContent className="p-6 text-center">
                      <Download className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                      <h4 className="text-lg font-semibold mb-2">Exportar CSV</h4>
                      <p className="text-sm text-gray-600">Datos en formato CSV</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de detalles profesional - Responsive */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className={cn(
          "max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 border-0 shadow-2xl professional-sales-mobile",
          isMobile && "max-w-[95vw] max-h-[95vh] rounded-none professional-sales-modal"
        )}>
          {/* Header con gradiente - Responsive */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <div className="p-2 sm:p-3 bg-white/20 rounded-full backdrop-blur-sm flex-shrink-0">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-lg sm:text-xl font-bold drop-shadow-md truncate">
                    Detalles de Venta #{selectedSale?.id}
                  </DialogTitle>
                  <p className="text-xs sm:text-sm opacity-90 mt-1 truncate">
                    {selectedSale ? formatDate(getSaleDate(selectedSale) || '') : ''}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDetailsModal(false)}
                className="text-white hover:bg-white/20 transition-all duration-200 rounded-full flex-shrink-0"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>

          {/* Contenido del modal - Responsive */}
          <ScrollArea className="flex-1 max-h-[70vh] p-3 sm:p-6 professional-sales-smooth-scroll">
            {selectedSale && (
              <div className="space-y-4 sm:space-y-6 professional-sales-optimized">
                {/* Información general - Responsive */}
                <Card className="bg-gradient-to-br from-white to-gray-50/30 border-gray-200 shadow-lg">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                      <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      <span>Información General</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-700">Fecha y Hora</p>
                          <p className="text-xs sm:text-sm text-gray-900 truncate">{formatDate(getSaleDate(selectedSale) || '')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-700">Estado</p>
                          <Badge 
                            variant={selectedSale.estado === 'completada' ? 'default' : 'secondary'}
                            className="mt-1 text-xs"
                          >
                            {selectedSale.estado || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                          <Package className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-700">Tipo de Servicio</p>
                          <p className="text-xs sm:text-sm text-gray-900 truncate">{selectedSale.tipo_servicio || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex-shrink-0">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-700">Mesa</p>
                          <p className="text-xs sm:text-sm text-gray-900">{selectedSale.mesa_numero || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-700">Método de Pago</p>
                          <p className="text-xs sm:text-sm text-gray-900 truncate">{selectedSale.paymentMethod || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-700">Total</p>
                          <p className="text-lg sm:text-xl font-bold text-green-600">{formatCurrency(selectedSale.total || 0)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Productos vendidos - Responsive */}
                <Card className="bg-gradient-to-br from-white to-green-50/30 border-green-200 shadow-lg">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      <span>Productos Vendidos</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    {selectedSale.items && selectedSale.items.length > 0 ? (
                      <div className="space-y-3">
                        {selectedSale.items.map((item: any, index: number) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200 gap-3 sm:gap-4"
                          >
                            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{item.name || 'Producto'}</h4>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-600 gap-1 sm:gap-0">
                                  <span className="flex items-center space-x-1">
                                    <span>Cantidad:</span>
                                    <Badge variant="outline" className="font-medium text-xs">
                                      {item.quantity || 1}
                                    </Badge>
                                  </span>
                                  {item.notes && (
                                    <span className="flex items-center space-x-1">
                                      <Info className="h-3 w-3" />
                                      <span className="truncate">{item.notes}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-left sm:text-right flex-shrink-0">
                              <p className="text-base sm:text-lg font-bold text-green-600">
                                {formatCurrency((item.price || 0) * (item.quantity || 1))}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500">
                                {formatCurrency(item.price || 0)} c/u
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {/* Resumen de productos - Responsive */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                            <span className="text-sm sm:text-lg font-semibold text-gray-700">
                              Total de Productos: {selectedSale.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)}
                            </span>
                            <span className="text-lg sm:text-xl font-bold text-green-600">
                              {formatCurrency(selectedSale.total || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8">
                        <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
                        <p className="text-sm sm:text-base text-gray-500 font-medium">No hay productos registrados</p>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">
                          Los detalles de productos no están disponibles para esta venta
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Información de promociones si existe */}
                {selectedSale.appliedPromociones && selectedSale.appliedPromociones.length > 0 && (
                  <Card className="bg-gradient-to-br from-white to-yellow-50/30 border-yellow-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-yellow-600" />
                        <span>Promociones Aplicadas</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedSale.appliedPromociones.map((promo: any, index: number) => (
                          <div key={index} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <p className="font-medium text-yellow-800">{promo.nombre || 'Promoción'}</p>
                            <p className="text-sm text-yellow-600">{promo.descripcion || 'Sin descripción'}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Información adicional */}
                <Card className="bg-gradient-to-br from-white to-gray-50/30 border-gray-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-gray-600" />
                      <span>Información Adicional</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">ID de Venta</p>
                        <p className="text-gray-900 font-mono">{selectedSale.id}</p>
                      </div>
                      {selectedSale.cashier && (
                        <div>
                          <p className="font-medium text-gray-700">Cajero/Vendedor</p>
                          <p className="text-gray-900">{selectedSale.cashier}</p>
                        </div>
                      )}
                      {selectedSale.timestamp && (
                        <div>
                          <p className="font-medium text-gray-700">Timestamp</p>
                          <p className="text-gray-900 font-mono text-xs">
                            {new Date(selectedSale.timestamp).toISOString()}
                          </p>
                        </div>
                      )}
                      {selectedSale.fecha && (
                        <div>
                          <p className="font-medium text-gray-700">Fecha Original</p>
                          <p className="text-gray-900 font-mono text-xs">{selectedSale.fecha}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
