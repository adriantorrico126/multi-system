// Variable global para almacenar la función de manejo de errores de conexión
let globalConnectionErrorHandler: ((error: Error) => void) | null = null;

export const setGlobalConnectionErrorHandler = (handler: (error: Error) => void) => {
  globalConnectionErrorHandler = handler;
};

export const triggerConnectionError = (error: Error) => {
  if (globalConnectionErrorHandler) {
    globalConnectionErrorHandler(error);
  }
};

export const clearGlobalConnectionErrorHandler = () => {
  globalConnectionErrorHandler = null;
};
