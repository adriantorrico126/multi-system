import React from 'react';
import { Loader2, Shield, CheckCircle } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'auth' | 'success';
  className?: string;
}

export function LoadingSpinner({ 
  message = 'Cargando...', 
  size = 'md',
  variant = 'default',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const getVariantContent = () => {
    switch (variant) {
      case 'auth':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <Loader2 className={`${sizeClasses[size]} text-blue-600 animate-spin mx-auto`} />
            <p className="text-gray-600 font-medium">{message}</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600 font-medium">{message}</p>
          </div>
        );
      default:
        return (
          <div className="text-center space-y-4">
            <Loader2 className={`${sizeClasses[size]} text-blue-600 animate-spin mx-auto`} />
            <p className="text-gray-600 font-medium">{message}</p>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 ${className}`}>
      {getVariantContent()}
    </div>
  );
}

// Componente específico para loading de autenticación
export function AuthLoadingSpinner({ message = 'Verificando autenticación...' }: { message?: string }) {
  return <LoadingSpinner message={message} variant="auth" />;
}

// Componente específico para loading general
export function GeneralLoadingSpinner({ message = 'Cargando...' }: { message?: string }) {
  return <LoadingSpinner message={message} variant="default" />;
}

// Componente específico para loading de éxito
export function SuccessSpinner({ message = 'Operación exitosa' }: { message?: string }) {
  return <LoadingSpinner message={message} variant="success" />;
}
