import React, { useState, useEffect } from 'react';
import { usePlan } from '@/context/PlanContext';
import { PremiumFeatureGate } from '@/components/plans/PremiumFeatureGate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  PieChart,
  LineChart,
  BarChart,
  Activity,
  Target,
  Zap,
  Award,
  Clock,
  Package,
  Save,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  Bar,
  Pie
} from 'recharts';

interface AdvancedAnalyticsProps {
  userRole: 'cajero' | 'admin' | 'cocinero' | 'super_admin';
}

interface MetricasGenerales {
  total_ventas: number;
  ingresos_totales: number;
  ticket_promedio: number;
  venta_minima: number;
  venta_maxima: number;
  vendedores_activos: number;
  sucursales_activas: number;
  dias_con_ventas: number;
}

interface TendenciaDiaria {
  fecha: string;
  ventas_dia: number;
  ingresos_dia: number;
}

interface DistribucionHoraria {
  hora: number;
  ventas_hora: number;
  ingresos_hora: number;
  promedio_hora: number;
}

interface TopVendedor {
  id_vendedor: number;
  nombre_vendedor: string;
  ventas: number;
  ingresos: number;
  promedio_venta: number;
  ranking: number;
}

interface VentasPorTipo {
  tipo_servicio: string;
  cantidad: number;
  ingresos: number;
  promedio: number;
  porcentaje: number;
}

interface ProductoAnalytics {
  id_producto: number;
  producto: string;
  descripcion?: string;
  categoria: string;
  precio_venta: number;
  cantidad_vendida_final: number;
  ingresos_totales_final: number;
  ventas_asociadas_final: number;
  ticket_promedio_producto: number;
  promedio_diario: number;
  promedio_por_venta: number;
  porcentaje_cantidad: number;
  porcentaje_ingresos: number;
  porcentaje_frecuencia: number;
  ranking_cantidad: number;
  ranking_ingresos: number;
  ranking_frecuencia: number;
  primera_venta?: string;
  ultima_venta?: string;
  dias_vendido?: number;
  activo: boolean;
}

interface CategoriaAnalytics {
  categoria: string;
  id_categoria: number;
  productos_totales: number;
  productos_vendidos: number;
  cantidad_total: number;
  ingresos_totales: number;
  precio_promedio: number;
  ticket_promedio_categoria: number;
  tasa_conversion: number;
  porcentaje_ingresos: number;
}

interface TendenciaProducto {
  producto: string;
  fecha_venta: string;
  cantidad_dia: number;
  ingresos_dia: number;
}

interface ProductosData {
  productos: ProductoAnalytics[];
  categorias: CategoriaAnalytics[];
  tendencias: TendenciaProducto[] | null;
  metricas_generales: {
    total_productos: number;
    productos_vendidos: number;
    total_categorias: number;
    cantidad_total_vendida: number;
    ingresos_totales: number;
    precio_promedio_general: number;
    producto_mas_vendido_cantidad: number;
    producto_mas_vendido_ingresos: number;
  };
}

interface AnalyticsData {
  metricas_generales: MetricasGenerales;
  tendencia_diaria: TendenciaDiaria[];
  distribucion_horaria: DistribucionHoraria[];
  top_vendedores: TopVendedor[];
  por_tipo_servicio: VentasPorTipo[];
  comparacion?: {
    periodo_anterior: {
      fecha_inicio: string;
      fecha_fin: string;
      total_ventas: number;
      ingresos_totales: number;
      ticket_promedio: number;
    };
    variaciones: {
      ventas: { absoluta: number; porcentual: string };
      ingresos: { absoluta: string; porcentual: string };
    };
  };
}

// Función para formatear moneda
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB'
  }).format(amount);
};

