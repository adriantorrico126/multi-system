import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ConnectionErrorState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
}

interface ConnectionErrorContextType extends ConnectionErrorState {
  setError: (error: Error) => void;
  clearError: () => void;
  retry: () => void;
  isConnectionError: (error: Error) => boolean;
  canRetry: boolean;
}

const ConnectionErrorContext = createContext<ConnectionErrorContextType | undefined>(undefined);

interface ConnectionErrorProviderProps {
  children: ReactNode;
  maxRetries?: number;
  retryDelay?: number;
  autoRetry?: boolean;
}

export const ConnectionErrorProvider: React.FC<ConnectionErrorProviderProps> = ({
  children,
  maxRetries = 3,
  retryDelay = 2000,
  autoRetry = true
}) => {
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
      console.log('🔍 [ConnectionErrorContext] Error de conexión detectado:', error);
      
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
    console.log('🔄 [ConnectionErrorContext] Intentando reconectar...');
    
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
    console.log('✅ [ConnectionErrorContext] Error de conexión limpiado');
    
    setState({
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false
    });
  }, []);

  const value: ConnectionErrorContextType = {
    ...state,
    setError,
    clearError,
    retry,
    isConnectionError,
    canRetry: state.retryCount < maxRetries
  };

  return (
    <ConnectionErrorContext.Provider value={value}>
      {children}
    </ConnectionErrorContext.Provider>
  );
};

export const useConnectionError = (): ConnectionErrorContextType => {
  const context = useContext(ConnectionErrorContext);
  if (!context) {
    throw new Error('useConnectionError debe ser usado dentro de ConnectionErrorProvider');
  }
  return context;
};

export default ConnectionErrorContext;
