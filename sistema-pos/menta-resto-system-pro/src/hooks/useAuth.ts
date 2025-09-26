import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface AuthState {
  isInitialized: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
}

export function useAuthState() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [authState, setAuthState] = useState<AuthState>({
    isInitialized: false,
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    setAuthState({
      isInitialized: true,
      isAuthenticated,
      isLoading,
      user,
    });
  }, [isAuthenticated, isLoading, user]);

  return authState;
}

// Hook para verificar si el usuario tiene permisos específicos
export function usePermissions() {
  const { user } = useAuth();

  const hasRole = (role: string | string[]) => {
    if (!user) return false;
    const allowedRoles = Array.isArray(role) ? role : [role];
    return allowedRoles.includes(user.rol);
  };

  const hasAnyRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.rol);
  };

  const isAdmin = () => {
    return hasRole(['admin', 'super_admin']);
  };

  const isCashier = () => {
    return hasRole(['cajero', 'admin', 'super_admin']);
  };

  const isManager = () => {
    return hasRole(['gerente', 'admin', 'super_admin']);
  };

  const isKitchen = () => {
    return hasRole(['cocinero', 'admin', 'super_admin']);
  };

  const isWaiter = () => {
    return hasRole(['mesero', 'admin', 'super_admin']);
  };

  return {
    user,
    hasRole,
    hasAnyRole,
    isAdmin,
    isCashier,
    isManager,
    isKitchen,
    isWaiter,
  };
}

// Hook para manejar la navegación basada en roles
export function useRoleNavigation() {
  const { user } = useAuth();
  const permissions = usePermissions();

  const getDefaultRoute = () => {
    if (!user) return '/';
    
    switch (user.rol) {
      case 'admin':
      case 'super_admin':
        return '/';
      case 'cajero':
        return '/';
      case 'mesero':
        return '/';
      case 'cocinero':
        return '/cocina';
      default:
        return '/';
    }
  };

  const canAccessRoute = (route: string) => {
    if (!user) return false;

    const routePermissions: Record<string, string[]> = {
      '/': ['admin', 'super_admin', 'cajero', 'mesero', 'cocinero'],
      '/arqueo': ['admin', 'super_admin', 'cajero'],
      '/egresos': ['admin', 'super_admin', 'cajero'],
      '/egresos-caja': ['admin', 'super_admin', 'cajero'],
      '/inventario': ['admin', 'super_admin'],
      '/usuarios': ['admin', 'super_admin'],
      '/sucursales': ['admin', 'super_admin'],
      '/categorias': ['admin', 'super_admin'],
      '/productos': ['admin', 'super_admin'],
      '/cocina': ['admin', 'super_admin', 'cocinero'],
      '/pedidos': ['admin', 'super_admin', 'mesero', 'cajero'],
      '/historial-ventas': ['admin', 'super_admin', 'cajero'],
      '/info-caja': ['admin', 'super_admin', 'cajero'],
      '/soporte': ['admin', 'super_admin', 'cajero', 'mesero', 'cocinero'],
    };

    const allowedRoles = routePermissions[route] || [];
    return allowedRoles.includes(user.rol);
  };

  return {
    getDefaultRoute,
    canAccessRoute,
    permissions,
  };
}
