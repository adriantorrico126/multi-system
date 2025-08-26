import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, User, Clock, LogOut, Bell, DollarSign, Package, Settings, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { refreshInventory } from '@/services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';

interface AuthUser {
  username: string;
  role: 'cajero' | 'admin' | 'cocinero' | 'mesero';
  branch: string;
}

interface Branch {
  id?: number;
  id_sucursal?: number;
  nombre?: string;
  name?: string;
  ciudad?: string;
  location?: string;
  direccion?: string;
}

interface HeaderProps {
  currentUser: AuthUser;
  currentBranch: Branch | undefined;
  salesCount: number;
  onLogout: () => void;
  branches?: Branch[];
  selectedBranchId?: number;
  onSucursalChange?: (id: number) => void;
  onOpenConfig?: () => void;
}

interface Notification {
  id: string;
  text: string;
  read: boolean;
}

export const Header = React.memo(({ 
  currentUser, 
  currentBranch, 
  salesCount, 
  onLogout,
  branches,
  selectedBranchId,
  onSucursalChange,
  onOpenConfig
}: HeaderProps) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  // Debug logs para verificar la información de sucursales
  React.useEffect(() => {
    console.log('🔍 Header Debug - currentUser:', currentUser);
    console.log('🔍 Header Debug - currentBranch:', currentBranch);
    console.log('🔍 Header Debug - branches:', branches);
    console.log('🔍 Header Debug - selectedBranchId:', selectedBranchId);
    console.log('🔍 Header Debug - onSucursalChange:', !!onSucursalChange);
  }, [currentUser, currentBranch, branches, selectedBranchId, onSucursalChange]);

  // Ref para controlar si el componente está montado
  const isMountedRef = React.useRef(true);
  
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Ref para acceder al valor actual de notifications sin causar ciclos
  const notificationsRef = React.useRef<Notification[]>([]);
  React.useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Notificaciones de stock bajo en tiempo real
  const userRole = currentUser.role;
  React.useEffect(() => {
    console.log('Efecto notificaciones, userRole:', userRole);
    if (!userRole || (userRole.toLowerCase() !== 'admin' && userRole.toLowerCase() !== 'cocinero')) return;

    async function checkLowStock() {
      if (!isMountedRef.current) return;
      try {
        const inventory = await refreshInventory();
        const lowStockProducts = (inventory || []).filter((p: any) => p.stock_actual !== undefined && p.stock_actual <= 5);
        setNotifications(prev => {
          let next = [...prev];
          lowStockProducts.forEach((p: any) => {
            const stableProductId = p.id ? String(p.id) : p.nombre;
            const notifId = `stock-bajo-${stableProductId}`;
            if (!next.some(n => n.id === notifId)) {
              next = [
                {
                  id: notifId,
                  text: `Stock bajo en producto: ${p.nombre} (${p.stock_actual})`,
                  read: false
                },
                ...next
              ];
            }
          });
          // Solo actualiza si el contenido realmente cambió
          if (next.length !== prev.length || next.some((n, i) => n.id !== prev[i]?.id)) {
          return next;
          }
          return prev;
        });
      } catch (err) {
        // Silenciar errores de red
      }
    }

    checkLowStock();
    const interval = setInterval(checkLowStock, 10000);
    return () => clearInterval(interval);
  }, [userRole]);

  React.useEffect(() => {
    function updateTime() {
      if (isMountedRef.current) {
      setCurrentTime(new Date());
      }
    }
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleArqueoClick = React.useCallback(() => {
    try { sessionStorage.setItem('skipCajaModalOnce', '1'); sessionStorage.setItem('cajaAutoPromptDone', '1'); } catch {}
    navigate('/arqueo');
  }, [navigate]);

  const handleInventoryClick = React.useCallback(() => {
    try { sessionStorage.setItem('skipCajaModalOnce', '1'); sessionStorage.setItem('cajaAutoPromptDone', '1'); } catch {}
    navigate('/inventario');
  }, [navigate]);

  // Al abrir el popover, marcar todas como leídas
  const handlePopoverOpenChange = React.useCallback((open: boolean) => {
    setPopoverOpen(open);
    if (open) {
      setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
    }
  }, []);

  return (
    <div className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/30 border-b border-gray-200/50 shadow-lg backdrop-blur-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo y Título */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl shadow-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">DATY</h1>
                <p className="text-sm text-gray-600 font-medium">Sistema POS Profesional</p>
              </div>
            </div>
            
            {/* Información de Sucursal y Selector */}
            {currentBranch && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Store className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">{currentBranch.name}</div>
                  <div className="text-gray-600">{currentBranch.location}</div>
                </div>
                {/* Selector de sucursal solo para admin/cocinero */}
                {branches && branches.length > 1 && (currentUser.role === 'admin' || currentUser.role === 'cocinero') && onSucursalChange && (
                  <Select 
                    value={selectedBranchId?.toString()} 
                    onValueChange={v => {
                      console.log('🔄 Selector de sucursal cambiado a:', v);
                      onSucursalChange(Number(v));
                    }}
                  >
                    <SelectTrigger className="ml-2 w-40 bg-white/80 backdrop-blur-sm border-gray-200/50">
                      <SelectValue placeholder="Cambiar sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.filter(branch => {
                        const branchId = branch.id_sucursal || branch.id;
                        return branchId !== undefined && branchId !== null;
                      }).map(branch => {
                        const branchId = branch.id_sucursal || branch.id;
                        const branchName = branch.nombre || branch.name;
                        console.log('🔍 Renderizando opción de sucursal:', { branchId, branchName, branch });
                        return (
                          <SelectItem key={branchId} value={branchId.toString()}>
                            {branchName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Notificaciones */}
            <Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative p-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200">
                  <Bell className="h-4 w-4 text-gray-700" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-2xl rounded-2xl">
                <div className="p-4 border-b border-gray-200/50 font-semibold text-gray-700 bg-gradient-to-r from-gray-50/50 to-white/50">
                  Notificaciones del Sistema
                </div>
                <ul className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <li className="p-6 text-center text-gray-400">
                      <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      Sin notificaciones
                    </li>
                  ) : notifications.map(n => (
                    <li key={n.id} className={`p-4 text-sm ${n.read ? 'text-gray-500' : 'font-semibold text-gray-900 bg-blue-50/50'}`}>
                      {n.text}
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>

            {/* Información del Usuario */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="text-sm">
                <div className="font-semibold text-gray-900">{currentUser.username}</div>
                <Badge 
                  variant={currentUser.role === 'admin' ? 'default' : 'secondary'}
                  className={`text-xs font-semibold ${
                    currentUser.role === 'admin' 
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' 
                      : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                  }`}
                >
                  {currentUser.role === 'admin' ? 'Administrador' : 
                   currentUser.role === 'cocinero' ? 'Cocinero' : 
                   currentUser.role === 'mesero' ? 'Mesero' : 'Cajero'}
                </Badge>
              </div>
            </div>
            
            {/* Hora Actual */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {currentTime.toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center gap-2">
              {currentUser.role === 'admin' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleArqueoClick}
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <DollarSign className="h-4 w-4" />
                  Arqueo
                </Button>
              )}
              {(currentUser.role === 'admin' || currentUser.role === 'cocinero') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleInventoryClick}
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Package className="h-4 w-4" />
                  Inventario
                </Button>
              )}
              {(currentUser.role === 'admin' || currentUser.role === 'gerente') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/egresos')}
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <CreditCard className="h-4 w-4" />
                  Egresos
                </Button>
              )}
              {currentUser.role === 'admin' && onOpenConfig && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenConfig}
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Settings className="h-4 w-4" />
                  Configuración
                </Button>
              )}
              {/* Exportación movida a Historial/Configuraciones avanzadas */}

              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout}
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-200 text-red-600 hover:text-red-700 hover:border-red-300"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
              {currentUser.role === 'admin' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/soporte')}
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Package className="h-4 w-4" />
                  Soporte
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Header.displayName = 'Header';

