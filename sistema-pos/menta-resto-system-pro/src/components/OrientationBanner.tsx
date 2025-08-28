import React from 'react';
import { useOrientation } from '@/hooks/use-mobile';
import { FaMobile, FaRotateLeft, FaTablet } from 'react-icons/fa';
import { Button } from '@/components/ui/button';

interface OrientationBannerProps {
  children: React.ReactNode;
  showOnLandscape?: boolean;
  showOnPortrait?: boolean;
  className?: string;
}

export function OrientationBanner({ 
  children, 
  showOnLandscape = true, 
  showOnPortrait = false,
  className = '' 
}: OrientationBannerProps) {
  const orientation = useOrientation();
  
  // Solo mostrar el banner cuando sea necesario
  const shouldShowBanner = 
    (orientation === 'landscape' && showOnLandscape) ||
    (orientation === 'portrait' && showOnPortrait);

  if (!shouldShowBanner) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Icono animado */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            {orientation === 'landscape' ? (
              <FaMobile className="text-6xl text-blue-600 animate-bounce" />
            ) : (
              <FaTablet className="text-6xl text-purple-600 animate-pulse" />
            )}
            <FaRotateLeft className="absolute -top-2 -right-2 text-2xl text-orange-500 animate-spin" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {orientation === 'landscape' 
            ? 'Gira tu dispositivo' 
            : 'Orientación recomendada'
          }
        </h1>

        {/* Mensaje */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {orientation === 'landscape' 
            ? 'Para una mejor experiencia, gira tu dispositivo a modo vertical (portrait). El sistema POS está optimizado para esta orientación.'
            : 'El sistema POS funciona mejor en modo vertical. Mantén tu dispositivo en esta posición.'
          }
        </p>

        {/* Indicador visual */}
        <div className="mb-6 flex justify-center">
          <div className={`w-16 h-24 border-4 rounded-lg flex items-center justify-center transition-all duration-500 ${
            orientation === 'landscape' 
              ? 'border-orange-400 bg-orange-50' 
              : 'border-green-400 bg-green-50'
          }`}>
            <div className={`w-2 h-8 bg-current rounded-full transition-all duration-500 ${
              orientation === 'landscape' ? 'rotate-90' : ''
            }`} />
          </div>
        </div>

        {/* Botón de acción */}
        <Button 
          onClick={() => window.location.reload()}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <FaRotateLeft className="mr-2" />
          Recargar después de girar
        </Button>

        {/* Información adicional */}
        <div className="mt-6 text-xs text-gray-500">
          <p>💡 Consejo: Bloquea la orientación en tu dispositivo</p>
          <p>📱 Optimizado para móviles y tablets</p>
        </div>
      </div>
    </div>
  );
}

// Componente específico para POS móvil
export function POSMobileBanner({ children }: { children: React.ReactNode }) {
  return (
    <OrientationBanner showOnLandscape={true} showOnPortrait={false}>
      {children}
    </OrientationBanner>
  );
}

// Componente para mostrar en ambas orientaciones
export function ResponsiveBanner({ children }: { children: React.ReactNode }) {
  return (
    <OrientationBanner showOnLandscape={true} showOnPortrait={true}>
      {children}
    </OrientationBanner>
  );
}


