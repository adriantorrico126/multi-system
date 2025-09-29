import { useState, useEffect, useCallback } from 'react';
import { planesSistemaApi, contadoresApi } from '@/services/planesApi';
import { PlanInfo, ContadorUso } from '@/services/planesApi';

// =====================================================
// TIPOS DE DATOS
// =====================================================

export interface PlanLimits {
  max_sucursales: number;
  max_usuarios: number;
  max_productos: number;
  max_transacciones_mes: number;
  almacenamiento_gb: number;
}

export interface PlanUsage {
  sucursales_actuales: number;
  usuarios_actuales: number;
  productos_actuales: number;
  transacciones_mes_actual: number;
  almacenamiento_usado_mb: number;
}

export interface LimitInfo {
  current: number;
  max: number;
  remaining: number;
  percentage: number;
  unlimited: boolean;
  exceeded: boolean;
}

export interface UsePlanLimitsReturn {
  // Estado
  planInfo: PlanInfo | null;
  usage: ContadorUso | null;
  isLoading: boolean;
  error: string | null;
  
  // Funciones de verificación de límites
  isLimitExceeded: (limit: keyof PlanLimits) => boolean;
  canAddResource: (resource: string, amount?: number) => boolean;
  getRemainingLimit: (limit: keyof PlanLimits) => number;
  getUsagePercentage: (limit: keyof PlanLimits) => number;
  
  // Información detallada de límites
  getSucursalesInfo: () => LimitInfo;
  getUsuariosInfo: () => LimitInfo;
  getProductosInfo: () => LimitInfo;
  getTransaccionesInfo: () => LimitInfo;
  getAlmacenamientoInfo: () => LimitInfo;
  
