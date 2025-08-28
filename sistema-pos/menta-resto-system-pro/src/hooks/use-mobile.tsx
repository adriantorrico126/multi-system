import { useState, useEffect } from 'react';

interface MobileInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isTouch: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean; // PWA instalada
  viewportHeight: number;
  viewportWidth: number;
  pixelRatio: number;
}

const breakpoints = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useMobile(): MobileInfo {
  const [mobileInfo, setMobileInfo] = useState<MobileInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    orientation: 'portrait',
    screenSize: 'md',
    isTouch: false,
    isIOS: false,
    isAndroid: false,
    isStandalone: false,
    viewportHeight: 0,
    viewportWidth: 0,
    pixelRatio: 1,
  });

  useEffect(() => {
    const updateMobileInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Detección de dispositivo
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Detección de tamaño de pantalla
      let screenSize: MobileInfo['screenSize'] = 'md';
      if (width < breakpoints.xs) screenSize = 'xs';
      else if (width < breakpoints.sm) screenSize = 'sm';
      else if (width < breakpoints.md) screenSize = 'md';
      else if (width < breakpoints.lg) screenSize = 'lg';
      else if (width < breakpoints.xl) screenSize = 'xl';
      else screenSize = '2xl';
      
      // Clasificación de dispositivo
      const isMobile = width < breakpoints.md && isTouch;
      const isTablet = width >= breakpoints.md && width < breakpoints.lg && isTouch;
      const isDesktop = width >= breakpoints.lg || !isTouch;
      
      // Orientación
      const orientation: 'portrait' | 'landscape' = width > height ? 'landscape' : 'portrait';
      
      // PWA standalone
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      
      // Pixel ratio para pantallas de alta densidad
      const pixelRatio = window.devicePixelRatio || 1;
      
      setMobileInfo({
        isMobile,
        isTablet,
        isDesktop,
        orientation,
        screenSize,
        isTouch,
        isIOS,
        isAndroid,
        isStandalone,
        viewportHeight: height,
        viewportWidth: width,
        pixelRatio,
      });
    };

    // Actualizar al montar y al cambiar tamaño
    updateMobileInfo();
    window.addEventListener('resize', updateMobileInfo);
    window.addEventListener('orientationchange', updateMobileInfo);
    
    // Observar cambios en la orientación
    const mediaQuery = window.matchMedia('(orientation: portrait)');
    mediaQuery.addEventListener('change', updateMobileInfo);

    return () => {
      window.removeEventListener('resize', updateMobileInfo);
      window.removeEventListener('orientationchange', updateMobileInfo);
      mediaQuery.removeEventListener('change', updateMobileInfo);
    };
  }, []);

  return mobileInfo;
}

// Hook específico para orientación mejorado
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const newOrientation = width > height ? 'landscape' : 'portrait';
      const newIsMobile = width <= 768;
      
      setOrientation(newOrientation);
      setIsMobile(newIsMobile);
      
      // Agregar clase al body para estilos CSS
      if (newIsMobile) {
        document.body.classList.add('mobile-device');
      } else {
        document.body.classList.remove('mobile-device');
      }
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
}

// Hook para PWA
export function usePWA() {
  const [isPWA, setIsPWA] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      setIsPWA(isStandalone);
    };

    const checkInstallable = () => {
      const isInstallable = 'serviceWorker' in navigator && 'PushManager' in window;
      setCanInstall(isInstallable);
    };

    checkPWA();
    checkInstallable();
  }, []);

  return { isPWA, canInstall };
}

// Hook para detectar si el usuario está en móvil
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const isMobileDevice = width <= 768;
      setIsMobile(isMobileDevice);
      
      // Agregar clase al body
      if (isMobileDevice) {
        document.body.classList.add('mobile-device');
      } else {
        document.body.classList.remove('mobile-device');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  return isMobile;
}
