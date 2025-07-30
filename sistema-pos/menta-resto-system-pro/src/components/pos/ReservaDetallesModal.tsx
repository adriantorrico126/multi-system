import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Users, Info, User, Phone, Mail, UtensilsCrossed, BookOpen, X, Trash2, MapPin, CreditCard } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelarReserva, eliminarReserva } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface ReservaDetallesModalProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: any;
}

const ReservaDetallesModal: React.FC<ReservaDetallesModalProps> = ({ isOpen, onClose, reserva }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!reserva) return null;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es });
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm", { locale: es });
  };

  // Mutación para cancelar reserva
  const cancelarReservaMutation = useMutation({
    mutationFn: ({ id_reserva, motivo }: { id_reserva: number; motivo?: string }) => 
      cancelarReserva(id_reserva, motivo),
    onSuccess: () => {
      toast({
        title: "Reserva Cancelada",
        description: "La reserva ha sido cancelada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      // Invalidar todas las queries de mesas que incluyan sucursalId
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'mesas' || 
          (Array.isArray(query.queryKey) && query.queryKey[0] === 'mesas')
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Error al cancelar la reserva.",
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar reserva
  const eliminarReservaMutation = useMutation({
    mutationFn: (id_reserva: number) => eliminarReserva(id_reserva),
    onSuccess: () => {
      toast({
        title: "Reserva Eliminada",
        description: "La reserva ha sido eliminada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      // Invalidar todas las queries de mesas que incluyan sucursalId
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'mesas' || 
          (Array.isArray(query.queryKey) && query.queryKey[0] === 'mesas')
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Error al eliminar la reserva.",
        variant: "destructive",
      });
    },
  });

  const handleCancelarReserva = () => {
    cancelarReservaMutation.mutate({ 
      id_reserva: reserva.id_reserva, 
      motivo: 'Cancelada por el usuario' 
    });
  };

  const handleEliminarReserva = () => {
    eliminarReservaMutation.mutate(reserva.id_reserva);
  };

  const getEstadoConfig = (estado: string) => {
    const configs = {
      'CONFIRMADA': { 
        label: 'Confirmada', 
        className: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg',
        icon: '✓'
      },
      'PENDIENTE': { 
        label: 'Pendiente', 
        className: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg',
        icon: '⏳'
      },
      'CANCELADA': { 
        label: 'Cancelada', 
        className: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg',
        icon: '✗'
      },
      'COMPLETADA': { 
        label: 'Completada', 
        className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg',
        icon: '✓'
      },
      'NO_SHOW': { 
        label: 'No Show', 
        className: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg',
        icon: '⚠'
      }
    };
    return configs[estado as keyof typeof configs] || configs['PENDIENTE'];
  };

  const estadoConfig = getEstadoConfig(reserva.estado);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-gray-50 to-blue-50 shadow-2xl rounded-xl border border-gray-200">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-4 -m-6 mb-4 sticky top-0 z-10">
          <DialogHeader className="text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    Detalles de la Reserva
                  </DialogTitle>
                  <DialogDescription className="text-blue-100 text-xs">
                    Información completa de la reserva
                  </DialogDescription>
                </div>
              </div>
              <Badge className={`px-3 py-1 text-xs font-semibold ${estadoConfig.className}`}>
                {estadoConfig.icon} {estadoConfig.label}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-4">
          {/* Información de la mesa */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <UtensilsCrossed className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 text-sm">Mesa {reserva.numero_mesa}</h3>
                <p className="text-xs text-blue-700">Capacidad: {reserva.capacidad_mesa} personas</p>
              </div>
            </div>
          </div>

          {/* Información del cliente */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <User className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-900 text-sm">Información del Cliente</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-800">
                  <span className="font-medium">Cliente:</span> {reserva.nombre_cliente_completo || reserva.nombre_cliente || 'N/A'}
                </span>
              </div>
              
              {reserva.telefono_cliente && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-800">
                    <span className="font-medium">Teléfono:</span> {reserva.telefono_cliente_completo || reserva.telefono_cliente}
                  </span>
                </div>
              )}
              
              {reserva.email_cliente && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-800">
                    <span className="font-medium">Email:</span> {reserva.email_cliente_completo || reserva.email_cliente}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Información de fecha y hora */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-purple-900 text-sm">Fecha y Hora</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-purple-600" />
                <span className="text-xs text-purple-800">
                  <span className="font-medium">Fecha:</span> {formatDate(reserva.fecha_hora_inicio)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-purple-600" />
                <span className="text-xs text-purple-800">
                  <span className="font-medium">Hora:</span> {formatTime(reserva.fecha_hora_inicio)} - {formatTime(reserva.fecha_hora_fin)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 text-purple-600" />
                <span className="text-xs text-purple-800">
                  <span className="font-medium">Personas:</span> {reserva.numero_personas}
                </span>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          {(reserva.observaciones || reserva.nombre_mesero) && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <Info className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="font-semibold text-orange-900 text-sm">Información Adicional</h3>
              </div>
              
              <div className="space-y-2">
                {reserva.observaciones && (
                  <div className="flex items-start gap-2">
                    <Info className="h-3 w-3 text-orange-600 mt-0.5" />
                    <span className="text-xs text-orange-800">
                      <span className="font-medium">Observaciones:</span> {reserva.observaciones}
                    </span>
                  </div>
                )}
                
                {reserva.nombre_mesero && (
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-orange-600" />
                    <span className="text-xs text-orange-800">
                      <span className="font-medium">Registrado por:</span> {reserva.nombre_mesero}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border-gray-300 shadow-sm text-xs py-2"
          >
            Cerrar
          </Button>
          
          {reserva.estado === 'CONFIRMADA' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-yellow-500 shadow-lg text-xs py-2"
                  disabled={cancelarReservaMutation.isPending}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancelar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white border border-gray-200 max-w-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-gray-900 text-sm">¿Cancelar Reserva?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600 text-xs">
                    Esta acción cancelará la reserva y liberará la mesa. ¿Estás seguro?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 text-xs">
                    No, mantener
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelarReserva}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-xs"
                    disabled={cancelarReservaMutation.isPending}
                  >
                    Sí, cancelar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-red-500 shadow-lg text-xs py-2"
                disabled={eliminarReservaMutation.isPending}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white border border-gray-200 max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-900 text-sm">¿Eliminar Reserva?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 text-xs">
                  Esta acción eliminará permanentemente la reserva. Esta acción no se puede deshacer. ¿Estás seguro?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 text-xs">
                  No, mantener
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleEliminarReserva}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-xs"
                  disabled={eliminarReservaMutation.isPending}
                >
                  Sí, eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReservaDetallesModal; 