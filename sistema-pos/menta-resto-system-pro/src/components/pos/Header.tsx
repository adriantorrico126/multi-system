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
  FaCashRegister,
  FaBoxes,
  FaQuestionCircle,
  FaShieldAlt,
  FaCrown,
  FaBuilding,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaMoneyBillWave,
  FaChartLine,
  FaInfoCircle
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

  // Navegación principal optimizada
  const navigationItems = [
    { 
      icon: FaCashRegister, 
      label: 'Arqueo', 
      path: '/arqueo', 
      show: ['admin', 'cajero', 'super_admin'].includes(user?.rol),
      color: 'from-emerald-500 to-green-600',
      description: 'Gestión de caja'
    },
    { 
      icon: FaMoneyBillWave, 
      label: 'Egresos', 
      path: '/egresos-caja', 
      show: ['cajero'].includes(user?.rol),
      color: 'from-red-500 to-pink-600',
      description: 'Registrar gastos'
    },
    { 
      icon: FaBoxes, 
      label: 'Inventario', 
      path: '/inventario', 
      show: ['admin', 'super_admin'].includes(user?.rol),
      color: 'from-blue-500 to-indigo-600',
      description: 'Control de stock'
    },
    { 
      icon: FaUtensils, 
      label: 'Cocina', 
      path: '/cocina', 
      show: ['admin', 'cocinero', 'super_admin'].includes(user?.rol),
      color: 'from-orange-500 to-red-600',
      description: 'Gestión de pedidos'
    },
    { 
      icon: FaInfoCircle, 
      label: 'Información', 
      path: '/info-caja', 
      show: ['cajero'].includes(user?.rol),
      color: 'from-cyan-500 to-blue-600',
      description: 'Resumen del día'
    },
    { 
      icon: FaQuestionCircle, 
      label: 'Soporte', 
      path: '/soporte', 
      show: true,
      color: 'from-purple-500 to-pink-600',
      description: 'Ayuda y soporte'
    },
  ];

  // Obtener color del rol
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'from-purple-600 to-pink-600';
      case 'admin': return 'from-blue-600 to-indigo-600';
      case 'cajero': return 'from-green-600 to-emerald-600';
      case 'cocinero': return 'from-orange-600 to-red-600';
      case 'mesero': return 'from-teal-600 to-cyan-600';
      default: return 'from-gray-600 to-slate-600';
    }
  };

  // Obtener icono del rol
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return FaCrown;
      case 'admin': return FaShieldAlt;
      case 'cajero': return FaCashRegister;
      case 'cocinero': return FaUtensils;
      case 'mesero': return FaUser;
      default: return FaUser;
    }
  };

  const RoleIcon = getRoleIcon(user?.rol);

  // Función para obtener el ID correcto de la sucursal
  const getBranchId = (branch: any) => {
    return branch.id_sucursal || branch.id;
  };

  // Función para obtener el nombre de la sucursal
  const getBranchName = (branch: any) => {
    return branch.nombre || branch.name || `Sucursal ${getBranchId(branch)}`;
  };

  // Función para obtener la ubicación de la sucursal
  const getBranchLocation = (branch: any) => {
    return branch.ciudad || branch.location || branch.direccion || branch.address || 'Sin ubicación';
  };

  // Función para verificar si una sucursal está seleccionada
  const isBranchSelected = (branch: any) => {
    const branchId = getBranchId(branch);
    return selectedBranchId === branchId || selectedBranchId === branch.id_sucursal || selectedBranchId === branch.id;
  };

  // Debug: mostrar información de sucursales
  console.log('🔍 Header Debug - branches:', branches);
  console.log('🔍 Header Debug - currentBranch:', currentBranch);
  console.log('🔍 Header Debug - selectedBranchId:', selectedBranchId);
  console.log('🔍 Header Debug - branches structure:', branches?.map(b => ({
    id: b.id,
    id_sucursal: b.id_sucursal,
    nombre: b.nombre,
    name: b.name,
    ciudad: b.ciudad,
    location: b.location,
    direccion: b.direccion,
    address: b.address,
    allProps: Object.keys(b)
  })));

  return (
    <div className="bg-gradient-to-r from-white via-gray-50/50 to-white border-b border-gray-200/50 shadow-lg backdrop-blur-sm">
      {/* Header principal - TODO EN UNA SOLA LÍNEA */}
      <header className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
              <FaUtensils className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Sistema POS
              </h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-gray-600 font-medium">
                  {currentBranch ? getBranchName(currentBranch) : 'Selecciona una sucursal'}
                </p>
              </div>
            </div>
          </div>

          {/* Navegación principal - EN LA MISMA LÍNEA */}
          <div className="flex items-center space-x-4">
            {navigationItems
              .filter(item => item.show === true || (Array.isArray(item.show) && item.show.includes(user?.rol)))
              .map((item) => (
                <Button
                  key={item.label}
                  variant="outline"
                  size="sm"
                  className={`flex items-center space-x-2 whitespace-nowrap rounded-lg transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg border-2 bg-white/90 backdrop-blur-sm px-4 py-2 min-w-[140px] h-12 ${
                    item.color ? `hover:bg-gradient-to-r ${item.color} hover:text-white hover:border-transparent` : 'hover:bg-blue-50 hover:border-blue-300'
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    item.color ? `bg-gradient-to-r ${item.color} text-white` : 'bg-gray-100 text-gray-600'
                  }`}>
                    <item.icon className="h-3 w-3" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-sm">{item.label}</span>
                    <p className="text-xs text-gray-500 leading-tight">{item.description}</p>
                  </div>
                </Button>
              ))}
          </div>

          {/* Información del usuario y sucursal */}
          <div className="flex items-center space-x-4">
            {/* Selector de sucursal SOLO PARA ADMINISTRADORES */}
            {branches && branches.length > 0 && (user?.rol === 'admin' || user?.rol === 'super_admin') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-400 transition-all duration-300 shadow-md hover:shadow-lg px-4 py-2 h-12"
                  >
                    <FaBuilding className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="truncate max-w-32 font-semibold text-blue-900">
                      {currentBranch ? getBranchName(currentBranch) : 'Sucursal'}
                    </span>
                    <FaMapMarkerAlt className="h-3 w-3 ml-2 text-blue-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl rounded-xl">
                  {/* Header del selector */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200/50 rounded-t-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                        <FaBuilding className="text-white text-lg" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">Seleccionar Sucursal</h3>
                        <p className="text-sm text-gray-600">
                          {branches.length} sucursal{branches.length !== 1 ? 'es' : ''} disponible{branches.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Lista de sucursales */}
                  <div className="p-2 max-h-64 overflow-y-auto scrollbar-hide">
                    {branches.map((branch) => {
                      const branchId = getBranchId(branch);
                      const isSelected = isBranchSelected(branch);
                      
                      return (
                        <DropdownMenuItem
                          key={branchId}
                          onClick={() => handleBranchChange(branchId)}
                          className={`p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer rounded-lg m-1 ${
                            isSelected 
                              ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-l-4 border-blue-500 shadow-md' 
                              : 'hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
                                  : 'bg-gray-100'
                              }`}>
                                {isSelected ? (
                                  <FaCheckCircle className="text-white text-lg" />
                                ) : (
                                  <FaBuilding className="text-gray-600 text-lg" />
                                )}
                              </div>
                              <div>
                                <span className={`font-semibold text-lg ${
                                  isSelected ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                  {getBranchName(branch)}
                                </span>
                                <div className="flex items-center space-x-1 mt-1">
                                  <FaMapMarkerAlt className="h-3 w-3 text-gray-500" />
                                  <span className="text-sm text-gray-600">{getBranchLocation(branch)}</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  ID: {branchId}
                                </div>
                              </div>
                            </div>
                            
                            {isSelected && (
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-blue-600 font-bold uppercase tracking-wide">
                                  Activa
                                </span>
                              </div>
                            )}
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                  
                  {/* Footer informativo */}
                  <div className="p-3 bg-gray-50 border-t border-gray-200/50 rounded-b-xl">
                    <p className="text-xs text-gray-500 text-center">
                      💡 Solo administradores pueden cambiar de sucursal
                    </p>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Indicador de sucursal para usuarios no-admin (solo lectura) */}
            {branches && branches.length > 0 && !(user?.rol === 'admin' || user?.rol === 'super_admin') && (
              <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 h-12">
                <FaBuilding className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {currentBranch ? getBranchName(currentBranch) : 'Sucursal'}
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            )}

            {/* Usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white hover:border-blue-400 transition-all duration-200 p-2 h-12">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <RoleIcon className="text-white text-lg" />
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-gray-900">{user?.nombre || 'Usuario'}</p>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getRoleColor(user?.rol)}`}></div>
                      <p className="text-xs text-gray-600 font-medium capitalize">{user?.rol || 'Rol'}</p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl">
                {/* Header del usuario */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <RoleIcon className="text-white text-xl" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{user?.nombre || 'Usuario'}</p>
                      <p className="text-sm text-gray-600 font-medium capitalize">{user?.rol || 'Rol'}</p>
                      <p className="text-xs text-gray-500">{user?.username || 'username'}</p>
                    </div>
                  </div>
                </div>
                
                <DropdownMenuSeparator />
                
                {/* Configuración */}
                {onOpenConfig && (
                  <DropdownMenuItem 
                    onClick={onOpenConfig}
                    className="p-3 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <FaCog className="text-white text-sm" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Configuración</span>
                        <p className="text-xs text-gray-500">Ajustes del sistema</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                {/* Cerrar Sesión */}
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="p-3 hover:bg-red-50 transition-all duration-200 cursor-pointer border-l-4 border-transparent hover:border-red-500"
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <FaSignOutAlt className="text-white text-sm" />
                    </div>
                    <div>
                      <span className="font-medium text-red-700">Cerrar Sesión</span>
                      <p className="text-xs text-red-500">Salir del sistema</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </div>
  );
}

