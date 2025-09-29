import React, { createContext, useContext, ReactNode } from 'react';
// import axios from 'axios'; // TEMPORAL: Comentado para evitar problemas de hook

export type PlanType = 'basico' | 'profesional' | 'avanzado' | 'enterprise';

export interface PlanLimits {
  max_sucursales: number;
  max_usuarios: number;
  max_productos: number;
  max_transacciones_mes: number;
  almacenamiento_gb: number;
}

export interface PlanFeatures {
  [key: string]: boolean | string[] | string;
  sales?: boolean | string[];
  inventory?: boolean | string[];
  dashboard?: boolean | string[];
  analytics?: boolean | string[];
  reports?: boolean | string[];
  integrations?: boolean | string[];
  reservas?: boolean;
  cocina?: boolean;
  promociones?: boolean;
  egresos?: boolean;
  multi_sucursal?: boolean;
  multi_usuario?: boolean;
  api?: boolean;
  white_label?: boolean;
  soporte_prioritario?: boolean;
}

export interface Plan {
  id: number;
  nombre: string;
  tipo?: PlanType;
  precio_mensual: number;
  precio_anual?: number;
  descripcion: string;
  funcionalidades: PlanFeatures;
  limites?: PlanLimits;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PlanUsage {
  productos: number;
  usuarios: number;
  sucursales: number;
  transacciones: number;
  almacenamiento_mb: number;
}

export interface PlanInfo {
  plan: Plan;
  suscripcion: {
    estado: string;
    fecha_inicio: string;
    fecha_fin?: string;
    fecha_renovacion?: string;
    auto_renovacion?: boolean;
  };
  limites: PlanLimits;
  uso_actual: PlanUsage;
}

export interface PlanContextType {
  planInfo: PlanInfo | null;
  isLoading: boolean;
  error: string | null;
  hasFeature: (feature: string) => boolean;
  isLimitExceeded: (limit: keyof PlanLimits) => boolean;
  getRemainingLimit: (limit: keyof PlanLimits) => number;
  getUsagePercentage: (limit: keyof PlanLimits) => number;
  refreshPlanData: () => Promise<void>;
  checkFeatureAccess: (feature: string, showMessage?: boolean) => boolean;
}

interface PlanProviderProps {
  children: ReactNode;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<PlanProviderProps> = ({ children }) => {
  console.log('🔍 [PLAN] PlanProvider inicializando (modo simplificado)...');
  
  try {
    // Valores por defecto estáticos
    const planInfo = null;
    const isLoading = false;
    const error = null;

  // Función para obtener el token de autenticación
  const getAuthToken = (): string | null => {
    return localStorage.getItem('jwtToken');
  };

  // Función para verificar si el usuario está autenticado
  const isAuthenticated = (): boolean => {
    const token = getAuthToken();
    return !!token;
  };

  // Mapeo de funcionalidades por plan según PLANES_FUNCIONALIDADES_COMPLETO.md
  const getPlanFeatureMapping = (planName: string): PlanFeatures => {
    const planLowerCase = planName.toLowerCase();
    
    if (planLowerCase.includes('basico') || planLowerCase.includes('básico')) {
    return {
        sales: true,
        inventory: ['productos'] as any, // Solo pestaña productos
        dashboard: ['resumen', 'productos', 'categorias', 'usuarios'] as any, // Acceso parcial
        analytics: false,
        reports: false,
        integrations: false,
        reservas: false,
        cocina: false,
        promociones: false,
        egresos: false,
        multi_sucursal: false,
        multi_usuario: false,
        api: false,
        white_label: false,
        soporte_prioritario: false,
        orders: false,
        arqueo: false
      };
    }
    
    if (planLowerCase.includes('profesional')) {
      return {
        sales: true,
        inventory: ['productos', 'lotes'] as any, // Solo pestañas productos y lotes
        dashboard: ['resumen', 'productos', 'categorias', 'usuarios', 'mesas'] as any, // Mesas básico sin reservas
        analytics: false,
        reports: false,
        integrations: false,
        reservas: false, // Mesas sin reservas
        cocina: true,
        promociones: false,
        egresos: ['egresos'] as any, // Solo pestaña egresos
        multi_sucursal: true, // Hasta 2 sucursales
        multi_usuario: true,
        api: false,
        white_label: false,
        soporte_prioritario: false,
        orders: true, // Pedidos/comandas
        arqueo: true
      };
    }
    
    if (planLowerCase.includes('avanzado')) {
      return {
        sales: true,
        inventory: true, // Acceso completo a inventario
        dashboard: true, // Acceso completo, incluye reservas y unión de mesas
        analytics: true,
        reports: true,
        integrations: false,
        reservas: true, // Reservas completas
        cocina: true,
        promociones: true,
        egresos: ['egresos', 'dashboard', 'informacion'] as any, // Acceso completo
        multi_sucursal: true, // Hasta 3 sucursales
        multi_usuario: true,
        api: false,
        white_label: false,
        soporte_prioritario: false,
        orders: true,
        arqueo: true
      };
    }
    
    if (planLowerCase.includes('enterprise')) {
      return {
        sales: true,
        inventory: true, // Acceso completo
        dashboard: true, // Acceso completo
        analytics: true, // Analytics enterprise
        reports: true, // Reportes personalizados
        integrations: true, // API completa
        reservas: true, // Todo completo
        cocina: true, // Acceso total
        promociones: true, // Sistema completo
        egresos: true, // Acceso total
        multi_sucursal: true, // Ilimitadas
        multi_usuario: true, // Ilimitados
        api: true, // API completa
        white_label: true,
        soporte_prioritario: true,
        orders: true, // Acceso total
        arqueo: true, // Acceso total
        usuarios: true,
        productos: true,
        ventas: true,
        mesas: true,
        categorias: true
      };
    }
    
    // Por defecto, plan básico
    return {
      sales: true,
      inventory: ['productos'] as any,
      dashboard: ['resumen', 'productos', 'categorias', 'usuarios'] as any,
      analytics: false,
      reports: false,
      integrations: false,
      reservas: false,
      cocina: false,
      promociones: false,
      egresos: false,
      multi_sucursal: false,
      multi_usuario: false,
      api: false,
      white_label: false,
      soporte_prioritario: false,
      orders: false,
      arqueo: false
    };
  };

  // TEMPORAL: Función comentada para evitar problemas de hook
  const fetchPlanData = async () => {
    console.log('🔍 [PLAN] fetchPlanData llamada (modo simplificado)');
    // Función temporalmente deshabilitada
  };

  // Función para verificar si tiene acceso a una funcionalidad
  const hasFeature = (feature: string): boolean => {
    // Solo mostrar logs detallados la primera vez o para funcionalidades importantes
    const isImportantFeature = ['orders', 'egresos', 'analytics', 'cocina'].includes(feature);
    
    if (isImportantFeature) {
      console.log(`🔍 [PLAN] Verificando funcionalidad "${feature}"`);
    }
    
    // Obtener usuario directamente de localStorage sin hooks
    let user = null;
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        user = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
    
    // SOLUCIÓN TEMPORAL: Asignar plan Enterprise para ciertos restaurantes/usuarios
    // Para id_restaurante = 1, todos los usuarios tienen plan Enterprise
    if (user?.id_restaurante === 1) {
      if (isImportantFeature) {
        console.log(`✅ [PLAN] Restaurante ID 1 detectado - asignando plan Enterprise para usuario "${user?.rol}" - acceso completo a "${feature}": TRUE`);
      }
      return true;
    }
    
    // DEBUG: Logs detallados para funcionalidad cocina
    if (feature === 'cocina') {
      console.log('🔍 [PLAN] === DIAGNÓSTICO DETALLADO PARA COCINA ===');
      console.log('🔍 [PLAN] User completo:', user);
      console.log('🔍 [PLAN] User rol:', user?.rol);
      console.log('🔍 [PLAN] User id_restaurante:', user?.id_restaurante);
      console.log('🔍 [PLAN] PlanInfo completo:', planInfo);
      console.log('🔍 [PLAN] User.plan_name:', user?.plan_name);
      console.log('🔍 [PLAN] User.plan:', user?.plan);
      console.log('🔍 [PLAN] User.nombre_plan:', user?.nombre_plan);
      console.log('🔍 [PLAN] === FIN DIAGNÓSTICO ===');
    }
    
    // SOLUCIÓN MEJORADA: Verificar plan Enterprise ANTES que roles específicos
    // Si no hay información del plan, usar información del usuario
    let planName = 'basico'; // Por defecto
    
    if (planInfo?.plan?.nombre) {
      planName = planInfo.plan.nombre;
      if (isImportantFeature) console.log(`🔍 [PLAN] Plan obtenido de planInfo: "${planName}"`);
    } else if (user?.plan_name) {
      planName = user.plan_name;
      if (isImportantFeature) console.log(`🔍 [PLAN] Plan obtenido de user.plan_name: "${planName}"`);
    } else if (user?.plan?.nombre) {
      planName = user.plan.nombre;
      if (isImportantFeature) console.log(`🔍 [PLAN] Plan obtenido de user.plan.nombre: "${planName}"`);
    } else if (user?.nombre_plan) {
      planName = user.nombre_plan;
      if (isImportantFeature) console.log(`🔍 [PLAN] Plan obtenido de user.nombre_plan: "${planName}"`);
    } else {
      if (isImportantFeature) {
        console.log(`⚠️ [PLAN] No se encontró información del plan. Usando plan por defecto: "${planName}"`);
      }
    }
    
    // DEBUG: Mostrar plan detectado para cocina
    if (feature === 'cocina') {
      console.log(`🔍 [PLAN] Plan detectado: "${planName}"`);
      console.log(`🔍 [PLAN] ¿Incluye 'enterprise'?:`, planName.toLowerCase().includes('enterprise'));
    }
    
    // Para plan Enterprise, SIEMPRE permitir TODO (sin importar el rol del usuario)
    if (planName.toLowerCase().includes('enterprise')) {
      if (isImportantFeature) console.log(`✅ [PLAN] Plan Enterprise detectado para usuario "${user?.rol}" - acceso completo a "${feature}": TRUE`);
      return true;
    }
    
    // Usar el sistema de planes para todos los usuarios
    
    const features = getPlanFeatureMapping(planName);
    const hasAccess = features[feature] === true || 
                     (Array.isArray(features[feature]) && (features[feature] as string[]).length > 0);
    
    // DEBUG: Información detallada para cocina
    if (feature === 'cocina') {
      console.log(`🔍 [PLAN] Features del plan "${planName}":`, features);
      console.log(`🔍 [PLAN] Feature "cocina" específica:`, features[feature]);
      console.log(`🔍 [PLAN] Acceso final calculado: ${hasAccess}`);
    }
    
    if (isImportantFeature) console.log(`🔍 [PLAN] Resultado para "${feature}": ${hasAccess}`);
    return hasAccess;
  };

  const isLimitExceeded = (limit: keyof PlanLimits): boolean => {
    console.log(`🔍 [PLAN] Verificando límite "${limit}"`);
    
    // Obtener usuario directamente de localStorage sin hooks
    let user = null;
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        user = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
    
    // SOLUCIÓN TEMPORAL: Admin = Enterprise = ilimitado
    if (user?.rol === 'admin' || user?.rol === 'super_admin') {
      console.log(`✅ [PLAN] Usuario admin/super_admin (Enterprise) - límite "${limit}" ilimitado: FALSE`);
      return false;
    }
    
    // Para plan Enterprise, NUNCA exceder límites (ilimitado)
    let planName = 'basico';
    if (planInfo?.plan?.nombre) {
      planName = planInfo.plan.nombre;
    } else if (user?.plan_name || user?.plan?.nombre) {
      planName = user.plan_name || user.plan?.nombre;
    }
    
    if (planName.toLowerCase().includes('enterprise')) {
      console.log(`✅ [PLAN] Plan Enterprise - límite "${limit}" ilimitado: FALSE`);
      return false;
    }
    
    if (!planInfo?.limites || !planInfo?.uso_actual) {
      console.log(`🔍 [PLAN] Sin datos de límites - asumiendo no excedido: FALSE`);
      return false;
    }
    
    const maxLimit = planInfo.limites[limit];
    const currentUsage = planInfo.uso_actual[limit === 'max_sucursales' ? 'sucursales' : 
                                          limit === 'max_usuarios' ? 'usuarios' :
                                          limit === 'max_productos' ? 'productos' :
                                          limit === 'max_transacciones_mes' ? 'transacciones' :
                                          'almacenamiento_mb'];
    
    const exceeded = currentUsage >= maxLimit;
    console.log(`🔍 [PLAN] Límite "${limit}": ${currentUsage}/${maxLimit} - Excedido: ${exceeded}`);
    return exceeded;
  };

  const getRemainingLimit = (limit: keyof PlanLimits): number => {
    console.log(`🔍 [PLAN] Obteniendo límite restante "${limit}"`);
    
    // Obtener usuario directamente de localStorage sin hooks
    let user = null;
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        user = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
    
    // SOLUCIÓN TEMPORAL: Admin = Enterprise = ilimitado
    if (user?.rol === 'admin' || user?.rol === 'super_admin') {
      console.log(`✅ [PLAN] Usuario admin/super_admin (Enterprise) - límite "${limit}" ilimitado: -1`);
      return -1; // Ilimitado
    }
    
    // Para plan Enterprise, siempre ilimitado
    let planName = 'basico';
    if (planInfo?.plan?.nombre) {
      planName = planInfo.plan.nombre;
    } else if (user?.plan_name || user?.plan?.nombre) {
      planName = user.plan_name || user.plan?.nombre;
    }
    
    if (planName.toLowerCase().includes('enterprise')) {
      console.log(`✅ [PLAN] Plan Enterprise - límite "${limit}" ilimitado: -1`);
      return -1; // Ilimitado
    }
    
    if (!planInfo?.limites || !planInfo?.uso_actual) {
      console.log(`🔍 [PLAN] Sin datos de límites - asumiendo ilimitado: -1`);
      return -1;
    }
    
    const maxLimit = planInfo.limites[limit];
    const currentUsage = planInfo.uso_actual[limit === 'max_sucursales' ? 'sucursales' : 
                                          limit === 'max_usuarios' ? 'usuarios' :
                                          limit === 'max_productos' ? 'productos' :
                                          limit === 'max_transacciones_mes' ? 'transacciones' :
                                          'almacenamiento_mb'];
    
    const remaining = Math.max(0, maxLimit - currentUsage);
    console.log(`🔍 [PLAN] Límite restante "${limit}": ${remaining}`);
    return remaining;
  };

  const getUsagePercentage = (limit: keyof PlanLimits): number => {
    console.log(`🔍 [PLAN] Obteniendo porcentaje de uso "${limit}"`);
    
    // Obtener usuario directamente de localStorage sin hooks
    let user = null;
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        user = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
    
    // SOLUCIÓN TEMPORAL: Admin = Enterprise = 0% (ilimitado)
    if (user?.rol === 'admin' || user?.rol === 'super_admin') {
      console.log(`✅ [PLAN] Usuario admin/super_admin (Enterprise) - uso "${limit}": 0%`);
      return 0;
    }
    
    // Para plan Enterprise, siempre 0% (ilimitado)
    let planName = 'basico';
    if (planInfo?.plan?.nombre) {
      planName = planInfo.plan.nombre;
    } else if (user?.plan_name || user?.plan?.nombre) {
      planName = user.plan_name || user.plan?.nombre;
    }
    
    if (planName.toLowerCase().includes('enterprise')) {
      console.log(`✅ [PLAN] Plan Enterprise - uso "${limit}": 0%`);
      return 0;
    }
    
    if (!planInfo?.limites || !planInfo?.uso_actual) {
      console.log(`🔍 [PLAN] Sin datos de límites - asumiendo 0%: 0`);
      return 0;
    }
    
    const maxLimit = planInfo.limites[limit];
    const currentUsage = planInfo.uso_actual[limit === 'max_sucursales' ? 'sucursales' : 
                                          limit === 'max_usuarios' ? 'usuarios' :
                                          limit === 'max_productos' ? 'productos' :
                                          limit === 'max_transacciones_mes' ? 'transacciones' :
                                          'almacenamiento_mb'];
    
    const percentage = maxLimit > 0 ? Math.min(100, (currentUsage / maxLimit) * 100) : 0;
    console.log(`🔍 [PLAN] Porcentaje de uso "${limit}": ${percentage}%`);
    return percentage;
  };

  const checkFeatureAccess = (feature: string, showMessage: boolean = true): boolean => {
    const access = hasFeature(feature);
    console.log(`🔍 [PLAN] Verificando acceso a "${feature}": ${access}`);
    
    if (!access && showMessage) {
      // Aquí podrías mostrar una notificación de upgrade si quisieras
      console.log(`⚠️ [PLAN] Funcionalidad "${feature}" no disponible en el plan actual`);
    }
    
    return access;
  };

  // Función para recargar datos del plan
  const refreshPlanData = async (): Promise<void> => {
    await fetchPlanData();
  };

  // TEMPORAL: useEffect comentados para evitar problemas de hook
  // useEffect(() => {
  //   if (user) {
  //     fetchPlanData();
  //   }
  // }, [user]);

  // useEffect(() => {
  //   const handleStorageChange = () => {
  //     if (isAuthenticated() && !planInfo) {
  //       fetchPlanData();
  //     }
  //   };

  //   window.addEventListener('storage', handleStorageChange);
  //   return () => window.removeEventListener('storage', handleStorageChange);
  // }, [planInfo]);

  const value: PlanContextType = {
    planInfo,
    isLoading,
    error,
    hasFeature,
    isLimitExceeded,
    getRemainingLimit,
    getUsagePercentage,
    refreshPlanData,
    checkFeatureAccess,
  };

    return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
  } catch (error) {
    console.error('❌ [PLAN] Error en PlanProvider:', error);
    // Fallback: retornar children sin contexto
    return <>{children}</>;
  }
};

export const usePlan = () => {
  console.log('🔍 [PLAN] usePlan hook llamado');
  const context = useContext(PlanContext);
  console.log('🔍 [PLAN] context obtenido:', context);
  if (context === undefined) {
    console.error('🔍 [PLAN] ERROR: usePlan llamado fuera de PlanProvider');
    
    // SOLUCIÓN TEMPORAL: Retornar contexto por defecto en lugar de error
    console.log('🔍 [PLAN] Retornando contexto por defecto para evitar crash');
    return {
      planInfo: null,
      isLoading: false,
      error: null,
      hasFeature: (feature: string) => {
        // Para id_restaurante = 1, siempre dar acceso completo
        try {
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user?.id_restaurante === 1) {
              console.log(`✅ [PLAN] Fallback: Restaurante ID 1 - acceso completo a "${feature}": TRUE`);
              return true;
            }
          }
        } catch (error) {
          console.error('Error parsing user in fallback:', error);
        }
        return false;
      },
      isLimitExceeded: () => false,
      getRemainingLimit: () => -1,
      getUsagePercentage: () => 0,
      refreshPlanData: async () => {},
      checkFeatureAccess: () => ({ hasAccess: false, reason: 'Context error' })
    };
  }
  return context;
};