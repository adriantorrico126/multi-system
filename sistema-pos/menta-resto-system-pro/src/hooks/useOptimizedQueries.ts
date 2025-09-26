import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useCallback } from 'react';

// Hook para optimizar consultas con cache inteligente
export function useOptimizedQuery(queryKey: string[], queryFn: () => Promise<any>, options: any = {}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Obtener sucursal actual
  const getCurrentSucursalId = useCallback(() => {
    const savedSucursalId = localStorage.getItem('selectedSucursalId');
    return savedSucursalId ? parseInt(savedSucursalId) : (user?.sucursal?.id || 1);
  }, [user?.sucursal?.id]);

  const currentSucursalId = getCurrentSucursalId();

  // Configuración optimizada por defecto
  const defaultOptions = {
    staleTime: 2 * 60 * 1000, // 2 minutos para datos que cambian frecuentemente
    cacheTime: 5 * 60 * 1000, // 5 minutos de cache
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    enabled: true,
    ...options
  };

  const query = useQuery({
    queryKey: [...queryKey, currentSucursalId],
    queryFn,
    ...defaultOptions
  });

  // Invalidar cache cuando cambie la sucursal
  useEffect(() => {
    const handleSucursalChange = () => {
      queryClient.invalidateQueries({ queryKey });
    };

    const handleLocalStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedSucursalId') {
        handleSucursalChange();
      }
    };

    window.addEventListener('storage', handleLocalStorageChange);
    window.addEventListener('sucursal-changed', handleSucursalChange);

    return () => {
      window.removeEventListener('storage', handleLocalStorageChange);
      window.removeEventListener('sucursal-changed', handleSucursalChange);
    };
  }, [queryClient, queryKey]);

  return query;
}

// Hook para consultas de datos críticos (ventas, productos)
export function useCriticalDataQuery(queryKey: string[], queryFn: () => Promise<any>, options: any = {}) {
  return useOptimizedQuery(queryKey, queryFn, {
    staleTime: 30 * 1000, // 30 segundos para datos críticos
    cacheTime: 2 * 60 * 1000, // 2 minutos de cache
    refetchInterval: 60 * 1000, // Refetch cada minuto
    ...options
  });
}

// Hook para consultas de configuración (menos frecuentes)
export function useConfigQuery(queryKey: string[], queryFn: () => Promise<any>, options: any = {}) {
  return useOptimizedQuery(queryKey, queryFn, {
    staleTime: 10 * 60 * 1000, // 10 minutos para configuraciones
    cacheTime: 30 * 60 * 1000, // 30 minutos de cache
    refetchOnWindowFocus: false,
    ...options
  });
}

// Hook para pre-cargar datos importantes
export function usePreloadData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const preloadCriticalData = useCallback(async () => {
    if (!user) return;

    const currentSucursalId = localStorage.getItem('selectedSucursalId') 
      ? parseInt(localStorage.getItem('selectedSucursalId')!) 
      : (user?.sucursal?.id || 1);

    // Pre-cargar datos críticos en background
    try {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['ventas-ordenadas', currentSucursalId],
          staleTime: 30 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ['mesas', currentSucursalId],
          staleTime: 2 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ['products'],
          staleTime: 5 * 60 * 1000,
        })
      ]);
    } catch (error) {
      console.warn('Error pre-cargando datos:', error);
    }
  }, [queryClient, user]);

  return { preloadCriticalData };
}

// Hook para gestión de memoria
export function useMemoryOptimization() {
  const queryClient = useQueryClient();

  const clearOldCache = useCallback(() => {
    // Limpiar cache de consultas antiguas
    queryClient.getQueryCache().clear();
  }, [queryClient]);

  const optimizeMemory = useCallback(() => {
    // Limpiar cache cada 10 minutos
    const interval = setInterval(clearOldCache, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [clearOldCache]);

  useEffect(() => {
    const cleanup = optimizeMemory();
    return cleanup;
  }, [optimizeMemory]);

  return { clearOldCache };
}
