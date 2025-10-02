import axios from 'axios';

// Crear una instancia global de Axios
const api = axios.create({
  baseURL: (window as any).ENV_OVERRIDE?.VITE_BACKEND_URL || 
           import.meta.env.VITE_BACKEND_URL || 
           'http://localhost:3000/api/v1',
  timeout: 30000 // 30 segundos de timeout
});

// DEBUG: Log de configuración de Axios
console.log('🔍 [AXIOS DEBUG] baseURL configurada:', api.defaults.baseURL);
console.log('🔍 [AXIOS DEBUG] ENV_OVERRIDE:', (window as any).ENV_OVERRIDE);
console.log('🔍 [AXIOS DEBUG] import.meta.env.VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);

// Interceptor de request para agregar token JWT automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    console.log('🔍 [AXIOS REQUEST] Token en localStorage:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔍 [AXIOS REQUEST] Token agregado a la petición:', config.url);
    } else {
      console.log('🔍 [AXIOS REQUEST] No hay token disponible para:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('🔍 [AXIOS REQUEST] Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor global para manejar expiración de JWT y errores de conexión
api.interceptors.response.use(
  response => {
    console.log('🔍 [API Interceptor] Respuesta exitosa:', response.config.url, response.status);
    return response;
  },
  async error => {
    console.log('🔍 [API Interceptor] Error detectado:', error);
    const status = error?.response?.status;
    const message = error?.response?.data?.message?.toLowerCase?.() || '';
    const code = error?.response?.data?.code;
    const errorCode = error?.code;
    const errorMessage = error?.message || '';

    // Detectar errores de conexión SSL/Red
    const isNetworkError = errorCode === 'ERR_NETWORK' || 
                          errorCode === 'ERR_CERT_AUTHORITY_INVALID' ||
                          errorMessage.includes('Network Error') ||
                          errorMessage.includes('ERR_CERT_AUTHORITY_INVALID');

    if (isNetworkError) {
      console.log('🔍 [API Interceptor] Error de conexión detectado:', errorCode);
      
      // Crear un error más específico para errores de conexión
      const connectionError = new Error(errorMessage);
      connectionError.name = 'ConnectionError';
      
      // Añadir información adicional sobre el tipo de error
      if (errorCode === 'ERR_CERT_AUTHORITY_INVALID') {
        connectionError.name = 'SSLError';
      }
      
      return Promise.reject(connectionError);
    }

    // Manejar tokens expirados o inválidos
    // IMPORTANTE: Solo actuar si HAY un token almacenado (sesión existente)
    const hasStoredToken = !!localStorage.getItem('jwtToken');
    const isAuthFailure = status === 401 && hasStoredToken && (
      message.includes('jwt expired') ||
      message.includes('token expirado') ||
      message.includes('invalid token') ||
      message.includes('token invalid') ||
      code === 'TOKEN_EXPIRED' ||
      code === 'TOKEN_INVALID' ||
      code === 'TOKEN_ERROR'
    );

    // Para 401 sin token almacenado (usuario no logueado), no hacer nada
    if (status === 401 && !hasStoredToken) {
      console.log('🔍 [API Interceptor] 401 sin token almacenado - usuario no logueado, pasando el error');
      return Promise.reject(error);
    }

    if (isAuthFailure) {
      console.log('🔍 [API Interceptor] Token inválido/expirado. Intentando renovar...');
      
      // Intentar renovar el token automáticamente
      try {
        const { token, data } = await refreshAuthToken();
        
        // Si la renovación fue exitosa, reintentar la petición original
        if (token && data) {
          console.log('🔍 [API Interceptor] Token renovado. Reintentando petición original...');
          
          // Actualizar el token en la petición original
          const originalRequest = error.config;
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          
          // Reintentar la petición
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.log('🔍 [API Interceptor] Falló la renovación del token. Cerrando sesión...');
      }
      
      // Si la renovación falló, limpiar sesión SOLO si había sesión activa
      console.log('🔍 [API Interceptor] Limpiando sesión expirada...');
      
      // Importar y usar la función de limpieza de caché
      import('../utils/cacheCleanup').then(({ clearAuthCache, softCacheCleanup }) => {
        // Registrar el error para activar limpieza suave en el próximo login
        localStorage.setItem('lastApiError', new Date().toISOString());
        clearAuthCache();
      });
      
      // Solo redirigir si no estamos ya en la página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=1';
      }
      
      return Promise.reject(new Error('Sesión expirada. Por favor, inicia sesión nuevamente.'));
    }

    // Manejar errores 403 específicos de caja para meseros
    if (status === 403 && message.includes('cajero o administrador debe aperturar caja')) {
      console.log('🔍 [API Interceptor] Error 403 de caja para mesero - mensaje personalizado');
      // Crear un error más amigable para el usuario
      const userFriendlyError = new Error('Un cajero o administrador debe aperturar caja antes de que puedas registrar ventas.');
      userFriendlyError.name = 'CajaNoAbiertaError';
      return Promise.reject(userFriendlyError);
    }

    // Para otros errores 403 u otros errores, no cerrar sesión automáticamente
    return Promise.reject(error);
  }
);

// Función para verificar si el token está próximo a expirar
const isTokenExpiringSoon = () => {
  try {
    const token = localStorage.getItem('jwtToken');
    if (!token) return true;

    // Decodificar el token para ver la fecha de expiración
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convertir a milisegundos
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;
    
    // Renovar si expira en menos de 1 hora (3600000 ms)
    return timeUntilExpiration < 3600000;
  } catch (error) {
    console.error('Error verificando expiración del token:', error);
    return true;
  }
};

// Función para renovar token periódicamente
const startTokenRefreshTimer = () => {
  // Verificar cada 30 minutos
  setInterval(async () => {
    if (isTokenExpiringSoon()) {
      try {
        console.log('🔍 [API] Renovando token periódicamente...');
        await refreshAuthToken();
      } catch (error) {
        console.error('🔍 [API] Error en renovación periódica:', error);
      }
    }
  }, 30 * 60 * 1000); // 30 minutos
};

// Iniciar el timer de renovación cuando se establece un token
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('jwtToken', token); // Almacenar en localStorage
    
    // Iniciar timer de renovación
    startTokenRefreshTimer();
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('jwtToken'); // Eliminar de localStorage
  }
};

// Al iniciar la aplicación, verificar si hay un token en localStorage
const token = localStorage.getItem('jwtToken');
if (token) {
  setAuthToken(token);
}

// Función para obtener la sucursal actual del usuario
const getCurrentSucursalId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.sucursal?.id || user.id_sucursal || null;
  } catch (error) {
    console.error('Error getting current sucursal ID:', error);
    return null;
  }
};

// Función para obtener la sucursal seleccionada (para admin/gerente)
const getSelectedSucursalId = () => {
  try {
    const selectedSucursal = localStorage.getItem('selectedSucursalId');
    if (selectedSucursal) {
      return parseInt(selectedSucursal);
    }
    return getCurrentSucursalId();
  } catch (error) {
    console.error('Error getting selected sucursal ID:', error);
    return null;
  }
};

