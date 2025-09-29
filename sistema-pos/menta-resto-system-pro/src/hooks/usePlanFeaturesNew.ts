import { useState, useEffect, useCallback } from 'react';
import { planesSistemaApi, suscripcionesApi } from '@/services/planesApi';
import { PlanInfo, Suscripcion, Plan } from '@/services/planesApi';

export interface PlanFeatures {
  [key: string]: boolean;
}

export interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
  requiredPlan?: string;
  currentPlan?: string;
}

export interface UsePlanFeaturesReturn {
  planInfo: PlanInfo | null;
  suscripcion: Suscripcion | null;
  isLoading: boolean;
  error: string | null;
  hasFeature: (feature: string) => boolean;
  checkFeatureAccess: (feature: string) => FeatureAccess;
  canUseFeature: (feature: string) => boolean;
  canUsePOS: () => boolean;
  canUseInventarioBasico: () => boolean;
  canUseInventarioAvanzado: () => boolean;
  canUsePromociones: () => boolean;
  canUseReservas: () => boolean;
  canUseArqueoCaja: () => boolean;
  canUseEgresos: () => boolean;
  canUseEgresosAvanzados: () => boolean;
  canUseReportesAvanzados: () => boolean;
  canUseAnalytics: () => boolean;
  canUseDelivery: () => boolean;
  canUseImpresion: () => boolean;
  canUseSoporte24h: () => boolean;
  canUseAPI: () => boolean;
  canUseWhiteLabel: () => boolean;
  getCurrentPlan: () => string;
  getPlanFeatures: () => PlanFeatures;
  isPlanActive: () => boolean;
  isPlanExpired: () => boolean;
  isPlanSuspended: () => boolean;
  getDaysUntilExpiration: () => number;
  refreshData: () => Promise<void>;
}

const PLAN_FEATURES: Record<string, PlanFeatures> = {
  'Básico': {
    incluye_pos: true,
    incluye_inventario_basico: true,
    incluye_inventario_avanzado: false,
    incluye_promociones: false,
    incluye_reservas: false,
    incluye_arqueo_caja: false,
    incluye_egresos: false,
    incluye_egresos_avanzados: false,
    incluye_reportes_avanzados: false,
    incluye_analytics: false,
    incluye_delivery: false,
    incluye_impresion: true,
    incluye_soporte_24h: false,
    incluye_api: false,
    incluye_white_label: false,
    orders: true // Pedidos/comandas disponibles en todos los planes
  },
  'Profesional': {
    incluye_pos: true,
    incluye_inventario_basico: true,
    incluye_inventario_avanzado: true,
    incluye_promociones: false,
    incluye_reservas: true,
    incluye_arqueo_caja: true,
    incluye_egresos: true,
    incluye_egresos_avanzados: false,
    incluye_reportes_avanzados: false,
    incluye_analytics: false,
    incluye_delivery: false,
    incluye_impresion: true,
    incluye_soporte_24h: false,
    incluye_api: false,
    incluye_white_label: false,
    orders: true // Pedidos/comandas disponibles en todos los planes
  },
  'Avanzado': {
    incluye_pos: true,
    incluye_inventario_basico: true,
    incluye_inventario_avanzado: true,
    incluye_promociones: true,
    incluye_reservas: true,
    incluye_arqueo_caja: true,
    incluye_egresos: true,
    incluye_egresos_avanzados: true,
    incluye_reportes_avanzados: true,
    incluye_analytics: true,
    incluye_delivery: true,
    incluye_impresion: true,
    incluye_soporte_24h: false,
    incluye_api: false,
    incluye_white_label: false,
    orders: true // Pedidos/comandas disponibles en todos los planes
  },
  'Enterprise': {
    incluye_pos: true,
    incluye_inventario_basico: true,
    incluye_inventario_avanzado: true,
    incluye_promociones: true,
    incluye_reservas: true,
    incluye_arqueo_caja: true,
    incluye_egresos: true,
    incluye_egresos_avanzados: true,
    incluye_reportes_avanzados: true,
    incluye_analytics: true,
    incluye_delivery: true,
    incluye_impresion: true,
    incluye_soporte_24h: true,
    incluye_api: true,
    incluye_white_label: true,
    orders: true // Pedidos/comandas disponibles en todos los planes
  }
};

