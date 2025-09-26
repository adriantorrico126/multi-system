import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Banknote, Smartphone, Wallet, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { marcarMesaComoPagada, getMetodosPago } from '@/services/api';

interface MesaLocal {
  id_mesa: number;
  numero: number;
  total_acumulado?: number;
  estado: string;
}

interface MetodosPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  mesa: MesaLocal | null;
  sucursalId: number;
  onSuccess?: () => void;
  onResetMesa?: (mesaId: number) => void;
}

// Función para obtener el icono apropiado según el método de pago
const getIconoMetodo = (descripcion: string) => {
  const desc = descripcion.toLowerCase();
  if (desc.includes('efectivo')) return Banknote;
  if (desc.includes('tarjeta') || desc.includes('crédito') || desc.includes('débito')) return CreditCard;
  if (desc.includes('transferencia') || desc.includes('móvil')) return Smartphone;
  return Wallet; // Por defecto
};

// Función para obtener el color apropiado según el método de pago
const getColorMetodo = (descripcion: string) => {
  const desc = descripcion.toLowerCase();
  if (desc.includes('efectivo')) return 'bg-green-500 hover:bg-green-600';
  if (desc.includes('tarjeta') || desc.includes('crédito') || desc.includes('débito')) return 'bg-blue-500 hover:bg-blue-600';
  if (desc.includes('transferencia') || desc.includes('móvil')) return 'bg-purple-500 hover:bg-purple-600';
  return 'bg-orange-500 hover:bg-orange-600'; // Por defecto
};

export const MetodosPagoModal: React.FC<MetodosPagoModalProps> = ({
  isOpen,
  onClose,
  mesa,
  sucursalId,
  onSuccess,
  onResetMesa
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  // Obtener métodos de pago desde la base de datos
  const { data: metodosPagoDB = [], isLoading: loadingMetodos } = useQuery({
    queryKey: ['metodos-pago'],
    queryFn: getMetodosPago,
    enabled: isOpen, // Solo cargar cuando el modal esté abierto
  });

  // Filtrar solo métodos activos y excluir "Pago Diferido"
  const metodosPagoActivos = metodosPagoDB.filter((metodo: any) => 
    metodo.activo && !metodo.descripcion.toLowerCase().includes('diferido')
  );

  const marcarPagadaMutation = useMutation({
    mutationFn: marcarMesaComoPagada,
    onSuccess: (data) => {
      toast({
        title: "✅ Pago registrado",
        description: `Mesa ${mesa?.numero} marcada como pagada con ${metodoSeleccionado}`,
      });
      
      if (onResetMesa && mesa) {
        onResetMesa(mesa.id_mesa);
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Limpiar selección y cerrar modal
      setMetodoSeleccionado(null);
      onClose();
    },
    onError: (error: any) => {
      console.error('Error al marcar mesa como pagada:', error);
      toast({
        title: "❌ Error",
        description: error.response?.data?.message || "Error al procesar el pago",
        variant: "destructive",
      });
      setProcesando(false);
    },
  });

  const handleSeleccionarMetodo = (metodoId: string) => {
    setMetodoSeleccionado(metodoId);
  };

  const handleConfirmarPago = async () => {
    if (!mesa || !metodoSeleccionado) return;
    
    setProcesando(true);
    
    try {
      // Encontrar el método seleccionado para obtener su descripción
      const metodoSeleccionadoObj = metodosPagoActivos.find((metodo: any) => 
        metodo.id_pago.toString() === metodoSeleccionado
      );
      
      // Marcar mesa como pagada con el método seleccionado
      await marcarPagadaMutation.mutateAsync({ 
        id_mesa: mesa.id_mesa,
        metodo_pago: metodoSeleccionadoObj?.descripcion || metodoSeleccionado
      });
    } catch (error) {
      console.error('Error al confirmar pago:', error);
      setProcesando(false);
    }
  };

  const handleCancelar = () => {
    setMetodoSeleccionado(null);
    onClose();
  };

  if (!mesa) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Método de Pago - Mesa {mesa.numero}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información de la mesa */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total a pagar:</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${Number(mesa.total_acumulado || 0).toFixed(2)}
                  </p>
                </div>
                <Badge variant="outline" className="bg-blue-50">
                  Mesa {mesa.numero}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Selección de método de pago */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Selecciona el método de pago:</h3>
            
            {loadingMetodos ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Cargando métodos de pago...</span>
              </div>
            ) : metodosPagoActivos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No hay métodos de pago disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {metodosPagoActivos.map((metodo: any) => {
                  const IconComponent = getIconoMetodo(metodo.descripcion);
                  const colorMetodo = getColorMetodo(metodo.descripcion);
                  const isSelected = metodoSeleccionado === metodo.id_pago.toString();
                  
                  return (
                    <Button
                      key={metodo.id_pago}
                      variant={isSelected ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col items-center space-y-2 relative ${
                        isSelected 
                          ? colorMetodo + ' text-white' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleSeleccionarMetodo(metodo.id_pago.toString())}
                      disabled={procesando}
                    >
                      <IconComponent className="h-6 w-6" />
                      <div className="text-center">
                        <p className="font-medium text-sm">{metodo.descripcion}</p>
                        <p className="text-xs opacity-75">ID: {metodo.id_pago}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-4 w-4 absolute top-2 right-2" />
                      )}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelar}
              className="flex-1"
              disabled={procesando}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarPago}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={!metodoSeleccionado || procesando}
            >
              {procesando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Pago
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
