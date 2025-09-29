import { usePlanSystem } from '@/context/PlanSystemContext';
import { useCallback } from 'react';

export const usePlanFeatures = () => {
  const { 
    planInfo, 
    hasFeature, 
    isLimitExceeded,
    isLoading,
    error 
  } = usePlanSystem();

  // Funciones de conveniencia para verificar funcionalidades específicas
  const canUseMesas = useCallback(() => hasFeature('mesas'), [hasFeature]);
  const canUseLotes = useCallback(() => hasFeature('lotes'), [hasFeature]);
  const canUseArqueo = useCallback(() => hasFeature('arqueo'), [hasFeature]);
  const canUseCocina = useCallback(() => hasFeature('cocina'), [hasFeature]);
  const canUseEgresos = useCallback(() => hasFeature('egresos'), [hasFeature]);
  const canUseDelivery = useCallback(() => hasFeature('delivery'), [hasFeature]);
  const canUseReservas = useCallback(() => hasFeature('reservas'), [hasFeature]);
  const canUseAnalytics = useCallback(() => hasFeature('analytics'), [hasFeature]);
  const canUsePromociones = useCallback(() => hasFeature('promociones'), [hasFeature]);
  const canUseAPI = useCallback(() => hasFeature('api'), [hasFeature]);
  const canUseWhiteLabel = useCallback(() => hasFeature('white_label'), [hasFeature]);

  // Funciones de conveniencia para verificar límites
  const canAddSucursal = useCallback(() => {
    if (!planInfo?.plan) return false;
    if (planInfo.limites.max_sucursales === 0) return true; // Ilimitado
    return !isLimitExceeded('max_sucursales');
  }, [planInfo, isLimitExceeded]);

  const canAddUsuario = useCallback(() => {
    if (!planInfo?.plan) return false;
    if (planInfo.limites.max_usuarios === 0) return true; // Ilimitado
    return !isLimitExceeded('max_usuarios');
  }, [planInfo, isLimitExceeded]);

  const canAddProducto = useCallback(() => {
    if (!planInfo?.plan) return false;
    if (planInfo.limites.max_productos === 0) return true; // Ilimitado
    return !isLimitExceeded('max_productos');
  }, [planInfo, isLimitExceeded]);

  const canAddTransaccion = useCallback(() => {
    if (!planInfo?.plan) return false;
    if (planInfo.limites.max_transacciones_mes === 0) return true; // Ilimitado
    return !isLimitExceeded('max_transacciones_mes');
  }, [planInfo, isLimitExceeded]);

  // Funciones para obtener información de límites
  const getSucursalesInfo = useCallback(() => {
    if (!planInfo?.plan || !planInfo.uso_actual) return { current: 0, max: 0, remaining: 0, unlimited: false };
    
    const max = planInfo.limites.max_sucursales;
    const current = planInfo.uso_actual.sucursales_actuales || 0;
    const unlimited = max === 0;
    const remaining = unlimited ? -1 : Math.max(0, max - current);
    
    return { current, max, remaining, unlimited };
  }, [planInfo]);

  const getUsuariosInfo = useCallback(() => {
    if (!planInfo?.plan || !planInfo.uso_actual) return { current: 0, max: 0, remaining: 0, unlimited: false };
    
    const max = planInfo.limites.max_usuarios;
    const current = planInfo.uso_actual.usuarios_actuales || 0;
    const unlimited = max === 0;
    const remaining = unlimited ? -1 : Math.max(0, max - current);
    
    return { current, max, remaining, unlimited };
  }, [planInfo]);

  const getProductosInfo = useCallback(() => {
    if (!planInfo?.plan || !planInfo.uso_actual) return { current: 0, max: 0, remaining: 0, unlimited: false };
    
    const max = planInfo.limites.max_productos;
    const current = planInfo.uso_actual.productos_actuales || 0;
    const unlimited = max === 0;
    const remaining = unlimited ? -1 : Math.max(0, max - current);
    
    return { current, max, remaining, unlimited };
  }, [planInfo]);

  const getTransaccionesInfo = useCallback(() => {
    if (!planInfo?.plan || !planInfo.uso_actual) return { current: 0, max: 0, remaining: 0, unlimited: false };
    
    const max = planInfo.limites.max_transacciones_mes;
    const current = planInfo.uso_actual.transacciones_mes_actual || 0;
    const unlimited = max === 0;
    const remaining = unlimited ? -1 : Math.max(0, max - current);
    
    return { current, max, remaining, unlimited };
  }, [planInfo]);

  // Función para verificar si el plan actual es suficiente para una funcionalidad
  const isPlanSufficient = useCallback((requiredPlan: 'basico' | 'profesional' | 'avanzado' | 'enterprise') => {
    if (!planInfo?.plan) return false;
    
    const planHierarchy = {
      basico: 1,
      profesional: 2,
      avanzado: 3,
      enterprise: 4
    };
    
    const currentLevel = planHierarchy[planInfo.plan.nombre as keyof typeof planHierarchy];
    const requiredLevel = planHierarchy[requiredPlan];
    
    return currentLevel >= requiredLevel;
  }, [planInfo]);

  // Función para obtener el plan mínimo requerido para una funcionalidad
  const getRequiredPlan = useCallback((feature: string) => {
    const featureRequirements: Record<string, 'basico' | 'profesional' | 'avanzado' | 'enterprise'> = {
      // Funcionalidades básicas (disponibles en todos los planes)
      'sales': 'basico',
      'inventory': 'basico',
      'dashboard': 'basico',
      
      // Funcionalidades profesionales
      'mesas': 'profesional',
      'lotes': 'profesional',
      'arqueo': 'profesional',
      'cocina': 'profesional',
      'egresos': 'profesional',
      
      // Funcionalidades avanzadas
      'delivery': 'avanzado',
      'reservas': 'avanzado',
      'analytics': 'avanzado',
      'promociones': 'avanzado',
      
      // Funcionalidades enterprise
      'api': 'enterprise',
      'white_label': 'enterprise'
    };
    
    return featureRequirements[feature] || 'profesional';
  }, []);

  // Función para verificar si se puede usar una funcionalidad específica
  const canUseFeature = useCallback((feature: string) => {
    const requiredPlan = getRequiredPlan(feature);
    return isPlanSufficient(requiredPlan);
  }, [isPlanSufficient, getRequiredPlan]);

  return {
    // Estado del plan
    planInfo,
    isLoading,
    error,
    
    // Funciones básicas del contexto
    hasFeature,
    isLimitExceeded,
    
    // Funciones de conveniencia para funcionalidades
    canUseMesas,
    canUseLotes,
    canUseArqueo,
    canUseCocina,
    canUseEgresos,
    canUseDelivery,
    canUseReservas,
    canUseAnalytics,
    canUsePromociones,
    canUseAPI,
    canUseWhiteLabel,
    
    // Funciones de conveniencia para límites
    canAddSucursal,
    canAddUsuario,
    canAddProducto,
    canAddTransaccion,
    
    // Funciones para obtener información detallada
    getSucursalesInfo,
    getUsuariosInfo,
    getProductosInfo,
    getTransaccionesInfo,
    
    // Funciones de verificación de planes
    isPlanSufficient,
    getRequiredPlan,
    canUseFeature
  };
};
