import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook que detecta cambios de restaurante y limpia el cache de React Query
 * para evitar que se muestren datos del restaurante anterior
 */
export const useRestaurantChange = () => {
  const { user, clearRestaurantData } = useAuth();
  const queryClient = useQueryClient();
  const previousRestaurantId = useRef<number | null>(null);

  // Solo ejecutar la lógica si hay un usuario autenticado
  useEffect(() => {
    if (!user || !user.id_restaurante) return;

    const currentRestaurantId = user.id_restaurante;
    
    // Si es la primera vez que se carga el usuario
    if (previousRestaurantId.current === null) {
      previousRestaurantId.current = currentRestaurantId;
      return;
    }

    // Si cambió el restaurante
    if (previousRestaurantId.current !== currentRestaurantId) {
      console.log('🔄 Restaurante cambiado:', {
        from: previousRestaurantId.current,
        to: currentRestaurantId
      });

      // Limpiar datos del restaurante anterior
      clearRestaurantData();
      
      // Limpiar TODO el cache de React Query
      queryClient.clear();
      
      console.log('🧹 Cache de React Query limpiado completamente');
      
      // Actualizar la referencia
      previousRestaurantId.current = currentRestaurantId;
    }
  }, [user?.id_restaurante, clearRestaurantData, queryClient]);

  // Listener para cambios en localStorage entre pestañas
  useEffect(() => {
    // Solo ejecutar si hay un usuario autenticado
    if (!user) return;

    const handleStorageChange = (e: StorageEvent) => {
      // Si se eliminó el usuario actual, limpiar cache
      if (e.key === 'currentUser' && e.newValue === null) {
        console.log('🔄 Usuario eliminado en otra pestaña, limpiando cache');
        queryClient.clear();
        return;
      }

      // Si cambió el usuario y es diferente al actual
      if (e.key === 'currentUser' && e.newValue) {
        try {
          const newUser = JSON.parse(e.newValue);
          if (user && newUser.id_restaurante !== user.id_restaurante) {
            console.log('🔄 Usuario cambiado en otra pestaña, limpiando cache');
            queryClient.clear();
          }
        } catch (error) {
          console.error('Error parsing user from storage event:', error);
        }
      }
    };

    // Escuchar cambios en localStorage
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, queryClient]);

  // Función para limpiar manualmente el cache
  const clearCache = () => {
    console.log('🧹 Limpiando cache manualmente');
    queryClient.clear();
  };

  return { clearCache };
};
