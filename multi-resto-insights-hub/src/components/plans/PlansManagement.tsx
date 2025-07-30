
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Zap
} from "lucide-react";

export const PlansManagement: React.FC = () => {
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const plansData = [
    {
      id: 1,
      business: "Sucursal Centro",
      plan: "Premium",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      status: "active",
      daysRemaining: 45,
      features: ["POS Avanzado", "Análisis Premium", "Soporte 24/7"],
      price: 299,
      usage: 78,
      transactions: 2450,
      limit: 5000
    },
    {
      id: 2,
      business: "Sucursal Norte",
      plan: "Básico",
      startDate: "2024-03-15",
      endDate: "2024-09-15",
      status: "expiring_soon",
      daysRemaining: 7,
      features: ["POS Básico", "Reportes Simples"],
      price: 99,
      usage: 65,
      transactions: 890,
      limit: 1500
    },
    {
      id: 3,
      business: "Sucursal Sur",
      plan: "Empresarial",
      startDate: "2024-02-01",
      endDate: "2025-02-01",
      status: "active",
      daysRemaining: 120,
      features: ["POS Enterprise", "Analytics AI", "API Access", "White Label"],
      price: 599,
      usage: 42,
      transactions: 3200,
      limit: 10000
    },
    {
      id: 4,
      business: "Sucursal Este",
      plan: "Premium",
      startDate: "2023-12-01",
      endDate: "2024-12-01",
      status: "expired",
      daysRemaining: -5,
      features: ["POS Avanzado", "Análisis Premium", "Soporte 24/7"],
      price: 299,
      usage: 95,
      transactions: 4800,
      limit: 5000
    },
    {
      id: 5,
      business: "Sucursal Oeste",
      plan: "Básico",
      startDate: "2024-06-01",
      endDate: "2024-12-01",
      status: "warning",
      daysRemaining: 1,
      features: ["POS Básico", "Reportes Simples"],
      price: 99,
      usage: 88,
      transactions: 1320,
      limit: 1500
    }
  ];

  const planTypes = [
    {
      name: "Básico",
      price: 99,
      color: "bg-green-500",
      features: [
        "POS Básico",
        "Hasta 1,500 transacciones/mes",
        "Reportes básicos",
        "Soporte por email"
      ]
    },
    {
      name: "Premium",
      price: 299,
      color: "bg-blue-500",
      features: [
        "POS Avanzado",
        "Hasta 5,000 transacciones/mes",
        "Análisis avanzado",
        "Soporte 24/7",
        "Inventario automático"
      ]
    },
    {
      name: "Empresarial",
      price: 599,
      color: "bg-purple-500",
      features: [
        "POS Enterprise",
        "Transacciones ilimitadas",
        "Analytics con IA",
        "API Access completo",
        "White Label",
        "Gerente de cuenta dedicado"
      ]
    }
  ];

  const filteredPlans = plansData.filter(plan => {
    const matchesPlan = filterPlan === 'all' || plan.plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
    return matchesPlan && matchesStatus;
  });

  const getStatusBadge = (status: string, daysRemaining: number) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'expiring_soon':
        return <Badge className="bg-yellow-500">Vence Pronto</Badge>;
      case 'warning':
        return <Badge className="bg-orange-500">Crítico</Badge>;
      case 'expired':
        return <Badge variant="destructive">Vencido</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expiring_soon':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const renewPlan = (planId: number) => {
    console.log(`Renovando plan ${planId}`);
    // Aquí iría la lógica de renovación
  };

  const upgradePlan = (planId: number) => {
    console.log(`Actualizando plan ${planId}`);
    // Aquí iría la lógica de actualización
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestión de Planes</h2>
          <p className="text-slate-600">Monitorea y administra los planes de suscripción</p>
        </div>
      </div>

      {/* Alertas */}
      <div className="space-y-3">
        {plansData.filter(p => p.status === 'expired' || p.status === 'warning').map(plan => (
          <Alert key={plan.id} variant={plan.status === 'expired' ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{plan.business}</strong> - 
              {plan.status === 'expired' 
                ? ` Plan vencido hace ${Math.abs(plan.daysRemaining)} días`
                : ` Plan vence en ${plan.daysRemaining} día${plan.daysRemaining !== 1 ? 's' : ''}`
              }
              <Button size="sm" className="ml-2" onClick={() => renewPlan(plan.id)}>
                Renovar Ahora
              </Button>
            </AlertDescription>
          </Alert>
        ))}
      </div>

      {/* Resumen de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planes Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {plansData.filter(p => p.status === 'active').length}
            </div>
            <p className="text-xs text-slate-500">De {plansData.length} total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos a Vencer</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {plansData.filter(p => p.status === 'expiring_soon' || p.status === 'warning').length}
            </div>
            <p className="text-xs text-slate-500">En los próximos 30 días</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planes Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {plansData.filter(p => p.status === 'expired').length}
            </div>
            <p className="text-xs text-slate-500">Requieren renovación</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${plansData.reduce((sum, plan) => sum + plan.price, 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">Recurrente mensual</p>
          </CardContent>
        </Card>
      </div>

      {/* Tipos de Planes Disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Planes Disponibles</CardTitle>
          <CardDescription>Características y precios de cada plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planTypes.map((plan, index) => (
              <Card key={index} className="relative overflow-hidden">
                <div className={`h-2 ${plan.color}`} />
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{plan.name}</span>
                    <Badge variant="outline">${plan.price}/mes</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Plan</label>
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los planes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los planes</SelectItem>
                  <SelectItem value="Básico">Básico</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Empresarial">Empresarial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="expiring_soon">Próximo a vencer</SelectItem>
                  <SelectItem value="warning">Crítico</SelectItem>
                  <SelectItem value="expired">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Planes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Suscripciones</CardTitle>
          <CardDescription>
            {filteredPlans.length} de {plansData.length} suscripciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negocio</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="font-medium">{plan.business}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {plan.plan === 'Básico' && <Package className="h-4 w-4 text-green-500" />}
                      {plan.plan === 'Premium' && <Shield className="h-4 w-4 text-blue-500" />}
                      {plan.plan === 'Empresarial' && <Zap className="h-4 w-4 text-purple-500" />}
                      <span className="font-medium">{plan.plan}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(plan.status)}
                      {getStatusBadge(plan.status, plan.daysRemaining)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3" />
                        <span>{plan.startDate} - {plan.endDate}</span>
                      </div>
                      <div className="text-slate-500 mt-1">
                        {plan.daysRemaining > 0 
                          ? `${plan.daysRemaining} días restantes`
                          : `Vencido hace ${Math.abs(plan.daysRemaining)} días`
                        }
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="text-sm">
                        {plan.transactions.toLocaleString()} / {plan.limit.toLocaleString()} transacciones
                      </div>
                      <Progress value={plan.usage} className="h-2" />
                      <div className="text-xs text-slate-500">{plan.usage}% utilizado</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">${plan.price}/mes</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {(plan.status === 'expired' || plan.status === 'warning' || plan.status === 'expiring_soon') && (
                        <Button size="sm" onClick={() => renewPlan(plan.id)}>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Renovar
                        </Button>
                      )}
                      {plan.plan !== 'Empresarial' && (
                        <Button size="sm" variant="outline" onClick={() => upgradePlan(plan.id)}>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Upgrade
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
