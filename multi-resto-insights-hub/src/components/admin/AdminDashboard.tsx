
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  Users, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Shield,
  Activity,
  Headphones,
  CreditCard,
  Zap,
  Target,
  BarChart3,
  Eye,
  RefreshCw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from 'recharts';
import { apiFetch } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<Array<{ id: number; message: string; type: string; count?: number }>>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<any>('/dashboard/global', {}, token || undefined);
        setDashboardData(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar dashboard.');
      } finally {
        setLoading(false);
      }
    };
    const fetchAlerts = async () => {
      setAlertsLoading(true);
      setAlertsError(null);
      try {
        // Cambia este endpoint si tu backend usa otro para alertas/notificaciones
        const data = await apiFetch<any>('/dashboard/alerts', {}, token || undefined);
        // Espera un array de alertas, si no, ajusta aquí
        setAlerts(Array.isArray(data) ? data : data.data || []);
      } catch (err: any) {
        setAlertsError('No se pudo obtener alertas del sistema. ¿Existe el endpoint /dashboard/alerts?');
      } finally {
        setAlertsLoading(false);
      }
    };
    if (token) fetchDashboard();
    if (token) fetchAlerts();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header del Dashboard */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Dashboard Central
            </h1>
            <p className="text-slate-300 text-lg">
              Panel de control del sistema Multi-Resto Insights Hub
            </p>
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

      {/* Loading y Error States */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-400 text-lg">Cargando dashboard...</p>
          </div>
        </div>
      )}
      
      {error && (
        <Card className="border-red-500 bg-red-900/20 backdrop-blur-md">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <p className="text-red-300">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas Críticas */}
      <Card className="mb-8 border-red-500 bg-red-900/20 backdrop-blur-md shadow-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-white">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <span className="text-xl">Alertas del Sistema</span>
            <Badge variant="destructive" className="ml-auto">
              {alerts.filter(n => n.type === 'warning' || n.type === 'alert' || n.type === 'urgent').length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertsLoading && (
            <div className="flex items-center space-x-3 text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span>Cargando alertas...</span>
            </div>
          )}
          {alertsError && (
            <div className="text-red-300 bg-red-900/30 p-4 rounded-lg border border-red-500/30">
              {alertsError}
            </div>
          )}
          {!alertsLoading && !alertsError && alerts.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-slate-300 text-lg">No hay alertas críticas en este momento</p>
              <p className="text-slate-500 text-sm">El sistema está funcionando correctamente</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.filter(n => n.type === 'warning' || n.type === 'alert' || n.type === 'urgent').map((notification) => (
              <div key={notification.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    {notification.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                    {notification.type === 'alert' && <Clock className="h-4 w-4 text-red-400" />}
                    {notification.type === 'urgent' && <Shield className="h-4 w-4 text-red-500" />}
                  </div>
                  <span className="text-sm font-medium text-white">{notification.message}</span>
                </div>
                <Badge 
                  variant={notification.type === 'warning' ? 'secondary' : 'destructive'}
                  className="bg-red-500/20 text-red-300 border-red-500/30"
                >
                  {notification.type === 'warning' ? 'Atención' : notification.type === 'urgent' ? 'Urgente' : 'Crítico'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPIs del Sistema */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-white">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Building2 className="h-5 w-5 text-green-400" />
                </div>
                <span className="text-lg">Restaurantes Activos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{dashboardData.restaurantes?.activos ?? '-'}</div>
              <div className="text-sm text-slate-400">Total: {dashboardData.restaurantes?.total ?? '-'}</div>
              <div className="mt-2">
                <Progress 
                  value={dashboardData.restaurantes?.total ? (dashboardData.restaurantes.activos / dashboardData.restaurantes.total) * 100 : 0} 
                  className="h-2 bg-slate-700"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-white">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Building2 className="h-5 w-5 text-red-400" />
                </div>
                <span className="text-lg">Restaurantes Inactivos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{dashboardData.restaurantes?.inactivos ?? '-'}</div>
              <div className="text-sm text-slate-400">Total: {dashboardData.restaurantes?.total ?? '-'}</div>
              <div className="mt-2">
                <Progress 
                  value={dashboardData.restaurantes?.total ? (dashboardData.restaurantes.inactivos / dashboardData.restaurantes.total) * 100 : 0} 
                  className="h-2 bg-slate-700"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-white">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-lg">Ventas Totales</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{dashboardData.ventas?.total_ventas ?? '-'}</div>
              <div className="text-sm text-slate-400">Monto: ${dashboardData.ventas?.monto_total ?? '-'}</div>
              <div className="flex items-center mt-2 text-green-400 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>+12% vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-white">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Zap className="h-5 w-5 text-purple-400" />
                </div>
                <span className="text-lg">Ventas Hoy</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{dashboardData.ventas?.ventas_hoy ?? '-'}</div>
              <div className="text-sm text-slate-400">Monto: ${dashboardData.ventas?.monto_hoy ?? '-'}</div>
              <div className="flex items-center mt-2 text-green-400 text-sm">
                <Activity className="h-4 w-4 mr-1" />
                <span>Tiempo real</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Restaurantes */}
      {dashboardData && dashboardData.topRestaurantes && (
        <Card className="mb-8 bg-slate-800/50 backdrop-blur-md border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-white">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Target className="h-6 w-6 text-yellow-400" />
              </div>
              <span className="text-xl">Top Restaurantes por Ventas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Posición</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Total Ventas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {dashboardData.topRestaurantes.map((rest: any, idx: number) => (
                    <tr key={rest.id_restaurante || idx} className="hover:bg-slate-800/30 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">#{idx + 1}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{rest.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-400 font-bold">${Number(rest.total_ventas).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                          Activo
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auditoría Reciente */}
      {dashboardData && dashboardData.auditoriaReciente && (
        <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-white">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Eye className="h-6 w-6 text-indigo-400" />
              </div>
              <span className="text-xl">Últimas Acciones de Auditoría</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Acción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Tabla</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {dashboardData.auditoriaReciente.map((aud: any, idx: number) => (
                    <tr key={aud.id_auditoria || idx} className="hover:bg-slate-800/30 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="border-blue-500/30 text-blue-300">
                          {aud.accion}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-300">{aud.tabla_afectada}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400">{new Date(aud.fecha_accion).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-300">{aud.usuario || 'Sistema'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
