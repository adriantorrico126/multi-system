import React from 'react';
import { usePlan, PlanLimits } from '@/context/PlanContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Ban, Phone, TrendingUp } from 'lucide-react';

interface LimitAlertProps {
  limitType: keyof PlanLimits;
  className?: string;
  showProgress?: boolean;
  compact?: boolean;
}

export const LimitAlert: React.FC<LimitAlertProps> = ({
  limitType,
  className = '',
  showProgress = true,
  compact = false,
}) => {
  const { planInfo, isLimitExceeded, getRemainingLimit, getUsagePercentage } = usePlan();

  if (!planInfo) return null;

  const isExceeded = isLimitExceeded(limitType);
  const remaining = getRemainingLimit(limitType);
  const percentage = getUsagePercentage(limitType);
  const { limites, uso_actual } = planInfo;

  // Si el límite es ilimitado (-1), no mostrar alerta
  if (remaining === -1) return null;

  // Solo mostrar si está cerca del límite o excedido
  const isNearLimit = percentage >= 80;
  if (!isExceeded && !isNearLimit) return null;

  // Mapeo de tipos de límites a texto amigable
  const limitLabels: { [key in keyof PlanLimits]: string } = {
    max_productos: 'productos',
    max_usuarios: 'usuarios',
    max_sucursales: 'sucursales',
    max_transacciones_mes: 'transacciones mensuales',
    almacenamiento_gb: 'almacenamiento',
  };

  const limitLabel = limitLabels[limitType];
  
  // Obtener valores actuales
  const getCurrentValue = (): number => {
    switch (limitType) {
      case 'max_productos': return uso_actual.productos;
      case 'max_usuarios': return uso_actual.usuarios;
      case 'max_sucursales': return uso_actual.sucursales;
      case 'max_transacciones_mes': return uso_actual.transacciones;
      case 'almacenamiento_gb': return Math.round(uso_actual.almacenamiento_mb / 1024 * 100) / 100;
      default: return 0;
    }
  };

  const getMaxValue = (): number => {
    switch (limitType) {
      case 'max_productos': return limites.max_productos;
      case 'max_usuarios': return limites.max_usuarios;
      case 'max_sucursales': return limites.max_sucursales;
      case 'max_transacciones_mes': return limites.max_transacciones_mes;
      case 'almacenamiento_gb': return limites.almacenamiento_gb;
      default: return 0;
    }
  };

  const currentValue = getCurrentValue();
  const maxValue = getMaxValue();

  // Determinar tipo de alerta
  const alertVariant = isExceeded ? 'destructive' : 'default';
  const icon = isExceeded ? Ban : AlertTriangle;
  const IconComponent = icon;

  // Mensajes según el estado
  const getTitle = (): string => {
    if (isExceeded) {
      return `Límite de ${limitLabel} excedido`;
    }
    return `Límite de ${limitLabel} próximo`;
  };

  const getDescription = (): string => {
    if (isExceeded) {
      return `Has alcanzado el límite máximo de ${limitLabel} en tu plan ${planInfo.plan.nombre}. Para continuar, necesitas actualizar tu plan.`;
    }
    return `Estás usando ${currentValue} de ${maxValue} ${limitLabel} disponibles (${Math.round(percentage)}%). Considera actualizar tu plan antes de alcanzar el límite.`;
  };

  const getUnit = (): string => {
    return limitType === 'almacenamiento_gb' ? 'GB' : '';
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg ${
        isExceeded ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'
      } ${className}`}>
        <IconComponent className={`h-4 w-4 ${
          isExceeded ? 'text-red-500' : 'text-orange-500'
        }`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${
            isExceeded ? 'text-red-700' : 'text-orange-700'
          }`}>
            {currentValue}/{maxValue} {limitLabel} {getUnit()}
          </p>
          {showProgress && (
            <Progress 
              value={Math.min(100, percentage)} 
              className={`h-1 mt-1 ${
                isExceeded ? '[&>div]:bg-red-500' : '[&>div]:bg-orange-500'
              }`}
            />
          )}
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          className={`text-xs ${
            isExceeded ? 'text-red-600 border-red-300' : 'text-orange-600 border-orange-300'
          }`}
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <Alert variant={alertVariant} className={className}>
      <IconComponent className="h-4 w-4" />
      <AlertTitle>{getTitle()}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{getDescription()}</p>
        
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uso actual:</span>
              <span className="font-medium">
                {currentValue} / {maxValue} {limitLabel} {getUnit()}
              </span>
            </div>
            <Progress 
              value={Math.min(100, percentage)} 
              className="h-2"
            />
            <p className="text-xs text-gray-600">
              {remaining > 0 
                ? `Quedan ${remaining} ${limitLabel} disponibles`
                : `Límite excedido en ${Math.abs(remaining)} ${limitLabel}`
              }
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <TrendingUp className="h-4 w-4 mr-2" />
            Actualizar Plan
          </Button>
          <Button size="sm" variant="outline">
            <Phone className="h-4 w-4 mr-2" />
            Contactar: 69512310
          </Button>
        </div>

        <div className="bg-blue-50 rounded p-3 mt-3">
          <h4 className="font-medium text-blue-900 text-sm mb-1">
            💡 Beneficios del upgrade:
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Límites más altos para {limitLabel}</li>
            <li>• Funcionalidades adicionales premium</li>
            <li>• Soporte prioritario</li>
            <li>• Sin restricciones de crecimiento</li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default LimitAlert;
