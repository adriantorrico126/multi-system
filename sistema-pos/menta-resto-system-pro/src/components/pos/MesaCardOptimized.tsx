// src/components/pos/MesaCardOptimized.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Coffee, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  X, 
  Users, 
  DollarSign,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { liberarMesa, generarPrefactura } from '@/services/api';
import { CobrarButtonOptimized } from './CobrarButtonOptimized';

interface MesaLocal {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
  total_acumulado?: number;
  hora_apertura?: string;
  id_sucursal: number;
  id_grupo_mesa?: number;
  nombre_mesero_grupo?: string;
  id_venta_actual?: number;
}

interface MesaCardOptimizedProps {
  mesa: MesaLocal;
  sucursalId: number;
  onShowPrefactura: (mesa: MesaLocal) => void;
  onResetMesa: (mesaId: number) => void;
  onShowMetodosPago?: (mesa: MesaLocal) => void;
}

const getEstadoConfig = (estado: string) => {
  switch (estado) {
    case 'libre':
      return {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle,
        label: 'Libre'
      };
    case 'en_uso':
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: Coffee,
        label: 'En Uso'
      };
    case 'pendiente_cobro':
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock,
        label: 'Pendiente Cobro'
      };
    case 'reservada':
      return {
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: Users,
        label: 'Reservada'
      };
    case 'mantenimiento':
      return {
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: AlertCircle,
        label: 'Mantenimiento'
      };
    default:
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: AlertCircle,
        label: estado
      };
  }
};

export const MesaCardOptimized: React.FC<MesaCardOptimizedProps> = ({
  mesa,
  sucursalId,
  onShowPrefactura,
  onResetMesa,
  onShowMetodosPago
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const estadoConfig = getEstadoConfig(mesa.estado);
  const EstadoIcon = estadoConfig.icon;

  // Mutación para liberar mesa
  const liberarMesaMutation = useMutation({
    mutationFn: ({ id_mesa }: { id_mesa: number }) => liberarMesa(id_mesa),
    onSuccess: (data) => {
      toast({
        title: "Mesa Liberada",
        description: `Mesa ${data.data.mesa.numero} liberada exitosamente. Total anterior: $${data.data.total_final}`,
      });
      // Resetear mesa en cache inmediatamente
      onResetMesa(mesa.id_mesa);
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-mesas', sucursalId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al liberar la mesa.",
        variant: "destructive",
      });
    },
  });

  const handleLiberarMesa = () => {
    liberarMesaMutation.mutate({ id_mesa: mesa.id_mesa });
  };

  const handleVerPrefactura = () => {
    onShowPrefactura(mesa);
  };

  const isLoading = liberarMesaMutation.isPending;

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${isLoading ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">{mesa.numero}</span>
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                Mesa {mesa.numero}
              </CardTitle>
              <p className="text-sm text-gray-500">
                Capacidad: {mesa.capacidad} personas
              </p>
            </div>
          </div>
          <Badge className={estadoConfig.color}>
            <EstadoIcon className="h-3 w-3 mr-1" />
            {estadoConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Información de la mesa */}
        <div className="space-y-2">
          {mesa.total_acumulado && mesa.total_acumulado > 0 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Total Acumulado:</span>
              </div>
              <span className="text-lg font-bold text-green-600">
                ${Number(mesa.total_acumulado || 0).toFixed(2)}
              </span>
            </div>
          )}

          {mesa.hora_apertura && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Abierta: {new Date(mesa.hora_apertura).toLocaleTimeString()}</span>
            </div>
          )}

          {mesa.nombre_mesero_grupo && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>Mesero: {mesa.nombre_mesero_grupo}</span>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2">
          {(mesa.estado === 'en_uso' || mesa.estado === 'pendiente_cobro') && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleVerPrefactura}
                className="flex-1"
                disabled={!mesa.id_venta_actual}
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver Prefactura
              </Button>
              
              {/* Botón de cobrar optimizado - aparece para pagos diferidos */}
              <CobrarButtonOptimized
                mesa={mesa}
                sucursalId={sucursalId}
                onResetMesa={onResetMesa}
                onShowMetodosPago={onShowMetodosPago}
              />
              
              <Button
                size="sm"
                variant="destructive"
                onClick={handleLiberarMesa}
                disabled={isLoading}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Liberar
              </Button>
            </>
          )}

          {mesa.estado === 'libre' && (
            <div className="w-full text-center py-2">
              <span className="text-sm text-gray-500 italic">Mesa disponible</span>
            </div>
          )}

          {isLoading && (
            <div className="w-full flex items-center justify-center py-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-600">Procesando...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
