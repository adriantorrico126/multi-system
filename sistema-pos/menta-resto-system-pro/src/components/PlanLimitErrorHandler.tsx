import React, { useEffect, useState } from 'react';
import { AlertCircle, Phone, Mail, Crown, ArrowUp } from 'lucide-react';

const PlanLimitErrorHandler = ({ error, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
    }
  }, [error]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible || !error) return null;

  const getPlanIcon = (planName) => {
    const icons = {
      'basico': '🥉',
      'profesional': '🥈', 
      'avanzado': '🥇',
      'enterprise': '👑'
    };
    return icons[planName?.toLowerCase()] || '📋';
  };

  const getPlanColor = (planName) => {
    const colors = {
      'basico': 'text-gray-600',
      'profesional': 'text-blue-600',
      'avanzado': 'text-purple-600', 
      'enterprise': 'text-yellow-600'
    };
    return colors[planName?.toLowerCase()] || 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
            <Crown className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {error.error || 'Funcionalidad Premium'}
          </h2>
          <p className="text-white/90 text-sm">
            Descubre las ventajas de nuestros planes superiores
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium text-sm">
                  {error.message}
                </p>
              </div>
            </div>
          </div>

          {/* Plan Comparison */}
          {error.currentPlan && error.requiredPlan && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-gray-800 text-center mb-3">
                Comparación de Planes
              </h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getPlanIcon(error.currentPlan)}</span>
                  <span className={`font-medium ${getPlanColor(error.currentPlan)}`}>
                    Plan {error.currentPlan}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-gray-500">
                  <span className="text-xs">Actual</span>
                  <ArrowUp className="w-3 h-3" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getPlanIcon(error.requiredPlan)}</span>
                  <span className={`font-medium ${getPlanColor(error.requiredPlan)}`}>
                    Plan {error.requiredPlan}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-green-600">
                  <span className="text-xs">Requerido</span>
                  <Crown className="w-3 h-3" />
                </div>
              </div>
            </div>
          )}

          {/* Usage Info */}
          {error.currentUsage && error.limit && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">
                Uso Actual de Recursos
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Uso actual:</span>
                  <span className="font-medium text-blue-800">{error.currentUsage}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Límite del plan:</span>
                  <span className="font-medium text-blue-800">{error.limit}</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${Math.min((error.currentUsage / error.limit) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-gray-800 mb-3 text-center">
              ¿Interesado en actualizar?
            </h4>
            
            {error.upgradeMessage && (
              <p className="text-sm text-gray-600 text-center mb-4">
                {error.upgradeMessage}
              </p>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-3">
                <Phone className="w-4 h-4 text-green-600" />
                <a 
                  href={`tel:${error.contactInfo?.phone || '69512310'}`}
                  className="text-green-700 font-medium hover:text-green-800 transition-colors text-sm"
                >
                  {error.contactInfo?.phone || '69512310'}
                </a>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <Mail className="w-4 h-4 text-green-600" />
                <a 
                  href={`mailto:${error.contactInfo?.email || 'forkasbib@gmail.com'}?subject=Solicitud de actualización de plan&body=Hola, me interesa actualizar mi plan para acceder a funcionalidades adicionales. Mi plan actual es ${error.currentPlan || 'actual'}.`}
                  className="text-green-700 font-medium hover:text-green-800 transition-colors text-sm"
                >
                  {error.contactInfo?.email || 'forkasbib@gmail.com'}
                </a>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-3">
              Nuestro equipo de soporte te ayudará a encontrar el plan perfecto para tu negocio
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-center space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
          >
            Entendido
          </button>
          <button
            onClick={() => window.open(`mailto:${error.contactInfo?.email || 'forkasbib@gmail.com'}?subject=Solicitud de actualización de plan&body=Hola, me interesa actualizar mi plan para acceder a la funcionalidad "${error.featureName || 'solicitada'}". Mi plan actual es ${error.currentPlan || 'actual'}.`)}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all text-sm font-medium"
          >
            Contactar Ahora
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanLimitErrorHandler;
