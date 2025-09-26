import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer, 
  Mail, 
  Calendar,
  BarChart3,
  PieChart,
  Download,
  RefreshCw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';

interface ConversionStats {
  totalSolicitudes: number;
  contactados: number;
  demosRealizadas: number;
  convertidos: number;
  tasaConversion: number;
}

interface PlanStats {
  plan: string;
  totalSolicitudes: number;
  contactados: number;
  demosRealizadas: number;
  convertidos: number;
  tasaConversion: number;
}

interface EventStats {
  eventType: string;
  count: number;
  uniqueSessions: number;
  fecha: string;
}

const MarketingAnalyticsDashboard: React.FC = () => {
  const [conversionStats, setConversionStats] = useState<ConversionStats | null>(null);
  const [planStats, setPlanStats] = useState<PlanStats[]>([]);
  const [eventStats, setEventStats] = useState<EventStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7'); // últimos 7 días por defecto

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await fetch(`/api/conversion-stats?startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      
      if (data.success) {
        // Procesar estadísticas de conversión
        const totalSolicitudes = data.data.demoStats.reduce((sum: number, stat: any) => sum + parseInt(stat.total_solicitudes), 0);
        const totalContactados = data.data.demoStats.reduce((sum: number, stat: any) => sum + parseInt(stat.contactados), 0);
        const totalDemos = data.data.demoStats.reduce((sum: number, stat: any) => sum + parseInt(stat.demos_realizadas), 0);
        const totalConvertidos = data.data.demoStats.reduce((sum: number, stat: any) => sum + parseInt(stat.convertidos), 0);
        
        setConversionStats({
          totalSolicitudes,
          contactados: totalContactados,
          demosRealizadas: totalDemos,
          convertidos: totalConvertidos,
          tasaConversion: totalSolicitudes > 0 ? (totalConvertidos / totalSolicitudes) * 100 : 0
        });
        
        // Procesar estadísticas por plan
        setPlanStats(data.data.demoStats.map((stat: any) => ({
          plan: stat.plan_interes || 'No especificado',
          totalSolicitudes: parseInt(stat.total_solicitudes),
          contactados: parseInt(stat.contactados),
          demosRealizadas: parseInt(stat.demos_realizadas),
          convertidos: parseInt(stat.convertidos),
          tasaConversion: parseFloat(stat.tasa_conversion) || 0
        })));
        
        // Procesar eventos de conversión
        setEventStats(data.data.conversionStats.map((stat: any) => ({
          eventType: stat.event_type,
          count: parseInt(stat.count),
          uniqueSessions: parseInt(stat.unique_sessions),
          fecha: stat.fecha
        })));
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      'page_load': 'Carga de Página',
      'scroll_depth': 'Profundidad de Scroll',
      'time_on_page': 'Tiempo en Página',
      'plan_view': 'Visualización de Plan',
      'demo_request': 'Solicitud de Demo',
      'contact_form_submit': 'Envío de Formulario',
      'video_play': 'Reproducción de Video',
      'pricing_view': 'Visualización de Precios',
      'testimonial_view': 'Visualización de Testimonios'
    };
    return labels[eventType] || eventType;
  };

  const getEventTypeColor = (eventType: string) => {
    const colors: Record<string, string> = {
      'page_load': '#3B82F6',
      'scroll_depth': '#10B981',
      'time_on_page': '#F59E0B',
      'plan_view': '#8B5CF6',
      'demo_request': '#EF4444',
      'contact_form_submit': '#06B6D4',
      'video_play': '#84CC16',
      'pricing_view': '#F97316',
      'testimonial_view': '#EC4899'
    };
    return colors[eventType] || '#6B7280';
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Cargando analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Analytics de Marketing</h2>
          <p className="text-muted-foreground">Métricas de conversión y rendimiento de la landing page</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Último día</SelectItem>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionStats?.totalSolicitudes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Solicitudes de demo recibidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contactados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionStats?.contactados || 0}</div>
            <p className="text-xs text-muted-foreground">
              Clientes contactados por el equipo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demos Realizadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionStats?.demosRealizadas || 0}</div>
            <p className="text-xs text-muted-foreground">
              Demos completadas exitosamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversionStats?.tasaConversion.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Solicitudes que se convirtieron en clientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversiones por plan */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes por Plan</CardTitle>
            <CardDescription>Distribución de solicitudes según el plan de interés</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <RechartsPieChart
                  data={planStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ plan, totalSolicitudes }) => `${plan}: ${totalSolicitudes}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalSolicitudes"
                >
                  {planStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </RechartsPieChart>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Eventos de conversión */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos de Conversión</CardTitle>
            <CardDescription>Actividad de usuarios en la landing page</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="eventType" 
                  tickFormatter={getEventTypeLabel}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => getEventTypeLabel(value)}
                  formatter={(value, name) => [value, name === 'count' ? 'Eventos' : 'Sesiones']}
                />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla detallada de planes */}
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas Detalladas por Plan</CardTitle>
          <CardDescription>Métricas de conversión para cada plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Plan</th>
                  <th className="text-right p-2">Solicitudes</th>
                  <th className="text-right p-2">Contactados</th>
                  <th className="text-right p-2">Demos</th>
                  <th className="text-right p-2">Convertidos</th>
                  <th className="text-right p-2">Tasa Conv.</th>
                </tr>
              </thead>
              <tbody>
                {planStats.map((plan, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-medium">{plan.plan}</td>
                    <td className="p-2 text-right">{plan.totalSolicitudes}</td>
                    <td className="p-2 text-right">{plan.contactados}</td>
                    <td className="p-2 text-right">{plan.demosRealizadas}</td>
                    <td className="p-2 text-right">{plan.convertidos}</td>
                    <td className="p-2 text-right">
                      <Badge variant={plan.tasaConversion > 10 ? "default" : "secondary"}>
                        {plan.tasaConversion.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MarketingAnalyticsDashboard;




