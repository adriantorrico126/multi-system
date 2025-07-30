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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  BarChart3, 
  FileText, 
  Users, 
  ShoppingCart, 
  ClipboardList, 
  Package, 
  UtensilsCrossed, 
  LayoutDashboard, 
  Building, 
  Tag, 
  LogOut, 
  Clock,
  Settings,
  Activity,
  TrendingUp,
  DollarSign,
  User,
  Shield,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportSalesToCSV } from '@/utils/csvExport';
import { getProducts, getCategories, getKitchenOrders, createSale, refreshInventory, updateOrderStatus, getBranches, getVentasOrdenadas, getMesas, editSale, deleteSale } from '@/services/api';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { KitchenView } from '../../pages/KitchenView';
import { MesasMesero } from './MesasMesero';
import { PedidosPendientesCajero } from './PedidosPendientesCajero';
import { MesaMap } from './index';
import { useTheme } from '@/context/ThemeContext';
import { Switch } from '@/components/ui/switch';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { PedidosMeseroCajero } from './PedidosMeseroCajero';

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
  priority: 'normal' | 'high';
}

/**
 * `POSSystem` es el componente principal del Punto de Venta.
 * Gestiona el estado de la aplicación, las interacciones con el usuario y la comunicación con el backend.
 * Utiliza React Query para la gestión de datos asíncronos y Context API para la autenticación.
 */
