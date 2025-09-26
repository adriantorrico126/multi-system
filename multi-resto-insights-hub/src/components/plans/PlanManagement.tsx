import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  TrendingUp,
  Package,
  Shield,
  Zap,
  Users,
  Building2,
  BarChart3
} from "lucide-react";
import { apiFetch } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/components/ui/use-toast";

type Plan = {
  id_plan: number;
  nombre: string;
  descripcion: string;
  precio_mensual: number;
  precio_anual?: number;
  max_sucursales: number;
  max_usuarios: number;
  max_productos: number;
  max_transacciones_mes: number;
  funcionalidades: Record<string, any>;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

type RestaurantWithPlan = {
  id_restaurante: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string;
  activo: boolean;
  created_at: string;
  plan_nombre: string;
  precio_mensual: number;
  suscripcion_estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  sucursales_count: number;
  usuarios_count: number;
  productos_count: number;
};

export const PlanManagement: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [restaurantsWithPlans, setRestaurantsWithPlans] = useState<RestaurantWithPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  const loadPlans = async () => {
      setLoading(true);
      setError(null);
      try {
      const plansRes = await apiFetch<{ data: Plan[] }>('/planes', {}, token || undefined);
      setPlans(plansRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Error al cargar planes.');
      } finally {
        setLoading(false);
      }
    };

  const loadRestaurantsWithPlans = async () => {
    try {
      const restaurantsRes = await apiFetch<{ data: RestaurantWithPlan[] }>('/planes/restaurantes/listado', {}, token || undefined);
      setRestaurantsWithPlans(restaurantsRes.data || []);
    } catch (err: any) {
      console.error('Error al cargar restaurantes con planes:', err);
    }
  };

  useEffect(() => {
    if (token) {
      loadPlans();
      loadRestaurantsWithPlans();
    }
  }, [token]);

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basico':
        return <Package className="h-5 w-5" />;
      case 'profesional':
        return <TrendingUp className="h-5 w-5" />;
      case 'avanzado':
        return <Zap className="h-5 w-5" />;
      case 'enterprise':
        return <Shield className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basico':
        return 'bg-blue-100 text-blue-800';
      case 'profesional':
        return 'bg-green-100 text-green-800';
      case 'avanzado':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-gold-100 text-gold-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFuncionalidades = (funcionalidades: Record<string, any>) => {
    const features = [];
    if (funcionalidades.sales) features.push('Ventas');
    if (funcionalidades.inventory) features.push('Inventario');
    if (funcionalidades.mesas) features.push('Gestión de Mesas');
    if (funcionalidades.lotes) features.push('Control de Lotes');
    if (funcionalidades.arqueo) features.push('Arqueo de Caja');
    if (funcionalidades.cocina) features.push('Módulo de Cocina');
    if (funcionalidades.egresos) features.push('Control de Egresos');
    if (funcionalidades.delivery) features.push('Delivery');
    if (funcionalidades.reservas) features.push('Reservas');
    if (funcionalidades.analytics) features.push('Analytics Avanzado');
    if (funcionalidades.promociones) features.push('Promociones');
    if (funcionalidades.api) features.push('API Externa');
    if (funcionalidades.white_label) features.push('White Label');
    return features;
  };

  const getRestaurantCountByPlan = (planName: string) => {
    return restaurantsWithPlans.filter(r => r.plan_nombre?.toLowerCase() === planName.toLowerCase()).length;
  };

  const getTotalRevenue = () => {
    return restaurantsWithPlans.reduce((sum, r) => sum + (r.precio_mensual || 0), 0);
  };

  const getActiveSubscriptions = () => {
    return restaurantsWithPlans.filter(r => r.suscripcion_estado === 'activa').length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header del Sistema de Planes */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Centro de Gestión de Planes
            </h1>
            <p className="text-slate-300 text-lg">
              Sistema avanzado de configuración y administración de planes
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-slate-400">Última actualización</p>
              <p className="text-white font-semibold">{new Date().toLocaleTimeString()}</p>
            </div>
            <Button
              onClick={() => { loadPlans(); loadRestaurantsWithPlans(); }}
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

      {/* KPIs del Sistema de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* KPI Planes Disponibles */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors duration-300">
                <CreditCard className="h-8 w-8 text-blue-400" />
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Planes Disponibles</p>
              <p className="text-3xl font-bold text-white">{plans.length}</p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '100%'}}></div>
                </div>
                <span className="text-xs text-slate-400">100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Suscripciones Activas */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors duration-300">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Suscripciones Activas</p>
              <p className="text-3xl font-bold text-white">{getActiveSubscriptions()}</p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '90%'}}></div>
                </div>
                <span className="text-xs text-slate-400">90%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Ingresos Mensuales */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors duration-300">
                <TrendingUp className="h-8 w-8 text-purple-400" />
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Ingresos Mensuales</p>
              <p className="text-3xl font-bold text-white">${getTotalRevenue().toLocaleString()}</p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
                <span className="text-xs text-slate-400">75%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Restaurantes Totales */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-500/20 rounded-xl group-hover:bg-amber-500/30 transition-colors duration-300">
                <Building2 className="h-8 w-8 text-amber-400" />
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Restaurantes Totales</p>
              <p className="text-3xl font-bold text-white">{restaurantsWithPlans.length}</p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{width: '85%'}}></div>
                </div>
                <span className="text-xs text-slate-400">85%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panel de Distribución de Planes */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md mb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="text-2xl font-bold text-white flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-400" />
            </div>
            <span>Distribución por Planes</span>
          </CardTitle>
          <CardDescription className="text-slate-300 text-lg mt-2">
            Resumen de suscripciones por tipo de plan
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div key={plan.id_plan} className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/50 rounded-xl p-6 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors duration-300">
                      {getPlanIcon(plan.nombre)}
                    </div>
                    <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50">
                      {plan.nombre}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-300 mb-4 leading-relaxed">{plan.descripcion}</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Precio mensual</span>
                      <span className="text-xl font-bold text-white">${plan.precio_mensual}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Restaurantes</span>
                      <span className="text-slate-300 font-medium">{getRestaurantCountByPlan(plan.nombre)}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-600/50">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">👥 Usuarios</span>
                        <span className="text-slate-300 font-medium">{plan.max_usuarios === 0 ? '∞' : plan.max_usuarios}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">📦 Productos</span>
                        <span className="text-slate-300 font-medium">{plan.max_productos === 0 ? '∞' : plan.max_productos}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">🏢 Sucursales</span>
                        <span className="text-slate-300 font-medium">{plan.max_sucursales === 0 ? '∞' : plan.max_sucursales}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Centro de Detalles de Planes */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md mb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-16 translate-x-16"></div>
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="text-2xl font-bold text-white flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Package className="h-6 w-6 text-purple-400" />
            </div>
            <span>Centro de Detalles de Planes</span>
          </CardTitle>
          <CardDescription className="text-slate-300 text-lg mt-2">
            Información completa de cada plan disponible
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-8">
            {plans.map((plan) => (
              <div key={plan.id_plan} className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/50 rounded-xl p-8 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -translate-y-12 translate-x-12"></div>
                <div className="relative z-10">
                  {/* Header del Plan */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors duration-300">
                        {getPlanIcon(plan.nombre)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{plan.nombre}</h3>
                        <p className="text-slate-300 mt-1">{plan.descripcion}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-white">${plan.precio_mensual}</p>
                      <p className="text-slate-400">por mes</p>
                      {plan.precio_anual && (
                        <p className="text-sm text-green-400 mt-1">
                          ${plan.precio_anual} anual (${Math.round(plan.precio_anual / 12)}/mes)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contenido del Plan */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Límites de Recursos */}
                    <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
                      <h4 className="font-semibold text-white mb-4 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Límites de Recursos</span>
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Users className="h-5 w-5 text-blue-400" />
                            <span className="text-slate-300">Usuarios</span>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {plan.max_usuarios === 0 ? 'Ilimitado' : plan.max_usuarios}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Building2 className="h-5 w-5 text-green-400" />
                            <span className="text-slate-300">Sucursales</span>
                          </div>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            {plan.max_sucursales === 0 ? 'Ilimitado' : plan.max_sucursales}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Package className="h-5 w-5 text-purple-400" />
                            <span className="text-slate-300">Productos</span>
                          </div>
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                            {plan.max_productos === 0 ? 'Ilimitado' : plan.max_productos}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <BarChart3 className="h-5 w-5 text-amber-400" />
                            <span className="text-slate-300">Transacciones/mes</span>
                          </div>
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                            {plan.max_transacciones_mes === 0 ? 'Ilimitado' : plan.max_transacciones_mes.toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Funcionalidades Incluidas */}
                    <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
                      <h4 className="font-semibold text-white mb-4 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Funcionalidades Incluidas</span>
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {formatFuncionalidades(plan.funcionalidades).map((feature, index) => (
                          <Badge key={index} className="bg-slate-600/50 text-slate-300 border-slate-500/50 hover:bg-slate-600/70 transition-colors duration-200">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer del Plan */}
                  <div className="mt-6 pt-6 border-t border-slate-600/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                        <span className="text-slate-300">
                          {getRestaurantCountByPlan(plan.nombre)} restaurantes usando este plan
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={`${plan.activo ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                          {plan.activo ? '✅ Activo' : '❌ Inactivo'}
                        </Badge>
                        <div className={`w-3 h-3 rounded-full ${plan.activo ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Centro de Restaurantes por Plan */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-16 translate-x-16"></div>
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="text-2xl font-bold text-white flex items-center space-x-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Building2 className="h-6 w-6 text-green-400" />
            </div>
            <span>Centro de Restaurantes por Plan</span>
          </CardTitle>
          <CardDescription className="text-slate-300 text-lg mt-2">
            Lista de restaurantes agrupados por su plan actual
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-8">
            {plans.map((plan) => {
              const restaurantsInPlan = restaurantsWithPlans.filter(r => r.plan_nombre?.toLowerCase() === plan.nombre.toLowerCase());
              
              if (restaurantsInPlan.length === 0) return null;

              return (
                <div key={plan.id_plan} className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/50 rounded-xl p-6 hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -translate-y-10 translate-x-10"></div>
                  <div className="relative z-10">
                    {/* Header del Plan */}
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors duration-300">
                        {getPlanIcon(plan.nombre)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{plan.nombre}</h3>
                        <p className="text-slate-300">Plan de suscripción</p>
                      </div>
                      <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50">
                        {restaurantsInPlan.length} restaurantes
                      </Badge>
                    </div>
                    
                    {/* Grid de Restaurantes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {restaurantsInPlan.map((restaurant) => (
                        <div key={restaurant.id_restaurante} className="group/restaurant relative overflow-hidden bg-slate-700/30 border border-slate-600/50 rounded-xl p-4 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full -translate-y-8 translate-x-8"></div>
                          <div className="relative z-10">
                            {/* Header del Restaurante */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                                  <Building2 className="h-4 w-4 text-blue-400" />
                                </div>
                                <h4 className="font-semibold text-white group-hover/restaurant:text-blue-300 transition-colors">{restaurant.nombre}</h4>
                              </div>
                              <Badge 
                                className={
                                  restaurant.suscripcion_estado === 'activa' 
                                    ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                                }
                              >
                                {restaurant.suscripcion_estado === 'activa' ? '✅ Activa' : '❌ Inactiva'}
                              </Badge>
                            </div>
                            
                            {/* Detalles del Restaurante */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-2 bg-slate-600/30 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <Users className="h-4 w-4 text-blue-400" />
                                  <span className="text-slate-400 text-sm">Usuarios</span>
                                </div>
                                <span className="text-slate-300 font-medium">{restaurant.usuarios_count}</span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-slate-600/30 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <Package className="h-4 w-4 text-purple-400" />
                                  <span className="text-slate-400 text-sm">Productos</span>
                                </div>
                                <span className="text-slate-300 font-medium">{restaurant.productos_count}</span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-slate-600/30 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <Building2 className="h-4 w-4 text-green-400" />
                                  <span className="text-slate-400 text-sm">Sucursales</span>
                                </div>
                                <span className="text-slate-300 font-medium">{restaurant.sucursales_count}</span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-slate-600/30 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4 text-amber-400" />
                                  <span className="text-slate-400 text-sm">Vence</span>
                                </div>
                                <span className="text-slate-300 font-medium">{new Date(restaurant.fecha_fin).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanManagement; 