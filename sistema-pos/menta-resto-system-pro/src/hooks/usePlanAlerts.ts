import { useState, useEffect, useCallback } from 'react';
import { alertasApi } from '@/services/planesApi';
import { AlertaLimite } from '@/services/planesApi';

// =====================================================
// TIPOS DE DATOS
// =====================================================

export interface AlertSummary {
  total_alertas: number;
  por_estado: {
    pendientes: number;
    enviadas: number;
    resueltas: number;
    ignoradas: number;
  };
  por_urgencia: {
    criticas: number;
    altas: number;
    medias: number;
    bajas: number;
  };
  recientes: number;
  requiere_atencion: number;
  alertas_criticas: AlertaLimite[];
  tendencias: {
    alertas_ultima_semana: number;
    promedio_resolucion_dias: number;
    tasa_resolucion: number;
  };
}

export interface AlertDashboard {
  alertas_activas: AlertaLimite[];
  alertas_criticas: AlertaLimite[];
  alertas_por_tipo: Record<string, number>;
  alertas_por_urgencia: Record<string, number>;
  alertas_por_mes: Record<string, number>;
  metricas: {
    total_alertas: number;
    alertas_pendientes: number;
    alertas_resueltas: number;
    tiempo_promedio_resolucion: number;
  };
  recomendaciones: Array<{
    tipo: string;
    mensaje: string;
    accion: string;
  }>;
}

export interface UsePlanAlertsReturn {
  // Estado
  alertas: AlertaLimite[];
  alertasActivas: AlertaLimite[];
  alertasCriticas: AlertaLimite[];
  alertasResueltas: AlertaLimite[];
  summary: AlertSummary | null;
  dashboard: AlertDashboard | null;
  isLoading: boolean;
  error: string | null;
  