// Función para obtener el ID de sucursal apropiado
const getRestauranteId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    // Temporalmente devolver 1 si no existe
    return user.id_restaurante || 1;
  } catch (error) {
    console.error('Error getting restaurante ID:', error);
    return 1; // Fallback temporal
  }
};

const getSucursalId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userRole = user.rol || user.role;
    
    // Si es admin o gerente, usar la sucursal seleccionada
    if (userRole === 'admin' || userRole === 'gerente') {
      const selectedSucursalId = getSelectedSucursalId();
      return selectedSucursalId || null;
    }
    
    // Para otros roles, usar la sucursal del usuario
    const currentSucursalId = getCurrentSucursalId();
    return currentSucursalId || null;
  } catch (error) {
    console.error('Error getting sucursal ID:', error);
    return null;
  }
};

export const getCategories = async () => {
  try {
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/categorias`);
    return response.data.data.map((category: any) => ({
      id_categoria: category.id_categoria,
      nombre: category.nombre,
      activo: category.activo,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const getAllCategories = async () => {
  try {
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/categorias?includeInactive=true`);
    return response.data.data.map((category: any) => ({
      id_categoria: category.id_categoria,
      nombre: category.nombre,
      activo: category.activo,
    }));
  } catch (error) {
    console.error('Error fetching all categories:', error);
    throw error;
  }
};

export const createCategory = async (categoryData: { nombre: string }) => {
  try {
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/categorias`, categoryData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const deleteCategory = async (categoryId: number) => {
  try {
    const response = await api.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/categorias/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

export const updateCategory = async (categoryId: number, categoryData: { nombre?: string; activo?: boolean }) => {
  try {
    const response = await api.put(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/categorias/${categoryId}`, categoryData);
    return response.data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const getBranches = async () => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/sucursales?id_restaurante=${restauranteId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching branches:', error);
    throw error;
  }
};

// Gestión de sucursales
export const createSucursal = async (sucursalData: {
  nombre: string;
  ciudad: string;
  direccion?: string;
}) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/sucursales`, { ...sucursalData, id_restaurante: restauranteId });
    return response.data.data;
  } catch (error) {
    console.error('Error creating sucursal:', error);
    throw error;
  }
};

export const updateSucursal = async (id_sucursal: number, sucursalData: {
  nombre: string;
  ciudad: string;
  direccion?: string;
  activo?: boolean;
}) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.put(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/sucursales/${id_sucursal}`, { ...sucursalData, id_restaurante: restauranteId });
    return response.data.data;
  } catch (error) {
    console.error('Error updating sucursal:', error);
    throw error;
  }
};

