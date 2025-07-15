import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Product, CartItem, Sale, Category } from '@/types/restaurant';
import { ProductCard } from './ProductCard';
import { CategoryFilter } from './CategoryFilter';
import { Cart } from './Cart';
import { CheckoutModal } from './CheckoutModal';
import { SalesHistory } from './SalesHistory';
import { OrderManagement } from './OrderManagement';
import { InvoiceModal } from './InvoiceModal';
import { ProductManagement } from './ProductManagement';
import { UserManagement } from './UserManagement';
import { SucursalManagement } from './SucursalManagement';
import { DashboardStats } from './DashboardStats';
import { Header } from './Header';
import { MesaManagement } from './MesaManagement';
import CategoryList from './CategoryList';
import Membresia from '../../pages/Membresia';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, BarChart3, FileText, Users, ShoppingCart, ClipboardList, Package, UtensilsCrossed, LayoutDashboard, Building, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportSalesToCSV } from '@/utils/csvExport';
import { getProducts, getCategories, getKitchenOrders, createSale, refreshInventory, updateOrderStatus, getBranches, getVentasOrdenadas } from '@/services/api';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
// Asegúrate de importar KitchenView si es un componente separado
import { KitchenView } from '../../pages/KitchenView';


// Tipo local para sucursal para evitar conflictos con Header
interface Sucursal {
  id: number;
  name: string;
  location: string;
}

/**
 * Define la estructura para una orden en el frontend, incluyendo su estado y detalles.
 */
export interface Order {
  id: string;
  saleId: string;
  items: Array<{ name: string; quantity: number; notes?: string }>;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelado';
  timestamp: Date;
  table?: string;
  cashier: string;
  priority: 'normal' | 'high'; // Podría ser 'normal' | 'high' | 'urgent'
}

/**
 * `POSSystem` es el componente principal del Punto de Venta.
 * Gestiona el estado de la aplicación, las interacciones con el usuario y la comunicación con el backend.
 * Utiliza React Query para la gestión de datos asíncronos y Context API para la autenticación.
 */
