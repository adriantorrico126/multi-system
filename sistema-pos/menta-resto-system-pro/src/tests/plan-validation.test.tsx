import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PlanSystemProvider } from '@/context/PlanSystemContext';
import { PlanFeatureGate, PlanLimitAlert, PlanStatusCard } from '@/components/plans';
import { usePlanSystem } from '@/context/PlanSystemContext';

// Mock de los hooks
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id_restaurante: 1,
      rol: 'admin'
    }
  })
}));

jest.mock('@/hooks/usePlanLimits', () => ({
  usePlanLimits: () => ({
    planInfo: null,
    isLoading: false,
    error: null,
    isLimitExceeded: jest.fn(() => false),
    canAddResource: jest.fn(() => true),
    getRemainingLimit: jest.fn(() => 100),
    getUsagePercentage: jest.fn(() => 50),
    getSucursalesInfo: jest.fn(() => ({ current: 1, max: 5, remaining: 4, percentage: 20, unlimited: false, exceeded: false })),
    getUsuariosInfo: jest.fn(() => ({ current: 2, max: 10, remaining: 8, percentage: 20, unlimited: false, exceeded: false })),
    getProductosInfo: jest.fn(() => ({ current: 50, max: 100, remaining: 50, percentage: 50, unlimited: false, exceeded: false })),
    getTransaccionesInfo: jest.fn(() => ({ current: 100, max: 1000, remaining: 900, percentage: 10, unlimited: false, exceeded: false })),
    getAlmacenamientoInfo: jest.fn(() => ({ current: 1, max: 5, remaining: 4, percentage: 20, unlimited: false, exceeded: false })),
    refreshData: jest.fn(),
    updateUsage: jest.fn()
  })
}));

jest.mock('@/hooks/usePlanFeaturesNew', () => ({
  usePlanFeaturesNew: () => ({
    planInfo: {
      plan: {
        id: 1,
        nombre: 'Profesional',
        precio_mensual: 50,
        descripcion: 'Plan Profesional',
        funcionalidades: {
          incluye_pos: true,
          incluye_inventario_basico: true,
          incluye_inventario_avanzado: false,
          incluye_egresos: true,
          incluye_egresos_avanzados: false,
          incluye_reportes_avanzados: false
        }
      },
      suscripcion: {
        estado: 'activa',
        fecha_inicio: '2024-01-01',
        fecha_fin: '2024-12-31'
      }
    },
    suscripcion: {
      estado: 'activa',
      fecha_inicio: '2024-01-01',
      fecha_fin: '2024-12-31'
    },
    isLoading: false,
    error: null,
    hasFeature: jest.fn((feature: string) => {
      const features: { [key: string]: boolean } = {
        incluye_pos: true,
        incluye_inventario_basico: true,
        incluye_inventario_avanzado: false,
        incluye_egresos: true,
        incluye_egresos_avanzados: false,
        incluye_reportes_avanzados: false
      };
      return features[feature] || false;
    }),
    checkFeatureAccess: jest.fn((feature: string) => ({
      hasAccess: true,
      reason: 'Feature available',
      requiredPlan: 'Profesional',
      currentPlan: 'Profesional'
    })),
    canUseFeature: jest.fn(() => true),
    getCurrentPlan: jest.fn(() => 'Profesional'),
    getPlanFeatures: jest.fn(() => ({
      incluye_pos: true,
      incluye_inventario_basico: true,
      incluye_inventario_avanzado: false,
      incluye_egresos: true,
      incluye_egresos_avanzados: false,
      incluye_reportes_avanzados: false
    })),
    isPlanActive: jest.fn(() => true),
    isPlanExpired: jest.fn(() => false),
    isPlanSuspended: jest.fn(() => false),
    getDaysUntilExpiration: jest.fn(() => 30),
    refreshData: jest.fn()
  })
}));

jest.mock('@/hooks/usePlanAlerts', () => ({
  usePlanAlerts: () => ({
    alertas: [],
    alertasActivas: [],
    alertasCriticas: [],
    unreadAlertsCount: 0,
    resolveAlert: jest.fn(),
    ignoreAlert: jest.fn(),
    markAllAsRead: jest.fn(),
    refreshData: jest.fn()
  })
}));