export const deleteSucursal = async (id_sucursal: number) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/sucursales/${id_sucursal}`);
    return response.data.data;
  } catch (error) {
    console.error('Error deleting sucursal:', error);
    throw error;
  }
};

// Autenticación
export const login = async (username: string, password: string) => {
  try {
    console.log('API: Login attempt for username:', username);
    
    // Limpiar cualquier configuración anterior DESHABILITADO para preservar login
    // localStorage.removeItem('VITE_BACKEND_URL');
    // localStorage.removeItem('VITE_POS_API_URL');
    // sessionStorage.clear();
    
    // Usar configuración forzada si está disponible
    const backendUrl = (window as any).ENV_OVERRIDE?.VITE_BACKEND_URL || 
                      import.meta.env.VITE_BACKEND_URL || 
                      'http://localhost:3000/api/v1';
    
    console.log('🔍 DEBUG - Backend URL:', backendUrl);
    console.log('🔍 DEBUG - Login URL:', `${backendUrl}/auth/login`);
    console.log('🔍 DEBUG - ENV_OVERRIDE:', (window as any).ENV_OVERRIDE);
    
    const response = await api.post('/auth/login', {
      username: username, // Ahora el backend acepta 'username'
      password
    });
    console.log('API: Login response:', response.data);
    const { token, data: userData } = response.data; // Obtener token y datos de usuario
    console.log('API: userData:', userData);
    setAuthToken(token); // Establecer el token en Axios y localStorage
    return { token, user: userData }; // Devolver tanto token como datos del usuario
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
};

// Gestión de usuarios (solo admin)
export const getUsers = async () => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/auth/users?id_restaurante=${restauranteId}`);
    // Mapear id_vendedor a id para compatibilidad con el frontend
    return response.data.data.map((user: any) => ({ ...user, id: user.id_vendedor }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export async function deleteUser(userId: string) {
  const restauranteId = getRestauranteId();
  if (!restauranteId) throw new Error('Restaurante ID not found.');
  const response = await api.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/users/${userId}?id_restaurante=${restauranteId}`);
  return response.data;
}

// Obtener estadísticas del dashboard
export const getDashboardStats = async () => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/dashboard/stats?id_restaurante=${restauranteId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const createUser = async (userData: {
  nombre: string;
  username: string;
  email?: string;
  password: string;
  rol: string;
  id_sucursal: number;
}) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/users`, { ...userData, id_restaurante: restauranteId });
    return response.data.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, userData: {
  nombre: string;
  username: string;
  email?: string;
  password?: string;
  rol: string;
  id_sucursal?: number;
  activo: boolean;
}) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    // Crear una copia de userData sin id_sucursal si es null
    const dataToSend = { ...userData, id_restaurante: restauranteId };
    if (dataToSend.id_sucursal === null || dataToSend.id_sucursal === undefined) {
      delete dataToSend.id_sucursal;
    }
    
    console.log('🔍 [updateUser] Datos a enviar:', dataToSend);
    console.log('🔍 [updateUser] URL:', `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/users/${userId}`);
    
    const response = await api.put(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/users/${userId}`, dataToSend);
    console.log('✅ [updateUser] Respuesta exitosa:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ [updateUser] Error completo:', error);
    console.error('❌ [updateUser] Error response:', error.response?.data);
    console.error('❌ [updateUser] Error status:', error.response?.status);
    throw error;
  }
};

// Productos
export const getProducts = async (options: { aplicarDescuentos?: boolean; id_sucursal?: number } = {}) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    const { aplicarDescuentos = true, id_sucursal } = options;
    
    const params = new URLSearchParams();
    params.append('id_restaurante', restauranteId.toString());
    if (aplicarDescuentos) {
      params.append('aplicarDescuentos', 'true');
    }
    if (id_sucursal) {
      params.append('id_sucursal', id_sucursal.toString());
    }
    
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/productos?${params.toString()}`);
    
    // Map backend product structure to frontend Product interface
    return response.data.data.map((product: any) => ({
      id: product.id_producto.toString(),
      name: product.nombre,
      price: parseFloat(product.precio_final || product.precio),
      price_original: parseFloat(product.precio_original || product.precio),
      discount_applied: product.descuento_aplicado || 0,
      promotion_applied: product.promocion_aplicada || null,
      category: product.categoria_nombre, // Backend provides categoria_nombre
      id_categoria: product.id_categoria,
      stock_actual: product.stock_actual,
      available: product.activo,
      imagen_url: product.imagen_url,
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getAllProducts = async () => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/productos?id_restaurante=${restauranteId}&includeInactive=true`);
    // Map backend product structure to frontend Product interface
    return response.data.data.map((product: any) => ({
      id: product.id_producto.toString(),
      name: product.nombre,
      price: parseFloat(product.precio),
      category: product.categoria_nombre, // Backend provides categoria_nombre
      id_categoria: product.id_categoria,
      stock_actual: product.stock_actual,
      available: product.activo,
      imagen_url: product.imagen_url,
    }));
  } catch (error) {
    console.error('Error fetching all products:', error);
    throw error;
  }
};

export const createProduct = async (productData: {
  nombre: string;
  precio: number;
  id_categoria: number;
  stock_actual: number;
  activo: boolean;
  imagen_url?: string;
}) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/productos`, { ...productData, id_restaurante: restauranteId });
    return response.data.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (productData: {
  id: string;
  nombre: string;
  precio: number;
  id_categoria: number;
  activo: boolean;
  imagen_url?: string;
}) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.put(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/productos/${productData.id}?id_restaurante=${restauranteId}`, { ...productData, id_restaurante: restauranteId });
    return response.data.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId: string) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/productos/${productId}?id_restaurante=${restauranteId}`);
    return response.data.data;
  }  catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Registrar una venta
export const createSale = async (sale: {
  items: Array<{ id: string; quantity: number; price: number; notes?: string, modificadores?: any[] }>;
  total: number;
  paymentMethod: string;
  cashier: string;
  id_sucursal: number;
  mesa_numero?: number;
  id_mesa?: number; // <-- Aseguramos que se pueda enviar id_mesa
  tipo_servicio?: 'Mesa' | 'Delivery' | 'Para Llevar';
  invoiceData?: {
    nit: string;
    businessName: string;
    customerName?: string;
  };
  // Nuevos campos para pago diferido
  tipo_pago?: 'anticipado' | 'diferido';
  observaciones_pago?: string;
}) => {
  const restauranteId = getRestauranteId();
  if (!restauranteId) throw new Error('Restaurante ID not found.');

  // Mapear los items al formato esperado por el backend
  const items = sale.items.map(item => ({
    id_producto: parseInt(item.id, 10),
    cantidad: item.quantity,
    precio_unitario: item.price,
    observaciones: item.notes || '',
    modificadores: item.modificadores || []
  }));
  
  const payload: any = {
    items,
    total: sale.total,
    paymentMethod: sale.paymentMethod,
    cashier: sale.cashier,
    id_sucursal: sale.id_sucursal,
    tipo_servicio: sale.tipo_servicio || 'Mesa',
    mesa_numero: sale.mesa_numero,
    invoiceData: sale.invoiceData,
    id_restaurante: restauranteId, // Añadir id_restaurante al payload
    // Nuevos campos para pago diferido
    tipo_pago: sale.tipo_pago || 'anticipado',
    observaciones_pago: sale.observaciones_pago || null
  };
  if (sale.id_mesa) payload.id_mesa = sale.id_mesa; // <-- Enviar id_mesa si está presente

  console.log('Frontend: Sending sale payload:', payload);

  try {
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas`, payload);
    return response.data;
  } catch (error) {
    console.error('Error creating sale:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    }
    throw error;
  }
};

// Editar venta
export const editSale = async (saleId: string, saleData: {
  items: Array<{ id: string; quantity: number; price: number; notes?: string }>;
  total: number;
  paymentMethod: string;
  notes?: string;
}) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    console.log('API: Editando venta:', saleId, saleData);
    const response = await api.put(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/${saleId}`, {
      ...saleData,
      id_restaurante: restauranteId
    });
    console.log('API: Venta editada:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error editando venta:', error);
    throw error;
  }
};

// Eliminar venta
export const deleteSale = async (saleId: string) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    console.log('API: Eliminando venta:', saleId);
    const response = await api.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/${saleId}?id_restaurante=${restauranteId}`);
    console.log('API: Venta eliminada:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error eliminando venta:', error);
    throw error;
  }
};

// Refrescar inventario después de una venta
export const refreshInventory = async () => {
  const userStr = localStorage.getItem('currentUser');
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    user = null;
  }
  if (!user || (user.rol !== 'admin' && user.rol !== 'super_admin')) {
    // No tiene permisos para consultar inventario
    return [];
  }
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/productos/inventario/resumen?id_restaurante=${restauranteId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error refreshing inventory:', error);
    throw error;
  }
};

// Obtener pedidos para la cocina
export const getKitchenOrders = async () => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/cocina?id_restaurante=${restauranteId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    throw error;
  }
};

// Configuración por restaurante (MVP)
export const getConfiguracion = async () => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/configuracion?id_restaurante=${restauranteId}`);
    return response.data.data || {};
  } catch (error) {
    console.error('Error fetching configuracion:', error);
    return {};
  }
};

// Enviar comanda al servidor de impresión
export const printComanda = async (pedido: any) => {
  try {
    const restauranteId = getRestauranteId();
    const printServerUrl = (import.meta.env.VITE_PRINT_SERVER_URL || 'http://localhost:3000');
    const res = await fetch(`${printServerUrl}/api/pedidos/imprimir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedido, restauranteId })
    });
    if (!res.ok) throw new Error('Servidor de impresión no disponible');
    return await res.json();
  } catch (e) {
    console.error('Error printing comanda:', e);
    throw e;
  }
};

// Guardar configuración por restaurante (MVP)
export const saveConfiguracion = async (configuracion: any) => {
  const restauranteId = getRestauranteId();
  const url = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/configuracion`;
  const res = await api.post(url, { id_restaurante: restauranteId, configuracion });
  return res.data;
};

// Actualizar el estado de un pedido
export const updateOrderStatus = async (saleId: string, status: string) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    // Asegurar que el status sea válido
    const validStatuses = ['recibido', 'en_preparacion', 'entregado', 'cancelado'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Estado inválido: ${status}. Estados válidos: ${validStatuses.join(', ')}`);
    }
    
    console.log('API: Updating order status:', { saleId, status, restauranteId });
    
    // Enviar el payload correcto al backend
    const payload = { estado: status };
    console.log('API: Sending payload:', payload);
    
    const response = await api.patch(
      `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/${saleId}/estado?id_restaurante=${restauranteId}`, 
      payload
    );
    
    console.log('API: Update response:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('API: Error updating order status:', error);
    if (error.response) {
      console.error('API: Error response:', error.response.data);
      console.error('API: Error status:', error.response.status);
      console.error('API: Error headers:', error.response.headers);
    }
    throw error;
  }
};

export const apiLogout = () => {
  // Limpiar token de autenticación
  setAuthToken(null);
  
  // Limpiar datos específicos del restaurante
  const keysToRemove = [
    'selectedSucursalId',
    'lastSelectedSucursal',
    'sucursalPreference',
    'restaurantPreferences',
    'userPreferences'
  ];
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`API Logout: Removing localStorage key: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  console.log('API Logout: All restaurant-specific data cleared');
};

// Función de prueba para verificar pedidos
export const testOrders = async () => {
  try {
    console.log('API: Testing orders endpoint');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/test/pedidos`);
    console.log('API: Test response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Error testing orders:', error);
    if (error.response) {
      console.error('API: Error response:', error.response.data);
    }
    throw error;
  }
};

// Función para ver todos los pedidos (incluyendo cancelados)
export const testAllOrders = async () => {
  try {
    console.log('API: Testing all orders endpoint');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/test/todos-pedidos`);
    console.log('API: All orders response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Error testing all orders:', error);
    if (error.response) {
      console.error('API: Error response:', error.response.data);
    }
    throw error;
  }
};

// Función para obtener estadísticas de pedidos
export const testOrderStats = async () => {
  try {
    console.log('API: Testing order stats endpoint');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/test/estadisticas-pedidos`);
    console.log('API: Order stats response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Error testing order stats:', error);
    if (error.response) {
      console.error('API: Error response:', error.response.data);
    }
    throw error;
  }
};

// Función de prueba para verificar conectividad básica
export const testConnection = async () => {
  try {
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/test`);
    return response.data;
  } catch (error) {
    console.error('Error testing connection:', error);
    throw error;
  }
};

