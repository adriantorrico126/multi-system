import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ConnectionErrorProps {
  error?: Error;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ConnectionError: React.FC<ConnectionErrorProps> = ({
  error,
  onRetry,
  isRetrying = false
}) => {
  const isNetworkError = error?.message?.includes('Network Error') || 
                         error?.message?.includes('ERR_CERT_AUTHORITY_INVALID') ||
                         error?.message?.includes('ERR_NETWORK');

  const isSSLError = error?.message?.includes('ERR_CERT_AUTHORITY_INVALID');

  const getErrorMessage = () => {
    if (isSSLError) {
      return {
        title: "Error de Certificado SSL",
        description: "No se puede establecer una conexión segura con el servidor. Esto puede deberse a problemas de certificado SSL.",
        icon: <AlertTriangle className="h-8 w-8 text-yellow-500" />
      };
    }
    
    if (isNetworkError) {
      return {
        title: "Error de Conexión",
        description: "No se puede conectar con el servidor. Verifica tu conexión a internet y vuelve a intentar.",
        icon: <WifiOff className="h-8 w-8 text-red-500" />
      };
    }

    return {
      title: "Error de Conexión",
      description: "Ha ocurrido un error al conectar con el servidor.",
      icon: <AlertTriangle className="h-8 w-8 text-red-500" />
    };
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {errorInfo.icon}
          </div>
          <CardTitle className="text-xl font-semibold">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSSLError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Solución recomendada:</p>
                  <p>Si estás en desarrollo, puedes usar HTTP en lugar de HTTPS o configurar el certificado SSL correctamente.</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={onRetry} 
              disabled={isRetrying}
              className="w-full"
              variant="default"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reintentando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar Conexión
                </>
              )}
            </Button>
            
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="w-full"
            >
              <Wifi className="h-4 w-4 mr-2" />
              Recargar Página
            </Button>
          </div>

          {error && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                Ver detalles del error
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectionError;
