import React from 'react';
import { usePlan } from '@/context/PlanContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Crown, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface PlanGateProps {
  feature: keyof import('@/context/PlanContext').PlanFeatures | string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  onUpgrade?: () => void;
  planName?: string;
  requiredPlan?: string;
}

export const PlanGate: React.FC<PlanGateProps> = ({
  feature,
  children,
  fallback,
  showUpgrade = true,
  onUpgrade,
  planName,
  requiredPlan
}) => {
  const { hasFeature, currentPlan, isLoading } = usePlan();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Verificando acceso...</span>
      </div>
    );
  }

  const hasAccess = hasFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Si no tiene acceso, mostrar fallback o mensaje de upgrade
  if (fallback) {
    return <>{fallback}</>;
  }

  const getFeatureName = (feature: string) => {
    const featureNames: Record<string, string> = {
      // Funcionalidades básicas
      'sales.basico': 'Historial de Ventas Básico',
      'sales.pedidos': 'Gestión de Pedidos',
      'sales.avanzado': 'Ventas Avanzadas',
      'inventory.products': 'Gestión de Productos',
      'inventory.lots': 'Sistema de Lotes',
      'inventory.complete': 'Inventario Completo',
      'dashboard.resumen': 'Dashboard Resumen',
      'dashboard.productos': 'Dashboard Productos',
      'dashboard.categorias': 'Dashboard Categorías',
      'dashboard.usuarios': 'Dashboard Usuarios',
      'dashboard.mesas': 'Dashboard Mesas',
      'dashboard.completo': 'Dashboard Completo',
      'egresos.basico': 'Egresos Básicos',
      'egresos.avanzado': 'Egresos Avanzados',
      
      // Funcionalidades específicas
      mesas: 'Gestión de Mesas',
      lotes: 'Sistema de Lotes',
      arqueo: 'Arqueo de Caja',
      cocina: 'Vista de Cocina',
      egresos: 'Sistema de Egresos',
      delivery: 'Sistema de Delivery',
      reservas: 'Sistema de Reservas',
      analytics: 'Analytics Avanzados',
      promociones: 'Sistema de Promociones',
      api: 'API Externa',
      white_label: 'White Label',
      sales: 'Ventas Avanzadas',
      inventory: 'Inventario Completo',
      dashboard: 'Dashboard Completo'
    };
    return featureNames[feature] || feature;
  };

  const getRequiredPlan = (feature: string) => {
    const planRequirements: Record<string, string> = {
      // Plan Básico - Solo funcionalidades básicas
      'sales.basico': 'Básico',
      'inventory.products': 'Básico', 
      'dashboard.resumen': 'Básico',
      'dashboard.productos': 'Básico',
      'dashboard.categorias': 'Básico',
      'dashboard.usuarios': 'Básico',
      
      // Plan Profesional - Funcionalidades intermedias
      'sales.pedidos': 'Profesional',
      'inventory.lots': 'Profesional',
      'dashboard.mesas': 'Profesional',
      'egresos.basico': 'Profesional',
      mesas: 'Profesional',
      lotes: 'Profesional',
      arqueo: 'Profesional',
      cocina: 'Profesional',
      egresos: 'Profesional',
      
      // Plan Avanzado - Funcionalidades avanzadas
      'sales.avanzado': 'Avanzado',
      'inventory.complete': 'Avanzado',
      'dashboard.completo': 'Avanzado',
      'egresos.avanzado': 'Avanzado',
      delivery: 'Avanzado',
      reservas: 'Avanzado',
      analytics: 'Avanzado',
      promociones: 'Avanzado',
      
      // Plan Enterprise - Funcionalidades premium
      api: 'Enterprise',
      white_label: 'Enterprise'
    };
    return planRequirements[feature] || 'Profesional';
  };

  const requiredPlanName = requiredPlan || planName || getRequiredPlan(feature);
  const featureName = getFeatureName(feature);

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2 text-amber-600">
            <Lock className="h-8 w-8" />
            <XCircle className="h-6 w-6" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Funcionalidad No Disponible
            </h3>
            <p className="text-gray-600">
              <strong>{featureName}</strong> no está disponible en tu plan actual.
            </p>
            <p className="text-sm text-gray-500">
              Esta funcionalidad está disponible en el plan <strong>{requiredPlanName}</strong> o superior.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-amber-700 border-amber-300">
              Plan Actual: {currentPlan?.nombre?.charAt(0).toUpperCase() + currentPlan?.nombre?.slice(1)}
            </Badge>
            <Badge variant="outline" className="text-green-700 border-green-300">
              Requerido: {requiredPlanName}
            </Badge>
          </div>

          {showUpgrade && onUpgrade && (
            <Button 
              onClick={onUpgrade}
              className="mt-4"
              variant="default"
            >
              <Crown className="h-4 w-4 mr-2" />
              Actualizar a Plan {requiredPlanName}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface PlanLimitProps {
  limit: keyof import('@/context/PlanContext').PlanLimits;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  onUpgrade?: () => void;
}

export const PlanLimit: React.FC<PlanLimitProps> = ({
  limit,
  children,
  fallback,
  showUpgrade = true,
  onUpgrade
}) => {
  const { isLimitExceeded, currentPlan, isLoading } = usePlan();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Verificando límites...</span>
      </div>
    );
  }

  const isExceeded = isLimitExceeded(limit);

  if (!isExceeded) {
    return <>{children}</>;
  }

  // Si se excedió el límite, mostrar fallback o mensaje de upgrade
  if (fallback) {
    return <>{fallback}</>;
  }

  const getLimitName = (limit: string) => {
    const limitNames: Record<string, string> = {
      max_sucursales: 'Sucursales',
      max_usuarios: 'Usuarios',
      max_productos: 'Productos',
      max_transacciones_mes: 'Transacciones Mensuales',
      almacenamiento_gb: 'Almacenamiento'
    };
    return limitNames[limit] || limit;
  };

  const limitName = getLimitName(limit);

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-8 w-8" />
            <XCircle className="h-6 w-6" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Límite Excedido
            </h3>
            <p className="text-gray-600">
              Has excedido el límite de <strong>{limitName}</strong> en tu plan actual.
            </p>
            <p className="text-sm text-gray-500">
              Actualiza tu plan para aumentar los límites y continuar usando esta funcionalidad.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-red-700 border-red-300">
              Plan Actual: {currentPlan?.nombre?.charAt(0).toUpperCase() + currentPlan?.nombre?.slice(1)}
            </Badge>
          </div>

          {showUpgrade && onUpgrade && (
            <Button 
              onClick={onUpgrade}
              className="mt-4"
              variant="default"
            >
              <Crown className="h-4 w-4 mr-2" />
              Actualizar Plan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
