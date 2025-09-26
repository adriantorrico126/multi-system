import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3,
  UtensilsCrossed,
  Clock,
  TrendingUp
} from 'lucide-react';

interface LoadingStateProps {
  type?: 'dashboard' | 'pos' | 'mesas' | 'productos' | 'ventas' | 'general';
  message?: string;
  showSkeleton?: boolean;
}

export function LoadingState({ 
  type = 'general', 
  message = 'Cargando...', 
  showSkeleton = false 
}: LoadingStateProps) {
  
  const getLoadingConfig = () => {
    switch (type) {
      case 'dashboard':
        return {
          icon: BarChart3,
          color: 'from-blue-500 to-indigo-500',
          bgColor: 'from-blue-50 to-indigo-50',
          title: 'Cargando Dashboard',
          description: 'Preparando estadísticas y métricas...'
        };
      case 'pos':
        return {
          icon: ShoppingCart,
          color: 'from-green-500 to-emerald-500',
          bgColor: 'from-green-50 to-emerald-50',
          title: 'Cargando POS',
          description: 'Preparando punto de venta...'
        };
      case 'mesas':
        return {
          icon: UtensilsCrossed,
          color: 'from-purple-500 to-violet-500',
          bgColor: 'from-purple-50 to-violet-50',
          title: 'Cargando Mesas',
          description: 'Preparando gestión de mesas...'
        };
      case 'productos':
        return {
          icon: Package,
          color: 'from-orange-500 to-amber-500',
          bgColor: 'from-orange-50 to-amber-50',
          title: 'Cargando Productos',
          description: 'Preparando catálogo...'
        };
      case 'ventas':
        return {
          icon: TrendingUp,
          color: 'from-cyan-500 to-blue-500',
          bgColor: 'from-cyan-50 to-blue-50',
          title: 'Cargando Ventas',
          description: 'Preparando historial...'
        };
      default:
        return {
          icon: Clock,
          color: 'from-gray-500 to-slate-500',
          bgColor: 'from-gray-50 to-slate-50',
          title: 'Cargando',
          description: message
        };
    }
  };

  const config = getLoadingConfig();
  const Icon = config.icon;

  if (showSkeleton) {
    return (
      <div className="space-y-4">
        {/* Skeleton Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Skeleton Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[400px] flex items-center justify-center bg-gradient-to-br ${config.bgColor} rounded-lg border border-gray-200`}>
      <div className="text-center space-y-4">
        {/* Icono animado */}
        <div className={`w-16 h-16 bg-gradient-to-r ${config.color} rounded-full flex items-center justify-center mx-auto shadow-lg`}>
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
        
        {/* Contenido */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">{config.title}</h3>
          <p className="text-sm text-gray-600">{config.description}</p>
        </div>

        {/* Badge de estado */}
        <Badge className={`bg-gradient-to-r ${config.color} text-white animate-pulse`}>
          <Icon className="h-3 w-3 mr-1" />
          Procesando...
        </Badge>

        {/* Barra de progreso animada */}
        <div className="w-48 mx-auto">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className={`bg-gradient-to-r ${config.color} h-full rounded-full animate-pulse`} 
                 style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de loading para móviles
export function MobileLoadingState({ type = 'general', message }: LoadingStateProps) {
  const config = getLoadingConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-center min-h-[200px] p-4">
      <div className="text-center space-y-3">
        <div className={`w-12 h-12 bg-gradient-to-r ${config.color} rounded-full flex items-center justify-center mx-auto`}>
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        </div>
        <div>
          <h3 className="text-base font-medium text-gray-800">{config.title}</h3>
          <p className="text-xs text-gray-600">{config.description}</p>
        </div>
      </div>
    </div>
  );
}

// Hook para mostrar loading states
export function useLoadingState() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState('Cargando...');

  const showLoading = (message?: string) => {
    setLoadingMessage(message || 'Cargando...');
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  return {
    isLoading,
    loadingMessage,
    showLoading,
    hideLoading
  };
}
