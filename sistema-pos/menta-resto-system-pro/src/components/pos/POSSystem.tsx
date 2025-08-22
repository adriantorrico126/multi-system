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
  Zap,
  Sparkles,
  TrendingDown,
  Minus,
  Plus,
  CheckCircle,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportSalesToCSV } from '@/utils/csvExport';
import { getProducts, getCategories, getKitchenOrders, createSale, refreshInventory, updateOrderStatus, getBranches, getVentasOrdenadas, getMesas, editSale, deleteSale, getPromocionesActivas, getConfiguracion, printComanda, saveConfiguracion, getArqueoActualPOS, abrirArqueoPOS } from '@/services/api';
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
import { PromocionManagement } from '../promociones/PromocionManagement';
import { PromocionCart } from '../promociones/PromocionCart';
import { useCart } from '@/hooks/useCart';
// import { useNavigate } from 'react-router-dom';

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
  const [config, setConfig] = React.useState<any>({});
  const [configOpen, setConfigOpen] = useState(false);
  const [draftConfig, setDraftConfig] = useState<any>({});
  const [arqueoActual, setArqueoActual] = useState<any>(null);
  const [showArqueoModal, setShowArqueoModal] = useState(false);
  const [montoApertura, setMontoApertura] = useState<string>('');
  const [showCajaBanner, setShowCajaBanner] = useState<boolean>(true);
  
  React.useEffect(() => {
    const interval = setInterval(() => setNow(dayjs()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  // Cargar configuración al iniciar
  React.useEffect(() => {
    (async () => {
      const cfg = await getConfiguracion();
      setConfig(cfg || {});
      setDraftConfig(cfg || {});
      console.log('🔧 Configuración cargada:', cfg);
      const ts = cfg?.tiposServicio || { mesa: true, pickup: true, delivery: false };
      if (!ts.mesa && ts.pickup) setTipoServicio('Para Llevar');
      if (!ts.mesa && !ts.pickup && ts.delivery) setTipoServicio('Delivery');
    })();
  }, []);

  // Verificar si hay caja abierta al iniciar
  React.useEffect(() => {
    (async () => {
      try {
        const data = await getArqueoActualPOS();
        setArqueoActual(data);
        const skipOnce = sessionStorage.getItem('skipCajaModalOnce') === '1';
        const autoPromptDone = sessionStorage.getItem('cajaAutoPromptDone') === '1';
        if (!data && user?.rol !== 'cocinero' && !skipOnce && !autoPromptDone) {
          setShowArqueoModal(true);
          try { sessionStorage.setItem('cajaAutoPromptDone', '1'); } catch {}
        }
        if (skipOnce) try { sessionStorage.removeItem('skipCajaModalOnce'); } catch {}
        // Control de banner auto-ocultable
        setShowCajaBanner(true);
        if (data) {
          window.setTimeout(() => setShowCajaBanner(false), 3000);
        }
      } catch (e:any) {
        console.warn('No se pudo verificar arqueo actual:', e?.message || e);
      }
    })();
  }, [user?.rol]);

  const handleAbrirArqueo = async () => {
    try {
      const monto = Number(montoApertura.replace(',', '.'));
      if (isNaN(monto)) {
        toast({ title: 'Validación', description: 'Monto inicial inválido.' });
        return;
      }
      const res = await abrirArqueoPOS(monto);
      setArqueoActual(res);
      setShowArqueoModal(false);
      try { sessionStorage.setItem('cajaAutoPromptDone', '1'); } catch {}
      toast({ title: 'Caja abierta', description: 'Apertura registrada.' });
    } catch (e:any) {
      toast({ title: 'Error', description: e.message || 'No se pudo abrir la caja.' });
    }
  };

  // Cierre automático: no se muestra opción manual; el backend autocierra a medianoche

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
  const gestionMesasHabilitada = config?.gestionMesas?.habilitado !== false; // por defecto true
  const onlyMesas = (user.rol === 'cajero' || user.rol === 'mesero') && gestionMesasHabilitada;
  // Determina si se deben mostrar las pestañas de administración
  const showAdminFeatures = ['admin', 'cajero', 'cocinero', 'super_admin'].includes(user.rol as any);
  const canSeeSales = ['admin', 'cajero', 'cocinero', 'super_admin'].includes(user.rol as any);

  // --- Estado Local del Componente ---
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart, subtotal, totalDescuentos, total, appliedPromociones } = useCart();
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
    queryFn: () => getProducts(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Obtener categorías de productos
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['categories', user?.id_restaurante],
    queryFn: () => getCategories(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Obtener pedidos para la vista de cocina/gestión de pedidos
  // Profesional: permitir también al rol 'mesero' ver el feed unificado de cocina
  const flujoCocinaModo = config?.flujoCocina?.modo || 'Completo';
  const canViewOrders = ['cocinero', 'admin', 'cajero', 'mesero'].includes(user.rol) && flujoCocinaModo !== 'Simplificado';
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

  // Si el modo cambia a "Simplificado", forzar salida de la pestaña Pedidos y limpiar cache de órdenes
  useEffect(() => {
    if (!canViewOrders) {
      if (activeTab === 'orders') setActiveTab('pos');
      queryClient.setQueryData(['orders-pos'], []);
    }
  }, [canViewOrders, activeTab, queryClient]);

  // Filtrar pedidos para el cajero: solo los de su sucursal
  const filteredOrders = React.useMemo(() => {
    if (user.rol === 'cajero') {
      return (backendOrders || []).filter((order: any) => {
        const orderSucursalId = Number(order.id_sucursal ?? order.sucursal_id);
        const userSucursalId = Number(user.sucursal?.id);
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
      cashier: order.nombre_cajero || 'Desconocido',
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
        total: total,
        subtotal: subtotal,
        totalDescuentos: totalDescuentos,
        appliedPromociones: appliedPromociones.length > 0 ? appliedPromociones : undefined,
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
        total: total,
        subtotal: subtotal,
        totalDescuentos: totalDescuentos,
        appliedPromociones: appliedPromociones.length > 0 ? [...appliedPromociones] : undefined,
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

      // Bloquear si no hay caja abierta
      if (!arqueoActual) {
        toast({ title: 'Caja no abierta', description: 'Debes aperturar caja antes de registrar ventas.' });
        setShowArqueoModal(true);
        return;
      }

      // Normalizar método de pago a etiquetas canónicas
      const pm = (paymentMethod || '').trim().toLowerCase();
      const paymentMethodCanon = pm === 'efectivo' ? 'Efectivo' : pm === 'tarjeta' ? 'Tarjeta' : pm === 'transferencia' ? 'Transferencia' : paymentMethod;

      try {
      console.log('POSSystem: Payload enviado a createSale:', {
        items: cart.map((item) => ({
          id: item.originalId || item.id,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes,
          modificadores: item.modificadores || []
        })),
        total: newSale.total,
        paymentMethod: paymentMethodCanon,
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
        paymentMethod: paymentMethodCanon,
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
      clearCart(); // Limpia el carrito después de la venta
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
        // Fallback defensivo por si alguna capa intermedia filtra props
        variant: 'default',
        open: true,
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
  [cart, user, toast, queryClient, mesaNumero, tipoServicio, refetchVentas, selectedBranch, user?.sucursal?.nombre, selectedBranchId, mesas, clearCart, total, subtotal, totalDescuentos, appliedPromociones, arqueoActual]
);

  /**
   * Maneja el cierre de sesión del usuario.
   */
  const handleLogout = useCallback(() => {
    logout(); // Llama a la función de logout del contexto de autenticación
    clearCart(); // Limpia el carrito al cerrar sesión
    setActiveTab('pos'); // Vuelve a la pestaña POS
    toast({
      title: '👋 Hasta luego',
      description: 'Sesión cerrada correctamente.',
    });
  }, [logout, toast, clearCart]);

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
      const saleData: any = {
        items: editedSale.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          notes: (item as any).notes
        })),
        total: editedSale.total,
        paymentMethod: editedSale.paymentMethod,
        notes: (editedSale as any).notes || ''
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
    mutationFn: ({ orderId, status }: { orderId: string; status: Order['status'] }) =>
      updateOrderStatus(orderId, status),
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
    updateOrderStatusMutation({ orderId, status });
  }, [updateOrderStatusMutation]);

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
    if (!canViewOrders) return [] as Order[];
    return (filteredOrders || []).map(mapBackendOrderToOrder);
  }, [filteredOrders, mapBackendOrderToOrder, canViewOrders]);

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

  // Si el usuario es mesero, forzar la pestaña por defecto a 'mesero'
  React.useEffect(() => {
    if (user.rol === 'mesero') {
      setActiveTab('pos');
    }
  }, [user.rol]);
 
  // Siempre usar el header global para una experiencia unificada (incluye mesero)
  // const showHeader = true; // <- se deja la definición activa más abajo

  // Determinar la sucursal actual para el Header
  const currentBranchForHeader = React.useMemo(() => {
    const branch = selectedBranch
      ? {
          id: Number(selectedBranch.id_sucursal ?? selectedBranch.id ?? 0),
          name: selectedBranch.nombre || selectedBranch.name,
          location: `${selectedBranch.ciudad || selectedBranch.location || ''} ${selectedBranch.direccion ? '- ' + selectedBranch.direccion : ''}`,
        }
      : user.sucursal
      ? {
          id: Number(user.sucursal.id ?? 0),
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
                id: Number(user.sucursal.id ?? 0),
                name: user.sucursal.nombre,
                location: `${user.sucursal.ciudad} - ${user.sucursal.direccion}`,
              }
            : undefined
        }
        salesCount={sales.length}
        onLogout={handleLogout}
      />
      <main className="p-6">
        {/* La vista de KitchenView debería consultar pedidos directamente del backend */}
        <KitchenView />
      </main>
    </div>
  );
  }

  // Si el usuario es mesero, forzar la pestaña por defecto a 'mesero'
  React.useEffect(() => {
    if (user.rol === 'mesero') {
      setActiveTab('pos');
    }
  }, [user.rol]);
 
  // Siempre usar el header global para una experiencia unificada (incluye mesero)
  const showHeader = true;
  const headerRole = user.rol === 'super_admin' ? 'admin' : user.rol;
  const roleForOrderMgmt = user.rol === 'super_admin' ? 'admin' : (user.rol === 'mesero' ? 'cajero' : user.rol);
  const roleForSales = user.rol === 'super_admin' ? 'admin' : user.rol;
  // const navigate = useNavigate();
  const goCaja = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Abrir UI de Caja local (sin navegar a /arqueo)
    if (!arqueoActual) {
      setShowArqueoModal(true);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col overflow-hidden">
      {showHeader && !branchesLoading ? (
        <Header
          currentUser={{
            username: user.username,
            role: headerRole as any,
            branch: user.sucursal?.nombre || ''
          }}
          currentBranch={currentBranchForHeader}
          salesCount={sales.length}
          onLogout={logout}
          branches={branches}
          selectedBranchId={selectedBranchId ?? undefined}
          onSucursalChange={isAdmin ? handleSucursalChange : undefined}
          onOpenConfig={() => setConfigOpen(true)}
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
      {/* Modal de Apertura de Caja */}
      {showArqueoModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Apertura de Caja</h3>
            <p className="text-sm text-gray-600 mb-4">Ingresa el monto inicial de caja para iniciar el turno.</p>
            <div className="space-y-3">
              <Input placeholder="Monto inicial" value={montoApertura} onChange={(e) => setMontoApertura(e.target.value)} />
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setShowArqueoModal(false)}>Cancelar</Button>
                <Button onClick={handleAbrirArqueo}>Abrir Caja</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner de caja abierta (informativo, cierre automático) */}
      {arqueoActual && showCajaBanner && (
        <div className="fixed bottom-4 right-4 z-[150] bg-white shadow-lg border rounded-lg p-3">
          <div className="text-sm">Caja abierta desde {new Date(arqueoActual.fecha_apertura).toLocaleString()}</div>
          <div className="text-sm text-gray-600">Monto inicial: ${Number(arqueoActual.monto_inicial||0).toLocaleString()}</div>
          <div className="mt-2 text-xs text-gray-500">El cierre es automático a las 23:59.</div>
        </div>
      )}

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
          {gestionMesasHabilitada && (
            <>
              <Button
                variant={activeTab === 'orders' ? 'default' : 'outline'}
                onClick={() => handleTabChange('orders')}
                className="rounded-xl transition-all duration-200"
              >
                <ClipboardList className="h-5 w-5 mr-2" />
                Pedidos
              </Button>
            </>
          )}
          <Button onClick={goCaja} variant="outline" className="rounded-xl transition-all duration-200">Caja</Button>
          {(user.rol === 'cajero') && (
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
          {canSeeSales && (
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
          {(user.rol === 'admin' || user.rol === 'super_admin') && (
            <Button
              variant={activeTab === 'promociones' ? 'default' : 'outline'}
              onClick={() => handleTabChange('promociones')}
              className="rounded-xl transition-all duration-200"
            >
              <Tag className="h-5 w-5 mr-2" />
              Promociones
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
            <div className="flex flex-col h-full p-6 min-w-0">
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
                        <ProductCard key={String(product.id)} product={product} onAddToCart={addToCart} />
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
          {activeTab === 'orders' && gestionMesasHabilitada && (
            <div className="p-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl p-6">
                <OrderManagement
                  orders={orders}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  userRole={roleForOrderMgmt as any}
                />
              </div>
            </div>
          )}

          {/* Vista de Historial de Ventas */}
          {activeTab === 'sales' && canSeeSales && (
            <div className="p-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl h-full">
                <SalesHistory
                  sales={sales}
                  onDeleteSale={handleDeleteSale}
                  userRole={roleForSales as any}
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
                  <ProductManagement products={products} categories={categories} currentUserRole={(user.rol === 'super_admin' ? 'admin' : user.rol) as any} idRestaurante={user.id_restaurante} />
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
                  <SucursalManagement currentUserRole={(user.rol === 'super_admin' ? 'admin' : user.rol) as any} />
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

          {/* Vista de Mesero - rol mesero */}
          {/* El rol mesero ahora usa POS + gestión de mesas dentro de Dashboard/Mesas */}

          {/* Vista de Pedidos Pendientes */}
          {activeTab === 'pedidos-pendientes' && user?.rol === 'cajero' && (
            <div className="p-6">
              <PedidosPendientesCajero />
            </div>
          )}

          {/* Vista de Promociones */}
          {activeTab === 'promociones' && (user?.rol === 'admin' || user?.rol === 'super_admin') && (
            <div className="p-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl p-6">
                <PromocionManagement />
              </div>
            </div>
          )}
        </div>

        {/* Panel del Carrito de Compras y Opciones de Servicio SOLO en POS */}
        {activeTab === 'pos' && (
          <aside className="w-95 bg-gradient-to-br from-white via-gray-50/50 to-white border-l border-gray-200/50 shadow-2xl flex flex-col flex-shrink-0">
            {/* Header del Carrito */}
            <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                    <ShoppingCart className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Carrito de Compras</h3>
                    <p className="text-xs text-gray-600">{cart.length} producto{cart.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {appliedPromociones.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-yellow-600 font-medium">{appliedPromociones.length}</span>
                  </div>
                )}
              </div>
              
              {/* Total Principal */}
              <div className="text-right">
                <div className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  <span translate="no">Bs</span> {total.toFixed(2)}
                </div>
                {appliedPromociones.length > 0 && (
                  <div className="flex items-center justify-end gap-1 text-xs text-green-600">
                    <TrendingDown className="h-2.5 w-2.5" />
                    <span>Promociones aplicadas</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contenido Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-4 space-y-3">
                {/* Lista de Productos */}
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ShoppingCart className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Carrito Vacío</h3>
                    <p className="text-gray-500 text-xs">Agrega productos para comenzar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item, index) => {
                      const itemIdNum = Number((item as any).id_producto ?? item.id);
                      const promocionesAplicadas = appliedPromociones.filter(promocion => 
                        itemIdNum === promocion.id_producto
                      );
                      
                      const tienePromocion = promocionesAplicadas.length > 0;
                      
                      return (
                        <div 
                          key={`${item.id}-${index}-${item.notes || ''}`} 
                          className={`relative p-3 rounded-lg transition-all duration-300 ${
                            tienePromocion 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-sm' 
                              : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                          }`}
                        >
                          {/* Badge de Promoción */}
                          {tienePromocion && (
                            <div className="absolute -top-1 -right-1 z-10">
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-1 py-0.5 shadow-lg">
                                <Sparkles className="h-2 w-2 mr-0.5" />
                                Promo
                              </Badge>
                            </div>
                          )}
                          
                                                     <div className="flex items-start gap-3">
                             <div className="flex-1 min-w-0">
                               <div className="flex items-start justify-between mb-1">
                                 <h4 className={`font-semibold text-sm truncate ${tienePromocion ? 'text-green-800' : 'text-gray-800'}`}>
                                   {item.name}
                                 </h4>
                                 <div className="text-right flex-shrink-0">
                                   <p className={`text-sm font-semibold ${tienePromocion ? 'text-green-600' : 'text-gray-600'}`}>
                                     Bs {item.price}
                                   </p>
                                   {tienePromocion && (
                                     <p className="text-xs text-green-600 font-bold">
                                       -{promocionesAplicadas[0].valor}%
                                     </p>
                                   )}
                                 </div>
                               </div>
                              
                              {/* Notas */}
                              {item.notes && (
                                <p className="text-xs text-gray-600 italic mb-1 bg-gray-50 px-1.5 py-0.5 rounded">
                                  📝 {item.notes}
                                </p>
                              )}
                              
                              {/* Modificadores */}
                              {item.modificadores && item.modificadores.length > 0 && (
                                <div className="mb-1">
                                  <ul className="text-xs text-blue-600 space-y-0.5">
                                    {item.modificadores.slice(0, 2).map((mod, idx) => (
                                      <li key={mod.id_modificador || idx} className="flex items-center gap-1">
                                        <CheckCircle className="h-2 w-2" />
                                        <span className="truncate">{mod.nombre_modificador}</span>
                                        {mod.precio_extra > 0 && (
                                          <span className="text-green-600 font-medium text-xs">
                                            +Bs {mod.precio_extra}
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                    {item.modificadores.length > 2 && (
                                      <li className="text-xs text-gray-500">
                                        +{item.modificadores.length - 2} más...
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                            
                                                         {/* Controles */}
                             <div className="flex items-center gap-1.5 flex-shrink-0">
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                                 className="h-6 w-6 p-0 bg-white border-gray-300 shadow-sm hover:shadow-md"
                               >
                                 <Minus className="h-3 w-3" />
                               </Button>
                               
                               <span className="w-8 text-center text-sm font-bold text-gray-700">
                                 {item.quantity}
                               </span>
                               
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                 className="h-6 w-6 p-0 bg-white border-gray-300 shadow-sm hover:shadow-md"
                               >
                                 <Plus className="h-3 w-3" />
                               </Button>
                               
                               <Button
                                 variant="destructive"
                                 size="sm"
                                 onClick={() => removeFromCart(item.id)}
                                 className="h-6 w-6 p-0 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-sm hover:shadow-md"
                               >
                                 <Trash2 className="h-3 w-3" />
                               </Button>
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Promociones */}
                                {cart.length > 0 && (
                  <div className="border-t border-gray-200/50 pt-3">
                    <PromocionCart
                      cartItems={cart}
                      appliedPromociones={appliedPromociones}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer con Opciones de Servicio */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-white p-3 space-y-3">
                {/* Resumen de Total */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-600">Subtotal:</span>
                    <span className="text-xs font-semibold text-gray-700">
                      <span translate="no">Bs</span> {subtotal.toFixed(2)}
                    </span>
                  </div>
                  
                  {appliedPromociones.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                        <TrendingDown className="h-2.5 w-2.5" />
                        Descuentos:
                      </span>
                      <span className="text-xs font-semibold text-green-600">
                        -<span translate="no">Bs</span> {totalDescuentos.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                    <span className="text-sm font-bold text-gray-800">Total Final:</span>
                    <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      <span translate="no">Bs</span> {total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Tipo de Servicio */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tipo de Servicio
                  </label>
                  <select
                    value={tipoServicio}
                    onChange={(e) => {
                      const newTipo = e.target.value as 'Mesa' | 'Delivery' | 'Para Llevar';
                      setTipoServicio(newTipo);
                      if (newTipo !== 'Mesa') {
                        setMesaNumero(null);
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all text-xs"
                  >
                    {(config?.tiposServicio?.mesa ?? true) && <option value="Mesa">🍽️ En Mesa</option>}
                    {(config?.tiposServicio?.delivery ?? false) && <option value="Delivery">🚚 Delivery</option>}
                    {(config?.tiposServicio?.pickup ?? true) && <option value="Para Llevar">📦 Para Llevar</option>}
                  </select>
                </div>

                {/* Número de Mesa */}
                {tipoServicio === 'Mesa' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Número de Mesa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Ej. 5"
                      value={mesaNumero === null ? '' : mesaNumero}
                      onChange={(e) => setMesaNumero(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm text-xs"
                      required
                      min="1"
                    />
                  </div>
                )}

                {/* Botón de Checkout */}
                <Button
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-200 py-2 text-sm font-semibold"
                  size="sm"
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Procesar Venta
                </Button>
                  </div>
                )}
          </aside>
        )}
      </main>
      {showCheckout && (
        <CheckoutModal
          items={cart}
          onConfirmSale={confirmSale}
          onCancel={() => setShowCheckout(false)}
          mesaNumero={mesaNumero}
        />
      )}
      {selectedInvoice && <InvoiceModal sale={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
      {configOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Configuraciones</h2>
              <Button variant="outline" onClick={() => setConfigOpen(false)}>Cerrar</Button>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Operación y Flujos de Pedidos</h3>
                <label className="block text-sm font-medium mb-1">Modo de Flujo de Cocina</label>
                <select
                  className="w-full p-2 border rounded"
                  value={draftConfig?.flujoCocina?.modo || 'Completo'}
                  onChange={(e) => setDraftConfig((d:any) => ({ ...d, flujoCocina: { ...(d.flujoCocina||{}), modo: e.target.value } }))}
                >
                  <option value="Completo">Completo (KDS)</option>
                  <option value="Directo">Directo (Impresión)</option>
                  <option value="Simplificado">Simplificado (Mostrador)</option>
                </select>
                {(draftConfig?.flujoCocina?.modo === 'Directo') && (
                  <label className="inline-flex items-center gap-2 mt-2">
                    <input type="checkbox" checked={!!draftConfig?.flujoCocina?.autoImprimir} onChange={(e) => setDraftConfig((d:any)=>({ ...d, flujoCocina: { ...(d.flujoCocina||{}), autoImprimir: e.target.checked } }))} />
                    <span className="text-sm">Imprimir automáticamente al crear el pedido</span>
                  </label>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Tipos de Servicio Habilitados</h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={draftConfig?.tiposServicio?.mesa ?? true} onChange={(e)=> setDraftConfig((d:any)=>({ ...d, tiposServicio: { ...(d.tiposServicio||{}), mesa: e.target.checked } }))} /> En Mesa
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={draftConfig?.tiposServicio?.pickup ?? true} onChange={(e)=> setDraftConfig((d:any)=>({ ...d, tiposServicio: { ...(d.tiposServicio||{}), pickup: e.target.checked } }))} /> Para Llevar
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={draftConfig?.tiposServicio?.delivery ?? false} onChange={(e)=> setDraftConfig((d:any)=>({ ...d, tiposServicio: { ...(d.tiposServicio||{}), delivery: e.target.checked } }))} /> Delivery
                  </label>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Gestión de Mesas</h3>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={draftConfig?.gestionMesas?.habilitado ?? true} onChange={(e)=> setDraftConfig((d:any)=>({ ...d, gestionMesas: { ...(d.gestionMesas||{}), habilitado: e.target.checked } }))} /> Habilitar gestión de mesas
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={()=>{ setDraftConfig(config); setConfigOpen(false); }}>Cancelar</Button>
              <Button onClick={async ()=>{
                await saveConfiguracion(draftConfig);
                setConfig(draftConfig);
                setConfigOpen(false);
                toast({ title: 'Configuración guardada', description: 'Los cambios se aplicaron.' });
              }}>Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}