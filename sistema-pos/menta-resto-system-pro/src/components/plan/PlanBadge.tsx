import React, { useState } from 'react';
import { usePlanSystem } from '@/context/PlanSystemContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  AlertTriangle, 
  CheckCircle,
  ChevronDown,
  Star,
  Zap,
  Crown as CrownIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PlanBadgeProps {
  showDetails?: boolean;
  onUpgrade?: () => void;
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({ 
  showDetails = false, 
  onUpgrade 
}) => {
  const { 
    currentPlan, 
    planUsage, 
    isLoading, 
    getSucursalesInfo, 
    getUsuariosInfo,
    getProductosInfo,
    isLimitExceeded 
  } = usePlanSystem();

  const [isOpen, setIsOpen] = useState(false);

  if (isLoading || !currentPlan) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <div className="w-4 h-4 bg-gray-300 rounded mr-1"></div>
        Cargando...
      </Badge>
    );
  }

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'basico':
        return <Star className="h-3 w-3 text-green-600" />;
      case 'profesional':
        return <Zap className="h-3 w-3 text-blue-600" />;
      case 'avanzado':
        return <CrownIcon className="h-3 w-3 text-purple-600" />;
      case 'enterprise':
        return <CrownIcon className="h-3 w-3 text-yellow-600" />;
      default:
        return <Star className="h-3 w-3 text-gray-600" />;
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

  const hasExceededLimits = () => {
    return isLimitExceeded('max_sucursales') || 
           isLimitExceeded('max_usuarios') || 
           isLimitExceeded('max_productos') || 
           isLimitExceeded('max_transacciones_mes');
  };

  const sucursalesInfo = getSucursalesInfo();
  const usuariosInfo = getUsuariosInfo();
  const productosInfo = getProductosInfo();

  if (showDetails) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={`${getPlanColor(currentPlan.nombre)} hover:opacity-80 transition-opacity`}
          >
            <div className="flex items-center space-x-1">
              {getPlanIcon(currentPlan.nombre)}
              <span className="text-xs font-medium">
                {formatPlanName(currentPlan.nombre)}
              </span>
              {hasExceededLimits() && (
                <AlertTriangle className="h-3 w-3 text-red-500" />
              )}
              <ChevronDown className="h-3 w-3" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="p-4 space-y-4">
            {/* Header del plan */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getPlanIcon(currentPlan.nombre)}
                <div>
                  <h3 className="font-semibold text-sm">
                    Plan {formatPlanName(currentPlan.nombre)}
                  </h3>
                  <p className="text-xs text-gray-600">
                    ${currentPlan.precio_mensual}/mes
                  </p>
                </div>
              </div>
              {hasExceededLimits() && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>

            {/* Límites de uso */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-gray-700">Límites de Uso</h4>
              
              {/* Sucursales */}
              <div className="flex items-center justify-between text-xs">
                <span>Sucursales</span>
                <div className="flex items-center space-x-1">
                  {isLimitExceeded('max_sucursales') ? (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                  <span>
                    {sucursalesInfo.current} / {sucursalesInfo.unlimited ? '∞' : sucursalesInfo.max}
                  </span>
                </div>
              </div>

              {/* Usuarios */}
              <div className="flex items-center justify-between text-xs">
                <span>Usuarios</span>
                <div className="flex items-center space-x-1">
                  {isLimitExceeded('max_usuarios') ? (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                  <span>
                    {usuariosInfo.current} / {usuariosInfo.unlimited ? '∞' : usuariosInfo.max}
                  </span>
                </div>
              </div>

              {/* Productos */}
              <div className="flex items-center justify-between text-xs">
                <span>Productos</span>
                <div className="flex items-center space-x-1">
                  {isLimitExceeded('max_productos') ? (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                  <span>
                    {productosInfo.current} / {productosInfo.unlimited ? '∞' : productosInfo.max}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón de upgrade */}
            {currentPlan.nombre !== 'enterprise' && onUpgrade && (
              <div className="pt-2 border-t">
                <Button 
                  onClick={() => {
                    onUpgrade();
                    setIsOpen(false);
                  }}
                  size="sm"
                  className="w-full"
                  variant="outline"
                >
                  <Crown className="h-3 w-3 mr-1" />
                  Actualizar Plan
                </Button>
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`${getPlanColor(currentPlan.nombre)} ${hasExceededLimits() ? 'border-red-300' : ''}`}
    >
      <div className="flex items-center space-x-1">
        {getPlanIcon(currentPlan.nombre)}
        <span className="text-xs font-medium">
          {formatPlanName(currentPlan.nombre)}
        </span>
        {hasExceededLimits() && (
          <AlertTriangle className="h-3 w-3 text-red-500" />
        )}
      </div>
    </Badge>
  );
};
