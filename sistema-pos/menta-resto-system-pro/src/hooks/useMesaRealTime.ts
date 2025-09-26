// src/hooks/useMesaRealTime.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { getMesas } from '@/services/api';

interface Mesa {
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

interface UseMesaRealTimeOptions {
  sucursalId: number;
  refetchInterval?: number;
  enabled?: boolean;
}

export const useMesaRealTime = ({ 
  sucursalId, 
  refetchInterval = 5000, // 5 segundos por defecto
  enabled = true 
}: UseMesaRealTimeOptions) => {
  const queryClient = useQueryClient();

  // Query principal para obtener mesas
  const {
    data: mesas = [],
    isLoading,
    error,
    refetch
  } = useQuery<Mesa[]>({
    queryKey: ['mesas', sucursalId],
    queryFn: () => getMesas(sucursalId),
    enabled: enabled && !!sucursalId,
    refetchInterval: refetchInterval,
    refetchIntervalInBackground: true,
    staleTime: 2000, // Considerar datos obsoletos después de 2 segundos
    gcTime: 10000, // Mantener en cache por 10 segundos
  });

  // Función para invalidar y refrescar datos específicos
  const invalidateMesaData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId] });
    queryClient.invalidateQueries({ queryKey: ['estadisticas-mesas', sucursalId] });
    queryClient.invalidateQueries({ queryKey: ['prefactura'] });
  }, [queryClient, sucursalId]);

  // Función para actualizar una mesa específica en el cache
  const updateMesaInCache = useCallback((mesaId: number, updates: Partial<Mesa>) => {
    queryClient.setQueryData(['mesas', sucursalId], (oldData: Mesa[] | undefined) => {
      if (!oldData) return oldData;
      
      return oldData.map(mesa => 
        mesa.id_mesa === mesaId 
          ? { ...mesa, ...updates }
          : mesa
      );
    });
  }, [queryClient, sucursalId]);

  // Función para resetear una mesa específica (usado después de liberar/pagar)
  const resetMesaInCache = useCallback((mesaId: number) => {
    queryClient.setQueryData(['mesas', sucursalId], (oldData: Mesa[] | undefined) => {
      if (!oldData) return oldData;
      
      return oldData.map(mesa => 
        mesa.id_mesa === mesaId 
          ? { 
              ...mesa, 
              estado: 'libre',
              total_acumulado: 0,
              hora_apertura: null,
              id_venta_actual: null
            }
          : mesa
      );
    });
    
    // También invalidar estadísticas
    queryClient.invalidateQueries({ queryKey: ['estadisticas-mesas', sucursalId] });
  }, [queryClient, sucursalId]);

  // Función para forzar actualización inmediata
  const forceRefresh = useCallback(async () => {
    await refetch();
    invalidateMesaData();
  }, [refetch, invalidateMesaData]);

  // Efecto para limpiar cache cuando se desmonta el componente
  useEffect(() => {
    return () => {
      // No limpiar cache aquí para mantener datos entre navegaciones
    };
  }, []);

  return {
    mesas,
    isLoading,
    error,
    invalidateMesaData,
    updateMesaInCache,
    resetMesaInCache,
    forceRefresh,
    refetch
  };
};
