import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthLoadingSpinner } from '@/components/ui/LoadingSpinner';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { isLoading } = useAuth();

  // Mostrar loader mientras se inicializa la autenticación
  if (isLoading) {
    return <AuthLoadingSpinner message="Inicializando sistema..." />;
  }

  return <LoginForm onLoginSuccess={onLoginSuccess} />;
}