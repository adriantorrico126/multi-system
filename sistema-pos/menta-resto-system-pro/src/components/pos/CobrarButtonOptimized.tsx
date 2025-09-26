// src/components/pos/CobrarButtonOptimized.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { marcarMesaComoPagada } from '@/services/api';

interface CobrarButtonOptimizedProps {
  mesa: {
    id_mesa: number;
    numero: number;
    estado: string;
    total_acumulado?: number;
  };
  sucursalId: number;
  onSuccess?: () => void;
  onResetMesa?: (mesaId: number) => void;
  onShowMetodosPago?: (mesa: any) => void;
}

export const CobrarButtonOptimized: React.FC<CobrarButtonOptimizedProps> = ({
  mesa,
  sucursalId,
  onSuccess,
  onResetMesa,
  onShowMetodosPago
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mostrar el botón si la mesa está en estado 'pendiente_cobro' o 'en_uso' con total acumulado
  if (mesa.estado !== 'pendiente_cobro' && mesa.estado !== 'en_uso') {
    return null;
  }

  // No mostrar si no hay total acumulado
  if (!mesa.total_acumulado || mesa.total_acumulado <= 0) {
    return null;
  }

  // Mutación optimizada para marcar como pagada
  const marcarPagadaMutation = useMutation({
    mutationFn: ({ id_mesa }: { id_mesa: number }) => marcarMesaComoPagada({ id_mesa }),
    onSuccess: (data: any) => {
      toast({
        title: "Mesa Pagada",
        description: `Mesa ${data.data.mesa.numero} marcada como pagada exitosamente. Total cobrado: $${data.data.total_final}`,
      });
      
      // Resetear mesa en cache inmediatamente
      if (onResetMesa) {
        onResetMesa(mesa.id_mesa);
      }
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-mesas', sucursalId] });
      
      // Callback de éxito
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al marcar como pagada.",
        variant: "destructive",
      });
    },
  });

  const handleCobrar = () => {
    // Si es pago diferido (pendiente_cobro), mostrar métodos de pago
    if (mesa.estado === 'pendiente_cobro' && onShowMetodosPago) {
      onShowMetodosPago(mesa);
    } else {
      // Si no es pago diferido, procesar directamente
      marcarPagadaMutation.mutate({ id_mesa: mesa.id_mesa });
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleCobrar}
      disabled={marcarPagadaMutation.isPending}
      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
    >
      <CreditCard className="h-4 w-4 mr-1" />
      <span className="hidden sm:inline">Cobrar ${Number(mesa.total_acumulado || 0).toFixed(2)}</span>
      <span className="sm:hidden">Cobrar</span>
    </Button>
  );
};
