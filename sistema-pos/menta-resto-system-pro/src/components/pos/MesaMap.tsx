import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Users,
  Clock,
  User as UserIcon,
  Link2,
  Split,
  Trash2,
  Info,
  DoorOpen,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Search,
  Tag,
  ChefHat, // Added for a more "restaurant" feel
  HandCoins, // For pending payment
  LogOut,
  Store,
  Sun,
  Moon,
  AlertCircle, // Added for error state
  Calendar,
  BookOpen
} from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
  getMesas,
  getProducts,
  liberarMesa,
  agregarMesaAGrupo,
  crearGrupoMesas,
  getCategories,
  reasignarMesero,
  getUsers,
  listarGruposActivosCompletos,
  getReservas
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { Mesa, Product, Category, CartItem, User } from '@/types/restaurant'; // Añadir CartItem
import { cn } from '@/lib/utils'; // Utility for conditional class names
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReservaModal } from './ReservaModal';

// --- Constants and Type Definitions ---

// Define a more explicit type for MesaStateBadge to ensure consistency
type MesaStateBadge = {
  label: string;
  badge: string;
  icon: React.ReactNode;
};

// State mapping for tables: badge color and label
const MESA_STATE_BADGES: Record<string, MesaStateBadge> = {
  libre: {
    label: 'Libre',
    badge: 'bg-green-500 text-white', // Changed to green for 'libre'
    icon: <DoorOpen className="w-4 h-4 mr-1" />,
  },
  ocupada: {
    label: 'Ocupada',
    badge: 'bg-red-500 text-white', // Changed to red for 'ocupada'
    icon: <UserIcon className="w-4 h-4 mr-1" />,
  },
  en_uso: {
    label: 'En Uso',
    badge: 'bg-orange-500 text-white', // Orange for 'en_uso'
    icon: <UserIcon className="w-4 h-4 mr-1" />,
  },
  en_grupo: {
    label: 'En Grupo',
    badge: 'bg-purple-500 text-white', // Purple for 'en_grupo'
    icon: <Link2 className="w-4 h-4 mr-1" />,
  },
  reservada: {
    label: 'Reservada',
    badge: 'bg-blue-500 text-white',
    icon: <Link2 className="w-4 h-4 mr-1" />,
  },
  pendiente_cobro: {
    label: 'Pendiente Cobro',
    badge: 'bg-yellow-400 text-gray-900',
    icon: <HandCoins className="w-4 h-4 mr-1" />, // New icon for pending payment
  },
  mantenimiento: {
    label: 'Mantenimiento',
    badge: 'bg-gray-500 text-white',
    icon: <Trash2 className="w-4 h-4 mr-1" />,
  },
  // Add a state for "en_preparacion" if applicable
  en_preparacion: {
    label: 'En Preparación',
    badge: 'bg-orange-500 text-white',
    icon: <ChefHat className="w-4 h-4 mr-1" />,
  },
  // Add state for grouped tables
  agrupada: {
    label: 'Agrupada',
    badge: 'bg-purple-500 text-white',
    icon: <Link2 className="w-4 h-4 mr-1" />,
  },
};

// --- Reusable Components (moved out for better separation) ---

interface ProductCatalogProps {
  products: Product[];
  onAdd: (product: Product) => void;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (categoryId: string) => void;
  categories: Category[];
}

