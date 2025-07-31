export interface Promocion {
  id_promocion: number;
  nombre: string;
  tipo: 'porcentaje' | 'monto_fijo' | 'precio_fijo';
  valor: number;
  fecha_inicio: string;
  fecha_fin: string;
  id_producto: number;
  nombre_producto?: string;
  precio_original?: number;
  estado_promocion?: 'activa' | 'pendiente' | 'expirada';
}

export interface PromocionAplicada {
  id_promocion: number;
  nombre: string;
  tipo: 'porcentaje' | 'monto_fijo' | 'precio_fijo';
  valor: number;
  descuento_aplicado: number;
  precio_original: number;
  precio_final: number;
}

export interface CartItemWithPromocion {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  id_producto?: number;
  originalPrice?: number;
  appliedPromocion?: Promocion;
  modificadores?: any[];
} 