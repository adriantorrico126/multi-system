const fs = require('fs');
const path = require('path');

// Leer el archivo api.ts actual
const apiPath = path.join(__dirname, 'menta-resto-system-pro', 'src', 'services', 'api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');

// Crear una versión mejorada del interceptor de errores
const improvedInterceptor = `
// Interceptor global mejorado para manejar errores de conexión
api.interceptors.response.use(
  response => response,
  async error => {
    console.log('🔍 [API Interceptor] Error detectado:', error);
    const status = error?.response?.status;
    const message = error?.response?.data?.message?.toLowerCase?.() || '';
    const code = error?.response?.data?.code;
    const isNetworkError = error.code === 'ERR_NETWORK' || error.code === 'ERR_CERT_AUTHORITY_INVALID';

    // Manejar errores de red y certificados SSL
    if (isNetworkError) {
      console.log('🔍 [API Interceptor] Error de red/SSL detectado:', error.message);
      
      // Para errores de red, intentar reconectar después de un delay
      if (error.config && !error.config._retry) {
        error.config._retry = true;
        
        // Esperar 2 segundos antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🔍 [API Interceptor] Reintentando petición después de error de red...');
        return api(error.config);
      }
      
      // Si el reintento falló, mostrar mensaje amigable
      const networkError = new Error('Error de conexión. Verificando conectividad...');
      networkError.name = 'NetworkError';
      return Promise.reject(networkError);
    }

    // Manejar tokens expirados o inválidos
    const isAuthFailure = status === 401 && (
      message.includes('jwt expired') ||
      message.includes('token expirado') ||
      message.includes('invalid token') ||
      message.includes('token invalid') ||
      message.includes('no token provided') ||
      message.includes('token requerido') ||
      code === 'TOKEN_EXPIRED' ||
      code === 'TOKEN_INVALID' ||
      code === 'TOKEN_ERROR'
    );

    if (isAuthFailure) {
      console.log('🔍 [API Interceptor] Token inválido/expirado. Intentando renovar...');
      
      // Intentar renovar el token automáticamente
      try {
        const { token, data } = await refreshAuthToken();
        
        // Si la renovación fue exitosa, reintentar la petición original
        if (token && data) {
          console.log('🔍 [API Interceptor] Token renovado. Reintentando petición original...');
          
          // Actualizar el token en la petición original
          const originalRequest = error.config;
          originalRequest.headers['Authorization'] = \`Bearer \${token}\`;
          
          // Reintentar la petición
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.log('🔍 [API Interceptor] Falló la renovación del token. Cerrando sesión...');
      }
      
      // Si la renovación falló, limpiar sesión
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('selectedSucursalId');
      
      // Solo redirigir si no estamos ya en la página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=1';
      }
      
      return Promise.reject(new Error('Sesión expirada. Por favor, inicia sesión nuevamente.'));
    }

    // Manejar errores 403 específicos de caja para meseros
    if (status === 403 && message.includes('cajero o administrador debe aperturar caja')) {
      console.log('🔍 [API Interceptor] Error 403 de caja para mesero - mensaje personalizado');
      // Crear un error más amigable para el usuario
      const userFriendlyError = new Error('Un cajero o administrador debe aperturar caja antes de que puedas registrar ventas.');
      userFriendlyError.name = 'CajaNoAbiertaError';
      return Promise.reject(userFriendlyError);
    }

    // Para otros errores 403 u otros errores, no cerrar sesión automáticamente
    return Promise.reject(error);
  }
);`;

// Reemplazar el interceptor existente
const oldInterceptorRegex = /\/\/ Interceptor global para manejar expiración de JWT[\s\S]*?return Promise\.reject\(error\);\s*}\);/;
apiContent = apiContent.replace(oldInterceptorRegex, improvedInterceptor);

// Agregar función para manejar errores de conexión en el contexto de React
const connectionHandler = `
// Función para manejar errores de conexión en componentes React
export const handleConnectionError = (error: any, retryCallback?: () => void) => {
  console.log('🔍 [Connection Handler] Manejando error de conexión:', error);
  
  if (error.name === 'NetworkError' || error.code === 'ERR_NETWORK' || error.code === 'ERR_CERT_AUTHORITY_INVALID') {
    // Mostrar mensaje de error de conexión
    const errorMessage = 'Error de conexión con el servidor. Verificando conectividad...';
    
    // Si hay un callback de reintento, ejecutarlo después de 3 segundos
    if (retryCallback) {
      setTimeout(() => {
        console.log('🔍 [Connection Handler] Reintentando operación...');
        retryCallback();
      }, 3000);
    }
    
    return errorMessage;
  }
  
  return error.message || 'Error desconocido';
};

// Función para verificar conectividad
export const checkConnectivity = async () => {
  try {
    const response = await fetch('https://api.forkast.vip/api/v1/test', {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });
    
    return response.ok;
  } catch (error) {
    console.log('🔍 [Connectivity Check] Error:', error);
    return false;
  }
};
`;

// Agregar las nuevas funciones al final del archivo
apiContent = apiContent.replace(/export { api };/, `export { api };${connectionHandler}`);

// Escribir el archivo actualizado
fs.writeFileSync(apiPath, apiContent);

console.log('✅ API interceptor mejorado para manejar errores de conexión');
console.log('🔧 Funciones agregadas:');
console.log('   • handleConnectionError - Maneja errores de red en componentes');
console.log('   • checkConnectivity - Verifica conectividad con el servidor');
console.log('   • Reintentos automáticos para errores de red');
console.log('   • Manejo mejorado de errores SSL');

// Crear un componente de error de conexión
const connectionErrorComponent = `import React, { useState, useEffect } from 'react';
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
            <span className={\`text-sm \${isOnline ? 'text-green-600' : 'text-red-600'}\`}>
              {isOnline ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Servidor:</span>
            <span className={\`text-sm \${serverStatus === null ? 'text-gray-600' : serverStatus ? 'text-green-600' : 'text-red-600'}\`}>
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
`;

const connectionErrorPath = path.join(__dirname, 'menta-resto-system-pro', 'src', 'components', 'ui', 'ConnectionError.tsx');
fs.writeFileSync(connectionErrorPath, connectionErrorComponent);

console.log('✅ Componente ConnectionError creado');
console.log('📁 Ubicación:', connectionErrorPath);

console.log('\n🔧 CORRECCIÓN DE ERRORES DE CONEXIÓN COMPLETADA');
console.log('=' .repeat(60));
console.log('📋 Mejoras implementadas:');
console.log('   ✅ Interceptor mejorado para errores de red');
console.log('   ✅ Reintentos automáticos para errores SSL');
console.log('   ✅ Componente de error de conexión');
console.log('   ✅ Verificación de conectividad');
console.log('   ✅ Manejo amigable de errores');
console.log('\n🎯 Próximos pasos:');
console.log('   1. Reiniciar el servidor de desarrollo');
console.log('   2. Probar la conexión con el backend');
console.log('   3. Verificar que el carrito funcione correctamente');
console.log('   4. Si persisten errores SSL, considerar usar HTTP');
