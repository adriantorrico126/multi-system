import React, { useEffect } from 'react';
import { useConnectionError } from '@/hooks/useConnectionError';
import ConnectionError from '@/components/ConnectionError';

interface ConnectionErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error) => void;
}

export const ConnectionErrorBoundary: React.FC<ConnectionErrorBoundaryProps> = ({
  children,
  onError
}) => {
  const {
    hasError,
    error,
    retry,
    clearError,
    isRetrying,
    canRetry,
    setError
  } = useConnectionError({
    maxRetries: 3,
    retryDelay: 2000,
    autoRetry: true
  });

  // Interceptar errores globalmente
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = new Error(event.message);
      error.name = event.error?.name || 'Error';
      
      if (setError) {
        setError(error);
        onError?.(error);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      
      if (setError) {
        setError(error);
        onError?.(error);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [setError, onError]);

  if (hasError && error) {
    return (
      <ConnectionError
        error={error}
        onRetry={canRetry ? retry : undefined}
        isRetrying={isRetrying}
      />
    );
  }

  return <>{children}</>;
};

export default ConnectionErrorBoundary;
