import React, { useState, useEffect, forwardRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePlanSystem } from '@/context/PlanSystemContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
  FaHome,
  FaBell,
  FaSearch,
  FaUserCircle,
  FaChevronRight,
  FaChevronDown,
  FaShoppingCart,
  FaClipboardList,
  FaUsers,
  FaDatabase,
  FaStore,
  FaWallet,
  FaReceipt,
  FaChartBar,
  FaGift,
  FaStar,
  FaHeart,
  FaLightbulb,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// --- Tipos ---
interface Branch {
  id_sucursal?: string;
  id?: string;
  nombre?: string;
  name?: string;
  ciudad?: string;
  location?: string;
  direccion?: string;
  address?: string;
}

interface NavigationItem {
  icon: React.ElementType;
  label: string;
  path: string;
  show: boolean | string[];
  color: string;
  description: string;
  category: string;
}

interface MobileHeaderAdvancedProps {
  currentBranch?: Branch;
  branches?: Branch[];
  onBranchChange?: (branchId: string) => void;
  selectedBranchId?: string;
  salesCount?: number;
  onLogout?: () => void;
  onOpenConfig?: () => void;
  isHeaderCollapsed?: boolean;
  onToggleHeader?: () => void;
  cartItemsCount?: number;
  notificationsCount?: number;
}

