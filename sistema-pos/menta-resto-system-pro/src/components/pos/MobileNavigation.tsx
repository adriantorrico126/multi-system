import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Home,
  ShoppingCart,
  CreditCard,
  Receipt,
  Users,
  Package,
  Settings,
  Menu,
  BarChart3,
  ClipboardList,
  Building,
  Tag,
  UtensilsCrossed,
  Database,
  UserCheck,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMobile } from '@/hooks/use-mobile';

interface MobileNavigationProps {
  cartItemsCount?: number;
  onOpenConfig?: () => void;
  onLogout?: () => void;
}

export function MobileNavigation({ cartItemsCount = 0, onOpenConfig, onLogout }: MobileNavigationProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const mobileInfo = useMobile();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Navegación principal optimizada para móviles
  const navigationItems = [
    { 
      icon: Home, 
      label: 'Inicio', 
      path: '/', 
      show: true,
      color: 'from-blue-500 to-indigo-600',
      description: 'Página principal'
    },
    { 
      icon: ShoppingCart, 
      label: 'Punto de Venta', 
      path: '/', 
      show: ['admin', 'cajero', 'mesero', 'super_admin'].includes(user?.rol),
      color: 'from-green-500 to-emerald-600',
      description: 'Realizar ventas'
    },
    { 
      icon: CreditCard, 
      label: 'Arqueo', 
      path: '/arqueo', 
      show: ['admin', 'cajero', 'super_admin'].includes(user?.rol),
      color: 'from-emerald-500 to-green-600',
      description: 'Gestión de caja'
    },
    { 
      icon: Receipt, 
      label: 'Egresos', 
      path: '/egresos-caja', 
      show: ['cajero'].includes(user?.rol),
      color: 'from-red-500 to-pink-600',
      description: 'Registrar gastos'
    },
    { 
      icon: Package, 
      label: 'Inventario', 
      path: '/inventario', 
      show: ['admin', 'super_admin'].includes(user?.rol),
      color: 'from-blue-500 to-indigo-600',
      description: 'Control de stock'
    },
    { 
      icon: UtensilsCrossed, 
      label: 'Cocina', 
      path: '/cocina', 
      show: ['admin', 'cocinero', 'super_admin'].includes(user?.rol),
      color: 'from-orange-500 to-red-600',
      description: 'Gestión de pedidos'
    },
    { 
      icon: ClipboardList, 
      label: 'Pedidos', 
      path: '/pedidos', 
      show: ['admin', 'mesero', 'cajero', 'super_admin'].includes(user?.rol),
      color: 'from-purple-500 to-pink-600',
      description: 'Gestión de pedidos'
    },
    { 
      icon: BarChart3, 
      label: 'Historial', 
      path: '/historial-ventas', 
      show: ['admin', 'cajero', 'super_admin'].includes(user?.rol),
      color: 'from-gray-500 to-slate-600',
      description: 'Historial de ventas'
    },
    { 
      icon: Users, 
      label: 'Usuarios', 
      path: '/usuarios', 
      show: ['admin', 'super_admin'].includes(user?.rol),
      color: 'from-teal-500 to-cyan-600',
      description: 'Gestión de usuarios'
    },
    { 
      icon: Tag, 
      label: 'Categorías', 
      path: '/categorias', 
      show: ['admin', 'super_admin'].includes(user?.rol),
      color: 'from-amber-500 to-orange-600',
      description: 'Gestión de categorías'
    },
    { 
      icon: Building, 
      label: 'Sucursales', 
      path: '/sucursales', 
      show: ['admin', 'super_admin'].includes(user?.rol),
      color: 'from-indigo-500 to-purple-600',
      description: 'Gestión de sucursales'
    },
    { 
      icon: Database, 
      label: 'Productos', 
      path: '/productos', 
      show: ['admin', 'super_admin'].includes(user?.rol),
      color: 'from-cyan-500 to-blue-600',
      description: 'Gestión de productos'
    },
  ];

  // Filtrar elementos de navegación visibles
  const visibleNavigationItems = navigationItems.filter(item => 
    item.show === true || (Array.isArray(item.show) && item.show.includes(user?.rol))
  );

  // Solo mostrar en móviles
  if (!mobileInfo.isMobile) {
    return null;
  }

  return (
    <>
      {/* Botón flotante de navegación */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="fixed bottom-20 left-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl border-0"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] bg-white/95 backdrop-blur-sm">
          <SheetHeader className="border-b border-gray-200 pb-4">
            <SheetTitle className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Menu className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Sistema POS</h2>
                <p className="text-sm text-gray-600">Navegación rápida</p>
              </div>
            </SheetTitle>
          </SheetHeader>
          
          <div className="py-4 space-y-2">
            {/* Información del usuario */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <UserCheck className="text-white text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{user?.nombre || user?.username}</p>
                  <p className="text-sm text-gray-600 capitalize">{user?.rol}</p>
                </div>
              </div>
            </div>

            {/* Navegación */}
            <div className="space-y-1">
              {visibleNavigationItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className="w-full justify-start h-14 px-4 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200"
                  onClick={() => handleNavigation(item.path)}
                >
                  <div className={`w-8 h-8 bg-gradient-to-r ${item.color} rounded-lg flex items-center justify-center mr-3`}>
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-gray-900">{item.label}</span>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </Button>
              ))}
            </div>

            {/* Botones de acción */}
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => {
                  if (onOpenConfig) onOpenConfig();
                }}
              >
                <Settings className="h-4 w-4 mr-3" />
                Configuración
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start h-12"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}