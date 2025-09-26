
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
  Plus,
  Shield
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
  usageStats?: {
    sucursales?: { actual: number; limite: number; porcentaje: number; estado: string };
    usuarios?: { actual: number; limite: number; porcentaje: number; estado: string };
    productos?: { actual: number; limite: number; porcentaje: number; estado: string };
    transacciones?: { actual: number; limite: number; porcentaje: number; estado: string };
  };
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
    nombre_plan: 'basico',
    descripcion_plan: '',
    precio_mensual: 19,
    estado_suscripcion: 'activo',
    fecha_fin: '' // yyyy-mm-dd
  });

  const resetNewSubForms = () => {
    setRestaurantForm({ nombre: '', direccion: '', ciudad: '', telefono: '', email: '' });
    setServiceForm({ nombre_plan: 'basico', descripcion_plan: '', precio_mensual: 19, estado_suscripcion: 'activo', fecha_fin: '' });
  };

  const loadSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const headersToken = token || undefined;
      
      // Usar la nueva API de planes para obtener restaurantes con sus planes
      const restaurantesConPlanesRes = await apiFetch<{ data: any[] }>(`/planes/restaurantes/listado`, {}, headersToken);
      const restaurantesConPlanes = restaurantesConPlanesRes.data || [];
      
      const rows: SubscriptionRow[] = [];
      
      // Procesar cada restaurante con su plan
      for (const restaurante of restaurantesConPlanes) {
        try {
          // Obtener estadísticas de uso del restaurante
          const usoRes = await apiFetch<{ data: any }>(`/planes/restaurante/${restaurante.id_restaurante}/uso`, {}, headersToken);
          const uso = usoRes.data || {};
          
          // Obtener historial de pagos
          const pagosList = await apiFetch<{ data: Pago[] }>(`/pagos/${restaurante.id_restaurante}`, {}, headersToken);
          const totalPaid = (pagosList.data || []).reduce((sum, p) => sum + (p.monto || 0), 0);
          
          // Determinar estado de la suscripción
          const statusMap: Record<string, SubscriptionRow['status']> = {
            'activa': 'active',
            'expirada': 'expired',
            'suspendida': 'suspended',
            'cancelada': 'expired'
          };
          const status: SubscriptionRow['status'] = statusMap[restaurante.suscripcion_estado || ''] || 'unknown';
          
          // Determinar estado de pago
          let paymentStatus: SubscriptionRow['paymentStatus'] = 'unknown';
          if (status === 'active') {
            paymentStatus = 'paid';
          } else if (status === 'expired') {
            paymentStatus = 'overdue';
          } else if (status === 'suspended') {
            paymentStatus = 'overdue';
          }
          
          // Calcular días hasta vencimiento
          let daysUntilExpiry = 0;
          if (restaurante.fecha_fin) {
            const diff = (new Date(restaurante.fecha_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
            daysUntilExpiry = Math.ceil(diff);
          }
          
          rows.push({
            id: restaurante.id_restaurante,
            restaurantId: restaurante.id_restaurante,
            restaurantName: restaurante.nombre,
            plan: restaurante.plan_nombre || 'Sin plan',
            price: Number(restaurante.precio_mensual || 0),
            status,
            paymentStatus,
            lastPayment: null, // Se puede obtener del historial de pagos si es necesario
            endDate: restaurante.fecha_fin || null,
            daysUntilExpiry,
            autoRenew: false,
            totalPaid,
            // Información adicional de uso
            usageStats: uso.uso || {}
          });
        } catch (err) {
          console.error(`Error procesando restaurante ${restaurante.id_restaurante}:`, err);
          // Continuar con el siguiente restaurante
        }
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
      // Registrar el pago
      await apiFetch(`/pagos/registrar`, {
        method: 'POST',
        body: JSON.stringify({ id_restaurante: restaurantId, monto: price, metodo_pago: 'manual', observaciones: 'Renovación desde panel' })
      }, token || undefined);
      
      // Obtener el plan actual del restaurante
      const suscripcionRes = await apiFetch<{ data: any }>(`/planes/restaurante/${restaurantId}/suscripcion`, {}, token || undefined);
      const suscripcion = suscripcionRes.data;
      
      if (suscripcion && suscripcion.id_plan) {
        // Cambiar al mismo plan para renovar (esto extenderá la fecha)
        await apiFetch(`/planes/restaurante/${restaurantId}/cambiar-plan`, {
          method: 'POST',
          body: JSON.stringify({ 
            id_plan_nuevo: suscripcion.id_plan, 
            motivo: 'Renovación desde panel de administración' 
          })
        }, token || undefined);
      }
      
      toast({ title: 'Listo', description: 'Suscripción renovada.' });
      loadSubscriptions();
    } catch (e:any) {
      toast({ title: 'Error', description: e.message || 'No se pudo renovar.' });
    }
  };

  const handleCambiarPlan = async (restaurantId: number, nuevoPlan: string) => {
    try {
      // Obtener todos los planes disponibles para encontrar el ID del plan
      const planesRes = await apiFetch<{ data: any[] }>(`/planes`, {}, token || undefined);
      const planes = planesRes.data || [];
      const planSeleccionado = planes.find(p => p.nombre.toLowerCase() === nuevoPlan.toLowerCase());
      
      if (!planSeleccionado) {
        throw new Error(`No se encontró el plan "${nuevoPlan}". Planes disponibles: ${planes.map(p => p.nombre).join(', ')}`);
      }
      
      // Cambiar el plan del restaurante
      await apiFetch(`/planes/restaurante/${restaurantId}/cambiar-plan`, {
        method: 'POST',
        body: JSON.stringify({ 
          id_plan_nuevo: planSeleccionado.id_plan,
          motivo: 'Cambio de plan desde panel de administración'
        })
      }, token || undefined);
      
      toast({ title: 'Listo', description: `Plan cambiado a ${nuevoPlan}.` });
      loadSubscriptions();
    } catch (e:any) {
      toast({ title: 'Error', description: e.message || 'No se pudo cambiar el plan.' });
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
      
      // Obtener todos los planes disponibles para encontrar el ID del plan
      const planesRes = await apiFetch<{ data: any[] }>(`/planes`, {}, token || undefined);
      const planes = planesRes.data || [];
      const planSeleccionado = planes.find(p => p.nombre.toLowerCase() === serviceForm.nombre_plan.toLowerCase());
      
      if (!planSeleccionado) {
        throw new Error(`No se encontró el plan "${serviceForm.nombre_plan}". Planes disponibles: ${planes.map(p => p.nombre).join(', ')}`);
      }
      
      // Crear suscripción usando la nueva API
      await apiFetch(`/planes/restaurante/${newRestaurantId}/cambiar-plan`, {
        method: 'POST',
        body: JSON.stringify({ 
          id_plan_nuevo: planSeleccionado.id_plan,
          motivo: 'Nueva suscripción creada desde panel de administración'
        })
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
          
          // Obtener todos los planes disponibles para encontrar el ID del plan
          const planesRes = await apiFetch<{ data: any[] }>(`/planes`, {}, token || undefined);
          const planes = planesRes.data || [];
          const planSeleccionado = planes.find(p => p.nombre.toLowerCase() === serviceForm.nombre_plan.toLowerCase());
          
          if (!planSeleccionado) {
            throw new Error(`No se encontró el plan "${serviceForm.nombre_plan}". Planes disponibles: ${planes.map(p => p.nombre).join(', ')}`);
          }
          
          // Crear suscripción usando la nueva API
          await apiFetch(`/planes/restaurante/${found.id_restaurante}/cambiar-plan`, {
            method: 'POST',
            body: JSON.stringify({ 
              id_plan_nuevo: planSeleccionado.id_plan,
              motivo: 'Nueva suscripción creada desde panel de administración'
            })
          }, token || undefined);
          
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header del Sistema de Suscripciones */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Centro de Control de Suscripciones
            </h1>
            <p className="text-slate-300 text-lg">
              Sistema avanzado de gestión de suscripciones y facturación
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-slate-400">Última actualización</p>
              <p className="text-white font-semibold">{new Date().toLocaleTimeString()}</p>
            </div>
            <Button
              onClick={() => loadSubscriptions()}
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

      {/* Panel de Control Superior */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-slate-800/80 to-slate-700/60 border-slate-600/50 backdrop-blur-md mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5"></div>
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-3xl font-bold text-white flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-400" />
              </div>
              <span>Panel de Control Avanzado</span>
            </CardTitle>
            <CardDescription className="text-slate-300 text-lg mt-2">
              Sistema de gestión inteligente para el ecosistema de suscripciones
            </CardDescription>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600/50">
              <span className="text-sm text-slate-300">
                {subscriptions.length} registros
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportCsv}
              className="bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50"
            >
              <FileDown className="h-4 w-4 mr-2"/>
              Exportar CSV
          </Button>
            <Button 
              size="sm" 
              onClick={() => setNewSubOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2"/>
              Nueva Suscripción
          </Button>
        </div>
        </CardHeader>
      </Card>
      {/* KPIs del Sistema de Suscripciones */}
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
              <p className="text-3xl font-bold text-white">${totalRevenue.toLocaleString()}</p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                </div>
                <span className="text-xs text-slate-400">85%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Suscripciones Activas */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors duration-300">
                <CheckCircle className="h-8 w-8 text-blue-400" />
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Suscripciones Activas</p>
              <p className="text-3xl font-bold text-white">{activeSubscriptions}</p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '90%'}}></div>
                </div>
                <span className="text-xs text-slate-400">90%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Vencen Pronto */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-500/20 rounded-xl group-hover:bg-amber-500/30 transition-colors duration-300">
                <Clock className="h-8 w-8 text-amber-400" />
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Vencen Pronto</p>
              <p className="text-3xl font-bold text-white">{expiringCount}</p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{width: expiringCount > 0 ? '60%' : '10%'}}></div>
                </div>
                <span className="text-xs text-slate-400">{expiringCount > 0 ? '60%' : '10%'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Pagos Vencidos */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30 hover:border-red-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-colors duration-300">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <div className="text-right">
                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Pagos Vencidos</p>
              <p className="text-3xl font-bold text-white">{overdueCount}</p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{width: overdueCount > 0 ? '70%' : '5%'}}></div>
                </div>
                <span className="text-xs text-slate-400">{overdueCount > 0 ? '70%' : '5%'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Centro de Alertas del Sistema */}
      {expiringCount > 0 && (
        <Card className="relative overflow-hidden bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 mb-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative z-10 pb-4">
            <CardTitle className="text-lg font-bold text-white flex items-center space-x-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <span>Alertas del Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                <AlertTriangle className="h-6 w-6 text-amber-400" />
                <div>
                  <p className="text-amber-300 font-semibold">⚠️ Suscripciones por Vencer</p>
                  <p className="text-amber-400 text-sm">
              {expiringCount} suscripciones vencen en los próximos 7 días. Revisa y contacta a los restaurantes para renovar.
            </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Panel de Control de Suscripciones */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="text-lg font-bold text-white flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <CreditCard className="h-5 w-5 text-blue-400" />
            </div>
            <span>Control de Suscripciones - Plan Estándar</span>
          </CardTitle>
          <CardDescription className="text-slate-300 text-lg mt-2">
            Gestiona las suscripciones de todos los restaurantes
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          {/* Filtros y Búsqueda Avanzada */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
            <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                <Input
                    placeholder="🔍 Búsqueda inteligente: nombre del restaurante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 bg-slate-700/50 border-slate-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-400 rounded-xl transition-all duration-300"
                  />
                  {searchTerm && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm('')}
                        className="h-6 w-6 p-0 hover:bg-slate-600/50"
                      >
                        ×
                      </Button>
              </div>
                  )}
            </div>
              </div>
              <div className="flex items-center space-x-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 focus:border-blue-500 text-white rounded-xl">
                    <SelectValue placeholder="⚡ Estado del Sistema" />
              </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">🌐 Todos los estados</SelectItem>
                    <SelectItem value="active" className="text-white hover:bg-slate-700">✅ Activo</SelectItem>
                    <SelectItem value="expired" className="text-white hover:bg-slate-700">❌ Vencido</SelectItem>
                    <SelectItem value="trial" className="text-white hover:bg-slate-700">🧪 Prueba</SelectItem>
                    <SelectItem value="suspended" className="text-white hover:bg-slate-700">⏸️ Suspendido</SelectItem>
              </SelectContent>
            </Select>
                <div className="bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600/50">
                  <span className="text-sm text-slate-300">
                    {filteredSubscriptions.length} de {subscriptions.length} suscripciones
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla Tecnológica de Suscripciones */}
          <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5"></div>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-slate-700/20">
                  <TableHead className="text-slate-300 font-semibold">🏢 Restaurante</TableHead>
                  <TableHead className="text-slate-300 font-semibold">📋 Plan</TableHead>
                  <TableHead className="text-slate-300 font-semibold">⚡ Estado</TableHead>
                  <TableHead className="text-slate-300 font-semibold">📊 Uso de Recursos</TableHead>
                  <TableHead className="text-slate-300 font-semibold">💳 Pago</TableHead>
                  <TableHead className="text-slate-300 font-semibold">📅 Vencimiento</TableHead>
                  <TableHead className="text-slate-300 font-semibold">💰 Ingresos</TableHead>
                  <TableHead className="text-slate-300 font-semibold">⚙️ Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription: any) => (
                  <TableRow 
                    key={subscription.id}
                    className="group border-slate-700/50 hover:bg-slate-700/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10"
                  >
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-white group-hover:text-blue-300 transition-colors">{subscription.restaurantName}</p>
                            <p className="text-sm text-slate-400">ID: {subscription.restaurantId}</p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600/50">{subscription.plan}</Badge>
                        <p className="text-sm text-slate-400">${subscription.price}/mes</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                        {getStatusBadge(subscription.status, subscription.daysUntilExpiry)}
                          <div className={`w-2 h-2 rounded-full ${
                            subscription.status === 'active' ? 'bg-green-400 animate-pulse' : 
                            subscription.status === 'expired' ? 'bg-red-400' : 
                            subscription.status === 'trial' ? 'bg-blue-400' : 'bg-gray-400'
                          }`}></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2 text-xs">
                        {subscription.usageStats && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Usuarios:</span>
                              <span className={`font-medium ${
                                subscription.usageStats.usuarios?.estado === 'excedido' ? 'text-red-400' : 
                                subscription.usageStats.usuarios?.estado === 'warning' ? 'text-amber-400' : 'text-green-400'
                              }`}>
                                {subscription.usageStats.usuarios?.actual || 0}/{subscription.usageStats.usuarios?.limite || '∞'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Productos:</span>
                              <span className={`font-medium ${
                                subscription.usageStats.productos?.estado === 'excedido' ? 'text-red-400' : 
                                subscription.usageStats.productos?.estado === 'warning' ? 'text-amber-400' : 'text-green-400'
                              }`}>
                                {subscription.usageStats.productos?.actual || 0}/{subscription.usageStats.productos?.limite || '∞'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Sucursales:</span>
                              <span className={`font-medium ${
                                subscription.usageStats.sucursales?.estado === 'excedido' ? 'text-red-400' : 
                                subscription.usageStats.sucursales?.estado === 'warning' ? 'text-amber-400' : 'text-green-400'
                              }`}>
                                {subscription.usageStats.sucursales?.actual || 0}/{subscription.usageStats.sucursales?.limite || '∞'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                        {getPaymentBadge(subscription.paymentStatus)}
                          <div className={`w-2 h-2 rounded-full ${
                            subscription.paymentStatus === 'paid' ? 'bg-green-400 animate-pulse' : 
                            subscription.paymentStatus === 'overdue' ? 'bg-red-400' : 'bg-amber-400'
                          }`}></div>
                        </div>
                        {subscription.lastPayment && (
                          <p className="text-xs text-slate-400">
                            Último: {subscription.lastPayment}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <p className="text-sm text-slate-300">{subscription.endDate}</p>
                        {subscription.daysUntilExpiry > 0 ? (
                          <p className="text-xs text-slate-400">{subscription.daysUntilExpiry} días restantes</p>
                        ) : (
                          <p className="text-xs text-red-400">{Math.abs(subscription.daysUntilExpiry)} días vencido</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-400" />
                          <p className="font-medium text-white">${(subscription.totalPaid || 0).toLocaleString()}</p>
                        </div>
                        <p className="text-xs text-slate-400">Total pagado</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50 hover:border-slate-500"
                          >
                            Acciones
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 bg-slate-800 border-slate-700">
                          <DropdownMenuItem 
                            onClick={() => handleRenovar(subscription.restaurantId, subscription.id, subscription.price)}
                            className="text-slate-300 hover:bg-slate-700 hover:text-white"
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Renovar Suscripción
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleVerPagos(subscription.restaurantId, subscription.restaurantName)}
                            className="text-slate-300 hover:bg-slate-700 hover:text-white"
                          >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Ver Historial de Pagos
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleCambiarPlan(subscription.restaurantId, 'profesional')}
                            className="text-slate-300 hover:bg-slate-700 hover:text-white"
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Cambiar a Profesional
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleCambiarPlan(subscription.restaurantId, 'avanzado')}
                            className="text-slate-300 hover:bg-slate-700 hover:text-white"
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Cambiar a Avanzado
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleCambiarPlan(subscription.restaurantId, 'enterprise')}
                            className="text-slate-300 hover:bg-slate-700 hover:text-white"
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Cambiar a Enterprise
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleExtenderPrueba(subscription.restaurantId, subscription.id)}
                            className="text-slate-300 hover:bg-slate-700 hover:text-white"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Extender Prueba (14 días)
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-400 hover:bg-red-900/20" 
                            onClick={() => handleSuspender(subscription.restaurantId)}
                          >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Suspender Restaurante
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleActivar(subscription.restaurantId)}
                            className="text-green-400 hover:bg-green-900/20"
                          >
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
                  <label className="text-sm">Plan</label>
                  <Select value={serviceForm.nombre_plan} onValueChange={(value) => setServiceForm({ ...serviceForm, nombre_plan: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Básico - $19/mes</SelectItem>
                      <SelectItem value="profesional">Profesional - $49/mes</SelectItem>
                      <SelectItem value="avanzado">Avanzado - $99/mes</SelectItem>
                      <SelectItem value="enterprise">Enterprise - $119/mes</SelectItem>
                    </SelectContent>
                  </Select>
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
