
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Store,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface DashboardOverviewProps {
  notifications: Array<{ id: number; message: string; type: string }>;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ notifications }) => {
  const kpis = [
    {
      title: "Ventas Totales Hoy",
      value: "$24,580",
      change: "+12.5%",
      changeType: "positive",
      icon: DollarSign,
      description: "Comparado con ayer"
    },
    {
      title: "Pedidos Activos",
      value: "42",
      change: "+3",
      changeType: "positive",
      icon: ShoppingCart,
      description: "En preparación"
    },
    {
      title: "Sucursales Activas",
      value: "8/10",
      change: "2 inactivas",
      changeType: "warning",
      icon: Store,
      description: "Estado operativo"
    },
    {
      title: "Crecimiento Mensual",
      value: "+18.2%",
      change: "Meta: 15%",
      changeType: "positive",
      icon: TrendingUp,
      description: "Vs mes anterior"
    }
  ];

  const salesData = [
    { time: '09:00', ventas: 1200 },
    { time: '10:00', ventas: 1890 },
    { time: '11:00', ventas: 2800 },
    { time: '12:00', ventas: 3900 },
    { time: '13:00', ventas: 4800 },
    { time: '14:00', ventas: 3900 },
    { time: '15:00', ventas: 4300 },
    { time: '16:00', ventas: 2400 },
    { time: '17:00', ventas: 1800 }
  ];

  const branchData = [
    { sucursal: 'Centro', ventas: 8900, pedidos: 124 },
    { sucursal: 'Norte', ventas: 7200, pedidos: 98 },
    { sucursal: 'Sur', ventas: 6800, pedidos: 89 },
    { sucursal: 'Este', ventas: 5200, pedidos: 76 },
    { sucursal: 'Oeste', ventas: 4900, pedidos: 67 }
  ];

  const planData = [
    { name: 'Premium', value: 5, color: '#3B82F6' },
    { name: 'Básico', value: 3, color: '#10B981' },
    { name: 'Empresarial', value: 2, color: '#8B5CF6' }
  ];

  return (
    <div className="space-y-6">
      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span>Notificaciones Importantes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  {notification.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  {notification.type === 'alert' && <Clock className="h-4 w-4 text-red-500" />}
                  {notification.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  <span className="text-sm">{notification.message}</span>
                </div>
                <Badge variant={notification.type === 'warning' ? 'secondary' : notification.type === 'alert' ? 'destructive' : 'default'}>
                  {notification.type === 'warning' ? 'Advertencia' : notification.type === 'alert' ? 'Urgente' : 'Éxito'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
              <div className="flex items-center space-x-2 mt-2">
                <Badge 
                  variant={kpi.changeType === 'positive' ? 'default' : kpi.changeType === 'warning' ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {kpi.change}
                </Badge>
                <p className="text-xs text-slate-500">{kpi.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos del Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas en Tiempo Real */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Hora (Hoy)</CardTitle>
            <CardDescription>Evolución de ventas durante el día</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Ventas']} />
                <Line type="monotone" dataKey="ventas" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rendimiento por Sucursal */}
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Sucursal</CardTitle>
            <CardDescription>Ventas y pedidos por ubicación</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={branchData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sucursal" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ventas" fill="#3B82F6" />
                <Bar dataKey="pedidos" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Panel Inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución de Planes */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Planes</CardTitle>
            <CardDescription>Planes activos por sucursal</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Accesos Rápidos */}
        <Card>
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
            <CardDescription>Funciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Store className="h-4 w-4 mr-2" />
              Gestionar Sucursales
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              Ver Análisis Completo
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              Administrar Planes
            </Button>
          </CardContent>
        </Card>

        {/* Metas y Objetivos */}
        <Card>
          <CardHeader>
            <CardTitle>Objetivos del Mes</CardTitle>
            <CardDescription>Progreso hacia las metas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Ventas Mensuales</span>
                <span>72%</span>
              </div>
              <Progress value={72} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Nuevos Clientes</span>
                <span>85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Satisfacción</span>
                <span>94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
