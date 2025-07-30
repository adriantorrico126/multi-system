
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
  CreditCard
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
    <div className="space-y-6">
      {loading && <div className="text-center text-blue-600">Cargando dashboard...</div>}
      {error && <div className="text-center text-red-600">{error}</div>}
      {/* Alertas Críticas */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>Alertas del Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertsLoading && <div className="text-blue-600">Cargando alertas...</div>}
          {alertsError && <div className="text-red-600">{alertsError}</div>}
          {!alertsLoading && !alertsError && alerts.length === 0 && (
            <div className="text-slate-500">No hay alertas críticas en este momento.</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.filter(n => n.type === 'warning' || n.type === 'alert' || n.type === 'urgent').map((notification) => (
              <div key={notification.id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50">
                <div className="flex items-center space-x-3">
                  {notification.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  {notification.type === 'alert' && <Clock className="h-4 w-4 text-red-500" />}
                  {notification.type === 'urgent' && <Shield className="h-4 w-4 text-red-600" />}
                  <span className="text-sm font-medium">{notification.message}</span>
                </div>
                <Badge variant={notification.type === 'warning' ? 'secondary' : 'destructive'}>
                  {notification.type === 'warning' ? 'Atención' : notification.type === 'urgent' ? 'Urgente' : 'Crítico'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPIs del Sistema */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Restaurantes Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{dashboardData.restaurantes?.activos ?? '-'}</div>
              <div className="text-xs text-slate-500">Total: {dashboardData.restaurantes?.total ?? '-'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Restaurantes Inactivos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{dashboardData.restaurantes?.inactivos ?? '-'}</div>
              <div className="text-xs text-slate-500">Total: {dashboardData.restaurantes?.total ?? '-'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ventas Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{dashboardData.ventas?.total_ventas ?? '-'}</div>
              <div className="text-xs text-slate-500">Monto: ${dashboardData.ventas?.monto_total ?? '-'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ventas Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{dashboardData.ventas?.ventas_hoy ?? '-'}</div>
              <div className="text-xs text-slate-500">Monto: ${dashboardData.ventas?.monto_hoy ?? '-'}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Restaurantes */}
      {dashboardData && dashboardData.topRestaurantes && (
        <Card>
          <CardHeader>
            <CardTitle>Top Restaurantes por Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Ventas</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.topRestaurantes.map((rest: any, idx: number) => (
                    <tr key={rest.id_restaurante || idx} className="bg-white">
                      <td className="px-4 py-2 whitespace-nowrap">{rest.nombre}</td>
                      <td className="px-4 py-2 whitespace-nowrap">${Number(rest.total_ventas).toLocaleString()}</td>
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
        <Card>
          <CardHeader>
            <CardTitle>Últimas Acciones de Auditoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tabla</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.auditoriaReciente.map((aud: any, idx: number) => (
                    <tr key={aud.id_auditoria || idx} className="bg-white">
                      <td className="px-4 py-2 whitespace-nowrap">{aud.accion}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{aud.tabla_afectada}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{new Date(aud.fecha_accion).toLocaleString()}</td>
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
