import React from 'react';
import { usePlanSystem } from '@/context/PlanSystemContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Crown, Zap, AlertTriangle, CheckCircle, Phone, Mail } from 'lucide-react';

interface PlanInfoProps {
  compact?: boolean;
  className?: string;
}

export const PlanInfo: React.FC<PlanInfoProps> = ({ compact = false, className = '' }) => {
  const { planInfo, isLoading, error } = usePlanSystem();

  if (isLoading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardHeader className="pb-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-2 bg-gray-200 rounded w-4/5"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !planInfo) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error de Plan
          </CardTitle>
          <CardDescription className="text-red-500">
            {error || 'No se pudo cargar la información del plan'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" className="text-blue-600">
            <Phone className="h-4 w-4 mr-2" />
            Contactar Soporte: 69512310
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { plan, suscripcion, limites, uso_actual } = planInfo;

  // Determinar color del plan
  const getPlanColor = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('enterprise')) return 'bg-purple-500';
    if (name.includes('avanzado')) return 'bg-blue-500';
    if (name.includes('profesional')) return 'bg-green-500';
    return 'bg-gray-500';
  };

  // Determinar icono del plan
  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('enterprise')) return Crown;
    if (name.includes('avanzado') || name.includes('profesional')) return Zap;
    return CheckCircle;
  };

  const PlanIcon = getPlanIcon(plan.nombre);

  // Verificar estado de la suscripción
  const isActive = suscripcion.estado === 'activa';
  const isExpiringSoon = suscripcion.fecha_fin && 
    new Date(suscripcion.fecha_fin).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 días

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 bg-white rounded-lg border ${className}`}>
        <div className={`p-2 rounded-lg ${getPlanColor(plan.nombre)} text-white`}>
          <PlanIcon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{plan.nombre}</span>
            <Badge variant={isActive ? "default" : "destructive"} className="text-xs">
              {isActive ? "Activo" : suscripcion.estado}
            </Badge>
          </div>
          <p className="text-xs text-gray-500">
            {limites.max_productos > 0 ? `${uso_actual.productos_actuales}/${limites.max_productos} productos` : 'Productos ilimitados'}
          </p>
        </div>
        {isExpiringSoon && (
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${getPlanColor(plan.nombre)} text-white`}>
              <PlanIcon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{plan.nombre}</CardTitle>
              <CardDescription>{plan.descripcion}</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={isActive ? "default" : "destructive"}>
              {isActive ? "Activo" : suscripcion.estado}
            </Badge>
            <p className="text-sm text-gray-500 mt-1">
              ${plan.precio_mensual}/mes
            </p>
          </div>
        </div>
        
        {isExpiringSoon && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Plan próximo a vencer</span>
            </div>
            <p className="text-sm text-orange-600 mt-1">
              Tu suscripción vence el {new Date(suscripcion.fecha_fin!).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Límites de uso */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">Uso de Recursos</h4>
          
          {/* Productos */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Productos</span>
              <span className="text-gray-500">
                {limites.max_productos > 0 
                  ? `${uso_actual.productos_actuales} / ${limites.max_productos}`
                  : `${uso_actual.productos_actuales} (Ilimitado)`
                }
              </span>
            </div>
            {limites.max_productos > 0 && (
              <Progress 
                value={(uso_actual.productos_actuales / limites.max_productos) * 100} 
                className="h-2"
              />
            )}
          </div>

          {/* Usuarios */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usuarios</span>
              <span className="text-gray-500">
                {limites.max_usuarios > 0 
                  ? `${uso_actual.usuarios_actuales} / ${limites.max_usuarios}`
                  : `${uso_actual.usuarios_actuales} (Ilimitado)`
                }
              </span>
            </div>
            {limites.max_usuarios > 0 && (
              <Progress 
                value={(uso_actual.usuarios_actuales / limites.max_usuarios) * 100} 
                className="h-2"
              />
            )}
          </div>

          {/* Sucursales */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sucursales</span>
              <span className="text-gray-500">
                {limites.max_sucursales > 0 
                  ? `${uso_actual.sucursales_actuales} / ${limites.max_sucursales}`
                  : `${uso_actual.sucursales_actuales} (Ilimitado)`
                }
              </span>
            </div>
            {limites.max_sucursales > 0 && (
              <Progress 
                value={(uso_actual.sucursales_actuales / limites.max_sucursales) * 100} 
                className="h-2"
              />
            )}
          </div>

          {/* Transacciones del mes */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Transacciones (mes)</span>
              <span className="text-gray-500">
                {limites.max_transacciones_mes > 0 
                  ? `${uso_actual.transacciones_mes_actual} / ${limites.max_transacciones_mes}`
                  : `${uso_actual.transacciones_mes_actual} (Ilimitado)`
                }
              </span>
            </div>
            {limites.max_transacciones_mes > 0 && (
              <Progress 
                value={(uso_actual.transacciones_mes_actual / limites.max_transacciones_mes) * 100} 
                className="h-2"
              />
            )}
          </div>
        </div>

        {/* Información de contacto para upgrade */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h5 className="font-medium text-sm text-blue-900 mb-2">¿Necesitas más recursos?</h5>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
              <Phone className="h-4 w-4 mr-2" />
              69512310
            </Button>
            <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
              <Mail className="h-4 w-4 mr-2" />
              Contactar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanInfo;
