import { useState, useCallback, useEffect } from 'react';

interface ConnectionErrorState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
}

interface UseConnectionErrorOptions {
  maxRetries?: number;
  retryDelay?: number;
  autoRetry?: boolean;
}

export const useConnectionError = (options: UseConnectionErrorOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 2000,
    autoRetry = true
  } = options;

  const [state, setState] = useState<ConnectionErrorState>({
    hasError: false,
    error: null,
    retryCount: 0,
    isRetrying: false
  });

  const isConnectionError = useCallback((error: Error): boolean => {
    return error.name === 'ConnectionError' || 
           error.name === 'SSLError' ||
           error.message.includes('Network Error') ||
           error.message.includes('ERR_CERT_AUTHORITY_INVALID') ||
           error.message.includes('ERR_NETWORK');
  }, []);

  const setError = useCallback((error: Error) => {
    if (isConnectionError(error)) {
      setState(prev => ({
        ...prev,
        hasError: true,
        error,
        retryCount: 0,
        isRetrying: false
      }));

      // Auto-retry si está habilitado
      if (autoRetry && state.retryCount < maxRetries) {
        setTimeout(() => {
          retry();
        }, retryDelay);
      }
    }
  }, [isConnectionError, autoRetry, maxRetries, retryDelay, state.retryCount]);

  const retry = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1
    }));

    // Simular un pequeño delay antes de marcar como no reintentando
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isRetrying: false
      }));
    }, 1000);
  }, []);

  const clearError = useCallback(() => {
    setState({
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false
    });
  }, []);

  // Limpiar errores cuando la conexión se restablece
  useEffect(() => {
    const handleOnline = () => {
      if (state.hasError) {
        clearError();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [state.hasError, clearError]);

  return {
    ...state,
    setError,
    retry,
    clearError,
    reset,
    isConnectionError,
    canRetry: state.retryCount < maxRetries
  };
};

export default useConnectionError;
