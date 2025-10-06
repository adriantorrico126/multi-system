import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  PieChart,
  Activity,
  Target,
  Zap,
  Award,
  Package,
  Users,
  Building,
  FileText,
  Printer,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  Minus,
  BarChart,
  LineChart,
  PieChart as PieChartIcon,
  X
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import reconciliacionesApi, { type Reconciliacion, type EstadisticasReconciliaciones, type ResumenReconciliaciones } from '@/services/reconciliacionesApi';

interface ReconciliacionesAnalyticsProps {
  userRole: string;
}

export function ReconciliacionesAnalytics({ userRole }: ReconciliacionesAnalyticsProps) {
  const { toast } = useToast();
  const { isMobile } = useMobile();

  // Estados principales
  const [loading, setLoading] = useState(false);
  const [reconciliaciones, setReconciliaciones] = useState<Reconciliacion[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasReconciliaciones | null>(null);
  const [resumen, setResumen] = useState<ResumenReconciliaciones[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Estados para filtros
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [filtroSucursal, setFiltroSucursal] = useState('todas');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Estados para modales
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [reconciliacionSeleccionada, setReconciliacionSeleccionada] = useState<Reconciliacion | null>(null);

  // Verificar acceso de admin
  useEffect(() => {
    if (userRole !== 'admin') {
      toast({
        title: "Acceso Restringido",
        description: "Solo los administradores pueden acceder al análisis de reconciliaciones.",
        variant: "destructive",
      });
    }
  }, [userRole, toast]);

  // Cargar datos iniciales
  useEffect(() => {
    if (userRole === 'admin') {
      loadData();
    }
  }, [userRole]);

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    if (userRole === 'admin') {
      loadData();
    }
  }, [filtroFechaInicio, filtroFechaFin, filtroSucursal, filtroTipo, userRole]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const filtros = {
        fecha_inicio: filtroFechaInicio || undefined,
        fecha_fin: filtroFechaFin || undefined,
        id_sucursal: filtroSucursal !== 'todas' ? parseInt(filtroSucursal) : undefined,
        tipo_reconciliacion: filtroTipo !== 'todos' ? filtroTipo as 'efectivo' | 'completa' : undefined
      };

      const [reconciliacionesData, estadisticasData, resumenData] = await Promise.all([
        reconciliacionesApi.obtenerReconciliaciones(filtros),
        reconciliacionesApi.obtenerEstadisticasReconciliaciones(filtros),
        reconciliacionesApi.obtenerResumenReconciliaciones(filtros)
      ]);

      setReconciliaciones(reconciliacionesData);
      setEstadisticas(estadisticasData);
      setResumen(resumenData);

    } catch (error) {
      console.error('Error cargando datos de reconciliaciones:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de reconciliaciones.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Datos para gráficos
  const chartData = useMemo(() => {
    if (!reconciliaciones.length) return [];

    // Agrupar por fecha
    const porFecha = reconciliaciones.reduce((acc, rec) => {
      const fecha = rec.fecha_formateada || new Date(rec.fecha_reconciliacion).toLocaleDateString('es-ES');
      if (!acc[fecha]) {
        acc[fecha] = {
          fecha,
          total: 0,
          cuadradas: 0,
          sobrantes: 0,
          faltantes: 0,
          diferencia_total: 0
        };
      }
      
      acc[fecha].total++;
      if (Math.abs(Number(rec.diferencia) || 0) < 0.01) acc[fecha].cuadradas++;
      else if (Number(rec.diferencia) > 0) acc[fecha].sobrantes++;
      else acc[fecha].faltantes++;
      
      acc[fecha].diferencia_total += rec.diferencia || 0;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(porFecha).sort((a: any, b: any) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
  }, [reconciliaciones]);

  // Datos para gráfico de torta por estado
  const estadoData = useMemo(() => {
    if (!estadisticas) return [];
    
    return [
      { name: 'Cuadradas', value: estadisticas.reconciliaciones_cuadradas, color: '#10b981' },
      { name: 'Sobrantes', value: estadisticas.reconciliaciones_sobrantes, color: '#3b82f6' },
      { name: 'Faltantes', value: estadisticas.reconciliaciones_faltantes, color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [estadisticas]);

  const getMetodoColor = (metodo: string): string => {
    const colors: Record<string, string> = {
      efectivo: '#10b981',
      tarjeta_debito: '#3b82f6',
      tarjeta_credito: '#8b5cf6',
      transferencia: '#f59e0b',
      cheque: '#ef4444',
      otros: '#6b7280'
    };
    return colors[metodo] || '#6b7280';
  };

  // Datos para gráfico de métodos de pago
  const metodosData = useMemo(() => {
    const metodos: Record<string, { total: number; cuadradas: number; sobrantes: number; faltantes: number }> = {};
    
    reconciliaciones.forEach(rec => {
      if (rec.detalles_metodos) {
        rec.detalles_metodos.forEach(detalle => {
          const metodo = detalle.metodo_pago;
          if (!metodos[metodo]) {
            metodos[metodo] = { total: 0, cuadradas: 0, sobrantes: 0, faltantes: 0 };
          }
          metodos[metodo].total += detalle.monto_real;
          if (Math.abs(Number(rec.diferencia) || 0) < 0.01) metodos[metodo].cuadradas += detalle.monto_real;
          else if (Number(rec.diferencia) > 0) metodos[metodo].sobrantes += detalle.monto_real;
          else metodos[metodo].faltantes += detalle.monto_real;
        });
      }
    });

    return Object.entries(metodos).map(([metodo, data]) => ({
      metodo,
      ...data,
      color: getMetodoColor(metodo)
    }));
  }, [reconciliaciones]);

  const getMetodoLabel = (metodo: string): string => {
    const labels: Record<string, string> = {
      efectivo: 'Efectivo',
      tarjeta_debito: 'Tarjeta Débito',
      tarjeta_credito: 'Tarjeta Crédito',
      transferencia: 'Transferencia',
      cheque: 'Cheque',
      otros: 'Otros'
    };
    return labels[metodo] || metodo;
  };

  // Componente de métrica
  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    color = 'blue',
    onClick 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
    onClick?: () => void;
  }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-indigo-500',
      green: 'from-green-500 to-emerald-500',
      orange: 'from-orange-500 to-amber-500',
      purple: 'from-purple-500 to-pink-500',
      red: 'from-red-500 to-rose-500'
    };

    return (
      <Card 
        className={cn(
          "bg-gradient-to-br from-white to-gray-50/30 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300",
          onClick && "cursor-pointer hover:scale-105"
        )}
        onClick={onClick}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
              {trend && (
                <div className="flex items-center gap-1">
                  {trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              )}
            </div>
            <div className={`p-3 rounded-full bg-gradient-to-r ${colorClasses[color]}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Restringido</h3>
          <p className="text-gray-600">Solo los administradores pueden acceder al análisis de reconciliaciones.</p>
        </div>
      </div>
    );
  }

  if (loading && !reconciliaciones.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Cargando análisis de reconciliaciones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con Filtros */}
      <Card className="bg-gradient-to-br from-white to-orange-50/30 border-orange-200 shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl">Análisis de Reconciliaciones</CardTitle>
                <p className="text-sm text-gray-600">Análisis avanzado y profesional de reconciliaciones de caja</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                {reconciliaciones.length} registros
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Fecha Inicio</Label>
              <Input
                type="date"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Fecha Fin</Label>
              <Input
                type="date"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Sucursal</Label>
              <Select value={filtroSucursal} onValueChange={setFiltroSucursal}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las Sucursales</SelectItem>
                  <SelectItem value="1">Sucursal 1</SelectItem>
                  <SelectItem value="2">Sucursal 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Tipos</SelectItem>
                  <SelectItem value="efectivo">Solo Efectivo</SelectItem>
                  <SelectItem value="completa">Completa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Navegación */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn(
          "grid w-full bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-lg",
          isMobile ? "grid-cols-2 h-10" : "grid-cols-4 h-12"
        )}>
          <TabsTrigger
            value="overview"
            className={cn(
              "text-xs sm:text-sm font-medium transition-all duration-200 rounded-lg px-2 sm:px-3",
              activeTab === 'overview' ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Resumen</span>
            <span className="sm:hidden">Resumen</span>
          </TabsTrigger>
          <TabsTrigger
            value="trends"
            className={cn(
              "text-xs sm:text-sm font-medium transition-all duration-200 rounded-lg px-2 sm:px-3",
              activeTab === 'trends' ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Tendencias</span>
            <span className="sm:hidden">Tendencias</span>
          </TabsTrigger>
          <TabsTrigger
            value="methods"
            className={cn(
              "text-xs sm:text-sm font-medium transition-all duration-200 rounded-lg px-2 sm:px-3",
              activeTab === 'methods' ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <PieChart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Métodos</span>
            <span className="sm:hidden">Métodos</span>
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className={cn(
              "text-xs sm:text-sm font-medium transition-all duration-200 rounded-lg px-2 sm:px-3",
              activeTab === 'details' ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Detalles</span>
            <span className="sm:hidden">Detalles</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-6">
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <MetricCard
              title="Total Reconciliaciones"
              value={estadisticas?.total_reconciliaciones || 0}
              subtitle="Registros en el período"
              icon={Calculator}
              color="orange"
            />
            <MetricCard
              title="Reconciliaciones Cuadradas"
              value={estadisticas?.reconciliaciones_cuadradas || 0}
              subtitle={`${estadisticas ? ((estadisticas.reconciliaciones_cuadradas / estadisticas.total_reconciliaciones) * 100).toFixed(1) : 0}% del total`}
              icon={CheckCircle}
              color="green"
              trend="up"
            />
            <MetricCard
              title="Diferencia Promedio"
              value={estadisticas ? `Bs ${Math.abs(estadisticas.diferencia_efectivo_promedio || 0).toFixed(2)}` : 'Bs 0.00'}
              subtitle="Promedio de diferencias"
              icon={Target}
              color="blue"
            />
            <MetricCard
              title="Eficiencia"
              value={estadisticas ? `${((estadisticas.reconciliaciones_cuadradas / estadisticas.total_reconciliaciones) * 100).toFixed(1)}%` : '0%'}
              subtitle="Porcentaje de cuadradas"
              icon={Award}
              color="purple"
            />
          </div>

          {/* Gráfico de Estados */}
          <Card className="bg-gradient-to-br from-white to-orange-50/30 border-orange-200 shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                <span>Distribución por Estado</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={estadoData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {estadoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Cantidad']} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {estadoData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {estadisticas ? `${((item.value / estadisticas.total_reconciliaciones) * 100).toFixed(1)}%` : '0%'} del total
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tendencias */}
        <TabsContent value="trends" className="space-y-6">
          {/* Gráfico de Tendencias por Fecha */}
          <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200 shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <span>Tendencias de Reconciliaciones</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cuadradas" stroke="#10b981" strokeWidth={2} name="Cuadradas" />
                    <Line type="monotone" dataKey="sobrantes" stroke="#3b82f6" strokeWidth={2} name="Sobrantes" />
                    <Line type="monotone" dataKey="faltantes" stroke="#ef4444" strokeWidth={2} name="Faltantes" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Diferencias */}
          <Card className="bg-gradient-to-br from-white to-indigo-50/30 border-indigo-200 shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                <BarChart className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                <span>Evolución de Diferencias</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`Bs ${Number(value).toFixed(2)}`, 'Diferencia']} />
                    <Legend />
                    <Area type="monotone" dataKey="diferencia_total" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Diferencia Total" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Métodos de Pago */}
        <TabsContent value="methods" className="space-y-6">
          {/* Gráfico de Métodos de Pago */}
          <Card className="bg-gradient-to-br from-white to-purple-50/30 border-purple-200 shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                <span>Análisis por Métodos de Pago</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-6">
                {metodosData.map((metodo) => (
                  <div key={metodo.metodo} className="bg-white rounded-lg border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: metodo.color }}
                        />
                        <h3 className="font-semibold text-gray-900">{getMetodoLabel(metodo.metodo)}</h3>
                      </div>
                      <Badge variant="outline" className="text-gray-600">
                        Total: Bs {(Number(metodo.total) || 0).toFixed(2)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Cuadradas</p>
                        <p className="text-lg font-bold text-green-700">Bs {(Number(metodo.cuadradas) || 0).toFixed(2)}</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Sobrantes</p>
                        <p className="text-lg font-bold text-blue-700">Bs {(Number(metodo.sobrantes) || 0).toFixed(2)}</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-600 font-medium">Faltantes</p>
                        <p className="text-lg font-bold text-red-700">Bs {(Number(metodo.faltantes) || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Detalles */}
        <TabsContent value="details" className="space-y-6">
          {/* Lista de Reconciliaciones */}
          <Card className="bg-gradient-to-br from-white to-green-50/30 border-green-200 shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span>Detalle de Reconciliaciones</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {reconciliaciones.map((reconciliacion) => (
                    <div
                      key={reconciliacion.id_reconciliacion}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => {
                        setReconciliacionSeleccionada(reconciliacion);
                        setShowDetalleModal(true);
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${
                          reconciliacion.diferencia === 0 ? 'bg-green-100' :
                          reconciliacion.diferencia > 0 ? 'bg-blue-100' : 'bg-red-100'
                        }`}>
                          <Calculator className={`h-5 w-5 ${
                            reconciliacion.diferencia === 0 ? 'text-green-600' :
                            reconciliacion.diferencia > 0 ? 'text-blue-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Reconciliación #{reconciliacion.id_reconciliacion}
                          </p>
                          <p className="text-sm text-gray-600">
                            {reconciliacion.fecha_hora_completa || reconciliacion.fecha_reconciliacion} | {reconciliacion.usuario_nombre}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="outline" 
                          className={`${
                            Math.abs(Number(reconciliacion.diferencia) || 0) < 0.01 ? 'border-green-200 text-green-700 bg-green-50' :
                            Number(reconciliacion.diferencia) > 0 ? 'border-blue-200 text-blue-700 bg-blue-50' :
                            'border-red-200 text-red-700 bg-red-50'
                          }`}
                        >
                          {Math.abs(Number(reconciliacion.diferencia) || 0) < 0.01 ? '✅ Cuadrada' :
                           Number(reconciliacion.diferencia) > 0 ? '📈 Sobrante' : '📉 Faltante'}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          Bs {Math.abs(Number(reconciliacion.diferencia) || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalle */}
      <Dialog open={showDetalleModal} onOpenChange={setShowDetalleModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-orange-600" />
              <span>Detalle de Reconciliación #{reconciliacionSeleccionada?.id_reconciliacion}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto max-h-[65vh]">
            <ScrollArea className="h-full w-full">
              {reconciliacionSeleccionada && (
                <div className="space-y-6 p-4">
                  {/* Información básica */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Información General</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span>Fecha:</span>
                          <span className="font-bold">{reconciliacionSeleccionada.fecha_formateada || new Date(reconciliacionSeleccionada.fecha_reconciliacion).toLocaleDateString('es-ES')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hora:</span>
                          <span className="font-bold">{reconciliacionSeleccionada.hora_formateada || new Date(reconciliacionSeleccionada.fecha_reconciliacion).toLocaleTimeString('es-ES')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tipo:</span>
                          <span className="font-bold">
                            Completa
                          </span>
                        </div>
                         <div className="flex justify-between">
                           <span>Estado:</span>
                           <Badge 
                             variant="outline" 
                             className={`${
                               Math.abs(Number(reconciliacionSeleccionada.diferencia) || 0) < 0.01 ? 'border-green-200 text-green-700 bg-green-50' :
                               Number(reconciliacionSeleccionada.diferencia) > 0 ? 'border-blue-200 text-blue-700 bg-blue-50' :
                               'border-red-200 text-red-700 bg-red-50'
                             }`}
                           >
                             {Math.abs(Number(reconciliacionSeleccionada.diferencia) || 0) < 0.01 ? '✅ Cuadrada' :
                              Number(reconciliacionSeleccionada.diferencia) > 0 ? '📈 Sobrante' : '📉 Faltante'}
                           </Badge>
                         </div>
                        <div className="flex justify-between">
                          <span>Cajero:</span>
                          <span className="font-bold">{reconciliacionSeleccionada.usuario_nombre}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Datos Financieros</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <>
                          <div className="flex justify-between">
                            <span>Efectivo Inicial:</span>
                            <span className="font-bold">Bs {(Number(reconciliacionSeleccionada.efectivo_inicial) || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Efectivo Esperado:</span>
                            <span className="font-bold">Bs {(Number(reconciliacionSeleccionada.efectivo_esperado) || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Efectivo Final:</span>
                            <span className="font-bold">Bs {(Number(reconciliacionSeleccionada.efectivo_final) || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Diferencia:</span>
                            <span className={`font-bold ${reconciliacionSeleccionada.diferencia === 0 ? 'text-green-600' : reconciliacionSeleccionada.diferencia > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              Bs {(Number(reconciliacionSeleccionada.diferencia) || 0).toFixed(2)}
                            </span>
                          </div>
                        </>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detalles por método de pago */}
                  {reconciliacionSeleccionada.detalles_metodos && reconciliacionSeleccionada.detalles_metodos.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Detalle por Métodos de Pago</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {reconciliacionSeleccionada.detalles_metodos.map((detalle, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: detalle.metodo_pago === 'efectivo' ? '#10b981' : detalle.metodo_pago === 'tarjeta_debito' ? '#3b82f6' : detalle.metodo_pago === 'tarjeta_credito' ? '#8b5cf6' : '#f59e0b' }}
                                />
                                <span className="font-medium capitalize">{getMetodoLabel(detalle.metodo_pago)}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">Bs {(Number(detalle.monto_real) || 0).toFixed(2)}</div>
                                <div className="text-sm text-gray-600">
                                  Esperado: Bs {(Number(detalle.monto_esperado) || 0).toFixed(2)}
                                </div>
                                {detalle.diferencia !== 0 && (
                                  <div className={`text-xs ${detalle.diferencia > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    {detalle.diferencia > 0 ? '+' : ''}Bs {(Number(detalle.diferencia) || 0).toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Observaciones */}
                  {reconciliacionSeleccionada.observaciones && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Observaciones</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">{reconciliacionSeleccionada.observaciones}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
          
          <DialogFooter className="shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setShowDetalleModal(false)}
              className="flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}