export function POSSystem() {
  const { user, logout } = useAuth(); // Obtiene el usuario autenticado y la función de cierre de sesión
  const { toast } = useToast(); // Hook para mostrar notificaciones
  const queryClient = useQueryClient(); // Cliente de React Query para invalidar cachés

  // Estado para sucursal seleccionada (solo admin/gerente)
  const { data: branches = [] } = useQuery({ queryKey: ['branches'], queryFn: getBranches });
  const isAdmin = user.rol === 'admin' || user.rol === 'super_admin';
  const [selectedBranchId, setSelectedBranchId] = React.useState<number | null>(null);

  // Al iniciar, setear sucursal seleccionada a la del usuario (o la primera si es admin)
  React.useEffect(() => {
    if (isAdmin && branches.length > 0) {
      // Intentar obtener la sucursal guardada en localStorage
      const savedSucursalId = localStorage.getItem('selectedSucursalId');
      if (savedSucursalId) {
        setSelectedBranchId(parseInt(savedSucursalId));
      } else {
        // Si no hay sucursal guardada, usar la primera disponible
        const firstBranchId = branches[0].id_sucursal ?? branches[0].id;
        setSelectedBranchId(firstBranchId);
        localStorage.setItem('selectedSucursalId', firstBranchId.toString());
      }
    } else if (user.sucursal?.id) {
      setSelectedBranchId(user.sucursal.id);
    }
  }, [isAdmin, branches, user.sucursal?.id]);

  // Función para manejar el cambio de sucursal
  const handleSucursalChange = React.useCallback((newSucursalId: number) => {
    setSelectedBranchId(newSucursalId);
    localStorage.setItem('selectedSucursalId', newSucursalId.toString());
    
    // Invalidar queries para forzar refetch con la nueva sucursal
    // Asegurarse de que las invalidaciones sean conscientes del inquilino
    queryClient.invalidateQueries({ queryKey: ['mesas', user?.id_restaurante] });
    queryClient.invalidateQueries({ queryKey: ['estadisticas-mesas', user?.id_restaurante] });
    queryClient.invalidateQueries({ queryKey: ['ventas', user?.id_restaurante] });
    queryClient.invalidateQueries({ queryKey: ['users', user?.id_restaurante] });
    queryClient.invalidateQueries({ queryKey: ['products', user?.id_restaurante] }); // También productos
    queryClient.invalidateQueries({ queryKey: ['categories', user?.id_restaurante] }); // También categorías
    
    // Disparar evento personalizado para que el dashboard se actualice
    window.dispatchEvent(new CustomEvent('sucursal-changed', { 
      detail: { sucursalId: newSucursalId } 
    }));
    
    console.log('🔄 Sucursal cambiada a:', newSucursalId);
  }, [queryClient, user?.id_restaurante]);

  // Sucursal seleccionada (objeto)
  const selectedBranch = React.useMemo(() => {
    if (!selectedBranchId) return undefined;
    return branches.find(b => b.id_sucursal === selectedBranchId || b.id === selectedBranchId);
  }, [branches, selectedBranchId]);

  // Determina si el usuario solo puede ver mesas (cajero)
  const onlyMesas = user.rol === 'cajero';
  // Determina si se deben mostrar las pestañas de administración
  const showAdminFeatures = user.rol === 'admin' || user.rol === 'cajero' || user.rol === 'cocinero' || user.rol === 'super_admin';

  // --- Estado Local del Componente ---
  const [cart, setCart] = useState<CartItem[]>([]); // Carrito de compras actual
  const [activeTab, setActiveTab] = useState('pos'); // Pestaña principal activa (e.g., 'pos', 'orders', 'sales', 'dashboard')
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda para productos
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // Categoría de producto seleccionada para filtrar
  const [showCheckout, setShowCheckout] = useState(false); // Controla la visibilidad del modal de pago
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null); // Venta seleccionada para mostrar factura
  const [mesaNumero, setMesaNumero] = useState<number | null>(null); // Número de mesa para ventas de tipo 'Mesa'
  const [tipoServicio, setTipoServicio] = useState<'Mesa' | 'Delivery' | 'Para Llevar'>('Mesa'); // Tipo de servicio (Mesa, Delivery, Para Llevar)
  const [activeDashboardSubTab, setActiveDashboardSubTab] = useState<string>('summary'); // Sub-pestaña activa dentro del Dashboard ('summary', 'products', 'users', 'mesas')

  // --- React Query: Gestión de Datos Asíncronos ---

  // Obtener historial de ventas desde el backend
  const { data: ventasOrdenadas = [], refetch: refetchVentas, isLoading: isLoadingVentas } = useQuery<Sale[]>({
    queryKey: ['ventas-ordenadas', user?.id_restaurante, selectedBranchId],
    queryFn: () => getVentasOrdenadas(50, selectedBranchId),
    enabled: !!user?.id_restaurante,
    refetchOnWindowFocus: true,
  });

  // Reemplazar el estado local de sales por el dato de React Query
  const sales = ventasOrdenadas;

  // Obtener productos disponibles
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: getProducts,
    staleTime: 5 * 60 * 1000, // Los datos se consideran "stale" después de 5 minutos, pero se usan si están en caché
    refetchOnWindowFocus: false, // Evita refetching innecesario al cambiar de ventana
  });

  // Obtener categorías de productos
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['categories', user?.id_restaurante],
    queryFn: getCategories,
    staleTime: 0, // Siempre refetch para obtener categorías actualizadas
    refetchOnWindowFocus: true,
  });

  // Obtener pedidos para la vista de cocina/gestión de pedidos (refresca cada 5 segundos)
  const canViewOrders = user.rol === 'cocinero' || user.rol === 'admin' || user.rol === 'cajero';
  const {
    data: backendOrders = [],
    isError: isErrorOrders,
  } = useQuery({
    queryKey: ['orders-pos'],
    queryFn: getKitchenOrders,
    refetchInterval: 5000, // Actualiza los pedidos cada 5 segundos
    enabled: !!user && canViewOrders, // Ahora también para cajero
    refetchOnWindowFocus: true,
    staleTime: 3000,
  });

  // Filtrar pedidos para el cajero: solo los de su sucursal
  const filteredOrders = React.useMemo(() => {
    if (user.rol === 'cajero') {
      // Filtrar por sucursal del cajero
      return (backendOrders || []).filter((order: any) => {
        // Convertir a números para comparación
        const orderSucursalId = parseInt(order.id_sucursal) || parseInt(order.sucursal_id);
        const userSucursalId = parseInt(user.sucursal?.id);
        return orderSucursalId === userSucursalId;
      });
    }
    return backendOrders || [];
  }, [backendOrders, user]);

  // Manejar errores de pedidos con useEffect
  useEffect(() => {
    if (isErrorOrders) {
      toast({
        title: 'Error al cargar pedidos',
        description: 'No se pudieron obtener los pedidos de la cocina. Verifica tu conexión o permisos.',
        variant: 'destructive',
      });
    }
  }, [isErrorOrders, toast]);

  // --- Mapeo de Datos del Backend a Estructura de Frontend ---

  /**
   * Mapea un objeto de orden del backend a la estructura de orden utilizada en el frontend.
   * Esto asegura que el frontend trabaje con un formato consistente.
   * @param order - El objeto de orden tal como se recibe del backend.
   * @returns Una `Order` con el formato del frontend.
   */
  const mapBackendOrderToOrder = useCallback((order: any): Order => {
    let status: Order['status'] = 'pending';
    switch (order.estado) {
      case 'recibido':
        status = 'pending';
        break;
      case 'en_preparacion':
        status = 'preparing';
        break;
      case 'listo_para_servir':
        status = 'ready';
        break;
      case 'entregado':
        status = 'delivered';
        break;
      default:
        status = 'pending';
    }
    return {
      id: order.id_venta?.toString() || Date.now().toString(), // Usar un fallback si id_venta no está presente
      saleId: order.id_venta?.toString() || Date.now().toString(),
      items: (order.productos || []).map((p: any) => ({
        name: p.nombre_producto,
        quantity: p.cantidad,
        notes: p.observaciones || '',
      })),
      status,
      timestamp: new Date(order.fecha),
      table: order.mesa_numero ? order.mesa_numero.toString() : order.tipo_servicio,
      cashier: order.nombre_cajero || 'Desconocido', // Asegúrate de obtener el nombre del cajero si está disponible
      priority: 'normal', // Podría derivarse de algún campo en el backend si existe
    };
  }, []);

  // --- Lógica de Filtrado y Búsqueda de Productos (Memoizada) ---

  /**
   * `filteredProducts` filtra la lista de productos basada en la categoría seleccionada
   * y el término de búsqueda. Se memoiza para evitar recálculos innecesarios.
   */
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.id_categoria.toString() === selectedCategory;
      const matchesSearch = searchTerm === '' || product.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch && product.available;
    });
  }, [products, selectedCategory, searchTerm]);

  // --- Funciones de Gestión del Carrito (Memoizadas con useCallback) ---

  /**
   * Añade un producto al carrito. Si el producto ya existe (con las mismas notas),
   * incrementa su cantidad; de lo contrario, lo añade como un nuevo ítem.
   */
  const addToCart = useCallback((product: Product, notes?: string) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id && item.notes === notes);
      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id && item.notes === notes ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // Crear un ID único para el item del carrito
      const cartItemId = `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return [...currentCart, { 
        ...product, 
        id: cartItemId, // Usar el ID único del carrito
        originalId: product.id, // Mantener el ID original del producto
        quantity: 1, 
        notes: notes || '' 
      }];
    });
  }, []);

  /**
   * Actualiza la cantidad de un ítem específico en el carrito.
   * Si la cantidad es 0, el ítem se elimina del carrito.
   */
  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity === 0) {
      setCart((currentCart) => currentCart.filter((item) => item.id !== id));
      return;
    }
    setCart((currentCart) => currentCart.map((item) => (item.id === id ? { ...item, quantity } : item)));
  }, []);

  /**
   * Elimina un ítem del carrito.
   */
  const removeFromCart = useCallback((id: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
  }, []);

  // --- Funciones de Gestión de Ventas y Pedidos ---

  /**
   * Confirma una venta, la envía al backend, actualiza el estado local
   * y refresca el inventario.
   * @param paymentMethod - Método de pago de la venta.
   * @param invoiceData - Datos opcionales para la factura.
   */
  const confirmSale = useCallback(
    async (paymentMethod: string, invoiceData?: any) => {
      if (cart.length === 0) {
        toast({
          title: '🛒 Carrito Vacío',
          description: 'No hay productos en el carrito para realizar la venta.',
          variant: 'destructive',
        });
        return;
      }

      if (tipoServicio === 'Mesa' && !mesaNumero) {
        toast({
          title: '❌ Número de Mesa Requerido',
          description: 'Por favor, ingresa el número de mesa para ventas en el local.',
          variant: 'destructive',
        });
        return;
      }

      // Prepara los datos de la nueva venta
      const newSale: Sale = {
        id: Date.now().toString(), // ID temporal, será reemplazado por el del backend
        items: [...cart],
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        paymentMethod,
        timestamp: new Date(),
        cashier: user?.username || 'Desconocido',
        branch: selectedBranch?.nombre || user?.sucursal?.nombre || 'Desconocido',
        mesa_numero: tipoServicio === 'Mesa' ? mesaNumero : null,
        tipo_servicio: tipoServicio,
        invoiceData,
      };

      try {
        // Envía la venta al backend
        const backendResponse = await createSale({
          items: cart.map((item) => ({
            id: item.originalId || item.id,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
          })),
          total: newSale.total,
          paymentMethod,
          cashier: newSale.cashier,
          branch: selectedBranchId, // Enviar SIEMPRE el id numérico de sucursal
          mesa_numero: newSale.mesa_numero,
          tipo_servicio: tipoServicio,
          invoiceData,
        });

        // Usa el ID real de la venta devuelto por el backend
        const realSaleId = backendResponse.venta?.id_venta?.toString() || newSale.id;
        const updatedSale = { ...newSale, id: realSaleId };

        // Crea una nueva orden para la gestión de cocina
        // Se asume que el backend gestionará la creación de la orden de cocina.
        // Aquí solo la reflejamos en el frontend si es necesario para la vista de "Pedidos" local.
        const newOrder: Order = {
          id: realSaleId,
          saleId: realSaleId,
          items: cart.map((item) => ({ name: item.name, quantity: item.quantity, notes: item.notes })),
          status: 'pending', // Estado inicial para pedidos de cocina
          timestamp: new Date(),
          cashier: user?.username || 'Desconocido',
          priority: 'normal',
          table: mesaNumero ? mesaNumero.toString() : tipoServicio,
        };

        // Actualiza el estado local de ventas y órdenes
        // setSales((currentSales) => [updatedSale, ...currentSales]); // Eliminado: sales ahora es de React Query
        setCart([]); // Limpia el carrito después de la venta
        setShowCheckout(false); // Cierra el modal de checkout
        await refetchVentas(); // Refresca el historial de ventas desde el backend

        // Invalida la query de órdenes para que se actualice desde el backend
        // Refresca el inventario y los productos en caché
        try {
          if (user?.rol === 'admin' || user?.rol === 'super_admin') {
          await refreshInventory();
          }
          queryClient.invalidateQueries({ queryKey: ['products'] }); // Invalida caché de productos
          queryClient.invalidateQueries({ queryKey: ['orders-pos'] }); // Invalida caché de órdenes
          // Nueva línea: Invalida la query de mesas para actualizar el total acumulado en tiempo real
          queryClient.invalidateQueries({ queryKey: ['mesas', user?.sucursal?.id] });
          console.log('Frontend: Inventory, orders, and mesas refreshed after sale');
        } catch (inventoryError) {
          console.error('Frontend: Error refreshing inventory or orders:', inventoryError);
          // Opcional: mostrar un toast si el refresh falla
        }

        toast({
          title: '✅ Venta Registrada',
          description: `Venta por Bs ${newSale.total.toFixed(2)} procesada exitosamente.`,
        });
      } catch (error: any) {
        // LOG DETALLADO PARA DEPURACIÓN
        console.error('Error al registrar venta (DETALLE):', error);
        
        // Manejar errores específicos del backend
        let errorTitle = '❌ Error al Registrar Venta';
        let errorDescription = 'No se pudo registrar la venta en el sistema. Intenta nuevamente.';
        
        if (error.response?.data?.message) {
          const backendMessage = error.response.data.message;
          
          // Errores específicos del backend
          if (backendMessage.includes('Mesa') && backendMessage.includes('no encontrada')) {
            errorTitle = '🏢 Mesa No Encontrada';
            const details = error.response?.data?.details || '';
            errorDescription = `La mesa ${mesaNumero} no existe en esta sucursal. ${details}`;
          } else if (backendMessage.includes('no está disponible')) {
            errorTitle = '🚫 Mesa No Disponible';
            const details = error.response?.data?.details || '';
            errorDescription = `La mesa ${mesaNumero} no está disponible en este momento. ${details}`;
          } else if (backendMessage.includes('Cajero no encontrado')) {
            errorTitle = '👤 Cajero No Encontrado';
            errorDescription = 'El cajero especificado no existe en el sistema. Contacta al administrador.';
          } else if (backendMessage.includes('Sucursal no encontrada')) {
            errorTitle = '🏢 Sucursal No Encontrada';
            errorDescription = 'La sucursal especificada no existe en el sistema. Contacta al administrador.';
          } else if (backendMessage.includes('Método de pago no encontrado')) {
            errorTitle = '💳 Método de Pago No Válido';
            errorDescription = 'El método de pago seleccionado no está disponible. Selecciona otro método.';
          } else if (backendMessage.includes('Producto no encontrado')) {
            errorTitle = '📦 Producto No Encontrado';
            errorDescription = 'Uno o más productos no están disponibles en el inventario.';
          } else {
            // Usar el mensaje del backend si es específico
            errorDescription = backendMessage;
          }
        } else if (error.message) {
          // Errores de red o conexión
          if (error.message.includes('Network Error') || error.message.includes('timeout')) {
            errorTitle = '🌐 Error de Conexión';
            errorDescription = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
          } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
            errorTitle = '🔐 Sesión Expirada';
            errorDescription = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
          }
        }
        
        toast({
          title: errorTitle,
          description: errorDescription,
          variant: 'destructive',
        });
      }
    },
    [cart, user, toast, queryClient, mesaNumero, tipoServicio, refetchVentas, selectedBranch, user?.sucursal?.nombre, selectedBranchId]
  );

  /**
   * Maneja el cierre de sesión del usuario.
   */
  const handleLogout = useCallback(() => {
    logout(); // Llama a la función de logout del contexto de autenticación
    setCart([]); // Limpia el carrito al cerrar sesión
    setActiveTab('pos'); // Vuelve a la pestaña POS
    toast({
      title: '👋 Hasta luego',
      description: 'Sesión cerrada correctamente.',
    });
  }, [logout, toast]);

  /**
   * Actualiza una venta existente en el estado local.
   * @param editedSale - La venta con los cambios aplicados.
   */
  const handleEditSale = useCallback(
    (editedSale: Sale) => {
      // setSales((currentSales) => currentSales.map((sale) => (sale.id === editedSale.id ? editedSale : sale))); // Eliminado: sales ahora es de React Query
      toast({
        title: '✏️ Venta Actualizada',
        description: 'Los cambios han sido guardados.',
      });
    },
    [toast]
  );

  /**
   * Elimina una venta del estado local.
   * @param saleId - El ID de la venta a eliminar.
   */
  const handleDeleteSale = useCallback(
    (saleId: string) => {
      // setSales((currentSales) => currentSales.filter((sale) => sale.id !== saleId)); // Eliminado: sales ahora es de React Query
      toast({
        title: '🗑️ Venta Eliminada',
        description: 'La venta ha sido removida del sistema.',
        variant: 'destructive',
      });
    },
    [toast]
  );

  // --- Mutaciones de React Query ---

  const { mutate: updateOrderStatusMutation } = useMutation({
    mutationFn: ({ orderId, status, id_restaurante }: { orderId: string; status: Order['status']; id_restaurante: number }) =>
      updateOrderStatus(orderId, status, id_restaurante), // Asume que tienes esta función en api.ts
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders-pos'] });
      toast({
        title: '✅ Estado Actualizado',
        description: 'El estado del pedido se ha actualizado correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Error al Actualizar',
        description: error?.message || 'No se pudo actualizar el estado del pedido.',
        variant: 'destructive',
      });
    },
  });

  /**
   * Actualiza el estado de una orden en el estado local.
   * También podría enviar esta actualización al backend si la gestión de órdenes es bidireccional.
   * @param orderId - El ID de la orden a actualizar.
   * @param status - El nuevo estado de la orden.
   */
  const handleUpdateOrderStatus = useCallback((orderId: string, status: Order['status']) => {
    updateOrderStatusMutation({ orderId, status, id_restaurante: user?.id_restaurante });
  }, [updateOrderStatusMutation, user?.id_restaurante]);

  /**
   * Exporta las ventas del día actual a un archivo CSV.
   */
  const exportDailySales = useCallback(() => {
    const today = new Date().toDateString();
    const todaySales = sales.filter(
      (sale) => new Date(sale.timestamp).toDateString() === today
    );

    if (todaySales.length === 0) {
      toast({
        title: '📊 Sin Datos para Exportar',
        description: 'No hay ventas registradas para el día de hoy.',
        variant: 'destructive',
      });
      return;
    }

    const filename = `ventas_menta_restobar_${new Date().toISOString().split('T')[0]}.csv`;
    exportSalesToCSV(todaySales, filename);

    toast({
      title: '📁 Exportación Exitosa',
      description: `Archivo "${filename}" descargado correctamente.`,
    });
  }, [sales, toast]);

  // --- Lógica para el Manejo de Pestañas ---

  /**
   * Maneja el cambio de la pestaña principal.
   * Restringe la navegación para el rol 'cocinero' solo a la pestaña 'orders'.
   */
  const handleTabChange = useCallback(
    (value: string) => {
      if (user?.rol === 'cocinero' && value !== 'orders') {
        // Los cocineros solo pueden ver la pestaña de órdenes
        toast({
          title: 'Acceso Restringido',
          description: 'Tu rol no permite acceder a esta sección.',
          variant: 'destructive',
        });
        return;
      }
      setActiveTab(value);
      // Al cambiar de pestaña principal, siempre resetear la sub-pestaña del Dashboard a 'summary'
      if (value === 'dashboard') {
        setActiveDashboardSubTab('summary');
      }
    },
    [user?.rol, toast]
  );

  /**
   * Maneja el click en una sub-pestaña del Dashboard.
   */
  const handleDashboardSubTabChange = useCallback((subTab: string) => {
    setActiveDashboardSubTab(subTab);
  }, []);

  // --- Efectos de Componente ---

  // SOLUCIÓN: Deriva `orders` directamente de `backendOrders` usando `useMemo`.
  // Esto evita el estado local redundante y el bucle de re-renderizado.
  const orders = useMemo(() => {
    return (filteredOrders || []).map(mapBackendOrderToOrder);
  }, [filteredOrders, mapBackendOrderToOrder]);

  // useEffect para hidratar ventas desde el backend al abrir la pestaña 'sales'
  useEffect(() => {
    if (activeTab === 'sales' && user?.username) {
      getVentasOrdenadas(100).then((ventas) => {
        let ventasFiltradas = ventas;
        if (user.rol === 'cajero') {
          ventasFiltradas = ventas.filter((v: any) =>
            v.vendedor_nombre === user.username ||
            v.cashier === user.username ||
            v.username === user.username
          );
        }
        // setSales( // Eliminado: sales ahora es de React Query
        //   ventasFiltradas.map((v: any) => ({
        //     id: v.id_venta?.toString() || v.id?.toString() || '',
        //     items: v.productos || [], // Ajustar si es necesario
        //     paymentMethod: v.metodo_pago || v.paymentMethod || '',
        //     timestamp: v.fecha ? new Date(v.fecha) : new Date(),
        //     cashier: v.vendedor_nombre || v.cashier || user.username,
        //     branch: v.sucursal_nombre || v.branch || '',
        //     mesa_numero: v.mesa_numero || null,
        //     tipo_servicio: v.tipo_servicio || '',
        //     total: parseFloat(v.total),
        //   }))
        // );
      });
    }
  }, [activeTab, user?.username, user?.rol]);

  // Opcional: Forzar sub-pestaña a 'mesas' si el rol es cajero
  useEffect(() => {
    if (onlyMesas) {
      setActiveDashboardSubTab('mesas');
    }
  }, [onlyMesas]);

  // --- Renderizado Condicional Basado en el Rol del Usuario ---

  // Si el usuario no está autenticado, no renderiza el POS (esto es manejado por Index.tsx)
  if (!user) {
    return null; // Podrías mostrar un spinner de carga aquí si es necesario.
  }

  // Si el usuario es 'cocinero', solo muestra la vista de cocina
  if (user.rol === 'cocinero') {
      return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header
        currentUser={{
          username: user.username,
          role: user.rol,
          branch: user.sucursal?.id?.toString() || 'N/A',
        }}
        currentBranch={
          user.sucursal
            ? {
                id: user.sucursal.id.toString(),
                name: user.sucursal.nombre,
                location: `${user.sucursal.ciudad} - ${user.sucursal.direccion}`,
              }
            : undefined
        }
        salesCount={sales.length}
        onExportSales={exportDailySales}
        onLogout={handleLogout}
      />
      <main className="p-6">
        {/* La vista de KitchenView debería consultar pedidos directamente del backend */}
        <KitchenView />
      </main>
    </div>
  );
  }

  // Información de la sucursal actual para el Header
  const currentBranch = selectedBranch
    ? {
        id: selectedBranch.id_sucursal?.toString() || selectedBranch.id?.toString() || 'N/A',
        name: selectedBranch.nombre || selectedBranch.name,
        location: `${selectedBranch.ciudad || selectedBranch.location || ''} ${selectedBranch.direccion ? '- ' + selectedBranch.direccion : ''}`,
      }
    : user.sucursal
    ? {
        id: user.sucursal.id?.toString() || 'N/A',
        name: user.sucursal.nombre,
        location: `${user.sucursal.ciudad} - ${user.sucursal.direccion}`,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Encabezado Principal del Sistema */}
      <Header
        currentUser={{
          username: user.username,
          role: user.rol,
          branch: currentBranch?.id || 'N/A',
        }}
        currentBranch={currentBranch}
        salesCount={sales.length}
        onExportSales={exportDailySales}
        onLogout={handleLogout}
        branches={isAdmin ? branches.map(b => ({ 
          id: Number(b.id_sucursal), 
          name: b.nombre, 
          location: `${b.ciudad || ''} ${b.direccion ? '- ' + b.direccion : ''}` 
        } as any)) : undefined}
        selectedBranchId={selectedBranchId ?? undefined}
        onSucursalChange={isAdmin ? handleSucursalChange : undefined}
      />

      {/* Navegación de Pestañas Principales */}
      <nav className="border-b bg-white px-6 shadow-sm">
        <div className="flex flex-row gap-2">
          <Button
            variant={activeTab === 'pos' ? 'default' : 'outline'}
            onClick={() => handleTabChange('pos')}
            className="rounded-t-lg"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Punto de Venta
          </Button>
          <Button
            variant={activeTab === 'orders' ? 'default' : 'outline'}
            onClick={() => handleTabChange('orders')}
            className="rounded-t-lg"
          >
            <ClipboardList className="h-5 w-5 mr-2" />
            Pedidos
          </Button>
          {(user.rol === 'admin' || user.rol === 'cajero' || user.rol === 'cocinero' || user.rol === 'super_admin') && (
            <Button
              variant={activeTab === 'sales' ? 'default' : 'outline'}
              onClick={() => handleTabChange('sales')}
              className="rounded-t-lg"
            >
              <FileText className="h-5 w-5 mr-2" />
              Historial de Ventas
            </Button>
          )}
          {showAdminFeatures && (
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'outline'}
              onClick={() => handleTabChange('dashboard')}
              className="rounded-t-lg"
            >
              <LayoutDashboard className="h-5 w-5 mr-2" />
              Dashboard
            </Button>
          )}
        </div>
      </nav>

      {/* Navegación de Pestañas de Administración (Secundarias) - SOLO SI activeTab es 'dashboard' */}
      {activeTab === 'dashboard' && showAdminFeatures && (
        <nav className="border-b bg-gray-50 px-6 py-2 shadow-inner">
          <div className="flex flex-row gap-2">
            <Button
              variant={activeDashboardSubTab === 'summary' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDashboardSubTabChange('summary')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Resumen
            </Button>
            <Button
              variant={activeDashboardSubTab === 'products' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDashboardSubTabChange('products')}
            >
              <Package className="h-4 w-4 mr-2" />
              Productos
            </Button>
            <Button
              variant={activeDashboardSubTab === 'users' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDashboardSubTabChange('users')}
            >
              <Users className="h-4 w-4 mr-2" />
              Usuarios
            </Button>
            <Button
              variant={activeDashboardSubTab === 'mesas' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDashboardSubTabChange('mesas')}
            >
              <UtensilsCrossed className="h-4 w-4 mr-2" />
              Mesas
            </Button>
            {user.rol === 'admin' && (
              <Button
                variant={activeDashboardSubTab === 'categorias' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDashboardSubTabChange('categorias')}
              >
                <Tag className="h-4 w-4 mr-2" />
                Categorías
              </Button>
            )}
            {(user.rol === 'admin' || user.rol === 'super_admin') && (
              <Button
                variant={activeDashboardSubTab === 'sucursales' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDashboardSubTabChange('sucursales')}
              >
                <Building className="h-4 w-4 mr-2" />
                Sucursales
              </Button>
            )}
            {(user.rol === 'admin' || user.rol === 'super_admin') && (
              <Button
                variant={activeDashboardSubTab === 'membresia' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDashboardSubTabChange('membresia')}
              >
                <Tag className="h-4 w-4 mr-2" />
                Membresía
              </Button>
            )}
          </div>
        </nav>
      )}

      {/* Contenido Principal de la Aplicación */}
      <main className="flex flex-1 p-6 gap-6 overflow-hidden">
        {/* Contenido de las Pestañas */}
        <div className="flex-1 overflow-auto pr-2">
          {/* Vista de Punto de Venta (POS) */}
          {activeTab === 'pos' && (
            <div className="flex flex-col gap-4 px-4 md:px-8 mt-4">
              {/* Buscador de productos - ahora en una fila aparte y espacioso */}
              <div className="w-full mb-2 mt-4">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Buscar productos por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-base w-full"
                  />
                </div>
              </div>
              {/* Filtros de categoría */}
              <div className="w-full flex flex-wrap gap-2 items-center justify-start">
                <CategoryFilter
                  selectedCategory={selectedCategory}
                  onSelectCategory={(categoryId: string) => setSelectedCategory(categoryId)}
                  categories={categories}
                  isLoading={isLoadingCategories}
                />
              </div>
              {/* Grid de productos */}
              {isLoadingProducts ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-pulse">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Card key={i} className="h-48 w-full bg-gray-200 rounded-lg" />
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                  ))}
                </div>
              ) : (
                <Card className="mt-8">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-xl font-semibold">No se encontraron productos</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Intenta ajustar tu búsqueda o filtros de categoría.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Vista de Gestión de Pedidos */}
          {activeTab === 'orders' && (
            <div className="flex flex-col gap-4 px-4 md:px-8 mt-4">
              <OrderManagement
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                userRole={user.rol}
              />
            </div>
          )}

          {/* Vista de Historial de Ventas */}
          {activeTab === 'sales' && (user.rol === 'admin' || user.rol === 'cajero' || user.rol === 'cocinero' || user.rol === 'super_admin') && (
            <div className="flex flex-col gap-4 px-4 md:px-8 mt-4">
              <SalesHistory
                sales={sales}
                onEditSale={handleEditSale}
                onDeleteSale={handleDeleteSale}
                userRole={user.rol}
              />
            </div>
          )}

          {/* Vistas de Administración (dentro del Dashboard) */}
          {activeTab === 'dashboard' && showAdminFeatures && (
            <div className="space-y-8 w-full"> {/* Añadir w-full para que ocupe todo el ancho */}
              {onlyMesas ? (
                // Solo cajero: solo ve la gestión de mesas
                <MesaManagement sucursalId={selectedBranchId || user.sucursal?.id || 1} idRestaurante={user.id_restaurante} />
              ) : (
                // Admin y gerente: ven todas las sub-pestañas
                <>
              {activeDashboardSubTab === 'summary' && (
                <div className="px-4 md:px-8 mt-4 pb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Panel de Control General</h2>
                  <p className="text-gray-600 mb-6">Visualiza métricas clave y el rendimiento de tu negocio.</p>
                  <DashboardStats sales={sales} orders={orders} products={products} /> {/* Pasa orders aquí */}
                  {/* Aquí se pueden añadir más gráficos o componentes de resumen */}
                </div>
              )}
              {activeDashboardSubTab === 'products' && (
                <div className="px-4 md:px-8 mt-4 pb-8">
                  <ProductManagement products={products} categories={categories} currentUserRole={user.rol} idRestaurante={user.id_restaurante} />
                </div>
              )}
              {activeDashboardSubTab === 'users' && (
                <div className="px-4 md:px-8 mt-4 pb-8">
                  <UserManagement />
                </div>
              )}
              {activeDashboardSubTab === 'mesas' && (
                    <div className="px-4 md:px-8 mt-4 pb-8">
                      <MesaManagement sucursalId={selectedBranchId || user.sucursal?.id || 1} idRestaurante={user.id_restaurante} />
                    </div>
                  )}
              {activeDashboardSubTab === 'categorias' && (
                <div className="px-4 md:px-8 mt-4 pb-8">
                  <CategoryList />
                </div>
              )}
              {activeDashboardSubTab === 'sucursales' && (user.rol === 'admin' || user.rol === 'super_admin') && (
                <div className="px-4 md:px-8 mt-4 pb-8">
                  <SucursalManagement currentUserRole={user.rol} />
                </div>
              )}
              {activeDashboardSubTab === 'membresia' && (
                <div className="px-4 md:px-8 mt-4 pb-8">
                  <Membresia />
                </div>
              )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Panel del Carrito de Compras y Opciones de Servicio SOLO en POS */}
        {activeTab === 'pos' && (
          <aside className="w-96 bg-white p-6 rounded-lg shadow-lg flex flex-col justify-between">
            <div>
              <Cart
                items={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                onCheckout={() => setShowCheckout(true)}
              />

              <div className="mt-6 space-y-4">
                {/* Selector de Tipo de Servicio */}
                <div>
                  <label htmlFor="service-type" className="block text-sm font-semibold text-gray-800 mb-2">
                    Tipo de Servicio
                  </label>
                  <select
                    id="service-type"
                    value={tipoServicio}
                    onChange={(e) => {
                      const newTipo = e.target.value as 'Mesa' | 'Delivery' | 'Para Llevar';
                      setTipoServicio(newTipo);
                      if (newTipo !== 'Mesa') {
                        setMesaNumero(null); // Limpiar número de mesa si no es servicio de mesa
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
                  >
                    <option value="Mesa">🍽️ En Mesa</option>
                    <option value="Delivery">🚚 Delivery (Entrega a domicilio)</option>
                    <option value="Para Llevar">📦 Para Llevar (Cliente recoge)</option>
                  </select>
                </div>

                {/* Input de Número de Mesa (Condicional) */}
                {tipoServicio === 'Mesa' && (
                  <div>
                    <label htmlFor="mesa-numero" className="block text-sm font-semibold text-gray-800 mb-2">
                      Número de Mesa <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="mesa-numero"
                      type="number"
                      placeholder="Ej. 5"
                      value={mesaNumero === null ? '' : mesaNumero}
                      onChange={(e) => setMesaNumero(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      required
                      min="1"
                    />
                  </div>
                )}

                {/* Indicadores de Tipo de Servicio */}
                {tipoServicio === 'Delivery' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                    <span className="text-2xl">🚚</span>
                    <div>
                      <p className="text-sm text-blue-800 font-bold">Servicio a Domicilio</p>
                      <p className="text-xs text-blue-600">Prepara el pedido para ser enviado al cliente.</p>
                    </div>
                  </div>
                )}
                {tipoServicio === 'Para Llevar' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <span className="text-2xl">🛍️</span>
                    <div>
                      <p className="text-sm text-green-800 font-bold">Para Recoger en Local</p>
                      <p className="text-xs text-green-600">El cliente pasará a recoger su pedido.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* Modals Globales */}
      {showCheckout && (
        <CheckoutModal
          items={cart}
          onConfirmSale={confirmSale}
          onCancel={() => setShowCheckout(false)}
          mesaNumero={mesaNumero}
        />
      )}
      {selectedInvoice && <InvoiceModal sale={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
    </div>
  );
}