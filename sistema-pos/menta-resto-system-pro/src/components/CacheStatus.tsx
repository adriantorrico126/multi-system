import React, { useState, useEffect } from 'react';
import { getCacheInfo, clearAllCache, smartCacheCleanup, softCacheCleanup } from '../utils/cacheCleanup';

interface CacheStatusProps {
  showDetails?: boolean;
  onCacheCleared?: () => void;
}

export const CacheStatus: React.FC<CacheStatusProps> = ({ 
  showDetails = false, 
  onCacheCleared 
}) => {
  const [cacheInfo, setCacheInfo] = useState(getCacheInfo());
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    // Actualizar información del caché cada 30 segundos
    const interval = setInterval(() => {
      setCacheInfo(getCacheInfo());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      clearAllCache();
      setCacheInfo(getCacheInfo());
      onCacheCleared?.();
      
      // Mostrar notificación de éxito
      console.log('✅ Caché limpiado exitosamente');
    } catch (error) {
      console.error('❌ Error al limpiar caché:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleSmartCleanup = async () => {
    setIsClearing(true);
    try {
      smartCacheCleanup(true);
      setCacheInfo(getCacheInfo());
      onCacheCleared?.();
      
      console.log('✅ Limpieza inteligente completada');
    } catch (error) {
      console.error('❌ Error en limpieza inteligente:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleSoftCleanup = async () => {
    setIsClearing(true);
    try {
      softCacheCleanup();
      setCacheInfo(getCacheInfo());
      onCacheCleared?.();
      
      console.log('✅ Limpieza suave completada');
    } catch (error) {
      console.error('❌ Error en limpieza suave:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!showDetails) {
    return (
      <div className="cache-status-minimal">
        <button
          onClick={handleClearCache}
          disabled={isClearing}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          title="Limpiar caché"
        >
          {isClearing ? '🧹' : '🗑️'}
        </button>
      </div>
    );
  }

  return (
    <div className="cache-status-detailed p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Estado del Caché</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-3 rounded">
          <h4 className="font-medium text-gray-700">LocalStorage</h4>
          <p className="text-sm text-gray-600">
            Tamaño: {formatBytes(cacheInfo.localStorageSize)}
          </p>
        </div>
        
        <div className="bg-white p-3 rounded">
          <h4 className="font-medium text-gray-700">SessionStorage</h4>
          <p className="text-sm text-gray-600">
            Tamaño: {formatBytes(cacheInfo.sessionStorageSize)}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Última Limpieza</h4>
        <p className="text-sm text-gray-600">
          {cacheInfo.lastCleanup 
            ? new Date(cacheInfo.lastCleanup).toLocaleString()
            : 'Nunca'
          }
        </p>
        <p className="text-xs text-gray-500">
          {cacheInfo.shouldClean ? '⚠️ Se recomienda limpiar' : '✅ Estado óptimo'}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleSoftCleanup}
          disabled={isClearing}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isClearing ? 'Limpiando...' : 'Limpieza Suave'}
        </button>
        
        <button
          onClick={handleSmartCleanup}
          disabled={isClearing}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isClearing ? 'Limpiando...' : 'Limpieza Inteligente'}
        </button>
        
        <button
          onClick={handleClearCache}
          disabled={isClearing}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          {isClearing ? 'Limpiando...' : 'Limpiar Todo'}
        </button>
      </div>
    </div>
  );
};