// Función auxiliar para formatear valores en tooltips
const formatTooltipValue = (value: any) => formatCurrency(Number(value) || 0);

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function AdvancedAnalytics({ userRole }: AdvancedAnalyticsProps) {
  console.log('🚀 [ADVANCED-ANALYTICS] Componente iniciado con userRole:', userRole);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [productosData, setProductosData] = useState<ProductosData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProductos, setIsLoadingProductos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const { toast } = useToast();
  const { hasFeature, checkFeatureAccess } = usePlan();

  // Filtros globales para todas las pestañas
  const [fechaInicio, setFechaInicio] = useState(
    format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('all');
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState('all');
  const [tipoServicio, setTipoServicio] = useState('all');
  const [compararPeriodo, setCompararPeriodo] = useState(false);

  // Filtros avanzados globales
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('all');
  const [productoSeleccionado, setProductoSeleccionado] = useState('all');
  const [rangoPrecioMin, setRangoPrecioMin] = useState('');
  const [rangoPrecioMax, setRangoPrecioMax] = useState('');
  const [estadoProducto, setEstadoProducto] = useState('all'); // all, activo, inactivo
  const [filtroVentas, setFiltroVentas] = useState('all'); // all, vendidos, no_vendidos
  const [filtroIngresos, setFiltroIngresos] = useState('all'); // all, alto, medio, bajo
  const [ordenarDireccion, setOrdenarDireccion] = useState('desc'); // desc, asc

  // Configuración específica por pestaña
  const [ordenProductos, setOrdenProductos] = useState('cantidad');
  const [limiteProductos, setLimiteProductos] = useState(20);
  const [incluirTendencias, setIncluirTendencias] = useState(true);
  
  // Log del estado de incluirTendencias
  console.log('🔍 [ANALYTICS] incluirTendencias state:', incluirTendencias);

  // Control de visibilidad de filtros
  const [showFilters, setShowFilters] = useState(false);

  const fetchAnalytics = async () => {
    console.log('🚀 [ANALYTICS] fetchAnalytics INICIADA');
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        fechaInicio,
        fechaFin,
        ...(sucursalSeleccionada && sucursalSeleccionada !== 'all' && { id_sucursal: sucursalSeleccionada }),
        ...(vendedorSeleccionado && vendedorSeleccionado !== 'all' && { id_vendedor: vendedorSeleccionado }),
        ...(tipoServicio && tipoServicio !== 'all' && { tipo_servicio: tipoServicio }),
        comparar_periodo: compararPeriodo.toString()
      });

      console.log('🔍 [ANALYTICS] Solicitando datos con parámetros:', params.toString());
      console.log('🔍 [ANALYTICS] Fechas utilizadas:', {
        fechaInicio,
        fechaFin,
        diasDeDiferencia: Math.ceil((new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24))
      });
      console.log('🔍 [ANALYTICS] Headers de autenticación:', {
        hasToken: !!localStorage.getItem('jwtToken'),
        tokenPrefix: localStorage.getItem('jwtToken')?.substring(0, 20) + '...'
      });
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/analytics/sales/metrics?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 [ANALYTICS] Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ANALYTICS] Error del servidor:', errorText);
        throw new Error(`Error al obtener analytics: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 [ANALYTICS] Datos recibidos completos:', JSON.stringify(data, null, 2));
      console.log('🔍 [ANALYTICS] data.data específico:', JSON.stringify(data.data, null, 2));
      console.log('🔍 [ANALYTICS] Estructura de analytics:', {
        hasData: !!data.data,
        dataKeys: data.data ? Object.keys(data.data) : [],
        metricasKeys: data.data?.metricas_generales ? Object.keys(data.data.metricas_generales) : [],
        metricasCompletas: data.data?.metricas_generales || 'no encontradas',
        productosLength: data.data?.productos?.length || 0,
        productosFirst3: data.data?.productos?.slice(0, 3) || 'no encontrados',
        tendenciasLength: data.data?.tendencias?.length || 0,
        tendenciasFirst3: data.data?.tendencias?.slice(0, 3) || 'no encontradas'
      });
      
      console.log('🔄 [ANALYTICS] Seteando analyticsData con:', data.data);
      setAnalyticsData(data.data);
      console.log('✅ [ANALYTICS] analyticsData seteado exitosamente');

      // Verificar si hay datos significativos
      const hasSignificantData = data.data && (
        (data.data.metricas_generales && Object.keys(data.data.metricas_generales).length > 0) ||
        (data.data.productos && data.data.productos.length > 0) ||
        (data.data.tendencias && data.data.tendencias.length > 0)
      );

      console.log('🔍 [ANALYTICS] ¿Hay datos significativos?', hasSignificantData);
      
      if (!hasSignificantData) {
        console.log('⚠️ [ANALYTICS] PROBLEMA: No hay datos significativos en la respuesta');
        console.log('⚠️ [ANALYTICS] Posibles causas:');
        console.log('  1. No hay ventas en el rango de fechas especificado');
        console.log('  2. Backend no está devolviendo datos completos');
        console.log('  3. Estructura de datos ha cambiado');
      }

      toast({
        title: "Analytics Actualizados",
        description: hasSignificantData ? "Los datos se han actualizado correctamente" : "⚠️ No se encontraron datos para el rango de fechas seleccionado",
        variant: hasSignificantData ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Error al cargar los datos de analytics');
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductosAnalytics = async () => {
    console.log('🚀 [ANALYTICS-PRODUCTOS] fetchProductosAnalytics INICIADA');
    console.log('🔍 [ANALYTICS-PRODUCTOS] Estado antes de fetch:', {
      isLoadingProductos,
      hasProductosData: !!productosData,
      incluirTendencias
    });
    
    setIsLoadingProductos(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        fechaInicio,
        fechaFin,
        ...(sucursalSeleccionada && sucursalSeleccionada !== 'all' && { id_sucursal: sucursalSeleccionada }),
        ...(categoriaSeleccionada && categoriaSeleccionada !== 'all' && { id_categoria: categoriaSeleccionada }),
        ...(productoSeleccionado && productoSeleccionado !== 'all' && { id_producto: productoSeleccionado }),
        ...(rangoPrecioMin && { precio_min: rangoPrecioMin }),
        ...(rangoPrecioMax && { precio_max: rangoPrecioMax }),
        ...(estadoProducto !== 'all' && { estado_producto: estadoProducto }),
        ...(filtroVentas !== 'all' && { filtro_ventas: filtroVentas }),
        ...(filtroIngresos !== 'all' && { filtro_ingresos: filtroIngresos }),
        limit: limiteProductos.toString(),
        orden: ordenProductos,
        direccion: ordenarDireccion,
        incluir_tendencias: incluirTendencias.toString()
      });

      console.log('🔍 [ANALYTICS-PRODUCTOS] Parámetros enviados:', params.toString());
      console.log('🔍 [ANALYTICS-PRODUCTOS] incluir_tendencias específico:', incluirTendencias);
      console.log('🔍 [ANALYTICS-PRODUCTOS] URL completa:', `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/analytics/products/analysis?${params}`);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/analytics/products/analysis?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 [ANALYTICS-PRODUCTOS] Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ANALYTICS-PRODUCTOS] Error del servidor:', errorText);
        throw new Error(`Error al obtener análisis de productos: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 [ANALYTICS-PRODUCTOS] Datos completos recibidos:', JSON.stringify(data, null, 2));
      console.log('🔍 [ANALYTICS-PRODUCTOS] data.data específico:', JSON.stringify(data.data, null, 2));
      console.log('🔍 [ANALYTICS-PRODUCTOS] Estructura detallada:', {
        hasData: !!data.data,
        dataKeys: data.data ? Object.keys(data.data) : [],
        productosCount: data.data?.productos?.length || 0,
        productosFirst3: data.data?.productos?.slice(0, 3) || [],
        categoriasCount: data.data?.categorias?.length || 0,
        categoriasFirst3: data.data?.categorias?.slice(0, 3) || [],
        totalProductos: data.data?.total_productos || 0,
        metricasGenerales: data.data?.metricas_generales || 'no encontradas',
        // ANÁLISIS ESPECÍFICO DE TENDENCIAS
        tendenciasExists: !!data.data?.tendencias,
        tendenciasType: typeof data.data?.tendencias,
        tendenciasLength: data.data?.tendencias?.length || 0,
        tendenciasRaw: data.data?.tendencias,
        allKeys: data.data ? Object.keys(data.data) : []
      });
      
      console.log('🔄 [ANALYTICS-PRODUCTOS] Seteando productosData con:', data.data);
      setProductosData(data.data);
      console.log('✅ [ANALYTICS-PRODUCTOS] productosData seteado exitosamente');

      toast({
        title: "Análisis de Productos Actualizado",
        description: "Los datos de productos se han actualizado correctamente",
      });

    } catch (error) {
      console.error('Error fetching productos analytics:', error);
      setError('Error al cargar los datos de análisis de productos');
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de análisis de productos",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProductos(false);
    }
  };

  useEffect(() => {
    console.log('🔍 [ANALYTICS] useEffect inicial - cargando analytics por primera vez');
    fetchAnalytics();
  }, []);

  // Log cuando cambian los datos de analytics
  useEffect(() => {
    console.log('🔍 [ANALYTICS] analyticsData cambió:', analyticsData);
    if (analyticsData) {
      console.log('🔍 [ANALYTICS] Keys disponibles:', Object.keys(analyticsData));
      console.log('🔍 [ANALYTICS] Tiene métricas_generales:', !!analyticsData.metricas_generales);
      console.log('🔍 [ANALYTICS] ¿Se renderizarán gráficos?', {
        tendenciaDiariaLength: analyticsData.tendencia_diaria?.length || 0,
        distribucionHorariaLength: analyticsData.distribucion_horaria?.length || 0,
        topVendedoresLength: analyticsData.top_vendedores?.length || 0,
        porTipoServicioLength: analyticsData.por_tipo_servicio?.length || 0
      });
    }
  }, [analyticsData]);

  useEffect(() => {
    console.log('🔍 [ANALYTICS] Cambio de pestaña activa:', activeTab);
    if (activeTab === 'products') {
      console.log('🔍 [ANALYTICS] Cargando análisis de productos...');
      fetchProductosAnalytics();
    }
  }, [activeTab]);

  // Log cuando cambian los datos de productos
  useEffect(() => {
    console.log('🔍 [ANALYTICS-PRODUCTOS] productosData cambió:', productosData);
    if (productosData) {
      console.log('🔍 [ANALYTICS-PRODUCTOS] Keys disponibles:', Object.keys(productosData));
      console.log('🔍 [ANALYTICS-PRODUCTOS] Estructura detallada:', {
        metricasGenerales: !!productosData.metricas_generales,
        productos: productosData.productos?.length || 0,
        categorias: productosData.categorias?.length || 0,
        tendencias: productosData.tendencias?.length || 0,
        tendenciasExiste: !!productosData.tendencias,
        incluirTendenciasState: incluirTendencias
      });
    }
  }, [productosData, incluirTendencias]);

  // Función para calcular KPIs automáticamente
  const calculateKPIs = () => {
    if (!analyticsData) return null;

    const metrics = analyticsData.metricas_generales;
    const dailyTrend = analyticsData.tendencia_diaria;
    
    // Calcular crecimiento diario promedio
    const growthRates = dailyTrend.slice(1).map((day, index) => {
      const prevDay = dailyTrend[index];
      return ((day.ingresos_dia - prevDay.ingresos_dia) / prevDay.ingresos_dia) * 100;
    }).filter(rate => !isNaN(rate));
    
    const avgGrowthRate = growthRates.length > 0 
      ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length 
      : 0;

    // Calcular eficiencia de vendedores
    const topVendedor = analyticsData.top_vendedores[0];
    const avgVendedor = analyticsData.top_vendedores.reduce((sum, v) => sum + v.ingresos, 0) / analyticsData.top_vendedores.length;
    const efficiency = topVendedor ? (topVendedor.ingresos / avgVendedor) * 100 : 0;

    // Calcular rotación de productos
    const totalProductos = analyticsData.por_tipo_servicio.reduce((sum, tipo) => sum + tipo.cantidad, 0);
    const topProducto = analyticsData.por_tipo_servicio[0];
    const productRotation = topProducto ? (topProducto.cantidad / totalProductos) * 100 : 0;

    return {
      crecimientoPromedio: avgGrowthRate,
      eficienciaVendedores: efficiency,
      rotacionProductos: productRotation,
      ticketPromedio: metrics.ticket_promedio,
      conversionRate: (metrics.total_ventas / metrics.dias_con_ventas),
      customerRetention: metrics.vendedores_activos > 0 ? (metrics.total_ventas / metrics.vendedores_activos) : 0
    };
  };

  const kpis = calculateKPIs();

  const formatPercentage = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    color = 'blue' 
  }: {
    title: string;
    value: string;
    subtitle?: string;
    icon: any;
    trend?: { value: number; isPositive: boolean };
    color?: 'blue' | 'green' | 'orange' | 'purple';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      purple: 'bg-purple-500'
    };

    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
              {trend && (
                <div className="flex items-center gap-1">
                  {trend.isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(trend.value)}
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-full ${colorClasses[color]}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading && !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Cargando analytics avanzados...</span>
        </div>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Verificar si tiene acceso a analytics avanzados
  if (!checkFeatureAccess('analytics', false)) {
    return (
      <PremiumFeatureGate 
        feature="analytics" 
        requiredPlan="Avanzado"
        showUpgradePrompt={true}
      >
        <div className="space-y-6">
      {/* Header con título y botón de filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Analytics Avanzados de Ventas
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Filtros colapsables */}
        {showFilters && (
          <CardContent>
            <div className="space-y-6">
              {/* Filtros Básicos */}
              <div>
                <h4 className="font-semibold mb-4 text-gray-700">Filtros Básicos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha-inicio">Fecha Inicio</Label>
                    <Input
                      id="fecha-inicio"
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fecha-fin">Fecha Fin</Label>
                    <Input
                      id="fecha-fin"
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sucursal">Sucursal</Label>
                    <Select value={sucursalSeleccionada} onValueChange={setSucursalSeleccionada}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las sucursales" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las sucursales</SelectItem>
                        <SelectItem value="1">Sucursal Principal</SelectItem>
                        <SelectItem value="2">Sucursal Norte</SelectItem>
                        <SelectItem value="3">Sucursal Sur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendedor">Vendedor</Label>
                    <Select value={vendedorSeleccionado} onValueChange={setVendedorSeleccionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los vendedores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los vendedores</SelectItem>
                        <SelectItem value="1">Admin</SelectItem>
                        <SelectItem value="2">Vendedor 1</SelectItem>
                        <SelectItem value="3">Vendedor 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Filtros Avanzados */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4 text-blue-600">Filtros Avanzados</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo-servicio">Tipo de Servicio</Label>
                    <Select value={tipoServicio} onValueChange={setTipoServicio}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        <SelectItem value="Mesa">Mesa</SelectItem>
                        <SelectItem value="Para Llevar">Para Llevar</SelectItem>
                        <SelectItem value="Delivery">Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select value={categoriaSeleccionada} onValueChange={setCategoriaSeleccionada}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las categorías" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {productosData?.categorias?.map((cat) => (
                          <SelectItem key={cat.id_categoria} value={cat.id_categoria.toString()}>
                            {cat.categoria}
                          </SelectItem>
                        )) || []}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="producto">Producto Específico</Label>
                    <Select value={productoSeleccionado} onValueChange={setProductoSeleccionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los productos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los productos</SelectItem>
                        {productosData?.productos?.map((prod) => (
                          <SelectItem key={prod.id_producto} value={prod.id_producto.toString()}>
                            {prod.producto}
                          </SelectItem>
                        )) || []}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado-producto">Estado del Producto</Label>
                    <Select value={estadoProducto} onValueChange={setEstadoProducto}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="activo">Solo activos</SelectItem>
                        <SelectItem value="inactivo">Solo inactivos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="precio-min">Precio Mínimo (Bs)</Label>
                    <Input
                      id="precio-min"
                      type="number"
                      placeholder="0"
                      value={rangoPrecioMin}
                      onChange={(e) => setRangoPrecioMin(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="precio-max">Precio Máximo (Bs)</Label>
                    <Input
                      id="precio-max"
                      type="number"
                      placeholder="1000"
                      value={rangoPrecioMax}
                      onChange={(e) => setRangoPrecioMax(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filtro-ventas">Filtro de Ventas</Label>
                    <Select value={filtroVentas} onValueChange={setFiltroVentas}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los productos</SelectItem>
                        <SelectItem value="vendidos">Solo vendidos</SelectItem>
                        <SelectItem value="no_vendidos">No vendidos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filtro-ingresos">Nivel de Ingresos</Label>
                    <Select value={filtroIngresos} onValueChange={setFiltroIngresos}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los niveles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los niveles</SelectItem>
                        <SelectItem value="alto">Alto (&gt;Bs 500)</SelectItem>
                        <SelectItem value="medio">Medio (Bs 100-500)</SelectItem>
                        <SelectItem value="bajo">Bajo (&lt;Bs 100)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Configuración de Visualización */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4 text-green-600">Configuración de Visualización</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección de Ordenamiento</Label>
                    <Select value={ordenarDireccion} onValueChange={setOrdenarDireccion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Descendente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Descendente (Mayor a Menor)</SelectItem>
                        <SelectItem value="asc">Ascendente (Menor a Mayor)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="limite">Límite de Resultados</Label>
                    <Select value={limiteProductos.toString()} onValueChange={(value) => setLimiteProductos(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="20 resultados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 resultados</SelectItem>
                        <SelectItem value="20">20 resultados</SelectItem>
                        <SelectItem value="50">50 resultados</SelectItem>
                        <SelectItem value="100">100 resultados</SelectItem>
                        <SelectItem value="500">Todos los resultados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Comparar Período</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={compararPeriodo}
                        onCheckedChange={setCompararPeriodo}
                      />
                      <span className="text-sm">Período anterior</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Incluir Tendencias</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={incluirTendencias}
                        onCheckedChange={setIncluirTendencias}
                      />
                      <span className="text-sm">Análisis temporal</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Button onClick={fetchAnalytics} disabled={isLoading} className="flex-1 min-w-[200px]">
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Filter className="h-4 w-4 mr-2" />
                  )}
                  Aplicar Filtros
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFechaInicio(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
                    setFechaFin(format(new Date(), 'yyyy-MM-dd'));
                    setSucursalSeleccionada('all');
                    setVendedorSeleccionado('all');
                    setTipoServicio('all');
                    setCategoriaSeleccionada('all');
                    setProductoSeleccionado('all');
                    setRangoPrecioMin('');
                    setRangoPrecioMax('');
                    setEstadoProducto('all');
                    setFiltroVentas('all');
                    setFiltroIngresos('all');
                    setOrdenarDireccion('desc');
                    setCompararPeriodo(false);
                    setIncluirTendencias(true);
                    setLimiteProductos(20);
                    setOrdenProductos('cantidad');
                  }}
                  className="flex-1 min-w-[150px]"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Limpiar Filtros
                </Button>

                <Button 
                  variant="secondary" 
                  onClick={() => {
                    const config = {
                      fechaInicio,
                      fechaFin,
                      sucursalSeleccionada,
                      vendedorSeleccionado,
                      tipoServicio,
                      categoriaSeleccionada,
                      productoSeleccionado,
                      rangoPrecioMin,
                      rangoPrecioMax,
                      estadoProducto,
                      filtroVentas,
                      filtroIngresos,
                      ordenarDireccion,
                      compararPeriodo,
                      incluirTendencias,
                      limiteProductos,
                      ordenProductos
                    };
                    localStorage.setItem('globalAnalyticsFilters', JSON.stringify(config));
                    toast({
                      title: "Configuración Guardada",
                      description: "Los filtros se han guardado para futuras sesiones",
                    });
                  }}
                  className="flex-1 min-w-[150px]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Config
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {analyticsData && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
            <TabsTrigger value="kpis">🎯 KPIs</TabsTrigger>
            <TabsTrigger value="trends">📈 Tendencias</TabsTrigger>
            <TabsTrigger value="performance">🏆 Rendimiento</TabsTrigger>
            <TabsTrigger value="products">📦 Productos</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Ventas"
                value={analyticsData.metricas_generales.total_ventas.toString()}
                subtitle={`${analyticsData.metricas_generales.dias_con_ventas} días con ventas`}
                icon={ShoppingCart}
                trend={analyticsData.comparacion ? {
                  value: parseFloat(analyticsData.comparacion.variaciones.ventas.porcentual),
                  isPositive: parseFloat(analyticsData.comparacion.variaciones.ventas.porcentual) >= 0
                } : undefined}
                color="blue"
              />
              <MetricCard
                title="Ingresos Totales"
                value={formatCurrency(analyticsData.metricas_generales.ingresos_totales)}
                subtitle="Período seleccionado"
                icon={DollarSign}
                trend={analyticsData.comparacion ? {
                  value: parseFloat(analyticsData.comparacion.variaciones.ingresos.porcentual),
                  isPositive: parseFloat(analyticsData.comparacion.variaciones.ingresos.porcentual) >= 0
                } : undefined}
                color="green"
              />
              <MetricCard
                title="Ticket Promedio"
                value={formatCurrency(analyticsData.metricas_generales.ticket_promedio)}
                subtitle={`Rango: ${formatCurrency(analyticsData.metricas_generales.venta_minima)} - ${formatCurrency(analyticsData.metricas_generales.venta_maxima)}`}
                icon={Target}
                color="orange"
              />
              <MetricCard
                title="Vendedores Activos"
                value={analyticsData.metricas_generales.vendedores_activos.toString()}
                subtitle={`${analyticsData.metricas_generales.sucursales_activas} sucursales`}
                icon={Users}
                color="purple"
              />
            </div>

            {/* Comparación de período si está habilitada */}
            {analyticsData.comparacion && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Comparación con Período Anterior
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Ventas</h4>
                      <div className="flex items-center justify-between">
                        <span>Período actual:</span>
                        <Badge variant="secondary">
                          {analyticsData.metricas_generales.total_ventas} ventas
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Período anterior:</span>
                        <Badge variant="outline">
                          {analyticsData.comparacion.periodo_anterior.total_ventas} ventas
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Variación:</span>
                        <Badge variant={
                          parseFloat(analyticsData.comparacion.variaciones.ventas.porcentual) >= 0 
                            ? "default" : "destructive"
                        }>
                          {formatPercentage(analyticsData.comparacion.variaciones.ventas.porcentual)}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold">Ingresos</h4>
                      <div className="flex items-center justify-between">
                        <span>Período actual:</span>
                        <Badge variant="secondary">
                          {formatCurrency(analyticsData.metricas_generales.ingresos_totales)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Período anterior:</span>
                        <Badge variant="outline">
                          {formatCurrency(analyticsData.comparacion.periodo_anterior.ingresos_totales)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Variación:</span>
                        <Badge variant={
                          parseFloat(analyticsData.comparacion.variaciones.ingresos.porcentual) >= 0 
                            ? "default" : "destructive"
                        }>
                          {formatPercentage(analyticsData.comparacion.variaciones.ingresos.porcentual)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Distribución por tipo de servicio */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por Tipo de Servicio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={analyticsData.por_tipo_servicio}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="cantidad"
                          label={({ tipo_servicio, porcentaje }) => `${tipo_servicio}: ${porcentaje}%`}
                        >
                          {analyticsData.por_tipo_servicio.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Ventas']} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Vendedores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.top_vendedores.slice(0, 5).map((vendedor, index) => (
                      <div key={vendedor.id_vendedor} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{vendedor.nombre_vendedor}</p>
                            <p className="text-sm text-muted-foreground">
                              {vendedor.ventas} ventas
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(vendedor.ingresos)}</p>
                          <p className="text-sm text-muted-foreground">
                            Promedio: {formatCurrency(vendedor.promedio_venta)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="kpis" className="space-y-6">
            {/* KPIs Calculados */}
            {kpis && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Crecimiento Promedio</p>
                        <p className="text-2xl font-bold text-green-800">
                          {kpis.crecimientoPromedio >= 0 ? '+' : ''}{kpis.crecimientoPromedio.toFixed(1)}%
                        </p>
                        <p className="text-xs text-green-600">Diario</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Eficiencia Vendedores</p>
                        <p className="text-2xl font-bold text-blue-800">
                          {kpis.eficienciaVendedores.toFixed(0)}%
                        </p>
                        <p className="text-xs text-blue-600">Top vs Promedio</p>
                      </div>
                      <Award className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600">Rotación Productos</p>
                        <p className="text-2xl font-bold text-purple-800">
                          {kpis.rotacionProductos.toFixed(1)}%
                        </p>
                        <p className="text-xs text-purple-600">Producto Top</p>
                      </div>
                      <Package className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600">Tasa Conversión</p>
                        <p className="text-2xl font-bold text-orange-800">
                          {kpis.conversionRate.toFixed(1)}
                        </p>
                        <p className="text-xs text-orange-600">Ventas/Día</p>
                      </div>
                      <Target className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-indigo-200 bg-indigo-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-indigo-600">Retención Clientes</p>
                        <p className="text-2xl font-bold text-indigo-800">
                          {kpis.customerRetention.toFixed(1)}
                        </p>
                        <p className="text-xs text-indigo-600">Ventas/Vendedor</p>
                      </div>
                      <Users className="h-8 w-8 text-indigo-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-pink-200 bg-pink-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-pink-600">Ticket Promedio</p>
                        <p className="text-2xl font-bold text-pink-800">
                          {formatCurrency(kpis.ticketPromedio)}
                        </p>
                        <p className="text-xs text-pink-600">Por transacción</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-pink-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Gráfica de KPIs en tiempo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Evolución de KPIs Clave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={analyticsData.tendencia_diaria}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="ventas_dia"
                        stroke="#8884d8"
                        name="Ventas Diarias"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="ingresos_dia"
                        stroke="#82ca9d"
                        name="Ingresos Diarios (Bs)"
                        strokeWidth={2}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Tendencia diaria */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Ventas Diarias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={analyticsData.tendencia_diaria}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="ventas_dia"
                        stroke="#8884d8"
                        name="Ventas"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="ingresos_dia"
                        stroke="#82ca9d"
                        name="Ingresos (Bs)"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Distribución horaria */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Ventas por Hora</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={analyticsData.distribucion_horaria}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hora" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ventas_hora" fill="#8884d8" name="Ventas" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento de Vendedores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={analyticsData.top_vendedores}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre_vendedor" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ingresos" fill="#8884d8" name="Ingresos (Bs)" />
                      <Bar dataKey="ventas" fill="#82ca9d" name="Número de Ventas" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            {/* Configuración específica para productos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-6 w-6" />
                  Configuración de Análisis de Productos
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configuraciones específicas para la visualización de productos
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="orden-productos">Ordenar por</Label>
                    <Select value={ordenProductos} onValueChange={setOrdenProductos}>
                      <SelectTrigger>
                        <SelectValue placeholder="Cantidad vendida" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cantidad">Cantidad vendida</SelectItem>
                        <SelectItem value="ingresos">Ingresos totales</SelectItem>
                        <SelectItem value="frecuencia">Frecuencia de ventas</SelectItem>
                        <SelectItem value="ticket">Ticket promedio</SelectItem>
                        <SelectItem value="diario">Promedio diario</SelectItem>
                        <SelectItem value="precio">Precio del producto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="limite-productos">Límite de productos</Label>
                    <Select value={limiteProductos.toString()} onValueChange={(value) => setLimiteProductos(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="20 productos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 productos</SelectItem>
                        <SelectItem value="10">10 productos</SelectItem>
                        <SelectItem value="20">20 productos</SelectItem>
                        <SelectItem value="50">50 productos</SelectItem>
                        <SelectItem value="100">100 productos</SelectItem>
                        <SelectItem value="500">Todos los productos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Opciones adicionales</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={incluirTendencias}
                          onCheckedChange={setIncluirTendencias}
                        />
                        <span className="text-sm">Mostrar tendencias</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button onClick={fetchProductosAnalytics} disabled={isLoadingProductos} className="w-full">
                      {isLoadingProductos ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Actualizar Productos
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isLoadingProductos && !productosData ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span>Cargando análisis de productos...</span>
                </div>
              </div>
            ) : productosData ? (
              <>
                {/* Métricas generales de productos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Productos</p>
                          <p className="text-2xl font-bold text-blue-800">
                            {productosData.metricas_generales?.total_productos || 0}
                          </p>
                          <p className="text-xs text-blue-600">
                            {productosData.metricas_generales?.productos_vendidos || 0} vendidos
                          </p>
                        </div>
                        <Package className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Categorías Activas</p>
                          <p className="text-2xl font-bold text-green-800">
                            {productosData.metricas_generales?.total_categorias || 0}
                          </p>
                          <p className="text-xs text-green-600">Categorías con ventas</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Cantidad Total</p>
                          <p className="text-2xl font-bold text-orange-800">
                            {productosData.metricas_generales?.cantidad_total_vendida || 0}
                          </p>
                          <p className="text-xs text-orange-600">Unidades vendidas</p>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Precio Promedio</p>
                          <p className="text-2xl font-bold text-purple-800">
                            {formatCurrency(productosData.metricas_generales?.precio_promedio_general || 0)}
                          </p>
                          <p className="text-xs text-purple-600">Por producto</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Análisis por categorías */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Análisis por Categorías
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Rendimiento por Categoría</h4>
                        <div className="space-y-3">
                          {productosData.categorias?.slice(0, 5).map((categoria, index) => (
                            <div key={categoria.id_categoria} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                                  {index + 1}
                                </Badge>
                                <div>
                                  <p className="font-medium">{categoria.categoria}</p>
                                  <p className="text-sm text-gray-600">
                                    {categoria.productos_vendidos}/{categoria.productos_totales} productos
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{formatCurrency(categoria.ingresos_totales)}</p>
                                <p className="text-sm text-gray-600">
                                  {categoria.porcentaje_ingresos}% del total
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold">Distribución de Ingresos</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={(productosData.categorias?.slice(0, 6) || []).map(cat => ({
                                  ...cat,
                                  ingresos_totales: typeof cat.ingresos_totales === 'string' ? parseFloat(cat.ingresos_totales) : cat.ingresos_totales
                                }))}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="ingresos_totales"
                                label={({ categoria, porcentaje_ingresos }) => `${categoria}: ${porcentaje_ingresos}%`}
                              >
                                {(productosData.categorias?.slice(0, 6) || []).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [formatTooltipValue(value), 'Ingresos']} />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                          
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top productos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Top Productos - {ordenProductos === 'cantidad' ? 'Por Cantidad' : 
                                       ordenProductos === 'ingresos' ? 'Por Ingresos' :
                                       ordenProductos === 'frecuencia' ? 'Por Frecuencia' :
                                       ordenProductos === 'ticket' ? 'Por Ticket Promedio' : 'Por Promedio Diario'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(productosData.productos?.slice(0, 10) || []).map((producto, index) => (
                        <div key={producto.id_producto} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold">
                              {index + 1}
                            </Badge>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{producto.producto}</h4>
                                <Badge variant="secondary">{producto.categoria}</Badge>
                                {!producto.activo && <Badge variant="destructive">Inactivo</Badge>}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Cantidad:</span> {producto.cantidad_vendida_final}
                                </div>
                                <div>
                                  <span className="font-medium">Ingresos:</span> {formatCurrency(producto.ingresos_totales_final)}
                                </div>
                                <div>
                                  <span className="font-medium">Frecuencia:</span> {producto.ventas_asociadas_final} ventas
                                </div>
                                <div>
                                  <span className="font-medium">Promedio:</span> {formatCurrency(producto.ticket_promedio_producto)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="space-y-1">
                              <div className="text-2xl font-bold text-green-600">
                                {ordenProductos === 'cantidad' ? producto.cantidad_vendida_final :
                                 ordenProductos === 'ingresos' ? formatCurrency(producto.ingresos_totales_final) :
                                 ordenProductos === 'frecuencia' ? producto.ventas_asociadas_final :
                                 ordenProductos === 'ticket' ? formatCurrency(producto.ticket_promedio_producto) :
                                 producto.promedio_diario.toFixed(1)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {ordenProductos === 'cantidad' ? 'unidades' :
                                 ordenProductos === 'ingresos' ? 'total' :
                                 ordenProductos === 'frecuencia' ? 'ventas' :
                                 ordenProductos === 'ticket' ? 'promedio' : 'por día'}
                              </div>
                              <div className="text-xs text-gray-400">
                                {producto.porcentaje_cantidad}% del total
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Tendencias de productos (si están habilitadas) */}
                {incluirTendencias && productosData.tendencias && productosData.tendencias.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Tendencias de Productos Top
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsLineChart data={productosData.tendencias}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="fecha_venta" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="cantidad_dia"
                              stroke="#8884d8"
                              name="Cantidad por día"
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="ingresos_dia"
                              stroke="#82ca9d"
                              name="Ingresos por día (Bs)"
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Alert>
                <Package className="h-4 w-4" />
                <AlertDescription>
                  No se pudieron cargar los datos de análisis de productos. Verifica la conexión y vuelve a intentar.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      )}
        </div>
      </PremiumFeatureGate>
    );
  }

  // Log del estado actual antes del render
  console.log('🔍 [ANALYTICS] Renderizando componente principal');
  console.log('🔍 [ANALYTICS] Estado actual:', {
    hasAnalyticsData: !!analyticsData,
    isLoading,
    error,
    activeTab,
    checkFeatureResult: checkFeatureAccess('analytics', false)
  });

  // Retornar el contenido COMPLETO con todas las pestañas
  return (
    <div className="space-y-6">
      {/* Header con título y botón de filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Analytics Avanzados de Ventas
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchAnalytics}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
          <CardDescription>
            Análisis profundo de ventas, productos y tendencias de tu restaurante
          </CardDescription>
        </CardHeader>

        {/* Filtros avanzados desplegables */}
        {showFilters && (
          <CardContent>
            <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
              {/* Filtros principales */}
              <div>
                <h4 className="font-semibold mb-4 text-gray-700">Filtros Básicos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha-inicio">Fecha Inicio</Label>
                    <Input
                      id="fecha-inicio"
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha-fin">Fecha Fin</Label>
                    <Input
                      id="fecha-fin"
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sucursal">Sucursal</Label>
                    <Select value={sucursalSeleccionada} onValueChange={setSucursalSeleccionada}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las sucursales" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las sucursales</SelectItem>
                        <SelectItem value="1">Sucursal Principal</SelectItem>
                        <SelectItem value="2">Sucursal Norte</SelectItem>
                        <SelectItem value="3">Sucursal Sur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendedor">Vendedor</Label>
                    <Select value={vendedorSeleccionado} onValueChange={setVendedorSeleccionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los vendedores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los vendedores</SelectItem>
                        <SelectItem value="1">Admin</SelectItem>
                        <SelectItem value="2">Vendedor 1</SelectItem>
                        <SelectItem value="3">Vendedor 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Filtros Avanzados */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4 text-blue-600">Filtros Avanzados</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo-servicio">Tipo de Servicio</Label>
                    <Select value={tipoServicio} onValueChange={setTipoServicio}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        <SelectItem value="Mesa">Mesa</SelectItem>
                        <SelectItem value="Para Llevar">Para Llevar</SelectItem>
                        <SelectItem value="Delivery">Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select value={categoriaSeleccionada} onValueChange={setCategoriaSeleccionada}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las categorías" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {productosData?.categorias?.map((cat) => (
                          <SelectItem key={cat.id_categoria} value={cat.id_categoria.toString()}>
                            {cat.categoria}
                          </SelectItem>
                        )) || []}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="producto">Producto Específico</Label>
                    <Select value={productoSeleccionado} onValueChange={setProductoSeleccionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los productos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los productos</SelectItem>
                        {productosData?.productos?.map((prod) => (
                          <SelectItem key={prod.id_producto} value={prod.id_producto.toString()}>
                            {prod.producto}
                          </SelectItem>
                        )) || []}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado-producto">Estado del Producto</Label>
                    <Select value={estadoProducto} onValueChange={setEstadoProducto}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="activo">Solo activos</SelectItem>
                        <SelectItem value="inactivo">Solo inactivos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="precio-min">Precio Mínimo (Bs)</Label>
                    <Input
                      id="precio-min"
                      type="number"
                      placeholder="0"
                      value={rangoPrecioMin}
                      onChange={(e) => setRangoPrecioMin(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="precio-max">Precio Máximo (Bs)</Label>
                    <Input
                      id="precio-max"
                      type="number"
                      placeholder="1000"
                      value={rangoPrecioMax}
                      onChange={(e) => setRangoPrecioMax(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filtro-ventas">Filtro de Ventas</Label>
                    <Select value={filtroVentas} onValueChange={setFiltroVentas}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los productos</SelectItem>
                        <SelectItem value="vendidos">Solo vendidos</SelectItem>
                        <SelectItem value="no_vendidos">No vendidos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filtro-ingresos">Nivel de Ingresos</Label>
                    <Select value={filtroIngresos} onValueChange={setFiltroIngresos}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los niveles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los niveles</SelectItem>
                        <SelectItem value="alto">Alto (&gt;Bs 500)</SelectItem>
                        <SelectItem value="medio">Medio (Bs 100-500)</SelectItem>
                        <SelectItem value="bajo">Bajo (&lt;Bs 100)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Configuración de Visualización */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4 text-green-600">Configuración de Visualización</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="limite">Límite de Resultados</Label>
                    <Select value={limiteProductos.toString()} onValueChange={(value) => setLimiteProductos(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="20 resultados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 resultados</SelectItem>
                        <SelectItem value="20">20 resultados</SelectItem>
                        <SelectItem value="50">50 resultados</SelectItem>
                        <SelectItem value="100">100 resultados</SelectItem>
                        <SelectItem value="500">Todos los resultados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Comparar Período</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={compararPeriodo}
                        onCheckedChange={setCompararPeriodo}
                      />
                      <Label htmlFor="comparar-periodo">Incluir período anterior</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Incluir Tendencias</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={incluirTendencias}
                        onCheckedChange={setIncluirTendencias}
                      />
                      <Label htmlFor="incluir-tendencias">Mostrar gráficos de tendencias</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Button onClick={fetchAnalytics} disabled={isLoading} className="flex-1 min-w-[200px]">
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Filter className="h-4 w-4 mr-2" />
                  )}
                  Aplicar Filtros
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFechaInicio(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
                    setFechaFin(format(new Date(), 'yyyy-MM-dd'));
                    setSucursalSeleccionada('all');
                    setVendedorSeleccionado('all');
                    setTipoServicio('all');
                    setCategoriaSeleccionada('all');
                    setProductoSeleccionado('all');
                    setRangoPrecioMin('');
                    setRangoPrecioMax('');
                    setEstadoProducto('all');
                    setFiltroVentas('all');
                    setFiltroIngresos('all');
                    setLimiteProductos(20);
                    setCompararPeriodo(false);
                    setIncluirTendencias(true);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetear Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Sistema completo de pestañas */}
      {analyticsData && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
            <TabsTrigger value="kpis">🎯 KPIs</TabsTrigger>
            <TabsTrigger value="trends">📈 Tendencias</TabsTrigger>
            <TabsTrigger value="performance">🏆 Rendimiento</TabsTrigger>
            <TabsTrigger value="products">📦 Productos</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Ventas"
                value={analyticsData.metricas_generales.total_ventas.toString()}
                subtitle={`${analyticsData.metricas_generales.dias_con_ventas} días con ventas`}
                icon={ShoppingCart}
                trend={analyticsData.comparacion ? {
                  value: parseFloat(analyticsData.comparacion.variaciones.ventas.porcentual),
                  isPositive: parseFloat(analyticsData.comparacion.variaciones.ventas.porcentual) >= 0
                } : undefined}
                color="blue"
              />
              <MetricCard
                title="Ingresos Totales"
                value={formatCurrency(analyticsData.metricas_generales.ingresos_totales)}
                subtitle="Período seleccionado"
                icon={DollarSign}
                trend={analyticsData.comparacion ? {
                  value: parseFloat(analyticsData.comparacion.variaciones.ingresos.porcentual),
                  isPositive: parseFloat(analyticsData.comparacion.variaciones.ingresos.porcentual) >= 0
                } : undefined}
                color="green"
              />
              <MetricCard
                title="Ticket Promedio"
                value={formatCurrency(analyticsData.metricas_generales.ticket_promedio)}
                subtitle={`Rango: ${formatCurrency(analyticsData.metricas_generales.venta_minima)} - ${formatCurrency(analyticsData.metricas_generales.venta_maxima)}`}
                icon={Target}
                color="orange"
              />
              <MetricCard
                title="Vendedores Activos"
                value={analyticsData.metricas_generales.vendedores_activos.toString()}
                subtitle={`${analyticsData.metricas_generales.sucursales_activas} sucursales`}
                icon={Users}
                color="purple"
              />
            </div>

            {/* Comparación con período anterior */}
            {analyticsData.comparacion && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Comparación: Ventas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Período anterior:</span>
                        <Badge variant="secondary">
                          {analyticsData.comparacion.periodo_anterior.total_ventas} ventas
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Período actual:</span>
                        <Badge variant="secondary">
                          {analyticsData.metricas_generales.total_ventas} ventas
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Variación:</span>
                        <Badge variant={parseFloat(analyticsData.comparacion.variaciones.ventas.porcentual) >= 0 ? "default" : "destructive"}>
                          {analyticsData.comparacion.variaciones.ventas.porcentual}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Comparación: Ingresos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Período anterior:</span>
                        <Badge variant="secondary">
                          {formatCurrency(analyticsData.comparacion.periodo_anterior.ingresos_totales)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Período actual:</span>
                        <Badge variant="secondary">
                          {formatCurrency(analyticsData.metricas_generales.ingresos_totales)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Variación:</span>
                        <Badge variant={parseFloat(analyticsData.comparacion.variaciones.ingresos.porcentual) >= 0 ? "default" : "destructive"}>
                          {analyticsData.comparacion.variaciones.ingresos.porcentual}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Gráficos principales en Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de pie */}
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por Tipo de Servicio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={analyticsData.por_tipo_servicio}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="cantidad"
                          label={({ tipo_servicio, porcentaje }) => `${tipo_servicio}: ${porcentaje}%`}
                        >
                          {analyticsData.por_tipo_servicio.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Ventas']} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Vendedores */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Vendedores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.top_vendedores.slice(0, 5).map((vendedor, index) => (
                      <div key={vendedor.id_vendedor} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{vendedor.nombre_vendedor}</p>
                            <p className="text-sm text-gray-500">{vendedor.ventas} ventas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(vendedor.ingresos)}</p>
                          <p className="text-sm text-gray-500">Promedio: {formatCurrency(vendedor.promedio_venta)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="kpis" className="space-y-6">
            {/* KPIs Calculados */}
            {kpis && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Crecimiento Promedio</p>
                        <p className="text-2xl font-bold text-green-800">
                          {kpis.crecimientoPromedio >= 0 ? '+' : ''}{kpis.crecimientoPromedio.toFixed(1)}%
                        </p>
                        <p className="text-xs text-green-600">Diario</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Eficiencia Vendedores</p>
                        <p className="text-2xl font-bold text-blue-800">
                          {kpis.eficienciaVendedores.toFixed(0)}%
                        </p>
                        <p className="text-xs text-blue-600">Top vs Promedio</p>
                      </div>
                      <Award className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600">Rotación Productos</p>
                        <p className="text-2xl font-bold text-purple-800">
                          {kpis.rotacionProductos.toFixed(1)}%
                        </p>
                        <p className="text-xs text-purple-600">Producto Top</p>
                      </div>
                      <Package className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600">Tasa Conversión</p>
                        <p className="text-2xl font-bold text-orange-800">
                          {kpis.conversionRate.toFixed(1)}
                        </p>
                        <p className="text-xs text-orange-600">Ventas/Día</p>
                      </div>
                      <Target className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-indigo-200 bg-indigo-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-indigo-600">Retención Clientes</p>
                        <p className="text-2xl font-bold text-indigo-800">
                          {kpis.customerRetention.toFixed(1)}
                        </p>
                        <p className="text-xs text-indigo-600">Ventas/Vendedor</p>
                      </div>
                      <Users className="h-8 w-8 text-indigo-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-pink-200 bg-pink-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-pink-600">Ticket Promedio</p>
                        <p className="text-2xl font-bold text-pink-800">
                          {formatCurrency(kpis.ticketPromedio)}
                        </p>
                        <p className="text-xs text-pink-600">Por transacción</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-pink-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Gráfica de KPIs en tiempo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Evolución de KPIs Clave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={analyticsData.tendencia_diaria}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="ventas_dia"
                        stroke="#8884d8"
                        name="Ventas Diarias"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="ingresos_dia"
                        stroke="#82ca9d"
                        name="Ingresos Diarios (Bs)"
                        strokeWidth={2}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Tendencia diaria */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Ventas Diarias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={analyticsData.tendencia_diaria}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="ventas_dia"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="Ventas Diarias"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="ingresos_dia"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        name="Ingresos Diarios (Bs)"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Distribución horaria */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Ventas por Hora</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={analyticsData.distribucion_horaria}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hora" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ventas_hora" fill="#8884d8" name="Ventas" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento de Vendedores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={analyticsData.top_vendedores}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre_vendedor" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ingresos" fill="#8884d8" name="Ingresos (Bs)" />
                      <Bar dataKey="ventas" fill="#82ca9d" name="Número de Ventas" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            {/* Mensaje de carga de productos */}
            {isLoadingProductos && !productosData ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span>Cargando análisis de productos...</span>
                </div>
              </div>
            ) : productosData ? (
              <>
                {/* Métricas generales de productos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Productos</p>
                          <p className="text-2xl font-bold text-blue-800">
                            {productosData.metricas_generales?.total_productos || 0}
                          </p>
                          <p className="text-xs text-blue-600">
                            {productosData.metricas_generales?.productos_vendidos || 0} vendidos
                          </p>
                        </div>
                        <Package className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Categorías Activas</p>
                          <p className="text-2xl font-bold text-green-800">
                            {productosData.metricas_generales?.total_categorias || 0}
                          </p>
                          <p className="text-xs text-green-600">Categorías con ventas</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Cantidad Total</p>
                          <p className="text-2xl font-bold text-orange-800">
                            {productosData.metricas_generales?.cantidad_total_vendida || 0}
                          </p>
                          <p className="text-xs text-orange-600">Unidades vendidas</p>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Precio Promedio</p>
                          <p className="text-2xl font-bold text-purple-800">
                            {formatCurrency(productosData.metricas_generales?.precio_promedio_general || 0)}
                          </p>
                          <p className="text-xs text-purple-600">Por producto</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Análisis por categorías */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Análisis por Categorías
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Rendimiento por Categoría</h4>
                        <div className="space-y-3">
                          {productosData.categorias?.slice(0, 5).map((categoria, index) => (
                            <div key={categoria.id_categoria} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                                  {index + 1}
                                </Badge>
                                <div>
                                  <p className="font-medium">{categoria.categoria}</p>
                                  <p className="text-sm text-gray-600">
                                    {categoria.productos_vendidos}/{categoria.productos_totales} productos
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{formatCurrency(categoria.ingresos_totales)}</p>
                                <p className="text-sm text-gray-600">
                                  {categoria.porcentaje_ingresos}% del total
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold">Distribución de Ingresos</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={(productosData.categorias?.slice(0, 6) || []).map(cat => ({
                                  ...cat,
                                  ingresos_totales: typeof cat.ingresos_totales === 'string' ? parseFloat(cat.ingresos_totales) : cat.ingresos_totales
                                }))}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="ingresos_totales"
                                label={({ categoria, porcentaje_ingresos }) => `${categoria}: ${porcentaje_ingresos}%`}
                              >
                                {(productosData.categorias?.slice(0, 6) || []).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [formatTooltipValue(value), 'Ingresos']} />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top productos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Top Productos - {ordenProductos === 'cantidad' ? 'Por Cantidad' : 
                                       ordenProductos === 'ingresos' ? 'Por Ingresos' :
                                       ordenProductos === 'frecuencia' ? 'Por Frecuencia' :
                                       ordenProductos === 'ticket' ? 'Por Ticket Promedio' : 'Por Promedio Diario'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(productosData.productos?.slice(0, 10) || []).map((producto, index) => (
                        <div key={producto.id_producto} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold">
                              {index + 1}
                            </Badge>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{producto.producto}</h4>
                                <Badge variant="secondary">{producto.categoria}</Badge>
                                {!producto.activo && <Badge variant="destructive">Inactivo</Badge>}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Cantidad:</span> {producto.cantidad_vendida_final}
                                </div>
                                <div>
                                  <span className="font-medium">Ingresos:</span> {formatCurrency(producto.ingresos_totales_final)}
                                </div>
                                <div>
                                  <span className="font-medium">Frecuencia:</span> {producto.ventas_asociadas_final} ventas
                                </div>
                                <div>
                                  <span className="font-medium">Promedio:</span> {formatCurrency(producto.ticket_promedio_producto)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="space-y-1">
                              <div className="text-2xl font-bold text-green-600">
                                {ordenProductos === 'cantidad' ? producto.cantidad_vendida_final :
                                 ordenProductos === 'ingresos' ? formatCurrency(producto.ingresos_totales_final) :
                                 ordenProductos === 'frecuencia' ? producto.ventas_asociadas_final :
                                 ordenProductos === 'ticket' ? formatCurrency(producto.ticket_promedio_producto) :
                                 producto.promedio_diario.toFixed(1)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {ordenProductos === 'cantidad' ? 'unidades' :
                                 ordenProductos === 'ingresos' ? 'total' :
                                 ordenProductos === 'frecuencia' ? 'ventas' :
                                 ordenProductos === 'ticket' ? 'promedio' : 'por día'}
                              </div>
                              <div className="text-xs text-gray-400">
                                {producto.porcentaje_cantidad}% del total
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Tendencias de productos (si están habilitadas) */}
                {(() => {
                  console.log('🔍 [TENDENCIAS] Evaluando condiciones para mostrar tendencias:');
                  console.log('  - incluirTendencias:', incluirTendencias);
                  console.log('  - productosData existe:', !!productosData);
                  console.log('  - productosData.tendencias existe:', !!productosData?.tendencias);
                  console.log('  - productosData.tendencias.length:', productosData?.tendencias?.length || 0);
                  console.log('  - productosData completo:', productosData);
                  return null;
                })()}
                {incluirTendencias && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Tendencias de Productos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const hasTendencias = productosData?.tendencias && productosData.tendencias.length > 0;
                        console.log('🔍 [TENDENCIAS] ¿Tiene tendencias?', hasTendencias);
                        console.log('🔍 [TENDENCIAS] Datos de tendencias:', productosData?.tendencias);
                        return null;
                      })()}
                      {productosData?.tendencias && productosData.tendencias.length > 0 ? (
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsLineChart data={productosData.tendencias}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="fecha_venta" />
                              <YAxis yAxisId="left" />
                              <YAxis yAxisId="right" orientation="right" />
                              <Tooltip />
                              <Legend />
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="cantidad_vendida"
                                stroke="#8884d8"
                                strokeWidth={2}
                                name="Cantidad vendida"
                              />
                              <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="ingresos_por_dia"
                                stroke="#82ca9d"
                                name="Ingresos por día (Bs)"
                              />
                            </RechartsLineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">No hay datos de tendencias disponibles</p>
                          <p className="text-gray-400 text-sm">Los datos de tendencias se generan cuando hay suficiente historial de ventas</p>
                          <Button onClick={fetchProductosAnalytics} className="mt-4" variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Recargar Datos
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No hay datos de productos disponibles</p>
                  <div className="space-y-4 mt-6">
                    <Button onClick={fetchProductosAnalytics} className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Cargar Análisis de Productos
                    </Button>
                    <Button 
                      onClick={() => {
                        console.log('🔍 [DEBUG] Forzando carga con tendencias');
                        setIncluirTendencias(true);
                        setTimeout(() => {
                          fetchProductosAnalytics();
                        }, 100);
                      }} 
                      variant="outline"
                      className="w-full"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Forzar Carga con Tendencias
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
