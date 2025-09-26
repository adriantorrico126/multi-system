import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { POSSystem } from '@/components/pos/POSSystem';
import LoginPage from '@/pages/Login';
import { AuthLoadingSpinner } from '@/components/ui/LoadingSpinner';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loader mientras se verifica la autenticación
  if (isLoading) {
    return <AuthLoadingSpinner message="Verificando autenticación..." />;
  }

  // Si no está autenticado, mostrar página de login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Si está autenticado, mostrar el sistema POS
  return <POSSystem />;
};

export default Index;