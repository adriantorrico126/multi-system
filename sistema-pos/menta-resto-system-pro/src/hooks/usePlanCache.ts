import { useCallback } from 'react';
import { clearPlanCache, smartCacheCleanup } from '../utils/cacheCleanup';

/**
 * Hook para manejar la limpieza de caché relacionada con planes
 */
export const usePlanCache = () => {
  
  /**
   * Limpia el caché de planes cuando se actualiza la información
   */
  const clearPlanData = useCallback(() => {
    console.log('📋 [usePlanCache] Limpiando caché de planes...');
    clearPlanCache();
  }, []);

  /**
   * Limpia todo el caché cuando hay cambios importantes en el plan
   */
  const clearAllCache = useCallback(() => {
    console.log('🧹 [usePlanCache] Limpiando todo el caché...');
    smartCacheCleanup(true);
  }, []);

  /**
   * Limpia el caché de planes y recarga la página
   * Útil cuando se actualiza el plan del usuario
   */
  const refreshPlanData = useCallback(() => {
    console.log('🔄 [usePlanCache] Refrescando datos del plan...');
    clearPlanCache();
    
    // Recargar la página para obtener datos frescos
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }, []);

  return {
    clearPlanData,
    clearAllCache,
    refreshPlanData
  };
};
