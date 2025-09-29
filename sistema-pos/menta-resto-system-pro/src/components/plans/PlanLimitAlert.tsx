import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlanSystem } from '@/context/PlanSystemContext';
import { AlertTriangle, X, CheckCircle, Info, Zap } from 'lucide-react';

interface PlanLimitAlertProps {
  limitType: 'sucursales' | 'usuarios' | 'productos' | 'transacciones' | 'almacenamiento';
  showUpgradeButton?: boolean;
  onUpgrade?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const PlanLimitAlert: React.FC<PlanLimitAlertProps> = ({
  limitType,
  showUpgradeButton = true,
  onUpgrade,
  onDismiss,
  className = ''
}) => {
  const { 
    getSucursalesInfo, 
    getUsuariosInfo, 
    getProductosInfo, 
    getTransaccionesInfo, 
    getAlmacenamientoInfo,
    currentPlan,
    isLimitExceeded
  } = usePlanSystem();

  // Obtener información del límite específico
  const getLimitInfo = () => {
    switch (limitType) {
      case 'sucursales':
        return getSucursalesInfo();
      case 'usuarios':
        return getUsuariosInfo();
      case 'productos':
        return getProductosInfo();
      case 'transacciones':
        return getTransaccionesInfo();
      case 'almacenamiento':
        return getAlmacenamientoInfo();
      default:
        return { current: 0, max: 0, remaining: 0, percentage: 0, unlimited: false, exceeded: false };
    }
  };

  const limitInfo = getLimitInfo();
  const exceeded = isLimitExceeded(`max_${limitType}`);

  // Configuración del límite
  const getLimitConfig = () => {
    switch (limitType) {
      case 'sucursales':
        return {
          title: 'Límite de Sucursales',
          description: 'Número máximo de sucursales permitidas',
          unit: 'sucursales',
          icon: <Zap className="h-4 w-4" />
        };
      case 'usuarios':
        return {
          title: 'Límite de Usuarios',
          description: 'Número máximo de usuarios permitidos',
          unit: 'usuarios',
          icon: <Zap className="h-4 w-4" />
        };
      case 'productos':
        return {
          title: 'Límite de Productos',
          description: 'Número máximo de productos permitidos',
          unit: 'productos',
          icon: <Zap className="h-4 w-4" />
        };
      case 'transacciones':
        return {
          title: 'Límite de Transacciones',
          description: 'Número máximo de transacciones mensuales',
          unit: 'transacciones/mes',
          icon: <Zap className="h-4 w-4" />
        };
      case 'almacenamiento':
        return {
          title: 'Límite de Almacenamiento',
          description: 'Espacio máximo de almacenamiento permitido',
          unit: 'GB',
          icon: <Zap className="h-4 w-4" />
        };
      default:
        return {
          title: 'Límite',
          description: 'Límite del plan',
          unit: 'unidades',
          icon: <Zap className="h-4 w-4" />
        };
    }
  };

  const config = getLimitConfig();

  // Determinar el tipo de alerta
  const getAlertType = () => {
    if (exceeded) return 'destructive';
    if (limitInfo.percentage >= 90) return 'destructive';
    if (limitInfo.percentage >= 80) return 'default';
    return 'default';
  };

  // Determinar el icono
  const getAlertIcon = () => {
    if (exceeded) return <AlertTriangle className="h-4 w-4" />;
    if (limitInfo.percentage >= 90) return <AlertTriangle className="h-4 w-4" />;
    if (limitInfo.percentage >= 80) return <Info className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  // Determinar el mensaje
  const getAlertMessage = () => {
    if (exceeded) {
      return `Has excedido el límite de ${config.unit}. No puedes agregar más ${config.unit} hasta que actualices tu plan.`;
    }
    
    if (limitInfo.percentage >= 90) {
      return `Estás cerca del límite de ${config.unit} (${limitInfo.percentage.toFixed(0)}% usado). Considera actualizar tu plan.`;
    }
    
    if (limitInfo.percentage >= 80) {
      return `Has usado el ${limitInfo.percentage.toFixed(0)}% de tu límite de ${config.unit}.`;
    }
    
    return `Uso normal de ${config.unit} (${limitInfo.percentage.toFixed(0)}% del límite).`;
  };

  // Determinar el color del badge
  const getBadgeVariant = () => {
    if (exceeded) return 'destructive';
    if (limitInfo.percentage >= 90) return 'destructive';
    if (limitInfo.percentage >= 80) return 'secondary';
    return 'default';
  };

  return (
    <Alert className={`${className} ${getAlertType() === 'destructive' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {getAlertIcon()}
          <div className="flex-1">
            <AlertTitle className="flex items-center space-x-2">
              <span>{config.title}</span>
              <Badge variant={getBadgeVariant()}>
                {currentPlan}
              </Badge>
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p className="text-sm text-gray-600 mb-2">
                {getAlertMessage()}
              </p>
              
              {/* Información detallada del uso */}
              <div className="bg-white rounded-lg p-3 border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Usado:</span>
                    <span className="ml-2 font-medium">
                      {limitInfo.current} {config.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Límite:</span>
                    <span className="ml-2 font-medium">
                      {limitInfo.unlimited ? 'Ilimitado' : `${limitInfo.max} ${config.unit}`}
                    </span>
                  </div>
                  {!limitInfo.unlimited && (
                    <>
                      <div>
                        <span className="text-gray-500">Restante:</span>
                        <span className="ml-2 font-medium">
                          {limitInfo.remaining} {config.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Porcentaje:</span>
                        <span className="ml-2 font-medium">
                          {limitInfo.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Barra de progreso */}
                {!limitInfo.unlimited && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          exceeded || limitInfo.percentage >= 90
                            ? 'bg-red-500'
                            : limitInfo.percentage >= 80
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, limitInfo.percentage)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </AlertDescription>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex items-center space-x-2">
          {showUpgradeButton && (exceeded || limitInfo.percentage >= 80) && (
            <Button
              size="sm"
              variant="outline"
              onClick={onUpgrade}
              className="text-xs"
            >
              Actualizar Plan
            </Button>
          )}
          
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="text-xs p-1 h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};

export default PlanLimitAlert;
