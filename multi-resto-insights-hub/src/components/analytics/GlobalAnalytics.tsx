
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
  Filter,
  RefreshCw,
  AlertTriangle,
  Clock
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
        // Mapear timeRange a fechas
        const now = new Date();
        const endDate = now.toISOString().slice(0,10);
        const deltaDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
        const start = new Date(now.getTime() - deltaDays*24*60*60*1000);
        const startDate = start.toISOString().slice(0,10);
        const data = await apiFetch<any>(`/dashboard/analytics?startDate=${startDate}&endDate=${endDate}`, {}, token || undefined);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header del Sistema de Análisis Global */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Centro de Análisis Global
            </h1>
            <p className="text-slate-300 text-lg">
              Business Intelligence avanzado y análisis del ecosistema POS
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-slate-400">Última actualización</p>
              <p className="text-white font-semibold">{new Date().toLocaleTimeString()}</p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Estados de Carga y Error */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-400 text-lg">Cargando analíticas globales...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Panel de Control de Filtros Avanzados */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md mb-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="text-2xl font-bold text-white flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Filter className="h-6 w-6 text-blue-400" />
            </div>
            <span>Panel de Control de Análisis Global</span>
          </CardTitle>
          <CardDescription className="text-slate-300 text-lg mt-2">
            Configuración inteligente de parámetros de análisis del ecosistema
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Período de Análisis</span>
              </label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-64 bg-slate-700/50 border-slate-600/50 focus:border-green-500 text-white rounded-xl">
                  <SelectValue placeholder="📅 Seleccionar período" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                  <SelectItem value="7d" className="text-white hover:bg-slate-700">📅 Últimos 7 días</SelectItem>
                  <SelectItem value="30d" className="text-white hover:bg-slate-700">📅 Últimos 30 días</SelectItem>
                  <SelectItem value="90d" className="text-white hover:bg-slate-700">📅 Últimos 90 días</SelectItem>
                  <SelectItem value="1y" className="text-white hover:bg-slate-700">📅 Último año</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span>Exportar Datos</span>
              </label>
              <Button 
                variant="outline"
                className="bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* KPIs del Sistema Global */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* KPI Ingresos Totales */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -translate-y-12 translate-x-12"></div>
            <CardContent className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors duration-300">
                  <DollarSign className="h-8 w-8 text-green-400" />
                </div>
                <div className="text-right">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">Ingresos Totales</p>
                <p className="text-3xl font-bold text-white">${analytics.totalRevenue?.toLocaleString() ?? '-'}</p>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '90%'}}></div>
                  </div>
                  <span className="text-xs text-slate-400">90%</span>
                </div>
                <p className="text-xs text-green-400 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {analytics.revenueGrowth ?? 'Crecimiento positivo'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* KPI Restaurantes Activos */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-12 translate-x-12"></div>
            <CardContent className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors duration-300">
                  <Building2 className="h-8 w-8 text-blue-400" />
                </div>
                <div className="text-right">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">Restaurantes Activos</p>
                <p className="text-3xl font-bold text-white">{analytics.totalRestaurants ?? '-'}</p>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                  <span className="text-xs text-slate-400">85%</span>
                </div>
                <p className="text-xs text-blue-400 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {analytics.restaurantGrowth ?? 'Crecimiento estable'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* KPI Usuarios Activos */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -translate-y-12 translate-x-12"></div>
            <CardContent className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors duration-300">
                  <Users className="h-8 w-8 text-purple-400" />
                </div>
                <div className="text-right">
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">Usuarios Activos</p>
                <p className="text-3xl font-bold text-white">{analytics.totalActiveUsers ?? '-'}</p>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{width: '78%'}}></div>
                  </div>
                  <span className="text-xs text-slate-400">78%</span>
                </div>
                <p className="text-xs text-purple-400 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {analytics.activeUsersGrowth ?? 'Engagement alto'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* KPI Ingreso/Restaurante */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-12 translate-x-12"></div>
            <CardContent className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-500/20 rounded-xl group-hover:bg-amber-500/30 transition-colors duration-300">
                  <BarChart3 className="h-8 w-8 text-amber-400" />
                </div>
                <div className="text-right">
                  <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">Ingreso/Restaurante</p>
                <p className="text-3xl font-bold text-white">${analytics.avgRevenuePerRestaurant ?? '-'}</p>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{width: '82%'}}></div>
                  </div>
                  <span className="text-xs text-slate-400">82%</span>
                </div>
                <p className="text-xs text-amber-400 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {analytics.avgRevenuePerRestaurantGrowth ?? 'Rendimiento óptimo'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dashboards de Análisis Avanzado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Dashboard de Evolución de Ingresos y Crecimiento */}
        {analytics && (
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-white">
                    Evolución de Ingresos y Crecimiento
                  </CardTitle>
                  <CardDescription className="text-slate-300 text-lg mt-2">
                    Progresión mensual del ecosistema POS
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={analytics.revenueAndRestaurantData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis yAxisId="revenue" stroke="#9CA3AF" />
                    <YAxis yAxisId="count" orientation="right" stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                      formatter={(value, name) => [
                        name === 'revenue' ? `$${Number(value).toLocaleString()}` : value,
                        name === 'revenue' ? 'Ingresos' : name === 'restaurants' ? 'Restaurantes' : 'Promedio'
                      ]} 
                    />
                    <Area yAxisId="revenue" type="monotone" dataKey="revenue" fill="#3B82F6" fillOpacity={0.3} stroke="#3B82F6" strokeWidth={2} />
                    <Line yAxisId="count" type="monotone" dataKey="restaurants" stroke="#10B981" strokeWidth={3} />
                    <Line yAxisId="revenue" type="monotone" dataKey="avgPerRestaurant" stroke="#F59E0B" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard de Análisis de Retención y Churn */}
        {analytics && (
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-16 translate-x-16"></div>
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-red-500/20 rounded-xl">
                  <Users className="h-8 w-8 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-white">
                    Análisis de Retención y Churn
                  </CardTitle>
                  <CardDescription className="text-slate-300 text-lg mt-2">
                    Nuevos vs cancelados y tasa de retención
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={analytics.churnAnalysisData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis yAxisId="count" stroke="#9CA3AF" />
                    <YAxis yAxisId="percent" orientation="right" stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Bar yAxisId="count" dataKey="nuevos" fill="#10B981" name="Nuevos" />
                    <Bar yAxisId="count" dataKey="cancelados" fill="#EF4444" name="Cancelados" />
                    <Line yAxisId="percent" type="monotone" dataKey="retencion" stroke="#3B82F6" strokeWidth={3} name="Retención %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dashboard de Actividad del Sistema 24/7 */}
      {analytics && (
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md mb-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative z-10 pb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl">
                <Clock className="h-8 w-8 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white">
                  Actividad del Sistema 24/7
                </CardTitle>
                <CardDescription className="text-slate-300 text-lg mt-2">
                  Patrones de uso durante las 24 horas del ecosistema
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={analytics.systemUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" />
                  <YAxis yAxisId="users" stroke="#9CA3AF" />
                  <YAxis yAxisId="revenue" orientation="right" stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    formatter={(value, name) => [
                      name === 'revenue' ? `$${Number(value).toLocaleString()}` : value,
                      name === 'activeUsers' ? 'Usuarios Activos' : name === 'transactions' ? 'Transacciones' : 'Ingresos'
                    ]} 
                  />
                  <Area yAxisId="users" type="monotone" dataKey="activeUsers" fill="#3B82F6" fillOpacity={0.3} stroke="#3B82F6" />
                  <Line yAxisId="users" type="monotone" dataKey="transactions" stroke="#10B981" strokeWidth={2} />
                  <Line yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboards de Análisis Detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Dashboard de Top Restaurantes */}
        {analytics && (
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -translate-y-12 translate-x-12"></div>
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Building2 className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">Top Restaurantes</CardTitle>
                  <CardDescription className="text-slate-300">Mejores performers del mes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {analytics.topRestaurants?.map((restaurant: any, index: number) => (
                  <div key={index} className="group flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/50 hover:bg-slate-700/50 transition-all duration-300">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg flex items-center justify-center">
                          <span className="text-green-400 font-bold text-sm">#{index + 1}</span>
                        </div>
                        <p className="font-semibold text-white group-hover:text-green-300 transition-colors">{restaurant.name}</p>
                      </div>
                      <p className="text-sm text-slate-400">
                        {restaurant.transactions} transacciones
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="font-bold text-white text-lg">${restaurant.revenue.toLocaleString()}</p>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30">
                        +{restaurant.growth}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard de Estado de Suscripciones */}
        {analytics && (
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-12 translate-x-12"></div>
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">Estado de Suscripciones</CardTitle>
                  <CardDescription className="text-slate-300">Plan estándar por estado</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={analytics.subscriptionStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {analytics.subscriptionStatusData?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard de Métricas de Rendimiento */}
        {analytics && (
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -translate-y-12 translate-x-12"></div>
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">Métricas de Rendimiento</CardTitle>
                  <CardDescription className="text-slate-300">Indicadores clave del sistema</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {analytics.performanceMetrics?.map((metric: any, index: number) => (
                  <div key={index} className="group p-4 bg-slate-700/30 rounded-xl border border-slate-600/50 hover:bg-slate-700/50 transition-all duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-300">{metric.metric}</span>
                      <Badge className={`${
                        metric.status === 'excellent' 
                          ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                          : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                      }`}>
                        {metric.value}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400">
                      Objetivo: {metric.target}
                    </div>
                    <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          metric.status === 'excellent' ? 'bg-green-500' : 'bg-slate-500'
                        }`} 
                        style={{width: `${Math.min(100, (metric.value / metric.target) * 100)}%`}}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dashboard de Análisis Regional */}
      {analytics && (
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative z-10 pb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl">
                <Building2 className="h-8 w-8 text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white">
                  Análisis por Región
                </CardTitle>
                <CardDescription className="text-slate-300 text-lg mt-2">
                  Distribución geográfica de restaurantes e ingresos
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
              <ResponsiveContainer width="100%" height={450}>
                <ComposedChart data={analytics.regionalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="region" stroke="#9CA3AF" />
                  <YAxis yAxisId="revenue" stroke="#9CA3AF" />
                  <YAxis yAxisId="count" orientation="right" stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Bar yAxisId="revenue" dataKey="revenue" fill="#3B82F6" name="Ingresos" />
                  <Bar yAxisId="count" dataKey="restaurants" fill="#10B981" name="Restaurantes" />
                  <Line yAxisId="revenue" type="monotone" dataKey="growth" stroke="#F59E0B" strokeWidth={2} name="Crecimiento %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
