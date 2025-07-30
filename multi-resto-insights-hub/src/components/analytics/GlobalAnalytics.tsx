
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Building2,
  Calendar,
  Download,
  Filter
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from 'recharts';
import { apiFetch } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export const GlobalAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const { token } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<any>(`/dashboard/global`, {}, token || undefined);
        setAnalytics(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar analíticas globales.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchAnalytics();
  }, [token, timeRange]);

  return (
    <div className="space-y-6">
      {loading && <div className="text-center text-blue-600">Cargando analíticas...</div>}
      {error && <div className="text-center text-red-600">{error}</div>}
      {/* Controles y Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Análisis Global del Sistema</h2>
          <p className="text-slate-600">Métricas y estadísticas del ecosistema POS con plan estándar</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Período de tiempo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="1y">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      {/* El resto de la UI debe usar solo analytics en vez de datos mock */}
      {/* Ejemplo: KPIs principales */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-slate-900">${analytics.totalRevenue?.toLocaleString() ?? '-'}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {analytics.revenueGrowth ?? ''}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Restaurantes Activos</p>
                  <p className="text-2xl font-bold text-slate-900">{analytics.totalRestaurants ?? '-'}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {analytics.restaurantGrowth ?? ''}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-slate-900">{analytics.totalActiveUsers ?? '-'}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {analytics.activeUsersGrowth ?? ''}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Ingreso/Restaurante</p>
                  <p className="text-2xl font-bold text-slate-900">${analytics.avgRevenuePerRestaurant ?? '-'}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {analytics.avgRevenuePerRestaurantGrowth ?? ''}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolución de Ingresos y Restaurantes */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Ingresos y Crecimiento</CardTitle>
              <CardDescription>Progresión mensual del ecosistema</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analytics.revenueAndRestaurantData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="revenue" />
                  <YAxis yAxisId="count" orientation="right" />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? `$${Number(value).toLocaleString()}` : value,
                    name === 'revenue' ? 'Ingresos' : name === 'restaurants' ? 'Restaurantes' : 'Promedio'
                  ]} />
                  <Area yAxisId="revenue" type="monotone" dataKey="revenue" fill="#3B82F6" fillOpacity={0.3} stroke="#3B82F6" strokeWidth={2} />
                  <Line yAxisId="count" type="monotone" dataKey="restaurants" stroke="#10B981" strokeWidth={3} />
                  <Line yAxisId="revenue" type="monotone" dataKey="avgPerRestaurant" stroke="#F59E0B" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Análisis de Retención */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Retención y Churn</CardTitle>
              <CardDescription>Nuevos vs cancelados y tasa de retención</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analytics.churnAnalysisData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="count" />
                  <YAxis yAxisId="percent" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="count" dataKey="nuevos" fill="#10B981" name="Nuevos" />
                  <Bar yAxisId="count" dataKey="cancelados" fill="#EF4444" name="Cancelados" />
                  <Line yAxisId="percent" type="monotone" dataKey="retencion" stroke="#3B82F6" strokeWidth={3} name="Retención %" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Uso del Sistema 24/7 */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Actividad del Sistema 24/7</CardTitle>
            <CardDescription>Patrones de uso durante las 24 horas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={analytics.systemUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis yAxisId="users" />
                <YAxis yAxisId="revenue" orientation="right" />
                <Tooltip formatter={(value, name) => [
                  name === 'revenue' ? `$${Number(value).toLocaleString()}` : value,
                  name === 'activeUsers' ? 'Usuarios Activos' : name === 'transactions' ? 'Transacciones' : 'Ingresos'
                ]} />
                <Area yAxisId="users" type="monotone" dataKey="activeUsers" fill="#3B82F6" fillOpacity={0.3} stroke="#3B82F6" />
                <Line yAxisId="users" type="monotone" dataKey="transactions" stroke="#10B981" strokeWidth={2} />
                <Line yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Análisis Detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Restaurantes */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle>Top Restaurantes</CardTitle>
              <CardDescription>Mejores performers del mes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topRestaurants?.map((restaurant: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{restaurant.name}</p>
                      <p className="text-sm text-gray-500">
                        {restaurant.transactions} transacciones
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold">${restaurant.revenue.toLocaleString()}</p>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        +{restaurant.growth}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado de Suscripciones */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle>Estado de Suscripciones</CardTitle>
              <CardDescription>Plan estándar por estado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.subscriptionStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {analytics.subscriptionStatusData?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Métricas de Rendimiento */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Rendimiento</CardTitle>
              <CardDescription>Indicadores clave del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.performanceMetrics?.map((metric: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{metric.metric}</span>
                      <Badge variant={metric.status === 'excellent' ? 'default' : 'secondary'}>
                        {metric.value}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      Objetivo: {metric.target}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Análisis Regional */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Análisis por Región</CardTitle>
            <CardDescription>Distribución geográfica de restaurantes e ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={analytics.regionalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis yAxisId="revenue" />
                <YAxis yAxisId="count" orientation="right" />
                <Tooltip />
                <Bar yAxisId="revenue" dataKey="revenue" fill="#3B82F6" name="Ingresos" />
                <Bar yAxisId="count" dataKey="restaurants" fill="#10B981" name="Restaurantes" />
                <Line yAxisId="revenue" type="monotone" dataKey="growth" stroke="#F59E0B" strokeWidth={2} name="Crecimiento %" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
