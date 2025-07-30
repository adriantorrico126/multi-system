
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export const SubscriptionControl: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // useEffect(() => {
  //   const fetchSubscriptions = async () => {
  //     setLoading(true);
  //     setError(null);
  //     try {
  //       const data = await apiFetch<any[]>('/suscripciones', {}, token || undefined);
  //       setSubscriptions(data);
  //     } catch (err: any) {
  //       setError(err.message || 'Error al cargar suscripciones.');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   if (token) fetchSubscriptions();
  // }, [token]);

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.restaurantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string, daysUntilExpiry: number) => {
    switch (status) {
      case 'active':
        if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
          return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Vence Pronto</Badge>;
        }
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>;
      case 'expired':
        return <Badge variant="destructive">Vencido</Badge>;
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Prueba</Badge>;
      case 'suspended':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Suspendido</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Pagado</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pendiente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Vencido</Badge>;
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Prueba</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const totalRevenue = subscriptions.reduce((sum, sub) => sum + sub.totalPaid, 0);
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
  const expiringCount = subscriptions.filter(sub => sub.daysUntilExpiry <= 7 && sub.daysUntilExpiry > 0).length;
  const overdueCount = subscriptions.filter(sub => sub.paymentStatus === 'overdue' || sub.status === 'expired').length;

  return (
    <div className="space-y-6">
      <div className="text-center text-red-600">La funcionalidad de suscripciones no está disponible en este sistema.</div>
      {/* Estadísticas de Suscripciones */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Suscripciones Activas</p>
                <p className="text-2xl font-bold text-green-600">{activeSubscriptions}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Vencen Pronto</p>
                <p className="text-2xl font-bold text-amber-600">{expiringCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pagos Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Vencimiento */}
      {expiringCount > 0 && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Suscripciones por Vencer</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              {expiringCount} suscripciones vencen en los próximos 7 días. Revisa y contacta a los restaurantes para renovar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Control de Suscripciones */}
      <Card>
        <CardHeader>
          <CardTitle>Control de Suscripciones - Plan Estándar</CardTitle>
          <CardDescription>Gestiona las suscripciones de todos los restaurantes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar restaurante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="expired">Vencido</SelectItem>
                <SelectItem value="trial">Prueba</SelectItem>
                <SelectItem value="suspended">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabla de Suscripciones */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurante</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Ingresos</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{subscription.restaurantName}</p>
                        <p className="text-sm text-gray-500">ID: {subscription.restaurantId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline">{subscription.plan}</Badge>
                        <p className="text-sm text-gray-500">${subscription.price}/mes</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(subscription.status, subscription.daysUntilExpiry)}
                        {subscription.autoRenew && (
                          <p className="text-xs text-green-600 flex items-center">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Auto-renovación
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getPaymentBadge(subscription.paymentStatus)}
                        {subscription.lastPayment && (
                          <p className="text-xs text-gray-500">
                            Último: {subscription.lastPayment}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">{subscription.endDate}</p>
                        {subscription.daysUntilExpiry > 0 ? (
                          <p className="text-xs text-gray-500">{subscription.daysUntilExpiry} días restantes</p>
                        ) : (
                          <p className="text-xs text-red-500">Vencido hace {Math.abs(subscription.daysUntilExpiry)} días</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">${subscription.totalPaid.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Total pagado</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Acciones
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Renovar Suscripción
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Ver Historial de Pagos
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="mr-2 h-4 w-4" />
                            Extender Prueba
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Suspender
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
