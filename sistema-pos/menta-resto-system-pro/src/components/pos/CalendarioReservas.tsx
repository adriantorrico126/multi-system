import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  getReservas, 
  crearReserva, 
  actualizarReserva, 
  cancelarReserva, 
  eliminarReserva,
  getMesas 
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';

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

interface Mesa {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
}

interface CalendarioReservasProps {
  sucursalId: number;
}

export function CalendarioReservas({ sucursalId }: CalendarioReservasProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null);
  const [selectedMesa, setSelectedMesa] = useState<number | null>(null);

  // Estados para el formulario de reserva
  const [formData, setFormData] = useState({
    id_mesa: 0,
    nombre_cliente: '',
    telefono_cliente: '',
    email_cliente: '',
    fecha_hora_inicio: '',
    fecha_hora_fin: '',
    numero_personas: 1,
    observaciones: ''
  });

  // Query para obtener reservas del mes actual
  const {
    data: reservas = [],
    isLoading: isLoadingReservas,
    error: errorReservas,
    refetch: refetchReservas
  } = useQuery({
    queryKey: ['reservas', sucursalId, format(currentDate, 'yyyy-MM')],
    queryFn: () => getReservas(sucursalId),
    enabled: !!sucursalId
  });

  // Query para obtener mesas disponibles
  const {
    data: mesas = [],
    isLoading: isLoadingMesas
  } = useQuery({
    queryKey: ['mesas', sucursalId],
    queryFn: () => getMesas(sucursalId),
    enabled: !!sucursalId
  });

  // Mutación para crear reserva
  const crearReservaMutation = useMutation({
    mutationFn: crearReserva,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      toast.success('Reserva creada exitosamente');
      setShowReservaModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear reserva');
    }
  });

  // Mutación para actualizar reserva
  const actualizarReservaMutation = useMutation({
    mutationFn: ({ id_reserva, datos }: { id_reserva: number; datos: any }) => 
      actualizarReserva(id_reserva, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      toast.success('Reserva actualizada exitosamente');
      setShowReservaModal(false);
      setEditingReserva(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar reserva');
    }
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

  const resetForm = () => {
    setFormData({
      id_mesa: 0,
      nombre_cliente: '',
      telefono_cliente: '',
      email_cliente: '',
      fecha_hora_inicio: '',
      fecha_hora_fin: '',
      numero_personas: 1,
      observaciones: ''
    });
  };

  const handleCreateReserva = () => {
    if (!formData.id_mesa || !formData.nombre_cliente || !formData.fecha_hora_inicio || !formData.fecha_hora_fin) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    const reservaData = {
      ...formData,
      id_mesa: parseInt(formData.id_mesa.toString())
    };

    crearReservaMutation.mutate(reservaData);
  };

  const handleUpdateReserva = () => {
    if (!editingReserva) return;

    const reservaData = {
      ...formData,
      id_mesa: parseInt(formData.id_mesa.toString())
    };

    actualizarReservaMutation.mutate({
      id_reserva: editingReserva.id_reserva,
      datos: reservaData
    });
  };

  const handleCancelReserva = (id_reserva: number) => {
    const motivo = prompt('Motivo de cancelación (opcional):');
    cancelarReservaMutation.mutate({ id_reserva, motivo });
  };

  const handleDeleteReserva = (id_reserva: number) => {
    if (confirm('¿Está seguro de que desea eliminar esta reserva?')) {
      eliminarReservaMutation.mutate(id_reserva);
    }
  };

  const openReservaModal = (reserva?: Reserva) => {
    if (reserva) {
      setEditingReserva(reserva);
      setFormData({
        id_mesa: reserva.id_mesa,
        nombre_cliente: reserva.nombre_cliente,
        telefono_cliente: reserva.telefono_cliente || '',
        email_cliente: reserva.email_cliente || '',
        fecha_hora_inicio: format(new Date(reserva.fecha_hora_inicio), "yyyy-MM-dd'T'HH:mm"),
        fecha_hora_fin: format(new Date(reserva.fecha_hora_fin), "yyyy-MM-dd'T'HH:mm"),
        numero_personas: reserva.numero_personas,
        observaciones: reserva.observaciones || ''
      });
    } else {
      setEditingReserva(null);
      resetForm();
    }
    setShowReservaModal(true);
  };

  const getReservasForDate = (date: Date) => {
    return reservas.filter(reserva => 
      isSameDay(new Date(reserva.fecha_hora_inicio), date)
    );
  };

  const getEstadoBadge = (estado: string) => {
    const estados = {
      pendiente: { label: 'Pendiente', className: 'bg-yellow-500 text-white' },
      confirmada: { label: 'Confirmada', className: 'bg-green-500 text-white' },
      cancelada: { label: 'Cancelada', className: 'bg-red-500 text-white' },
      completada: { label: 'Completada', className: 'bg-blue-500 text-white' },
      no_show: { label: 'No Show', className: 'bg-gray-500 text-white' }
    };
    
    const estado = estados[estado as keyof typeof estados] || estados.pendiente;
    return <Badge className={estado.className}>{estado.label}</Badge>;
  };

  const renderCalendarDays = () => {
    const start = viewMode === 'month' ? startOfMonth(currentDate) : startOfWeek(currentDate);
    const end = viewMode === 'month' ? endOfMonth(currentDate) : endOfWeek(currentDate);
    const days = eachDayOfInterval({ start, end });

    return days.map((day, index) => {
      const dayReservas = getReservasForDate(day);
      const isCurrentMonth = viewMode === 'month' ? isSameMonth(day, currentDate) : true;
      const isToday = isSameDay(day, new Date());
      const isSelected = selectedDate && isSameDay(day, selectedDate);

      return (
        <div
          key={index}
          className={`
            min-h-[120px] p-2 border border-gray-200 cursor-pointer transition-all
            ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
            ${isToday ? 'ring-2 ring-blue-500' : ''}
            ${isSelected ? 'ring-2 ring-purple-500 bg-purple-50' : ''}
            hover:bg-gray-50
          `}
          onClick={() => setSelectedDate(day)}
        >
          <div className="text-sm font-medium text-gray-900 mb-1">
            {format(day, 'd')}
          </div>
          <div className="space-y-1">
            {dayReservas.slice(0, 3).map((reserva) => (
              <div
                key={reserva.id_reserva}
                className="text-xs p-1 rounded bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                onClick={(e) => {
                  e.stopPropagation();
                  openReservaModal(reserva);
                }}
              >
                <div className="font-medium">{reserva.nombre_cliente}</div>
                <div className="text-xs">Mesa {reserva.numero_mesa} • {format(new Date(reserva.fecha_hora_inicio), 'HH:mm')}</div>
                {getEstadoBadge(reserva.estado)}
              </div>
            ))}
            {dayReservas.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{dayReservas.length - 3} más
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  if (isLoadingReservas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando reservas...</p>
        </div>
      </div>
    );
  }

  if (errorReservas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="mt-2 text-red-600">Error al cargar reservas</p>
          <Button onClick={() => refetchReservas()} className="mt-2">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del Calendario */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value: 'month' | 'week') => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mes</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => openReservaModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* Calendario */}
      <Card>
        <CardContent className="p-0">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div key={day} className="bg-gray-50 p-3 text-center font-medium text-gray-700">
                {day}
              </div>
            ))}
          </div>
          
          {/* Días del calendario */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {renderCalendarDays()}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Reserva */}
      <Dialog open={showReservaModal} onOpenChange={setShowReservaModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingReserva ? 'Editar Reserva' : 'Nueva Reserva'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mesa">Mesa *</Label>
              <Select value={formData.id_mesa.toString()} onValueChange={(value) => setFormData({...formData, id_mesa: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mesa" />
                </SelectTrigger>
                <SelectContent>
                  {mesas.map((mesa) => (
                    <SelectItem key={mesa.id_mesa} value={mesa.id_mesa.toString()}>
                      Mesa {mesa.numero} (Capacidad: {mesa.capacidad})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="numero_personas">Número de Personas *</Label>
              <Input
                id="numero_personas"
                type="number"
                min="1"
                value={formData.numero_personas}
                onChange={(e) => setFormData({...formData, numero_personas: parseInt(e.target.value)})}
              />
            </div>

            <div>
              <Label htmlFor="nombre_cliente">Nombre del Cliente *</Label>
              <Input
                id="nombre_cliente"
                value={formData.nombre_cliente}
                onChange={(e) => setFormData({...formData, nombre_cliente: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="telefono_cliente">Teléfono</Label>
              <Input
                id="telefono_cliente"
                value={formData.telefono_cliente}
                onChange={(e) => setFormData({...formData, telefono_cliente: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="email_cliente">Email</Label>
              <Input
                id="email_cliente"
                type="email"
                value={formData.email_cliente}
                onChange={(e) => setFormData({...formData, email_cliente: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="fecha_hora_inicio">Fecha y Hora de Inicio *</Label>
              <Input
                id="fecha_hora_inicio"
                type="datetime-local"
                value={formData.fecha_hora_inicio}
                onChange={(e) => setFormData({...formData, fecha_hora_inicio: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="fecha_hora_fin">Fecha y Hora de Fin *</Label>
              <Input
                id="fecha_hora_fin"
                type="datetime-local"
                value={formData.fecha_hora_fin}
                onChange={(e) => setFormData({...formData, fecha_hora_fin: e.target.value})}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                placeholder="Observaciones especiales..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowReservaModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={editingReserva ? handleUpdateReserva : handleCreateReserva}
              disabled={crearReservaMutation.isPending || actualizarReservaMutation.isPending}
            >
              {editingReserva ? 'Actualizar' : 'Crear'} Reserva
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 