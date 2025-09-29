import React from 'react';
import { usePageCacheCleanup } from '@/hooks/usePageCacheCleanup';

/**
 * Componente que maneja la limpieza de caché al actualizar la página
 * No renderiza nada, solo ejecuta la lógica de limpieza
 */
export const PageCacheHandler: React.FC = () => {
  // Usar el hook que maneja la limpieza de caché
  usePageCacheCleanup();
  
  // Este componente no renderiza nada
  return null;
};
