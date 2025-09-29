import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { usePlanFeaturesNew } from '@/hooks/usePlanFeaturesNew';
import { usePlanAlerts } from '@/hooks/usePlanAlerts';
import { PlanInfo, Suscripcion, ContadorUso, AlertaLimite } from '@/services/planesApi';

// =====================================================
// TIPOS DE DATOS
// =====================================================

export interface PlanSystemState {
  // Estado del plan
  planInfo: PlanInfo | null;
  suscripcion: Suscripcion | null;
  usage: ContadorUso | null;
  
  // Estado de carga
  isLoading: boolean;
  error: string | null;
  
  // Estado de alertas
  alertas: AlertaLimite[];
  alertasActivas: AlertaLimite[];
  alertasCriticas: AlertaLimite[];
  unreadAlertsCount: number;
  
  // Estado de la suscripción
  isActive: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  daysUntilExpiration: number;
}

export interface PlanSystemActions {
  // Funciones de verificación de límites
  isLimitExceeded: (limit: string) => boolean;
  canAddResource: (resource: string, amount?: number) => boolean;
  getRemainingLimit: (limit: string) => number;
  getUsagePercentage: (limit: string) => number;
  
  // Funciones de verificación de funcionalidades
  hasFeature: (feature: string) => boolean;
  canUseFeature: (feature: string) => boolean;
  checkFeatureAccess: (feature: string) => { hasAccess: boolean; reason?: string; requiredPlan?: string; currentPlan?: string };
  
  // Funciones de conveniencia para funcionalidades específicas
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
  
  // Funciones de información de límites
  getSucursalesInfo: () => { current: number; max: number; remaining: number; percentage: number; unlimited: boolean; exceeded: boolean };
  getUsuariosInfo: () => { current: number; max: number; remaining: number; percentage: number; unlimited: boolean; exceeded: boolean };
  getProductosInfo: () => { current: number; max: number; remaining: number; percentage: number; unlimited: boolean; exceeded: boolean };
  getTransaccionesInfo: () => { current: number; max: number; remaining: number; percentage: number; unlimited: boolean; exceeded: boolean };
  getAlmacenamientoInfo: () => { current: number; max: number; remaining: number; percentage: number; unlimited: boolean; exceeded: boolean };
  
  // Funciones de gestión de alertas
  resolveAlert: (idAlerta: number, mensajeResolucion: string) => Promise<void>;
  ignoreAlert: (idAlerta: number, motivo: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  
  // Funciones de actualización
  refreshData: () => Promise<void>;
  updateUsage: () => Promise<void>;
}

export interface PlanSystemContextType extends PlanSystemState, PlanSystemActions {
  // Información adicional
  currentPlan: string;
  planFeatures: { [key: string]: boolean };
}

interface PlanSystemProviderProps {
  children: ReactNode;
}

// =====================================================
// CONTEXTO
// =====================================================

const PlanSystemContext = createContext<PlanSystemContextType | undefined>(undefined);

// =====================================================
// PROVIDER
// =====================================================

export const PlanSystemProvider: React.FC<PlanSystemProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const idRestaurante = user?.id_restaurante || 0;

  // =====================================================
  // HOOKS DE PLANES
  // =====================================================

  const planLimits = usePlanLimits(idRestaurante);
  const planFeatures = usePlanFeaturesNew(idRestaurante);
  const planAlerts = usePlanAlerts(idRestaurante);

  // =====================================================
  // ESTADO COMPUTADO
  // =====================================================

  const currentPlan = planFeatures.getCurrentPlan();
  const planFeaturesMap = planFeatures.getPlanFeatures();
  const isActive = planFeatures.isPlanActive();
  const isExpired = planFeatures.isPlanExpired();
  const isSuspended = planFeatures.isPlanSuspended();
  const daysUntilExpiration = planFeatures.getDaysUntilExpiration();
  const unreadAlertsCount = planAlerts.getUnreadCount();

  // =====================================================
  // FUNCIONES DE ACTUALIZACIÓN
  // =====================================================

  const refreshData = useCallback(async () => {
    try {
      await Promise.all([
        planLimits.refreshData(),
        planFeatures.refreshData(),
        planAlerts.refreshData()
      ]);
    } catch (error) {
      console.error('Error refreshing plan system data:', error);
    }
  }, [planLimits, planFeatures, planAlerts]);

  const updateUsage = useCallback(async () => {
    try {
      await planLimits.updateUsage();
    } catch (error) {
      console.error('Error updating usage:', error);
    }
  }, [planLimits]);

