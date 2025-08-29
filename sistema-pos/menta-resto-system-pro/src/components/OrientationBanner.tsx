import React, { useState, useEffect } from 'react';
import { useOrientation } from '@/hooks/use-mobile';
import { FaMobile, FaRedo, FaTablet, FaTimes } from 'react-icons/fa';
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
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Solo mostrar en dispositivos móviles
  const isMobile = window.innerWidth <= 768;
  
  useEffect(() => {
    // Solo mostrar el banner cuando sea necesario y en móviles
    const shouldShowBanner = isMobile && !isDismissed && (
      (orientation === 'landscape' && showOnLandscape) ||
      (orientation === 'portrait' && showOnPortrait)
    );
    
    setIsVisible(shouldShowBanner);
  }, [orientation, showOnLandscape, showOnPortrait, isMobile, isDismissed]);

  // Si no es móvil o no debe mostrarse, renderizar children directamente
  if (!isMobile || !isVisible) {
    return <>{children}</>;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    // Guardar en localStorage para recordar la preferencia
    localStorage.setItem('orientationBannerDismissed', 'true');
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <>
      {/* Banner de orientación */}
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full text-center relative">
          {/* Botón de cerrar */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar banner"
          >
            <FaTimes className="h-5 w-5" />
          </button>

          {/* Icono animado */}
          <div className="mb-4 flex justify-center">
            <div className="relative">
              {orientation === 'landscape' ? (
                <FaMobile className="text-5xl text-blue-600 animate-bounce" />
              ) : (
                <FaTablet className="text-5xl text-purple-600 animate-pulse" />
              )}
              <FaRedo className="absolute -top-1 -right-1 text-xl text-orange-500 animate-spin" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-xl font-bold text-gray-800 mb-3">
            {orientation === 'landscape' 
              ? 'Gira tu dispositivo' 
              : 'Orientación recomendada'
            }
          </h1>

          {/* Mensaje */}
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {orientation === 'landscape' 
              ? 'Para una mejor experiencia, gira tu dispositivo a modo vertical.'
              : 'El sistema POS funciona mejor en modo vertical.'
            }
          </p>

          {/* Indicador visual */}
          <div className="mb-4 flex justify-center">
            <div className={`w-12 h-16 border-3 rounded-lg flex items-center justify-center transition-all duration-500 ${
              orientation === 'landscape' 
                ? 'border-orange-400 bg-orange-50' 
                : 'border-green-400 bg-green-50'
            }`}>
              <div className={`w-1.5 h-6 bg-current rounded-full transition-all duration-500 ${
                orientation === 'landscape' ? 'rotate-90' : ''
              }`} />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-2">
            <Button 
              onClick={handleReload}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <FaRedo className="mr-2 h-4 w-4" />
              Recargar después de girar
            </Button>
            
            <Button 
              onClick={handleDismiss}
              variant="outline"
              className="w-full text-gray-600 hover:text-gray-800"
            >
              Continuar así
            </Button>
          </div>

          {/* Información adicional */}
          <div className="mt-4 text-xs text-gray-500">
            <p className="flex items-center justify-center gap-1 mb-1">
              <span className="text-yellow-500">💡</span>
              Bloquea la orientación en tu dispositivo
            </p>
            <p className="flex items-center justify-center gap-1">
              <span className="text-purple-500">📱</span>
              Optimizado para móviles
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      {children}
    </>
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

// Componente que solo se muestra en móviles
export function MobileOnlyBanner({ children }: { children: React.ReactNode }) {
  const isMobile = window.innerWidth <= 768;
  
  if (!isMobile) {
    return <>{children}</>;
  }
  
  return (
    <OrientationBanner showOnLandscape={true} showOnPortrait={false}>
      {children}
    </OrientationBanner>
  );
}



// Fix: Icono corregido para Vercel build
