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
  FileDown
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
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspendido</Badge>;
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Prueba</Badge>;
      case 'payment_pending':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pago Pendiente</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Al día</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Vencido</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800">Pendiente</Badge>;
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800">Período de prueba</Badge>;
      default:
        return <Badge variant="secondary">N/A</Badge>;
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
      const payload = JSON.parse(text);
      if (!Array.isArray(payload)) throw new Error('El contenido debe ser un arreglo de productos');
      const res = await apiFetch(`/productos/${restaurantId}/import`, {
        method: 'POST',
        body: JSON.stringify({ productos: payload })
      }, token || undefined);
      toast({ title: 'Importación', description: 'Productos importados correctamente.' });
      const list = await apiFetch<any>(`/productos/${restaurantId}`, {}, token || undefined);
      setDataProducts(list?.data || []);
    } catch (e:any) {
      toast({ title: 'Error', description: e.message || 'No se pudo importar.' });
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
    return rows.map(r => ({
      nombre: String(r.nombre ?? r.producto ?? '').trim(),
      precio: Number(String(r.precio ?? r.price ?? '0').replace(',', '.')),
      categoria_nombre: r.categoria_nombre ?? r.categoria ?? '',
      stock: r.stock !== undefined ? Number(r.stock) : undefined,
      activo: r.activo !== undefined ? (String(r.activo).toLowerCase() === 'true' || String(r.activo) === '1') : undefined,
      imagen_url: r.imagen_url ?? r.imagen ?? undefined,
    })).filter(p => p.nombre && !isNaN(p.precio));
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
    <div className="space-y-6">
      {loading && <div className="text-center text-blue-600">Cargando restaurantes...</div>}
      {error && <div className="text-center text-red-600">{error}</div>}
      {/* Header y Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Restaurantes</p>
                <p className="text-2xl font-bold text-slate-900">{totalRestaurantes}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">{activos}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Suspendidos</p>
                <p className="text-2xl font-bold text-red-600">{suspendidos}</p>
              </div>
              <Ban className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">En Prueba</p>
                <p className="text-2xl font-bold text-blue-600">{enPrueba}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">Gestión de Restaurantes</CardTitle>
            <CardDescription>Administra todos los restaurantes que usan el sistema POS</CardDescription>
          </div>
          <Button onClick={() => navigate('/add-restaurante')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Restaurante
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o propietario..."
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
                <SelectItem value="suspended">Suspendido</SelectItem>
                <SelectItem value="trial">En Prueba</SelectItem>
                <SelectItem value="payment_pending">Pago Pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabla de Restaurantes */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurante</TableHead>
                  <TableHead>Propietario</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Estado de Pago</TableHead>
                  <TableHead>Última Actividad</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRestaurants.map((restaurant) => (
                  <TableRow key={restaurant.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {restaurant.address}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{restaurant.owner}</p>
                        <p className="text-sm text-gray-500">ID: {restaurant.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {restaurant.email}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {restaurant.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(restaurant.status)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getPaymentStatusBadge(restaurant.paymentStatus)}
                        <p className="text-xs text-gray-500">
                          Próximo: {restaurant.nextPayment}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{restaurant.lastActivity}</p>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => handleViewDetails(restaurant)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles Completos
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenData(restaurant)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Datos (Productos)
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleSuspendReactivate(restaurant)}
                            className={restaurant.status === 'suspended' ? 'text-green-600' : 'text-red-600'}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            {restaurant.status === 'suspended' ? 'Reactivar Acceso' : 'Suspender Acceso'}
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

      {/* Dialog de Detalles del Restaurante */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Detalles Administrativos - {selectedRestaurant?.name}
            </DialogTitle>
          </DialogHeader>
          {detailLoading && <div className="text-sm text-slate-600">Cargando detalles...</div>}
          {detailError && <div className="text-sm text-red-600">{detailError}</div>}
          
          {selectedRestaurant && (
            <div className="space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Información Básica</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ID:</span>
                      <span className="text-sm font-medium">{selectedRestaurant.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Nombre:</span>
                      <span className="text-sm font-medium">{selectedRestaurant.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dirección:</span>
                      <span className="text-sm font-medium">{selectedRestaurant?.address ?? '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ciudad:</span>
                      <span className="text-sm font-medium">{selectedRestaurant?.city ?? '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium">{selectedRestaurant?.email ?? '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Teléfono:</span>
                      <span className="text-sm font-medium">{selectedRestaurant?.phone ?? '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Registro:</span>
                      <span className="text-sm font-medium">{selectedRestaurant?.registrationDate ?? '-'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Estado del Sistema</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Estado:</span>
                      {getStatusBadge(selectedRestaurant.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Última Actividad:</span>
                      <span className="text-sm font-medium">{selectedRestaurant?.lastActivity ?? '-'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Información de Pagos */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Información de Suscripción y Pagos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <span className="text-sm text-gray-600">Estado de Pago</span>
                      {getPaymentStatusBadge(selectedRestaurant.paymentStatus)}
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm text-gray-600">Último Pago</span>
                      <p className="text-sm font-medium">{selectedRestaurant?.lastPayment ?? '-'}</p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm text-gray-600">Próximo Pago</span>
                      <p className="text-sm font-medium">{selectedRestaurant?.nextPayment ?? '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="space-y-2">
                      <span className="text-sm text-gray-600">Plan</span>
                      <p className="text-sm font-medium">{selectedRestaurant?.plan || '-'}</p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm text-gray-600">Precio Mensual</span>
                      <p className="text-sm font-medium">${Number(selectedRestaurant?.planPrice ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm text-gray-600">Estado de Suscripción</span>
                      <p className="text-sm font-medium">{selectedRestaurant?.planStatus || '-'}</p>
                    </div>
                  </div>
                  {selectedRestaurant?.daysUntilExpiry !== undefined && selectedRestaurant?.daysUntilExpiry !== '-' && (
                    <div className="mt-2 text-xs text-gray-500">Vence en {selectedRestaurant.daysUntilExpiry} días</div>
                  )}
                </CardContent>
              </Card>

              {/* Métricas Administrativas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Ingresos/Mes</p>
                        <p className="text-lg font-bold">${Number(selectedRestaurant?.monthlyRevenue ?? 0).toLocaleString()}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Personal</p>
                        <p className="text-lg font-bold">{selectedRestaurant.employees}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Uso Sistema</p>
                        <p className="text-lg font-bold">{selectedRestaurant.systemUsage}%</p>
                      </div>
                      <Activity className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alertas y Notificaciones */}
              {selectedRestaurant.paymentStatus === 'overdue' && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium text-red-700">
                        Pago vencido - Suspensión automática en 3 días
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Datos (Productos) */}
      <Dialog open={dataDialogOpen} onOpenChange={setDataDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Datos del Restaurante - {selectedRestaurant?.name}
            </DialogTitle>
            <DialogDescription>Lista de productos y migración masiva</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Activo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataProducts.map((p:any) => (
                    <TableRow key={p.id_producto}>
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell>{p.id_categoria || '-'}</TableCell>
                      <TableCell>${Number(p.precio||0).toLocaleString()}</TableCell>
                      <TableCell>{p.stock_actual ?? '-'}</TableCell>
                      <TableCell>{p.activo ? <Badge className="bg-green-100 text-green-800">Sí</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Migrar productos desde Excel/CSV (subir JSON generado o pegar JSON)</p>
              <p className="text-xs text-gray-500">Formato requerido por fila:</p>
              <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto">
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
              <p className="text-xs text-gray-500">Columnas mínimas: nombre (string), precio (number). Opcionales: categoria_nombre (string), stock (number), activo (boolean), imagen_url (string).</p>
              <Textarea id="jsonImport" placeholder="Pega aquí el JSON de productos" className="h-40" />
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
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={fileBusy}
                  className="inline-flex items-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {fileBusy ? 'Procesando...' : 'Subir Excel/CSV'}
                </Button>
                <span className="text-xs text-gray-500">Formatos: CSV, XLSX, XLS</span>
                <div className="flex items-center gap-2 ml-auto">
                  <Select value={templateFormat} onValueChange={(v) => setTemplateFormat(v as any)}>
                    <SelectTrigger className="w-28 h-9">
                      <SelectValue placeholder="Formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xlsx">XLSX</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={downloadTemplate} className="inline-flex items-center">
                    <FileDown className="h-4 w-4 mr-2" />
                    Descargar plantilla
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={async () => {
                  const el = document.getElementById('jsonImport') as HTMLTextAreaElement;
                  await handleImportJson(selectedRestaurant.id, el.value);
                }} disabled={importing}>
                  {importing ? 'Importando...' : 'Importar JSON'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
