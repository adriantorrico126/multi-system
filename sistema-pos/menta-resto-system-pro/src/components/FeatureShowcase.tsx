import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Users, 
  Package, 
  Building, 
  BarChart3,
  Settings,
  Shield,
  Zap,
  Star
} from 'lucide-react';
import PlanGate from '@/components/PlanGate';

/**
 * Componente de ejemplo que muestra cómo usar PlanGate para proteger funcionalidades
 */
const FeatureShowcase = () => {
  const features = [
    {
      id: 'dashboard',
      name: 'Dashboard Avanzado',
      description: 'Análisis detallado de ventas y métricas',
      icon: BarChart3,
      requiredPlan: 'basico',
      color: 'bg-blue-500'
    },
    {
      id: 'users',
      name: 'Gestión de Usuarios',
      description: 'Administración completa de usuarios y roles',
      icon: Users,
      requiredPlan: 'basico',
      color: 'bg-green-500'
    },
    {
      id: 'inventory',
      name: 'Control de Inventario',
      description: 'Gestión avanzada de productos y stock',
      icon: Package,
      requiredPlan: 'basico',
      color: 'bg-purple-500'
    },
    {
      id: 'branches',
      name: 'Múltiples Sucursales',
      description: 'Administración de múltiples ubicaciones',
      icon: Building,
      requiredPlan: 'basico',
      color: 'bg-orange-500'
    },
    {
      id: 'analytics',
      name: 'Analytics Avanzados',
      description: 'Reportes detallados y análisis predictivo',
      icon: BarChart3,
      requiredPlan: 'basico',
      color: 'bg-red-500'
    },
    {
      id: 'settings',
      name: 'Configuración Avanzada',
      description: 'Personalización completa del sistema',
      icon: Settings,
      requiredPlan: 'basico',
      color: 'bg-gray-500'
    }
  ];

  const getPlanBadge = (plan) => {
    const badges = {
      'profesional': { text: 'Profesional', color: 'bg-blue-100 text-blue-800' },
      'avanzado': { text: 'Avanzado', color: 'bg-purple-100 text-purple-800' },
      'enterprise': { text: 'Enterprise', color: 'bg-yellow-100 text-yellow-800' }
    };
    
    const badge = badges[plan];
    return (
      <Badge className={`${badge.color} border-0`}>
        <Crown className="w-3 h-3 mr-1" />
        {badge.text}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">
          Funcionalidades del Sistema
        </h2>
        <p className="text-gray-600">
          Descubre todas las características disponibles según tu plan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => {
          const IconComponent = feature.icon;
          
          return (
            <PlanGate
              key={feature.id}
              featureName={feature.name}
              requiredPlan={feature.requiredPlan}
              fallback={
                <Card className="opacity-60 border-dashed">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 ${feature.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      {getPlanBadge(feature.requiredPlan)}
                    </div>
                    <CardTitle className="text-lg">{feature.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      {feature.description}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Shield className="w-3 h-3 mr-1" />
                      Requiere plan {feature.requiredPlan}
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 ${feature.color} rounded-lg flex items-center justify-center`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center text-xs text-green-600">
                      <Star className="w-3 h-3 mr-1" />
                      Disponible
                    </div>
                  </div>
                  <CardTitle className="text-lg">{feature.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {feature.description}
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      // Aquí iría la lógica para abrir la funcionalidad
                      console.log(`Abriendo ${feature.name}`);
                    }}
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Acceder
                  </Button>
                </CardContent>
              </Card>
            </PlanGate>
          );
        })}
      </div>

      {/* Información adicional */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                ¿Interesado en desbloquear más funcionalidades?
              </h3>
              <p className="text-gray-600 mb-4">
                Nuestros planes superiores incluyen características avanzadas diseñadas para hacer crecer tu negocio.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline"
                  onClick={() => window.open('tel:69512310')}
                  className="flex items-center"
                >
                  <span className="mr-2">📞</span>
                  Llamar: 69512310
                </Button>
                <Button 
                  onClick={() => window.open('mailto:forkasbib@gmail.com?subject=Consulta sobre planes superiores')}
                  className="flex items-center"
                >
                  <span className="mr-2">✉️</span>
                  Email: forkasbib@gmail.com
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureShowcase;
