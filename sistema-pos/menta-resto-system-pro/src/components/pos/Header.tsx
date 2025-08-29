import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
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
  FaUser, 
  FaSignOutAlt, 
  FaCog, 
  FaUtensils,
  FaBell,
  FaCashRegister,
  FaBoxes,
  FaChartBar,
  FaQuestionCircle,
  FaClock,
  FaHome,
  FaUtensils as FaKitchen,
  FaReceipt,
  FaUsers,
  FaBuilding
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  currentBranch?: any;
  branches?: any[];
  onSucursalChange?: (branchId: string) => void;
  selectedBranchId?: string;
  currentUser?: any;
  salesCount?: number;
  onLogout?: () => void;
  onOpenConfig?: () => void;
}

export function Header({ 
  currentBranch, 
  branches, 
  onSucursalChange, 
  selectedBranchId,
  currentUser,
  salesCount = 0,
  onLogout,
  onOpenConfig
}: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // Navegación principal
  const navigationItems = [
    { icon: FaHome, label: 'Inicio', path: '/', show: true },
    { icon: FaCashRegister, label: 'Arqueo', path: '/arqueo', show: ['admin', 'cajero', 'super_admin'].includes(user?.rol) },
    { icon: FaBoxes, label: 'Inventario', path: '/inventario', show: ['admin', 'super_admin'].includes(user?.rol) },
    { icon: FaChartBar, label: 'Dashboard', path: '/', show: ['admin', 'super_admin'].includes(user?.rol) },
    { icon: FaKitchen, label: 'Cocina', path: '/cocina', show: ['admin', 'cocinero', 'super_admin'].includes(user?.rol) },
    { icon: FaReceipt, label: 'Egresos', path: '/egresos', show: ['admin', 'super_admin'].includes(user?.rol) },
    { icon: FaUsers, label: 'Usuarios', path: '/', show: ['admin', 'super_admin'].includes(user?.rol) },
    { icon: FaBuilding, label: 'Sucursales', path: '/', show: ['admin', 'super_admin'].includes(user?.rol) },
    { icon: FaQuestionCircle, label: 'Soporte', path: '/soporte', show: true },
  ];

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Header principal */}
      <header className="px-4 py-4">
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

            {/* Notificaciones */}
            <Button variant="ghost" size="sm" className="relative">
              <FaBell className="h-5 w-5" />
              {salesCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                  {salesCount}
                </Badge>
              )}
            </Button>

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
                {onOpenConfig && (
                  <DropdownMenuItem onClick={onOpenConfig}>
                    <FaCog className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </DropdownMenuItem>
                )}
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

      {/* Navegación principal */}
      <nav className="px-4 pb-4">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {navigationItems
            .filter(item => item.show === true || (Array.isArray(item.show) && item.show.includes(user?.rol)))
            .map((item) => (
              <Button
                key={item.label}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 whitespace-nowrap rounded-xl transition-all duration-200 hover:bg-blue-50 hover:border-blue-200"
                onClick={() => navigate(item.path)}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            ))}
        </div>
      </nav>
    </div>
  );
}

