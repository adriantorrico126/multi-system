import { useState, useEffect } from 'react';

export interface MobileInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'landscape' | 'portrait';
  userAgent: string;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  hasTouch: boolean;
  isStandalone: boolean;
}

export function useMobile(): MobileInfo {
  const [mobileInfo, setMobileInfo] = useState<MobileInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLandscape: false,
    isPortrait: false,
    screenWidth: 0,
    screenHeight: 0,
    orientation: 'portrait',
    userAgent: '',
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    isEdge: false,
    hasTouch: false,
    isStandalone: false,
  });

  useEffect(() => {
    const updateMobileInfo = () => {
      const userAgent = navigator.userAgent;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Detectar orientación
      const isLandscape = screenWidth > screenHeight;
      const isPortrait = screenWidth <= screenHeight;
      
      // Detectar dispositivo móvil
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || screenWidth <= 768;
      const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent) || (screenWidth > 768 && screenWidth <= 1024);
      const isDesktop = !isMobile && !isTablet;
      
      // Detectar navegadores
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
      const isFirefox = /Firefox/.test(userAgent);
      const isEdge = /Edge/.test(userAgent);
      
      // Detectar capacidades táctiles
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Detectar si es PWA standalone
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;

      setMobileInfo({
        isMobile,
        isTablet,
        isDesktop,
        isLandscape,
        isPortrait,
        screenWidth,
        screenHeight,
        orientation: isLandscape ? 'landscape' : 'portrait',
        userAgent,
        isIOS,
        isAndroid,
        isSafari,
        isChrome,
        isFirefox,
        isEdge,
        hasTouch,
        isStandalone,
      });
    };

    // Actualizar información inicial
    updateMobileInfo();

    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', updateMobileInfo);
    window.addEventListener('orientationchange', updateMobileInfo);

    return () => {
      window.removeEventListener('resize', updateMobileInfo);
      window.removeEventListener('orientationchange', updateMobileInfo);
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
    isSmallScreen: mobileInfo.screenWidth < 640, // Assuming breakpoints.sm is 640
    isMediumScreen: mobileInfo.screenWidth >= 640 && mobileInfo.screenWidth < 1024, // Assuming breakpoints.lg is 1024
    isLargeScreen: mobileInfo.screenWidth >= 1024, // Assuming breakpoints.lg is 1024
    // Clases CSS útiles
    cssClasses: {
      'mobile-device': mobileInfo.isMobile,
      'tablet-device': mobileInfo.isTablet,
      'desktop-device': mobileInfo.isDesktop,
      'touch-device': mobileInfo.hasTouch,
      'portrait': mobileInfo.isPortrait,
      'landscape': mobileInfo.isLandscape,
      // Assuming screenSize is derived from screenWidth, but not directly exposed in useMobile
      // For now, we'll just include the boolean flags
    }
  };
}
