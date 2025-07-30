import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Save, 
  X,
  AlertCircle
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, addHours } from 'date-fns';
import { toast } from 'sonner';
import { crearReserva, actualizarReserva, getMesas } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface Reserva {
  id_reserva?: number;
  id_mesa: number;
  numero_mesa?: number;
  nombre_cliente: string;
  telefono_cliente?: string;
  email_cliente?: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  numero_personas: number;
  estado?: 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'no_show';
  observaciones?: string;
  nombre_mesero?: string;
}

interface Mesa {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
}

interface ReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mesa?: Mesa;
  reserva?: Reserva;
  sucursalId: number;
}

export function ReservaModal({ isOpen, onClose, mesa, reserva, sucursalId }: ReservaModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!reserva;

  const [formData, setFormData] = useState({
    id_mesa: mesa?.id_mesa || 0,
    nombre_cliente: '',
    telefono_cliente: '',
    email_cliente: '',
    fecha_hora_inicio: '',
    fecha_hora_fin: '',
    numero_personas: 1,
    observaciones: ''
  });

  // Query para obtener mesas disponibles
  const { data: mesas = [] } = useQuery({
    queryKey: ['mesas', sucursalId],
    queryFn: () => getMesas(sucursalId),
    enabled: !!sucursalId
  });

  // Mutación para crear reserva
  const crearReservaMutation = useMutation({
    mutationFn: (data: any) => {
      console.log('🔍 [ReservaModal] crearReservaMutation.mutateFn llamado con:', data);
      return crearReserva(data);
    },
    onSuccess: (data) => {
      console.log('✅ [ReservaModal] crearReservaMutation.onSuccess:', data);
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      toast.success('Reserva creada exitosamente');
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      console.error('❌ [ReservaModal] crearReservaMutation.onError:', error);
      toast.error(error?.response?.data?.message || 'Error al crear reserva');
    }
  });

  // Mutación para actualizar reserva
  const actualizarReservaMutation = useMutation({
    mutationFn: ({ id_reserva, datos }: { id_reserva: number; datos: any }) => 
      actualizarReserva(id_reserva, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      toast.success('Reserva actualizada exitosamente');
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar reserva');
    }
  });

  const resetForm = () => {
    setFormData({
      id_mesa: mesa?.id_mesa || 0,
      nombre_cliente: '',
      telefono_cliente: '',
      email_cliente: '',
      fecha_hora_inicio: '',
      fecha_hora_fin: '',
      numero_personas: 1,
      observaciones: ''
    });
  };

  const handleSubmit = () => {
    console.log('🔍 [ReservaModal] handleSubmit llamado');
    console.log('🔍 [ReservaModal] formData:', formData);
    console.log('🔍 [ReservaModal] isEditing:', isEditing);
    console.log('🔍 [ReservaModal] reserva:', reserva);
    
    if (!formData.id_mesa || !formData.nombre_cliente || !formData.fecha_hora_inicio || !formData.fecha_hora_fin) {
      console.log('❌ [ReservaModal] Validación fallida - campos faltantes');
      console.log('🔍 [ReservaModal] id_mesa:', formData.id_mesa);
      console.log('🔍 [ReservaModal] nombre_cliente:', formData.nombre_cliente);
      console.log('🔍 [ReservaModal] fecha_hora_inicio:', formData.fecha_hora_inicio);
      console.log('🔍 [ReservaModal] fecha_hora_fin:', formData.fecha_hora_fin);
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    if (new Date(formData.fecha_hora_inicio) >= new Date(formData.fecha_hora_fin)) {
      console.log('❌ [ReservaModal] Validación fallida - fechas incorrectas');
      toast.error('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }

    // Validar que las fechas sean futuras
    const now = new Date();
    const fechaInicio = new Date(formData.fecha_hora_inicio);
    const fechaFin = new Date(formData.fecha_hora_fin);
    
    if (fechaInicio <= now) {
      console.log('❌ [ReservaModal] Validación fallida - fecha de inicio no es futura');
      toast.error('La fecha de inicio debe ser futura');
      return;
    }
    
    if (fechaFin <= now) {
      console.log('❌ [ReservaModal] Validación fallida - fecha de fin no es futura');
      toast.error('La fecha de fin debe ser futura');
      return;
    }

    const reservaData = {
      ...formData,
      id_mesa: parseInt(formData.id_mesa.toString())
    };

    console.log('🔍 [ReservaModal] reservaData a enviar:', reservaData);

    if (isEditing && reserva?.id_reserva) {
      console.log('🔍 [ReservaModal] Actualizando reserva existente');
      actualizarReservaMutation.mutate({
        id_reserva: reserva.id_reserva,
        datos: reservaData
      });
    } else {
      console.log('🔍 [ReservaModal] Creando nueva reserva');
      crearReservaMutation.mutate(reservaData);
    }
  };

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (isEditing && reserva) {
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
        // Para nueva reserva, establecer fecha y hora por defecto (futura)
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1); // Mañana
        tomorrow.setHours(18, 0, 0, 0); // 6:00 PM
        
        const startTime = format(tomorrow, "yyyy-MM-dd'T'HH:mm");
        const endTime = format(addHours(tomorrow, 2), "yyyy-MM-dd'T'HH:mm");
        
        setFormData({
          id_mesa: mesa?.id_mesa || 0,
          nombre_cliente: '',
          telefono_cliente: '',
          email_cliente: '',
          fecha_hora_inicio: startTime,
          fecha_hora_fin: endTime,
          numero_personas: 1,
          observaciones: ''
        });
      }
    }
  }, [isOpen, reserva, mesa, isEditing]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isEditing ? 'Editar Reserva' : 'Nueva Reserva'}
            {isEditing && reserva?.estado && getEstadoBadge(reserva.estado)}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifica los detalles de la reserva existente.' : 'Completa los datos para crear una nueva reserva.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Información de la mesa */}
          {mesa && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-900">Mesa {mesa.numero}</span>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  Capacidad: {mesa.capacidad} personas
                </Badge>
              </div>
              <div className="text-sm text-blue-700">
                Estado actual: <span className="font-medium">{mesa.estado}</span>
              </div>
            </div>
          )}

          {/* Formulario */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mesa">Mesa *</Label>
              <Select 
                value={formData.id_mesa.toString()} 
                onValueChange={(value) => setFormData({...formData, id_mesa: parseInt(value)})}
                disabled={!!mesa} // Deshabilitar si se seleccionó desde una mesa específica
              >
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
                placeholder="Nombre completo del cliente"
              />
            </div>

            <div>
              <Label htmlFor="telefono_cliente">Teléfono</Label>
              <Input
                id="telefono_cliente"
                value={formData.telefono_cliente}
                onChange={(e) => setFormData({...formData, telefono_cliente: e.target.value})}
                placeholder="+591 70012345"
              />
            </div>

            <div>
              <Label htmlFor="email_cliente">Email</Label>
              <Input
                id="email_cliente"
                type="email"
                value={formData.email_cliente}
                onChange={(e) => setFormData({...formData, email_cliente: e.target.value})}
                placeholder="cliente@email.com"
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
                placeholder="Observaciones especiales, preferencias, etc..."
                rows={3}
              />
            </div>
          </div>

          {/* Información adicional */}
          {isEditing && reserva && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Información de la Reserva</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">ID de Reserva:</span>
                  <span className="ml-2 text-gray-900">{reserva.id_reserva}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Estado:</span>
                  <span className="ml-2">{getEstadoBadge(reserva.estado || 'pendiente')}</span>
                </div>
                {reserva.nombre_mesero && (
                  <div>
                    <span className="font-medium text-gray-700">Registrado por:</span>
                    <span className="ml-2 text-gray-900">{reserva.nombre_mesero}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={crearReservaMutation.isPending || actualizarReservaMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Actualizar' : 'Crear'} Reserva
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 