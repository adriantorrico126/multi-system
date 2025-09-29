import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePlanSystem } from '@/context/PlanSystemContext';
import { 
  Crown, 
  Star, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  ArrowUp,
  RefreshCw,
  Bell
} from 'lucide-react';

interface PlanStatusCardProps {
  showUpgradeButton?: boolean;
  showRefreshButton?: boolean;
  onUpgrade?: () => void;
  onRefresh?: () => void;
  className?: string;
}

export const PlanStatusCard: React.FC<PlanStatusCardProps> = ({
  showUpgradeButton = true,
  showRefreshButton = true,
  onUpgrade,
  onRefresh,
  className = ''
}) => {
  const {
    currentPlan,
    isActive,
    isExpired,
    isSuspended,
    daysUntilExpiration,
    unreadAlertsCount,
    getSucursalesInfo,
    getUsuariosInfo,
    getProductosInfo,
    getTransaccionesInfo,
    getAlmacenamientoInfo,
    refreshData
  } = usePlanSystem();

  // Obtener información de todos los límites
  const sucursalesInfo = getSucursalesInfo();
  const usuariosInfo = getUsuariosInfo();
  const productosInfo = getProductosInfo();
  const transaccionesInfo = getTransaccionesInfo();
  const almacenamientoInfo = getAlmacenamientoInfo();

  // Determinar el icono del plan
  const getPlanIcon = () => {
    switch (currentPlan.toLowerCase()) {
      case 'enterprise':
        return <Crown className="h-5 w-5 text-purple-600" />;
      case 'avanzado':
        return <Star className="h-5 w-5 text-blue-600" />;
      case 'profesional':
        return <Zap className="h-5 w-5 text-green-600" />;
      case 'básico':
      case 'basico':
        return <CheckCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  // Determinar el color del badge del plan
  const getPlanBadgeVariant = () => {
    switch (currentPlan.toLowerCase()) {
      case 'enterprise':
        return 'default' as const;
      case 'avanzado':
        return 'secondary' as const;
      case 'profesional':
        return 'outline' as const;
      case 'básico':
      case 'basico':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  // Determinar el estado de la suscripción
  const getSubscriptionStatus = () => {
    if (isExpired) {
      return {
        status: 'Expirada',
        variant: 'destructive' as const,
        icon: <XCircle className="h-4 w-4" />,
        color: 'text-red-600'
      };
    }
    
    if (isSuspended) {
      return {
        status: 'Suspendida',
        variant: 'destructive' as const,
        icon: <XCircle className="h-4 w-4" />,
        color: 'text-red-600'
      };
    }
    
    if (daysUntilExpiration <= 7) {
      return {
        status: 'Próxima a vencer',
        variant: 'secondary' as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'text-yellow-600'
      };
    }
    
    if (isActive) {
      return {
        status: 'Activa',
        variant: 'default' as const,
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'text-green-600'
      };
    }
    
    return {
      status: 'Inactiva',
      variant: 'outline' as const,
      icon: <Clock className="h-4 w-4" />,
      color: 'text-gray-600'
    };
  };

  const subscriptionStatus = getSubscriptionStatus();

  // Calcular el uso general
  const calculateOverallUsage = () => {
    const limits = [sucursalesInfo, usuariosInfo, productosInfo, transaccionesInfo, almacenamientoInfo];
    const totalPercentage = limits.reduce((sum, limit) => sum + limit.percentage, 0);
    return totalPercentage / limits.length;
  };

  const overallUsage = calculateOverallUsage();

  // Determinar si hay alertas críticas
  const hasCriticalIssues = () => {
    return (
      isExpired ||
      isSuspended ||
      daysUntilExpiration <= 7 ||
      unreadAlertsCount > 0 ||
      overallUsage >= 90
    );
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      onRefresh();
    } else {
      await refreshData();
    }
  };

  return (
    <Card className={`${className} ${hasCriticalIssues() ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getPlanIcon()}
            <div>
              <CardTitle className="text-lg">Estado del Plan</CardTitle>
              <CardDescription>
                Información actual de tu suscripción y uso
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {showRefreshButton && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            
            {unreadAlertsCount > 0 && (
              <Badge variant="destructive" className="flex items-center space-x-1">
                <Bell className="h-3 w-3" />
                <span>{unreadAlertsCount}</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Información del plan */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Plan Actual:</span>
            <Badge variant={getPlanBadgeVariant()}>
              {currentPlan}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Estado:</span>
            <Badge variant={subscriptionStatus.variant} className={subscriptionStatus.color}>
              {subscriptionStatus.icon}
              <span className="ml-1">{subscriptionStatus.status}</span>
            </Badge>
          </div>
        </div>

        {/* Información de vencimiento */}
        {!isExpired && !isSuspended && (
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Días hasta el vencimiento:</span>
              <span className={`text-sm font-medium ${daysUntilExpiration <= 7 ? 'text-red-600' : 'text-gray-900'}`}>
                {daysUntilExpiration} días
              </span>
            </div>
          </div>
        )}

        {/* Resumen de uso */}
        <div className="bg-white rounded-lg p-3 border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Uso General</span>
            <span className="text-sm text-gray-600">
              {overallUsage.toFixed(0)}% utilizado
            </span>
          </div>
          
          <Progress 
            value={overallUsage} 
            className="h-2"
          />
          
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <div className="flex justify-between">
              <span>Sucursales:</span>
              <span className={sucursalesInfo.exceeded ? 'text-red-600' : ''}>
                {sucursalesInfo.current}/{sucursalesInfo.unlimited ? '∞' : sucursalesInfo.max}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Usuarios:</span>
              <span className={usuariosInfo.exceeded ? 'text-red-600' : ''}>
                {usuariosInfo.current}/{usuariosInfo.unlimited ? '∞' : usuariosInfo.max}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Productos:</span>
              <span className={productosInfo.exceeded ? 'text-red-600' : ''}>
                {productosInfo.current}/{productosInfo.unlimited ? '∞' : productosInfo.max}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Transacciones:</span>
              <span className={transaccionesInfo.exceeded ? 'text-red-600' : ''}>
                {transaccionesInfo.current}/{transaccionesInfo.unlimited ? '∞' : transaccionesInfo.max}
              </span>
            </div>
          </div>
        </div>

        {/* Alertas y recomendaciones */}
        {hasCriticalIssues() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Atención Requerida
                </p>
                <div className="text-xs text-yellow-700 mt-1">
                  {isExpired && <p>• Tu suscripción ha expirado</p>}
                  {isSuspended && <p>• Tu suscripción está suspendida</p>}
                  {daysUntilExpiration <= 7 && <p>• Tu suscripción vence pronto</p>}
                  {unreadAlertsCount > 0 && <p>• Tienes {unreadAlertsCount} alertas sin leer</p>}
                  {overallUsage >= 90 && <p>• Estás cerca de exceder los límites</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botón de actualización */}
        {showUpgradeButton && (currentPlan.toLowerCase() !== 'enterprise') && (
          <Button
            onClick={onUpgrade}
            className="w-full"
            variant="default"
          >
            <ArrowUp className="h-4 w-4 mr-2" />
            Actualizar Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanStatusCard;
