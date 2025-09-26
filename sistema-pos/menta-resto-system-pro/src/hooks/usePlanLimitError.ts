import { useState, useCallback } from 'react';

export const usePlanLimitError = () => {
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const showError = useCallback((errorData) => {
    setError(errorData);
    setIsVisible(true);
  }, []);

  const hideError = useCallback(() => {
    setIsVisible(false);
    setError(null);
  }, []);

  const handleApiError = useCallback((apiError) => {
    // Verificar si es un error relacionado con límites de plan
    if (apiError?.response?.status === 403) {
      const errorData = apiError.response.data;
      
      if (errorData?.code === 'INSUFFICIENT_PLAN' || 
          errorData?.code === 'FEATURE_NOT_AVAILABLE' || 
          errorData?.code === 'LIMIT_EXCEEDED' ||
          errorData?.code === 'RESOURCE_LIMIT_EXCEEDED') {
        showError(errorData);
        return true; // Indica que el error fue manejado
      }
    }
    
    return false; // Error no relacionado con límites de plan
  }, [showError]);

  return {
    error,
    isVisible,
    showError,
    hideError,
    handleApiError
  };
};
