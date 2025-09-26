import React from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Crown, AlertTriangle, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ProfessionalRestrictionMessage = () => {
  const { toast } = useToast();

  return (
    <div className="flex-1 p-6">
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border border-amber-200 rounded-2xl shadow-xl p-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center space-x-3">
            <Lock className="h-12 w-12 text-amber-600" />
            <AlertTriangle className="h-12 w-12 text-orange-600" />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">
              Funciones Avanzadas No Disponibles
            </h3>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Las funciones avanzadas de exportación y análisis de ventas no están disponibles en tu plan actual.
            </p>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Para acceder a estas características profesionales, necesitas actualizar tu plan a un nivel superior.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-amber-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Funciones que incluye el plan avanzado:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Exportación avanzada a Excel</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Exportación avanzada a PDF</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Filtros complejos de ventas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Análisis de tendencias</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Comparativas por período</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Reportes personalizados</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">
              ¿Necesitas ayuda para actualizar tu plan?
            </h4>
            <p className="text-blue-800 mb-4">
              Nuestro equipo de soporte está disponible para ayudarte a elegir el plan perfecto para tu negocio.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2 text-blue-700">
                <Phone className="h-5 w-5" />
                <span className="font-semibold">69512310</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-700">
                <Mail className="h-5 w-5" />
                <span className="font-semibold">forkasbib@gmail.com</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold"
              onClick={() => {
                toast({
                  title: "Información de contacto",
                  description: "Teléfono: 69512310 | Email: forkasbib@gmail.com",
                  duration: 5000,
                });
              }}
            >
              <Crown className="h-5 w-5 mr-2" />
              Contactar Soporte
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
