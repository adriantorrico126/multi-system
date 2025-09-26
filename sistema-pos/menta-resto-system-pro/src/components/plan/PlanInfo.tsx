import React from 'react';
import { usePlan } from '@/context/PlanContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  Users, 
  Building, 
  Package, 
  TrendingUp, 
  HardDrive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Star
} from 'lucide-react';

interface PlanInfoProps {
  showUpgrade?: boolean;
  onUpgrade?: () => void;
}

export const PlanInfo: React.FC<PlanInfoProps> = ({ 
  showUpgrade = true, 
  onUpgrade 
}) => {
  const { 
    currentPlan, 
    planUsage, 
    isLoading, 
    error,
    getRemainingLimit,
    isLimitExceeded 
  } = usePlan();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando información del plan...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center text-red-600">
            <XCircle className="h-5 w-5 mr-2" />
            <span>Error al cargar información del plan: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentPlan) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-gray-600">
            No se pudo cargar la información del plan
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'basico':
        return <Star className="h-5 w-5 text-green-600" />;
      case 'profesional':
        return <Zap className="h-5 w-5 text-blue-600" />;
      case 'avanzado':
        return <Crown className="h-5 w-5 text-purple-600" />;
      case 'enterprise':
        return <Crown className="h-5 w-5 text-yellow-600" />;
      default:
        return <Star className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'basico':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'profesional':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'avanzado':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'enterprise':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPlanName = (planName: string) => {
    return planName.charAt(0).toUpperCase() + planName.slice(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getUsagePercentage = (limit: keyof typeof currentPlan.limites) => {
    if (!planUsage) return 0;
    
    const maxLimit = currentPlan.limites[limit];
    const currentUsage = planUsage[limit] || 0;
    
    if (maxLimit === 0) return 0; // Ilimitado
    if (maxLimit === currentUsage) return 100;
    
    return Math.round((currentUsage / maxLimit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getPlanIcon(currentPlan.nombre)}
            <div>
              <CardTitle className="text-lg">
                Plan {formatPlanName(currentPlan.nombre)}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {formatCurrency(currentPlan.precio_mensual)}/mes
              </p>
            </div>
          </div>
          <Badge className={getPlanColor(currentPlan.nombre)}>
            {formatPlanName(currentPlan.nombre)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Descripción del plan */}
        <div>
          <p className="text-sm text-gray-700">
            {currentPlan.descripcion}
          </p>
        </div>

        {/* Límites de uso */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Límites de Uso
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sucursales */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Sucursales</span>
                </div>
                <div className="flex items-center space-x-2">
                  {isLimitExceeded('max_sucursales') ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-sm text-gray-600">
                    {planUsage?.sucursales || 0} / {currentPlan.limites.max_sucursales === 0 ? '∞' : currentPlan.limites.max_sucursales}
                  </span>
                </div>
              </div>
              {currentPlan.limites.max_sucursales > 0 && (
                <Progress 
                  value={getUsagePercentage('max_sucursales')} 
                  className="h-2"
                />
              )}
            </div>

            {/* Usuarios */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Usuarios</span>
                </div>
                <div className="flex items-center space-x-2">
                  {isLimitExceeded('max_usuarios') ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-sm text-gray-600">
                    {planUsage?.usuarios || 0} / {currentPlan.limites.max_usuarios === 0 ? '∞' : currentPlan.limites.max_usuarios}
                  </span>
                </div>
              </div>
              {currentPlan.limites.max_usuarios > 0 && (
                <Progress 
                  value={getUsagePercentage('max_usuarios')} 
                  className="h-2"
                />
              )}
            </div>

            {/* Productos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Productos</span>
                </div>
                <div className="flex items-center space-x-2">
                  {isLimitExceeded('max_productos') ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-sm text-gray-600">
                    {planUsage?.productos || 0} / {currentPlan.limites.max_productos === 0 ? '∞' : currentPlan.limites.max_productos}
                  </span>
                </div>
              </div>
              {currentPlan.limites.max_productos > 0 && (
                <Progress 
                  value={getUsagePercentage('max_productos')} 
                  className="h-2"
                />
              )}
            </div>

            {/* Almacenamiento */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Almacenamiento</span>
                </div>
                <span className="text-sm text-gray-600">
                  {currentPlan.limites.almacenamiento_gb === 0 ? '∞' : `${currentPlan.limites.almacenamiento_gb}GB`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de upgrade */}
        {showUpgrade && currentPlan.nombre !== 'enterprise' && onUpgrade && (
          <div className="pt-4 border-t">
            <Button 
              onClick={onUpgrade}
              className="w-full"
              variant="outline"
            >
              <Crown className="h-4 w-4 mr-2" />
              Actualizar Plan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
