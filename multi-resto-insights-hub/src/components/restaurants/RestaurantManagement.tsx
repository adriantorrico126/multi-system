import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Search, 
  MoreHorizontal, 
  Eye, 
  CreditCard, 
  Ban, 
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  Activity,
  Calendar,
  DollarSign,
  Users,
  Clock,
  AlertTriangle,
  FileText,
  Settings,
  PlusCircle,
  Upload,
  FileDown,
  UserPlus,
  Package
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export const RestaurantManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dataDialogOpen, setDataDialogOpen] = useState(false);
  const [dataProducts, setDataProducts] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [sampleUrl] = useState<string>('');
  const [fileBusy, setFileBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [templateFormat, setTemplateFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ nombre: '', username: '', email: '', password: '' });

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<any>('/restaurantes', {}, token || undefined);
        console.log('Respuesta de /restaurantes:', data);
        // Extraer el array real de restaurantes
        let restaurantesArray: any[] = [];
        if (Array.isArray(data)) {
          restaurantesArray = data;
        } else if (Array.isArray(data?.data)) {
          restaurantesArray = data.data;
        }
        // Mapear a la estructura esperada por la UI
        const mapped = restaurantesArray.map((r) => ({
          id: r.id_restaurante,
          name: r.nombre,
          owner: r.propietario || '-', // Si no hay propietario, mostrar '-'
          address: r.direccion || '-',
          city: r.ciudad || '-',
          email: r.email || '-',
          phone: r.telefono || '-',
          status: r.activo ? 'active' : 'suspended',
          paymentStatus: 'N/A', // Puedes ajustar esto si tienes info de pagos
          nextPayment: '-',
          lastActivity: r.created_at ? new Date(r.created_at).toLocaleDateString() : '-',
        }));
        setRestaurants(mapped);
      } catch (err: any) {
        setError(err.message || 'Error al cargar restaurantes.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchRestaurants();
  }, [token]);

  // KPIs dinámicos
  const totalRestaurantes = restaurants.length;
  const activos = restaurants.filter(r => r.status === 'active').length;
  const suspendidos = restaurants.filter(r => r.status === 'suspended').length;
  const enPrueba = restaurants.filter(r => r.status === 'trial').length;

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch =
      (typeof restaurant.name === 'string' && restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof restaurant.owner === 'string' && restaurant.owner.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || restaurant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Activo</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Suspendido</Badge>;
      case 'trial':
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Prueba</Badge>;
      case 'payment_pending':
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Pago Pendiente</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">Desconocido</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Al día</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Vencido</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Pendiente</Badge>;
      case 'trial':
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Período de prueba</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">N/A</Badge>;
    }
  };

  const handleViewDetails = async (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setDialogOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const t = token || undefined;
      const [restoRes, serviciosRes, pagosEstadoRes, pagosListRes] = await Promise.all([
        apiFetch<any>(`/restaurantes/${restaurant.id}`, {}, t),
        apiFetch<any>(`/restaurantes/${restaurant.id}/servicios`, {}, t),
        apiFetch<any>(`/pagos/estado/${restaurant.id}`, {}, t),
        apiFetch<any>(`/pagos/${restaurant.id}`, {}, t),
      ]);
      const resto = restoRes?.data || restoRes || {};
      const servicios = (serviciosRes?.data || []) as any[];
      const pagos = (pagosListRes?.data || []) as any[];
      const ultimoPago = pagosEstadoRes?.ultimo_pago || null;

      const monthlyRevenue = pagos
        .filter((p: any) => {
          const d = new Date(p.fecha_pago).getTime();
          return Date.now() - d <= 30 * 24 * 60 * 60 * 1000;
        })
        .reduce((sum: number, p: any) => sum + Number(p.monto || 0), 0);

      // Seleccionar servicio "actual"
      const today = new Date();
      const candidates = servicios.filter((s: any) => ['activo','prueba'].includes((s.estado_suscripcion || '').toLowerCase()) && (!s.fecha_fin || new Date(s.fecha_fin) >= today));
      const byFechaInicioDesc = (a: any, b: any) => new Date(b.fecha_inicio || 0).getTime() - new Date(a.fecha_inicio || 0).getTime();
      const currentService = (candidates.length ? candidates : servicios).slice().sort(byFechaInicioDesc)[0] || null;

      // Último pago real (fallback a lista)
      const lastPayDateIso = ultimoPago?.fecha_pago || (pagos.length ? pagos.slice().sort((a: any,b: any) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime())[0]?.fecha_pago : null);
      const lastPayment = lastPayDateIso ? new Date(lastPayDateIso).toLocaleString() : '-';

      // Próximo pago: fecha_fin del servicio actual si es futura
      let nextPayment = 'Indefinida';
      let daysUntilExpiry = null as null | number;
      if (currentService?.fecha_fin) {
        const fin = new Date(currentService.fecha_fin);
        daysUntilExpiry = Math.ceil((fin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        nextPayment = fin.toLocaleDateString();
      }

      // Estado de pago
      let paymentStatus = 'pending';
      const estadoServ = (currentService?.estado_suscripcion || '').toLowerCase();
      if (estadoServ === 'prueba') paymentStatus = 'trial';
      else if (currentService?.fecha_fin && new Date(currentService.fecha_fin) < today) paymentStatus = 'overdue';
      else if (lastPayDateIso) {
        const days = (Date.now() - new Date(lastPayDateIso).getTime()) / (1000 * 60 * 60 * 24);
        paymentStatus = days <= 35 ? 'paid' : 'overdue';
      }

      const registrationDate = resto.created_at ? new Date(resto.created_at).toLocaleString() : '-';
      const lastActivity = ultimoPago?.fecha_pago
        ? new Date(ultimoPago.fecha_pago).toLocaleString()
        : (restaurant.lastActivity || '-');

      setSelectedRestaurant((prev: any) => ({
        ...prev,
        address: resto.direccion || prev?.address || '-',
        city: resto.ciudad || prev?.city || '-',
        email: resto.email || prev?.email || '-',
        phone: resto.telefono || prev?.phone || '-',
        status: resto.activo ? 'active' : 'suspended',
        plan: currentService?.nombre_plan || '-',
        planPrice: Number(currentService?.precio_mensual ?? 0),
        planStatus: currentService?.estado_suscripcion || '-',
        paymentStatus,
        lastPayment,
        nextPayment,
        daysUntilExpiry: daysUntilExpiry === null ? '-' : daysUntilExpiry,
        monthlyRevenue,
        registrationDate,
        lastActivity,
      }));
    } catch (e: any) {
      setDetailError(e.message || 'No se pudieron cargar los detalles.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSuspendReactivate = (restaurant: any) => {
    console.log(`${restaurant.status === 'suspended' ? 'Reactivando' : 'Suspendiendo'} restaurante:`, restaurant.name);
    // Aquí iría la lógica para suspender/reactivar
  };

  const handleViewPayments = (restaurant: any) => {
    console.log('Ver historial de pagos para:', restaurant.name);
    // Aquí iría la lógica para mostrar historial de pagos
  };

  const handleOpenData = async (restaurant: any) => {
    try {
      setSelectedRestaurant(restaurant);
      setDataDialogOpen(true);
      const res = await apiFetch<any>(`/productos/${restaurant.id}`, {}, token || undefined);
      setDataProducts(res?.data || []);
    } catch (e:any) {
      setDataProducts([]);
    }
  };

  const handleOpenUsers = async (restaurant: any) => {
    try {
      setSelectedRestaurant(restaurant);
      setUsersDialogOpen(true);
      setUsers([]);
      // Cargar sucursales para este restaurante
      const br = await apiFetch<any>(`/sucursales`, {}, token || undefined);
      const arr = (br?.data || []).filter((s:any) => s.id_restaurante === restaurant.id);
      setBranches(arr);
    } catch {
      setBranches([]);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.nombre || !newUser.password || !(newUser.username || newUser.email)) {
        toast({ title: 'Validación', description: 'Nombre, usuario/email y contraseña son requeridos.' });
        return;
      }
      setCreatingUser(true);
      // Usar el PATCH de restaurante para crear primer usuario (ya soportado en backend)
      await apiFetch(`/restaurantes/${selectedRestaurant.id}`, { method: 'PATCH', body: JSON.stringify({ first_user: newUser }) }, token || undefined);
      toast({ title: 'Listo', description: 'Usuario creado.' });
      setNewUser({ nombre: '', username: '', email: '', password: '' });
    } catch (e:any) {
      toast({ title: 'Error', description: e.message || 'No se pudo crear el usuario.' });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleImportProducts = async (restaurantId: number, file: File) => {
    try {
      setImporting(true);
      // Parse simple CSV/Excel? Aquí esperamos JSON ya estructurado desde el frontend.
      // Para este MVP, soportaremos JSON pegado desde textarea o un archivo CSV procesado por el cliente en el futuro.
    } finally {
      setImporting(false);
    }
  };

  const handleImportJson = async (restaurantId: number, text: string) => {
    try {
      if (!text.trim()) {
        toast({ title: 'Error', description: 'El campo de texto está vacío' });
        return;
      }

      const payload = JSON.parse(text);
      if (!Array.isArray(payload)) {
        throw new Error('El contenido debe ser un arreglo de productos');
      }

      if (payload.length === 0) {
        toast({ title: 'Error', description: 'El arreglo de productos está vacío' });
        return;
      }

      console.log('Enviando productos para importar:', payload);
      
      const res = await apiFetch(`/productos/${restaurantId}/import`, {
        method: 'POST',
        body: JSON.stringify({ productos: payload })
      }, token || undefined);
      
      console.log('Respuesta de importación:', res);
      
      toast({ title: 'Importación exitosa', description: `${payload.length} productos importados correctamente.` });
      
      // Recargar la lista de productos
      const list = await apiFetch<any>(`/productos/${restaurantId}`, {}, token || undefined);
      setDataProducts(list?.data || []);
      
    } catch (e: any) {
      console.error('Error en importación:', e);
      if (e.name === 'SyntaxError') {
        toast({ title: 'Error de JSON', description: 'El formato JSON no es válido. Verifica la sintaxis.' });
      } else {
        toast({ title: 'Error de importación', description: e.message || 'No se pudo importar. Revisa la consola para más detalles.' });
      }
    }
  };

  const csvToRows = (csv: string) => {
    const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim() !== '');
    if (lines.length === 0) return [] as any[];
    const parseLine = (line: string) => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
          else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
      result.push(current);
      return result.map(s => s.trim());
    };
    const header = parseLine(lines[0]).map(h => h.toLowerCase());
    const rows = [] as any[];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (cols.length === 1 && cols[0] === '') continue;
      const obj: any = {};
      header.forEach((h, idx) => { obj[h] = cols[idx]; });
      rows.push(obj);
    }
    return rows;
  };

  const normalizeProducts = (rows: any[]) => {
    return rows.map(r => {
      const precio = Number(String(r.precio ?? r.price ?? '0').replace(',', '.'));
      const stock = r.stock !== undefined && r.stock !== null && !isNaN(r.stock) ? Number(r.stock) : null;
      
      return {
        nombre: String(r.nombre ?? r.producto ?? '').trim(),
        precio: precio,
        categoria_nombre: r.categoria_nombre ?? r.categoria ?? '',
        stock: stock,
        activo: r.activo !== undefined ? (String(r.activo).toLowerCase() === 'true' || String(r.activo) === '1') : true,
        imagen_url: r.imagen_url ?? r.imagen ?? '',
      };
    }).filter(p => p.nombre && !isNaN(p.precio) && p.precio > 0);
  };

  const handleFileUpload = async (restaurantId: number, file: File) => {
    try {
      setFileBusy(true);
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext === 'csv') {
        const text = await file.text();
        const rows = csvToRows(text);
        const productos = normalizeProducts(rows);
        await apiFetch(`/productos/${restaurantId}/import`, { method: 'POST', body: JSON.stringify({ productos }) }, token || undefined);
        toast({ title: 'Importación', description: `Importados ${productos.length} productos desde CSV.` });
        const list = await apiFetch<any>(`/productos/${restaurantId}`, {}, token || undefined);
        setDataProducts(list?.data || []);
        return;
      }
      if (ext === 'xlsx' || ext === 'xls') {
        try {
          // @ts-ignore
          const XLSX = await import('xlsx');
          const buf = await file.arrayBuffer();
          const wb = XLSX.read(buf, { type: 'array' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          const productos = normalizeProducts(rows as any[]);
          await apiFetch(`/productos/${restaurantId}/import`, { method: 'POST', body: JSON.stringify({ productos }) }, token || undefined);
          toast({ title: 'Importación', description: `Importados ${productos.length} productos desde Excel.` });
          const list = await apiFetch<any>(`/productos/${restaurantId}`, {}, token || undefined);
          setDataProducts(list?.data || []);
          return;
        } catch (e:any) {
          toast({ title: 'Dependencia faltante', description: 'Instala el paquete "xlsx" en el frontend: npm i xlsx' });
          return;
        }
      }
      toast({ title: 'Formato no soportado', description: 'Sube un archivo .csv, .xlsx o .xls' });
    } catch (e:any) {
      toast({ title: 'Error', description: e.message || 'No se pudo procesar el archivo.' });
    } finally {
      setFileBusy(false);
    }
  };

  const downloadTemplate = async () => {
    const rows = [
      {
        nombre: 'Hamburguesa Clásica',
        precio: 25.5,
        categoria_nombre: 'Hamburguesas',
        stock: 100,
        activo: true,
        imagen_url: ''
      },
      {
        nombre: 'Papas Fritas',
        precio: 8.9,
        categoria_nombre: 'Acompañamientos',
        stock: 200,
        activo: true,
        imagen_url: ''
      }
    ];
    if (templateFormat === 'csv') {
      const headers = ['nombre','precio','categoria_nombre','stock','activo','imagen_url'];
      const escape = (v: any) => {
        const s = String(v ?? '');
        if (/[",\n]/.test(s)) return '"' + s.replace(/"/g,'""') + '"';
        return s;
      };
      const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => escape((r as any)[h])).join(','))).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_productos.csv';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    try {
      // @ts-ignore
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Productos');
      XLSX.writeFile(wb, 'plantilla_productos.xlsx');
    } catch (e) {
      // Fallback a CSV si xlsx no está disponible
      setTemplateFormat('csv');
      await downloadTemplate();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-400 text-lg">Cargando restaurantes...</p>
          </div>
        </div>
      )}
      {error && (
        <Card className="border-red-500 bg-red-900/20 backdrop-blur-md mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <p className="text-red-300">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Header Tecnológico Avanzado */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
              <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Control Central de Restaurantes
            </h1>
            <p className="text-slate-300 text-lg">
              Sistema de gestión avanzada para el ecosistema POS
            </p>
              </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-slate-400">Última actualización</p>
              <p className="text-sm text-slate-300">{new Date().toLocaleString()}</p>
            </div>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Activity className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* KPIs Tecnológicos Avanzados */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors duration-300">
                  <Building2 className="h-8 w-8 text-blue-400" />
                </div>
                <div className="text-right">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">Total Restaurantes</p>
                <p className="text-3xl font-bold text-white">{totalRestaurantes}</p>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '100%'}}></div>
                  </div>
                  <span className="text-xs text-slate-400">100%</span>
                </div>
            </div>
          </CardContent>
        </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
          <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors duration-300">
                  <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
                <div className="text-right">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">Activos</p>
                <p className="text-3xl font-bold text-white">{activos}</p>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: `${totalRestaurantes > 0 ? (activos/totalRestaurantes)*100 : 0}%`}}></div>
                  </div>
                  <span className="text-xs text-slate-400">{totalRestaurantes > 0 ? Math.round((activos/totalRestaurantes)*100) : 0}%</span>
                </div>
            </div>
          </CardContent>
        </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30 hover:border-red-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20">
          <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-colors duration-300">
                  <Ban className="h-8 w-8 text-red-400" />
              </div>
                <div className="text-right">
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">Suspendidos</p>
                <p className="text-3xl font-bold text-white">{suspendidos}</p>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{width: `${totalRestaurantes > 0 ? (suspendidos/totalRestaurantes)*100 : 0}%`}}></div>
                  </div>
                  <span className="text-xs text-slate-400">{totalRestaurantes > 0 ? Math.round((suspendidos/totalRestaurantes)*100) : 0}%</span>
                </div>
            </div>
          </CardContent>
        </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
          <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors duration-300">
                  <Activity className="h-8 w-8 text-purple-400" />
              </div>
                <div className="text-right">
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">En Prueba</p>
                <p className="text-3xl font-bold text-white">{enPrueba}</p>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{width: `${totalRestaurantes > 0 ? (enPrueba/totalRestaurantes)*100 : 0}%`}}></div>
                  </div>
                  <span className="text-xs text-slate-400">{totalRestaurantes > 0 ? Math.round((enPrueba/totalRestaurantes)*100) : 0}%</span>
                </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Panel de Control Tecnológico */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-slate-800/80 to-slate-700/60 border-slate-600/50 backdrop-blur-md mb-6">
        {/* Efecto de fondo */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5"></div>
        
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-3xl font-bold text-white flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
                <Settings className="h-6 w-6 text-blue-400" />
          </div>
              <span>Panel de Control Avanzado</span>
            </CardTitle>
            <CardDescription className="text-slate-300 text-lg mt-2">
              Sistema de gestión inteligente para el ecosistema POS
            </CardDescription>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => navigate('/add-restaurante')} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
            >
            <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Restaurante
          </Button>
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10">
          {/* Barra de herramientas tecnológica */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Búsqueda avanzada */}
            <div className="flex-1">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                <Input
                    placeholder="🔍 Búsqueda inteligente: nombre, propietario, email..."
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
              
              {/* Filtros avanzados */}
              <div className="flex items-center space-x-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 focus:border-blue-500 text-white rounded-xl">
                    <SelectValue placeholder="⚡ Estado del Sistema" />
              </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">🌐 Todos los estados</SelectItem>
                    <SelectItem value="active" className="text-white hover:bg-slate-700">✅ Activo</SelectItem>
                    <SelectItem value="suspended" className="text-white hover:bg-slate-700">❌ Suspendido</SelectItem>
                    <SelectItem value="trial" className="text-white hover:bg-slate-700">🧪 En Prueba</SelectItem>
                    <SelectItem value="payment_pending" className="text-white hover:bg-slate-700">⏳ Pago Pendiente</SelectItem>
              </SelectContent>
            </Select>
                
                {/* Indicador de resultados */}
                <div className="bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600/50">
                  <span className="text-sm text-slate-300">
                    {filteredRestaurants.length} de {totalRestaurantes} restaurantes
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla Tecnológica Avanzada */}
          <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            {/* Efecto de fondo para la tabla */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5"></div>
            
            <Table className="relative z-10">
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-slate-700/20">
                  <TableHead className="text-slate-300 font-semibold">🏢 Restaurante</TableHead>
                  <TableHead className="text-slate-300 font-semibold">👤 Propietario</TableHead>
                  <TableHead className="text-slate-300 font-semibold">📞 Contacto</TableHead>
                  <TableHead className="text-slate-300 font-semibold">⚡ Estado</TableHead>
                  <TableHead className="text-slate-300 font-semibold">💳 Estado de Pago</TableHead>
                  <TableHead className="text-slate-300 font-semibold">🕒 Última Actividad</TableHead>
                  <TableHead className="text-slate-300 font-semibold">⚙️ Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRestaurants.map((restaurant, index) => (
                  <TableRow 
                    key={restaurant.id} 
                    className="group border-slate-700/50 hover:bg-slate-700/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10"
                  >
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-white group-hover:text-blue-300 transition-colors">{restaurant.name}</p>
                            <p className="text-sm text-slate-400 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {restaurant.address}
                        </p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <p className="font-medium text-white">{restaurant.owner}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded-full">ID: {restaurant.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="h-4 w-4 text-blue-400" />
                          <span className="text-slate-300">{restaurant.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="h-4 w-4 text-green-400" />
                          <span className="text-slate-300">{restaurant.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                      {getStatusBadge(restaurant.status)}
                        <div className={`w-2 h-2 rounded-full ${
                          restaurant.status === 'active' ? 'bg-green-400 animate-pulse' : 
                          restaurant.status === 'suspended' ? 'bg-red-400' : 'bg-purple-400'
                        }`}></div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        {getPaymentStatusBadge(restaurant.paymentStatus)}
                        <div className="text-xs text-slate-400 bg-slate-700/30 px-2 py-1 rounded">
                          Próximo: {restaurant.nextPayment}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-300">{restaurant.lastActivity}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-slate-600/50 hover:text-white transition-colors"
                            >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64 bg-slate-800 border-slate-700">
                            <DropdownMenuItem 
                              onClick={() => handleViewDetails(restaurant)}
                              className="text-slate-300 hover:bg-slate-700 hover:text-white"
                            >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles Completos
                          </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleOpenData(restaurant)}
                              className="text-slate-300 hover:bg-slate-700 hover:text-white"
                            >
                            <FileText className="mr-2 h-4 w-4" />
                            Datos (Productos)
                          </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleOpenUsers(restaurant)}
                              className="text-slate-300 hover:bg-slate-700 hover:text-white"
                            >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Usuarios / Sucursales
                          </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                          <DropdownMenuItem 
                            onClick={() => handleSuspendReactivate(restaurant)}
                              className={restaurant.status === 'suspended' ? 'text-green-400 hover:bg-green-900/20' : 'text-red-400 hover:bg-red-900/20'}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            {restaurant.status === 'suspended' ? 'Reactivar Acceso' : 'Suspender Acceso'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                        
                        {/* Botones de acción rápida */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(restaurant)}
                          className="h-8 w-8 p-0 hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenData(restaurant)}
                          className="h-8 w-8 p-0 hover:bg-purple-600/20 hover:text-purple-400 transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Tecnológico de Detalles del Restaurante */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50">
          {/* Header Tecnológico */}
          <DialogHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10 rounded-t-lg"></div>
            <DialogTitle className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
                  <Building2 className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Centro de Control - {selectedRestaurant?.name}
                  </h2>
                  <p className="text-slate-300 text-sm">
                    Panel de gestión avanzada del restaurante
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-400">En línea</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {/* Estados de Carga y Error */}
          {detailLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-blue-400 text-lg">Cargando datos del sistema...</p>
              </div>
            </div>
          )}
          {detailError && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <p className="text-red-300">{detailError}</p>
              </div>
            </div>
          )}
          
          {selectedRestaurant && (
            <div className="space-y-8">
              {/* Información Principal Tecnológica */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Información Básica Avanzada */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                  <CardHeader className="relative z-10 pb-4">
                    <CardTitle className="text-lg font-bold text-white flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-400" />
                      </div>
                      <span>Información Corporativa</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-slate-400 uppercase tracking-wide">ID del Sistema</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-white">#{selectedRestaurant.id}</span>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    </div>
                    </div>
                      <div className="space-y-1">
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Estado</span>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(selectedRestaurant.status)}
                    </div>
                    </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Nombre del Establecimiento</span>
                        <p className="text-lg font-semibold text-white">{selectedRestaurant.name}</p>
                    </div>
                      
                      <div className="space-y-1">
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Ubicación</span>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300">{selectedRestaurant?.address ?? '-'}</span>
                        </div>
                        <div className="flex items-center space-x-2 ml-6">
                          <span className="text-slate-400">{selectedRestaurant?.city ?? '-'}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Contacto</span>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-blue-400" />
                          <span className="text-slate-300">{selectedRestaurant?.email ?? '-'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-green-400" />
                          <span className="text-slate-300">{selectedRestaurant?.phone ?? '-'}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Registro en el Sistema</span>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-purple-400" />
                          <span className="text-slate-300">{selectedRestaurant?.registrationDate ?? '-'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Estado del Sistema Avanzado */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30 hover:border-green-400/50 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                  <CardHeader className="relative z-10 pb-4">
                    <CardTitle className="text-lg font-bold text-white flex items-center space-x-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Activity className="h-5 w-5 text-green-400" />
                      </div>
                      <span>Estado del Sistema</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10 space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-slate-300">Estado Operacional</span>
                        </div>
                      {getStatusBadge(selectedRestaurant.status)}
                    </div>
                      
                      <div className="space-y-2">
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Última Actividad</span>
                        <div className="flex items-center space-x-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300">{selectedRestaurant?.lastActivity ?? '-'}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Tiempo de Respuesta</span>
                        <div className="flex items-center space-x-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-slate-300">45ms</span>
                          <span className="text-xs text-green-400">Excelente</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Uptime del Sistema</span>
                        <div className="flex items-center space-x-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{width: '99.9%'}}></div>
                          </div>
                          <span className="text-xs text-green-400">99.9%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Panel de Suscripción y Pagos Tecnológico */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                <CardHeader className="relative z-10 pb-4">
                  <CardTitle className="text-lg font-bold text-white flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <CreditCard className="h-5 w-5 text-purple-400" />
                    </div>
                    <span>Centro de Suscripción y Pagos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  {/* Estado de Pago Principal */}
                  <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                        <span className="text-slate-300 font-medium">Estado de Pago</span>
                      </div>
                      {getPaymentStatusBadge(selectedRestaurant.paymentStatus)}
                    </div>
                    
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Último Pago</span>
                        <div className="flex items-center space-x-2 p-3 bg-slate-700/50 rounded-lg">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300">{selectedRestaurant?.lastPayment ?? 'N/A'}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Próximo Pago</span>
                        <div className="flex items-center space-x-2 p-3 bg-slate-700/50 rounded-lg">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300">{selectedRestaurant?.nextPayment ?? 'Indefinida'}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Días Restantes</span>
                        <div className="flex items-center space-x-2 p-3 bg-slate-700/50 rounded-lg">
                          <Activity className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300">
                            {selectedRestaurant?.daysUntilExpiry !== undefined && selectedRestaurant?.daysUntilExpiry !== '-' 
                              ? `${selectedRestaurant.daysUntilExpiry} días` 
                              : 'N/A'}
                          </span>
                    </div>
                  </div>
                    </div>
                  </div>
                  
                  {/* Información del Plan */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <span className="text-xs text-slate-400 uppercase tracking-wide">Plan Actual</span>
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <p className="text-white font-semibold">{selectedRestaurant?.plan || 'Sin Plan'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs text-slate-400 uppercase tracking-wide">Precio Mensual</span>
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <p className="text-white font-semibold">${Number(selectedRestaurant?.planPrice ?? 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs text-slate-400 uppercase tracking-wide">Estado de Suscripción</span>
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-slate-300">{selectedRestaurant?.planStatus || 'Activo'}</span>
                    </div>
                  </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dashboard de Métricas Tecnológicas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Métrica de Ingresos */}
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
                      <p className="text-sm font-medium text-slate-300">Ingresos Mensuales</p>
                      <p className="text-3xl font-bold text-white">${Number(selectedRestaurant?.monthlyRevenue ?? 0).toLocaleString()}</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
                        </div>
                        <span className="text-xs text-slate-400">75%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Métrica de Personal */}
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
                      <p className="text-sm font-medium text-slate-300">Personal Activo</p>
                      <p className="text-3xl font-bold text-white">{selectedRestaurant.employees || 'N/A'}</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{width: '60%'}}></div>
                        </div>
                        <span className="text-xs text-slate-400">60%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Métrica de Uso del Sistema */}
                <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -translate-y-12 translate-x-12"></div>
                  <CardContent className="relative z-10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors duration-300">
                        <Activity className="h-8 w-8 text-purple-400" />
                      </div>
                      <div className="text-right">
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-300">Uso del Sistema</p>
                      <p className="text-3xl font-bold text-white">{selectedRestaurant.systemUsage || '85'}%</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{width: `${selectedRestaurant.systemUsage || 85}%`}}></div>
                        </div>
                        <span className="text-xs text-slate-400">{selectedRestaurant.systemUsage || 85}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Centro de Alertas Tecnológico */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30 hover:border-red-400/50 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                <CardHeader className="relative z-10 pb-4">
                  <CardTitle className="text-lg font-bold text-white flex items-center space-x-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <span>Centro de Alertas del Sistema</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  {selectedRestaurant.paymentStatus === 'overdue' ? (
                    <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                        <AlertTriangle className="h-6 w-6 text-red-400" />
                        <div>
                          <p className="text-red-300 font-semibold">⚠️ Pago Vencido</p>
                          <p className="text-red-400 text-sm">Suspensión automática del sistema en 3 días</p>
                        </div>
                      </div>
                    </div>
                  ) : selectedRestaurant.paymentStatus === 'pending' ? (
                    <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                        <Clock className="h-6 w-6 text-amber-400" />
                        <div>
                          <p className="text-amber-300 font-semibold">⏳ Pago Pendiente</p>
                          <p className="text-amber-400 text-sm">Recordatorio: Procesar pago para mantener servicios activos</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <CheckCircle className="h-6 w-6 text-green-400" />
                        <div>
                          <p className="text-green-300 font-semibold">✅ Sistema Operativo</p>
                          <p className="text-green-400 text-sm">Todos los servicios funcionando correctamente</p>
                        </div>
                      </div>
                    </div>
                  )}
                  </CardContent>
                </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Tecnológico de Datos del Restaurante */}
      <Dialog open={dataDialogOpen} onOpenChange={setDataDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50">
          {/* Header Tecnológico */}
          <DialogHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10 rounded-t-lg"></div>
            <DialogTitle className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl">
                  <FileText className="h-8 w-8 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Centro de Datos - {selectedRestaurant?.name}
                  </h2>
                  <p className="text-slate-300 text-sm">
                    Gestión avanzada de productos y migración masiva
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-400">Sistema de Datos</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-8">
            {/* Panel de Control de Productos */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-16 translate-x-16"></div>
              <CardHeader className="relative z-10 pb-4">
                <CardTitle className="text-lg font-bold text-white flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Package className="h-5 w-5 text-purple-400" />
                  </div>
                  <span>Inventario de Productos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                {/* Tabla Tecnológica de Productos */}
                <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5"></div>
              <Table>
                <TableHeader>
                      <TableRow className="border-slate-700/50 hover:bg-slate-700/20">
                        <TableHead className="text-slate-300 font-semibold">🍽️ Producto</TableHead>
                        <TableHead className="text-slate-300 font-semibold">📂 Categoría</TableHead>
                        <TableHead className="text-slate-300 font-semibold">💰 Precio</TableHead>
                        <TableHead className="text-slate-300 font-semibold">📦 Stock</TableHead>
                        <TableHead className="text-slate-300 font-semibold">⚡ Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                      {dataProducts.map((p: any, index: number) => (
                        <TableRow 
                          key={p.id_producto} 
                          className="group border-slate-700/50 hover:bg-slate-700/20 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10"
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                                <Package className="h-5 w-5 text-purple-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-white group-hover:text-purple-300 transition-colors">{p.nombre}</p>
                                <p className="text-sm text-slate-400">ID: {p.id_producto}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-300">{p.id_categoria || '-'}</span>
                              <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-green-400" />
                              <span className="text-white font-semibold">${Number(p.precio || 0).toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-2">
                              <Package className="h-4 w-4 text-blue-400" />
                              <span className="text-slate-300">{p.stock_actual ?? '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-2">
                              {p.activo ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Activo</Badge>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                  <Badge variant="secondary" className="bg-red-500/20 text-red-300 border-red-500/30">Inactivo</Badge>
                                </div>
                              )}
                            </div>
                          </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
              </CardContent>
            </Card>

            {/* Centro de Migración Masiva Tecnológico */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
              <CardHeader className="relative z-10 pb-4">
                <CardTitle className="text-lg font-bold text-white flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Upload className="h-5 w-5 text-blue-400" />
                  </div>
                  <span>Centro de Migración Masiva</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                {/* Información del Sistema */}
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-slate-300 font-medium">Sistema de Importación Inteligente</span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Migra productos desde Excel/CSV o importa directamente desde JSON
                  </p>
                </div>

                {/* Formato de Datos */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-700/50 rounded-lg">
                      <FileText className="h-4 w-4 text-slate-400" />
                    </div>
                    <span className="text-slate-300 font-medium">Formato de Datos Requerido</span>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <pre className="text-xs text-slate-300 overflow-auto">
{`[
  {
    "nombre": "Hamburguesa Clásica",
    "precio": 25.50,
    "categoria_nombre": "Hamburguesas",
    "stock": 100,
    "activo": true,
    "imagen_url": "https://.../hamburguesa.jpg"
  }
]`}
              </pre>
                    <div className="mt-3 text-xs text-slate-400">
                      <p><span className="text-blue-400">Columnas mínimas:</span> nombre (string), precio (number)</p>
                      <p><span className="text-purple-400">Opcionales:</span> categoria_nombre (string), stock (number), activo (boolean), imagen_url (string)</p>
                    </div>
                  </div>
                </div>

                {/* Área de Importación */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-700/50 rounded-lg">
                      <Upload className="h-4 w-4 text-slate-400" />
                    </div>
                    <span className="text-slate-300 font-medium">Importar Datos</span>
                  </div>
                  
                  <Textarea 
                    id="jsonImport" 
                    placeholder="Pega aquí el JSON de productos para importar..." 
                    className="h-40 bg-slate-700/50 border-slate-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-400 rounded-xl"
                  />
                  
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f || !selectedRestaurant?.id) return;
                  await handleFileUpload(selectedRestaurant.id, f);
                  e.currentTarget.value = '';
                }}
                disabled={fileBusy}
              />
                  
                  <div className="flex items-center gap-4 flex-wrap">
                <Button
                  type="button"
                      variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={fileBusy}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {fileBusy ? 'Procesando...' : 'Subir Excel/CSV'}
                </Button>
                    
                    <div className="flex items-center space-x-2 text-sm text-slate-400">
                      <span>Formatos soportados:</span>
                      <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600/50">CSV</Badge>
                      <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600/50">XLSX</Badge>
                      <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600/50">XLS</Badge>
                    </div>
                    
                <div className="flex items-center gap-2 ml-auto">
                  <Select value={templateFormat} onValueChange={(v) => setTemplateFormat(v as any)}>
                        <SelectTrigger className="w-28 h-9 bg-slate-700/50 border-slate-600/50 text-white">
                      <SelectValue placeholder="Formato" />
                    </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="xlsx" className="text-white hover:bg-slate-700">XLSX</SelectItem>
                          <SelectItem value="csv" className="text-white hover:bg-slate-700">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={downloadTemplate} 
                        className="bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50 hover:border-slate-500"
                      >
                    <FileDown className="h-4 w-4 mr-2" />
                    Descargar plantilla
                  </Button>
                </div>
              </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center gap-4 pt-4 border-t border-slate-700/50">
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                  if (!selectedRestaurant?.id) {
                    toast({ title: 'Error', description: 'No hay restaurante seleccionado' });
                    return;
                  }
                  const el = document.getElementById('jsonImport') as HTMLTextAreaElement;
                  if (!el) {
                    toast({ title: 'Error', description: 'No se encontró el campo de texto' });
                    return;
                  }
                  await handleImportJson(selectedRestaurant.id, el.value);
                    }} 
                    disabled={importing}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-green-500/25 transition-all duration-300"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                  {importing ? 'Importando...' : 'Importar JSON'}
                </Button>
              </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Tecnológico de Usuarios y Sucursales */}
      <Dialog open={usersDialogOpen} onOpenChange={setUsersDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50">
          {/* Header Tecnológico */}
          <DialogHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-blue-500/10 rounded-t-lg"></div>
            <DialogTitle className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl">
                  <UserPlus className="h-8 w-8 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Centro de Gestión - {selectedRestaurant?.name}
                  </h2>
                  <p className="text-slate-300 text-sm">
                    Administración avanzada de usuarios y sucursales
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-400">Sistema de Gestión</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-8">
            {/* Panel de Creación de Usuario Admin */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30 hover:border-green-400/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-16 translate-x-16"></div>
              <CardHeader className="relative z-10 pb-4">
                <CardTitle className="text-lg font-bold text-white flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <UserPlus className="h-5 w-5 text-green-400" />
                  </div>
                  <span>Crear Usuario Administrador</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                {/* Información del Sistema */}
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-slate-300 font-medium">Sistema de Autenticación Segura</span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Crea el usuario administrador inicial para el sistema POS del restaurante
                  </p>
                  </div>

                {/* Formulario de Usuario */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Nombre Completo</label>
                    <Input 
                      placeholder="Nombre completo del administrador" 
                      value={newUser.nombre} 
                      onChange={(e) => setNewUser(v => ({ ...v, nombre: e.target.value }))}
                      className="bg-slate-700/50 border-slate-600/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-white placeholder-slate-400"
                    />
                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span>Campo obligatorio</span>
                  </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Usuario de Acceso</label>
                    <Input 
                      placeholder="Usuario para login en POS" 
                      value={newUser.username} 
                      onChange={(e) => setNewUser(v => ({ ...v, username: e.target.value }))}
                      className="bg-slate-700/50 border-slate-600/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-white placeholder-slate-400"
                    />
                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span>Requerido para login en POS</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Email de Contacto</label>
                    <Input 
                      placeholder="Email del administrador (opcional)" 
                      value={newUser.email} 
                      onChange={(e) => setNewUser(v => ({ ...v, email: e.target.value }))}
                      className="bg-slate-700/50 border-slate-600/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-white placeholder-slate-400"
                    />
                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>Campo opcional</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Contraseña Segura</label>
                  <div className="relative">
                      <Input 
                        id="adminPass" 
                        type="password" 
                        placeholder="Contraseña del administrador" 
                        value={newUser.password} 
                        onChange={(e) => setNewUser(v => ({ ...v, password: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-white placeholder-slate-400 pr-12"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-600/50"
                      onClick={() => {
                        const el = document.getElementById('adminPass') as HTMLInputElement | null;
                        if (!el) return;
                        el.type = el.type === 'password' ? 'text' : 'password';
                      }}
                    >
                        <Eye className="h-4 w-4 text-slate-400" />
                    </Button>
                  </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span>Se almacena hasheada de forma segura</span>
                </div>
                  </div>
                </div>

                {/* Botón de Creación */}
                <div className="flex justify-end pt-4 border-t border-slate-700/50">
                  <Button 
                    onClick={handleCreateUser} 
                    disabled={creatingUser}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-green-500/25 transition-all duration-300"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {creatingUser ? 'Creando Usuario...' : 'Crear Usuario Admin'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Panel de Gestión de Sucursales */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
              <CardHeader className="relative z-10 pb-4">
                <CardTitle className="text-lg font-bold text-white flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-400" />
                  </div>
                  <span>Gestión de Sucursales</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                {/* Información del Sistema */}
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 mb-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-slate-300 font-medium">Red de Sucursales del Restaurante</span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Administra todas las sucursales y ubicaciones del restaurante
                  </p>
                </div>

                {/* Tabla Tecnológica de Sucursales */}
                <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-green-500/5"></div>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700/50 hover:bg-slate-700/20">
                        <TableHead className="text-slate-300 font-semibold">🏢 Nombre</TableHead>
                        <TableHead className="text-slate-300 font-semibold">🌍 Ciudad</TableHead>
                        <TableHead className="text-slate-300 font-semibold">📍 Dirección</TableHead>
                        <TableHead className="text-slate-300 font-semibold">⚡ Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {branches.map((b: any, index: number) => (
                        <TableRow 
                          key={b.id_sucursal} 
                          className="group border-slate-700/50 hover:bg-slate-700/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10"
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-lg flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-blue-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-white group-hover:text-blue-300 transition-colors">{b.nombre}</p>
                                <p className="text-sm text-slate-400">ID: {b.id_sucursal}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-300">{b.ciudad}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-300">{b.direccion}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-2">
                              {b.activo ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Activa</Badge>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                  <Badge variant="secondary" className="bg-red-500/20 text-red-300 border-red-500/30">Inactiva</Badge>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
