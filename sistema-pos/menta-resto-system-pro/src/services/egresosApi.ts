import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1';

// Configurar axios con interceptor para token
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =====================================================
// TIPOS TYPESCRIPT
// =====================================================

export interface CategoriaEgreso {
  id_categoria_egreso: number;
  nombre: string;
  descripcion?: string;
  color: string;
  icono: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  total_egresos?: number;
  total_gastado?: number;
}

export interface Egreso {
  id_egreso: number;
  concepto: string;
  descripcion?: string;
  monto: number;
  fecha_egreso: string;
  id_categoria_egreso: number;
  categoria_nombre?: string;
  categoria_color?: string;
  categoria_icono?: string;
  metodo_pago: 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito' | 'transferencia' | 'cheque' | 'otros';
  proveedor_nombre?: string;
  proveedor_documento?: string;
  proveedor_telefono?: string;
  proveedor_email?: string;
  numero_factura?: string;
  numero_recibo?: string;
  numero_comprobante?: string;
  estado: 'pendiente' | 'aprobado' | 'pagado' | 'cancelado' | 'rechazado';
  requiere_aprobacion: boolean;
  aprobado_por?: number;
  fecha_aprobacion?: string;
  comentario_aprobacion?: string;
  es_deducible: boolean;
  numero_autorizacion_fiscal?: string;
  codigo_control?: string;
  es_recurrente: boolean;
  frecuencia_recurrencia?: 'diario' | 'semanal' | 'mensual' | 'anual';
  proxima_fecha_recurrencia?: string;
  registrado_por: number;
  registrado_por_nombre?: string;
  aprobado_por_nombre?: string;
  id_sucursal: number;
  sucursal_nombre?: string;
  created_at: string;
  updated_at: string;
  flujo_aprobaciones?: FlujoAprobacion[];
}

