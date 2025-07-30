
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, 
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  FunnelChart, Funnel, LabelList
} from 'recharts';
import { 
  Download, 
  Filter, 
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Clock,
  Package,
  CreditCard,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";

export const AnalyticsSection: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeChart, setActiveChart] = useState('sales-daily');

  // Datos de ejemplo para los gráficos
  const salesDailyData = [
    { fecha: '2024-01-01', ventas: 4200, pedidos: 45 },
    { fecha: '2024-01-02', ventas: 3800, pedidos: 42 },
    { fecha: '2024-01-03', ventas: 5200, pedidos: 58 },
    { fecha: '2024-01-04', ventas: 4900, pedidos: 52 },
    { fecha: '2024-01-05', ventas: 6100, pedidos: 67 },
    { fecha: '2024-01-06', ventas: 5800, pedidos: 61 },
    { fecha: '2024-01-07', ventas: 7200, pedidos: 78 }
  ];

  const categoryRevenueData = [
    { categoria: 'Platos Principales', ingresos: 15400, margen: 65 },
    { categoria: 'Bebidas', ingresos: 8200, margen: 80 },
    { categoria: 'Postres', ingresos: 4100, margen: 70 },
    { categoria: 'Entradas', ingresos: 6800, margen: 60 },
    { categoria: 'Ensaladas', ingresos: 3200, margen: 55 }
  ];

  const hourlyOrdersData = [
    { hora: '08:00', pedidos: 12, promedio: 10 },
    { hora: '09:00', pedidos: 18, promedio: 15 },
    { hora: '10:00', pedidos: 25, promedio: 22 },
    { hora: '11:00', pedidos: 35, promedio: 30 },
    { hora: '12:00', pedidos: 52, promedio: 45 },
    { hora: '13:00', pedidos: 68, promedio: 60 },
    { hora: '14:00', pedidos: 45, promedio: 40 },
    { hora: '15:00', pedidos: 32, promedio: 28 },
    { hora: '16:00', pedidos: 28, promedio: 25 },
    { hora: '17:00', pedidos: 35, promedio: 30 },
    { hora: '18:00', pedidos: 48, promedio: 42 },
    { hora: '19:00', pedidos: 62, promedio: 55 },
    { hora: '20:00', pedidos: 58, promedio: 50 },
    { hora: '21:00', pedidos: 42, promedio: 38 }
  ];

  const topProductsData = [
    { producto: 'Pizza Margarita', vendidos: 245, ingresos: 4900 },
    { producto: 'Hamburguesa Clásica', vendidos: 198, ingresos: 3960 },
    { producto: 'Pasta Carbonara', vendidos: 176, ingresos: 3520 },
    { producto: 'Ensalada César', vendidos: 142, ingresos: 2130 },
    { producto: 'Tacos al Pastor', vendidos: 134, ingresos: 2010 }
  ];

  const paymentMethodData = [
    { metodo: 'Tarjeta', porcentaje: 45, color: '#3B82F6' },
    { metodo: 'Efectivo', porcentaje: 30, color: '#10B981' },
    { metodo: 'Transferencia', porcentaje: 20, color: '#8B5CF6' },
    { metodo: 'Otros', porcentaje: 5, color: '#F59E0B' }
  ];

  const stockCriticalData = [
    { producto: 'Tomate', stock: 5, minimo: 20, estado: 'critical' },
    { producto: 'Pollo', stock: 15, minimo: 25, estado: 'warning' },
    { producto: 'Queso', stock: 8, minimo: 15, estado: 'critical' },
    { producto: 'Lechuga', stock: 22, minimo: 20, estado: 'ok' },
    { producto: 'Pan', stock: 12, minimo: 30, estado: 'critical' }
  ];

  const growthData = [
    { mes: 'Ene', ventasActual: 28000, ventasAnterior: 24000 },
    { mes: 'Feb', ventasActual: 32000, ventasAnterior: 26000 },
    { mes: 'Mar', ventasActual: 35000, ventasAnterior: 28000 },
    { mes: 'Abr', ventasActual: 38000, ventasAnterior: 30000 },
    { mes: 'May', ventasActual: 42000, ventasAnterior: 32000 },
    { mes: 'Jun', ventasActual: 45000, ventasAnterior: 35000 }
  ];

  const branchComparisonData = [
    { sucursal: 'Centro', ventas: 15400, pedidos: 245, satisfaccion: 4.8 },
    { sucursal: 'Norte', ventas: 12800, pedidos: 198, satisfaccion: 4.6 },
    { sucursal: 'Sur', ventas: 14200, pedidos: 220, satisfaccion: 4.7 },
    { sucursal: 'Este', ventas: 10900, pedidos: 165, satisfaccion: 4.5 },
    { sucursal: 'Oeste', ventas: 11600, pedidos: 180, satisfaccion: 4.4 }
  ];

  const charts = [
    {
      id: 'sales-daily',
      title: 'Ventas Diarias',
      description: 'Evolución de ventas por día',
      icon: TrendingUp,
      category: 'ventas'
    },
    {
      id: 'revenue-category',
      title: 'Ingresos por Categoría',
      description: 'Distribución de ingresos por tipo de producto',
      icon: PieChartIcon,
      category: 'ingresos'
    },
    {
      id: 'hourly-orders',
      title: 'Pedidos por Hora',
      description: 'Distribución de pedidos durante el día',
      icon: Clock,
      category: 'pedidos'
    },
    {
      id: 'top-products',
      title: 'Productos Más Vendidos',
      description: 'Ranking de productos por ventas',
      icon: Package,
      category: 'productos'
    },
    {
      id: 'payment-methods',
      title: 'Métodos de Pago',
      description: 'Distribución por forma de pago',
      icon: CreditCard,
      category: 'pagos'
    },
    {
      id: 'stock-critical',
      title: 'Stock Crítico',
      description: 'Productos con inventario bajo',
      icon: AlertTriangle,
      category: 'inventario'
    },
    {
      id: 'growth-analysis',
      title: 'Análisis de Crecimiento',
      description: 'Comparativa año actual vs anterior',
      icon: BarChart3,
      category: 'crecimiento'
    },
    {
      id: 'branch-comparison',
      title: 'Comparativa Sucursales',
      description: 'Rendimiento por ubicación',
      icon: BarChart3,
      category: 'sucursales'
    }
  ];

  const exportData = (format: string) => {
    console.log(`Exportando datos en formato: ${format}`);
    // Aquí iría la lógica de exportación
  };

  const renderChart = (chartId: string) => {
    switch (chartId) {
      case 'sales-daily':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={salesDailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'ventas' ? `$${value}` : value,
                name === 'ventas' ? 'Ventas' : 'Pedidos'
              ]} />
              <Line type="monotone" dataKey="ventas" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="pedidos" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'revenue-category':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={categoryRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="ingresos" fill="#3B82F6" />
              <Line yAxisId="right" type="monotone" dataKey="margen" stroke="#10B981" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'hourly-orders':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={hourlyOrdersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="pedidos" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="promedio" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'top-products':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topProductsData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="producto" type="category" width={120} />
              <Tooltip formatter={(value, name) => [
                name === 'ingresos' ? `$${value}` : value,
                name === 'ingresos' ? 'Ingresos' : 'Vendidos'
              ]} />
              <Bar dataKey="vendidos" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'payment-methods':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                dataKey="porcentaje"
                label={({ metodo, porcentaje }) => `${metodo}: ${porcentaje}%`}
              >
                {paymentMethodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'stock-critical':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stockCriticalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="producto" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="stock" fill="#EF4444" />
              <Bar dataKey="minimo" fill="#10B981" fillOpacity={0.3} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'growth-analysis':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Ventas']} />
              <Line type="monotone" dataKey="ventasActual" stroke="#3B82F6" strokeWidth={2} name="2024" />
              <Line type="monotone" dataKey="ventasAnterior" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" name="2023" />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'branch-comparison':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={branchComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sucursal" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="ventas" fill="#3B82F6" />
              <Line yAxisId="right" type="monotone" dataKey="satisfaccion" stroke="#10B981" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Gráfico no encontrado</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros Avanzados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros Avanzados</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Sucursal</label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sucursales</SelectItem>
                  <SelectItem value="centro">Centro</SelectItem>
                  <SelectItem value="norte">Norte</SelectItem>
                  <SelectItem value="sur">Sur</SelectItem>
                  <SelectItem value="este">Este</SelectItem>
                  <SelectItem value="oeste">Oeste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="quarter">Este trimestre</SelectItem>
                  <SelectItem value="year">Este año</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Rango de Fechas</label>
              <DatePickerWithRange />
            </div>
            
            <div className="flex items-end space-x-2">
              <Button onClick={() => exportData('pdf')} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button onClick={() => exportData('csv')} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navegación de Gráficos */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {charts.map((chart) => (
          <Button
            key={chart.id}
            variant={activeChart === chart.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveChart(chart.id)}
            className="flex flex-col items-center space-y-1 h-auto py-3"
          >
            <chart.icon className="h-4 w-4" />
            <span className="text-xs text-center">{chart.title}</span>
          </Button>
        ))}
      </div>

      {/* Gráfico Activo */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{charts.find(c => c.id === activeChart)?.title}</CardTitle>
              <CardDescription>{charts.find(c => c.id === activeChart)?.description}</CardDescription>
            </div>
            <Badge variant="secondary">
              {charts.find(c => c.id === activeChart)?.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {renderChart(activeChart)}
        </CardContent>
      </Card>

      {/* Métricas Adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ticket Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$28.50</div>
            <p className="text-xs text-slate-500">+5.2% vs mes anterior</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tiempo Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 min</div>
            <p className="text-xs text-slate-500">-2.1% vs mes anterior</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Satisfacción</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.7/5</div>
            <p className="text-xs text-slate-500">+0.3 vs mes anterior</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