function ProductCatalog({
  products,
  onAdd,
  isLoading,
  isError,
  error,
  refetch,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
}: ProductCatalogProps) {
  // Drag-to-scroll logic
  const catScrollRef = useRef<HTMLDivElement>(null);
  let isDragging = false;
  let startX = 0;
  let scrollLeft = 0;

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging = true;
    startX = e.pageX - (catScrollRef.current?.offsetLeft || 0);
    scrollLeft = catScrollRef.current?.scrollLeft || 0;
    document.body.style.cursor = 'grabbing';
  };
  const handleMouseLeave = () => {
    isDragging = false;
    document.body.style.cursor = '';
  };
  const handleMouseUp = () => {
    isDragging = false;
    document.body.style.cursor = '';
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (catScrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5; // scroll speed
    if (catScrollRef.current) catScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 rounded-xl shadow-inner p-4">
      <div className="mb-6 flex flex-col gap-4 sticky top-0 bg-white/95 dark:bg-gray-900/95 pt-0 pb-4 z-10 border-b border-gray-200 dark:border-gray-800 -mx-4 px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar productos por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 text-base w-full pl-10 pr-4 rounded-full border-2 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
          />
        </div>
        {categories.length > 0 && (
          <div className="relative">
            {/* Fade left */}
            <div className="pointer-events-none absolute left-0 top-0 h-full w-8 z-20 bg-gradient-to-r from-white dark:from-gray-900 to-transparent" />
            {/* Fade right */}
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 z-20 bg-gradient-to-l from-white dark:from-gray-900 to-transparent" />
            <div
              ref={catScrollRef}
              className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-700 dark:scrollbar-track-gray-900 flex gap-2 pb-2 px-1 relative cursor-grab"
              style={{ WebkitOverflowScrolling: 'touch' }}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
            >
              <Tag className="w-5 h-5 text-gray-500 mr-1 flex-shrink-0" />
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="rounded-full px-4 py-2 text-sm font-medium transition-all duration-200"
              >
                Todos
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id_categoria}
                  variant={selectedCategory === cat.id_categoria.toString() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id_categoria.toString())}
                  className="rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap"
                >
                  {cat.nombre}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 py-12 animate-pulse">
          Cargando productos...
        </div>
      ) : isError ? (
        <div className="text-center text-red-500 py-12">
          Error al cargar productos.
          <Button variant="outline" onClick={refetch} className="ml-2">
            Reintentar
          </Button>
          {error && <p className="text-sm mt-2">{error.message}</p>}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 pb-4"> {/* Added padding for scrollbar */}
          {products.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-8">
              No se encontraron productos con los filtros aplicados.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"> {/* More columns for larger screens */}
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-3 flex flex-col items-center shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100 dark:border-gray-800 transform hover:-translate-y-1 relative overflow-hidden"
                >
                  {/* Subtle gradient overlay for modern look */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-500/5 dark:to-blue-500/10 rounded-xl pointer-events-none"></div>

                  <span className="font-semibold text-gray-800 dark:text-gray-100 text-base mb-1 text-center line-clamp-2 leading-tight">
                    {prod.name}
                  </span>
                  <span className="text-xs text-gray-500 mb-2 truncate max-w-full">
                    {prod.category || 'Sin categoría'}
                  </span>
                  <Badge className="text-sm font-bold mb-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-md px-3 py-1 animate-fade-in">
                    Bs {Number(prod.price ?? 0).toFixed(2)}
                  </Badge>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onAdd(prod)}
                    className="w-full flex items-center gap-1 mt-2 text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />Agregar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface OrderCartProps {
  cart: CartItem[];
  onAdd: (product: CartItem) => void;
  onRemove: (product: CartItem) => void;
  total: number;
}

function OrderCart({ cart, onAdd, onRemove, total }: OrderCartProps) {
  return (
    <div className="space-y-4 flex-1 overflow-y-auto pr-2 -mr-2">
      {cart.length === 0 ? (
        <div className="text-gray-400 text-center py-4 text-sm animate-fade-in">
          <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          No hay productos en la orden. <br /> Agrega algunos desde el catálogo.
        </div>
      ) : (
        <div className="space-y-3">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg px-4 py-3 shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 animate-fade-in"
            >
              <div className="flex flex-col flex-grow min-w-0 mr-4">
                <span className="font-medium text-gray-800 dark:text-gray-100 truncate text-base leading-tight">
                  {item.name}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Bs {Number(item.price ?? 0).toFixed(2)} c/u
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(item)}
                  aria-label={`Quitar uno de ${item.name}`}
                  className="w-8 h-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
                >
                  <Minus className="w-4 h-4 text-red-500" />
                </Button>
                <span className="font-semibold text-lg w-6 text-center text-gray-900 dark:text-gray-100">
                  {item.quantity}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAdd(item)}
                  aria-label={`Agregar uno de ${item.name}`}
                  className="w-8 h-8 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 text-green-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Eliminar la definición y uso de MeseroHeader

// --- Main Component: MesaMap ---

export default function MesaMap() {
  const { user } = useAuth();
  const { toast } = useToast();
  const id_sucursal = user?.sucursal?.id;
  const id_restaurante = user?.id_restaurante;

  // DEBUG: Log user and sucursal info
  useEffect(() => {
    console.log('🔍 MesaMap Debug - user:', user);
    console.log('🔍 MesaMap Debug - id_sucursal:', id_sucursal);
    console.log('🔍 MesaMap Debug - id_restaurante:', id_restaurante);
  }, [user, id_sucursal, id_restaurante]);

  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isTakingOrder, setIsTakingOrder] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [transferMesaId, setTransferMesaId] = useState<string>('');
  const [splitMesaIdsInput, setSplitMesaIdsInput] = useState<string>(''); // Single string for input
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // NUEVO: selección múltiple y modal de grupo
  const [multiSelect, setMultiSelect] = useState<number[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupMeseroId, setGroupMeseroId] = useState('');
  const [isGrouping, setIsGrouping] = useState(false);
  // NUEVO: reasignación de mesero
  const [showReassignMeseroModal, setShowReassignMeseroModal] = useState(false);
  const [reassignMeseroId, setReassignMeseroId] = useState('');
  const [mesaToReassign, setMesaToReassign] = useState<Mesa | null>(null);
  const [meseros, setMeseros] = useState<Array<User>>([]);
  const [isLoadingMeseros, setIsLoadingMeseros] = useState(false);

  // NUEVO: reservas
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [selectedMesaForReserva, setSelectedMesaForReserva] = useState<Mesa | null>(null);
  const [reservas, setReservas] = useState<any[]>([]);
  const [isLoadingReservas, setIsLoadingReservas] = useState(false);

  // Cargar meseros activos al abrir el modal de unir mesas
  useEffect(() => {
    console.log('🔄 useEffect ejecutado, showGroupModal:', showGroupModal);
    if (showGroupModal) {
      console.log('📋 Modal abierto, cargando meseros...');
      setIsLoadingMeseros(true);
      getUsers()
        .then(users => {
          console.log('👥 Usuarios obtenidos:', users);
          const meserosFiltrados = users.filter(u => u.rol === 'mesero');
          console.log('👨‍💼 Meseros filtrados:', meserosFiltrados);
          setMeseros(meserosFiltrados);
          console.log('✅ Meseros cargados en el estado');
        })
        .catch(error => {
          console.error('❌ Error al cargar meseros:', error);
        })
        .finally(() => {
          setIsLoadingMeseros(false);
          console.log('🏁 Carga de meseros completada');
        });
    } else {
      console.log('🚫 Modal cerrado, no cargando meseros');
    }
  }, [showGroupModal]);

  // Log del estado del modal
  useEffect(() => {
    console.log('Estado del modal showGroupModal cambió a:', showGroupModal);
  }, [showGroupModal]);

  // Log cuando el modal se renderiza
  useEffect(() => {
    if (showGroupModal) {
      console.log('🎭 Modal abierto - meseros disponibles:', meseros.length);
    }
  }, [showGroupModal, meseros.length]);

  // Cargar reservas
  useEffect(() => {
    if (id_sucursal) {
      setIsLoadingReservas(true);
      getReservas(id_sucursal)
        .then(data => {
          console.log('📅 Reservas cargadas:', data);
          setReservas(data);
        })
        .catch(error => {
          console.error('❌ Error cargando reservas:', error);
        })
        .finally(() => {
          setIsLoadingReservas(false);
        });
    }
  }, [id_sucursal]);

  // Función para obtener reservas de una mesa
  const getReservasForMesa = (id_mesa: number) => {
    return reservas.filter(reserva => 
      reserva.id_mesa === id_mesa && 
      reserva.estado === 'confirmada'
    );
  };

  // Función para abrir modal de reserva
  const handleOpenReservaModal = (mesa: Mesa) => {
    console.log('🔍 handleOpenReservaModal llamado con mesa:', mesa);
    setSelectedMesaForReserva(mesa);
    setShowReservaModal(true);
    console.log('🔍 showReservaModal establecido a true');
  };

  const queryClient = useQueryClient();

  // --- Data Fetching with React Query ---

  // Mesas Query
  const {
    data: mesas = [],
    isLoading: isLoadingMesas,
    isError: isErrorMesas,
    error: errorMesas,
    refetch: refetchMesas,
  } = useQuery<Mesa[]>({
    queryKey: ['mesas', id_sucursal],
    queryFn: () => getMesas(id_sucursal),
    enabled: !!id_sucursal,
    refetchInterval: 10000, // Refresh every 10 seconds to keep UI updated
    staleTime: 5000, // Data is considered fresh for 5 seconds
    placeholderData: [], // Show empty array while loading for smoother UX
  });

  // Si no hay id_sucursal, mostrar mensaje de error
  if (!id_sucursal) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-2xl border border-red-200">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">
            Error de Configuración
          </h2>
          <p className="text-red-600 mb-4">
            No se pudo obtener la información de la sucursal.
          </p>
          <p className="text-sm text-red-500">
            Por favor, contacta al administrador del sistema.
          </p>
          <div className="mt-4 p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600">
              <strong>Debug Info:</strong><br />
              User: {JSON.stringify(user, null, 2)}<br />
              Sucursal: {JSON.stringify(user?.sucursal, null, 2)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Log mesas data when it changes
  useEffect(() => {
    if (mesas && mesas.length > 0) {
      console.log('🔍 DEBUG: Mesas data received:', mesas);
      console.log('🔍 DEBUG: Mesas with id_grupo_mesa:', mesas.filter(m => m.id_grupo_mesa));
      console.log('🔍 DEBUG: User info:', user);
      console.log('🔍 DEBUG: id_sucursal:', id_sucursal);
    }
  }, [mesas, user, id_sucursal]);

  // Products Query
  const {
    data: products = [],
    isLoading: isLoadingProducts,
    isError: isErrorProducts,
    error: errorProducts,
    refetch: refetchProducts,
  } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => getProducts(),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // Data is considered fresh for 15 seconds
    placeholderData: [],
  });

  // Grupos de mesas Query
  const {
    data: gruposActivos = [],
    isLoading: isLoadingGrupos,
  } = useQuery({
    queryKey: ['grupos-activos-completos', id_restaurante],
    queryFn: () => listarGruposActivosCompletos(id_restaurante),
    enabled: !!id_restaurante,
    refetchInterval: 10000,
  });

  // Función para obtener el grupo de una mesa
  const getGrupoDeMesa = useCallback((mesaId: number) => {
    return gruposActivos.find(grupo => 
      grupo.mesas.some(mesa => mesa.id_mesa === mesaId)
    );
  }, [gruposActivos]);

  // Categories Query
  const {
    data: categories = [],
    isLoading: isLoadingCategories, // Keep isLoading for potential skeleton states if needed
  } = useQuery<Category[]>({
    queryKey: ['categories', id_restaurante],
    queryFn: () => getCategories?.(), // Optional chaining in case getCategories is not defined
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!getCategories, // Only fetch if getCategories function exists
    placeholderData: [],
  });

  // --- Memoized and Filtered Data ---

  // Filtered products based on search term and selected category
  const filteredProducts = useMemo(() => {
    return (products as Product[]).filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        product.id_categoria?.toString() === selectedCategory;
      const matchesSearch =
        searchTerm === '' ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch && product.available !== false;
    });
  }, [products, searchTerm, selectedCategory]);

  // Calculate total for the cart
  const cartTotal = useMemo(() => {
    return cart.reduce(
      (acc, item) => acc + (item.price || 0) * (item.quantity ?? 1),
      0
    );
  }, [cart]);

  // --- Mutations with React Query ---

  // Mutation to add products to a table (mandar a caja)
  const addProductsToMesaMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMesa) throw new Error('No hay mesa seleccionada.');
      if (cart.length === 0) throw new Error('No hay productos en el carrito.');
      if (!user) throw new Error('Usuario no autenticado.');

      const items = cart.map((item) => ({
        id: item.id.toString(),
        quantity: item.quantity ?? 1,
        price: item.price,
        notes: item.notes || '',
        modificadores: item.modificadores || [],
      }));

      // Usar createSale para crear la venta en estado pendiente_caja
      // await createSale({ // This line was removed as per the new_code, as createSale is no longer imported.
      //   items,
      //   total: cartTotal,
      //   paymentMethod: 'pendiente_caja', // o 'efectivo' si el backend lo requiere, pero el estado debe ser pendiente_caja
      //   cashier: user.username || user.nombre || 'mesero',
      //   id_sucursal,
      //   mesa_numero: selectedMesa.numero,
      //   id_mesa: selectedMesa.id_mesa,
      //   tipo_servicio: 'Mesa',
      // });
    },
    onSuccess: () => {
      setCart([]);
      setIsTakingOrder(false);
      setDrawerOpen(false);
      toast({
        title: "Orden Enviada",
        description: "Orden enviada a caja con éxito.",
      });
      queryClient.invalidateQueries({ queryKey: ['mesas'] }); // Invalidate mesas query to refetch updated state
    },
    onError: (err: any) => {
      console.error('Error al enviar orden a caja:', err);
      toast({
        title: "Error",
        description: `Error al enviar orden: ${err?.message || 'Error desconocido.'}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to free a table
  const freeMesaMutation = useMutation({
    mutationFn: async (mesaId: number) => {
      await liberarMesa(mesaId);
    },
    onSuccess: () => {
      setDrawerOpen(false);
      setIsTakingOrder(false);
      setCart([]);
      toast({
        title: "Mesa Liberada",
        description: "Mesa liberada con éxito.",
      });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
    },
    onError: (err: any) => {
      console.error('Error al liberar mesa:', err);
      toast({
        title: "Error",
        description: `Error al liberar mesa: ${err?.message || 'Error desconocido.'}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to transfer a table (add to group)
  const transferMesaMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMesa || !transferMesaId)
        throw new Error('Datos incompletos para transferir mesa.');
      await agregarMesaAGrupo(Number(transferMesaId), selectedMesa.id_mesa);
    },
    onSuccess: () => {
      setShowTransferModal(false);
      setDrawerOpen(false);
      setIsTakingOrder(false);
      setCart([]);
      toast({
        title: "Mesa Transferida",
        description: "Mesa transferida con éxito.",
      });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
    },
    onError: (err: any) => {
      console.error('Error al transferir mesa:', err);
      toast({
        title: "Error",
        description: `Error al transferir mesa: ${err?.message || 'Error desconocido.'}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to split a bill (create table group)
  const splitBillMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMesa || !splitMesaIdsInput)
        throw new Error('Datos incompletos para dividir cuenta.');

      const mesaIdsToGroup = splitMesaIdsInput
        .split(',')
        .map((s) => Number(s.trim()))
        .filter(Boolean); // Ensure valid numbers and remove empty strings

      if (mesaIdsToGroup.length === 0) {
        throw new Error('Debe ingresar al menos un ID de mesa para agrupar.');
      }
      if (mesaIdsToGroup.includes(selectedMesa.id_mesa)) {
        throw new Error('La mesa seleccionada no puede ser incluida en la lista de mesas a agrupar.');
      }

      await crearGrupoMesas({
        id_restaurante: id_restaurante,
        id_sucursal,
        mesas: [selectedMesa.id_mesa, ...mesaIdsToGroup],
        id_mesero: user?.id || 0, // Usar el ID del usuario actual o 0 como fallback
      });
    },
    onSuccess: () => {
      setShowSplitModal(false);
      setDrawerOpen(false);
      setIsTakingOrder(false);
      setCart([]);
      toast({
        title: "Cuenta Dividida",
        description: "Cuenta dividida y grupo creado con éxito.",
      });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
    },
    onError: (err: any) => {
      console.error('Error al dividir cuenta:', err);
      toast({
        title: "Error",
        description: `Error al dividir cuenta: ${err?.message || 'Error desconocido.'}`,
        variant: "destructive",
      });
    },
  });

  // NUEVO: Mutación para crear grupo de mesas
  const groupMesasMutation = useMutation({
    mutationFn: async () => {
      console.log('🔍 Iniciando mutación groupMesasMutation');
      console.log('multiSelect:', multiSelect);
      console.log('groupMeseroId:', groupMeseroId);
      
      if (multiSelect.length < 2) {
        console.log('❌ Error: Selecciona al menos dos mesas');
        throw new Error('Selecciona al menos dos mesas.');
      }
      if (!groupMeseroId) {
        console.log('❌ Error: Selecciona el mesero responsable');
        throw new Error('Selecciona el mesero responsable.');
      }
      
      // Limpiar duplicados antes de enviar
      const uniqueMesas = Array.from(new Set(multiSelect));
      console.log('uniqueMesas:', uniqueMesas);
      
      const dataToSend = {
        id_restaurante: id_restaurante || 1,
        id_sucursal: id_sucursal || 1,
        mesas: uniqueMesas,
        id_mesero: parseInt(groupMeseroId)
      };
      
      console.log('📤 Datos a enviar:', dataToSend);
      
      await crearGrupoMesas(dataToSend);
    },
    onSuccess: () => {
      console.log('✅ Grupo de mesas creado exitosamente');
      setShowGroupModal(false);
      setMultiSelect([]);
      setGroupMeseroId('');
      toast({
        title: "Grupo Creado",
        description: "Grupo de mesas creado con éxito.",
      });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
    },
    onError: (err: any) => {
      console.error('❌ Error en groupMesasMutation:', err);
      toast({
        title: "Error",
        description: `Error al crear grupo: ${err?.message || 'Error desconocido.'}`,
        variant: "destructive",
      });
    },
  });

  // NUEVO: Mutación para reasignar mesero
  const reassignMeseroMutation = useMutation({
    mutationFn: async () => {
      if (!mesaToReassign || !reassignMeseroId) throw new Error('Datos incompletos para reasignar mesero.');
      await reasignarMesero(mesaToReassign.id_mesa, parseInt(reassignMeseroId));
    },
    onSuccess: () => {
      setShowReassignMeseroModal(false);
      setReassignMeseroId('');
      setMesaToReassign(null);
      toast({
        title: "Mesero Reasignado",
        description: "Mesero reasignado con éxito.",
      });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: `Error al reasignar mesero: ${err?.message || 'Error desconocido.'}`,
        variant: "destructive",
      });
    },
  });

  // --- Handlers ---

  const handleMesaClick = useCallback((mesa: Mesa) => {
    setSelectedMesa(mesa);
    setDrawerOpen(true);
    setIsTakingOrder(false); // Reset to info view when a new mesa is selected
    setCart([]); // Clear cart
    setSearchTerm(''); // Clear product search
    setSelectedCategory('all'); // Reset category filter
  }, []);

  const handleAddToCart = useCallback((prod: Product) => {
    setCart((prev) => {
      const existingItemIndex = prev.findIndex((p) => p.id === prod.id);
      if (existingItemIndex >= 0) {
        const updatedCart = [...prev];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: (updatedCart[existingItemIndex].quantity || 0) + 1,
        };
        return updatedCart;
      }
      return [{ ...prod, quantity: 1 }, ...prev]; // Add new items to the top of the cart
    });
  }, []);

  const handleRemoveFromCart = useCallback((prod: Product) => {
    setCart((prev) => {
      const existingItemIndex = prev.findIndex((p) => p.id === prod.id);
      if (existingItemIndex >= 0) {
        const updatedCart = [...prev];
        if ((updatedCart[existingItemIndex].quantity || 0) > 1) {
          updatedCart[existingItemIndex] = {
            ...updatedCart[existingItemIndex],
            quantity: updatedCart[existingItemIndex].quantity - 1,
          };
          return updatedCart;
        } else {
          updatedCart.splice(existingItemIndex, 1);
          return updatedCart;
        }
      }
      return prev;
    });
  }, []);

  // Map backend table status to visual states
  const getMesaState = useCallback((estado: string, id_grupo_mesa?: number): MesaStateBadge => {
    // Si la mesa está en grupo, mostrar estado especial
    if (id_grupo_mesa) {
      return MESA_STATE_BADGES['en_grupo'];
    }
    
    if (MESA_STATE_BADGES[estado]) return MESA_STATE_BADGES[estado];
    if (estado === 'en_uso') return MESA_STATE_BADGES['ocupada'];
    if (estado === 'pagado') return MESA_STATE_BADGES['libre']; // Assuming 'pagado' means it becomes free
    if (estado === 'pendiente' || estado === 'pendiente cobro')
      return MESA_STATE_BADGES['pendiente_cobro'];
    return MESA_STATE_BADGES['libre']; // Default to 'libre' for unknown states
  }, []);

  // NUEVO: Handler para seleccionar/deseleccionar mesas
  const handleMesaMultiSelect = useCallback((mesa: Mesa) => {
    setMultiSelect((prev) =>
      prev.includes(mesa.id_mesa)
        ? prev.filter((id) => id !== mesa.id_mesa)
        : [...prev, mesa.id_mesa]
    );
  }, []);

  // NUEVO: Handler para abrir modal de reasignación
  const handleReassignMesero = useCallback((mesa: Mesa) => {
    setMesaToReassign(mesa);
    setShowReassignMeseroModal(true);
  }, []);

  // NUEVO: Render de barra de acciones masivas
  const renderMultiSelectBar = () => (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 shadow-2xl rounded-full px-8 py-4 flex items-center gap-6 z-50 border border-gray-200 dark:border-gray-700 animate-fade-in-up">
      <span className="font-bold text-lg text-gray-800 dark:text-gray-100">
        {multiSelect.length} mesa{multiSelect.length > 1 ? 's' : ''} seleccionada{multiSelect.length > 1 ? 's' : ''}
      </span>
      <Button
        variant="default"
        size="lg"
        className="rounded-full font-bold"
        onClick={() => {
          console.log('🎯 Botón Unir Mesas clickeado');
          console.log('Estado actual de showGroupModal:', showGroupModal);
          alert('Botón Unir Mesas clickeado - showGroupModal será true');
          setShowGroupModal(true);
          console.log('showGroupModal establecido a true');
        }}
        disabled={multiSelect.length < 2}
      >
        Unir Mesas
      </Button>
      <Button
        variant="outline"
        size="lg"
        className="rounded-full"
        onClick={() => setMultiSelect([])}
      >
        Cancelar
      </Button>
    </div>
  );

  // --- Render Logic ---

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-blue-50/80 via-white/80 to-blue-100/60 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {/* Eliminar <MeseroHeader /> aquí, dejar solo el contenido principal */}
      <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 text-center tracking-tight bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg animate-fade-in-down">
        Sistema de Gestión de Mesas
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 text-center max-w-2xl animate-fade-in">
        Visualiza el estado de las mesas en tiempo real, gestiona órdenes y
        realiza acciones como liberar, transferir o dividir cuentas.
      </p>

      {isLoadingMesas && (
        <div className="text-center text-xl py-12 text-gray-500 dark:text-gray-400 animate-pulse">
          Cargando mesas...
        </div>
      )}
      {isErrorMesas && (
        <div className="text-center text-red-600 font-bold py-12 flex flex-col items-center animate-fade-in">
          Error al cargar mesas:{' '}
          {errorMesas instanceof Error ? errorMesas.message : 'Error desconocido'}
          <Button variant="outline" onClick={() => refetchMesas()} className="mt-4 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
            Reintentar
          </Button>
        </div>
      )}
      {!isLoadingMesas && !isErrorMesas && mesas?.length === 0 && (
        <div className="text-center text-xl py-12 text-gray-500 dark:text-gray-400 animate-fade-in">
          No hay mesas disponibles para esta sucursal.
        </div>
      )}

      {/* DEBUG: Botón para forzar refresh */}
      <div className="text-center mb-4">
        <Button 
          onClick={() => {
            console.log('🔄 Forzando refresh de mesas...');
            refetchMesas();
          }}
          variant="outline"
          className="mb-4"
        >
          🔄 Refresh Mesas (Debug)
        </Button>
      </div>

      {/* NUEVO: Barra de selección múltiple */}
      {multiSelect.length > 0 && renderMultiSelectBar()}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 lg:gap-8 w-full max-w-screen-xl mx-auto">
        {Array.isArray(mesas) &&
          mesas.map((mesa) => {
            // DEBUG: Log mesa data
            console.log('Mesa data:', {
              id: mesa.id_mesa,
              numero: mesa.numero,
              estado: mesa.estado,
              id_grupo_mesa: mesa.id_grupo_mesa,
              nombre_mesero_grupo: mesa.nombre_mesero_grupo
            });
            
            const state = getMesaState(mesa.estado, mesa.id_grupo_mesa);
            const isSelected = multiSelect.includes(mesa.id_mesa);
            const isGrouped = mesa.id_grupo_mesa; // NUEVO: verificar si está agrupada
            
            // DEBUG: Log state and grouped info
            console.log('Mesa state:', {
              mesa: mesa.numero,
              estado: mesa.estado,
              id_grupo_mesa: mesa.id_grupo_mesa,
              isGrouped: isGrouped,
              stateLabel: state.label,
              stateBadge: state.badge
            });
            return (
              <button
                key={mesa.id_mesa}
                className={cn(
                  'rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 sm:p-8 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-400/60 relative h-48 group overflow-hidden',
                  'bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-md',
                  'border border-gray-200 dark:border-gray-700',
                  'hover:border-blue-400 dark:hover:border-purple-400',
                  'glassmorphism-card',
                  'transform-gpu animate-fade-in',
                  isSelected && 'ring-4 ring-purple-500 border-purple-500 scale-105',
                  isGrouped && 'ring-2 ring-purple-400 border-purple-400', // NUEVO: indicador de grupo
                )}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    handleMesaMultiSelect(mesa);
                  } else {
                    setSelectedMesa(mesa);
                    setDrawerOpen(true);
                    setIsTakingOrder(false);
                    setCart([]);
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }
                }}
                aria-label={`Mesa ${mesa.numero}, estado ${state.label}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-500/10 dark:to-purple-500/10 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div> {/* Enhanced overlay */}

                <span className="text-6xl font-black drop-shadow-lg text-gray-900 dark:text-gray-100 z-10">
                  {mesa.numero}
                </span>
                <span className="text-lg mt-3 font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1 z-10">
                  <Users className="w-5 h-5 opacity-80 text-blue-500 dark:text-blue-300" /> {mesa.capacidad} pers.
                </span>
                <Badge
                  className={cn(
                    'absolute top-4 right-4 px-3 py-1 text-sm font-bold shadow-md z-20',
                    state.badge,
                    'backdrop-blur-sm flex items-center gap-1 animate-scale-in'
                  )}
                >
                  {state.icon} {state.label}
                </Badge>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300/80 z-10">
                  <Clock className="w-4 h-4 text-purple-500 dark:text-purple-300" /> {/* TODO: display real-time if available */}
                  Tiempo
                </div>
                <div className="absolute bottom-4 right-4 text-lg font-bold text-gray-800 dark:text-gray-100/90 z-10">
                  Bs {Number(mesa.total_acumulado ?? 0).toFixed(2)}
                </div>
                {/* Visual hover effect border */}
                <div className="absolute inset-0 rounded-3xl pointer-events-none group-hover:ring-4 group-hover:ring-blue-300/70 transition-all duration-300" />
                {isSelected && (
                  <span className="absolute top-2 left-2 bg-purple-600 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg z-30 animate-scale-in">
                    Seleccionada
                  </span>
                )}
                {/* NUEVO: Indicador de grupo mejorado */}
                {isGrouped && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg z-30 animate-scale-in flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    En Grupo
                  </div>
                )}
                
                {/* NUEVO: Indicador de reservas */}
                {getReservasForMesa(mesa.id_mesa).length > 0 && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg z-30 animate-scale-in flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Reservada
                  </div>
                )}
                
                {/* Información adicional del grupo */}
                {isGrouped && mesa.nombre_mesero_grupo && (
                  <div className="absolute bottom-12 left-4 text-xs text-purple-600 dark:text-purple-300 font-medium z-10">
                    Mesero: {mesa.nombre_mesero_grupo}
                  </div>
                )}
                
                {/* NUEVO: Información de reservas */}
                {getReservasForMesa(mesa.id_mesa).length > 0 && (
                  <div className="absolute bottom-12 right-4 text-xs text-orange-600 dark:text-orange-300 font-medium z-10">
                    {getReservasForMesa(mesa.id_mesa).length} reserva{getReservasForMesa(mesa.id_mesa).length !== 1 ? 's' : ''}
                  </div>
                )}
              </button>
            );
          })}
      </div>

      {/* Drawer for Mesa Details and Order Taking */}
      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            // Reset states when drawer closes
            setIsTakingOrder(false);
            setCart([]);
            setSelectedMesa(null);
            setSearchTerm('');
            setSelectedCategory('all');
          }
        }}
      >
        {/* IMPORTANT: Removed max-w-3xl from here */}
        <DrawerContent className="w-full mx-auto bg-white/95 dark:bg-gray-900/95 shadow-2xl rounded-t-3xl animate-fade-in-up border-0 backdrop-blur-xl flex flex-col max-h-[95vh] h-[95vh] overflow-hidden">
          <DrawerHeader className="px-8 py-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center flex-shrink-0 bg-white/90 dark:bg-gray-900/90">
            <DrawerTitle>
              {selectedMesa && (
                <span className="flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-white drop-shadow-sm">
                  {getMesaState(selectedMesa.estado, selectedMesa.id_grupo_mesa).icon} Mesa{' '}
                  <span className="text-blue-600 dark:text-blue-400">
                    {selectedMesa.numero}
                  </span>{' '}
                  -{' '}
                  <Badge className={cn('text-lg font-bold', getMesaState(selectedMesa.estado, selectedMesa.id_grupo_mesa).badge)}>
                    {getMesaState(selectedMesa.estado, selectedMesa.id_grupo_mesa).label}
                  </Badge>
                </span>
              )}
            </DrawerTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDrawerOpen(false)}
              aria-label="Cerrar"
              className="w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </Button>
          </DrawerHeader>

          {selectedMesa && !isTakingOrder && (
            <div className="p-8 w-full flex flex-col items-center justify-center flex-1 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 w-full max-w-2xl text-lg mb-10 border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white/80 dark:bg-gray-800/80 shadow-lg animate-fade-in-up">
                <div className="flex items-center gap-4">
                  <UserIcon className="w-6 h-6 text-cyan-500" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Mesero:
                  </span>
                  <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                    {'No asignado'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Clock className="w-6 h-6 text-pink-500" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Tiempo ocupada:
                  </span>
                  <span className="font-semibold text-pink-700 dark:text-pink-300">
                    {/* TODO: Calculate and display real-time occupied duration */}
                    N/A
                  </span>
                </div>
                <div className="flex items-center gap-4 col-span-full">
                  <Info className="w-6 h-6 text-amber-500" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Total parcial:
                  </span>
                  <span className="font-semibold text-amber-700 dark:text-amber-300 text-2xl">
                    Bs {Number(selectedMesa.total_acumulado ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReassignMesero(selectedMesa)}
                    className="flex items-center gap-2"
                  >
                    <UserIcon className="h-4 w-4" />
                    Reasignar Mesero
                  </Button>
                  
                  {/* NUEVO: Botón de reservas */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('🔍 Botón Reservas clickeado');
                      handleOpenReservaModal(selectedMesa);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Reservas
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => freeMesaMutation.mutate(selectedMesa.id_mesa)}
                    className="flex items-center gap-2"
                  >
                    <DoorOpen className="h-4 w-4" />
                    Liberar Mesa
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-8 justify-center w-full max-w-2xl">
                <Button
                  variant="default"
                  size="lg"
                  className="shadow-md px-6 py-3 text-base font-bold flex-grow sm:flex-grow-0 rounded-full animate-pop-in"
                  onClick={() => setIsTakingOrder(true)}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" /> Tomar Pedido
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="shadow-md px-6 py-3 text-base font-bold flex items-center gap-2 flex-grow sm:flex-grow-0 rounded-full animate-pop-in animation-delay-100"
                  onClick={() => setShowSplitModal(true)}
                  disabled={selectedMesa.estado === 'libre'} // Cannot split a free table
                >
                  <Split className="w-5 h-5" />Dividir Cuenta
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="shadow-md px-6 py-3 text-base font-bold flex items-center gap-2 flex-grow sm:flex-grow-0 rounded-full animate-pop-in animation-delay-200"
                  onClick={() => setShowTransferModal(true)}
                  disabled={selectedMesa.estado === 'libre'} // Cannot transfer a free table
                >
                  <Link2 className="w-5 h-5" />Transferir
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="shadow-md px-6 py-3 text-base font-bold flex items-center gap-2 flex-grow sm:flex-grow-0 rounded-full animate-pop-in animation-delay-300"
                  onClick={() => freeMesaMutation.mutate(selectedMesa.id_mesa)}
                  disabled={freeMesaMutation.isPending}
                >
                  <Trash2 className="w-5 h-5" />
                  {freeMesaMutation.isPending ? 'Liberando...' : 'Liberar Mesa'}
                </Button>
              </div>
            </div>
          )}

          {selectedMesa && isTakingOrder && (
            <div className="flex flex-col md:flex-row flex-1 w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 rounded-b-3xl overflow-hidden">
              {/* Product Catalog Column */}
              <ProductCatalog
                products={filteredProducts}
                onAdd={handleAddToCart}
                isLoading={isLoadingProducts}
                isError={isErrorProducts}
                error={errorProducts}
                refetch={refetchProducts}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                categories={categories}
              />

              {/* Order Cart Column */}
              <div className="w-full md:w-[420px] md:max-w-[420px] md:min-w-[360px] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 flex flex-col p-6 shadow-xl relative z-10">
                <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-blue-500" /> Orden Actual
                </h3>
                <OrderCart
                  cart={cart}
                  onAdd={handleAddToCart}
                  onRemove={handleRemoveFromCart}
                  total={cartTotal}
                />
                <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-800 sticky bottom-0 bg-white/80 dark:bg-gray-900/80 -mx-6 px-6"> {/* Made sticky */}
                  <div className="flex justify-between items-center text-xl font-bold mb-4 text-gray-900 dark:text-white">
                    <span>Total:</span>
                    <span className="text-blue-600 dark:text-blue-400 text-3xl">Bs {cartTotal.toFixed(2)}</span>
                  </div>
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full py-4 text-lg font-bold shadow-lg rounded-xl transition-all duration-200 hover:scale-[1.01]"
                    disabled={
                      cart.length === 0 || addProductsToMesaMutation.isPending
                    }
                    onClick={() => addProductsToMesaMutation.mutate()}
                  >
                    {addProductsToMesaMutation.isPending
                      ? 'Enviando Orden...'
                      : 'Enviar Orden a Caja'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Modal for Transfer Mesa */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Transferir Mesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-600 dark:text-gray-300">
              Mueva la orden de la mesa{' '}
              <span className="font-semibold text-blue-500">{selectedMesa?.numero}</span> a otro grupo existente.
            </p>
            <label htmlFor="transfer-mesa-id" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              ID del Grupo de destino:
            </label>
            <Input
              id="transfer-mesa-id"
              type="number"
              value={transferMesaId}
              onChange={(e) => setTransferMesaId(e.target.value)}
              placeholder="Ingrese el ID del grupo de destino"
              className="text-base border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setShowTransferModal(false)} className="rounded-lg">
              Cancelar
            </Button>
            <Button
              onClick={() => transferMesaMutation.mutate()}
              disabled={!transferMesaId || transferMesaMutation.isPending}
              className="rounded-lg"
            >
              {transferMesaMutation.isPending ? 'Transfiriendo...' : 'Transferir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal for Split Bill */}
      <Dialog open={showSplitModal} onOpenChange={setShowSplitModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Dividir Cuenta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-600 dark:text-gray-300">
              Cree un nuevo grupo de mesas para dividir la cuenta de la mesa{' '}
              <span className="font-semibold text-blue-500">{selectedMesa?.numero}</span>.
            </p>
            <label htmlFor="split-mesa-ids" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Números de Mesas a agrupar (separados por coma):
            </label>
            <Input
              id="split-mesa-ids"
              type="text"
              value={splitMesaIdsInput}
              onChange={(e) => setSplitMesaIdsInput(e.target.value)}
              placeholder="Ej: 12, 13, 14"
              className="text-base border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setShowSplitModal(false)} className="rounded-lg">
              Cancelar
            </Button>
            <Button
              onClick={() => splitBillMutation.mutate()}
              disabled={!splitMesaIdsInput || splitBillMutation.isPending}
              className="rounded-lg"
            >
              {splitBillMutation.isPending ? 'Dividiendo...' : 'Dividir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NUEVO: Modal para unir mesas */}
      <Dialog open={showGroupModal} onOpenChange={setShowGroupModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Unir Mesas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-600 dark:text-gray-300">
              Vas a unir las mesas: <span className="font-semibold text-blue-500">{multiSelect.join(', ')}</span>
            </p>
            <label htmlFor="group-mesero-id" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Mesero responsable:
            </label>
            <select
              id="group-mesero-id"
              value={groupMeseroId}
              onChange={e => {
                console.log('🔽 Mesero seleccionado:', e.target.value);
                setGroupMeseroId(e.target.value);
              }}
              className="w-full text-base border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
              disabled={isLoadingMeseros}
            >
              <option value="">Selecciona un mesero...</option>
              {meseros.map(m => (
                <option key={m.id} value={m.id}>{m.nombre} ({m.username})</option>
              ))}
            </select>
          </div>
          <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setShowGroupModal(false)} className="rounded-lg">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                console.log('🚀 Botón Unir Mesas en modal clickeado');
                console.log('groupMeseroId:', groupMeseroId);
                groupMesasMutation.mutate();
              }}
              disabled={multiSelect.length < 2 || !groupMeseroId || groupMesasMutation.isPending}
              className="rounded-lg"
            >
              {groupMesasMutation.isPending ? 'Uniendo...' : 'Unir Mesas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NUEVO: Modal para reasignar mesero */}
      <Dialog open={showReassignMeseroModal} onOpenChange={setShowReassignMeseroModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Reasignar Mesero</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-600 dark:text-gray-300">
              Reasignar mesero para la mesa{' '}
              <span className="font-semibold text-blue-500">{mesaToReassign?.numero}</span>
            </p>
            <label htmlFor="reassign-mesero-id" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              ID del nuevo Mesero:
            </label>
            <Input
              id="reassign-mesero-id"
              type="number"
              value={reassignMeseroId}
              onChange={(e) => setReassignMeseroId(e.target.value)}
              placeholder="Ingrese el ID del nuevo mesero"
              className="text-base border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setShowReassignMeseroModal(false)} className="rounded-lg">
              Cancelar
            </Button>
            <Button
              onClick={() => reassignMeseroMutation.mutate()}
              disabled={!reassignMeseroId || reassignMeseroMutation.isPending}
              className="rounded-lg"
            >
              {reassignMeseroMutation.isPending ? 'Reasignando...' : 'Reasignar Mesero'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NUEVO: Modal de Reservas */}
      {showReservaModal && selectedMesaForReserva && (
        <ReservaModal
          isOpen={showReservaModal}
          onClose={() => {
            console.log('🔍 Cerrando modal de reservas');
            setShowReservaModal(false);
            setSelectedMesaForReserva(null);
          }}
          mesa={selectedMesaForReserva}
          sucursalId={id_sucursal}
        />
      )}

      {/* Custom Animations for a more dynamic feel */}
      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.5s cubic-bezier(0.23, 1, 0.32, 1);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fade-in-down {
          animation: fadeInDown 0.7s ease-out;
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-scale-in {
          animation: scaleIn 0.3s ease-out forwards;
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-pop-in {
          animation: popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
          opacity: 0; /* Start hidden */
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.8); }
          70% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* Utility for sequential animations */
        .animation-delay-100 { animation-delay: 0.1s; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-300 { animation-delay: 0.3s; }

        .glassmorphism-card {
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1); /* Slightly lighter shadow */
          backdrop-filter: blur(10px); /* Increased blur */
          -webkit-backdrop-filter: blur(10px);
        }

        /* Hide scrollbar but allow scrolling */
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
    </div>
  );
}