export function POSSystem() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const [now, setNow] = React.useState(dayjs());
  
  React.useEffect(() => {
    const interval = setInterval(() => setNow(dayjs()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  // Estado para sucursal seleccionada (solo admin/gerente)
  const { data: branches = [], isLoading: branchesLoading } = useQuery({ queryKey: ['branches'], queryFn: getBranches });
  const isAdmin = user.rol === 'admin' || user.rol === 'super_admin';
  const [selectedBranchId, setSelectedBranchId] = React.useState<number | null>(null);

  // Debug logs para verificar la estructura de branches
  React.useEffect(() => {
    console.log('🔍 Branches Debug - branches:', branches);
    console.log('🔍 Branches Debug - branchesLoading:', branchesLoading);
    console.log('🔍 Branches Debug - branches structure:', branches.map(b => ({
      id: b.id,
      id_sucursal: b.id_sucursal,
      nombre: b.nombre,
      name: b.name,
      ciudad: b.ciudad,
      location: b.location
    })));
  }, [branches, branchesLoading]);

  // Al iniciar, setear sucursal seleccionada a la del usuario (o la primera si es admin)
  React.useEffect(() => {
    console.log('🔄 Inicializando sucursal - isAdmin:', isAdmin, 'branches:', branches.length, 'user.sucursal:', user.sucursal, 'branchesLoading:', branchesLoading);
    
    // No inicializar hasta que branches se haya cargado
    if (branchesLoading) {
      console.log('⏳ Esperando a que se carguen las sucursales...');
      return;
    }
    
    if (isAdmin && branches.length > 0) {
      const savedSucursalId = localStorage.getItem('selectedSucursalId');
      if (savedSucursalId) {
        const parsedId = parseInt(savedSucursalId);
        // Verificar que la sucursal guardada existe en la lista actual
        const branchExists = branches.find(b => b.id_sucursal === parsedId || b.id === parsedId);
        if (branchExists) {
          setSelectedBranchId(parsedId);
          console.log('✅ Sucursal restaurada desde localStorage:', parsedId);
        } else {
          // Si la sucursal guardada no existe, usar la primera disponible
          const firstBranchId = branches[0].id_sucursal ?? branches[0].id;
          setSelectedBranchId(firstBranchId);
          localStorage.setItem('selectedSucursalId', firstBranchId.toString());
          console.log('✅ Sucursal cambiada a primera disponible:', firstBranchId);
        }
      } else {
        // Si no hay sucursal guardada, usar la primera disponible
        const firstBranchId = branches[0].id_sucursal ?? branches[0].id;
        setSelectedBranchId(firstBranchId);
        localStorage.setItem('selectedSucursalId', firstBranchId.toString());
        console.log('✅ Sucursal inicializada a primera disponible:', firstBranchId);
      }
    } else if (user.sucursal?.id) {
      // Para usuarios no-admin, usar su sucursal asignada
      setSelectedBranchId(user.sucursal.id);
      console.log('✅ Sucursal del usuario:', user.sucursal.id);
    }
  }, [isAdmin, branches, user.sucursal?.id, branchesLoading]);

  // Función para manejar el cambio de sucursal
  const handleSucursalChange = React.useCallback((newSucursalId: number) => {
    setSelectedBranchId(newSucursalId);
    localStorage.setItem('selectedSucursalId', newSucursalId.toString());
    
    queryClient.invalidateQueries({ queryKey: ['mesas', user?.id_restaurante] });
    queryClient.invalidateQueries({ queryKey: ['estadisticas-mesas', user?.id_restaurante] });
    queryClient.invalidateQueries({ queryKey: ['ventas', user?.id_restaurante] });
    queryClient.invalidateQueries({ queryKey: ['users', user?.id_restaurante] });
    queryClient.invalidateQueries({ queryKey: ['products', user?.id_restaurante] });
    queryClient.invalidateQueries({ queryKey: ['categories', user?.id_restaurante] });
    
    window.dispatchEvent(new CustomEvent('sucursal-changed', { 
      detail: { sucursalId: newSucursalId } 
    }));
    
    console.log('🔄 Sucursal cambiada a:', newSucursalId);
  }, [queryClient, user?.id_restaurante]);

  // Sucursal seleccionada (objeto)
  const selectedBranch = React.useMemo(() => {
    if (!selectedBranchId) return undefined;
    const branch = branches.find(b => b.id_sucursal === selectedBranchId || b.id === selectedBranchId);
    console.log('🔍 selectedBranch Debug - selectedBranchId:', selectedBranchId, 'branch:', branch);
    return branch;
  }, [branches, selectedBranchId]);

  // Obtener la lista de mesas disponibles para la sucursal seleccionada
  const { data: mesas = [] } = useQuery({
    queryKey: ['mesas', selectedBranchId],
    queryFn: () => getMesas(selectedBranchId),
    enabled: !!selectedBranchId,
  });

  // Determina si el usuario solo puede ver mesas (cajero)
  const onlyMesas = user.rol === 'cajero';
  // Determina si se deben mostrar las pestañas de administración
  const showAdminFeatures = user.rol === 'admin' || user.rol === 'cajero' || user.rol === 'cocinero' || user.rol === 'super_admin';

  // --- Estado Local del Componente ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState('pos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
  const [mesaNumero, setMesaNumero] = useState<number | null>(null);
  const [tipoServicio, setTipoServicio] = useState<'Mesa' | 'Delivery' | 'Para Llevar'>('Mesa');
  const [activeDashboardSubTab, setActiveDashboardSubTab] = useState<string>('summary');

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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Obtener categorías de productos
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['categories', user?.id_restaurante],
    queryFn: getCategories,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Obtener pedidos para la vista de cocina/gestión de pedidos
  const canViewOrders = user.rol === 'cocinero' || user.rol === 'admin' || user.rol === 'cajero';
  const {
    data: backendOrders = [],
    isError: isErrorOrders,
  } = useQuery({
    queryKey: ['orders-pos'],
    queryFn: getKitchenOrders,
    refetchInterval: 5000,
    enabled: !!user && canViewOrders,
    refetchOnWindowFocus: true,
    staleTime: 3000,
  });

  // Filtrar pedidos para el cajero: solo los de su sucursal
  const filteredOrders = React.useMemo(() => {
    if (user.rol === 'cajero') {
      return (backendOrders || []).filter((order: any) => {
        const orderSucursalId = parseInt(order.id_sucursal) || parseInt(order.sucursal_id);
        const userSucursalId = parseInt(user.sucursal?.id);
        return orderSucursalId === userSucursalId;
      });
    }
    return backendOrders || [];
  }, [backendOrders, user.rol, user.sucursal?.id]);

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

      if (tipoServicio === 'Mesa') {
        const mesaObj = mesas.find((m: any) => m.numero === mesaNumero);
        console.log('Mesas disponibles:', mesas);
        console.log('Número de mesa seleccionado:', mesaNumero, 'Tipo:', typeof mesaNumero);
        if (!mesaObj) {
          toast({
            title: '❌ Mesa no encontrada',
            description: `La mesa número ${mesaNumero} no existe en la sucursal seleccionada.`,
            variant: 'destructive',
          });
          return;
        }
        if (typeof mesaNumero !== 'number' || isNaN(mesaNumero) || mesaNumero < 1) {
          toast({
            title: '❌ Número de mesa inválido',
            description: 'El número de mesa debe ser un número válido mayor a 0.',
            variant: 'destructive',
          });
          return;
        }
      }
      // Log del payload antes de enviar
      console.log('Payload a enviar:', {
        items: cart.map((item) => ({
          id: item.originalId || item.id,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes,
          modificadores: item.modificadores || []
        })),
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        paymentMethod,
        cashier: user?.username || 'Desconocido',
        id_sucursal: selectedBranchId!,
        mesa_numero: tipoServicio === 'Mesa' ? mesaNumero : null,
        tipo_servicio: tipoServicio,
        invoiceData,
      });

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

      // Buscar el id_mesa correspondiente al número de mesa seleccionado
      let idMesaSeleccionada: number | undefined = undefined;
      if (tipoServicio === 'Mesa' && mesaNumero && Array.isArray(mesas)) {
        const mesaObj = mesas.find((m: any) => m.numero === mesaNumero);
        if (mesaObj) idMesaSeleccionada = mesaObj.id_mesa;
      }

      try {
        // Log del payload antes de enviar
        console.log('POSSystem: Payload enviado a createSale:', {
          items: cart.map((item) => ({
            id: item.originalId || item.id,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
            modificadores: item.modificadores || []
          })),
          total: newSale.total,
          paymentMethod,
          cashier: newSale.cashier,
          id_sucursal: selectedBranchId!,
          mesa_numero: newSale.mesa_numero,
          // id_mesa: idMesaSeleccionada, // <-- ELIMINADO
          tipo_servicio: tipoServicio,
          invoiceData,
        });
        // Envía la venta al backend
        const backendResponse = await createSale({
          items: cart.map((item) => ({
            id: item.originalId || item.id,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
            modificadores: item.modificadores || []
          })),
          total: newSale.total,
          paymentMethod,
          cashier: newSale.cashier,
          id_sucursal: selectedBranchId!,
          mesa_numero: newSale.mesa_numero,
          // id_mesa: idMesaSeleccionada, // <-- ELIMINADO
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
          // Nueva línea: Invalida todas las queries de prefactura para actualización automática
          queryClient.invalidateQueries({ queryKey: ['prefactura'], exact: false });
          console.log('Frontend: Inventory, orders, mesas, and prefactura refreshed after sale');
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
        if (error.response?.data) {
          console.error('Backend error message:', error.response.data.message);
          console.error('Backend error details:', error.response.data.details);
        }
        // Manejar errores específicos del backend
        let errorTitle = '❌ Error al Registrar Venta';
        let errorDescription = 'No se pudo registrar la venta en el sistema. Intenta nuevamente.';
        if (error.response?.data?.message) {
          errorDescription = error.response.data.message;
          if (error.response?.data?.details) {
            errorDescription += ' ' + error.response.data.details;
          }
        }
        
        toast({
          title: errorTitle,
          description: errorDescription,
          variant: 'destructive',
        });
      }
    },
    [cart, user, toast, queryClient, mesaNumero, tipoServicio, refetchVentas, selectedBranch, user?.sucursal?.nombre, selectedBranchId, mesas]
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

  // Mutación para editar venta
  const editSaleMutation = useMutation({
    mutationFn: ({ saleId, saleData }: { saleId: string; saleData: any }) => editSale(saleId, saleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({
        title: '✏️ Venta Actualizada',
        description: 'Los cambios han sido guardados correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Error al Actualizar',
        description: error?.response?.data?.message || 'No se pudo actualizar la venta.',
        variant: 'destructive',
      });
    },
  });

  // Mutación para eliminar venta
  const deleteSaleMutation = useMutation({
    mutationFn: (saleId: string) => deleteSale(saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({
        title: '🗑️ Venta Eliminada',
        description: 'La venta ha sido eliminada correctamente.',
        variant: 'destructive',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Error al Eliminar',
        description: error?.response?.data?.message || 'No se pudo eliminar la venta.',
        variant: 'destructive',
      });
    },
  });

  /**
   * Actualiza una venta existente.
   * @param editedSale - La venta con los cambios aplicados.
   */
  const handleEditSale = useCallback(
    (editedSale: Sale) => {
      const saleData = {
        items: editedSale.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        })),
        total: editedSale.total,
        paymentMethod: editedSale.paymentMethod,
        notes: editedSale.notes || ''
      };
      
      editSaleMutation.mutate({ saleId: editedSale.id, saleData });
    },
    [editSaleMutation]
  );

  /**
   * Elimina una venta.
   * @param saleId - El ID de la venta a eliminar.
   */
  const handleDeleteSale = useCallback(
    (saleId: string) => {
      deleteSaleMutation.mutate(saleId);
    },
    [deleteSaleMutation]
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

  // Determinar la sucursal actual para el Header
  const currentBranchForHeader = React.useMemo(() => {
    const branch = selectedBranch
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
    
    console.log('🔍 currentBranchForHeader Debug - selectedBranch:', selectedBranch, 'user.sucursal:', user.sucursal, 'result:', branch);
    return branch;
  }, [selectedBranch, user.sucursal]);

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

  // Si el usuario es mesero, mostrar el mapa visual de mesas como vista principal
  if (user.rol === 'mesero') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 flex flex-col">
        <header className="flex items-center justify-between px-6 py-3 border-b bg-white/90 dark:bg-gray-900/90 shadow-sm">
          <div className="flex items-center gap-4">
            <img src="/logos/logo.jpg" alt="Logo" className="w-10 h-10 rounded-full shadow-md" />
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-gray-900 dark:text-white">DATY</span>
              <span className="text-xs text-gray-500 dark:text-gray-300">Sistema POS Profesional</span>
            </div>
            <div className="ml-6 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 flex flex-col shadow-sm">
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{user.sucursal?.nombre || 'Sucursal'}</span>
              <span className="text-xs text-gray-500 dark:text-gray-300">{user.sucursal?.ciudad} - {user.sucursal?.direccion}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-bold shadow">{user.nombre}</span>
            <span className="px-2 py-1 rounded-md bg-pink-100 text-pink-700 text-xs font-bold shadow">Mesero</span>
            <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-mono shadow flex items-center gap-1"><Clock className="w-4 h-4" />{now.locale('es').format('HH:mm')}</span>
            <span className="text-sm">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} aria-label="Toggle dark mode" />
            <button
              onClick={logout}
              className="ml-2 px-3 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white flex items-center gap-1 text-sm font-semibold transition-colors shadow"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <MesaMap />
        </main>
      </div>
    );
  }
  
  // Renderizar el header global solo si el rol NO es mesero
  const showHeader = user.rol !== 'mesero';
  
  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col overflow-hidden">
      {showHeader && !branchesLoading ? (
        <Header
          currentUser={{
            username: user.username,
            role: user.rol,
            branch: user.sucursal?.nombre || ''
          }}
          currentBranch={currentBranchForHeader}
          salesCount={sales.length}
          onExportSales={() => exportSalesToCSV(sales)}
          onLogout={logout}
          branches={branches}
          selectedBranchId={selectedBranchId ?? undefined}
          onSucursalChange={isAdmin ? handleSucursalChange : undefined}
        />
      ) : showHeader && branchesLoading ? (
        <div className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/30 border-b border-gray-200/50 shadow-lg backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl shadow-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">DATY</h1>
                <p className="text-sm text-gray-600 font-medium">Cargando sucursales...</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Navegación de Pestañas Principales */}
      <nav className="border-b border-gray-200/50 bg-white/80 backdrop-blur-sm px-6 py-3 shadow-lg flex-shrink-0">
        <div className="flex flex-row gap-3">
          <Button
            variant={activeTab === 'pos' ? 'default' : 'outline'}
            onClick={() => handleTabChange('pos')}
            className="rounded-xl transition-all duration-200"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Punto de Venta
          </Button>
          <Button
            variant={activeTab === 'orders' ? 'default' : 'outline'}
            onClick={() => handleTabChange('orders')}
            className="rounded-xl transition-all duration-200"
          >
            <ClipboardList className="h-5 w-5 mr-2" />
            Pedidos
          </Button>
          {user.rol === 'cajero' && (
            <Button
              variant={activeTab === 'mesero' ? 'default' : 'outline'}
              onClick={() => handleTabChange('mesero')}
              className="rounded-xl transition-all duration-200"
            >
              <Users className="h-5 w-5 mr-2" />
              Mesero
            </Button>
          )}
          {user.rol === 'cajero' && (
            <Button
              variant={activeTab === 'pedidos-pendientes' ? 'default' : 'outline'}
              onClick={() => handleTabChange('pedidos-pendientes')}
              className="rounded-xl transition-all duration-200"
            >
              <Clock className="h-5 w-5 mr-2" />
              Pedidos Pendientes
            </Button>
          )}
          {(user.rol === 'admin' || user.rol === 'cajero' || user.rol === 'cocinero' || user.rol === 'super_admin') && (
            <Button
              variant={activeTab === 'sales' ? 'default' : 'outline'}
              onClick={() => handleTabChange('sales')}
              className="rounded-xl transition-all duration-200"
            >
              <FileText className="h-5 w-5 mr-2" />
              Historial de Ventas
            </Button>
          )}
          {showAdminFeatures && (
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'outline'}
              onClick={() => handleTabChange('dashboard')}
              className="rounded-xl transition-all duration-200"
            >
              <LayoutDashboard className="h-5 w-5 mr-2" />
              Dashboard
            </Button>
          )}
        </div>
      </nav>

      {/* Navegación de Pestañas de Administración (Secundarias) */}
      {activeTab === 'dashboard' && showAdminFeatures && (
        <nav className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm px-6 py-3 shadow-inner flex-shrink-0">
          <div className="flex flex-row gap-3">
            <Button
              variant={activeDashboardSubTab === 'summary' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDashboardSubTabChange('summary')}
              className="rounded-lg transition-all duration-200"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Resumen
            </Button>
            <Button
              variant={activeDashboardSubTab === 'products' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDashboardSubTabChange('products')}
              className="rounded-lg transition-all duration-200"
            >
              <Package className="h-4 w-4 mr-2" />
              Productos
            </Button>
                        <Button
              variant={activeDashboardSubTab === 'users' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDashboardSubTabChange('users')}
              className="rounded-lg transition-all duration-200"
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
      <main className="flex flex-1 overflow-hidden">
        {/* Contenido de las Pestañas */}
        <div className="flex-1 overflow-auto">
          {/* Vista de Punto de Venta (POS) */}
          {activeTab === 'pos' && (
            <div className="flex flex-col h-full p-6">
              {/* Buscador de productos */}
              <div className="w-full mb-4">
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
              <div className="w-full flex flex-wrap gap-2 items-center justify-start mb-6">
                <CategoryFilter
                  selectedCategory={selectedCategory}
                  onSelectCategory={(categoryId: string) => setSelectedCategory(categoryId)}
                  categories={categories}
                  isLoading={isLoadingCategories}
                />
              </div>
              
              {/* Grid de productos */}
              <div className="w-full">
                {isLoadingProducts ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-pulse">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Card key={i} className="h-48 w-full bg-gray-200 rounded-lg" />
                    ))}
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                      ))}
                    </div>
                    
                    {/* Indicador de scroll cuando hay muchos productos */}
                    {filteredProducts.length > 15 && (
                      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                        <span className="text-blue-600">📜</span>
                        <p className="text-sm text-blue-700">
                          <strong>Tip:</strong> Usa el scroll para ver todos los productos ({filteredProducts.length} productos encontrados)
                        </p>
                      </div>
                    )}
                  </>
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
            </div>
          )}

          {/* Vista de Gestión de Pedidos */}
          {activeTab === 'orders' && (
            <div className="p-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl p-6">
                <OrderManagement
                  orders={orders}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  userRole={user.rol}
                />
              </div>
            </div>
          )}

          {/* Vista de Historial de Ventas */}
          {activeTab === 'sales' && (user.rol === 'admin' || user.rol === 'cajero' || user.rol === 'cocinero' || user.rol === 'super_admin') && (
            <div className="p-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl h-full">
                <SalesHistory
                  sales={sales}
                  onDeleteSale={handleDeleteSale}
                  userRole={user.rol}
                />
              </div>
            </div>
          )}

          {/* Vistas de Administración (dentro del Dashboard) */}
          {activeTab === 'dashboard' && showAdminFeatures && (
            <div className="p-6">
              {onlyMesas ? (
                // Solo cajero: solo ve la gestión de mesas
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl p-6">
                  <MesaManagement sucursalId={selectedBranchId || user.sucursal?.id || 1} idRestaurante={user.id_restaurante} />
                </div>
              ) : (
                // Admin y gerente: ven todas las sub-pestañas
                <>
              {activeDashboardSubTab === 'summary' && (
                <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl p-6">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                    Panel de Control General
                  </h2>
                  <p className="text-gray-600 mb-6">Visualiza métricas clave y el rendimiento de tu negocio.</p>
                  <DashboardStats sales={sales} orders={orders} products={products} />
                </div>
              )}
              {activeDashboardSubTab === 'products' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl p-6">
                  <ProductManagement products={products} categories={categories} currentUserRole={user.rol} idRestaurante={user.id_restaurante} />
                </div>
              )}
              {activeDashboardSubTab === 'users' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl p-6">
                  <UserManagement />
                </div>
              )}
              {activeDashboardSubTab === 'mesas' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl p-6">
                  <MesaManagement sucursalId={selectedBranchId || user.sucursal?.id || 1} idRestaurante={user.id_restaurante} />
                </div>
              )}
              {activeDashboardSubTab === 'categorias' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl p-6">
                  <CategoryList />
                </div>
              )}
              {activeDashboardSubTab === 'sucursales' && (user.rol === 'admin' || user.rol === 'super_admin') && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl p-6">
                  <SucursalManagement currentUserRole={user.rol} />
                </div>
              )}
              {activeDashboardSubTab === 'membresia' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl p-6">
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
          <aside className="w-96 bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 shadow-xl flex flex-col">
            {/* Contenedor scrollable para el carrito y opciones */}
            <div className="flex-1 overflow-y-auto">
              <Cart
                items={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                onCheckout={() => setShowCheckout(true)}
              />

              <div className="mt-6 space-y-4">
                {/* Selector de Tipo de Servicio */}
                <div>
                  <label htmlFor="service-type" className="block text-sm font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
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

                {/* Indicador de scroll cuando hay muchos productos */}
                {cart.length > 3 && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                    <span className="text-yellow-600">📜</span>
                    <p className="text-xs text-yellow-700">
                      <strong>Tip:</strong> Usa el scroll para ver todas las opciones de servicio
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
        {activeTab === 'mesero' && user?.rol === 'cajero' && (
  <PedidosMeseroCajero />
)}
        {activeTab === 'pedidos-pendientes' && user?.rol === 'cajero' && (
          <PedidosPendientesCajero />
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

