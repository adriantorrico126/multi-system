import React, { useState, useEffect } from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { checkConnectivity } from '@/services/api';

interface ConnectionErrorProps {
  onRetry?: () => void;
  message?: string;
}

export const ConnectionError: React.FC<ConnectionErrorProps> = ({ onRetry, message }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isChecking, setIsChecking] = useState(false);
  const [serverStatus, setServerStatus] = useState<boolean | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkServerConnection = async () => {
    setIsChecking(true);
    try {
      const isConnected = await checkConnectivity();
      setServerStatus(isConnected);
    } catch (error) {
      setServerStatus(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {isOnline ? (
            <Wifi className="h-12 w-12 text-green-500" />
          ) : (
            <WifiOff className="h-12 w-12 text-red-500" />
          )}
        </div>
        <CardTitle className="text-xl">Error de Conexión</CardTitle>
        <CardDescription>
          {message || 'No se pudo conectar con el servidor'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estado de Internet:</span>
            <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Servidor:</span>
            <span className={`text-sm ${serverStatus === null ? 'text-gray-600' : serverStatus ? 'text-green-600' : 'text-red-600'}`}>
              {serverStatus === null ? 'No verificado' : serverStatus ? 'Disponible' : 'No disponible'}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={checkServerConnection} 
            disabled={isChecking}
            variant="outline"
            className="flex-1"
          >
            {isChecking ? 'Verificando...' : 'Verificar Servidor'}
          </Button>
          <Button 
            onClick={handleRetry}
            className="flex-1"
          >
            Reintentar
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          Si el problema persiste, contacta al administrador del sistema
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionError;
