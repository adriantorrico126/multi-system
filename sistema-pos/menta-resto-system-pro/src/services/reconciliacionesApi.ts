import { api } from './api';

// =====================================================
// API DE RECONCILIACIONES DE CAJA
// Multi-tenant por restaurante y sucursal
// =====================================================

export interface ReconciliacionEfectivo {
  tipo_reconciliacion: 'efectivo';
  monto_inicial?: number;
  efectivo_esperado: number;
  efectivo_fisico: number;
  observaciones?: string;
}

export interface ReconciliacionCompleta {
  tipo_reconciliacion: 'completa';
  total_esperado: number;
  total_registrado: number;
  datos_por_metodo: Record<string, number>;
  observaciones?: string;
}

export type ReconciliacionData = ReconciliacionEfectivo | ReconciliacionCompleta;

export interface Reconciliacion {
  id_reconciliacion: number;
  id_restaurante: number;
  id_sucursal: number;
  id_usuario: number;
  fecha_reconciliacion: string;
  fecha_inicio: string;
  fecha_fin: string;
  efectivo_inicial: number;
  efectivo_final: number;
  efectivo_esperado: number;
  diferencia: number;
  observaciones?: string;
  estado: 'completada' | 'pendiente' | 'cancelada';
  created_at: string;
  updated_at: string;
  sucursal_nombre?: string;
  usuario_nombre?: string;
  usuario_email?: string;
  usuario_rol?: string;
  // Campos formateados
  fecha_formateada?: string;
  hora_formateada?: string;
  fecha_hora_completa?: string;
  duracion_horas?: number;
  estado_formateado?: string;
  diferencia_formateada?: string;
  // Detalles de métodos de pago
  detalles_metodos?: Array<{
    metodo_pago: string;
    monto_esperado: number;
    monto_real: number;
    diferencia: number;
    observaciones?: string;
  }>;
  total_metodos?: number;
}

export interface ReconciliacionDetalle extends Reconciliacion {
  metodos_detalle?: MetodoPagoDetalle[];
  historial?: HistorialCambio[];
}

export interface MetodoPagoDetalle {
  id_detalle: number;
  id_reconciliacion: number;
  metodo_pago: string;
  monto_esperado: number;
  monto_registrado: number;
  diferencia: number;
  estado: 'cuadrado' | 'sobrante' | 'faltante';
}

export interface HistorialCambio {
  id_historial: number;
  id_reconciliacion: number;
  accion: string;
  datos_anteriores?: any;
  datos_nuevos?: any;
  id_usuario: number;
  nombre_usuario: string;
  fecha_cambio: string;
}

export interface ResumenReconciliaciones {
  id_restaurante: number;
  id_sucursal: number;
  fecha: string;
  total_reconciliaciones: number;
  reconciliaciones_cuadradas: number;
  reconciliaciones_sobrantes: number;
  reconciliaciones_faltantes: number;
  diferencia_efectivo_total: number;
  diferencia_total_general: number;
  diferencia_efectivo_promedio: number;
  diferencia_total_promedio: number;
}

export interface EstadisticasReconciliaciones {
  total_reconciliaciones: number;
  reconciliaciones_cuadradas: number;
  reconciliaciones_sobrantes: number;
  reconciliaciones_faltantes: number;
  reconciliaciones_efectivo: number;
  reconciliaciones_completas: number;
  diferencia_efectivo_promedio: number;
  diferencia_total_promedio: number;
  diferencia_efectivo_total: number;
  diferencia_total_general: number;
}

export interface FiltrosReconciliaciones {
  fecha_inicio?: string;
  fecha_fin?: string;
  id_sucursal?: number;
  tipo_reconciliacion?: 'efectivo' | 'completa';
}

// =====================================================
// FUNCIONES DE API
// =====================================================

/**
 * Crear nueva reconciliación
 */
export const crearReconciliacion = async (data: ReconciliacionData): Promise<Reconciliacion> => {
  try {
    const response = await api.post('/reconciliaciones', data);
    return response.data.data;
  } catch (error: any) {
    console.error('Error creando reconciliación:', error);
    throw new Error(error.response?.data?.message || 'Error al crear reconciliación');
  }
};

/**
 * Obtener reconciliaciones con filtros
 */
export const obtenerReconciliaciones = async (filtros?: FiltrosReconciliaciones): Promise<Reconciliacion[]> => {
  try {
    const params = new URLSearchParams();
    
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros?.id_sucursal) params.append('id_sucursal', filtros.id_sucursal.toString());
    if (filtros?.tipo_reconciliacion) params.append('tipo_reconciliacion', filtros.tipo_reconciliacion);

    const response = await api.get(`/reconciliaciones?${params.toString()}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error obteniendo reconciliaciones:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener reconciliaciones');
  }
};

/**
 * Obtener reconciliaciones del día actual
 */
export const obtenerReconciliacionesHoy = async (): Promise<Reconciliacion[]> => {
  try {
    const response = await api.get('/reconciliaciones/hoy');
    return response.data.data;
  } catch (error: any) {
    console.error('Error obteniendo reconciliaciones de hoy:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener reconciliaciones de hoy');
  }
};

/**
 * Obtener reconciliación específica con detalles
 */
export const obtenerReconciliacion = async (id: number): Promise<ReconciliacionDetalle> => {
  try {
    const response = await api.get(`/reconciliaciones/${id}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error obteniendo reconciliación:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener reconciliación');
  }
};

/**
 * Obtener resumen de reconciliaciones por período
 */