  // Funciones de gestión de alertas
  resolveAlert: (idAlerta: number, mensajeResolucion: string) => Promise<void>;
  ignoreAlert: (idAlerta: number, motivo: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  
  // Funciones de información
  getAlertsByType: (tipo: string) => AlertaLimite[];
  getAlertsByUrgency: (urgencia: string) => AlertaLimite[];
  getAlertsByStatus: (estado: string) => AlertaLimite[];
  hasActiveAlerts: () => boolean;
  hasCriticalAlerts: () => boolean;
  getUnreadCount: () => number;
  
  // Funciones de actualización
  refreshData: () => Promise<void>;
  refreshSummary: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export const usePlanAlerts = (idRestaurante: number): UsePlanAlertsReturn => {
  const [alertas, setAlertas] = useState<AlertaLimite[]>([]);
  const [alertasActivas, setAlertasActivas] = useState<AlertaLimite[]>([]);
  const [alertasCriticas, setAlertasCriticas] = useState<AlertaLimite[]>([]);
  const [alertasResueltas, setAlertasResueltas] = useState<AlertaLimite[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [dashboard, setDashboard] = useState<AlertDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // FUNCIONES DE CARGA DE DATOS
  // =====================================================

  const loadAllAlerts = useCallback(async () => {
    try {
      const data = await alertasApi.getRestaurantAlerts(idRestaurante);
      setAlertas(data);
    } catch (err) {
      console.error('Error loading alerts:', err);
      setError('Error al cargar alertas');
    }
  }, [idRestaurante]);

  const loadActiveAlerts = useCallback(async () => {
    try {
      const data = await alertasApi.getActiveAlerts(idRestaurante);
      setAlertasActivas(data);
    } catch (err) {
      console.error('Error loading active alerts:', err);
      setError('Error al cargar alertas activas');
    }
  }, [idRestaurante]);

  const loadCriticalAlerts = useCallback(async () => {
    try {
      const data = await alertasApi.getRestaurantAlerts(idRestaurante);
      const criticas = data.filter(alerta => alerta.nivel_urgencia === 'critico');
      setAlertasCriticas(criticas);
    } catch (err) {
      console.error('Error loading critical alerts:', err);
      setError('Error al cargar alertas críticas');
    }
  }, [idRestaurante]);

  const loadResolvedAlerts = useCallback(async () => {
    try {
      const data = await alertasApi.getResolvedAlerts(idRestaurante);
      setAlertasResueltas(data);
    } catch (err) {
      console.error('Error loading resolved alerts:', err);
      setError('Error al cargar alertas resueltas');
    }
  }, [idRestaurante]);

  const loadSummary = useCallback(async () => {
    try {
      const data = await alertasApi.getAlertsSummary(idRestaurante);
      setSummary(data);
    } catch (err) {
      console.error('Error loading alerts summary:', err);
      setError('Error al cargar resumen de alertas');
    }
  }, [idRestaurante]);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await alertasApi.getAlertsDashboard(idRestaurante);
      setDashboard(data);
    } catch (err) {
      console.error('Error loading alerts dashboard:', err);
      setError('Error al cargar dashboard de alertas');
    }
  }, [idRestaurante]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    // Limpiar estado anterior al cambiar de restaurante
    setAlertas([]);
    setAlertasActivas([]);
    setAlertasCriticas([]);
    setAlertasResueltas([]);
    setDashboard(null);
    
    try {
      await Promise.all([
        loadAllAlerts(),
        loadActiveAlerts(),
        loadCriticalAlerts(),
        loadResolvedAlerts()
      ]);
    } catch (err) {
      console.error('Error refreshing alerts data:', err);
      setError('Error al actualizar datos de alertas');
    } finally {
      setIsLoading(false);
    }
  }, [loadAllAlerts, loadActiveAlerts, loadCriticalAlerts, loadResolvedAlerts]);

  const refreshSummary = useCallback(async () => {
    try {
      await loadSummary();
    } catch (err) {
      console.error('Error refreshing summary:', err);
      setError('Error al actualizar resumen');
    }
  }, [loadSummary]);

  const refreshDashboard = useCallback(async () => {
    try {
      await loadDashboard();
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
      setError('Error al actualizar dashboard');
    }
  }, [loadDashboard]);

  // =====================================================
  // FUNCIONES DE GESTIÓN DE ALERTAS
  // =====================================================

  const resolveAlert = useCallback(async (idAlerta: number, mensajeResolucion: string) => {
    try {
      await alertasApi.resolveAlert(idRestaurante, idAlerta, mensajeResolucion);
      await refreshData();
      await refreshSummary();
      await refreshDashboard();
    } catch (err) {
      console.error('Error resolving alert:', err);
      setError('Error al resolver alerta');
      throw err;
    }
  }, [idRestaurante, refreshData, refreshSummary, refreshDashboard]);

  const ignoreAlert = useCallback(async (idAlerta: number, motivo: string) => {
    try {
      await alertasApi.ignoreAlert(idRestaurante, idAlerta, motivo);
      await refreshData();
      await refreshSummary();
      await refreshDashboard();
    } catch (err) {
      console.error('Error ignoring alert:', err);
      setError('Error al ignorar alerta');
      throw err;
    }
  }, [idRestaurante, refreshData, refreshSummary, refreshDashboard]);

  const markAllAsRead = useCallback(async () => {
    try {
      await alertasApi.markAllAsRead(idRestaurante);
      await refreshData();
      await refreshSummary();
      await refreshDashboard();
    } catch (err) {
      console.error('Error marking all as read:', err);
      setError('Error al marcar todas como leídas');
      throw err;
    }
  }, [idRestaurante, refreshData, refreshSummary, refreshDashboard]);

  // =====================================================
  // FUNCIONES DE INFORMACIÓN
  // =====================================================

  const getAlertsByType = useCallback((tipo: string): AlertaLimite[] => {
    return alertas.filter(alerta => alerta.tipo_alerta === tipo);
  }, [alertas]);

  const getAlertsByUrgency = useCallback((urgencia: string): AlertaLimite[] => {
    return alertas.filter(alerta => alerta.nivel_urgencia === urgencia);
  }, [alertas]);

  const getAlertsByStatus = useCallback((estado: string): AlertaLimite[] => {
    return alertas.filter(alerta => alerta.estado === estado);
  }, [alertas]);

  const hasActiveAlerts = useCallback((): boolean => {
    return alertasActivas.length > 0;
  }, [alertasActivas]);

  const hasCriticalAlerts = useCallback((): boolean => {
    return alertasCriticas.length > 0;
  }, [alertasCriticas]);

  const getUnreadCount = useCallback((): number => {
    return alertas.filter(alerta => 
      alerta.estado === 'pendiente' || alerta.estado === 'enviada'
    ).length;
  }, [alertas]);

  // =====================================================
  // EFECTOS
  // =====================================================

  useEffect(() => {
    if (idRestaurante) {
      refreshData();
      refreshSummary();
      refreshDashboard();
    }
  }, [idRestaurante]); // Removidas las funciones de las dependencias para evitar bucle infinito

  // =====================================================
  // RETORNO
  // =====================================================

  return {
    // Estado
    alertas,
    alertasActivas,
    alertasCriticas,
    alertasResueltas,
    summary,
    dashboard,
    isLoading,
    error,
    
    // Funciones de gestión de alertas
    resolveAlert,
    ignoreAlert,
    markAllAsRead,
    
    // Funciones de información
    getAlertsByType,
    getAlertsByUrgency,
    getAlertsByStatus,
    hasActiveAlerts,
    hasCriticalAlerts,
    getUnreadCount,
    
    // Funciones de actualización
    refreshData,
    refreshSummary,
    refreshDashboard
  };
};

export default usePlanAlerts;
