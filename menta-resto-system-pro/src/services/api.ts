import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || '/api/v1';
console.log('API_URL configurada como:', API_URL);

// Configurar axios para incluir credenciales
axios.defaults.withCredentials = true;

// Agregar interceptores para debugging
axios.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Función para establecer el token de autenticación en las cabeceras de Axios
export const setAuthToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('jwtToken', token); // Almacenar en localStorage
  } else {
    delete axios.defaults.headers.common['Authorization'];
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
    const response = await axios.get(`${API_URL}/categorias?id_restaurante=${restauranteId}`);
    return response.data.data.map((category: any) => ({
      id_categoria: category.id_categoria,
      nombre: category.nombre,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const getBranches = async () => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await axios.get(`${API_URL}/sucursales?id_restaurante=${restauranteId}`);
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
    const response = await axios.post(`${API_URL}/sucursales`, { ...sucursalData, id_restaurante: restauranteId });
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
    const response = await axios.put(`${API_URL}/sucursales/${id_sucursal}`, { ...sucursalData, id_restaurante: restauranteId });
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
    const response = await axios.delete(`${API_URL}/sucursales/${id_sucursal}`);
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
    const response = await axios.post(`${API_URL}/auth/login`, {
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
    const response = await axios.get(`${API_URL}/auth/users?id_restaurante=${restauranteId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Obtener estadísticas del dashboard
export const getDashboardStats = async () => {
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await axios.get(`${API_URL}/dashboard/stats?id_restaurante=${restauranteId}`);
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
    const response = await axios.post(`${API_URL}/auth/users`, { ...userData, id_restaurante: restauranteId });
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
    const response = await axios.get(`${API_URL}/productos?id_restaurante=${restauranteId}`);
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
    const response = await axios.post(`${API_URL}/productos`, { ...productData, id_restaurante: restauranteId });
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
    const response = await axios.put(`${API_URL}/productos/${productData.id}?id_restaurante=${restauranteId}`, { ...productData, id_restaurante: restauranteId });
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
    const response = await axios.delete(`${API_URL}/productos/${productId}?id_restaurante=${restauranteId}`);
    return response.data.data;
  }  catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Registrar una venta
export const createSale = async (sale: {
  items: Array<{ id: string; quantity: number; price: number; notes?: string }>,
  total: number,
  paymentMethod: string,
  cashier: string,
  branch: string,
  mesa_numero?: number,
  tipo_servicio?: 'Mesa' | 'Delivery' | 'Para Llevar',
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
    observaciones: item.notes || ''
  }));
  
  const payload = {
    items,
    total: sale.total,
    paymentMethod: sale.paymentMethod,
    cashier: sale.cashier,
    branch: sale.branch,
    tipo_servicio: sale.tipo_servicio || 'Mesa',
    mesa_numero: sale.mesa_numero,
    invoiceData: sale.invoiceData,
    id_restaurante: restauranteId // Añadir id_restaurante al payload
  };
  
  console.log('Frontend: Sending sale payload:', payload);
  
  try {
    const response = await axios.post(`${API_URL}/ventas`, payload);
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
  if (!user || (user.rol !== 'admin' && user.rol !== 'gerente' && user.rol !== 'super_admin')) {
    // No tiene permisos para consultar inventario
    return [];
  }
  try {
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');
    const response = await axios.get(`${API_URL}/productos/inventario/resumen?id_restaurante=${restauranteId}`);
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
    const response = await axios.get(`${API_URL}/ventas/cocina?id_restaurante=${restauranteId}`);
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
    console.log('API: Updating order status:', { saleId, status, restauranteId });
    const response = await axios.patch(`${API_URL}/ventas/${saleId}/estado?id_restaurante=${restauranteId}`, { estado: status });
    console.log('API: Update response:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('API: Error updating order status:', error);
    if (error.response) {
      console.error('API: Error response:', error.response.data);
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
    const response = await axios.get(`${API_URL}/ventas/test/pedidos`);
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
    const response = await axios.get(`${API_URL}/ventas/test/todos-pedidos`);
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
    const response = await axios.get(`${API_URL}/ventas/test/estadisticas-pedidos`);
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
    const response = await axios.get(`${API_URL}/test`);
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
    const response = await axios.get(`${API_URL}/mesas/sucursal/${id_sucursal}?id_restaurante=${restauranteId}`);
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
    const response = await axios.get(`${API_URL}/mesas/${numero}/sucursal/${id_sucursal}?id_restaurante=${restauranteId}`);
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
    const response = await axios.post(`${API_URL}/mesas/abrir`, {
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
    const response = await axios.post(`${API_URL}/mesas/${id_mesa}/cerrar?id_restaurante=${restauranteId}`);
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
    const response = await axios.patch(`${API_URL}/mesas/${id_mesa}/liberar?id_restaurante=${restauranteId}`);
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
    const response = await axios.post(`${API_URL}/mesas/agregar-productos`, { ...data, id_restaurante: restauranteId });
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
    const response = await axios.get(`${API_URL}/mesas/${id_mesa}/prefactura?id_restaurante=${restauranteId}`);
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
    const response = await axios.get(`${API_URL}/mesas/sucursal/${id_sucursal}/estadisticas?id_restaurante=${restauranteId}`);
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
    const response = await axios.get(`${API_URL}/mesas/${id_mesa}/historial`, { params });
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
    const response = await axios.post(`${API_URL}/mesas/cerrar-con-factura`, { ...data, id_restaurante: restauranteId });
    return response.data.data;
  } catch (error) {
    console.error('Error al cerrar mesa con factura:', error);
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
    const response = await axios.get(`${API_URL}/mesas/configuracion/sucursal/${id_sucursal}?id_restaurante=${restauranteId}`);
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
    const response = await axios.post(`${API_URL}/mesas/configuracion`, { ...data, id_restaurante: restauranteId });
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
    const response = await axios.put(`${API_URL}/mesas/configuracion/${id_mesa}?id_restaurante=${restauranteId}`, { ...data, id_restaurante: restauranteId });
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
    const response = await axios.delete(`${API_URL}/mesas/configuracion/${id_mesa}?id_restaurante=${restauranteId}`);
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
      
      const response = await axios.get(`${API_URL}/ventas/ventas-hoy?${params.toString()}`);
      return response.data.data;
    }
    
    const params = new URLSearchParams();
    params.append('sucursal', sucursalId.toString());
    params.append('id_restaurante', restauranteId.toString());
    if (fecha) {
      params.append('fecha', fecha);
    }
    
    const response = await axios.get(`${API_URL}/ventas/ventas-hoy?${params.toString()}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching today sales:', error);
    throw error;
  }
};

export const getVentasOrdenadas = async (limit = 50) => {
  try {
    const sucursalId = getSucursalId();
    const restauranteId = getRestauranteId();
    if (!restauranteId) throw new Error('Restaurante ID not found.');

    // Verificar que sucursalId no sea undefined o null
    if (!sucursalId) {
      console.warn('getVentasOrdenadas: No se pudo obtener el ID de sucursal, usando sucursal por defecto');
      // Usar sucursal por defecto (ID 1) si no se puede obtener
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('sucursal', '1');
      params.append('id_restaurante', restauranteId.toString());
      
      const response = await axios.get(`${API_URL}/ventas/ordenadas?${params.toString()}`);
      return response.data.data;
    }
    
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('sucursal', sucursalId.toString());
    params.append('id_restaurante', restauranteId.toString());
    
    const response = await axios.get(`${API_URL}/ventas/ordenadas?${params.toString()}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching ordered sales:', error);
    throw error;
  }
};

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
    
    const response = await axios.get(`${API_URL}/ventas/arqueo?${params.toString()}`);
    
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