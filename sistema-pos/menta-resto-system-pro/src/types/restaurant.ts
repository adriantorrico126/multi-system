export interface Product {
  id: string; // Mapped from id_producto
  name: string; // Mapped from nombre
  price: number; // Mapped from precio
  category: string; // Mapped from id_categoria (nombre de la categoria)
  id_categoria: number; // Backend category ID
  stock_actual: number; // Mapped from stock_actual
  available: boolean; // Mapped from activo
  imagen_url?: string; // Mapped from imagen_url
}

export interface Category {
  id_categoria: number;
  nombre: string;
}

export interface CartItem extends Product {
  quantity: number;
  notes?: string;
  originalId?: string; // ID original del producto (para cuando el item del carrito tiene un ID único)
  modificadores?: any[]; // Modificadores seleccionados para este ítem
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  timestamp: Date;
  cashier: string;
  branch: string;
  mesa_numero?: number;
  tipo_servicio?: 'Mesa' | 'Delivery' | 'Para Llevar';
  invoiceData?: InvoiceData;
}

export interface InvoiceData {
  nit: string;
  businessName: string;
  customerName?: string;
}

export interface User {
  id: string;
  username: string;
  rol: 'cajero' | 'admin' | 'cocinero' | 'mesero' | 'super_admin';
  nombre: string;
  sucursal?: {
    id: number;
    nombre: string;
    ciudad: string;
    direccion: string;
  };
  id_restaurante?: number;
  id_vendedor?: number;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
}

// ===================================
// 🔹 TIPOS PARA GESTIÓN DE MESAS
// ===================================

export interface Mesa {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: 'libre' | 'en_uso' | 'pendiente_cobro' | 'reservada' | 'mantenimiento' | 'agrupada';
  total_acumulado: number;
  hora_apertura?: string;
  hora_cierre?: string;
  id_venta_actual?: number;
  total_venta_actual?: number;
  fecha_venta_actual?: string;
  estado_venta_actual?: string;
  // NUEVO: propiedades para gestión avanzada de mesas
  id_grupo_mesa?: number;
  id_mesero_actual?: number;
  id_restaurante?: number;
  id_sucursal?: number;
  // NUEVO: propiedades del grupo
  estado_grupo?: string;
  nombre_mesero_grupo?: string;
}

export interface Prefactura {
  id_prefactura: number;
  id_mesa: number;
  id_venta_principal?: number;
  total_acumulado: number;
  estado: 'abierta' | 'cerrada' | 'facturada';
  fecha_apertura: string;
  fecha_cierre?: string;
  observaciones?: string;
  numero_mesa: number;
  capacidad: number;
}

export interface HistorialMesa {
  id_venta: number;
  fecha: string;
  total: number;
  estado: string;
  tipo_servicio: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  observaciones?: string;
  nombre_producto: string;
  nombre_vendedor: string;
}

export interface EstadisticasMesas {
  total_mesas: number;
  mesas_libres: number;
  mesas_en_uso: number;
  mesas_pendientes: number;
  total_acumulado_general: number;
}

export interface MesaConDetalles extends Mesa {
  historial?: HistorialMesa[];
  prefactura?: Prefactura;
}
