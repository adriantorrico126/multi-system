import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePlanSystem } from '@/context/PlanSystemContext';
import { getProducts } from '@/services/api';

/**
 * Hook personalizado para manejar queries condicionales según el plan del usuario
 */
export const usePlanConditionalQueries = () => {
  const { hasFeature, planInfo, isLoading: planLoading } = usePlanSystem();
  const queryClient = useQueryClient();

  // Query para productos (solo si tiene acceso a inventory)
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !planLoading && hasFeature('inventory'),
  });

  // Función para invalidar queries cuando cambie el plan
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  return {
    products: productsQuery.data || [],
    isLoadingProducts: productsQuery.isLoading,
    productsError: productsQuery.error,
    
    // Valores por defecto para mesas y arqueo
    mesas: [],
    isLoadingMesas: false,
    mesasError: null,
    
    arqueo: null,
    isLoadingArqueo: false,
    arqueoError: null,
    
    planLoading,
    invalidateQueries,
    
    // Información del plan para debugging
    currentPlan,
    hasInventoryAccess: hasFeature('inventory'),
    hasMesasAccess: hasFeature('mesas'),
    hasArqueoAccess: hasFeature('arqueo'),
  };
};