export const obtenerResumenReconciliaciones = async (filtros?: Omit<FiltrosReconciliaciones, 'tipo_reconciliacion'>): Promise<ResumenReconciliaciones[]> => {
  try {
    const params = new URLSearchParams();
    
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros?.id_sucursal) params.append('id_sucursal', filtros.id_sucursal.toString());

    const response = await api.get(`/reconciliaciones/resumen?${params.toString()}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error obteniendo resumen de reconciliaciones:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener resumen de reconciliaciones');
  }
};

/**
 * Obtener estadísticas de reconciliaciones
 */
export const obtenerEstadisticasReconciliaciones = async (filtros?: Omit<FiltrosReconciliaciones, 'tipo_reconciliacion'>): Promise<EstadisticasReconciliaciones> => {
  try {
    const params = new URLSearchParams();
    
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros?.id_sucursal) params.append('id_sucursal', filtros.id_sucursal.toString());

    const response = await api.get(`/reconciliaciones/estadisticas?${params.toString()}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error obteniendo estadísticas de reconciliaciones:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener estadísticas de reconciliaciones');
  }
};

/**
 * Actualizar reconciliación
 */
export const actualizarReconciliacion = async (id: number, data: Partial<ReconciliacionData>): Promise<Reconciliacion> => {
  try {
    const response = await api.put(`/reconciliaciones/${id}`, data);
    return response.data.data;
  } catch (error: any) {
    console.error('Error actualizando reconciliación:', error);
    throw new Error(error.response?.data?.message || 'Error al actualizar reconciliación');
  }
};

/**
 * Eliminar reconciliación
 */
export const eliminarReconciliacion = async (id: number): Promise<Reconciliacion> => {
  try {
    const response = await api.delete(`/reconciliaciones/${id}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error eliminando reconciliación:', error);
    throw new Error(error.response?.data?.message || 'Error al eliminar reconciliación');
  }
};

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

/**
 * Calcular diferencia de efectivo
 */
export const calcularDiferenciaEfectivo = (efectivoEsperado: number, efectivoFisico: number): number => {
  return efectivoFisico - efectivoEsperado;
};

/**
 * Calcular diferencia total
 */
export const calcularDiferenciaTotal = (totalEsperado: number, totalRegistrado: number): number => {
  return totalRegistrado - totalEsperado;
};

/**
 * Determinar estado de reconciliación
 */
export const determinarEstadoReconciliacion = (diferencia: number): 'cuadrada' | 'sobrante' | 'faltante' => {
  if (diferencia === 0) return 'cuadrada';
  if (diferencia > 0) return 'sobrante';
  return 'faltante';
};

/**
 * Formatear diferencia para mostrar
 */
export const formatearDiferencia = (diferencia: number): string => {
  const signo = diferencia > 0 ? '+' : '';
  return `${signo}Bs ${Math.abs(diferencia).toFixed(2)}`;
};

/**
 * Obtener color según estado
 */
export const obtenerColorEstado = (estado: 'cuadrada' | 'sobrante' | 'faltante'): string => {
  switch (estado) {
    case 'cuadrada': return 'green';
    case 'sobrante': return 'blue';
    case 'faltante': return 'red';
    default: return 'gray';
  }
};

/**
 * Obtener icono según estado
 */
export const obtenerIconoEstado = (estado: 'cuadrada' | 'sobrante' | 'faltante'): string => {
  switch (estado) {
    case 'cuadrada': return '✅';
    case 'sobrante': return '📈';
    case 'faltante': return '📉';
    default: return '❓';
  }
};

/**
 * Validar datos de reconciliación
 */
export const validarReconciliacion = (data: ReconciliacionData): { valido: boolean; errores: string[] } => {
  const errores: string[] = [];

  if (!data.tipo_reconciliacion) {
    errores.push('Tipo de reconciliación es requerido');
  }

  if (data.tipo_reconciliacion === 'efectivo') {
    const efectivoData = data as ReconciliacionEfectivo;
    if (!efectivoData.efectivo_esperado || efectivoData.efectivo_esperado < 0) {
      errores.push('Efectivo esperado debe ser un número positivo');
    }
    if (!efectivoData.efectivo_fisico || efectivoData.efectivo_fisico < 0) {
      errores.push('Efectivo físico debe ser un número positivo');
    }
  }

  if (data.tipo_reconciliacion === 'completa') {
    const completaData = data as ReconciliacionCompleta;
    if (!completaData.total_esperado || completaData.total_esperado < 0) {
      errores.push('Total esperado debe ser un número positivo');
    }
    if (!completaData.total_registrado || completaData.total_registrado < 0) {
      errores.push('Total registrado debe ser un número positivo');
    }
    if (!completaData.datos_por_metodo || Object.keys(completaData.datos_por_metodo).length === 0) {
      errores.push('Datos por método son requeridos para reconciliación completa');
    }
  }

  return {
    valido: errores.length === 0,
    errores
  };
};

export default {
  crearReconciliacion,
  obtenerReconciliaciones,
  obtenerReconciliacionesHoy,
  obtenerReconciliacion,
  obtenerResumenReconciliaciones,
  obtenerEstadisticasReconciliaciones,
  actualizarReconciliacion,
  eliminarReconciliacion,
  calcularDiferenciaEfectivo,
  calcularDiferenciaTotal,
  determinarEstadoReconciliacion,
  formatearDiferencia,
  obtenerColorEstado,
  obtenerIconoEstado,
  validarReconciliacion
};
