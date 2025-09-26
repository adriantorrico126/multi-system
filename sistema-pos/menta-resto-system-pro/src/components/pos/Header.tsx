import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlan } from '@/context/PlanContext';
import { PlanInfo } from '@/components/plans/PlanInfo';
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
  SheetTrigger,
} from '@/components/ui/sheet';
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
  FaInfoCircle,
  FaBars,
  FaTimes,
  FaHome
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  currentBranch?: any;
  branches?: any[];
  onSucursalChange?: (branchId: string) => void;
  selectedBranchId?: string;
  currentUser?: any;
  salesCount?: number;
  onLogout?: () => void;
  onOpenConfig?: () => void;
  isHeaderCollapsed?: boolean;
  onToggleHeader?: () => void;
}

export function Header({ 
  currentBranch, 
  branches, 
  onSucursalChange, 
  selectedBranchId,
  currentUser,
  salesCount = 0,
  onLogout,
  onOpenConfig,
  isHeaderCollapsed = false,
  onToggleHeader
}: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileInfo = useMobile();
  
  // TEMPORAL: Usar valores por defecto en lugar de usePlan para evitar problemas
  let planInfo = null;
  let planLoading = false;
  try {
    const planContext = usePlan();
    planInfo = planContext.planInfo;
    planLoading = planContext.isLoading;
    console.log('🔍 [HEADER] Plan context cargado correctamente');
  } catch (error) {
    console.log('🔍 [HEADER] Usando modo temporal sin plan context');
    // Usar valores por defecto
  }

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleBranchChange = (branchId: string) => {
    if (onSucursalChange) {
      onSucursalChange(branchId);
    }
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    console.log('🔍 [HEADER] handleNavigation navegando a:', path);
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  // DEBUG: Log user info
  console.log('🔍 [HEADER] Usuario actual:', user);
  console.log('🔍 [HEADER] Rol del usuario:', user?.rol);

  // Navegación principal optimizada
  const navigationItems = [
    { 
      icon: FaHome, 
      label: 'Inicio', 
      path: '/', 
      show: true,
      color: 'from-blue-500 to-indigo-600',
      description: 'Página principal'
    },
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
      show: (() => {
        const hasAccess = ['cajero', 'admin', 'super_admin'].includes(user?.rol);
        console.log('🔍 [HEADER] Verificando acceso a Egresos:', {
          userRole: user?.rol,
          allowedRoles: ['cajero', 'admin', 'super_admin'],
          hasAccess: hasAccess
        });
        return hasAccess;
      })(),
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

  // Filtrar elementos de navegación visibles
  const visibleNavigationItems = navigationItems.filter(item => {
    const isVisible = item.show === true || (Array.isArray(item.show) && item.show.includes(user?.rol));
    console.log(`🔍 [HEADER] Item "${item.label}":`, {
      show: item.show,
      userRole: user?.rol,
      isVisible: isVisible
    });
    return isVisible;
  });

  console.log('🔍 [HEADER] Total items visibles:', visibleNavigationItems.length);
  console.log('🔍 [HEADER] Items visibles:', visibleNavigationItems.map(item => item.label));

  // Componente de navegación móvil
  const MobileNavigation = () => (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-gray-50"
        >
          <FaBars className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-white/95 backdrop-blur-sm flex flex-col">
        <SheetHeader className="border-b border-gray-200 pb-4 flex-shrink-0">
          <SheetTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <FaUtensils className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Sistema POS</h2>
              <p className="text-sm text-gray-600">Menú de navegación</p>
            </div>
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide py-4 space-y-2 mobile-menu-scroll mobile-menu-content">
          {/* Información del usuario */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-gradient-to-r ${getRoleColor(user?.rol)} rounded-xl flex items-center justify-center`}>
                <RoleIcon className="text-white text-lg" />
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

          {/* Selector de sucursal para administradores */}
          {branches && branches.length > 0 && (user?.rol === 'admin' || user?.rol === 'super_admin') && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 px-4">Sucursal Actual</h3>
              <div className="space-y-2">
                {branches.map((branch) => {
                  const branchId = getBranchId(branch);
                  const isSelected = isBranchSelected(branch);
                  
                  return (
                    <Button
                      key={branchId}
                      variant={isSelected ? "default" : "outline"}
                      className={`w-full justify-start h-12 px-4 rounded-lg transition-all duration-200 ${
                        isSelected 
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleBranchChange(branchId)}
                    >
                      <FaBuilding className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <span className="font-semibold">{getBranchName(branch)}</span>
                        <p className="text-xs opacity-80">{getBranchLocation(branch)}</p>
                      </div>
                      {isSelected && <FaCheckCircle className="h-4 w-4 ml-auto" />}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="pt-4 border-t border-gray-200 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => {
                if (onOpenConfig) onOpenConfig();
                setIsMobileMenuOpen(false);
              }}
            >
              <FaCog className="h-4 w-4 mr-3" />
              Configuración
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start h-12"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="h-4 w-4 mr-3" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

    return (
    <div className={`bg-gradient-to-r from-white via-gray-50/50 to-white border-b border-gray-200/50 shadow-lg backdrop-blur-sm transition-all duration-300 header-collapsible ${
      mobileInfo.isMobile && isHeaderCollapsed ? 'collapsed' : ''
    }`}>
      <header className={`transition-all duration-300 header-content ${
        mobileInfo.isMobile && isHeaderCollapsed ? 'px-2 py-1' : 'px-6 sm:px-8 py-4 sm:py-6'
      }`}>
        <div className="flex items-center justify-between">
          {/* Logo y título */}
          <div className={`flex items-center transition-all duration-300 ${
            mobileInfo.isMobile && isHeaderCollapsed ? 'space-x-2' : 'space-x-4 sm:space-x-6'
          }`}>
            <div className={`bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl transition-all duration-300 ${
              mobileInfo.isMobile && isHeaderCollapsed ? 'w-6 h-6' : 'w-12 h-12 sm:w-14 sm:h-14'
            }`}>
              <FaUtensils className={`text-white transition-all duration-300 ${
                mobileInfo.isMobile && isHeaderCollapsed ? 'text-xs' : 'text-xl sm:text-2xl'
              }`} />
            </div>
            <div className={`min-w-0 transition-all duration-300 ${
              mobileInfo.isMobile && isHeaderCollapsed ? 'hidden' : ''
            }`}>
              <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent truncate">
                Sistema POS
              </h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm sm:text-base text-gray-600 font-medium truncate">
                  {currentBranch ? getBranchName(currentBranch) : 'Selecciona una sucursal'}
                </p>
              </div>
            </div>
          </div>

                               {/* Navegación - Desktop */}
          <div className={`hidden lg:flex items-center space-x-3 transition-all duration-300 ${
            mobileInfo.isMobile && isHeaderCollapsed ? 'hidden' : ''
          }`}>
            {visibleNavigationItems.slice(0, 4).map((item) => (
              <Button
                key={item.label}
                variant="outline"
                size="sm"
                className={`flex items-center space-x-2 whitespace-nowrap rounded-lg transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg border-2 bg-white/90 backdrop-blur-sm px-4 py-3 min-w-[140px] h-12 ${
                  item.color ? `hover:bg-gradient-to-r ${item.color} hover:text-white hover:border-transparent` : 'hover:bg-blue-50 hover:border-blue-300'
                }`}
                onClick={() => {
                  console.log('🔍 [HEADER] Desktop button clicked, navegando a:', item.path);
                  navigate(item.path);
                }}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  item.color ? `bg-gradient-to-r ${item.color} text-white` : 'bg-gray-100 text-gray-600'
                }`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">{item.label}</span>
              </Button>
            ))}
          </div>

          {/* Botón para alternar header en móvil */}
          {mobileInfo.isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleHeader}
              className={`lg:hidden rounded-lg hover:bg-gray-100 transition-all duration-200 header-toggle-btn ${
                isHeaderCollapsed ? 'p-1' : 'p-2'
              }`}
            >
              {isHeaderCollapsed ? (
                <FaBars className="h-4 w-4 text-gray-600" />
              ) : (
                <FaTimes className="h-5 w-5 text-gray-600" />
              )}
            </Button>
          )}

                               {/* Información del usuario y controles */}
          <div className={`flex items-center space-x-3 sm:space-x-6 transition-all duration-300 ${
            mobileInfo.isMobile && isHeaderCollapsed ? 'hidden' : ''
          }`}>
             {/* Selector de sucursal SOLO PARA ADMINISTRADORES - Desktop */}
             {branches && branches.length > 0 && (user?.rol === 'admin' || user?.rol === 'super_admin') && (
               <div className="hidden md:block">
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button 
                       variant="outline" 
                       size="sm" 
                       className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-400 transition-all duration-300 shadow-md hover:shadow-lg px-4 py-3 h-12"
                     >
                       <FaBuilding className="h-4 w-4 mr-2 text-blue-600" />
                       <span className="truncate max-w-28 sm:max-w-36 font-semibold text-blue-900 text-sm">
                         {currentBranch ? getBranchName(currentBranch) : 'Sucursal'}
                       </span>
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
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <FaCheckCircle className="h-3 w-3 mr-1" />
                                    Activa
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

                         {/* Información del usuario - Desktop */}
             <div className="hidden md:flex items-center space-x-4">
               <div className="flex items-center space-x-3">
                 <div className={`w-10 h-10 bg-gradient-to-r ${getRoleColor(user?.rol)} rounded-lg flex items-center justify-center`}>
                   <RoleIcon className="text-white text-base" />
                 </div>
                 <div className="text-right">
                   <p className="text-base font-semibold text-gray-900 truncate max-w-28">
                     {user?.nombre || user?.username}
                   </p>
                   <p className="text-sm text-gray-600 capitalize">{user?.rol}</p>
                 </div>
               </div>
               
               {/* Información del plan */}
               {planInfo && !planLoading && (
                 <div className="hidden xl:block">
                   <PlanInfo compact={true} className="max-w-xs" />
                 </div>
               )}
             </div>

                         {/* Menú móvil */}
             <MobileNavigation />
 
             {/* Controles de usuario - Desktop */}
             <div className="hidden md:flex items-center space-x-3">
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button 
                     variant="outline" 
                     size="sm" 
                     className="bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-gray-50 px-4 py-3 h-12"
                   >
                     <FaUser className="h-4 w-4" />
                   </Button>
                 </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl rounded-xl">
                  <div className="p-4 border-b border-gray-200/50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${getRoleColor(user?.rol)} rounded-xl flex items-center justify-center`}>
                        <RoleIcon className="text-white text-lg" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user?.nombre || user?.username}</p>
                        <p className="text-sm text-gray-600 capitalize">{user?.rol}</p>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={() => {
                      if (onOpenConfig) onOpenConfig();
                      setIsMenuOpen(false);
                    }}
                    className="p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <FaCog className="h-4 w-4 mr-3 text-gray-600" />
                    Configuración
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="p-3 hover:bg-red-50 cursor-pointer text-red-600"
                  >
                    <FaSignOutAlt className="h-4 w-4 mr-3" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

