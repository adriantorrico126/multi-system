import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LogOut, 
  User, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Loader2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { toast } = useToast();

  // Mostrar loader mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Acceso Restringido
            </CardTitle>
            <CardDescription className="text-gray-600">
              Necesitas iniciar sesión para acceder a esta página
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Tu sesión ha expirado o no tienes permisos para acceder a esta página.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <User className="w-4 h-4 mr-2" />
              Ir al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar roles si se especifican
  if (requiredRole) {
    const userRole = user.rol;
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
          <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Permisos Insuficientes
              </CardTitle>
              <CardDescription className="text-gray-600">
                No tienes los permisos necesarios para acceder a esta página
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Tu rol actual ({userRole}) no tiene acceso a esta funcionalidad.
                  <br />
                  Roles permitidos: {allowedRoles.join(', ')}
                </AlertDescription>
              </Alert>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <User className="w-4 h-4 mr-2" />
                  Volver al Inicio
                </Button>
                <Button 
                  onClick={logout}
                  variant="outline"
                  className="flex-1"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Si todo está bien, mostrar el contenido protegido
  return <>{children}</>;
}

// Hook para verificar permisos en componentes
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

  return {
    user,
    hasRole,
    hasAnyRole,
    isAdmin,
    isCashier,
    isManager,
  };
}
