// Service Worker Unregister Script
// Este archivo previene el uso de Service Workers que pueden causar problemas de caché

(function() {
  'use strict';
  
  // Verificar si el navegador soporta service workers
  if ('serviceWorker' in navigator) {
    // Obtener todos los registros de service workers
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      console.log('🧹 Encontrados', registrations.length, 'service workers registrados');
      
      // Eliminar todos los service workers
      registrations.forEach(function(registration) {
        console.log('🗑️ Eliminando service worker:', registration.scope);
        registration.unregister().then(function(boolean) {
          if (boolean) {
            console.log('✅ Service worker eliminado exitosamente');
          } else {
            console.log('⚠️ El service worker no estaba registrado');
          }
        }).catch(function(error) {
          console.error('❌ Error eliminando service worker:', error);
        });
      });
    }).catch(function(error) {
      console.error('❌ Error obteniendo service workers:', error);
    });
  }
  
  // Limpiar caché del navegador si está disponible
  if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
      console.log('🧹 Encontradas', cacheNames.length, 'caches');
      
      cacheNames.forEach(function(cacheName) {
        console.log('🗑️ Eliminando cache:', cacheName);
        caches.delete(cacheName);
      });
      
      console.log('✅ Todos los caches eliminados');
    }).catch(function(error) {
      console.error('❌ Error limpiando caches:', error);
    });
  }
})();
