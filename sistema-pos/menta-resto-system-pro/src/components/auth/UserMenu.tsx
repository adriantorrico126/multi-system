import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  User, 
  LogOut, 
  Settings, 
  Shield,
  Building,
  MapPin,
  Crown,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserMenuProps {
  onOpenConfig?: () => void;
  className?: string;
}

export function UserMenu({ onOpenConfig, className = '' }: UserMenuProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    logout();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
    setShowLogoutDialog(false);
  };

  const handleOpenConfig = () => {
    if (onOpenConfig) {
      onOpenConfig();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'cajero':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'mesero':
        return <User className="w-4 h-4 text-green-600" />;
      case 'cocinero':
        return <User className="w-4 h-4 text-orange-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'super_admin':
        return 'Super Administrador';
      case 'cajero':
        return 'Cajero';
      case 'mesero':
        return 'Mesero';
      case 'cocinero':
        return 'Cocinero';
      default:
        return role;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className={`flex items-center space-x-2 hover:bg-gray-100 ${className}`}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
              <p className="text-xs text-gray-500">{getRoleLabel(user.rol)}</p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                {getRoleIcon(user.rol)}
                <span className="font-medium">{user.nombre}</span>
              </div>
              <p className="text-sm text-gray-500">{getRoleLabel(user.rol)}</p>
              {user.sucursal && (
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <Building className="w-3 h-3" />
                  <span>{user.sucursal.nombre}</span>
                </div>
              )}
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleOpenConfig}>
            <Settings className="w-4 h-4 mr-2" />
            Configuración
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setShowLogoutDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de confirmación de logout */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>Confirmar cierre de sesión</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cerrar sesión? 
              <br />
              <span className="text-sm text-gray-500">
                Tendrás que volver a iniciar sesión para acceder al sistema.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
