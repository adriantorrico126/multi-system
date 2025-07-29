import axios from 'axios';

// Crear una instancia global de Axios
const api = axios.create();

// Interceptor global para manejar expiración de JWT
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.data && typeof error.response.data.message === 'string') {
      if (
        error.response.status === 401 || error.response.status === 403 ||
        error.response.data.message.toLowerCase().includes('jwt expired')
      ) {
        // Limpiar token y redirigir al login
        localStorage.removeItem('jwtToken');
        window.location.href = '/login?expired=1';
        return Promise.reject(new Error('Sesión expirada. Por favor, inicia sesión nuevamente.'));
      }
    }
    return Promise.reject(error);
  }
);

// Función para establecer el token de autenticación en las cabeceras de Axios
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('jwtToken', token); // Almacenar en localStorage
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
    console.log('getRestauranteId - User:', user);
    console.log('getRestauranteId - id_restaurante:', user.id_restaurante);
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
    
    console.log('getSucursalId - User data:', user);
    console.log('getSucursalId - User role:', userRole);
    
    // Si es admin o gerente, usar la sucursal seleccionada
    if (userRole === 'admin' || userRole === 'gerente') {
      const selectedSucursalId = getSelectedSucursalId();
      console.log('getSucursalId - Selected sucursal ID:', selectedSucursalId);
      return selectedSucursalId || null;
    }
    
    // Para otros roles, usar la sucursal del usuario
    const currentSucursalId = getCurrentSucursalId();
    console.log('getSucursalId - Current sucursal ID:', currentSucursalId);
    return currentSucursalId || null;
  } catch (error) {
    console.error('Error getting sucursal ID:', error);
    return null;
  }
};

export const getCategories = async () => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/categorias?id_restaurante=${restauranteId}`);
    return response.data.data.map((category: any) => ({
      id_categoria: category.id_categoria,
      nombre: category.nombre,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const getAllCategories = async () => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/categorias?id_restaurante=${restauranteId}&includeInactive=true`);
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
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/categorias`, { ...categoryData, id_restaurante: restauranteId });
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
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/auth/login`, {
      username,
      password
    });
    console.log('API: Login response:', response.data);
    const { token, data: userData } = response.data; // Obtener token y datos de usuario
    console.log('API: userData:', userData);
    setAuthToken(token); // Establecer el token en Axios y localStorage
    return userData; // Devolver solo los datos del usuario
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

// Productos
export const getProducts = async () => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/productos?id_restaurante=${restauranteId}`);
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
  }
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
    id_restaurante: restauranteId // Añadir id_restaurante al payload
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

// Actualizar el estado de un pedido
export const updateOrderStatus = async (saleId: string, status: string) => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    
    // Asegurar que el status sea válido
    const validStatuses = ['recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado'];
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
  setAuthToken(null);
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
  numero: number;
  id_sucursal: number;
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
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await api.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api/v1'}/mesas/${id_mesa}/prefactura?id_restaurante=${restauranteId}`);
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

// Marcar mesa como pagada (nuevo flujo)
export const marcarMesaComoPagada = async (data: {
  id_mesa: number;
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
    return response.data.data;
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
    return response.data.data;
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
    return response.data.data;
  } catch (error) {
    console.error('Error al eliminar mesa:', error);
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
  return response.data.data;
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