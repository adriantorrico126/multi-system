import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlanSystem } from '@/context/PlanSystemContext';
import { Lock, Crown, Star, Zap, ArrowUp } from 'lucide-react';

interface PlanFeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeButton?: boolean;
  onUpgrade?: () => void;
  className?: string;
}

export const PlanFeatureGate: React.FC<PlanFeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradeButton = true,
  onUpgrade,
  className = ''
}) => {
  const { 
    hasFeature, 
    checkFeatureAccess, 
    currentPlan,
    isActive,
    isExpired,
    isSuspended
  } = usePlanSystem();

  const hasAccess = hasFeature(feature);
  const accessInfo = checkFeatureAccess(feature);

  // Si no hay acceso, mostrar el fallback o el componente de restricción
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className={`relative ${className}`}>
        {/* Overlay de restricción */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-lg border-2 border-dashed border-gray-300">
          <div className="flex items-center justify-center h-full p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                  <Lock className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle className="text-lg">Funcionalidad No Disponible</CardTitle>
                <CardDescription>
                  Esta funcionalidad no está incluida en tu plan actual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Información del plan actual */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Plan Actual:</span>
                    <Badge variant="outline">{currentPlan}</Badge>
                  </div>
                </div>

                {/* Información de acceso */}
                <Alert>
                  <AlertTitle className="text-sm">
                    {accessInfo.reason || 'Funcionalidad no disponible'}
                  </AlertTitle>
                  {accessInfo.requiredPlan && (
                    <AlertDescription className="mt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Plan requerido:</span>
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          {accessInfo.requiredPlan}
                        </Badge>
                      </div>
                    </AlertDescription>
                  )}
                </Alert>

                {/* Estado de la suscripción */}
                {!isActive && (
                  <Alert variant="destructive">
                    <AlertTitle className="text-sm">
                      {isExpired ? 'Suscripción Expirada' : isSuspended ? 'Suscripción Suspendida' : 'Suscripción Inactiva'}
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                      <p className="text-sm">
                        {isExpired 
                          ? 'Tu suscripción ha expirado. Renueva para continuar usando todas las funcionalidades.'
                          : isSuspended
                          ? 'Tu suscripción está suspendida. Contacta soporte para más información.'
                          : 'Tu suscripción no está activa. Actívala para acceder a todas las funcionalidades.'
                        }
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Botón de actualización */}
                {showUpgradeButton && accessInfo.requiredPlan && (
                  <Button
                    onClick={onUpgrade}
                    className="w-full"
                    variant="default"
                  >
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Actualizar a {accessInfo.requiredPlan}
                  </Button>
                )}

                {/* Información adicional */}
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    ¿Necesitas ayuda? Contacta a nuestro equipo de soporte
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contenido original (deshabilitado) */}
        <div className="opacity-30 pointer-events-none">
          {children}
        </div>
      </div>
    );
  }

  // Si tiene acceso, mostrar el contenido normalmente
  return <>{children}</>;
};

// Componente de conveniencia para funcionalidades específicas
export const POSFeatureGate: React.FC<Omit<PlanFeatureGateProps, 'feature'>> = (props) => (
  <PlanFeatureGate {...props} feature="incluye_pos" />
);

export const InventarioBasicoFeatureGate: React.FC<Omit<PlanFeatureGateProps, 'feature'>> = (props) => (
  <PlanFeatureGate {...props} feature="incluye_inventario_basico" />
);

export const InventarioAvanzadoFeatureGate: React.FC<Omit<PlanFeatureGateProps, 'feature'>> = (props) => (
  <PlanFeatureGate {...props} feature="incluye_inventario_avanzado" />
);

export const PromocionesFeatureGate: React.FC<Omit<PlanFeatureGateProps, 'feature'>> = (props) => (
  <PlanFeatureGate {...props} feature="incluye_promociones" />
);

export const ReservasFeatureGate: React.FC<Omit<PlanFeatureGateProps, 'feature'>> = (props) => (
  <PlanFeatureGate {...props} feature="incluye_reservas" />
);

export const ArqueoCajaFeatureGate: React.FC<Omit<PlanFeatureGateProps, 'feature'>> = (props) => (
  <PlanFeatureGate {...props} feature="incluye_arqueo_caja" />
);

export const EgresosFeatureGate: React.FC<Omit<PlanFeatureGateProps, 'feature'>> = (props) => (
  <PlanFeatureGate {...props} feature="incluye_egresos" />
);

export const EgresosAvanzadosFeatureGate: React.FC<Omit<PlanFeatureGateProps, 'feature'>> = (props) => (
  <PlanFeatureGate {...props} feature="incluye_egresos_avanzados" />
);

export const ReportesAvanzadosFeatureGate: React.FC<Omit<PlanFeatureGateProps, 'feature'>> = (props) => (
  <PlanFeatureGate {...props} feature="incluye_reportes_avanzados" />
);

export const AnalyticsFeatureGate: React.FC<Omit<PlanFeatureGateProps, 'feature'>> = (props) => (
  <PlanFeatureGate {...props} feature="incluye_analytics" />
);

export const DeliveryFeatureGate: React.FC<Omit<PlanFeatureGateProps, 'feature'>> = (props) => (
  <PlanFeatureGate {...props} feature="incluye_delivery" />
);

export const ImpresionFeatureGate: React.FC<Omit<PlanFeatureGateProps, 'feature'>> = (props) => (
  <PlanFeatureGate {...props} feature="incluye_impresion" />
);

export const Soporte24hFeatureGate: React.FC<Omit<PlanFeatureGateProps, 'feature'>> = (props) => (
  <PlanFeatureGate {...props} feature="incluye_soporte_24h" />
);

export const APIFeatureGate: React.FC<Omit<PlanFeatureGateProps, 'feature'>> = (props) => (
  <PlanFeatureGate {...props} feature="incluye_api" />
);

export const WhiteLabelFeatureGate: React.FC<Omit<PlanFeatureGateProps, 'feature'>> = (props) => (
  <PlanFeatureGate {...props} feature="incluye_white_label" />
);

export default PlanFeatureGate;