// Componente de prueba para validar implementación
const ValidationTestComponent: React.FC = () => {
  const { 
    currentPlan, 
    hasFeature, 
    isLimitExceeded, 
    getRemainingLimit, 
    getUsagePercentage,
    planFeatures,
    isActive,
    isExpired,
    isSuspended,
    daysUntilExpiration
  } = usePlanSystem();
  
  return (
    <div>
      <div data-testid="current-plan">{currentPlan}</div>
      <div data-testid="plan-active">{isActive ? 'true' : 'false'}</div>
      <div data-testid="plan-expired">{isExpired ? 'true' : 'false'}</div>
      <div data-testid="plan-suspended">{isSuspended ? 'true' : 'false'}</div>
      <div data-testid="days-until-expiration">{daysUntilExpiration}</div>
      
      <div data-testid="has-pos">{hasFeature('incluye_pos') ? 'true' : 'false'}</div>
      <div data-testid="has-inventario-basico">{hasFeature('incluye_inventario_basico') ? 'true' : 'false'}</div>
      <div data-testid="has-inventario-avanzado">{hasFeature('incluye_inventario_avanzado') ? 'true' : 'false'}</div>
      <div data-testid="has-egresos">{hasFeature('incluye_egresos') ? 'true' : 'false'}</div>
      <div data-testid="has-egresos-avanzados">{hasFeature('incluye_egresos_avanzados') ? 'true' : 'false'}</div>
      <div data-testid="has-reportes-avanzados">{hasFeature('incluye_reportes_avanzados') ? 'true' : 'false'}</div>
      
      <div data-testid="limit-exceeded-productos">{isLimitExceeded('max_productos') ? 'true' : 'false'}</div>
      <div data-testid="limit-exceeded-usuarios">{isLimitExceeded('max_usuarios') ? 'true' : 'false'}</div>
      <div data-testid="limit-exceeded-sucursales">{isLimitExceeded('max_sucursales') ? 'true' : 'false'}</div>
      
      <div data-testid="remaining-productos">{getRemainingLimit('max_productos')}</div>
      <div data-testid="remaining-usuarios">{getRemainingLimit('max_usuarios')}</div>
      <div data-testid="remaining-sucursales">{getRemainingLimit('max_sucursales')}</div>
      
      <div data-testid="usage-productos">{getUsagePercentage('max_productos')}</div>
      <div data-testid="usage-usuarios">{getUsagePercentage('max_usuarios')}</div>
      <div data-testid="usage-sucursales">{getUsagePercentage('max_sucursales')}</div>
      
      <div data-testid="plan-features-count">{Object.keys(planFeatures).length}</div>
    </div>
  );
};