export interface PresupuestoEgreso {
  id_presupuesto: number;
  anio: number;
  mes?: number;
  id_categoria_egreso: number;
  categoria_nombre?: string;
  categoria_color?: string;
  categoria_icono?: string;
  monto_presupuestado: number;
  monto_gastado: number;
  diferencia?: number;
  porcentaje_ejecutado?: number;
  estado_presupuesto?: 'normal' | 'precaucion' | 'alerta' | 'excedido';
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlujoAprobacion {
  id_flujo: number;
  accion: 'solicitado' | 'aprobado' | 'rechazado' | 'pagado' | 'cancelado';
  comentario?: string;
  fecha_accion: string;
  vendedor_nombre?: string;
  vendedor_username?: string;
}

export interface ResumenCategoria {
  id_categoria_egreso: number;
  categoria_nombre: string;
  categoria_color: string;
  categoria_icono: string;
  total_egresos: number;
  total_gastado: number;
  total_pendiente: number;
  promedio_gasto: number;
}

export interface FiltrosEgresos {
  fecha_inicio?: string;
  fecha_fin?: string;
  id_categoria_egreso?: number;
  estado?: string;
  id_sucursal?: number;
  proveedor_nombre?: string;
  page?: number;
  limit?: number;
}

// =====================================================
// API DE CATEGORÍAS DE EGRESOS
// =====================================================

export const categoriasEgresosApi = {
  // Obtener todas las categorías
  async getAll(incluirInactivas = false): Promise<CategoriaEgreso[]> {
    const response = await api.get(`/categorias-egresos`, {
      params: { incluir_inactivas: incluirInactivas }
    });
    return response.data.data;
  },

  // Obtener categoría por ID
  async getById(id: number): Promise<CategoriaEgreso> {
    const response = await api.get(`/categorias-egresos/${id}`);
    return response.data.data;
  },

  // Crear nueva categoría
  async create(categoria: Partial<CategoriaEgreso>): Promise<CategoriaEgreso> {
    const response = await api.post('/categorias-egresos', categoria);
    return response.data.data;
  },

  // Actualizar categoría
  async update(id: number, categoria: Partial<CategoriaEgreso>): Promise<CategoriaEgreso> {
    const response = await api.put(`/categorias-egresos/${id}`, categoria);
    return response.data.data;
  },

  // Eliminar categoría
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/categorias-egresos/${id}`);
    return response.data;
  },

  // Obtener categorías populares
  async getPopulares(limite = 5): Promise<CategoriaEgreso[]> {
    const response = await api.get('/categorias-egresos/reportes/populares', {
      params: { limite }
    });
    return response.data.data;
  },

  // Obtener categorías con mayor gasto
  async getMayorGasto(fechaInicio?: string, fechaFin?: string, limite = 10): Promise<CategoriaEgreso[]> {
    const response = await api.get('/categorias-egresos/reportes/mayor-gasto', {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin, limite }
    });
    return response.data.data;
  },

  // Obtener estadísticas de categoría
  async getEstadisticas(id: number, fechaInicio: string, fechaFin: string): Promise<any> {
    const response = await api.get(`/categorias-egresos/${id}/estadisticas`, {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
    });
    return response.data.data;
  }
};

// =====================================================
// API DE EGRESOS
// =====================================================

export const egresosApi = {
  // Obtener todos los egresos
  async getAll(filtros: FiltrosEgresos = {}): Promise<{ data: Egreso[]; pagination: any }> {
    const response = await api.get('/egresos', { params: filtros });
    return {
      data: response.data.data,
      pagination: response.data.pagination
    };
  },

  // Obtener egreso por ID
  async getById(id: number): Promise<Egreso> {
    const response = await api.get(`/egresos/${id}`);
    return response.data.data;
  },

  // Crear nuevo egreso
  async create(egreso: Partial<Egreso>): Promise<Egreso> {
    const response = await api.post('/egresos', egreso);
    return response.data.data;
  },

  // Actualizar egreso
  async update(id: number, egreso: Partial<Egreso>): Promise<Egreso> {
    const response = await api.put(`/egresos/${id}`, egreso);
    return response.data.data;
  },

  // Eliminar (cancelar) egreso
  async delete(id: number): Promise<Egreso> {
    const response = await api.delete(`/egresos/${id}`);
    return response.data.data;
  },

  // Aprobar egreso
  async aprobar(id: number, comentario?: string): Promise<Egreso> {
    const response = await api.post(`/egresos/${id}/aprobar`, { comentario });
    return response.data.data;
  },

  // Rechazar egreso
  async rechazar(id: number, comentario: string): Promise<Egreso> {
    const response = await api.post(`/egresos/${id}/rechazar`, { comentario });
    return response.data.data;
  },

  // Marcar como pagado
  async marcarPagado(id: number, comentario?: string): Promise<Egreso> {
    const response = await api.post(`/egresos/${id}/pagar`, { comentario });
    return response.data.data;
  },

  // Obtener egresos pendientes de aprobación
  async getPendientesAprobacion(): Promise<Egreso[]> {
    const response = await api.get('/egresos/pendientes-aprobacion');
    return response.data.data;
  },

  // Obtener resumen por categoría
  async getResumenPorCategoria(fechaInicio?: string, fechaFin?: string): Promise<ResumenCategoria[]> {
    const response = await api.get('/egresos/reportes/por-categoria', {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
    });
    return response.data.data;
  },

  // Obtener total por período
  async getTotalPorPeriodo(fechaInicio: string, fechaFin: string, estado?: string): Promise<any> {
    const response = await api.get('/egresos/reportes/por-periodo', {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin, estado }
    });
    return response.data.data;
  },

  // Obtener flujo de aprobaciones
  async getFlujoAprobaciones(id: number): Promise<FlujoAprobacion[]> {
    const response = await api.get(`/egresos/${id}/flujo-aprobaciones`);
    return response.data.data;
  }
};

// =====================================================
// API DE PRESUPUESTOS
// =====================================================

export const presupuestosApi = {
  // Obtener todos los presupuestos
  async getAll(filtros: any = {}): Promise<PresupuestoEgreso[]> {
    const response = await api.get('/presupuestos-egresos', { params: filtros });
    return response.data.data;
  },

  // Obtener presupuesto por ID
  async getById(id: number): Promise<PresupuestoEgreso> {
    const response = await api.get(`/presupuestos-egresos/${id}`);
    return response.data.data;
  },

  // Crear nuevo presupuesto
  async create(presupuesto: Partial<PresupuestoEgreso>): Promise<PresupuestoEgreso> {
    const response = await api.post('/presupuestos-egresos', presupuesto);
    return response.data.data;
  },

  // Actualizar presupuesto
  async update(id: number, presupuesto: Partial<PresupuestoEgreso>): Promise<PresupuestoEgreso> {
    const response = await api.put(`/presupuestos-egresos/${id}`, presupuesto);
    return response.data.data;
  },

  // Eliminar presupuesto
  async delete(id: number): Promise<PresupuestoEgreso> {
    const response = await api.delete(`/presupuestos-egresos/${id}`);
    return response.data.data;
  },

  // Obtener presupuestos por período
  async getPorPeriodo(anio: number, mes?: number): Promise<PresupuestoEgreso[]> {
    const response = await api.get('/presupuestos-egresos/reportes/por-periodo', {
      params: { anio, mes }
    });
    return response.data.data;
  },

  // Obtener resumen anual
  async getResumenAnual(anio: number): Promise<any> {
    const response = await api.get('/presupuestos-egresos/reportes/resumen-anual', {
      params: { anio }
    });
    return response.data.data;
  },

  // Obtener presupuestos excedidos
  async getExcedidos(anio?: number, mes?: number): Promise<PresupuestoEgreso[]> {
    const response = await api.get('/presupuestos-egresos/reportes/excedidos', {
      params: { anio, mes }
    });
    return response.data.data;
  },

  // Obtener presupuestos en alerta
  async getEnAlerta(umbral = 90, anio?: number, mes?: number): Promise<PresupuestoEgreso[]> {
    const response = await api.get('/presupuestos-egresos/reportes/en-alerta', {
      params: { umbral, anio, mes }
    });
    return response.data.data;
  },

  // Actualizar montos gastados
  async actualizarMontosGastados(anio?: number, mes?: number): Promise<{ presupuestos_actualizados: number }> {
    const response = await api.post('/presupuestos-egresos/operaciones/actualizar-montos-gastados', {
      anio, mes
    });
    return response.data.data;
  },

  // Copiar presupuestos
  async copiar(anioOrigen: number, mesOrigen: number, anioDestino: number, mesDestino: number): Promise<any> {
    const response = await api.post('/presupuestos-egresos/operaciones/copiar', {
      anio_origen: anioOrigen,
      mes_origen: mesOrigen,
      anio_destino: anioDestino,
      mes_destino: mesDestino
    });
    return response.data.data;
  },

  // Obtener evolución por categoría
  async getEvolucionPorCategoria(idCategoria: number, anio: number, mesesAtras = 12): Promise<any> {
    const response = await api.get(`/presupuestos-egresos/reportes/evolucion/${idCategoria}`, {
      params: { anio, meses_atras: mesesAtras }
    });
    return response.data.data;
  }
};

// =====================================================
// UTILIDADES
// =====================================================

export const egresosUtils = {
  // Formatear moneda
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(amount);
  },

  // Formatear fecha
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-BO');
  },

  // Obtener color de estado
  getEstadoColor: (estado: string): string => {
    const colores = {
      pendiente: '#F59E0B',
      aprobado: '#10B981',
      pagado: '#059669',
      cancelado: '#6B7280',
      rechazado: '#EF4444'
    };
    return colores[estado as keyof typeof colores] || '#6B7280';
  },

  // Obtener color de presupuesto
  getPresupuestoColor: (estadoPresupuesto: string): string => {
    const colores = {
      normal: '#10B981',
      precaucion: '#F59E0B',
      alerta: '#F97316',
      excedido: '#EF4444'
    };
    return colores[estadoPresupuesto as keyof typeof colores] || '#6B7280';
  },

  // Validar permisos
  canApprove: (userRole: string): boolean => {
    return ['admin', 'gerente'].includes(userRole);
  },

  canPay: (userRole: string): boolean => {
    return ['admin', 'gerente', 'cajero'].includes(userRole);
  },

  canEdit: (userRole: string): boolean => {
    return ['admin', 'gerente', 'cajero'].includes(userRole);
  }
};
