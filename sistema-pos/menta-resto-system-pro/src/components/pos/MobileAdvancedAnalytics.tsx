import React, { useState, useEffect } from 'react';
import { usePlanSystem } from '@/context/PlanSystemContext';
import { PremiumFeatureGate } from '@/components/plans/PremiumFeatureGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Activity,
  Target,
  Zap,
  Award,
  Clock,
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface AdvancedAnalyticsProps {
  userRole: string;
}

// Función para formatear moneda
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB'
  }).format(amount);
};

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function MobileAdvancedAnalytics({ userRole }: AdvancedAnalyticsProps) {
  console.log('🚀 [MOBILE-ADVANCED-ANALYTICS] Componente iniciado con userRole:', userRole);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { hasFeature } = usePlanSystem();

  // Filtros simplificados para móvil
  const [fechaInicio, setFechaInicio] = useState(
    format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showFilters, setShowFilters] = useState(false);

  // Datos mock para demostración
  const mockData = {
    total_ventas: 156,
    ingresos_totales: 12500.50,
    ticket_promedio: 80.13,
    vendedores_activos: 4,
    crecimiento_ventas: 12.5,
    crecimiento_ingresos: 8.3
  };

  // Componente de tarjeta métrica optimizada para móvil
  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = 'blue',
    trend 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    trend?: number;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    };

    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{title}</p>
              <p className="text-lg font-bold">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
              {trend !== undefined && (
                <div className="flex items-center gap-1">
                  {trend >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trend >= 0 ? '+' : ''}{trend}%
                  </span>
                </div>
              )}
            </div>
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Datos mock para gráficos
  const dailyData = [
    { fecha: '2024-01-01', ventas: 12, ingresos: 1200 },
    { fecha: '2024-01-02', ventas: 15, ingresos: 1500 },
    { fecha: '2024-01-03', ventas: 18, ingresos: 1800 },
    { fecha: '2024-01-04', ventas: 14, ingresos: 1400 },
    { fecha: '2024-01-05', ventas: 20, ingresos: 2000 },
    { fecha: '2024-01-06', ventas: 16, ingresos: 1600 },
    { fecha: '2024-01-07', ventas: 22, ingresos: 2200 }
  ];

  const topVendedores = [
    { nombre: 'María González', ventas: 45, ingresos: 3600 },
    { nombre: 'Carlos López', ventas: 38, ingresos: 3040 },
    { nombre: 'Ana Martínez', ventas: 32, ingresos: 2560 },
    { nombre: 'Luis Rodríguez', ventas: 28, ingresos: 2240 }
  ];

  const ventasPorTipo = [
    { tipo: 'Comedor', cantidad: 65, porcentaje: 42 },
    { tipo: 'Delivery', cantidad: 45, porcentaje: 29 },
    { tipo: 'Para llevar', cantidad: 30, porcentaje: 19 },
    { tipo: 'Eventos', cantidad: 16, porcentaje: 10 }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="text-sm">Cargando analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Verificar si tiene acceso a analytics avanzados
  if (!hasFeature('analytics')) {
    return (
      <PremiumFeatureGate 
        feature="analytics" 
        requiredPlan="Avanzado"
        showUpgradePrompt={true}
      >
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h3 className="text-lg font-semibold mb-2">Analytics Avanzados</h3>
              <p className="text-sm text-gray-600">Plan Avanzado requerido</p>
            </CardContent>
          </Card>
        </div>
      </PremiumFeatureGate>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con filtros */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </CardTitle>
            <Button 
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>
          </div>
        </CardHeader>
        
        {/* Filtros colapsables */}
        {showFilters && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="fecha-inicio" className="text-xs">Desde</Label>
                  <Input
                    id="fecha-inicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha-fin" className="text-xs">Hasta</Label>
                  <Input
                    id="fecha-fin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              <Button 
                onClick={() => {
                  toast({
                    title: "Filtros aplicados",
                    description: "Los datos se han actualizado",
                  });
                }}
                className="w-full"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tabs de navegación */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
          <TabsTrigger value="ventas" className="text-xs">Ventas</TabsTrigger>
          <TabsTrigger value="productos" className="text-xs">Productos</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Métricas principales */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              title="Total Ventas"
              value={mockData.total_ventas}
              icon={ShoppingCart}
              color="blue"
              trend={mockData.crecimiento_ventas}
            />
            <MetricCard
              title="Ingresos"
              value={formatCurrency(mockData.ingresos_totales)}
              icon={DollarSign}
              color="green"
              trend={mockData.crecimiento_ingresos}
            />
            <MetricCard
              title="Ticket Promedio"
              value={formatCurrency(mockData.ticket_promedio)}
              icon={Target}
              color="purple"
            />
            <MetricCard
              title="Vendedores"
              value={mockData.vendedores_activos}
              icon={Users}
              color="orange"
            />
          </div>

          {/* Gráfico de tendencias */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tendencias de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="fecha" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: es })}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'ventas' ? value : formatCurrency(value),
                        name === 'ventas' ? 'Ventas' : 'Ingresos'
                      ]}
                      labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: es })}
                    />
                    <LineChart 
                      type="monotone" 
                      dataKey="ventas" 
                      stroke="#0088FE" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Vendedores */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top Vendedores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topVendedores.map((vendedor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{vendedor.nombre}</p>
                        <p className="text-xs text-gray-500">{vendedor.ventas} ventas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(vendedor.ingresos)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ventas Tab */}
        <TabsContent value="ventas" className="space-y-4">
          {/* Distribución por tipo de servicio */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ventas por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ventasPorTipo.map((tipo, index) => (
                  <div key={tipo.tipo} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{tipo.tipo}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{tipo.cantidad}</span>
                        <Badge variant="outline" className="text-xs">
                          {tipo.porcentaje}%
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={tipo.porcentaje} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de barras */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ventas Diarias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="fecha" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: es })}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [value, 'Ventas']}
                      labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: es })}
                    />
                    <Bar dataKey="ventas" fill="#8884d8" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Productos Tab */}
        <TabsContent value="productos" className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Análisis de Productos</h3>
              <p className="text-sm text-gray-600">Funcionalidad en desarrollo</p>
              <Button variant="outline" size="sm" className="mt-4" disabled>
                Próximamente
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