// ===================================
// 🔹 SERVICIOS DE GESTIÓN DE MESAS
// ===================================

// Obtener todas las mesas de una sucursal
export const getMesas = async (id_sucursal: number) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/sucursal/${id_sucursal}?id_restaurante=${restauranteId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching mesas:', error);
    throw error;
  }
};

// Obtener una mesa específica
export const getMesa = async (numero: number, id_sucursal: number) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/${numero}/sucursal/${id_sucursal}?id_restaurante=${restauranteId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching mesa:', error);
    throw error;
  }
};

// Abrir mesa (iniciar servicio)
export const abrirMesa = async (numero: number, id_sucursal: number) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/abrir`, {
      numero,
      id_sucursal,
      id_restaurante: restauranteId
    });
    return response.data;
  } catch (error) {
    console.error('Error abriendo mesa:', error);
    throw error;
  }
};

// Cerrar mesa (finalizar servicio)
export const cerrarMesa = async (id_mesa: number) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/${id_mesa}/cerrar?id_restaurante=${restauranteId}`);
    return response.data;
  } catch (error) {
    console.error('Error al cerrar mesa:', error);
    throw error;
  }
};

export const liberarMesa = async (id_mesa: number) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    const url = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/${id_mesa}/liberar?id_restaurante=${restauranteId}`;
    console.log('=== DEBUG LIBERAR MESA API ===');
    console.log('URL completa:', url);
    console.log('id_mesa:', id_mesa);
    console.log('restauranteId:', restauranteId);
    console.log('Método: PATCH');
    console.log('=== FIN DEBUG API ===');
    
    const response = await api.patch(url);
    return response.data;
  } catch (error) {
    console.error('Error al liberar mesa:', error);
    throw error;
  }
};

// Agregar productos a mesa existente
export const agregarProductosAMesa = async (data: {
  id_mesa: number;
  items: Array<{ id_producto: number; cantidad: number; precio_unitario: number; observaciones?: string }>;
  total: number;
}) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/agregar-productos`, { ...data, id_restaurante: restauranteId });
    return response.data;
  } catch (error) {
    console.error('Error agregando productos a mesa:', error);
    throw error;
  }
};

// Generar prefactura de mesa
export const generarPrefactura = async (id_mesa: number) => {
  try {
    console.log('API: Generando prefactura para mesa:', id_mesa);
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/${id_mesa}/prefactura`);
    console.log('API: Prefactura generada:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error generando prefactura:', error);
    throw error;
  }
};

// Obtener estadísticas de mesas
export const getEstadisticasMesas = async (id_sucursal: number) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/sucursal/${id_sucursal}/estadisticas?id_restaurante=${restauranteId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo estadísticas de mesas:', error);
    throw error;
  }
};

// Obtener historial de mesa
export const getHistorialMesa = async (id_mesa: number, fecha?: string) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const params = fecha ? { fecha, id_restaurante: restauranteId } : { id_restaurante: restauranteId };
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/${id_mesa}/historial`, { params });
    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo historial de mesa:', error);
    throw error;
  }
};

// Cerrar mesa con facturación
export const cerrarMesaConFactura = async (data: {
  mesa_numero: number;
  id_sucursal: number;
  paymentMethod: string;
  invoiceData?: {
    nit: string;
    businessName: string;
    customerName?: string;
  };
}) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/cerrar-con-factura`, { ...data, id_restaurante: restauranteId });
    return response.data.data;
  } catch (error) {
    console.error('Error al cerrar mesa con factura:', error);
    throw error;
  }
};

// Marcar venta diferida como pagada con método de pago específico
export const marcarVentaDiferidaComoPagada = async (data: {
  id_venta: number;
  id_pago_final: number;
  observaciones?: string;
}) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    const response = await api.patch(
      `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/${data.id_venta}/marcar-pagada`,
      {
        id_pago_final: data.id_pago_final,
        observaciones: data.observaciones
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error al marcar venta diferida como pagada:', error);
    throw error;
  }
};

// Marcar mesa como pagada (nuevo flujo)
export const marcarMesaComoPagada = async (data: {
  id_mesa: number;
  metodo_pago?: string;
}) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/marcar-pagado`, data);
    return response.data;
  } catch (error) {
    console.error('Error al marcar mesa como pagada:', error);
    throw error;
  }
};

// Obtener métodos de pago disponibles
export const getMetodosPago = async () => {
  try {
    const response = await api.get(
      `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/metodos-pago`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo métodos de pago:', error);
    throw error;
  }
};

// ===================================
// 🔹 CONFIGURACIÓN DE MESAS
// ===================================

export const getConfiguracionMesas = async (id_sucursal: number) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/configuracion/sucursal/${id_sucursal}?id_restaurante=${restauranteId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener configuración de mesas:', error);
    throw error;
  }
};

export const crearMesa = async (data: {
  numero: number;
  id_sucursal: number;
  capacidad?: number;
  estado?: string;
}) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/configuracion`, { ...data, id_restaurante: restauranteId });
    return response.data; // Cambiar de response.data.data a response.data
  } catch (error) {
    console.error('Error al crear mesa:', error);
    throw error;
  }
};

export const actualizarMesa = async (id_mesa: number, data: {
  numero: number;
  capacidad: number;
  estado: string;
  id_sucursal: number;
}) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.put(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/configuracion/${id_mesa}?id_restaurante=${restauranteId}`, { ...data, id_restaurante: restauranteId });
    return response.data; // Cambiar de response.data.data a response.data
  } catch (error) {
    console.error('Error al actualizar mesa:', error);
    throw error;
  }
};

