import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, User, Clock, Download, LogOut, Bell, DollarSign, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { refreshInventory } from '@/services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AuthUser {
  username: string;
  role: 'cajero' | 'admin' | 'gerente' | 'cocinero';
  branch: string;
}

interface Branch {
  id: number;
  name: string;
  location: string;
}

interface HeaderProps {
  currentUser: AuthUser;
  currentBranch: Branch | undefined;
  salesCount: number;
  onExportSales: () => void;
  onLogout: () => void;
  branches?: Branch[];
  selectedBranchId?: number;
  onSucursalChange?: (id: number) => void;
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
  onExportSales, 
  onLogout,
  branches,
  selectedBranchId,
  onSucursalChange
}: HeaderProps) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;
  const [popoverOpen, setPopoverOpen] = React.useState(false);

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
    if (!userRole || (userRole.toLowerCase() !== 'admin' && userRole.toLowerCase() !== 'gerente')) return;

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
    navigate('/arqueo');
  }, [navigate]);

  const handleInventoryClick = React.useCallback(() => {
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
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo y Título */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 menta-gradient rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Menta Restobar</h1>
                <p className="text-sm text-gray-500">Sistema POS Profesional</p>
              </div>
            </div>
            
            {/* Información de Sucursal y Selector */}
            {currentBranch && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <Store className="h-4 w-4 text-gray-600" />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{currentBranch.name}</div>
                  <div className="text-gray-500">{currentBranch.location}</div>
                </div>
                {/* Selector de sucursal solo para admin/gerente */}
                {branches && branches.length > 1 && (currentUser.role === 'admin' || currentUser.role === 'gerente') && onSucursalChange && (
                  <Select value={selectedBranchId?.toString()} onValueChange={v => onSucursalChange(Number(v))}>
                    <SelectTrigger className="ml-2 w-40">
                      <SelectValue placeholder="Seleccionar sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>{branch.name}</SelectItem>
                      ))}
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
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-0">
                <div className="p-3 border-b font-semibold text-gray-700">Notificaciones</div>
                <ul className="max-h-60 overflow-y-auto divide-y">
                  {notifications.length === 0 ? (
                    <li className="p-4 text-center text-gray-400">Sin notificaciones</li>
                  ) : notifications.map(n => (
                    <li key={n.id} className={`p-3 text-sm ${n.read ? 'text-gray-500' : 'font-bold text-gray-900'}`}>
                      {n.text}
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>

            {/* Información del Usuario */}
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
              <User className="h-4 w-4 text-gray-600" />
              <div className="text-sm">
                <div className="font-medium text-gray-900">{currentUser.username}</div>
                <Badge 
                  variant={currentUser.role === 'admin' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {currentUser.role === 'admin' ? 'Administrador' : 
                   currentUser.role === 'gerente' ? 'Gerente' :
                   currentUser.role === 'cocinero' ? 'Cocinero' : 'Cajero'}
                </Badge>
              </div>
            </div>
            
            {/* Hora Actual */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <Clock className="h-4 w-4 text-gray-600" />
              <div className="text-sm font-medium text-gray-900">
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
                  className="flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Arqueo
                </Button>
              )}
              {(currentUser.role === 'admin' || currentUser.role === 'gerente') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleInventoryClick}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Inventario
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onExportSales}
                disabled={salesCount === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Header.displayName = 'Header';

