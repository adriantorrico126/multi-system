import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { 
  FaUser, 
  FaSignOutAlt, 
  FaCog, 
  FaBars, 
  FaHome, 
  FaUtensils, 
  FaChartBar, 
  FaBoxes,
  FaUsers,
  FaReceipt,
  FaPrint,
  FaMobile,
  FaTablet,
  FaDesktop
} from 'react-icons/fa';

interface HeaderProps {
  currentBranch?: any;
  branches?: any[];
  onSucursalChange?: (branchId: string) => void;
  selectedBranchId?: string;
}

export function Header({ 
  currentBranch, 
  branches, 
  onSucursalChange, 
  selectedBranchId 
}: HeaderProps) {
  const { user, logout } = useAuth();
  const { isMobile, isTablet, screenSize, orientation, isTouch } = useMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Debug logs
  console.log('🔍 Header Debug - currentUser:', user);
  console.log('🔍 Header Debug - currentBranch:', currentBranch);
  console.log('🔍 Header Debug - branches:', branches);
  console.log('🔍 Header Debug - selectedBranchId:', selectedBranchId);
  console.log('🔍 Header Debug - onSucursalChange:', !!onSucursalChange);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const handleBranchChange = (branchId: string) => {
    if (onSucursalChange) {
      onSucursalChange(branchId);
    }
    setIsMenuOpen(false);
  };

  // Navegación móvil optimizada
  const mobileNavItems = [
    { icon: FaHome, label: 'Inicio', href: '/' },
    { icon: FaUtensils, label: 'Cocina', href: '/kitchen' },
    { icon: FaChartBar, label: 'Dashboard', href: '/dashboard' },
    { icon: FaBoxes, label: 'Inventario', href: '/inventory' },
    { icon: FaUsers, label: 'Usuarios', href: '/users' },
    { icon: FaReceipt, label: 'Ventas', href: '/sales' },
    { icon: FaPrint, label: 'Impresión', href: '/print' },
  ];

  // Header compacto para móviles pequeños
  if (isMobile && screenSize === 'xs') {
    return (
      <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Logo y título compacto */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <FaUtensils className="text-white text-sm" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900">POS</h1>
              <p className="text-xs text-gray-500">Sistema de Punto de Venta</p>
            </div>
          </div>

          {/* Botón de menú */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <FaBars className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-2">
                  <FaUser className="text-blue-600" />
                  <span>Menú Principal</span>
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-4">
                {/* Información del usuario */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <FaUser className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user?.nombre || 'Usuario'}</p>
                      <p className="text-sm text-gray-500">{user?.rol || 'Rol'}</p>
                    </div>
                  </div>
                </div>

                {/* Navegación */}
                <nav className="space-y-2">
                  {mobileNavItems.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon className="text-gray-600 w-5 h-5" />
                      <span className="text-gray-900">{item.label}</span>
                    </a>
                  ))}
                </nav>

                {/* Separador */}
                <div className="border-t border-gray-200 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full justify-start"
                  >
                    <FaSignOutAlt className="mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    );
  }

  // Header estándar para tablets y desktop
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Logo y título */}
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <FaUtensils className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sistema POS</h1>
            <p className="text-sm text-gray-500">
              {currentBranch?.name || 'Selecciona una sucursal'}
            </p>
          </div>
        </div>

        {/* Información del usuario y sucursal */}
        <div className="flex items-center space-x-4">
          {/* Indicador de dispositivo */}
          <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-500">
            {isMobile && <FaMobile className="w-4 h-4" />}
            {isTablet && <FaTablet className="w-4 h-4" />}
            {!isMobile && !isTablet && <FaDesktop className="w-4 h-4" />}
            <span className="hidden md:inline">
              {orientation === 'portrait' ? 'Vertical' : 'Horizontal'}
            </span>
          </div>

          {/* Selector de sucursal */}
          {branches && branches.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <span className="truncate max-w-32">
                    {currentBranch?.name || 'Sucursal'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled>
                  <span className="font-semibold">Seleccionar Sucursal</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {branches.map((branch) => (
                  <DropdownMenuItem
                    key={branch.id}
                    onClick={() => handleBranchChange(branch.id)}
                    className={selectedBranchId === branch.id ? 'bg-blue-50' : ''}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{branch.name}</span>
                      <span className="text-xs text-gray-500">{branch.location}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <FaUser className="text-white text-sm" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.nombre || 'Usuario'}</p>
                  <p className="text-xs text-gray-500">{user?.rol || 'Rol'}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem disabled>
                <div className="flex flex-col">
                  <span className="font-semibold">{user?.nombre || 'Usuario'}</span>
                  <span className="text-sm text-gray-500">{user?.username || 'username'}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <FaCog className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <FaSignOutAlt className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

/ /   B u i l d   f o r c e :   0 8 / 2 8 / 2 0 2 5   2 2 : 3 5 : 0 6  
 