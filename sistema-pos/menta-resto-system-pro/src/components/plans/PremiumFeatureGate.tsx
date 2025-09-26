import React, { ReactNode } from 'react';
import { usePlan } from '@/context/PlanContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Zap, Phone, Mail, Star } from 'lucide-react';

interface PremiumFeatureGateProps {
  feature: string;
  requiredPlan?: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  className?: string;
}

export const PremiumFeatureGate: React.FC<PremiumFeatureGateProps> = ({
  feature,
  requiredPlan,
  children,
  fallback,
  showUpgradePrompt = true,
  className = '',
}) => {
  const { planInfo, hasFeature, checkFeatureAccess } = usePlan();

  // Verificar acceso a la funcionalidad
  const hasAccess = checkFeatureAccess(feature, false);

  // Si tiene acceso, mostrar el contenido
  if (hasAccess) {
    return <>{children}</>;
  }

  // Si hay un fallback personalizado, usarlo
  if (fallback) {
    return <>{fallback}</>;
  }

  // Si no debe mostrar prompt de upgrade, no renderizar nada
  if (!showUpgradePrompt) {
    return null;
  }

  // Mapeo de funcionalidades a nombres amigables
  const featureNames: { [key: string]: string } = {
    'analytics-avanzados': 'Analytics Avanzados',
    'analytics-productos': 'Análisis de Productos',
    'tendencias-temporales': 'Tendencias Temporales',
    'exportacion-avanzada': 'Exportación Avanzada',
    'reservas': 'Sistema de Reservas',
    'cocina': 'Módulo de Cocina',
    'promociones': 'Gestión de Promociones',
    'egresos': 'Control de Egresos',
    'api': 'Acceso API',
    'white_label': 'White Label',
  };

  // Mapeo de planes requeridos
  const planRequirements: { [key: string]: string } = {
    'analytics-avanzados': 'Profesional',
    'analytics-productos': 'Profesional',
    'tendencias-temporales': 'Avanzado',
    'exportacion-avanzada': 'Avanzado',
    'reservas': 'Avanzado',
    'cocina': 'Profesional',
    'promociones': 'Profesional',
    'egresos': 'Básico',
    'api': 'Enterprise',
    'white_label': 'Enterprise',
  };

  const featureName = featureNames[feature] || feature;
  const requiredPlanName = requiredPlan || planRequirements[feature] || 'Superior';
  const currentPlanName = planInfo?.plan.nombre || 'Básico';

  // Determinar icono según el plan requerido
  const getPlanIcon = (plan: string) => {
    if (plan.toLowerCase().includes('enterprise')) return Crown;
    if (plan.toLowerCase().includes('avanzado')) return Star;
    return Zap;
  };

  const PlanIcon = getPlanIcon(requiredPlanName);

  return (
    <div className={`${className}`}>
      <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center">
            <PlanIcon className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl text-gray-700">
            Funcionalidad Premium
          </CardTitle>
          <CardDescription className="text-center">
            <Badge variant="outline" className="mb-2">
              {featureName}
            </Badge>
            <br />
            Esta funcionalidad requiere el plan <strong>{requiredPlanName}</strong> o superior
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          {/* Estado actual */}
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Plan actual:</span>
              <Badge variant="secondary">{currentPlanName}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">Plan requerido:</span>
              <Badge variant="default">{requiredPlanName}</Badge>
            </div>
          </div>

          {/* Beneficios del upgrade */}
          <div className="bg-blue-50 rounded-lg p-4 text-left">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Beneficios del Plan {requiredPlanName}
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {requiredPlanName === 'Profesional' && (
                <>
                  <li>• Analytics avanzados y reportes detallados</li>
                  <li>• Gestión completa de promociones</li>
                  <li>• Módulo de cocina integrado</li>
                  <li>• Soporte telefónico prioritario</li>
                </>
              )}
              {requiredPlanName === 'Avanzado' && (
                <>
                  <li>• Sistema completo de reservas</li>
                  <li>• Tendencias temporales y predicciones</li>
                  <li>• Exportación avanzada de datos</li>
                  <li>• Integración con delivery</li>
                  <li>• Soporte 24/7</li>
                </>
              )}
              {requiredPlanName === 'Enterprise' && (
                <>
                  <li>• Acceso completo a API</li>
                  <li>• White Label personalizado</li>
                  <li>• Recursos ilimitados</li>
                  <li>• Implementación personalizada</li>
                  <li>• Gerente de cuenta dedicado</li>
                </>
              )}
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 justify-center">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
              <Crown className="h-4 w-4 mr-2" />
              Upgradearse
            </Button>
            <Button variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              69512310
            </Button>
          </div>

          {/* Información de contacto */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>📧 forkasbib@gmail.com</p>
            <p>¿Preguntas? Nuestro equipo te ayudará a elegir el plan perfecto</p>
          </div>

          {/* Versión bloqueada del contenido */}
          <div className="relative mt-6">
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
              <div className="text-center">
                <Lock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">Contenido Premium</p>
              </div>
            </div>
            <div className="opacity-30 pointer-events-none">
              {children}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumFeatureGate;