  // Funciones de actualización
  refreshData: () => Promise<void>;
  updateUsage: () => Promise<void>;
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export const usePlanLimits = (idRestaurante: number): UsePlanLimitsReturn => {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [usage, setUsage] = useState<ContadorUso | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // FUNCIONES DE CARGA DE DATOS
  // =====================================================

  const loadPlanInfo = useCallback(async () => {
    try {
      const data = await planesSistemaApi.getCurrentPlanInfo(idRestaurante);
      setPlanInfo(data);
    } catch (err) {
      console.error('Error loading plan info:', err);
      setError('Error al cargar información del plan');
    }
  }, [idRestaurante]);

  const loadUsage = useCallback(async () => {
    try {
      const data = await contadoresApi.getCurrentUsage(idRestaurante);
      setUsage(data);
    } catch (err) {
      console.error('Error loading usage:', err);
      setError('Error al cargar información de uso');
    }
  }, [idRestaurante]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    // Limpiar estado anterior al cambiar de restaurante
    setPlanInfo(null);
    setUsage(null);
    
    try {
      await Promise.all([
        loadPlanInfo(),
        loadUsage()
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Error al actualizar datos');
    } finally {
      setIsLoading(false);
    }
  }, [loadPlanInfo, loadUsage]);

  const updateUsage = useCallback(async () => {
    try {
      await contadoresApi.updateAllCounters(idRestaurante);
      await loadUsage();
    } catch (err) {
      console.error('Error updating usage:', err);
      setError('Error al actualizar contadores de uso');
    }
  }, [idRestaurante, loadUsage]);

  // =====================================================
  // FUNCIONES DE VERIFICACIÓN DE LÍMITES
  // =====================================================

  const isLimitExceeded = useCallback((limit: keyof PlanLimits): boolean => {
    if (!planInfo || !usage) return false;
    
    const maxLimit = planInfo.limites[limit];
    if (maxLimit === 0) return false; // Ilimitado
    
    let currentUsage = 0;
    switch (limit) {
      case 'max_sucursales':
        currentUsage = usage.sucursales_actuales;
        break;
      case 'max_usuarios':
        currentUsage = usage.usuarios_actuales;
        break;
      case 'max_productos':
        currentUsage = usage.productos_actuales;
        break;
      case 'max_transacciones_mes':
        currentUsage = usage.transacciones_mes_actual;
        break;
      case 'almacenamiento_gb':
        currentUsage = usage.almacenamiento_usado_mb / 1024; // Convertir MB a GB
        break;
    }
    
    return currentUsage >= maxLimit;
  }, [planInfo, usage]);

  const canAddResource = useCallback((resource: string, amount: number = 1): boolean => {
    if (!planInfo || !usage) return false;
    
    const maxLimit = planInfo.limites[resource as keyof PlanLimits];
    if (maxLimit === 0) return true; // Ilimitado
    
    let currentUsage = 0;
    switch (resource) {
      case 'max_sucursales':
        currentUsage = usage.sucursales_actuales;
        break;
      case 'max_usuarios':
        currentUsage = usage.usuarios_actuales;
        break;
      case 'max_productos':
        currentUsage = usage.productos_actuales;
        break;
      case 'max_transacciones_mes':
        currentUsage = usage.transacciones_mes_actual;
        break;
      case 'almacenamiento_gb':
        currentUsage = usage.almacenamiento_usado_mb / 1024;
        break;
    }
    
    return (currentUsage + amount) <= maxLimit;
  }, [planInfo, usage]);

  const getRemainingLimit = useCallback((limit: keyof PlanLimits): number => {
    if (!planInfo || !usage) return -1;
    
    const maxLimit = planInfo.limites[limit];
    if (maxLimit === 0) return -1; // Ilimitado
    
    let currentUsage = 0;
    switch (limit) {
      case 'max_sucursales':
        currentUsage = usage.sucursales_actuales;
        break;
      case 'max_usuarios':
        currentUsage = usage.usuarios_actuales;
        break;
      case 'max_productos':
        currentUsage = usage.productos_actuales;
        break;
      case 'max_transacciones_mes':
        currentUsage = usage.transacciones_mes_actual;
        break;
      case 'almacenamiento_gb':
        currentUsage = usage.almacenamiento_usado_mb / 1024;
        break;
    }
    
    return Math.max(0, maxLimit - currentUsage);
  }, [planInfo, usage]);

  const getUsagePercentage = useCallback((limit: keyof PlanLimits): number => {
    if (!planInfo || !usage) return 0;
    
    const maxLimit = planInfo.limites[limit];
    if (maxLimit === 0) return 0; // Ilimitado
    
    let currentUsage = 0;
    switch (limit) {
      case 'max_sucursales':
        currentUsage = usage.sucursales_actuales;
        break;
      case 'max_usuarios':
        currentUsage = usage.usuarios_actuales;
        break;
      case 'max_productos':
        currentUsage = usage.productos_actuales;
        break;
      case 'max_transacciones_mes':
        currentUsage = usage.transacciones_mes_actual;
        break;
      case 'almacenamiento_gb':
        currentUsage = usage.almacenamiento_usado_mb / 1024;
        break;
    }
    
    return Math.min(100, (currentUsage / maxLimit) * 100);
  }, [planInfo, usage]);

  // =====================================================
  // FUNCIONES DE INFORMACIÓN DETALLADA
  // =====================================================

  const getSucursalesInfo = useCallback((): LimitInfo => {
    if (!planInfo || !usage) {
      return { current: 0, max: 0, remaining: 0, percentage: 0, unlimited: false, exceeded: false };
    }
    
    const max = planInfo.limites.max_sucursales;
    const current = usage.sucursales_actuales;
    const unlimited = max === 0;
    const remaining = unlimited ? -1 : Math.max(0, max - current);
    const percentage = unlimited ? 0 : Math.min(100, (current / max) * 100);
    const exceeded = !unlimited && current >= max;
    
    return { current, max, remaining, percentage, unlimited, exceeded };
  }, [planInfo, usage]);

  const getUsuariosInfo = useCallback((): LimitInfo => {
    if (!planInfo || !usage) {
      return { current: 0, max: 0, remaining: 0, percentage: 0, unlimited: false, exceeded: false };
    }
    
    const max = planInfo.limites.max_usuarios;
    const current = usage.usuarios_actuales;
    const unlimited = max === 0;
    const remaining = unlimited ? -1 : Math.max(0, max - current);
    const percentage = unlimited ? 0 : Math.min(100, (current / max) * 100);
    const exceeded = !unlimited && current >= max;
    
    return { current, max, remaining, percentage, unlimited, exceeded };
  }, [planInfo, usage]);

  const getProductosInfo = useCallback((): LimitInfo => {
    if (!planInfo || !usage) {
      return { current: 0, max: 0, remaining: 0, percentage: 0, unlimited: false, exceeded: false };
    }
    
    const max = planInfo.limites.max_productos;
    const current = usage.productos_actuales;
    const unlimited = max === 0;
    const remaining = unlimited ? -1 : Math.max(0, max - current);
    const percentage = unlimited ? 0 : Math.min(100, (current / max) * 100);
    const exceeded = !unlimited && current >= max;
    
    return { current, max, remaining, percentage, unlimited, exceeded };
  }, [planInfo, usage]);

  const getTransaccionesInfo = useCallback((): LimitInfo => {
    if (!planInfo || !usage) {
      return { current: 0, max: 0, remaining: 0, percentage: 0, unlimited: false, exceeded: false };
    }
    
    const max = planInfo.limites.max_transacciones_mes;
    const current = usage.transacciones_mes_actual;
    const unlimited = max === 0;
    const remaining = unlimited ? -1 : Math.max(0, max - current);
    const percentage = unlimited ? 0 : Math.min(100, (current / max) * 100);
    const exceeded = !unlimited && current >= max;
    
    return { current, max, remaining, percentage, unlimited, exceeded };
  }, [planInfo, usage]);

  const getAlmacenamientoInfo = useCallback((): LimitInfo => {
    if (!planInfo || !usage) {
      return { current: 0, max: 0, remaining: 0, percentage: 0, unlimited: false, exceeded: false };
    }
    
    const max = planInfo.limites.almacenamiento_gb;
    const current = usage.almacenamiento_usado_mb / 1024; // Convertir MB a GB
    const unlimited = max === 0;
    const remaining = unlimited ? -1 : Math.max(0, max - current);
    const percentage = unlimited ? 0 : Math.min(100, (current / max) * 100);
    const exceeded = !unlimited && current >= max;
    
    return { current, max, remaining, percentage, unlimited, exceeded };
  }, [planInfo, usage]);

  // =====================================================
  // EFECTOS
  // =====================================================

  useEffect(() => {
    if (idRestaurante > 0) {
      refreshData();
    }
  }, [idRestaurante]); // Removido refreshData de las dependencias para evitar bucle infinito

  // =====================================================
  // RETORNO
  // =====================================================

  return {
    // Estado
    planInfo,
    usage,
    isLoading,
    error,
    
    // Funciones de verificación de límites
    isLimitExceeded,
    canAddResource,
    getRemainingLimit,
    getUsagePercentage,
    
    // Información detallada de límites
    getSucursalesInfo,
    getUsuariosInfo,
    getProductosInfo,
    getTransaccionesInfo,
    getAlmacenamientoInfo,
    
    // Funciones de actualización
    refreshData,
    updateUsage
  };
};

export default usePlanLimits;