export const eliminarMesa = async (id_mesa: number) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/configuracion/${id_mesa}?id_restaurante=${restauranteId}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar mesa:', error);
    throw error;
  }
};

export const eliminarMesaForzada = async (id_mesa: number) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/configuracion/${id_mesa}/forzar?id_restaurante=${restauranteId}&forzar=true`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar mesa forzadamente:', error);
    throw error;
  }
};

// Ventas filtradas por sucursal
export const getVentasHoy = async (fecha?: string) => {
  try {
    const sucursalId = getSucursalId();
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');

    // Verificar que sucursalId no sea undefined o null
    if (!sucursalId) {
      console.warn('getVentasHoy: No se pudo obtener el ID de sucursal, usando sucursal por defecto');
      // Usar sucursal por defecto (ID 1) si no se puede obtener
      const params = new URLSearchParams();
      params.append('sucursal', '1');
      params.append('id_restaurante', restauranteId.toString());
      if (fecha) {
        params.append('fecha', fecha);
      }
      
      const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/ventas-hoy?${params.toString()}`);
      return response.data.data;
    }
    
    const params = new URLSearchParams();
    params.append('sucursal', sucursalId.toString());
    params.append('id_restaurante', restauranteId.toString());
    if (fecha) {
      params.append('fecha', fecha);
    }
    
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/ventas-hoy?${params.toString()}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching today sales:', error);
    throw error;
  }
};

export async function getVentasOrdenadas(limit = 50, sucursalIdOverride?: number) {
  const restauranteId = getRestauranteId();
  if (!restauranteId) throw new Error('Restaurante ID not found.');
  const sucursalId = sucursalIdOverride ?? getSucursalId();
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('id_restaurante', restauranteId.toString());
  if (sucursalId) params.append('sucursal', sucursalId.toString());
  const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/ordenadas?${params.toString()}`);
  const data = response.data.data;
  // Mapear productos correctamente en cada venta
  return data.map((venta: any) => {
    let fechaValida = '';
    if (venta.fecha && !isNaN(Date.parse(venta.fecha))) {
      fechaValida = venta.fecha;
    } else {
      fechaValida = new Date().toISOString(); // fallback a fecha actual si es inválida
    }
    return {
      id: venta.id_venta?.toString() || venta.id?.toString() || Math.random().toString(36).substr(2, 9),
      items: (venta.productos || []).map((p: any, idx: number) => ({
        name: p.nombre_producto || p.nombre || '',
        quantity: p.cantidad,
        price: p.precio_unitario || p.precio || 0,
        notes: p.observaciones || '',
        id: p.id_producto?.toString() || p.id?.toString() || idx.toString(),
      })),
      total: parseFloat(venta.total) || 0,
      paymentMethod: venta.metodo_pago || venta.paymentMethod || '',
      timestamp: new Date(fechaValida),
      cashier: venta.vendedor_nombre || venta.cajero || venta.nombre_cajero || '',
      branch: venta.sucursal_nombre || venta.branch || '',
      mesa_numero: venta.mesa_numero || null,
      tipo_servicio: venta.tipo_servicio || '',
      invoiceData: venta.invoiceData || null,
    };
  });
}

// Arqueo filtrado por sucursal
export const getArqueoData = async (startDate: string, endDate: string, sucursal?: number) => {
  try {
    let sucursalId = sucursal;
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');

    // Si no se especifica sucursal, usar la del usuario actual
    if (!sucursalId) {
      sucursalId = getSucursalId();
    }
    
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    params.append('id_restaurante', restauranteId.toString()); // Siempre añadir id_restaurante
    
    // Solo agregar parámetro de sucursal si se especifica
    if (sucursalId) {
      params.append('sucursal', sucursalId.toString());
    }
    
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/arqueo?${params.toString()}`);
    
    // Manejar la nueva estructura de respuesta
    const responseData = response.data.data;
    
    // Si no hay datos para la sucursal del usuario pero hay datos generales, usar esos
    if ((!responseData.salesSummary || responseData.salesSummary.length === 0) && 
        (!responseData.dailyCashFlow || responseData.dailyCashFlow.length === 0) &&
        responseData.allSalesSummary && responseData.allSalesSummary.length > 0) {
      console.log('No data for user branch, using all branches data');
      return {
        salesSummary: responseData.allSalesSummary || [],
        dailyCashFlow: responseData.allDailyCashFlow || [],
        userSucursal: responseData.userSucursal,
        message: response.data.message
      };
    }
    
    return responseData;
  } catch (error) {
    console.error('Error fetching arqueo data:', error);
    throw error;
  }
};

// Métodos de pago (solo admin)
export const getPaymentMethods = async () => {
  const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/metodos_pago`);
  return response.data.data;
};

export const createPaymentMethod = async (descripcion: string) => {
  const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/metodos_pago`, { descripcion });
  return response.data.data;
};

export const updatePaymentMethod = async (id: number, data: { descripcion?: string, activo?: boolean }) => {
  const response = await api.put(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/metodos_pago/${id}`, data);
  return response.data.data;
};

export const deletePaymentMethod = async (id: number) => {
  const response = await api.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/metodos_pago/${id}`);
  return response.data;
};

// Pagos de suscripción
export const crearPagoSuscripcion = async (data: {
  monto: number;
  banco_origen: string;
  banco_destino: string;
  nro_operacion: string;
  fecha_transferencia: string;
  comprobante_url?: string;
}) => {
  const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/pagos_suscripcion`, data);
  return response.data.data;
};

export const getPagosSuscripcion = async () => {
  const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/pagos_suscripcion`);
  return response.data.data;
};

export const aprobarPagoSuscripcion = async (id: number) => {
  const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/pagos_suscripcion/${id}/aprobar`, {});
  return response.data.data;
};

export const rechazarPagoSuscripcion = async (id: number) => {
  const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/pagos_suscripcion/${id}/rechazar`, {});
  return response.data.data;
};

/**
 * Exporta ventas filtradas según los parámetros avanzados
 * @param filtros { fecha_inicio, fecha_fin, id_sucursal?, id_producto?, metodo_pago?, cajero? }
 * @returns Array de ventas filtradas
 */