  // =====================================================
  // ESTADO DEL CONTEXTO
  // =====================================================

  const state: PlanSystemState = {
    planInfo: planLimits.planInfo,
    suscripcion: planFeatures.suscripcion,
    usage: planLimits.usage,
    isLoading: planLimits.isLoading || planFeatures.isLoading || planAlerts.isLoading,
    error: planLimits.error || planFeatures.error || planAlerts.error,
    alertas: planAlerts.alertas,
    alertasActivas: planAlerts.alertasActivas,
    alertasCriticas: planAlerts.alertasCriticas,
    unreadAlertsCount,
    isActive,
    isExpired,
    isSuspended,
    daysUntilExpiration
  };

  const actions: PlanSystemActions = {
    // Funciones de verificación de límites
    isLimitExceeded: planLimits.isLimitExceeded,
    canAddResource: planLimits.canAddResource,
    getRemainingLimit: planLimits.getRemainingLimit,
    getUsagePercentage: planLimits.getUsagePercentage,
    
    // Funciones de verificación de funcionalidades
    hasFeature: planFeatures.hasFeature,
    canUseFeature: planFeatures.canUseFeature,
    checkFeatureAccess: planFeatures.checkFeatureAccess,
    
    // Funciones de conveniencia para funcionalidades específicas
    canUsePOS: planFeatures.canUsePOS,
    canUseInventarioBasico: planFeatures.canUseInventarioBasico,
    canUseInventarioAvanzado: planFeatures.canUseInventarioAvanzado,
    canUsePromociones: planFeatures.canUsePromociones,
    canUseReservas: planFeatures.canUseReservas,
    canUseArqueoCaja: planFeatures.canUseArqueoCaja,
    canUseEgresos: planFeatures.canUseEgresos,
    canUseEgresosAvanzados: planFeatures.canUseEgresosAvanzados,
    canUseReportesAvanzados: planFeatures.canUseReportesAvanzados,
    canUseAnalytics: planFeatures.canUseAnalytics,
    canUseDelivery: planFeatures.canUseDelivery,
    canUseImpresion: planFeatures.canUseImpresion,
    canUseSoporte24h: planFeatures.canUseSoporte24h,
    canUseAPI: planFeatures.canUseAPI,
    canUseWhiteLabel: planFeatures.canUseWhiteLabel,
    
    // Funciones de información de límites
    getSucursalesInfo: planLimits.getSucursalesInfo,
    getUsuariosInfo: planLimits.getUsuariosInfo,
    getProductosInfo: planLimits.getProductosInfo,
    getTransaccionesInfo: planLimits.getTransaccionesInfo,
    getAlmacenamientoInfo: planLimits.getAlmacenamientoInfo,
    
    // Funciones de gestión de alertas
    resolveAlert: planAlerts.resolveAlert,
    ignoreAlert: planAlerts.ignoreAlert,
    markAllAsRead: planAlerts.markAllAsRead,
    
    // Funciones de actualización
    refreshData,
    updateUsage
  };

  const contextValue: PlanSystemContextType = {
    ...state,
    ...actions,
    currentPlan,
    planFeatures: planFeaturesMap
  };

  // =====================================================
  // EFECTOS
  // =====================================================

  useEffect(() => {
    if (idRestaurante > 0) {
      refreshData();
    }
  }, [idRestaurante]); // Removido refreshData de las dependencias para evitar bucle infinito

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <PlanSystemContext.Provider value={contextValue}>
      {children}
    </PlanSystemContext.Provider>
  );
};

// =====================================================
// HOOK DE USO
// =====================================================

export const usePlanSystem = (): PlanSystemContextType => {
  const context = useContext(PlanSystemContext);
  
  if (context === undefined) {
    throw new Error('usePlanSystem must be used within a PlanSystemProvider');
  }
  
  return context;
};

// =====================================================
// HOOKS DE CONVENIENCIA
// =====================================================

export const usePlanLimitsOnly = () => {
  const { user } = useAuth();
  return usePlanLimits(user?.id_restaurante || 0);
};

export const usePlanFeaturesOnly = () => {
  const { user } = useAuth();
  return usePlanFeaturesNew(user?.id_restaurante || 0);
};

export const usePlanAlertsOnly = () => {
  const { user } = useAuth();
  return usePlanAlerts(user?.id_restaurante || 0);
};

export default PlanSystemContext;
