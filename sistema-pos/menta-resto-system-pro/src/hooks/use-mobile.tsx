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
  deviceType: 'mobile' | 'tablet' | 'desktop';
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
    deviceType: 'desktop',
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
      
      // Clasificación de dispositivo mejorada
      let isMobile = false;
      let isTablet = false;
      let isDesktop = false;
      let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      
      if (width < breakpoints.md) {
        isMobile = true;
        deviceType = 'mobile';
      } else if (width < breakpoints.lg) {
        isTablet = true;
        deviceType = 'tablet';
      } else {
        isDesktop = true;
        deviceType = 'desktop';
      }
      
      // Orientación
      const orientation: 'portrait' | 'landscape' = width > height ? 'landscape' : 'portrait';
      
      // PWA standalone
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      
      // Pixel ratio para pantallas de alta densidad
      const pixelRatio = window.devicePixelRatio || 1;
      
      const newMobileInfo = {
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
        deviceType,
      };

      setMobileInfo(newMobileInfo);

      // Aplicar clases CSS automáticamente - DESACTIVADO
      // updateBodyClasses(newMobileInfo);
    };

    // const updateBodyClasses = (info: MobileInfo) => {
    //   // Remover clases anteriores
    //   document.body.classList.remove('mobile-device', 'tablet-device', 'desktop-device');
    //   
    //   // Agregar clase según tipo de dispositivo
    //   if (info.isMobile) {
    //     document.body.classList.add('mobile-device');
    //   } else if (info.isTablet) {
    //     document.body.classList.add('tablet-device');
    //   } else {
    //     document.body.classList.add('desktop-device');
    //   }
    //   
    //   // Agregar clase de orientación
    //   document.body.classList.remove('portrait', 'landscape');
    //   document.body.classList.add(info.orientation);
    //   
    //   // Agregar clase de tamaño de pantalla
    //   document.body.classList.remove('xs', 'sm', 'md', 'lg', 'xl', '2xl');
    //   document.body.classList.add(info.screenSize);
    //   
    //   // Agregar clase de touch
    //   if (info.isTouch) {
    //     document.body.classList.add('touch-device');
    //   } else {
    //     document.body.classList.remove('touch-device');
    //   }
    // };

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

// Hook para obtener información completa del dispositivo
export function useDeviceInfo() {
  const mobileInfo = useMobile();
  
  return {
    ...mobileInfo,
    // Utilidades adicionales
    isSmallScreen: mobileInfo.viewportWidth < breakpoints.sm,
    isMediumScreen: mobileInfo.viewportWidth >= breakpoints.sm && mobileInfo.viewportWidth < breakpoints.lg,
    isLargeScreen: mobileInfo.viewportWidth >= breakpoints.lg,
    // Clases CSS útiles
    cssClasses: {
      'mobile-device': mobileInfo.isMobile,
      'tablet-device': mobileInfo.isTablet,
      'desktop-device': mobileInfo.isDesktop,
      'touch-device': mobileInfo.isTouch,
      'portrait': mobileInfo.orientation === 'portrait',
      'landscape': mobileInfo.orientation === 'landscape',
      [mobileInfo.screenSize]: true,
    }
  };
}
