// =====================================================
// TIPOS E INTERFACES PARA SISTEMA DE PENSIONADOS
// =====================================================

/**
 * Tipo de cliente pensionado
 */
export type TipoCliente = 'individual' | 'corporativo' | 'evento';

/**
 * Tipo de período de pensión
 */
export type TipoPeriodo = 'semanas' | 'meses' | 'años';

/**
 * Estado del pensionado
 */
export type EstadoPensionado = 'activo' | 'pausado' | 'finalizado' | 'cancelado';

/**
 * Tipo de comida
 */
export type TipoComida = 'desayuno' | 'almuerzo' | 'cena';

/**
 * Estado de prefactura
 */
export type EstadoPrefactura = 'pendiente' | 'generada' | 'enviada' | 'pagada';

/**
 * Interface principal de Pensionado
 */
export interface Pensionado {
  id_pensionado: number;
  id_restaurante: number;
  id_sucursal?: number;
  
  // Información del cliente
  nombre_cliente: string;
  tipo_cliente: TipoCliente;
  documento_identidad?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  
  // Información del contrato
  fecha_inicio: string; // ISO date
  fecha_fin: string; // ISO date
  tipo_periodo: TipoPeriodo;
  cantidad_periodos: number;
  
  // Configuración del servicio
  incluye_almuerzo: boolean;
  incluye_cena: boolean;
  incluye_desayuno: boolean;
  max_platos_dia: number;
  
  // Información financiera
  monto_acumulado: number;
  descuento_aplicado: number;
  total_consumido: number;
  saldo_pendiente: number;
  
  // Estado y control
  estado: EstadoPensionado;
  fecha_ultimo_consumo?: string;
  dias_consumo: number;
  
  // Auditoría
  created_at: string;
  updated_at: string;
  created_by?: number;
}

/**
 * Datos para crear un pensionado
 */
export interface CrearPensionadoData {
  id_sucursal?: number;
  nombre_cliente: string;
  tipo_cliente: TipoCliente;
  documento_identidad?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_periodo: TipoPeriodo;
  cantidad_periodos: number;
  incluye_almuerzo?: boolean;
  incluye_cena?: boolean;
  incluye_desayuno?: boolean;
  max_platos_dia?: number;
  descuento_aplicado?: number;
}

/**
 * Datos para actualizar un pensionado
 */
export interface ActualizarPensionadoData extends Partial<CrearPensionadoData> {
  estado?: EstadoPensionado;
}

/**
 * Producto consumido en formato JSON
 */
export interface ProductoConsumido {
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  modificadores?: {
    id_modificador: number;
    nombre_modificador: string;
    precio_extra: number;
  }[];
}

/**
 * Consumo de pensionado
 */
export interface ConsumoPensionado {
  id_consumo: number;
  id_pensionado: number;
  id_restaurante: number;
  fecha_consumo: string;
  id_mesa?: number;
  id_venta?: number;
  tipo_comida: TipoComida;
  productos_consumidos: ProductoConsumido[];
  total_consumido: number;
  observaciones?: string;
  mesero_asignado?: number;
  created_at: string;
}

/**
 * Datos para registrar consumo
 */
export interface RegistrarConsumoData {
  id_pensionado: number;
  fecha_consumo: string;
  id_mesa?: number;
  id_venta?: number;
  tipo_comida: TipoComida;
  productos_consumidos: ProductoConsumido[];
  total_consumido: number;
  observaciones?: string;
}

/**
 * Prefactura de pensionado
 */
export interface PrefacturaPensionado {
  id_prefactura_pensionado: number;
  id_pensionado: number;
  id_restaurante: number;
  fecha_inicio_periodo: string;
  fecha_fin_periodo: string;
  total_dias: number;
  total_consumo: number;
  descuentos_aplicados: number;
  total_final: number;
  estado: EstadoPrefactura;
  fecha_generacion?: string;
  fecha_envio?: string;
  fecha_pago?: string;
  productos_detallados: ProductoConsumido[];
  observaciones?: string;
  numero_factura?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Datos para generar prefactura
 */
export interface GenerarPrefacturaData {
  fecha_inicio_periodo: string;
  fecha_fin_periodo: string;
  observaciones?: string;
}

/**
 * Estadísticas de un pensionado
 */
export interface EstadisticasPensionado {
  id_pensionado: number;
  nombre_cliente: string;
  dias_activos: number;
  dias_consumidos: number;
  dias_restantes: number;
  porcentaje_uso: number;
  total_consumido: number;
  promedio_consumo_dia: number;
  consumos_por_tipo: {
    desayuno: number;
    almuerzo: number;
    cena: number;
  };
  productos_mas_consumidos: {
    id_producto: number;
    nombre_producto: string;
    cantidad_total: number;
    monto_total: number;
  }[];
}

/**
 * Estadísticas generales del sistema
 */
export interface EstadisticasGenerales {
  total_pensionados: number;
  pensionados_activos: number;
  pensionados_finalizados: number;
  total_consumo_mes_actual: number;
  total_prefacturas_pendientes: number;
  ingreso_proyectado: number;
  promedio_consumo_pensionado: number;
}

/**
 * Verificación de consumo
 */
export interface VerificacionConsumo {
  puede_consumir: boolean;
  motivo?: string;
  consumos_hoy: number;
  limite_dia: number;
  consumos_restantes: number;
}

/**
 * Filtros para búsqueda de pensionados
 */
export interface FiltrosPensionados {
  estado?: EstadoPensionado;
  tipo_cliente?: TipoCliente;
  fecha_desde?: string;
  fecha_hasta?: string;
  id_sucursal?: number;
}

/**
 * Filtros para búsqueda de consumos
 */
export interface FiltrosConsumos {
  fecha_desde?: string;
  fecha_hasta?: string;
  tipo_comida?: TipoComida;
}

/**
 * Filtros para búsqueda de prefacturas
 */
export interface FiltrosPrefacturas {
  estado?: EstadoPrefactura;
  fecha_desde?: string;
  fecha_hasta?: string;
}

/**
 * Respuesta de la API
 */
export interface PensionadoApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

