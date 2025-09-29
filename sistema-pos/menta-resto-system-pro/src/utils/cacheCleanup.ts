// =====================================================
// UTILIDAD DE LIMPIEZA DE CACHÉ
// =====================================================

/**
 * Limpia todo el caché del navegador y datos obsoletos
 * Se ejecuta automáticamente al iniciar sesión
 */
export const clearAllCache = (): void => {
  console.log('🧹 [CacheCleanup] Iniciando limpieza completa de caché...');
  
  try {
    // =====================================================
    // LIMPIAR LOCALSTORAGE
    // =====================================================
    const keysToKeep = [
      'theme', // Mantener preferencias de tema
      'language', // Mantener idioma
      'lastLoginAttempt' // Mantener intento de login para evitar spam
    ];
    
    const allKeys = Object.keys(localStorage);
    let removedCount = 0;
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
        removedCount++;
      }
    });
    
    console.log(`🧹 [CacheCleanup] Eliminados ${removedCount} elementos de localStorage`);
    
    // =====================================================
    // LIMPIAR SESSIONSTORAGE
    // =====================================================
    const sessionKeys = Object.keys(sessionStorage);
    sessionStorage.clear();
    console.log(`🧹 [CacheCleanup] Eliminados ${sessionKeys.length} elementos de sessionStorage`);
    
    // =====================================================
    // LIMPIAR CACHÉ DE NAVEGADOR (si está disponible)
    // =====================================================
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
        console.log(`🧹 [CacheCleanup] Eliminadas ${cacheNames.length} cachés del navegador`);
      }).catch(error => {
        console.warn('⚠️ [CacheCleanup] No se pudieron eliminar las cachés del navegador:', error);
      });
    }
    
    // =====================================================
    // LIMPIAR DATOS DE INDEXEDDB (si está disponible)
    // =====================================================
    if ('indexedDB' in window) {
      try {
        // Intentar limpiar IndexedDB
        const deleteReq = indexedDB.deleteDatabase('pos-cache');
        deleteReq.onsuccess = () => {
          console.log('🧹 [CacheCleanup] IndexedDB limpiado exitosamente');
        };
        deleteReq.onerror = () => {
          console.warn('⚠️ [CacheCleanup] No se pudo limpiar IndexedDB');
        };
      } catch (error) {
        console.warn('⚠️ [CacheCleanup] Error al limpiar IndexedDB:', error);
      }
    }
    
    // =====================================================
    // LIMPIAR COOKIES (solo las relacionadas con la app)
    // =====================================================
    const cookiesToRemove = [
      'jwtToken',
      'sessionToken',
      'userSession',
      'restaurantSession'
    ];
    
    cookiesToRemove.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    });
    
    console.log(`🧹 [CacheCleanup] Eliminadas ${cookiesToRemove.length} cookies`);
    
    // =====================================================
    // REGISTRAR LIMPIEZA
    // =====================================================
    const cleanupTimestamp = new Date().toISOString();
    localStorage.setItem('lastCacheCleanup', cleanupTimestamp);
    
    console.log('✅ [CacheCleanup] Limpieza de caché completada exitosamente');
    console.log(`📅 [CacheCleanup] Timestamp: ${cleanupTimestamp}`);
    
  } catch (error) {
    console.error('❌ [CacheCleanup] Error durante la limpieza de caché:', error);
  }
};

/**
 * Limpia solo los datos de autenticación
 * Útil para logout o renovación de tokens
 */
export const clearAuthCache = (): void => {
  console.log('🔐 [CacheCleanup] Limpiando datos de autenticación...');
  
  const authKeys = [
    'jwtToken',
    'currentUser',
    'selectedSucursalId',
    'selectedBranch',
    'restaurantConfig',
    'userSession',
    'authToken'
  ];
  
  authKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  console.log('✅ [CacheCleanup] Datos de autenticación limpiados');
};

/**
 * Verifica si es necesario limpiar el caché
 * Basado en la última limpieza y tiempo transcurrido
 */
export const shouldCleanCache = (): boolean => {
  const lastCleanup = localStorage.getItem('lastCacheCleanup');
  
  if (!lastCleanup) {
    return true; // Primera vez, limpiar
  }
  
  const lastCleanupDate = new Date(lastCleanup);
  const now = new Date();
  const hoursSinceLastCleanup = (now.getTime() - lastCleanupDate.getTime()) / (1000 * 60 * 60);
  
  // Limpiar si han pasado más de 24 horas
  return hoursSinceLastCleanup > 24;
};

/**
 * Limpia el caché de manera inteligente
 * Solo limpia si es necesario o si se fuerza
 */
export const smartCacheCleanup = (force: boolean = false): void => {
  if (force || shouldCleanCache()) {
    clearAllCache();
  } else {
    console.log('ℹ️ [CacheCleanup] No es necesario limpiar el caché en este momento');
  }
};

/**
 * Limpieza suave - solo datos de autenticación y planes
 * Menos agresiva que la limpieza completa
 */
export const softCacheCleanup = (): void => {
  console.log('🧹 [CacheCleanup] Iniciando limpieza suave de caché...');
  
  try {
    // Solo limpiar datos de autenticación y planes
    clearAuthCache();
    clearPlanCache();
    
    // Limpiar algunos datos específicos que pueden causar problemas
    const problematicKeys = [
      'cachedApiResponses',
      'oldUserData',
      'stalePlanData',
      'expiredTokens'
    ];
    
    problematicKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    const cleanupTimestamp = new Date().toISOString();
    localStorage.setItem('lastSoftCleanup', cleanupTimestamp);
    
    console.log('✅ [CacheCleanup] Limpieza suave completada');
    
  } catch (error) {
    console.error('❌ [CacheCleanup] Error durante la limpieza suave:', error);
  }
};

/**
 * Verifica si es necesario hacer limpieza suave
 * Basado en errores recientes o cambios de versión
 */
export const shouldSoftCleanup = (): boolean => {
  const lastSoftCleanup = localStorage.getItem('lastSoftCleanup');
  const lastError = localStorage.getItem('lastApiError');
  
  if (!lastSoftCleanup) {
    return true; // Primera vez
  }
  
  // Si hubo un error reciente, hacer limpieza suave
  if (lastError) {
    const errorTime = new Date(lastError);
    const now = new Date();
    const hoursSinceError = (now.getTime() - errorTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceError < 1) { // Error en la última hora
      return true;
    }
  }
  
  return false;
};

/**
 * Limpia el caché específico de planes y suscripciones
 * Útil cuando se actualiza la información del plan
 */
export const clearPlanCache = (): void => {
  console.log('📋 [CacheCleanup] Limpiando caché de planes...');
  
  const planKeys = [
    'currentPlan',
    'planFeatures',
    'subscriptionData',
    'planLimits',
    'usageCounters'
  ];
  
  planKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  console.log('✅ [CacheCleanup] Caché de planes limpiado');
};

/**
 * Obtiene información sobre el estado del caché
 */
export const getCacheInfo = () => {
  const localStorageSize = JSON.stringify(localStorage).length;
  const sessionStorageSize = JSON.stringify(sessionStorage).length;
  const lastCleanup = localStorage.getItem('lastCacheCleanup');
  
  return {
    localStorageSize,
    sessionStorageSize,
    lastCleanup,
    shouldClean: shouldCleanCache()
  };
};
