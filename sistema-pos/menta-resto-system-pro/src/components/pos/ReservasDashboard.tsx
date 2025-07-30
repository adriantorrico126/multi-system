import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  XCircle,
  CheckCircle,
  AlertCircle,
  Info,
  Search,
  Filter
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  getReservas, 
  cancelarReserva, 
  eliminarReserva 
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ReservaModal } from './ReservaModal';

interface Reserva {
  id_reserva: number;
  id_mesa: number;
  numero_mesa: number;
  nombre_cliente: string;
  telefono_cliente?: string;
  email_cliente?: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  numero_personas: number;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'no_show';
  observaciones?: string;
  nombre_mesero?: string;
}

interface ReservasDashboardProps {
  sucursalId: number;
}

export function ReservasDashboard({ sucursalId }: ReservasDashboardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [showReservaModal, setShowReservaModal] = useState(false);

  // Query para obtener reservas
  const {
    data: reservas = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['reservas', sucursalId],
    queryFn: () => getReservas(sucursalId),
    enabled: !!sucursalId
  });

  // Mutación para cancelar reserva
  const cancelarReservaMutation = useMutation({
    mutationFn: ({ id_reserva, motivo }: { id_reserva: number; motivo?: string }) => 
      cancelarReserva(id_reserva, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      toast.success('Reserva cancelada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al cancelar reserva');
    }
  });

  // Mutación para eliminar reserva
  const eliminarReservaMutation = useMutation({
    mutationFn: eliminarReserva,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      toast.success('Reserva eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar reserva');
    }
  });

  // Filtrar reservas
  const filteredReservas = reservas.filter(reserva => {
    const matchesSearch = 
      reserva.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reserva.numero_mesa.toString().includes(searchTerm) ||
      reserva.telefono_cliente?.includes(searchTerm) ||
      reserva.email_cliente?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filterEstado === 'todos' || reserva.estado === filterEstado;
    
    return matchesSearch && matchesEstado;
  });

  const handleCancelReserva = (id_reserva: number) => {
    const motivo = prompt('Motivo de cancelación (opcional):');
    cancelarReservaMutation.mutate({ id_reserva, motivo });
  };

  const handleDeleteReserva = (id_reserva: number) => {
    if (confirm('¿Está seguro de que desea eliminar esta reserva?')) {
      eliminarReservaMutation.mutate(id_reserva);
    }
  };

  const handleEditReserva = (reserva: Reserva) => {
    setSelectedReserva(reserva);
    setShowReservaModal(true);
  };

  const getEstadoBadge = (estado: string) => {
    const estados = {
      pendiente: { label: 'Pendiente', className: 'bg-yellow-500 text-white' },
      confirmada: { label: 'Confirmada', className: 'bg-green-500 text-white' },
      cancelada: { label: 'Cancelada', className: 'bg-red-500 text-white' },
      completada: { label: 'Completada', className: 'bg-blue-500 text-white' },
      no_show: { label: 'No Show', className: 'bg-gray-500 text-white' }
    };
    
    const estadoConfig = estados[estado as keyof typeof estados] || estados.pendiente;
    return <Badge className={estadoConfig.className}>{estadoConfig.label}</Badge>;
  };

  const getEstadisticas = () => {
    const total = reservas.length;
    const confirmadas = reservas.filter(r => r.estado === 'confirmada').length;
    const pendientes = reservas.filter(r => r.estado === 'pendiente').length;
    const canceladas = reservas.filter(r => r.estado === 'cancelada').length;
    const completadas = reservas.filter(r => r.estado === 'completada').length;

    return { total, confirmadas, pendientes, canceladas, completadas };
  };

  const estadisticas = getEstadisticas();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando reservas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="mt-2 text-red-600">Error al cargar reservas</p>
          <Button onClick={() => refetch()} className="mt-2">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Reservas</h2>
          <p className="text-gray-600">Administra las reservas de mesas</p>
        </div>
        <Button onClick={() => setShowReservaModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Reserva
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Confirmadas</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.confirmadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Canceladas</p>
                <p className="text-2xl font-bold text-red-600">{estadisticas.canceladas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-blue-600">{estadisticas.completadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por cliente, mesa, teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="filter">Estado</Label>
              <select
                id="filter"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="confirmada">Confirmadas</option>
                <option value="cancelada">Canceladas</option>
                <option value="completada">Completadas</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Reservas */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas ({filteredReservas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Personas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservas.map((reserva) => (
                  <TableRow key={reserva.id_reserva}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reserva.nombre_cliente}</div>
                        {reserva.observaciones && (
                          <div className="text-sm text-gray-500">{reserva.observaciones}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Mesa {reserva.numero_mesa}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {format(new Date(reserva.fecha_hora_inicio), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(reserva.fecha_hora_inicio), 'HH:mm')} - {format(new Date(reserva.fecha_hora_fin), 'HH:mm')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-500" />
                        {reserva.numero_personas}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getEstadoBadge(reserva.estado)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {reserva.telefono_cliente && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {reserva.telefono_cliente}
                          </div>
                        )}
                        {reserva.email_cliente && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {reserva.email_cliente}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditReserva(reserva)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {reserva.estado === 'confirmada' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelReserva(reserva.id_reserva)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteReserva(reserva.id_reserva)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredReservas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron reservas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Reserva */}
      {showReservaModal && (
        <ReservaModal
          isOpen={showReservaModal}
          onClose={() => {
            setShowReservaModal(false);
            setSelectedReserva(null);
          }}
          reserva={selectedReserva}
          sucursalId={sucursalId}
        />
      )}
    </div>
  );
} 