export const usePlanFeaturesNew = (idRestaurante: number): UsePlanFeaturesReturn => {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlanInfo = useCallback(async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [PLAN] Cargando información del plan para restaurante:', idRestaurante);
      }
      const data = await planesSistemaApi.getCurrentPlanInfo(idRestaurante);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [PLAN] Datos del plan recibidos:', data);
        console.log('🔍 [PLAN] Plan name:', data?.plan?.nombre);
      }
      setPlanInfo(data);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [PLAN] planInfo establecido correctamente');
      }
    } catch (err) {
      console.error('❌ [PLAN] Error loading plan info:', err);
      setError('Error al cargar información del plan');
    }
  }, [idRestaurante]);

  const loadSuscripcion = useCallback(async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [PLAN] Cargando suscripción para restaurante:', idRestaurante);
      }
      const data = await suscripcionesApi.getActiveSubscription(idRestaurante);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [PLAN] Datos de suscripción recibidos:', data);
        console.log('🔍 [PLAN] Estado de suscripción:', data?.estado);
      }
      setSuscripcion(data);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [PLAN] suscripcion establecida correctamente');
      }
    } catch (err) {
      console.error('❌ [PLAN] Error loading subscription:', err);
      setError('Error al cargar información de suscripción');
    }
  }, [idRestaurante]);

  const refreshData = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [PLAN] refreshData iniciado para restaurante:', idRestaurante);
    }
    setIsLoading(true);
    setError(null);
    
    // Limpiar estado anterior al cambiar de restaurante
    setPlanInfo(null);
    setSuscripcion(null);
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [PLAN] Ejecutando Promise.all...');
      }
      await Promise.all([
        loadPlanInfo(),
        loadSuscripcion()
      ]);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [PLAN] Promise.all completado exitosamente');
      }
    } catch (err) {
      console.error('❌ [PLAN] Error refreshing data:', err);
      setError('Error al actualizar datos');
    } finally {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [PLAN] refreshData finalizado, estableciendo isLoading = false');
      }
      setIsLoading(false);
    }
  }, [idRestaurante, loadPlanInfo, loadSuscripcion]);

  const hasFeature = useCallback((feature: string): boolean => {
    if (!planInfo || !suscripcion || !planInfo.plan) {
      return false;
    }
    
    if (suscripcion.estado !== 'activa') {
      return false;
    }
    
    // Mapear funcionalidades del frontend a las del backend
    const featureMapping: Record<string, string> = {
      'orders': 'incluye_pos', // Los pedidos están incluidos en el POS
      'cocina': 'incluye_pos', // La cocina también está en el POS
      'mesas': 'incluye_pos', // Las mesas están incluidas en el POS
      'arqueo': 'incluye_arqueo_caja',
      'egresos': 'incluye_egresos',
      'analytics': 'incluye_analytics',
      'sales.basico': 'incluye_pos', // Historial de ventas básico está en el POS
      'sales.avanzado': 'incluye_analytics', // Ventas avanzadas requieren analytics
      'inventario': 'incluye_inventario_basico',
      'promociones': 'incluye_promociones',
      'reservas': 'incluye_reservas',
      'delivery': 'incluye_delivery',
      'impresion': 'incluye_impresion',
      'soporte': 'incluye_soporte_24h',
      'api': 'incluye_api',
      'white_label': 'incluye_white_label'
    };
    
    const backendFeature = featureMapping[feature] || feature;
    return planInfo.plan[backendFeature as keyof Plan] === true;
  }, [planInfo, suscripcion]);

  const checkFeatureAccess = useCallback((feature: string): FeatureAccess => {
    if (!planInfo || !suscripcion || !planInfo.plan || !planInfo.funcionalidades) {
      return {
        hasAccess: false,
        reason: 'No hay información del plan disponible'
      };
    }
    
    if (suscripcion.estado !== 'activa') {
      return {
        hasAccess: false,
        reason: `Suscripción ${suscripcion.estado}`,
        currentPlan: planInfo.plan.nombre
      };
    }
    
    const hasAccess = planInfo.funcionalidades[feature] === true;
    
    if (!hasAccess) {
      const requiredPlan = findRequiredPlan(feature);
      return {
        hasAccess: false,
        reason: 'Funcionalidad no disponible en el plan actual',
        requiredPlan,
        currentPlan: planInfo.plan.nombre
      };
    }
    
    return {
      hasAccess: true,
      currentPlan: planInfo.plan.nombre
    };
  }, [planInfo, suscripcion]);

  const canUseFeature = useCallback((feature: string): boolean => {
    return hasFeature(feature);
  }, [hasFeature]);

  const canUsePOS = useCallback(() => hasFeature('incluye_pos'), [hasFeature]);
  const canUseInventarioBasico = useCallback(() => hasFeature('incluye_inventario_basico'), [hasFeature]);
  const canUseInventarioAvanzado = useCallback(() => hasFeature('incluye_inventario_avanzado'), [hasFeature]);
  const canUsePromociones = useCallback(() => hasFeature('incluye_promociones'), [hasFeature]);
  const canUseReservas = useCallback(() => hasFeature('incluye_reservas'), [hasFeature]);
  const canUseArqueoCaja = useCallback(() => hasFeature('incluye_arqueo_caja'), [hasFeature]);
  const canUseEgresos = useCallback(() => hasFeature('incluye_egresos'), [hasFeature]);
  const canUseEgresosAvanzados = useCallback(() => hasFeature('incluye_egresos_avanzados'), [hasFeature]);
  const canUseReportesAvanzados = useCallback(() => hasFeature('incluye_reportes_avanzados'), [hasFeature]);
  const canUseAnalytics = useCallback(() => hasFeature('incluye_analytics'), [hasFeature]);
  const canUseDelivery = useCallback(() => hasFeature('incluye_delivery'), [hasFeature]);
  const canUseImpresion = useCallback(() => hasFeature('incluye_impresion'), [hasFeature]);
  const canUseSoporte24h = useCallback(() => hasFeature('incluye_soporte_24h'), [hasFeature]);
  const canUseAPI = useCallback(() => hasFeature('incluye_api'), [hasFeature]);
  const canUseWhiteLabel = useCallback(() => hasFeature('incluye_white_label'), [hasFeature]);

  const getCurrentPlan = useCallback((): string => {
    return planInfo?.plan?.nombre || 'Desconocido';
  }, [planInfo]);

  const getPlanFeatures = useCallback((): PlanFeatures => {
    return planInfo?.funcionalidades || {};
  }, [planInfo]);

  const isPlanActive = useCallback((): boolean => {
    return suscripcion?.estado === 'activa';
  }, [suscripcion]);

  const isPlanExpired = useCallback((): boolean => {
    if (!suscripcion) return false;
    const now = new Date();
    const expirationDate = new Date(suscripcion.fecha_fin);
    return now > expirationDate;
  }, [suscripcion]);

  const isPlanSuspended = useCallback((): boolean => {
    return suscripcion?.estado === 'suspendida';
  }, [suscripcion]);

  const getDaysUntilExpiration = useCallback((): number => {
    if (!suscripcion) return 0;
    const now = new Date();
    const expirationDate = new Date(suscripcion.fecha_fin);
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [suscripcion]);

  const findRequiredPlan = (feature: string): string => {
    const planHierarchy = ['Básico', 'Profesional', 'Avanzado', 'Enterprise'];
    
    for (const plan of planHierarchy) {
      if (PLAN_FEATURES[plan]?.[feature]) {
        return plan;
      }
    }
    
    return 'Enterprise';
  };

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [PLAN] useEffect ejecutado, idRestaurante:', idRestaurante);
    }
    if (idRestaurante > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [PLAN] Ejecutando refreshData para restaurante:', idRestaurante);
      }
      refreshData();
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [PLAN] No hay idRestaurante, saltando refreshData');
      }
    }
  }, [idRestaurante]); // Removido refreshData para evitar bucle infinito

  return {
    planInfo,
    suscripcion,
    isLoading,
    error,
    hasFeature,
    checkFeatureAccess,
    canUseFeature,
    canUsePOS,
    canUseInventarioBasico,
    canUseInventarioAvanzado,
    canUsePromociones,
    canUseReservas,
    canUseArqueoCaja,
    canUseEgresos,
    canUseEgresosAvanzados,
    canUseReportesAvanzados,
    canUseAnalytics,
    canUseDelivery,
    canUseImpresion,
    canUseSoporte24h,
    canUseAPI,
    canUseWhiteLabel,
    getCurrentPlan,
    getPlanFeatures,
    isPlanActive,
    isPlanExpired,
    isPlanSuspended,
    getDaysUntilExpiration,
    refreshData
  };
};

export default usePlanFeaturesNew;
