import { api } from './api';

export interface ModificadorGrupo {
  id_grupo_modificador: number;
  grupo_nombre: string;
  grupo_descripcion?: string;
  grupo_tipo: 'seleccion_unica' | 'seleccion_multiple' | 'cantidad_variable';
  min_selecciones: number;
  max_selecciones: number | null;
  es_obligatorio: boolean;
  orden_display: number;
  modificadores: any[];
}

export interface Modificador {
  id_modificador: number;
  nombre_modificador: string;
  descripcion?: string;
  precio_extra: number;
  precio_final: number;
  tipo_modificador: string;
  stock_disponible?: number;
  controlar_stock: boolean;
  imagen_url?: string;
  calorias?: number;
  es_vegetariano?: boolean;
  es_vegano?: boolean;
  contiene_gluten?: boolean;
  alergenos?: string[];
  estado_stock: 'disponible' | 'stock_bajo' | 'sin_stock';
}

/**
 * Obtener grupos de modificadores de un producto
 */
export const obtenerGruposDeProducto = async (idProducto: number): Promise<ModificadorGrupo[]> => {
  try {
    const response = await api.get(`/modificadores/producto/${idProducto}/grupos`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error al obtener grupos de modificadores:', error);
    return [];
  }
};

/**
 * Obtener modificadores completos de un producto
 */
export const obtenerModificadoresCompletos = async (idProducto: number): Promise<Modificador[]> => {
  try {
    const response = await api.get(`/modificadores/producto/${idProducto}/completos`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error al obtener modificadores completos:', error);
    return [];
  }
};

/**
 * Validar selección de modificadores (Legacy - compatible con código antiguo)
 */
export const getModificadoresPorProducto = async (idProducto: number): Promise<any[]> => {
  try {
    const response = await api.get(`/modificadores/producto/${idProducto}`);
    return response.data.modificadores || [];
  } catch (error) {
    console.error('Error al obtener modificadores:', error);
    return [];
  }
};

/**
 * Validar selección de modificadores
 */
export const validarSeleccion = async (
  idProducto: number, 
  modificadoresSeleccionados: number[]
): Promise<{ es_valido: boolean; mensaje_error?: string }> => {
  try {
    const response = await api.post('/modificadores/validar', {
      id_producto: idProducto,
      modificadores: modificadoresSeleccionados
    });
    
    return {
      es_valido: response.data.success,
      mensaje_error: response.data.message
    };
  } catch (error: any) {
    return {
      es_valido: false,
      mensaje_error: error.response?.data?.message || 'Error de validación'
    };
  }
};

/**
 * Verificar stock de modificadores
 */
export const verificarStock = async (
  modificadores: Array<{ id_modificador: number; cantidad: number }>
): Promise<{ disponible: boolean; mensaje?: string }> => {
  try {
    const response = await api.post('/modificadores/verificar-stock', {
      modificadores
    });
    
    return {
      disponible: response.data.success,
      mensaje: response.data.message
    };
  } catch (error: any) {
    return {
      disponible: false,
      mensaje: error.response?.data?.message || 'Error al verificar stock'
    };
  }
};

/**
 * Crear modificador completo
 */
export const crearModificador = async (modificadorData: any) => {
  try {
    const response = await api.post('/modificadores/completo', modificadorData);
    return response.data;
  } catch (error) {
    console.error('Error al crear modificador:', error);
    throw error;
  }
};

/**
 * Actualizar modificador
 */
export const actualizarModificador = async (idModificador: number, modificadorData: any) => {
  try {
    const response = await api.put(`/modificadores/${idModificador}`, modificadorData);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar modificador:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas de modificadores
 */
export const obtenerEstadisticas = async (fechaInicio?: string, fechaFin?: string) => {
  try {
    const params: any = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    
    const response = await api.get('/modificadores/estadisticas', { params });
    return response.data.data || [];
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return [];
  }
};

/**
 * Obtener modificadores populares
 */
export const obtenerModificadoresPopulares = async (limite: number = 10) => {
  try {
    const response = await api.get('/modificadores/populares', {
      params: { limite }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error al obtener modificadores populares:', error);
    return [];
  }
};

/**
 * Obtener modificadores con stock bajo
 */
export const obtenerModificadoresStockBajo = async (umbral: number = 5) => {
  try {
    const response = await api.get('/modificadores/stock-bajo', {
      params: { umbral }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error al obtener modificadores con stock bajo:', error);
    return [];
  }
};

// ===== GESTIÓN DE GRUPOS =====

/**
 * Obtener todos los grupos de modificadores
 */
export const obtenerGrupos = async () => {
  try {
    const response = await api.get('/modificadores/grupos');
    return response.data.data || [];
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    return [];
  }
};

/**
 * Crear grupo de modificadores
 */
export const crearGrupo = async (grupoData: any) => {
  try {
    const response = await api.post('/modificadores/grupos', grupoData);
    return response.data;
  } catch (error) {
    console.error('Error al crear grupo:', error);
    throw error;
  }
};

/**
 * Actualizar grupo
 */
export const actualizarGrupo = async (idGrupo: number, grupoData: any) => {
  try {
    const response = await api.put(`/modificadores/grupos/${idGrupo}`, grupoData);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar grupo:', error);
    throw error;
  }
};

/**
 * Asociar grupo a producto
 */
export const asociarGrupoAProducto = async (
  idGrupo: number, 
  idProducto: number,
  ordenDisplay: number = 0,
  esObligatorio: boolean = false
) => {
  try {
    const response = await api.post(
      `/modificadores/grupos/${idGrupo}/productos/${idProducto}`,
      { orden_display: ordenDisplay, es_obligatorio: esObligatorio }
    );
    return response.data;
  } catch (error) {
    console.error('Error al asociar grupo a producto:', error);
    throw error;
  }
};