export const exportVentasFiltradas = async (filtros: {
  fecha_inicio: string;
  fecha_fin: string;
  id_sucursal?: number;
  id_producto?: number;
  metodo_pago?: string;
  cajero?: string;
}) => {
  const restauranteId = getRestauranteId();
  if (!restauranteId) throw new Error('Restaurante ID not found.');
  const params = new URLSearchParams();
  params.append('fecha_inicio', filtros.fecha_inicio);
  params.append('fecha_fin', filtros.fecha_fin);
  params.append('id_restaurante', restauranteId.toString());
  if (filtros.id_sucursal) params.append('id_sucursal', filtros.id_sucursal.toString());
  if (filtros.id_producto) params.append('id_producto', filtros.id_producto.toString());
  if (filtros.metodo_pago) params.append('metodo_pago', filtros.metodo_pago);
  if (filtros.cajero) params.append('cajero', filtros.cajero);
  const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/export?${params.toString()}`);
  return response.data.data;
};

export const createSupportTicket = async (asunto: string, descripcion: string) => {
  const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/soporte/tickets`, { asunto, descripcion });
  return response.data.data;
};

export const getSupportTickets = async () => {
  const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/soporte/tickets`);
  // Normalizar para el frontend: asegurar id y fecha estables
  return (response.data.data || []).map((t: any) => ({
    id: t.id ?? t.id_ticket,
    asunto: t.asunto,
    descripcion: t.descripcion,
    estado: t.estado,
    fecha: t.fecha ?? t.fecha_creacion
  }));
};

// ===================================
// 🔹 SERVICIOS DE GRUPOS DE MESAS
// ===================================

export const crearGrupoMesas = async (data: {
  id_restaurante: number;
  id_sucursal: number;
  mesas: number[];
  id_mesero: number;
  id_venta_principal?: number;
}) => {
  console.log('Datos enviados a crearGrupoMesas:', data);
  console.log('URL del endpoint:', `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/grupos-mesas`);
  try {
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/grupos-mesas`, data);
    console.log('✅ Respuesta exitosa del backend:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error completo del backend:', error);
    console.error('❌ Error response data:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    console.error('❌ Error message:', error.message);
    throw error;
  }
};

export const agregarMesaAGrupo = async (id_grupo_mesa: number, id_mesa: number) => {
  const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/grupos-mesas/${id_grupo_mesa}/mesas`, { id_mesa });
  return response.data;
};

export const removerMesaDeGrupo = async (id_grupo_mesa: number, id_mesa: number) => {
  const response = await api.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/grupos-mesas/${id_grupo_mesa}/mesas/${id_mesa}`);
  return response.data;
};

export const cerrarGrupoMesas = async (id_grupo_mesa: number) => {
  const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/grupos-mesas/${id_grupo_mesa}/cerrar`, {});
  return response.data;
};

export const listarGruposMesasActivos = async (id_restaurante: number) => {
  const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/grupos-mesas/activos?id_restaurante=${id_restaurante}`);
  return response.data.grupos;
};

export const consultarGrupoPorMesa = async (id_mesa: number) => {
  const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/grupos-mesas/mesa/${id_mesa}`);
  return response.data.grupo;
};

// Obtener información completa de un grupo
export const obtenerGrupoCompleto = async (id_grupo_mesa: number) => {
  const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/grupos-mesas/${id_grupo_mesa}/completo`);
  return response.data.grupo;
};

// Listar grupos activos con información completa
export const listarGruposActivosCompletos = async (id_restaurante: number) => {
  const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/grupos-mesas/activos/completos?id_restaurante=${id_restaurante}`);
  return response.data.grupos;
};

// Generar prefactura para un grupo completo
export const generarPrefacturaGrupo = async (id_grupo_mesa: number) => {
  const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/grupos-mesas/${id_grupo_mesa}/prefactura`);
  return response.data.prefactura;
};

// Listar modificadores de un producto
export const getModificadoresPorProducto = async (id_producto: number) => {
  const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/modificadores/producto/${id_producto}`);
  return response.data.modificadores;
};

// Asociar modificadores a un detalle de venta
export const asociarModificadoresADetalle = async (id_detalle_venta: number, id_modificadores: number[]) => {
  const response = await api.post(
    `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/modificadores/detalle/${id_detalle_venta}`,
    { id_modificadores }
  );
  return response.data;
};

export { api };
// Función para manejar errores de conexión en componentes React
export const handleConnectionError = (error: any, retryCallback?: () => void) => {
  console.log('🔍 [Connection Handler] Manejando error de conexión:', error);
  
  if (error.name === 'NetworkError' || error.code === 'ERR_NETWORK' || error.code === 'ERR_CERT_AUTHORITY_INVALID') {
    // Mostrar mensaje de error de conexión
    const errorMessage = 'Error de conexión con el servidor. Verificando conectividad...';
    
    // Si hay un callback de reintento, ejecutarlo después de 3 segundos
    if (retryCallback) {
      setTimeout(() => {
        console.log('🔍 [Connection Handler] Reintentando operación...');
        retryCallback();
      }, 3000);
    }
    
    return errorMessage;
  }
  
  return error.message || 'Error desconocido';
};

// Función para verificar conectividad
export const checkConnectivity = async () => {
  try {
    const response = await fetch('https://api.forkast.vip/api/v1/test', {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });
    
    return response.ok;
  } catch (error) {
    console.log('🔍 [Connectivity Check] Error:', error);
    return false;
  }
};


export const getPedidosMeseroPendientes = async (id_sucursal: number, id_restaurante: number) => {
  const response = await api.get(
    `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/pendientes-mesero?id_sucursal=${id_sucursal}&id_restaurante=${id_restaurante}`
  );
  return response.data.data;
};

// Aceptar pedido de mesero
export const aceptarPedidoMesero = async (id_venta: number) => {
  const response = await api.patch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/${id_venta}/aceptar`);
  return response.data;
};

// Función para reasignar mesero a una mesa
export const reasignarMesero = async (id_mesa: number, id_mesero: number) => {
  try {
    const response = await api.patch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/${id_mesa}/mesero`, { id_mesero });
    return response.data;
  } catch (error) {
    console.error('Error reasignando mesero:', error);
    throw error;
  }
};

// Aprobar pedido de mesero
export const aprobarPedidoMesero = async (ventaId: number) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    console.log('API: Aprobando pedido de mesero:', { ventaId, restauranteId });
    
    const response = await api.patch(
      `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/${ventaId}/aprobar?id_restaurante=${restauranteId}`
    );
    
    console.log('API: Aprobación exitosa:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('API: Error aprobando pedido:', error);
    if (error.response) {
      console.error('API: Error response:', error.response.data);
    }
    throw error;
  }
};

// Rechazar pedido de mesero
export const rechazarPedidoMesero = async (ventaId: number, motivo?: string) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    console.log('API: Rechazando pedido de mesero:', { ventaId, motivo, restauranteId });
    
    const payload = motivo ? { motivo } : {};
    const response = await api.patch(
      `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/${ventaId}/rechazar?id_restaurante=${restauranteId}`,
      payload
    );
    
    console.log('API: Rechazo exitoso:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('API: Error rechazando pedido:', error);
    if (error.response) {
      console.error('API: Error response:', error.response.data);
    }
    throw error;
  }
};

// Obtener pedidos pendientes de aprobación
export const getPedidosPendientesAprobacion = async () => {
  try {
    console.log('API: Obteniendo pedidos pendientes de aprobación');
    
    const response = await api.get(
      `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/pendientes-aprobacion`
    );
    
    console.log('API: Pedidos pendientes obtenidos:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('API: Error obteniendo pedidos pendientes:', error);
    if (error.response) {
      console.error('API: Error response:', error.response.data);
    }
    throw error;
  }
};

// ===== RESERVAS =====

// Crear una nueva reserva
export const crearReserva = async (reservaData: {
  id_mesa: number;
  id_cliente?: number;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  numero_personas: number;
  observaciones?: string;
  nombre_cliente?: string;
  telefono_cliente?: string;
  email_cliente?: string;
}) => {
  try {
    console.log('API: Creando reserva:', reservaData);
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/reservas`, reservaData);
    console.log('API: Reserva creada:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creando reserva:', error);
    throw error;
  }
};