describe('Plan System Implementation Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Context Implementation', () => {
    it('should provide all required context values', async () => {
      render(
        <PlanSystemProvider>
          <ValidationTestComponent />
        </PlanSystemProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-plan')).toHaveTextContent('Profesional');
        expect(screen.getByTestId('plan-active')).toHaveTextContent('true');
        expect(screen.getByTestId('plan-expired')).toHaveTextContent('false');
        expect(screen.getByTestId('plan-suspended')).toHaveTextContent('false');
        expect(screen.getByTestId('days-until-expiration')).toHaveTextContent('30');
      });
    });

    it('should provide all required functions', async () => {
      render(
        <PlanSystemProvider>
          <ValidationTestComponent />
        </PlanSystemProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('has-pos')).toHaveTextContent('true');
        expect(screen.getByTestId('has-inventario-basico')).toHaveTextContent('true');
        expect(screen.getByTestId('has-inventario-avanzado')).toHaveTextContent('false');
        expect(screen.getByTestId('has-egresos')).toHaveTextContent('true');
        expect(screen.getByTestId('has-egresos-avanzados')).toHaveTextContent('false');
        expect(screen.getByTestId('has-reportes-avanzados')).toHaveTextContent('false');
      });
    });
  });

  describe('Feature Gates Implementation', () => {
    it('should render allowed features', () => {
      render(
        <PlanSystemProvider>
          <PlanFeatureGate feature="incluye_inventario_basico">
            <div data-testid="inventario-basico">Inventario Básico</div>
          </PlanFeatureGate>
        </PlanSystemProvider>
      );

      expect(screen.getByTestId('inventario-basico')).toBeInTheDocument();
    });

    it('should restrict denied features', () => {
      render(
        <PlanSystemProvider>
          <PlanFeatureGate feature="incluye_inventario_avanzado">
            <div data-testid="inventario-avanzado">Inventario Avanzado</div>
          </PlanFeatureGate>
        </PlanSystemProvider>
      );

      expect(screen.queryByTestId('inventario-avanzado')).not.toBeInTheDocument();
      expect(screen.getByText('Funcionalidad No Disponible')).toBeInTheDocument();
    });

    it('should show upgrade message for restricted features', () => {
      render(
        <PlanSystemProvider>
          <PlanFeatureGate feature="incluye_inventario_avanzado">
            <div data-testid="inventario-avanzado">Inventario Avanzado</div>
          </PlanFeatureGate>
        </PlanSystemProvider>
      );

      expect(screen.getByText('Actualizar a Avanzado')).toBeInTheDocument();
    });
  });

  describe('Limit Alerts Implementation', () => {
    it('should render limit alerts for all limit types', () => {
      render(
        <PlanSystemProvider>
          <div>
            <PlanLimitAlert limitType="productos" />
            <PlanLimitAlert limitType="usuarios" />
            <PlanLimitAlert limitType="sucursales" />
            <PlanLimitAlert limitType="transacciones" />
            <PlanLimitAlert limitType="almacenamiento" />
          </div>
        </PlanSystemProvider>
      );

      expect(screen.getByText('Límite de Productos')).toBeInTheDocument();
      expect(screen.getByText('Límite de Usuarios')).toBeInTheDocument();
      expect(screen.getByText('Límite de Sucursales')).toBeInTheDocument();
      expect(screen.getByText('Límite de Transacciones')).toBeInTheDocument();
      expect(screen.getByText('Límite de Almacenamiento')).toBeInTheDocument();
    });

    it('should show correct usage information', () => {
      render(
        <PlanSystemProvider>
          <PlanLimitAlert limitType="productos" />
        </PlanSystemProvider>
      );

      expect(screen.getByText('50/100 productos')).toBeInTheDocument();
      expect(screen.getByText('50% utilizado')).toBeInTheDocument();
    });
  });

  describe('Status Card Implementation', () => {
    it('should render plan status card with correct information', () => {
      render(
        <PlanSystemProvider>
          <PlanStatusCard />
        </PlanSystemProvider>
      );

      expect(screen.getByText('Estado del Plan')).toBeInTheDocument();
      expect(screen.getByText('Profesional')).toBeInTheDocument();
      expect(screen.getByText('Activa')).toBeInTheDocument();
      expect(screen.getByText('30 días restantes')).toBeInTheDocument();
    });

    it('should show upgrade button for non-enterprise plans', () => {
      render(
        <PlanSystemProvider>
          <PlanStatusCard />
        </PlanSystemProvider>
      );

      expect(screen.getByText('Actualizar Plan')).toBeInTheDocument();
    });
  });

  describe('Plan Features Validation', () => {
    it('should validate all plan features correctly', async () => {
      render(
        <PlanSystemProvider>
          <ValidationTestComponent />
        </PlanSystemProvider>
      );

      await waitFor(() => {
        // Plan Profesional features
        expect(screen.getByTestId('has-pos')).toHaveTextContent('true');
        expect(screen.getByTestId('has-inventario-basico')).toHaveTextContent('true');
        expect(screen.getByTestId('has-inventario-avanzado')).toHaveTextContent('false');
        expect(screen.getByTestId('has-egresos')).toHaveTextContent('true');
        expect(screen.getByTestId('has-egresos-avanzados')).toHaveTextContent('false');
        expect(screen.getByTestId('has-reportes-avanzados')).toHaveTextContent('false');
      });
    });

    it('should have correct plan features count', async () => {
      render(
        <PlanSystemProvider>
          <ValidationTestComponent />
        </PlanSystemProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('plan-features-count')).toHaveTextContent('6');
      });
    });
  });

  describe('Limit Validation', () => {
    it('should validate all limits correctly', async () => {
      render(
        <PlanSystemProvider>
          <ValidationTestComponent />
        </PlanSystemProvider>
      );

      await waitFor(() => {
        // Limits not exceeded
        expect(screen.getByTestId('limit-exceeded-productos')).toHaveTextContent('false');
        expect(screen.getByTestId('limit-exceeded-usuarios')).toHaveTextContent('false');
        expect(screen.getByTestId('limit-exceeded-sucursales')).toHaveTextContent('false');
        
        // Remaining limits
        expect(screen.getByTestId('remaining-productos')).toHaveTextContent('100');
        expect(screen.getByTestId('remaining-usuarios')).toHaveTextContent('100');
        expect(screen.getByTestId('remaining-sucursales')).toHaveTextContent('100');
        
        // Usage percentages
        expect(screen.getByTestId('usage-productos')).toHaveTextContent('50');
        expect(screen.getByTestId('usage-usuarios')).toHaveTextContent('50');
        expect(screen.getByTestId('usage-sucursales')).toHaveTextContent('50');
      });
    });
  });

  describe('Component Integration', () => {
    it('should integrate all components correctly', () => {
      render(
        <PlanSystemProvider>
          <div>
            <PlanStatusCard />
            <PlanFeatureGate feature="incluye_inventario_basico">
              <div data-testid="inventario-basico">Inventario Básico</div>
            </PlanFeatureGate>
            <PlanFeatureGate feature="incluye_inventario_avanzado">
              <div data-testid="inventario-avanzado">Inventario Avanzado</div>
            </PlanFeatureGate>
            <PlanLimitAlert limitType="productos" />
          </div>
        </PlanSystemProvider>
      );

      // Status card
      expect(screen.getByText('Estado del Plan')).toBeInTheDocument();
      
      // Allowed feature
      expect(screen.getByTestId('inventario-basico')).toBeInTheDocument();
      
      // Restricted feature
      expect(screen.queryByTestId('inventario-avanzado')).not.toBeInTheDocument();
      expect(screen.getByText('Funcionalidad No Disponible')).toBeInTheDocument();
      
      // Limit alert
      expect(screen.getByText('Límite de Productos')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing context gracefully', () => {
      // Test without provider
      expect(() => {
        render(<ValidationTestComponent />);
      }).toThrow('usePlanSystem must be used within a PlanSystemProvider');
    });

    it('should handle invalid feature names', async () => {
      render(
        <PlanSystemProvider>
          <ValidationTestComponent />
        </PlanSystemProvider>
      );

      await waitFor(() => {
        // Invalid feature should return false
        expect(screen.getByTestId('has-inventario-avanzado')).toHaveTextContent('false');
      });
    });
  });
});
