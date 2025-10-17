// =====================================================
// API SERVICE PARA SISTEMA DE PENSIONADOS
// =====================================================

import axios from 'axios';
import type {
  Pensionado,
  CrearPensionadoData,
  ActualizarPensionadoData,
  ConsumoPensionado,
  RegistrarConsumoData,
  PrefacturaPensionado,
  GenerarPrefacturaData,
  EstadisticasPensionado,
  EstadisticasGenerales,
  VerificacionConsumo,
  FiltrosPensionados,
  FiltrosConsumos,
  FiltrosPrefacturas,
  PensionadoApiResponse
} from '../types/pensionados';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1';

// =====================================================
// CONFIGURACIÓN DE AXIOS
// =====================================================

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para añadir token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken'); // Usar 'jwtToken' en lugar de 'token'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('jwtToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Construir query string desde objeto de filtros
 */
const buildQueryString = (params: Record<string, any>): string => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const query = queryParams.toString();
  return query ? `?${query}` : '';
};

// =====================================================
// GESTIÓN DE PENSIONADOS
// =====================================================

/**
 * Crear un nuevo pensionado
 */
export const crearPensionado = async (
  data: CrearPensionadoData
): Promise<PensionadoApiResponse<Pensionado>> => {
  try {
    const response = await api.post('/pensionados', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al crear pensionado');
  }
};

/**
 * Obtener todos los pensionados con filtros opcionales
 */
export const obtenerPensionados = async (
  filtros?: FiltrosPensionados
): Promise<PensionadoApiResponse<Pensionado[]>> => {
  try {
    const query = filtros ? buildQueryString(filtros) : '';
    const response = await api.get(`/pensionados${query}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener pensionados');
  }
};

/**
 * Obtener pensionados activos para una fecha específica
 */
export const obtenerPensionadosActivos = async (
  fecha?: string
): Promise<PensionadoApiResponse<Pensionado[]>> => {
  try {
    const query = fecha ? `?fecha=${fecha}` : '';
    const response = await api.get(`/pensionados/activos${query}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener pensionados activos');
  }
};

/**
 * Obtener un pensionado por ID
 */
export const obtenerPensionadoPorId = async (
  id: number
): Promise<PensionadoApiResponse<Pensionado>> => {
  try {
    const response = await api.get(`/pensionados/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener pensionado');
  }
};

/**
 * Actualizar un pensionado
 */
export const actualizarPensionado = async (
  id: number,
  data: ActualizarPensionadoData
): Promise<PensionadoApiResponse<Pensionado>> => {
  try {
    const response = await api.put(`/pensionados/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al actualizar pensionado');
  }
};

/**
 * Eliminar un pensionado (soft delete)
 */
export const eliminarPensionado = async (
  id: number
): Promise<PensionadoApiResponse<void>> => {
  try {
    const response = await api.delete(`/pensionados/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al eliminar pensionado');
  }
};

/**
 * Obtener estadísticas detalladas de un pensionado
 */
export const obtenerEstadisticasPensionado = async (
  id: number
): Promise<PensionadoApiResponse<EstadisticasPensionado>> => {
  try {
    const response = await api.get(`/pensionados/${id}/estadisticas`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener estadísticas');
  }
};

/**
 * Verificar si un pensionado puede consumir en una fecha específica
 */
export const verificarConsumo = async (
  id: number,
  fecha_consumo: string,
  tipo_comida: string
): Promise<PensionadoApiResponse<VerificacionConsumo>> => {
  try {
    const response = await api.post(`/pensionados/${id}/verificar-consumo`, {
      fecha_consumo,
      tipo_comida
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al verificar consumo');
  }
};

// =====================================================
// GESTIÓN DE CONSUMO
// =====================================================

/**
 * Registrar un consumo de pensionado
 */
export const registrarConsumo = async (
  data: RegistrarConsumoData
): Promise<PensionadoApiResponse<ConsumoPensionado>> => {
  try {
    const response = await api.post('/pensionados/consumo', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al registrar consumo');
  }
};

/**
 * Obtener consumos de un pensionado en un rango de fechas
 */
export const obtenerConsumos = async (
  id: number,
  filtros?: FiltrosConsumos
): Promise<PensionadoApiResponse<ConsumoPensionado[]>> => {
  try {
    const query = filtros ? buildQueryString(filtros) : '';
    const response = await api.get(`/pensionados/${id}/consumos${query}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener consumos');
  }
};

// =====================================================
// GESTIÓN DE PREFACTURAS
// =====================================================

/**
 * Generar prefactura consolidada para un pensionado
 */
export const generarPrefactura = async (
  id: number,
  data: GenerarPrefacturaData
): Promise<PensionadoApiResponse<PrefacturaPensionado>> => {
  try {
    const response = await api.post(`/pensionados/${id}/prefacturas`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al generar prefactura');
  }
};

/**
 * Obtener prefacturas de un pensionado
 */
export const obtenerPrefacturas = async (
  id: number,
  filtros?: FiltrosPrefacturas
): Promise<PensionadoApiResponse<PrefacturaPensionado[]>> => {
  try {
    const query = filtros ? buildQueryString(filtros) : '';
    const response = await api.get(`/pensionados/${id}/prefacturas${query}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener prefacturas');
  }
};

// =====================================================
// ESTADÍSTICAS GENERALES
// =====================================================

/**
 * Obtener estadísticas generales del sistema de pensionados
 */
export const obtenerEstadisticasGenerales = async (
  fecha_desde?: string,
  fecha_hasta?: string
): Promise<PensionadoApiResponse<EstadisticasGenerales>> => {
  try {
    const params: Record<string, string> = {};
    if (fecha_desde) params.fecha_desde = fecha_desde;
    if (fecha_hasta) params.fecha_hasta = fecha_hasta;
    
    const query = Object.keys(params).length > 0 ? buildQueryString(params) : '';
    const response = await api.get(`/pensionados/estadisticas${query}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener estadísticas generales');
  }
};

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Formatear fecha para mostrar
 */
export const formatearFecha = (fecha: string): string => {
  return new Date(fecha).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formatear moneda
 */
export const formatearMoneda = (monto: number): string => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB'
  }).format(monto);
};

/**
 * Calcular días restantes
 */
export const calcularDiasRestantes = (fecha_fin: string): number => {
  const hoy = new Date();
  const fin = new Date(fecha_fin);
  const diferencia = fin.getTime() - hoy.getTime();
  return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
};

/**
 * Obtener color de badge según estado
 */
export const obtenerColorEstado = (estado: string): string => {
  const colores: Record<string, string> = {
    activo: 'bg-green-500',
    pausado: 'bg-yellow-500',
    finalizado: 'bg-gray-500',
    cancelado: 'bg-red-500',
    pendiente: 'bg-blue-500',
    generada: 'bg-indigo-500',
    enviada: 'bg-purple-500',
    pagada: 'bg-green-500'
  };
  return colores[estado] || 'bg-gray-500';
};

/**
 * Obtener texto en español para tipo de cliente
 */
export const obtenerTextoTipoCliente = (tipo: string): string => {
  const textos: Record<string, string> = {
    individual: 'Individual',
    corporativo: 'Corporativo',
    evento: 'Evento'
  };
  return textos[tipo] || tipo;
};

/**
 * Obtener texto en español para tipo de período
 */
export const obtenerTextoTipoPeriodo = (tipo: string): string => {
  const textos: Record<string, string> = {
    semanas: 'Semanas',
    meses: 'Meses',
    años: 'Años'
  };
  return textos[tipo] || tipo;
};

