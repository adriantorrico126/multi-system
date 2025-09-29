import { api } from './api';

// =====================================================
// TIPOS DE DATOS PARA EL SISTEMA DE PLANES
// =====================================================

export interface Plan {
  id_plan: number;
  nombre: string;
  descripcion: string;
  precio_mensual: number;
  precio_anual: number;
  descuento_anual: number;
  activo: boolean;
  max_sucursales: number;
  max_usuarios: number;
  max_productos: number;
  max_transacciones_mes: number;
  almacenamiento_gb: number;
  incluye_pos: boolean;
  incluye_inventario_basico: boolean;
  incluye_inventario_avanzado: boolean;
  incluye_promociones: boolean;
  incluye_reservas: boolean;
  incluye_arqueo_caja: boolean;
  incluye_egresos: boolean;
  incluye_egresos_avanzados: boolean;
  incluye_reportes_avanzados: boolean;
  incluye_analytics: boolean;
  incluye_delivery: boolean;
  incluye_impresion: boolean;
  incluye_soporte_24h: boolean;
  incluye_api: boolean;
  incluye_white_label: boolean;
  created_at: string;
  updated_at: string;
}

export interface Suscripcion {
  id_suscripcion: number;
  id_restaurante: number;
  id_plan: number;
  nombre_plan: string;
  precio_mensual: number;
  precio_anual: number;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_renovacion: string;
  estado: 'activa' | 'suspendida' | 'cancelada' | 'expirada';
  auto_renovacion: boolean;
  metodo_pago: string;
  ultimo_pago: string;
  proximo_pago: string;
  motivo_suspension?: string;
  fecha_suspension?: string;
  motivo_cancelacion?: string;
  fecha_cancelacion?: string;
  notificaciones_email: boolean;
  notificaciones_sms: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContadorUso {
  id_contador: number;
  id_restaurante: number;
  id_plan: number;
  sucursales_actuales: number;
  usuarios_actuales: number;
  productos_actuales: number;
  transacciones_mes_actual: number;
  almacenamiento_usado_mb: number;
  fecha_actualizacion: string;
  created_at: string;
  updated_at: string;
}

export interface AlertaLimite {
  id_alerta: number;
  id_restaurante: number;
  id_plan: number;
  tipo_alerta: string;
  recurso: string;
  valor_actual: number;
  valor_limite: number;
  porcentaje_uso: number;
  nivel_urgencia: 'bajo' | 'medio' | 'alto' | 'critico';
  mensaje: string;
  estado: 'pendiente' | 'enviada' | 'resuelta' | 'ignorada';
  fecha_alerta: string;
  fecha_resolucion?: string;
  motivo_resolucion?: string;
  created_at: string;
  updated_at: string;
}

export interface PlanInfo {
  plan: Plan;
  suscripcion: Suscripcion;
  limites: {
    max_sucursales: number;
    max_usuarios: number;
    max_productos: number;
    max_transacciones_mes: number;
    almacenamiento_gb: number;
  };
  uso_actual: {
    sucursales_actuales: number;
    usuarios_actuales: number;
    productos_actuales: number;
    transacciones_mes_actual: number;
    almacenamiento_usado_mb: number;
  };
  funcionalidades: {
    [key: string]: boolean;
  };
}

// =====================================================
// API DE PLANES
// =====================================================

export const planesApi = {
  // Obtener todos los planes
  getAllPlans: async (): Promise<Plan[]> => {
    const response = await api.get('/planes-sistema/planes');
    return response.data.data;
  },

  // Obtener plan por ID
  getPlanById: async (id: number): Promise<Plan> => {
    const response = await api.get(`/planes-sistema/planes/${id}`);
    return response.data.data;
  },

  // Obtener plan por nombre
  getPlanByName: async (nombre: string): Promise<Plan> => {
    const response = await api.get(`/planes-sistema/planes/nombre/${nombre}`);
    return response.data.data;
  },

  // Comparar dos planes
  comparePlans: async (idPlan1: number, idPlan2: number) => {
    const response = await api.get(`/planes-sistema/planes/${idPlan1}/compare/${idPlan2}`);
    return response.data.data;
  },

  // Obtener planes con descuento anual
  getPlansWithAnnualDiscount: async (): Promise<Plan[]> => {
    const response = await api.get('/planes-sistema/planes/descuento-anual');
    return response.data.data;
  },

  // Obtener plan más popular
  getMostPopularPlan: async (): Promise<Plan> => {
    const response = await api.get('/planes-sistema/planes/mas-popular');
    return response.data.data;
  },

  // Obtener estadísticas de planes
  getPlanStats: async () => {
    const response = await api.get('/planes-sistema/planes/estadisticas');
    return response.data.data;
  }
};

// =====================================================
// API DE SUSCRIPCIONES
// =====================================================

export const suscripcionesApi = {
  // Obtener suscripción activa de un restaurante
  getActiveSubscription: async (idRestaurante: number): Promise<Suscripcion> => {
    try {
      console.log('🔍 [API] Llamando a getActiveSubscription para restaurante:', idRestaurante);
      const response = await api.get(`/suscripciones-sistema/restaurante/${idRestaurante}/activa`, {
        timeout: 10000 // 10 segundos de timeout específico
      });
      console.log('🔍 [API] Respuesta de suscripción completa:', response);
      console.log('🔍 [API] response.data:', response.data);
      console.log('🔍 [API] response.data.data:', response.data.data);
      console.log('🔍 [API] getActiveSubscription completado exitosamente');
      return response.data.data;
    } catch (error) {
      console.error('❌ [API] Error en getActiveSubscription:', error);
      console.error('❌ [API] Error details:', error);
      if (error.code === 'ECONNABORTED') {
        console.error('⏰ [API] Timeout en getActiveSubscription');
      }
      throw error;
    }
  },

  // Obtener todas las suscripciones de un restaurante
  getRestaurantSubscriptions: async (idRestaurante: number): Promise<Suscripcion[]> => {
    const response = await api.get(`/suscripciones-sistema/restaurante/${idRestaurante}`);
    return response.data.data;
  },

  // Verificar si tiene suscripción activa
  hasActiveSubscription: async (idRestaurante: number): Promise<boolean> => {
    const response = await api.get(`/suscripciones-sistema/restaurante/${idRestaurante}/tiene-activa`);
    return response.data.data;
  },

  // Obtener información completa de la suscripción
  getSubscriptionInfo: async (idRestaurante: number) => {
    const response = await api.get(`/suscripciones-sistema/restaurante/${idRestaurante}/info`);
    return response.data.data;
  },

  // Obtener estado de la suscripción
  getSubscriptionStatus: async (idRestaurante: number) => {
    const response = await api.get(`/suscripciones-sistema/restaurante/${idRestaurante}/estado`);
    return response.data.data;
  },

  // Obtener información de renovación
  getRenewalInfo: async (idRestaurante: number) => {
    const response = await api.get(`/suscripciones-sistema/restaurante/${idRestaurante}/renovacion`);
    return response.data.data;
  },

  // Activar auto-renovación
  activateAutoRenewal: async (idRestaurante: number) => {
    const response = await api.put(`/suscripciones-sistema/restaurante/${idRestaurante}/activar-auto-renovacion`);
    return response.data.data;
  },

  // Desactivar auto-renovación
  deactivateAutoRenewal: async (idRestaurante: number) => {
    const response = await api.put(`/suscripciones-sistema/restaurante/${idRestaurante}/desactivar-auto-renovacion`);
    return response.data.data;
  },

  // Obtener opciones de cambio de plan
  getPlanChangeOptions: async (idRestaurante: number) => {
    const response = await api.get(`/suscripciones-sistema/restaurante/${idRestaurante}/cambio-plan/opciones`);
    return response.data.data;
  },

  // Solicitar cambio de plan
  requestPlanChange: async (idRestaurante: number, nuevoPlan: string, motivo: string) => {
    const response = await api.post(`/suscripciones-sistema/restaurante/${idRestaurante}/cambio-plan`, {
      nuevo_plan: nuevoPlan,
      motivo: motivo
    });
    return response.data.data;
  },

  // Obtener configuración de notificaciones
  getNotificationSettings: async (idRestaurante: number) => {
    const response = await api.get(`/suscripciones-sistema/restaurante/${idRestaurante}/notificaciones`);
    return response.data.data;
  },

  // Actualizar configuración de notificaciones
  updateNotificationSettings: async (idRestaurante: number, settings: any) => {
    const response = await api.put(`/suscripciones-sistema/restaurante/${idRestaurante}/notificaciones`, settings);
    return response.data.data;
  }
};

// =====================================================
// API DE CONTADORES DE USO
// =====================================================

export const contadoresApi = {
  // Obtener uso actual de un restaurante
  getCurrentUsage: async (idRestaurante: number): Promise<ContadorUso> => {
    const response = await api.get(`/contadores-sistema/restaurante/${idRestaurante}/actual`);
    return response.data.data;
  },

  // Obtener historial de uso
  getUsageHistory: async (idRestaurante: number) => {
    const response = await api.get(`/contadores-sistema/restaurante/${idRestaurante}/historial`);
    return response.data.data;
  },

  // Verificar límites
  checkLimits: async (idRestaurante: number) => {
    const response = await api.get(`/contadores-sistema/restaurante/${idRestaurante}/limites`);
    return response.data.data;
  },

  // Verificar si se puede agregar un recurso
  canAddResource: async (idRestaurante: number, tipoRecurso: string, cantidad: number = 1) => {
    const response = await api.get(`/contadores-sistema/restaurante/${idRestaurante}/puede-agregar/${tipoRecurso}?cantidad=${cantidad}`);
    return response.data.data;
  },

  // Obtener resumen de uso
  getUsageSummary: async (idRestaurante: number) => {
    const response = await api.get(`/contadores-sistema/restaurante/${idRestaurante}/resumen`);
    return response.data.data;
  },

  // Obtener datos para gráficos
  getUsageCharts: async (idRestaurante: number) => {
    const response = await api.get(`/contadores-sistema/restaurante/${idRestaurante}/graficos`);
    return response.data.data;
  },

  // Obtener análisis de uso
  getUsageAnalysis: async (idRestaurante: number) => {
    const response = await api.get(`/contadores-sistema/restaurante/${idRestaurante}/analisis`);
    return response.data.data;
  },

  // Actualizar contador de sucursales
  updateSucursalesCount: async (idRestaurante: number) => {
    const response = await api.put(`/contadores-sistema/restaurante/${idRestaurante}/sucursales`);
    return response.data.data;
  },

  // Actualizar contador de usuarios
  updateUsuariosCount: async (idRestaurante: number) => {
    const response = await api.put(`/contadores-sistema/restaurante/${idRestaurante}/usuarios`);
    return response.data.data;
  },

  // Actualizar contador de productos
  updateProductosCount: async (idRestaurante: number) => {
    const response = await api.put(`/contadores-sistema/restaurante/${idRestaurante}/productos`);
    return response.data.data;
  },

  // Actualizar contador de transacciones
  updateTransaccionesCount: async (idRestaurante: number) => {
    const response = await api.put(`/contadores-sistema/restaurante/${idRestaurante}/transacciones`);
    return response.data.data;
  },

  // Actualizar contador de almacenamiento
  updateAlmacenamientoCount: async (idRestaurante: number, tamañoArchivo: number) => {
    const response = await api.put(`/contadores-sistema/restaurante/${idRestaurante}/almacenamiento`, {
      tamaño_archivo: tamañoArchivo
    });
    return response.data.data;
  },

  // Actualizar todos los contadores
  updateAllCounters: async (idRestaurante: number) => {
    const response = await api.put(`/contadores-sistema/restaurante/${idRestaurante}/todos`);
    return response.data.data;
  }
};

// =====================================================
// API DE ALERTAS
// =====================================================

export const alertasApi = {
  // Obtener alertas de un restaurante
  getRestaurantAlerts: async (idRestaurante: number): Promise<AlertaLimite[]> => {
    const response = await api.get(`/alertas-sistema/restaurante/${idRestaurante}`);
    return response.data.data;
  },

  // Obtener alertas activas
  getActiveAlerts: async (idRestaurante: number): Promise<AlertaLimite[]> => {
    const response = await api.get(`/alertas-sistema/restaurante/${idRestaurante}/activas`);
    return response.data.data;
  },

  // Obtener alertas resueltas
  getResolvedAlerts: async (idRestaurante: number): Promise<AlertaLimite[]> => {
    const response = await api.get(`/alertas-sistema/restaurante/${idRestaurante}/resueltas`);
    return response.data.data;
  },

  // Obtener resumen de alertas
  getAlertsSummary: async (idRestaurante: number) => {
    const response = await api.get(`/alertas-sistema/restaurante/${idRestaurante}/resumen`);
    return response.data.data;
  },

  // Obtener dashboard de alertas
  getAlertsDashboard: async (idRestaurante: number) => {
    const response = await api.get(`/alertas-sistema/restaurante/${idRestaurante}/dashboard`);
    return response.data.data;
  },

  // Resolver una alerta
  resolveAlert: async (idRestaurante: number, idAlerta: number, mensajeResolucion: string) => {
    const response = await api.put(`/alertas-sistema/restaurante/${idRestaurante}/${idAlerta}/resolver`, {
      mensaje_resolucion: mensajeResolucion
    });
    return response.data.data;
  },

  // Ignorar una alerta
  ignoreAlert: async (idRestaurante: number, idAlerta: number, motivo: string) => {
    const response = await api.put(`/alertas-sistema/restaurante/${idRestaurante}/${idAlerta}/ignorar`, {
      motivo: motivo
    });
    return response.data.data;
  },

  // Marcar todas las alertas como leídas
  markAllAsRead: async (idRestaurante: number) => {
    const response = await api.put(`/alertas-sistema/restaurante/${idRestaurante}/marcar-todas-como-leidas`);
    return response.data.data;
  },

  // Obtener configuración de alertas
  getAlertsConfiguration: async (idRestaurante: number) => {
    const response = await api.get(`/alertas-sistema/restaurante/${idRestaurante}/configuracion`);
    return response.data.data;
  },

  // Actualizar configuración de alertas
  updateAlertsConfiguration: async (idRestaurante: number, configuracion: any) => {
    const response = await api.put(`/alertas-sistema/restaurante/${idRestaurante}/configuracion`, configuracion);
    return response.data.data;
  }
};

// =====================================================
// API UNIFICADA DE PLANES
// =====================================================

export const planesSistemaApi = {
  // Obtener información completa del plan actual
  getCurrentPlanInfo: async (idRestaurante: number): Promise<PlanInfo> => {
    try {
      console.log('🔍 [API] Llamando a getCurrentPlanInfo para restaurante:', idRestaurante);
      const response = await api.get(`/planes-sistema/restaurante/${idRestaurante}/actual`, {
        timeout: 10000 // 10 segundos de timeout específico
      });
      console.log('🔍 [API] Respuesta completa:', response);
      console.log('🔍 [API] response.data:', response.data);
      console.log('🔍 [API] response.data.data:', response.data.data);
      console.log('🔍 [API] getCurrentPlanInfo completado exitosamente');
      return response.data.data;
    } catch (error) {
      console.error('❌ [API] Error en getCurrentPlanInfo:', error);
      console.error('❌ [API] Error details:', error);
      if (error.code === 'ECONNABORTED') {
        console.error('⏰ [API] Timeout en getCurrentPlanInfo');
      }
      throw error;
    }
  },

  // Obtener uso actual del restaurante
  getCurrentRestaurantUsage: async (idRestaurante: number) => {
    const response = await api.get(`/planes-sistema/restaurante/${idRestaurante}/uso`);
    return response.data.data;
  },

  // Verificar límites del restaurante
  checkRestaurantLimits: async (idRestaurante: number) => {
    const response = await api.get(`/planes-sistema/restaurante/${idRestaurante}/limites`);
    return response.data.data;
  },

  // Obtener funcionalidades disponibles
  getAvailableFeatures: async (idRestaurante: number) => {
    const response = await api.get(`/planes-sistema/restaurante/${idRestaurante}/funcionalidades`);
    return response.data.data;
  },

  // Verificar si se puede agregar un recurso
  canAddResource: async (idRestaurante: number, tipoRecurso: string, cantidad: number = 1) => {
    const response = await api.get(`/planes-sistema/restaurante/${idRestaurante}/puede-agregar/${tipoRecurso}?cantidad=${cantidad}`);
    return response.data.data;
  },

  // Obtener opciones de upgrade
  getUpgradeOptions: async (idRestaurante: number) => {
    const response = await api.get(`/planes-sistema/restaurante/${idRestaurante}/upgrade-options`);
    return response.data.data;
  },

  // Obtener opciones de downgrade
  getDowngradeOptions: async (idRestaurante: number) => {
    const response = await api.get(`/planes-sistema/restaurante/${idRestaurante}/downgrade-options`);
    return response.data.data;
  },

  // Comparar plan actual con otro plan
  compareWithPlan: async (idRestaurante: number, idPlan: number) => {
    const response = await api.get(`/planes-sistema/restaurante/${idRestaurante}/compare/${idPlan}`);
    return response.data.data;
  },

  // Obtener estadísticas del restaurante
  getRestaurantStats: async (idRestaurante: number) => {
    const response = await api.get(`/planes-sistema/restaurante/${idRestaurante}/estadisticas`);
    return response.data.data;
  }
};

export default {
  planes: planesApi,
  suscripciones: suscripcionesApi,
  contadores: contadoresApi,
  alertas: alertasApi,
  sistema: planesSistemaApi
};
