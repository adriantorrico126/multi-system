import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { 
  FaBars, 
  FaHome, 
  FaUtensils, 
  FaChartBar, 
  FaBoxes, 
  FaUsers, 
  FaReceipt, 
  FaPrint,
  FaCog,
  FaSignOutAlt,
  FaMobile,
  FaTablet,
  FaDesktop,
  FaRotateLeft,
  FaBell,
  FaShoppingCart,
  FaQrcode,
  FaCreditCard,
  FaCalculator,
  FaHistory,
  FaCog as FaSettings,
  FaUser
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

interface MobileNavigationProps {
  currentBranch?: any;
  branches?: any[];
  onSucursalChange?: (branchId: string) => void;
  selectedBranchId?: string;
  onLogout?: () => void;
}

export function MobileNavigation({
  currentBranch,
  branches,
  onSucursalChange,
  selectedBranchId,
  onLogout
}: MobileNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isMobile, isTablet, screenSize, orientation, isTouch, isIOS, isAndroid } = useMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Solo mostrar en dispositivos móviles
  if (!isMobile && !isTablet) {
    return null;
  }

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
    setIsMenuOpen(false);
  };

  const handleBranchChange = (branchId: string) => {
    if (onSucursalChange) {
      onSucursalChange(branchId);
    }
    setIsMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  // Navegación principal del POS
  const mainNavItems = [
    { 
      icon: FaHome, 
      label: 'Inicio', 
      path: '/', 
      description: 'Panel principal del sistema',
      badge: null
    },
    { 
      icon: FaUtensils, 
      label: 'Cocina', 
      path: '/kitchen', 
      description: 'Gestión de pedidos y preparación',
      badge: null
    },
    { 
      icon: FaChartBar, 
      label: 'Dashboard', 
      path: '/dashboard', 
      description: 'Estadísticas y reportes',
      badge: null
    },
    { 
      icon: FaBoxes, 
      label: 'Inventario', 
      path: '/inventory', 
      description: 'Control de stock y productos',
      badge: null
    },
    { 
      icon: FaUsers, 
      label: 'Usuarios', 
      path: '/users', 
      description: 'Gestión de personal',
      badge: null
    },
    { 
      icon: FaReceipt, 
      label: 'Ventas', 
      path: '/sales', 
      description: 'Historial de transacciones',
      badge: null
    },
    { 
      icon: FaPrint, 
      label: 'Impresión', 
      path: '/print', 
      description: 'Configuración de impresoras',
      badge: null
    },
  ];

  // Navegación específica por rol
  const roleNavItems = [];
  
  if (user?.rol === 'admin' || user?.rol === 'super_admin') {
    roleNavItems.push(
      { icon: FaCog, label: 'Configuración', path: '/config', description: 'Ajustes del sistema' },
      { icon: FaHistory, label: 'Auditoría', path: '/audit', description: 'Registros del sistema' }
    );
  }
  
  if (user?.rol === 'cajero' || user?.rol === 'admin') {
    roleNavItems.push(
      { icon: FaCreditCard, label: 'Egresos', path: '/egresos-caja', description: 'Gastos de caja' },
      { icon: FaCalculator, label: 'Arqueo', path: '/arqueo', description: 'Cierre de caja' }
    );
  }

  if (user?.rol === 'mesero') {
    roleNavItems.push(
      { icon: FaQrcode, label: 'Mesas', path: '/mesas', description: 'Gestión de mesas' },
      { icon: FaShoppingCart, label: 'Pedidos', path: '/pedidos', description: 'Nuevos pedidos' }
    );
  }

  const allNavItems = [...mainNavItems, ...roleNavItems];

  return (
    <>
      {/* Botón de menú flotante para móviles pequeños */}
      {isMobile && screenSize === 'xs' && (
        <div className="fixed bottom-4 right-4 z-50">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                size="lg" 
                className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-2xl hover:shadow-3xl transition-all duration-300"
              >
                <FaBars className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
              <SheetHeader className="text-center pb-4">
                <SheetTitle className="flex items-center justify-center space-x-2">
                  <FaMobile className="text-blue-600" />
                  <span>Menú Principal</span>
                </SheetTitle>
              </SheetHeader>
              
              <div className="space-y-4 overflow-y-auto pb-20">
                {/* Información del usuario */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <FaUser className="text-white text-lg" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{user?.nombre || 'Usuario'}</p>
                      <p className="text-sm text-gray-600">{user?.rol || 'Rol'}</p>
                      <p className="text-xs text-gray-500">{user?.username || 'username'}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {isMobile ? 'Móvil' : 'Tablet'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Sucursal actual */}
                {currentBranch && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{currentBranch.name}</p>
                        <p className="text-sm text-gray-600">{currentBranch.location}</p>
                      </div>
                      {branches && branches.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsMenuOpen(false)}
                          className="text-xs"
                        >
                          Cambiar
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Navegación principal */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 px-2">Navegación</h3>
                  {allNavItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all duration-200 ${
                        location.pathname === item.path
                          ? 'bg-blue-100 border-2 border-blue-300'
                          : 'bg-white hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        location.pathname === item.path
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-2">
                          {item.badge}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>

                {/* Acciones rápidas */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 px-2">Acciones</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleNavigation('/notifications')}
                      className="flex flex-col items-center space-y-2 p-4 h-auto"
                    >
                      <FaBell className="h-5 w-5" />
                      <span className="text-xs">Notificaciones</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleNavigation('/settings')}
                      className="flex flex-col items-center space-y-2 p-4 h-auto"
                    >
                      <FaSettings className="h-5 w-5" />
                      <span className="text-xs">Ajustes</span>
                    </Button>
                  </div>
                </div>

                {/* Cerrar sesión */}
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full py-4 rounded-2xl"
                >
                  <FaSignOutAlt className="mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Navegación inferior para tablets */}
      {isTablet && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
          <div className="flex items-center justify-around">
            {mainNavItems.slice(0, 5).map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
