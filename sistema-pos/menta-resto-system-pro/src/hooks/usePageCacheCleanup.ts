import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clearAllCache, clearAuthCache, clearPlanCache, smartCacheCleanup } from '../utils/cacheCleanup';

/**
 * Hook para manejar la limpieza de caché al actualizar la página o cerrar sesión
 * Especialmente útil para móviles donde la limpieza de caché es más crítica
 */
export const usePageCacheCleanup = () => {
  const queryClient = useQueryClient();

  /**
   * Limpieza completa de caché
   */
  const performFullCleanup = useCallback(() => {
    console.log('🧹 [usePageCacheCleanup] Realizando limpieza completa de caché...');
    
    // 1. Limpiar React Query cache
    queryClient.clear();
    console.log('✅ [usePageCacheCleanup] React Query cache limpiado');
    
    // 2. Limpiar caché del navegador
    clearAllCache();
    console.log('✅ [usePageCacheCleanup] Caché del navegador limpiado');
  }, [queryClient]);

  /**
   * Limpieza suave de caché (solo datos críticos, SIN autenticación)
   */
  const performSoftCleanup = useCallback(() => {
    console.log('🧹 [usePageCacheCleanup] Realizando limpieza suave de caché...');
    
    // 1. Limpiar caché de planes (crítico para móviles)
    clearPlanCache();
    console.log('✅ [usePageCacheCleanup] Caché de planes limpiado');
    
    // 2. NO limpiar caché de autenticación para evitar 401 errors
    // clearAuthCache(); // COMENTADO: No limpiar auth en eventos de visibilidad
    
    // 3. Invalidar queries críticas
    queryClient.invalidateQueries({ queryKey: ['plan'] });
    queryClient.invalidateQueries({ queryKey: ['suscripcion'] });
    queryClient.invalidateQueries({ queryKey: ['contadores'] });
    console.log('✅ [usePageCacheCleanup] Queries críticas invalidadas');
  }, [queryClient]);

  /**
   * Detectar si es un dispositivo móvil
   */
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }, []);

  /**
   * Manejar evento beforeunload (antes de cerrar/actualizar página)
   */
  const handleBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
    console.log('🔄 [usePageCacheCleanup] Página se está cerrando/actualizando...');
    
    // En móviles, hacer limpieza más agresiva
    if (isMobile()) {
      console.log('📱 [usePageCacheCleanup] Dispositivo móvil detectado - limpieza agresiva');
      performFullCleanup();
    } else {
      console.log('💻 [usePageCacheCleanup] Dispositivo de escritorio - limpieza suave');
      performSoftCleanup();
    }
    
    // Marcar que se está cerrando la página
    sessionStorage.setItem('pageClosing', 'true');
  }, [isMobile, performFullCleanup, performSoftCleanup]);

  /**
   * Manejar evento pagehide (página oculta)
   */
  const handlePageHide = useCallback((event: PageTransitionEvent) => {
    console.log('👁️ [usePageCacheCleanup] Página oculta...');
    
    // Si la página se está cerrando permanentemente
    if (event.persisted === false) {
      console.log('🚪 [usePageCacheCleanup] Página cerrada permanentemente');
      performSoftCleanup();
    }
  }, [performSoftCleanup]);

  /**
   * Manejar evento visibilitychange (cambio de visibilidad)
   */
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      console.log('👁️ [usePageCacheCleanup] Página oculta - NO limpiando caché para preservar autenticación');
      // NO ejecutar performSoftCleanup() para evitar limpiar el token
    } else if (document.visibilityState === 'visible') {
      console.log('👁️ [usePageCacheCleanup] Página visible - verificando caché');
      
      // Solo invalidar queries sin limpiar caché de autenticación
      queryClient.invalidateQueries({ queryKey: ['plan'] });
      queryClient.invalidateQueries({ queryKey: ['suscripcion'] });
      queryClient.invalidateQueries({ queryKey: ['contadores'] });
      
      const pageClosing = sessionStorage.getItem('pageClosing');
      if (pageClosing === 'true') {
        sessionStorage.removeItem('pageClosing');
      }
    }
  }, [queryClient]);

  /**
   * Manejar evento focus (ventana enfocada)
   */
  const handleFocus = useCallback(() => {
    console.log('🎯 [usePageCacheCleanup] Ventana enfocada');
    
    // Solo invalidar queries sin limpiar caché de autenticación
    queryClient.invalidateQueries({ queryKey: ['plan'] });
    queryClient.invalidateQueries({ queryKey: ['suscripcion'] });
    queryClient.invalidateQueries({ queryKey: ['contadores'] });
    
    const pageClosing = sessionStorage.getItem('pageClosing');
    if (pageClosing === 'true') {
      sessionStorage.removeItem('pageClosing');
    }
  }, [queryClient]);

  /**
   * Configurar event listeners
   */
  useEffect(() => {
    console.log('🔧 [usePageCacheCleanup] Configurando event listeners...');
    
    // Eventos de cierre/actualización de página
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    // Eventos de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Eventos de focus
    window.addEventListener('focus', handleFocus);
    
    // Cleanup
    return () => {
      console.log('🧹 [usePageCacheCleanup] Limpiando event listeners...');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [handleBeforeUnload, handlePageHide, handleVisibilityChange, handleFocus]);

  /**
   * Limpieza manual
   */
  const manualCleanup = useCallback((type: 'full' | 'soft' = 'soft') => {
    console.log(`🧹 [usePageCacheCleanup] Limpieza manual: ${type}`);
    
    if (type === 'full') {
      performFullCleanup();
    } else {
      performSoftCleanup();
    }
  }, [performFullCleanup, performSoftCleanup]);

  return {
    manualCleanup,
    performFullCleanup,
    performSoftCleanup,
    isMobile: isMobile()
  };
};