// Obtener reservas de una sucursal
export const getReservas = async (id_sucursal: number, fecha?: string) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    let url = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/reservas/sucursal/${id_sucursal}`;
    if (fecha) {
      url += `?fecha=${fecha}`;
    }
    
    console.log('API: Obteniendo reservas para sucursal:', id_sucursal, 'fecha:', fecha);
    const response = await api.get(url);
    console.log('API: Reservas obtenidas:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo reservas:', error);
    throw error;
  }
};

// Obtener una reserva específica
export const getReserva = async (id_reserva: number) => {
  try {
    console.log('API: Obteniendo reserva:', id_reserva);
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/reservas/${id_reserva}`);
    console.log('API: Reserva obtenida:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo reserva:', error);
    throw error;
  }
};

// Actualizar una reserva
export const actualizarReserva = async (id_reserva: number, datosActualizados: any) => {
  try {
    console.log('API: Actualizando reserva:', id_reserva, datosActualizados);
    const response = await api.put(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/reservas/${id_reserva}`, datosActualizados);
    console.log('API: Reserva actualizada:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error actualizando reserva:', error);
    throw error;
  }
};

// Cancelar una reserva
export const cancelarReserva = async (id_reserva: number, motivo?: string) => {
  try {
    const response = await api.patch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/reservas/${id_reserva}/cancelar`, { motivo });
    return response.data;
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    throw error;
  }
};

// Eliminar una reserva
export const eliminarReserva = async (id_reserva: number) => {
  try {
    const response = await api.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/reservas/${id_reserva}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar reserva:', error);
    throw error;
  }
};

// Obtener disponibilidad de mesas
export const getDisponibilidadMesas = async (id_sucursal: number, fecha_hora_inicio: string, fecha_hora_fin: string) => {
  try {
    console.log('API: Obteniendo disponibilidad para sucursal:', id_sucursal, 'desde:', fecha_hora_inicio, 'hasta:', fecha_hora_fin);
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/reservas/sucursal/${id_sucursal}/disponibilidad?fecha_hora_inicio=${fecha_hora_inicio}&fecha_hora_fin=${fecha_hora_fin}`);
    console.log('API: Disponibilidad obtenida:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error);
    throw error;
  }
};

// Obtener estadísticas de reservas
export const getEstadisticasReservas = async (id_sucursal: number, fecha_inicio: string, fecha_fin: string) => {
  try {
    console.log('API: Obteniendo estadísticas de reservas para sucursal:', id_sucursal, 'desde:', fecha_inicio, 'hasta:', fecha_fin);
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/reservas/sucursal/${id_sucursal}/estadisticas?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`);
    console.log('API: Estadísticas obtenidas:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
};

// Obtener reservas por mesa
export const getReservasByMesa = async (id_mesa: number) => {
  try {
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/reservas/mesa/${id_mesa}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener reservas por mesa:', error);
    throw error;
  }
};

// Limpiar estados de mesas que no tienen reservas activas
export const limpiarEstadosMesas = async () => {
  try {
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/reservas/limpiar-estados-mesas`);
    return response.data;
  } catch (error) {
    console.error('Error al limpiar estados de mesas:', error);
    throw error;
  }
};

// ===================================
// 🔹 SERVICIOS DE PROMOCIONES Y DESCUENTOS
// ===================================

// Crear una nueva promoción
export const crearPromocion = async (promocionData: {
  nombre: string;
  tipo: 'porcentaje' | 'monto_fijo' | 'precio_fijo';
  valor: number;
  fecha_inicio: string;
  fecha_fin: string;
  id_producto: number;
}) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/promociones`, {
      ...promocionData,
      id_restaurante: restauranteId
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creando promoción:', error);
    throw error;
  }
};

// Obtener promociones activas
export const getPromocionesActivas = async () => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/promociones/activas?id_restaurante=${restauranteId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo promociones activas:', error);
    throw error;
  }
};

// Obtener todas las promociones
export const getTodasPromociones = async () => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/promociones?id_restaurante=${restauranteId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error obteniendo promociones:', error);
    throw error;
  }
};

// Calcular descuento para un producto
export const calcularDescuento = async (id_producto: number, precio_original: number) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/promociones/calcular-descuento`, {
      id_producto,
      precio_original,
      id_restaurante: restauranteId
    });
    return response.data.data;
  } catch (error) {
    console.error('Error calculando descuento:', error);
    throw error;
  }
};

// Aplicar descuentos a productos
export const aplicarDescuentosAProductos = async (productos: any[]) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/promociones/aplicar-descuentos`, {
      productos,
      id_restaurante: restauranteId
    });
    return response.data.data;
  } catch (error) {
    console.error('Error aplicando descuentos:', error);
    throw error;
  }
};

// Actualizar promoción
export const actualizarPromocion = async (id_promocion: number, datosActualizados: any) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    const response = await api.put(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/promociones/${id_promocion}`, {
      ...datosActualizados,
      id_restaurante: restauranteId
    });
    return response.data.data;
  } catch (error) {
    console.error('Error actualizando promoción:', error);
    throw error;
  }
};

// Eliminar promoción
export const eliminarPromocion = async (id_promocion: number) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    const response = await api.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/promociones/${id_promocion}?id_restaurante=${restauranteId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error eliminando promoción:', error);
    throw error;
  }
};

// Verificar si un producto tiene promociones activas
export const tienePromocionesActivas = async (id_producto: number) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/promociones/producto/${id_producto}/verificar?id_restaurante=${restauranteId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error verificando promociones:', error);
    throw error;
  }
};

// Transferir ítem individual entre mesas
export const transferirItemMesa = async (id_detalle: number, id_mesa_destino: number) => {
  const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/transferir-item`, {
    id_detalle,
    id_mesa_destino,
  });
  return response.data;
};

