
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
  Building2,
  FileDown,
  Plus
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { apiFetch } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/components/ui/use-toast";

type Restaurante = {
  id_restaurante: number;
  nombre: string;
};

type Servicio = {
  id: number;
  id_restaurante: number;
  nombre_plan: string;
  descripcion_plan?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  estado_suscripcion?: string | null; // 'activo' | 'vencido' | 'prueba' | 'suspendido' | etc
  precio_mensual?: number | null;
  funcionalidades_json?: Record<string, unknown> | null;
};

type Pago = {
  id: number;
  id_restaurante: number;
  monto: number;
  fecha_pago: string;
};

type PagosEstadoResponse = {
  restaurante: { id_restaurante: number; nombre: string; activo: boolean };
  ultimo_pago: Pago | null;
};

type SubscriptionRow = {
  id: number;
  restaurantId: number;
  restaurantName: string;
  plan: string;
  price: number;
  status: 'active' | 'expired' | 'trial' | 'suspended' | 'unknown';
  paymentStatus: 'paid' | 'pending' | 'overdue' | 'trial' | 'unknown';
  lastPayment?: string | null;
  endDate?: string | null;
  daysUntilExpiry: number;
  autoRenew: boolean;
  totalPaid: number;
};

export const SubscriptionControl: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  const [paymentsModal, setPaymentsModal] = useState<{ open: boolean; rows: Pago[]; restaurantName?: string }>(() => ({ open: false, rows: [] }));

  // Estado para nueva suscripción
  const [newSubOpen, setNewSubOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState({
    nombre: '',
    direccion: '',
    ciudad: '',
    telefono: '',
    email: ''
  });
  const [serviceForm, setServiceForm] = useState({
    nombre_plan: 'Estándar',
    descripcion_plan: '',
    precio_mensual: 0,
    estado_suscripcion: 'activo',
    fecha_fin: '' // yyyy-mm-dd
  });

  const resetNewSubForms = () => {
    setRestaurantForm({ nombre: '', direccion: '', ciudad: '', telefono: '', email: '' });
    setServiceForm({ nombre_plan: 'Estándar', descripcion_plan: '', precio_mensual: 0, estado_suscripcion: 'activo', fecha_fin: '' });
  };

  const loadSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const headersToken = token || undefined;
      const restaurantesRes = await apiFetch<{ data: Restaurante[] }>(`/restaurantes`, {}, headersToken);
      const restaurantes = restaurantesRes.data || [];
      const rows: SubscriptionRow[] = [];
      const batchSize = 5;
      for (let i = 0; i < restaurantes.length; i += batchSize) {
        const batch = restaurantes.slice(i, i + batchSize);
        const batchPromises = batch.map(async (r) => {
          const serviciosRes = await apiFetch<{ data: Servicio[] }>(`/restaurantes/${r.id_restaurante}/servicios`, {}, headersToken);
          const servicios = serviciosRes.data || [];
          const pagosEstado = await apiFetch<PagosEstadoResponse>(`/pagos/estado/${r.id_restaurante}`, {}, headersToken);
          const pagosList = await apiFetch<{ data: Pago[] }>(`/pagos/${r.id_restaurante}`, {}, headersToken);
          const totalPaid = (pagosList.data || []).reduce((sum, p) => sum + (p.monto || 0), 0);
          const lastPayment = pagosEstado.ultimo_pago?.fecha_pago || null;
          servicios.forEach((s) => {
            const statusMap: Record<string, SubscriptionRow['status']> = {
              'activo': 'active',
              'vencido': 'expired',
              'prueba': 'trial',
              'suspendido': 'suspended'
            };
            const status: SubscriptionRow['status'] = statusMap[s.estado_suscripcion || ''] || 'unknown';
            let paymentStatus: SubscriptionRow['paymentStatus'] = 'unknown';
            if (status === 'trial') paymentStatus = 'trial';
            else if (lastPayment) {
              const last = new Date(lastPayment).getTime();
              const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
              paymentStatus = days <= 35 ? 'paid' : 'overdue';
            } else {
              paymentStatus = status === 'active' ? 'overdue' : 'pending';
            }
            let daysUntilExpiry = 0;
            if (s.fecha_fin) {
              const diff = (new Date(s.fecha_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
              daysUntilExpiry = Math.ceil(diff);
            }
            rows.push({
              id: s.id,
              restaurantId: r.id_restaurante,
              restaurantName: r.nombre,
              plan: s.nombre_plan,
              price: Number(s.precio_mensual || 0),
              status,
              paymentStatus,
              lastPayment,
              endDate: s.fecha_fin || null,
              daysUntilExpiry,
              autoRenew: false,
              totalPaid
            });
          });
        });
        await Promise.all(batchPromises);
      }
      setSubscriptions(rows);
    } catch (err: any) {
      setError(err.message || 'Error al cargar suscripciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadSubscriptions();
  }, [token]);

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

  const totalRevenue = subscriptions.reduce((sum, sub) => sum + (Number(sub.totalPaid) || 0), 0);
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
  const expiringCount = subscriptions.filter(sub => sub.daysUntilExpiry <= 7 && sub.daysUntilExpiry > 0).length;
  const overdueCount = subscriptions.filter(sub => sub.paymentStatus === 'overdue' || sub.status === 'expired').length;

  const exportCsv = () => {
    const header = ['Restaurante','Plan','Estado','Pago','Vence','Ingresos'];
    const lines = subscriptions.map((s:any) => [
      s.restaurantName,
      s.plan,
      s.status,
      s.paymentStatus,
      s.endDate || '',
      String(s.totalPaid || 0)
    ]);
    const csv = [header, ...lines].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'suscripciones.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVerPagos = async (restaurantId: number, restaurantName: string) => {
    try {
      const pagosList = await apiFetch<{ data: Pago[] }>(`/pagos/${restaurantId}`, {}, token || undefined);
      setPaymentsModal({ open: true, rows: pagosList.data || [], restaurantName });
    } catch (e:any) {
      toast({ title: 'Error', description: e.message || 'No se pudieron cargar los pagos.' });
    }
  };

  const handleSuspender = async (restaurantId: number) => {
    try {
      // Suspender restaurante (activo=false)
      await apiFetch(`/pagos/suspender-activar/${restaurantId}`, {
        method: 'PATCH',
        body: JSON.stringify({ activo: false })
      }, token || undefined);
      toast({ title: 'Listo', description: 'Restaurante suspendido.' });
      // refrescar
      (async () => {
        const t = token || undefined;
        const restaurantesRes = await apiFetch<{ data: Restaurante[] }>(`/restaurantes`, {}, t);
        // Reutilizar lógica de fetch para mantener consistencia
      })();
    } catch (e:any) {
      toast({ title: 'Error', description: e.message || 'No se pudo suspender.' });
    }
  };

  const handleActivar = async (restaurantId: number) => {
    try {
      await apiFetch(`/pagos/suspender-activar/${restaurantId}`, {
        method: 'PATCH',
        body: JSON.stringify({ activo: true })
      }, token || undefined);
      toast({ title: 'Listo', description: 'Restaurante activado.' });
    } catch (e:any) {
      toast({ title: 'Error', description: e.message || 'No se pudo activar.' });
    }
  };

  const handleExtenderPrueba = async (restaurantId: number, serviceId: number) => {
    try {
      // Extiende fecha_fin 14 días desde hoy
      const fecha_fin = new Date(Date.now() + 14*24*60*60*1000).toISOString();
      await apiFetch(`/restaurantes/${restaurantId}/servicios/${serviceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ estado_suscripcion: 'prueba', fecha_fin })
      }, token || undefined);
      toast({ title: 'Listo', description: 'Prueba extendida 14 días.' });
    } catch (e:any) {
      toast({ title: 'Error', description: e.message || 'No se pudo extender la prueba.' });
    }
  };

  const handleRenovar = async (restaurantId: number, serviceId: number, price: number) => {
    try {
      await apiFetch(`/pagos/registrar`, {
        method: 'POST',
        body: JSON.stringify({ id_restaurante: restaurantId, monto: price, metodo_pago: 'manual', observaciones: 'Renovación desde panel' })
      }, token || undefined);
      const nuevaFechaFin = new Date(Date.now() + 30*24*60*60*1000).toISOString();
      await apiFetch(`/restaurantes/${restaurantId}/servicios/${serviceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ estado_suscripcion: 'activo', fecha_fin: nuevaFechaFin })
      }, token || undefined);
      toast({ title: 'Listo', description: 'Suscripción renovada.' });
      loadSubscriptions();
    } catch (e:any) {
      toast({ title: 'Error', description: e.message || 'No se pudo renovar.' });
    }
  };

  const handleCreateSubscription = async () => {
    try {
      if (!restaurantForm.nombre || !restaurantForm.direccion || !restaurantForm.ciudad) {
        toast({ title: 'Validación', description: 'Nombre, dirección y ciudad son obligatorios.' });
        return;
      }
      if (!serviceForm.nombre_plan) {
        toast({ title: 'Validación', description: 'El nombre del plan es obligatorio.' });
        return;
      }
      setCreating(true);
      // Crear restaurante
      const resto = await apiFetch<{ data?: any; id_restaurante?: number }>(`/restaurantes`, {
        method: 'POST',
        body: JSON.stringify(restaurantForm)
      }, token || undefined);
      const newRestaurantId = (resto as any)?.data?.id_restaurante || (resto as any)?.id_restaurante;
      if (!newRestaurantId) {
        throw new Error('No se obtuvo el ID del restaurante creado.');
      }
      // Crear servicio (suscripción)
      const payload: any = {
        nombre_plan: serviceForm.nombre_plan,
        descripcion_plan: serviceForm.descripcion_plan || undefined,
        precio_mensual: Number(serviceForm.precio_mensual) || 0,
        estado_suscripcion: serviceForm.estado_suscripcion,
      };
      if (serviceForm.fecha_fin) {
        const iso = new Date(serviceForm.fecha_fin + 'T00:00:00').toISOString();
        payload.fecha_fin = iso;
      }
      await apiFetch(`/restaurantes/${newRestaurantId}/servicios`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }, token || undefined);

      toast({ title: 'Listo', description: 'Restaurante y suscripción creados.' });
      setNewSubOpen(false);
      resetNewSubForms();
      loadSubscriptions();
    } catch (e:any) {
      // Si el restaurante ya existe (409), intentar recuperar su id y solo crear servicio
      if (String(e.message || '').toLowerCase().includes('ya existe') || String(e.message||'').includes('409')) {
        try {
          const list = await apiFetch<{ data: Restaurante[] }>(`/restaurantes?search=${encodeURIComponent(restaurantForm.nombre)}`, {}, token || undefined);
          const found = (list.data || []).find(r => r.nombre.toLowerCase() === restaurantForm.nombre.toLowerCase());
          if (!found) throw new Error('No se pudo recuperar el restaurante existente.');
          const payload: any = {
            nombre_plan: serviceForm.nombre_plan,
            descripcion_plan: serviceForm.descripcion_plan || undefined,
            precio_mensual: Number(serviceForm.precio_mensual) || 0,
            estado_suscripcion: serviceForm.estado_suscripcion,
          };
          if (serviceForm.fecha_fin) {
            const iso = new Date(serviceForm.fecha_fin + 'T00:00:00').toISOString();
            payload.fecha_fin = iso;
          }
          await apiFetch(`/restaurantes/${found.id_restaurante}/servicios`, { method: 'POST', body: JSON.stringify(payload) }, token || undefined);
          toast({ title: 'Listo', description: 'Suscripción creada para restaurante existente.' });
          setNewSubOpen(false);
          resetNewSubForms();
          loadSubscriptions();
          return;
        } catch (inner:any) {
          toast({ title: 'Error', description: inner.message || 'No se pudo crear la suscripción.' });
          return;
        }
      }
      toast({ title: 'Error', description: e.message || 'No se pudo crear la suscripción.' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {loading && (
        <div className="text-center text-slate-600">Cargando suscripciones...</div>
      )}
      {error && (
        <div className="text-center text-red-600">{error}</div>
      )}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">{subscriptions.length} registros</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <FileDown className="h-4 w-4 mr-2"/> Exportar CSV
          </Button>
          <Button size="sm" onClick={() => setNewSubOpen(true)}>
            <Plus className="h-4 w-4 mr-2"/> Nueva Suscripción
          </Button>
        </div>
      </div>
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
                {filteredSubscriptions.map((subscription:any) => (
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
                          <p className="text-xs text-red-500">{Math.abs(subscription.daysUntilExpiry)} días vencido</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">${(subscription.totalPaid||0).toLocaleString()}</p>
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
                          <DropdownMenuItem onClick={() => handleRenovar(subscription.restaurantId, subscription.id, subscription.price)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Renovar Suscripción
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVerPagos(subscription.restaurantId, subscription.restaurantName)}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Ver Historial de Pagos
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExtenderPrueba(subscription.restaurantId, subscription.id)}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Extender Prueba (14 días)
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleSuspender(subscription.restaurantId)}>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Suspender Restaurante
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleActivar(subscription.restaurantId)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Activar Restaurante
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

      {/* Modal Nueva Suscripción */}
      <Dialog open={newSubOpen} onOpenChange={setNewSubOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nueva Suscripción</DialogTitle>
            <DialogDescription>Registra un nuevo restaurante y su plan inicial</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Datos del Restaurante</CardTitle>
                <CardDescription>Información básica</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm">Nombre</label>
                  <Input value={restaurantForm.nombre} onChange={(e) => setRestaurantForm({ ...restaurantForm, nombre: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Dirección</label>
                  <Input value={restaurantForm.direccion} onChange={(e) => setRestaurantForm({ ...restaurantForm, direccion: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Ciudad</label>
                  <Input value={restaurantForm.ciudad} onChange={(e) => setRestaurantForm({ ...restaurantForm, ciudad: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm">Teléfono</label>
                    <Input value={restaurantForm.telefono} onChange={(e) => setRestaurantForm({ ...restaurantForm, telefono: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">Email</label>
                    <Input type="email" value={restaurantForm.email} onChange={(e) => setRestaurantForm({ ...restaurantForm, email: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan de Suscripción</CardTitle>
                <CardDescription>Configura el plan inicial</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm">Nombre del plan</label>
                  <Input value={serviceForm.nombre_plan} onChange={(e) => setServiceForm({ ...serviceForm, nombre_plan: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Precio mensual (USD)</label>
                  <Input type="number" value={serviceForm.precio_mensual} onChange={(e) => setServiceForm({ ...serviceForm, precio_mensual: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Estado</label>
                  <Select value={serviceForm.estado_suscripcion} onValueChange={(v) => setServiceForm({ ...serviceForm, estado_suscripcion: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="prueba">Prueba</SelectItem>
                      <SelectItem value="suspendido">Suspendido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Fin de periodo (opcional)</label>
                  <Input type="date" value={serviceForm.fecha_fin} onChange={(e) => setServiceForm({ ...serviceForm, fecha_fin: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Descripción (opcional)</label>
                  <Input value={serviceForm.descripcion_plan} onChange={(e) => setServiceForm({ ...serviceForm, descripcion_plan: e.target.value })} />
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNewSubOpen(false); }} disabled={creating}>Cancelar</Button>
            <Button onClick={handleCreateSubscription} disabled={creating}>{creating ? 'Creando...' : 'Crear Suscripción'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentsModal.open} onOpenChange={(open) => setPaymentsModal(p => ({ ...p, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagos - {paymentsModal.restaurantName}</DialogTitle>
            <DialogDescription>Historial de pagos registrados</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[50vh] overflow-auto">
            {paymentsModal.rows.length === 0 && (
              <div className="text-sm text-slate-600">Sin pagos registrados.</div>
            )}
            {paymentsModal.rows.map((p) => (
              <div key={p.id} className="flex items-center justify-between border rounded p-2 text-sm">
                <span>{new Date(p.fecha_pago).toLocaleString()}</span>
                <span className="font-medium">${p.monto}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentsModal(p => ({ ...p, open: false }))}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
