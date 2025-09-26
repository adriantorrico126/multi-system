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
  LogOut,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMobile } from '@/hooks/use-mobile';

interface MobileNavigationImprovedProps {
  cartItemsCount?: number;
  onOpenConfig?: () => void;
  onLogout?: () => void;
}

export function MobileNavigationImproved({ cartItemsCount = 0, onOpenConfig, onLogout }: MobileNavigationImprovedProps) {
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

  // Navegación principal optimizada para móvil
  const mainNavItems = [
    { id: 'pos', label: 'POS', icon: ShoppingCart, path: '/', color: 'from-blue-500 to-indigo-500' },
    { id: 'mesas', label: 'Mesas', icon: UtensilsCrossed, path: '/mesas', color: 'from-green-500 to-emerald-500' },
    { id: 'ventas', label: 'Ventas', icon: Receipt, path: '/ventas', color: 'from-purple-500 to-violet-500' },
    { id: 'productos', label: 'Productos', icon: Package, path: '/productos', color: 'from-orange-500 to-amber-500' },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard', color: 'from-cyan-500 to-blue-500' }
  ];

  // Navegación secundaria
  const secondaryNavItems = [
    { id: 'usuarios', label: 'Usuarios', icon: Users, path: '/usuarios', color: 'from-pink-500 to-rose-500' },
    { id: 'inventario', label: 'Inventario', icon: Database, path: '/inventario', color: 'from-teal-500 to-cyan-500' },
    { id: 'config', label: 'Configuración', icon: Settings, path: '/config', color: 'from-gray-500 to-slate-500' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Solo mostrar en móviles
  if (!mobileInfo.isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg mobile-nav">
      {/* Bottom Navigation Bar */}
      <div className="flex items-center justify-around px-2 py-2">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = window.location.pathname === item.path;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center gap-1 p-2 h-auto min-w-0 flex-1 mobile-touch-target ${
                isActive 
                  ? 'text-white bg-gradient-to-r ' + item.color + ' shadow-lg' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              } transition-all duration-200 mobile-touch-feedback`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isActive ? 'bg-white/20' : 'bg-gray-100'
              } transition-colors duration-200`}>
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-600'}`}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Cart Badge */}
      {cartItemsCount > 0 && (
        <div className="absolute -top-2 right-4 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
          {cartItemsCount}
        </div>
      )}

      {/* Menu Button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 w-8 h-8 p-0 bg-gray-100 hover:bg-gray-200 rounded-full mobile-touch-target"
          >
            <Menu className="h-4 w-4 text-gray-600" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 mobile-sidebar">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold">{user?.nombre || 'Usuario'}</span>
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            {/* Información del usuario */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {(user?.nombre || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{user?.nombre || 'Usuario'}</p>
                  <p className="text-sm text-gray-600 capitalize">{user?.rol || 'Usuario'}</p>
                </div>
              </div>
            </div>

            {/* Navegación secundaria */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Más opciones</h3>
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => handleNavigation(item.path)}
                    className="w-full justify-start gap-3 p-3 h-auto mobile-touch-target hover:bg-gray-50"
                  >
                    <div className={`w-8 h-8 bg-gradient-to-r ${item.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* Botón de logout */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-3 p-3 h-auto text-red-600 hover:text-red-700 hover:bg-red-50 mobile-touch-target"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <LogOut className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