// --- Componente Principal ---
export const MobileHeaderAdvanced: React.FC<MobileHeaderAdvancedProps> = ({
  currentBranch,
  branches = [],
  onBranchChange,
  selectedBranchId,
  salesCount = 0,
  onLogout,
  onOpenConfig,
  isHeaderCollapsed = false,
  onToggleHeader,
  cartItemsCount = 0,
  notificationsCount = 0,
}) => {
  // --- Hooks ---
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useMobile();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['main']);

  // --- Datos del Plan ---
  const { planInfo, isLoading: planLoading } = usePlanSystem();

  // --- Efectos ---
  useEffect(() => {
    const handleOrientationChange = () => setIsMenuOpen(false);
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);

  // --- Handlers ---
  const handleLogout = (): void => {
    onLogout?.() ?? logout();
    setIsMenuOpen(false);
  };

  const handleBranchSelect = (branchId: string): void => {
    onBranchChange?.(branchId);
    setIsMenuOpen(false);
  };

  const handleNavigate = (path: string): void => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const toggleSection = (section: string): void => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  // --- Helpers ---
  const getRoleColor = (role?: string): string => {
    const roleColors: Record<string, string> = {
      super_admin: 'from-purple-600 to-pink-600',
      admin: 'from-blue-600 to-indigo-600',
      cajero: 'from-green-600 to-emerald-600',
      cocinero: 'from-orange-600 to-red-600',
      mesero: 'from-teal-600 to-cyan-600',
    };
    return role ? roleColors[role] ?? 'from-gray-600 to-slate-600' : 'from-gray-600 to-slate-600';
  };

  const getRoleIcon = (role?: string): React.ElementType => {
    const roleIcons: Record<string, React.ElementType> = {
      super_admin: FaCrown,
      admin: FaShieldAlt,
      cajero: FaCashRegister,
      cocinero: FaUtensils,
      mesero: FaUser,
    };
    return role ? roleIcons[role] ?? FaUser : FaUser;
  };

  const getBranchId = (branch: Branch): string => branch.id_sucursal ?? branch.id ?? '';
  const getBranchName = (branch: Branch): string => branch.nombre ?? branch.name ?? `Sucursal ${getBranchId(branch)}`;
  const getBranchLocation = (branch: Branch): string => branch.ciudad ?? branch.location ?? branch.direccion ?? branch.address ?? 'Sin ubicación';
  const isBranchSelected = (branch: Branch): boolean => getBranchId(branch) === selectedBranchId;

  // --- Navegación ---
  const navigationItems: NavigationItem[] = [
    {
      icon: FaHome,
      label: 'Inicio',
      path: '/',
      show: true,
      color: 'from-blue-500 to-indigo-600',
      description: 'Página principal',
      category: 'main',
    },
    {
      icon: FaCashRegister,
      label: 'Arqueo',
      path: '/arqueo',
      show: ['admin', 'cajero', 'super_admin'].includes(user?.rol ?? ''),
      color: 'from-emerald-500 to-green-600',
      description: 'Gestión de caja',
      category: 'finance',
    },
    {
      icon: FaMoneyBillWave,
      label: 'Egresos',
      path: '/egresos-caja',
      show: ['admin', 'cajero', 'super_admin'].includes(user?.rol ?? ''),
      color: 'from-red-500 to-pink-600',
      description: 'Registrar gastos',
      category: 'finance',
    },
    {
      icon: FaBoxes,
      label: 'Inventario',
      path: '/inventario',
      show: ['admin', 'super_admin'].includes(user?.rol ?? ''),
      color: 'from-blue-500 to-indigo-600',
      description: 'Control de stock',
      category: 'management',
    },
    {
      icon: FaUtensils,
      label: 'Cocina',
      path: '/cocina',
      show: ['admin', 'cocinero', 'super_admin'].includes(user?.rol ?? ''),
      color: 'from-orange-500 to-red-600',
      description: 'Gestión de pedidos',
      category: 'operations',
    },
    {
      icon: FaInfoCircle,
      label: 'Información',
      path: '/info-caja',
      show: user?.rol === 'cajero',
      color: 'from-cyan-500 to-blue-600',
      description: 'Resumen del día',
      category: 'reports',
    },
    {
      icon: FaQuestionCircle,
      label: 'Soporte',
      path: '/soporte',
      show: true,
      color: 'from-purple-500 to-pink-600',
      description: 'Ayuda y soporte',
      category: 'support',
    },
  ];

  const visibleItems = navigationItems.filter((item) => (typeof item.show === 'boolean' ? item.show : item.show));
  const groupedItems = visibleItems.reduce<Record<string, NavigationItem[]>>((groups, item) => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
    return groups;
  }, {});

  const categoryLabels: Record<string, string> = {
    main: 'Principal',
    finance: 'Finanzas',
    management: 'Gestión',
    operations: 'Operaciones',
    reports: 'Reportes',
    support: 'Soporte',
  };

  // --- Componentes Internos ---
  const AnimatedHamburgerButton = forwardRef<HTMLButtonElement, { isOpen: boolean; onClick?: () => void }>(
    ({ isOpen, onClick }, ref) => (
      <Button
        ref={ref}
        variant="ghost"
        size="sm"
        onClick={onClick}
        className={cn(
          'relative w-9 h-9 rounded-lg bg-gray-50/90 backdrop-blur-sm border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 touch-manipulation',
          isOpen && 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-blue-500 shadow-md',
        )}
        aria-label="Abrir menú de navegación"
      >
        <div className="relative w-5 h-5 flex flex-col justify-center items-center">
          <span
            className={cn(
              'absolute h-0.5 w-4 bg-current transition-all duration-300 ease-in-out',
              isOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5',
            )}
          />
          <span
            className={cn(
              'absolute h-0.5 w-4 bg-current transition-all duration-300 ease-in-out',
              isOpen ? 'opacity-0' : 'opacity-100',
            )}
          />
          <span
            className={cn(
              'absolute h-0.5 w-4 bg-current transition-all duration-300 ease-in-out',
              isOpen ? '-rotate-45 translate-y-0' : 'translate-y-1.5',
            )}
          />
        </div>
      </Button>
    ),
  );
  AnimatedHamburgerButton.displayName = 'AnimatedHamburgerButton';

  // --- Render ---
  if (!isMobile) return null;

  return (
    <div className="lg:hidden flex items-center space-x-2">
      <AnimatedHamburgerButton isOpen={isMenuOpen} onClick={() => setIsMenuOpen(!isMenuOpen)} />
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-[320px] sm:w-[400px] p-0 bg-white border-r border-gray-200 h-full flex flex-col">
          {/* Header */}
          <SheetHeader className="pb-4 pt-4 px-6 border-b border-gray-200">
            <SheetTitle className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaUtensils className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Sistema POS</h2>
                <p className="text-sm text-gray-600">Menú de navegación</p>
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* Contenido */}
          <div 
            className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-2"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
              maxHeight: 'calc(100vh - 120px)'
            }}
          >
            {/* Información del usuario */}
            <div className="px-6 pb-4">
              <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 bg-gradient-to-r ${getRoleColor(user?.rol)} rounded-xl flex items-center justify-center shadow-lg`}>
                    {React.createElement(getRoleIcon(user?.rol), { className: 'text-white text-lg' })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate text-lg">{user?.nombre}</p>
                    <p className="text-sm text-gray-600 capitalize">{user?.rol}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-600 font-medium">En línea</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onOpenConfig?.();
                      setIsMenuOpen(false);
                    }}
                    className="p-2 rounded-lg hover:bg-white/50"
                  >
                    <FaCog className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Navegación */}
            <div className="px-6 space-y-4">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <Button
                    variant="ghost"
                    onClick={() => toggleSection(category)}
                    className="w-full justify-between h-10 px-3 rounded-lg text-left hover:bg-gray-50"
                  >
                    <span className="font-semibold text-gray-700">{categoryLabels[category]}</span>
                    {expandedSections.includes(category) ? (
                      <FaChevronDown className="h-3 w-3 text-gray-500" />
                    ) : (
                      <FaChevronRight className="h-3 w-3 text-gray-500" />
                    )}
                  </Button>
                  {expandedSections.includes(category) && (
                    <div className="space-y-1 ml-4">
                      {items.map((item) => (
                        <Button
                          key={item.label}
                          variant="ghost"
                          className="w-full justify-start h-12 px-3 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50"
                          onClick={() => handleNavigate(item.path)}
                        >
                          <div className={`w-6 h-6 bg-gradient-to-r ${item.color} rounded-md flex items-center justify-center mr-3 shadow-sm`}>
                            {React.createElement(item.icon, { className: 'h-3 w-3 text-white' })}
                          </div>
                          <div className="text-left flex-1">
                            <span className="font-medium text-gray-900 text-sm">{item.label}</span>
                            <p className="text-xs text-gray-500">{item.description}</p>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Selector de sucursal */}
            {branches.length > 0 && ['admin', 'super_admin'].includes(user?.rol ?? '') && (
              <div className="px-6 pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={() => toggleSection('branches')}
                  className="w-full justify-between h-10 px-3 rounded-lg text-left hover:bg-gray-50"
                >
                  <span className="font-semibold text-gray-700">Sucursales</span>
                  {expandedSections.includes('branches') ? (
                    <FaChevronDown className="h-3 w-3 text-gray-500" />
                  ) : (
                    <FaChevronRight className="h-3 w-3 text-gray-500" />
                  )}
                </Button>
                {expandedSections.includes('branches') && (
                  <div className="mt-2 space-y-1 ml-2">
                    {branches.map((branch) => {
                      const id = getBranchId(branch);
                      const isSelected = isBranchSelected(branch);
                      return (
                        <Button
                          key={id}
                          variant="ghost"
                          className={cn(
                            'w-full justify-start h-10 px-3 rounded-lg transition-all duration-200',
                            isSelected && 'bg-blue-50 border border-blue-200',
                          )}
                          onClick={() => handleBranchSelect(id)}
                        >
                          <div className="flex items-center space-x-2">
                            <FaMapMarkerAlt className={cn('h-4 w-4', isSelected ? 'text-blue-600' : 'text-gray-400')} />
                            <span className={cn('text-sm font-medium', isSelected ? 'text-blue-900' : 'text-gray-900')}>
                              {getBranchName(branch)}
                            </span>
                            {isSelected && <FaCheckCircle className="h-3 w-3 text-green-500 ml-2" />}
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Logout */}
            <div className="px-6 pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start h-12 px-4 rounded-lg text-red-600 hover:bg-red-50"
              >
                <FaSignOutAlt className="h-4 w-4 mr-3" />
                <span className="font-semibold">Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
