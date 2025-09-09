// Configuración de producción para el sistema POS
export const PRODUCTION_CONFIG = {
  BACKEND_URL: 'https://api.forkast.vip',
  PRINT_SERVER_URL: 'https://api.forkast.vip',
  SOCKET_URL: 'https://api.forkast.vip',
  // Configuración SSL para desarrollo
  SSL_CONFIG: {
    rejectUnauthorized: false
  }
};

// Función para obtener la URL del backend
export const getBackendUrl = () => {
  return import.meta.env.VITE_BACKEND_URL || PRODUCTION_CONFIG.BACKEND_URL;
};

// Función para obtener la URL del servidor de impresión
export const getPrintServerUrl = () => {
  return import.meta.env.VITE_PRINT_SERVER_URL || PRODUCTION_CONFIG.PRINT_SERVER_URL;
};

// Función para obtener la URL del socket
export const getSocketUrl = () => {
  return import.meta.env.VITE_SOCKET_URL || PRODUCTION_CONFIG.SOCKET_URL;
};
