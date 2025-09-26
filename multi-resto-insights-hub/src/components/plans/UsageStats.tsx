import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Building2, 
  Package, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from "lucide-react";
import { apiFetch } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

type UsageStats = {
  sucursales: { actual: number; limite: number; porcentaje: number; estado: string };
  usuarios: { actual: number; limite: number; porcentaje: number; estado: string };
  productos: { actual: number; limite: number; porcentaje: number; estado: string };
  transacciones: { actual: number; limite: number; porcentaje: number; estado: string };
};

type RestaurantUsage = {
  id_restaurante: number;
  nombre: string;
  plan_nombre: string;
  usageStats: UsageStats;
};

export const UsageStats: React.FC = () => {
  const [restaurantsUsage, setRestaurantsUsage] = useState<RestaurantUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const loadUsageStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // Obtener restaurantes con planes
      const restaurantsRes = await apiFetch<{ data: any[] }>('/planes/restaurantes/listado', {}, token || undefined);
      const restaurants = restaurantsRes.data || [];
      
      const usageData: RestaurantUsage[] = [];
      
      // Obtener estadísticas de uso para cada restaurante
      for (const restaurant of restaurants) {
        try {
          const usageRes = await apiFetch<{ data: { uso: UsageStats } }>(`/planes/restaurante/${restaurant.id_restaurante}/uso`, {}, token || undefined);
          const usage = usageRes.data?.uso;
          
          if (usage) {
            usageData.push({
              id_restaurante: restaurant.id_restaurante,
              nombre: restaurant.nombre,
              plan_nombre: restaurant.plan_nombre,
              usageStats: usage
            });
          }
        } catch (err) {
          console.error(`Error cargando uso para restaurante ${restaurant.id_restaurante}:`, err);
        }
      }
      
      setRestaurantsUsage(usageData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar estadísticas de uso.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadUsageStats();
      // Recargar cada 30 segundos
      const interval = setInterval(loadUsageStats, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'excedido':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-amber-600 bg-amber-100';
      case 'ok':
        return 'text-green-600 bg-green-100';
      case 'ilimitado':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'excedido':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ilimitado':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTotalUsage = () => {
    const totals = {
      sucursales: { actual: 0, limite: 0 },
      usuarios: { actual: 0, limite: 0 },
      productos: { actual: 0, limite: 0 },
      transacciones: { actual: 0, limite: 0 }
    };

    restaurantsUsage.forEach(restaurant => {
      totals.sucursales.actual += restaurant.usageStats.sucursales?.actual || 0;
      totals.sucursales.limite += restaurant.usageStats.sucursales?.limite || 0;
      totals.usuarios.actual += restaurant.usageStats.usuarios?.actual || 0;
      totals.usuarios.limite += restaurant.usageStats.usuarios?.limite || 0;
      totals.productos.actual += restaurant.usageStats.productos?.actual || 0;
      totals.productos.limite += restaurant.usageStats.productos?.limite || 0;
      totals.transacciones.actual += restaurant.usageStats.transacciones?.actual || 0;
      totals.transacciones.limite += restaurant.usageStats.transacciones?.limite || 0;
    });

    return totals;
  };

  const getExceededRestaurants = () => {
    return restaurantsUsage.filter(restaurant => 
      Object.values(restaurant.usageStats).some(stat => stat?.estado === 'excedido')
    );
  };

  const getWarningRestaurants = () => {
    return restaurantsUsage.filter(restaurant => 
      Object.values(restaurant.usageStats).some(stat => stat?.estado === 'warning')
    );
  };

  const totals = getTotalUsage();
  const exceededRestaurants = getExceededRestaurants();
  const warningRestaurants = getWarningRestaurants();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header del Sistema de Uso */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Centro de Monitoreo de Uso
            </h1>
            <p className="text-slate-300 text-lg">
              Sistema avanzado de análisis y monitoreo de recursos
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-slate-400">Última actualización</p>
              <p className="text-white font-semibold">{new Date().toLocaleTimeString()}</p>
            </div>
            <Button
              onClick={() => loadUsageStats()}
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
            <p className="text-blue-400 text-lg">Cargando datos del sistema...</p>
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

      {/* Centro de Alertas del Sistema */}
      {exceededRestaurants.length > 0 && (
        <Card className="relative overflow-hidden bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30 hover:border-red-400/50 transition-all duration-300 mb-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative z-10 pb-4">
            <CardTitle className="text-lg font-bold text-white flex items-center space-x-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <span>Alertas Críticas del Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <div>
                  <p className="text-red-300 font-semibold">⚠️ Límites Excedidos</p>
                  <p className="text-red-400 text-sm">
                    {exceededRestaurants.length} restaurante(s) han excedido sus límites:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {exceededRestaurants.map(restaurant => (
                      <li key={restaurant.id_restaurante} className="text-red-300 text-sm">
                        • {restaurant.nombre} ({restaurant.plan_nombre})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Centro de Advertencias del Sistema */}
      {warningRestaurants.length > 0 && (
        <Card className="relative overflow-hidden bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 mb-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative z-10 pb-4">
            <CardTitle className="text-lg font-bold text-white flex items-center space-x-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <span>Advertencias del Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                <Clock className="h-6 w-6 text-amber-400" />
                <div>
                  <p className="text-amber-300 font-semibold">⏰ Límites Cercanos</p>
                  <p className="text-amber-400 text-sm">
                    {warningRestaurants.length} restaurante(s) están cerca de sus límites:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {warningRestaurants.map(restaurant => (
                      <li key={restaurant.id_restaurante} className="text-amber-300 text-sm">
                        • {restaurant.nombre} ({restaurant.plan_nombre})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs del Sistema de Uso */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* KPI Usuarios Totales */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors duration-300">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Usuarios Totales</p>
              <p className="text-3xl font-bold text-white">{totals.usuarios.actual.toLocaleString()}</p>
              <p className="text-xs text-slate-400">
                de {totals.usuarios.limite === 0 ? '∞' : totals.usuarios.limite.toLocaleString()} límite
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: `${Math.min((totals.usuarios.actual / (totals.usuarios.limite || 1)) * 100, 100)}%`}}></div>
                </div>
                <span className="text-xs text-slate-400">{Math.round((totals.usuarios.actual / (totals.usuarios.limite || 1)) * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Sucursales Totales */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors duration-300">
                <Building2 className="h-8 w-8 text-green-400" />
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Sucursales Totales</p>
              <p className="text-3xl font-bold text-white">{totals.sucursales.actual.toLocaleString()}</p>
              <p className="text-xs text-slate-400">
                de {totals.sucursales.limite === 0 ? '∞' : totals.sucursales.limite.toLocaleString()} límite
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: `${Math.min((totals.sucursales.actual / (totals.sucursales.limite || 1)) * 100, 100)}%`}}></div>
                </div>
                <span className="text-xs text-slate-400">{Math.round((totals.sucursales.actual / (totals.sucursales.limite || 1)) * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Productos Totales */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors duration-300">
                <Package className="h-8 w-8 text-purple-400" />
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Productos Totales</p>
              <p className="text-3xl font-bold text-white">{totals.productos.actual.toLocaleString()}</p>
              <p className="text-xs text-slate-400">
                de {totals.productos.limite === 0 ? '∞' : totals.productos.limite.toLocaleString()} límite
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{width: `${Math.min((totals.productos.actual / (totals.productos.limite || 1)) * 100, 100)}%`}}></div>
                </div>
                <span className="text-xs text-slate-400">{Math.round((totals.productos.actual / (totals.productos.limite || 1)) * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Transacciones del Mes */}
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
              <p className="text-sm font-medium text-slate-300">Transacciones del Mes</p>
              <p className="text-3xl font-bold text-white">{totals.transacciones.actual.toLocaleString()}</p>
              <p className="text-xs text-slate-400">
                de {totals.transacciones.limite === 0 ? '∞' : totals.transacciones.limite.toLocaleString()} límite
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{width: `${Math.min((totals.transacciones.actual / (totals.transacciones.limite || 1)) * 100, 100)}%`}}></div>
                </div>
                <span className="text-xs text-slate-400">{Math.round((totals.transacciones.actual / (totals.transacciones.limite || 1)) * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Centro de Uso de Recursos por Restaurante */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="text-2xl font-bold text-white flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-400" />
            </div>
            <span>Centro de Uso de Recursos por Restaurante</span>
          </CardTitle>
          <CardDescription className="text-slate-300 text-lg mt-2">
            Estadísticas detalladas de uso de recursos
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-6">
            {restaurantsUsage.map((restaurant) => (
              <div key={restaurant.id_restaurante} className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/50 rounded-xl p-6 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="relative z-10">
                  {/* Header del Restaurante */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{restaurant.nombre}</h3>
                        <p className="text-slate-300">Plan: {restaurant.plan_nombre}</p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      {Object.values(restaurant.usageStats).some(stat => stat?.estado === 'excedido') && (
                        <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                          ⚠️ Límite Excedido
                        </Badge>
                      )}
                      {Object.values(restaurant.usageStats).some(stat => stat?.estado === 'warning') && (
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                          ⏰ Advertencia
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Grid de Recursos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Usuarios */}
                    <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Users className="h-5 w-5 text-blue-400" />
                          </div>
                          <span className="text-slate-300 font-medium">Usuarios</span>
                        </div>
                        {getStatusIcon(restaurant.usageStats.usuarios?.estado || 'ok')}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white font-semibold">{restaurant.usageStats.usuarios?.actual || 0}</span>
                          <span className="text-slate-400">
                            / {restaurant.usageStats.usuarios?.limite === 0 ? '∞' : restaurant.usageStats.usuarios?.limite || 0}
                          </span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                            style={{width: `${restaurant.usageStats.usuarios?.porcentaje || 0}%`}}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-400">{restaurant.usageStats.usuarios?.porcentaje || 0}% utilizado</p>
                      </div>
                    </div>

                    {/* Sucursales */}
                    <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-500/20 rounded-lg">
                            <Building2 className="h-5 w-5 text-green-400" />
                          </div>
                          <span className="text-slate-300 font-medium">Sucursales</span>
                        </div>
                        {getStatusIcon(restaurant.usageStats.sucursales?.estado || 'ok')}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white font-semibold">{restaurant.usageStats.sucursales?.actual || 0}</span>
                          <span className="text-slate-400">
                            / {restaurant.usageStats.sucursales?.limite === 0 ? '∞' : restaurant.usageStats.sucursales?.limite || 0}
                          </span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                            style={{width: `${restaurant.usageStats.sucursales?.porcentaje || 0}%`}}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-400">{restaurant.usageStats.sucursales?.porcentaje || 0}% utilizado</p>
                      </div>
                    </div>

                    {/* Productos */}
                    <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Package className="h-5 w-5 text-purple-400" />
                          </div>
                          <span className="text-slate-300 font-medium">Productos</span>
                        </div>
                        {getStatusIcon(restaurant.usageStats.productos?.estado || 'ok')}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white font-semibold">{restaurant.usageStats.productos?.actual || 0}</span>
                          <span className="text-slate-400">
                            / {restaurant.usageStats.productos?.limite === 0 ? '∞' : restaurant.usageStats.productos?.limite || 0}
                          </span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                            style={{width: `${restaurant.usageStats.productos?.porcentaje || 0}%`}}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-400">{restaurant.usageStats.productos?.porcentaje || 0}% utilizado</p>
                      </div>
                    </div>

                    {/* Transacciones */}
                    <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-amber-500/20 rounded-lg">
                            <BarChart3 className="h-5 w-5 text-amber-400" />
                          </div>
                          <span className="text-slate-300 font-medium">Transacciones</span>
                        </div>
                        {getStatusIcon(restaurant.usageStats.transacciones?.estado || 'ok')}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white font-semibold">{(restaurant.usageStats.transacciones?.actual || 0).toLocaleString()}</span>
                          <span className="text-slate-400">
                            / {restaurant.usageStats.transacciones?.limite === 0 ? '∞' : (restaurant.usageStats.transacciones?.limite || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-amber-500 h-2 rounded-full transition-all duration-300" 
                            style={{width: `${restaurant.usageStats.transacciones?.porcentaje || 0}%`}}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-400">{restaurant.usageStats.transacciones?.porcentaje || 0}% utilizado</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageStats;
