import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Settings
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

export const RestaurantManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

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

  const handleViewDetails = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setDialogOpen(true);
  };

  const handleSuspendReactivate = (restaurant: any) => {
    console.log(`${restaurant.status === 'suspended' ? 'Reactivando' : 'Suspendiendo'} restaurante:`, restaurant.name);
    // Aquí iría la lógica para suspender/reactivar
  };

  const handleViewPayments = (restaurant: any) => {
    console.log('Ver historial de pagos para:', restaurant.name);
    // Aquí iría la lógica para mostrar historial de pagos
  };

  const handleSystemConfig = (restaurant: any) => {
    console.log('Configurar sistema para:', restaurant.name);
    // Aquí iría la lógica para configuración del sistema
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
        <CardHeader>
          <CardTitle>Gestión de Restaurantes</CardTitle>
          <CardDescription>Administra todos los restaurantes que usan el sistema POS</CardDescription>
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
                          <DropdownMenuItem onClick={() => handleViewPayments(restaurant)}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Historial de Pagos
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Activity className="mr-2 h-4 w-4" />
                            Actividad del Sistema
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            Tickets de Soporte
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleSystemConfig(restaurant)}>
                            <Settings className="mr-2 h-4 w-4" />
                            Configurar Sistema
                          </DropdownMenuItem>
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
                      <span className="text-sm text-gray-600">Propietario:</span>
                      <span className="text-sm font-medium">{selectedRestaurant.owner}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Empleados:</span>
                      <span className="text-sm font-medium">{selectedRestaurant.employees}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Registro:</span>
                      <span className="text-sm font-medium">{selectedRestaurant.registrationDate}</span>
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
                      <span className="text-sm text-gray-600">Uso del Sistema:</span>
                      <span className="text-sm font-medium">{selectedRestaurant.systemUsage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Última Actividad:</span>
                      <span className="text-sm font-medium">{selectedRestaurant.lastActivity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tickets Abiertos:</span>
                      <span className="text-sm font-medium">{selectedRestaurant.supportTickets}</span>
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
                      <p className="text-sm font-medium">{selectedRestaurant.lastPayment}</p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm text-gray-600">Próximo Pago</span>
                      <p className="text-sm font-medium">{selectedRestaurant.nextPayment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Métricas Administrativas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Ingresos/Mes</p>
                        <p className="text-lg font-bold">${selectedRestaurant.monthlyRevenue.toLocaleString()}</p>
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
    </div>
  );
};
