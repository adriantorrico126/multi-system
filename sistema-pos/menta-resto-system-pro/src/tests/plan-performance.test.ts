import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PlanSystemProvider } from '@/context/PlanSystemContext';
import { PlanFeatureGate, PlanLimitAlert, PlanStatusCard } from '@/components/plans';

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

describe('Plan Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering Performance', () => {
    it('should render PlanFeatureGate quickly', () => {
      const startTime = performance.now();
      
      render(
        <PlanSystemProvider>
          <PlanFeatureGate feature="incluye_inventario_basico">
            <div data-testid="content">Test Content</div>
          </PlanFeatureGate>
        </PlanSystemProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(renderTime).toBeLessThan(100); // Should render in less than 100ms
    });

    it('should render PlanLimitAlert quickly', () => {
      const startTime = performance.now();
      
      render(
        <PlanSystemProvider>
          <PlanLimitAlert limitType="productos" />
        </PlanSystemProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(screen.getByText('Límite de Productos')).toBeInTheDocument();
      expect(renderTime).toBeLessThan(100); // Should render in less than 100ms
    });

    it('should render PlanStatusCard quickly', () => {
      const startTime = performance.now();
      
      render(
        <PlanSystemProvider>
          <PlanStatusCard />
        </PlanSystemProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(screen.getByText('Estado del Plan')).toBeInTheDocument();
      expect(renderTime).toBeLessThan(100); // Should render in less than 100ms
    });
  });

  describe('Multiple Component Rendering', () => {
    it('should render multiple PlanFeatureGates efficiently', () => {
      const startTime = performance.now();
      
      render(
        <PlanSystemProvider>
          <PlanFeatureGate feature="incluye_inventario_basico">
            <div data-testid="content1">Content 1</div>
          </PlanFeatureGate>
          <PlanFeatureGate feature="incluye_egresos">
            <div data-testid="content2">Content 2</div>
          </PlanFeatureGate>
          <PlanFeatureGate feature="incluye_reportes_avanzados">
            <div data-testid="content3">Content 3</div>
          </PlanFeatureGate>
        </PlanSystemProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(screen.getByTestId('content1')).toBeInTheDocument();
      expect(screen.getByTestId('content2')).toBeInTheDocument();
      expect(screen.queryByTestId('content3')).not.toBeInTheDocument(); // Should be restricted
      expect(renderTime).toBeLessThan(200); // Should render multiple components in less than 200ms
    });

    it('should render multiple PlanLimitAlerts efficiently', () => {
      const startTime = performance.now();
      
      render(
        <PlanSystemProvider>
          <PlanLimitAlert limitType="productos" />
          <PlanLimitAlert limitType="usuarios" />
          <PlanLimitAlert limitType="sucursales" />
          <PlanLimitAlert limitType="transacciones" />
          <PlanLimitAlert limitType="almacenamiento" />
        </PlanSystemProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(screen.getByText('Límite de Productos')).toBeInTheDocument();
      expect(screen.getByText('Límite de Usuarios')).toBeInTheDocument();
      expect(screen.getByText('Límite de Sucursales')).toBeInTheDocument();
      expect(screen.getByText('Límite de Transacciones')).toBeInTheDocument();
      expect(screen.getByText('Límite de Almacenamiento')).toBeInTheDocument();
      expect(renderTime).toBeLessThan(300); // Should render 5 components in less than 300ms
    });
  });

  describe('Context Performance', () => {
    it('should provide context efficiently', () => {
      const startTime = performance.now();
      
      const TestComponent = () => {
        const { currentPlan, hasFeature, isLimitExceeded } = usePlanSystem();
        return (
          <div>
            <div data-testid="plan">{currentPlan}</div>
            <div data-testid="feature">{hasFeature('incluye_inventario_basico') ? 'true' : 'false'}</div>
            <div data-testid="limit">{isLimitExceeded('max_productos') ? 'true' : 'false'}</div>
          </div>
        );
      };

      render(
        <PlanSystemProvider>
          <TestComponent />
        </PlanSystemProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(screen.getByTestId('plan')).toHaveTextContent('Profesional');
      expect(screen.getByTestId('feature')).toHaveTextContent('true');
      expect(screen.getByTestId('limit')).toHaveTextContent('false');
      expect(renderTime).toBeLessThan(150); // Should provide context in less than 150ms
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with multiple renders', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Render multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <PlanSystemProvider>
            <PlanFeatureGate feature="incluye_inventario_basico">
              <div>Test {i}</div>
            </PlanFeatureGate>
          </PlanSystemProvider>
        );
        unmount();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });
  });

  describe('Function Call Performance', () => {
    it('should call hasFeature efficiently', () => {
      const TestComponent = () => {
        const { hasFeature } = usePlanSystem();
        
        const startTime = performance.now();
        const result = hasFeature('incluye_inventario_basico');
        const endTime = performance.now();
        
        return (
          <div>
            <div data-testid="result">{result ? 'true' : 'false'}</div>
            <div data-testid="time">{endTime - startTime}</div>
          </div>
        );
      };

      render(
        <PlanSystemProvider>
          <TestComponent />
        </PlanSystemProvider>
      );

      const callTime = parseFloat(screen.getByTestId('time').textContent || '0');
      expect(screen.getByTestId('result')).toHaveTextContent('true');
      expect(callTime).toBeLessThan(1); // Should call in less than 1ms
    });

    it('should call isLimitExceeded efficiently', () => {
      const TestComponent = () => {
        const { isLimitExceeded } = usePlanSystem();
        
        const startTime = performance.now();
        const result = isLimitExceeded('max_productos');
        const endTime = performance.now();
        
        return (
          <div>
            <div data-testid="result">{result ? 'true' : 'false'}</div>
            <div data-testid="time">{endTime - startTime}</div>
          </div>
        );
      };

      render(
        <PlanSystemProvider>
          <TestComponent />
        </PlanSystemProvider>
      );

      const callTime = parseFloat(screen.getByTestId('time').textContent || '0');
      expect(screen.getByTestId('result')).toHaveTextContent('false');
      expect(callTime).toBeLessThan(1); // Should call in less than 1ms
    });
  });

  describe('Large Dataset Performance', () => {
    it('should handle large feature lists efficiently', () => {
      const largeFeatureList = Array.from({ length: 100 }, (_, i) => `feature_${i}`);
      
      const TestComponent = () => {
        const { hasFeature } = usePlanSystem();
        
        const startTime = performance.now();
        const results = largeFeatureList.map(feature => hasFeature(feature));
        const endTime = performance.now();
        
        return (
          <div>
            <div data-testid="count">{results.length}</div>
            <div data-testid="time">{endTime - startTime}</div>
          </div>
        );
      };

      render(
        <PlanSystemProvider>
          <TestComponent />
        </PlanSystemProvider>
      );

      const callTime = parseFloat(screen.getByTestId('time').textContent || '0');
      expect(screen.getByTestId('count')).toHaveTextContent('100');
      expect(callTime).toBeLessThan(10); // Should handle 100 calls in less than 10ms
    });
  });
});
