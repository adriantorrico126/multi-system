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

// Componente de prueba
const TestComponent: React.FC = () => {
  const { currentPlan, hasFeature, isLimitExceeded } = usePlanSystem();
  
  return (
    <div>
      <div data-testid="current-plan">{currentPlan}</div>
      <div data-testid="has-inventario-basico">{hasFeature('incluye_inventario_basico') ? 'true' : 'false'}</div>
      <div data-testid="has-inventario-avanzado">{hasFeature('incluye_inventario_avanzado') ? 'true' : 'false'}</div>
      <div data-testid="limit-exceeded">{isLimitExceeded('max_productos') ? 'true' : 'false'}</div>
    </div>
  );
};

describe('PlanSystemProvider', () => {
  it('should provide plan system context', async () => {
    render(
      <PlanSystemProvider>
        <TestComponent />
      </PlanSystemProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-plan')).toHaveTextContent('Profesional');
      expect(screen.getByTestId('has-inventario-basico')).toHaveTextContent('true');
      expect(screen.getByTestId('has-inventario-avanzado')).toHaveTextContent('false');
      expect(screen.getByTestId('limit-exceeded')).toHaveTextContent('false');
    });
  });
});

describe('PlanFeatureGate', () => {
  it('should render children when feature is available', () => {
    render(
      <PlanSystemProvider>
        <PlanFeatureGate feature="incluye_inventario_basico">
          <div data-testid="inventario-content">Inventario Básico</div>
        </PlanFeatureGate>
      </PlanSystemProvider>
    );

    expect(screen.getByTestId('inventario-content')).toBeInTheDocument();
  });

  it('should show restriction overlay when feature is not available', () => {
    render(
      <PlanSystemProvider>
        <PlanFeatureGate feature="incluye_inventario_avanzado">
          <div data-testid="inventario-avanzado-content">Inventario Avanzado</div>
        </PlanFeatureGate>
      </PlanSystemProvider>
    );

    expect(screen.queryByTestId('inventario-avanzado-content')).not.toBeInTheDocument();
    expect(screen.getByText('Funcionalidad No Disponible')).toBeInTheDocument();
  });
});

describe('PlanLimitAlert', () => {
  it('should render limit alert for productos', () => {
    render(
      <PlanSystemProvider>
        <PlanLimitAlert limitType="productos" />
      </PlanSystemProvider>
    );

    expect(screen.getByText('Límite de Productos')).toBeInTheDocument();
    expect(screen.getByText('50/100 productos')).toBeInTheDocument();
  });

  it('should show upgrade button when limit is exceeded', () => {
    // Mock para simular límite excedido
    jest.mocked(require('@/hooks/usePlanLimits').usePlanLimits).mockReturnValue({
      ...require('@/hooks/usePlanLimits').usePlanLimits(),
      getProductosInfo: jest.fn(() => ({ 
        current: 120, 
        max: 100, 
        remaining: -20, 
        percentage: 120, 
        unlimited: false, 
        exceeded: true 
      })),
      isLimitExceeded: jest.fn(() => true)
    });

    render(
      <PlanSystemProvider>
        <PlanLimitAlert limitType="productos" />
      </PlanSystemProvider>
    );

    expect(screen.getByText('Actualizar Plan')).toBeInTheDocument();
  });
});

describe('PlanStatusCard', () => {
  it('should render plan status card', () => {
    render(
      <PlanSystemProvider>
        <PlanStatusCard />
      </PlanSystemProvider>
    );

    expect(screen.getByText('Estado del Plan')).toBeInTheDocument();
    expect(screen.getByText('Profesional')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
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
