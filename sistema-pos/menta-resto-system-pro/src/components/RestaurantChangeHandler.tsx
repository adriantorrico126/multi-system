import React from 'react';
import { useRestaurantChange } from '@/hooks/useRestaurantChange';

/**
 * Componente que maneja los cambios de restaurante globalmente
 * No renderiza nada, solo ejecuta la lógica de limpieza de cache
 */
export const RestaurantChangeHandler: React.FC = () => {
  // Usar el hook que detecta cambios de restaurante
  useRestaurantChange();
  
  // Este componente no renderiza nada
  return null;
};