// Transferir orden completa entre mesas
export const transferirOrdenMesa = async (id_venta: number, id_mesa_destino: number) => {
  const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/transferir-orden`, {
    id_venta,
    id_mesa_destino,
  });
  return response.data;
};

// Dividir cuenta (split bill)
export const splitBillMesa = async (id_mesa: number, asignaciones: { id_detalle: number; subcuenta: string }[]) => {
  const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/${id_mesa}/split-bill`, {
    asignaciones,
  });
  return response.data;
};

export const getArqueoActualPOS = async () => {
  try {
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/arqueo/actual`);
    return response.data.data;
  } catch (error: any) {
    // Manejar específicamente el error 403 de caja no abierta
    if (error.response?.status === 403 && 
        error.response?.data?.message?.includes('cajero o administrador debe aperturar caja')) {
      // Para meseros, no mostrar error, simplemente retornar null
      // El componente POSSystem ya maneja este caso
      return null;
    }
    // Para otros errores, re-lanzar el error
    throw error;
  }
};

export const abrirArqueoPOS = async (monto_inicial: number, observaciones?: string) => {
  const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/arqueo/abrir`, { monto_inicial, observaciones });
  return response.data.data;
};

export const cerrarArqueoPOS = async (monto_final: number, observaciones?: string) => {
  const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/arqueo/cerrar`, { monto_final, observaciones });
  return response.data.data;
};

// Función para renovar el token automáticamente
export const refreshAuthToken = async () => {
  try {
    const currentToken = localStorage.getItem('jwtToken');
    if (!currentToken) {
      throw new Error('No hay token para renovar');
    }

    // Hacer la petición de renovación
    const response = await api.post('/auth/refresh');
    const { token, data } = response.data;

    // Actualizar el token y la información del usuario
    setAuthToken(token);
    localStorage.setItem('currentUser', JSON.stringify(data));

    // Disparar evento personalizado para notificar a AuthContext
    window.dispatchEvent(new CustomEvent('userUpdated', { detail: data }));

    console.log('🔍 [API] Token renovado exitosamente');
    return { token, data };
  } catch (error) {
    console.error('🔍 [API] Error al renovar token:', error);
    // Si falla la renovación, limpiar sesión
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('selectedSucursalId');
    
    if (window.location.pathname !== '/login') {
      window.location.href = '/login?expired=1';
    }
    throw error;
  }
};

// ====== INVENTARIO PROFESIONAL ======

// Obtener lotes por vencer
export const getLotesPorVencer = async (dias: number = 7) => {
  try {
    const token = localStorage.getItem('jwtToken');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL}/inventario-lotes/por-vencer?dias=${dias}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error obteniendo lotes por vencer:', error);
    throw error;
  }
};

// Obtener productos con stock bajo
export const getProductosStockBajo = async (limite: number = 10) => {
  try {
    const token = localStorage.getItem('jwtToken');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL}/inventario-lotes/stock-bajo?limite=${limite}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error obteniendo productos con stock bajo:', error);
    throw error;
  }
};

// Crear lote
export const crearLote = async (loteData: any) => {
  try {
    const token = localStorage.getItem('jwtToken');
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL}/inventario-lotes`, loteData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creando lote:', error);
    throw error;
  }
};

// Actualizar lote
export const actualizarLote = async (idLote: number, loteData: any) => {
  try {
    const token = localStorage.getItem('jwtToken');
    const response = await api.put(`${import.meta.env.VITE_BACKEND_URL}/inventario-lotes/${idLote}`, loteData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error actualizando lote:', error);
    throw error;
  }
};

// Eliminar lote
export const eliminarLote = async (idLote: number) => {
  try {
    const token = localStorage.getItem('jwtToken');
    const response = await api.delete(`${import.meta.env.VITE_BACKEND_URL}/inventario-lotes/${idLote}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error eliminando lote:', error);
    throw error;
  }
};

// Obtener una venta con sus detalles
export const getVentaConDetalles = async (id_venta: number) => {
  try {
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/${id_venta}/detalles`);
    return response.data;
  } catch (error) {
    console.error('Error en getVentaConDetalles:', error);
    // Fallback: obtener venta y detalles por separado
    try {
      const restauranteId = getRestauranteId();
      if (!restauranteId) throw new Error('Restaurante ID not found.');
      
      // Obtener venta
      const ventaResponse = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/${id_venta}?id_restaurante=${restauranteId}`);
      
      // Obtener detalles
      const detallesResponse = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/ventas/${id_venta}/productos?id_restaurante=${restauranteId}`);
      
      return {
        success: true,
        data: {
          ...ventaResponse.data.data,
          detalles: detallesResponse.data.data || []
        }
      };
    } catch (fallbackError) {
      console.error('Error en fallback:', fallbackError);
      throw error;
    }
  }
};

// ==================== STOCK BY BRANCH API FUNCTIONS ====================

/**
 * Obtiene el stock de productos por sucursal
 */
export const getStockByBranch = async (id_sucursal: number) => {
  try {
    const response = await api.get(`/stock-sucursal/${id_sucursal}`);
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener stock por sucursal:', error);
    throw error;
  }
};

/**
 * Actualiza el stock de un producto en una sucursal específica
 */
export const updateStockByBranch = async (
  id_producto: number, 
  id_sucursal: number, 
  stockData: { stock_actual: number; stock_minimo: number; stock_maximo: number }
) => {
  try {
    const response = await api.put(`/stock-sucursal/${id_producto}/${id_sucursal}`, stockData);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar stock por sucursal:', error);
    throw error;
  }
};

/**
 * Transfiere stock entre sucursales
 */
export const transferStockBetweenBranches = async (transferData: {
  id_producto: number;
  cantidad: number;
  sucursal_origen: number;
  sucursal_destino: number;
  observaciones?: string;
}) => {
  try {
    const response = await api.post('/stock-sucursal/transfer', transferData);
    return response.data;
  } catch (error) {
    console.error('Error al transferir stock entre sucursales:', error);
    throw error;
  }
};

/**
 * Obtiene alertas de stock
 */
export const getStockAlerts = async () => {
  try {
    const response = await api.get('/stock-sucursal/alerts');
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener alertas de stock:', error);
    throw error;
  }
};

/**
 * Obtiene reportes de stock
 */
export const getStockReports = async (filters?: {
  fecha_inicio?: string;
  fecha_fin?: string;
  id_sucursal?: number;
  tipo_reporte?: string;
}) => {
  try {
    const params = new URLSearchParams();
    if (filters?.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
    if (filters?.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
    if (filters?.id_sucursal) params.append('id_sucursal', filters.id_sucursal.toString());
    if (filters?.tipo_reporte) params.append('tipo_reporte', filters.tipo_reporte);
    
    const response = await api.get(`/stock-sucursal/reports?${params.toString()}`);
    
    // Para el tipo 'analytics', devolver analytics en lugar de data
    if (filters?.tipo_reporte === 'analytics') {
      return response.data.analytics || [];
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener reportes de stock:', error);
    throw error;
  }
};