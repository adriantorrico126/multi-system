import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlanSystemProvider } from '@/context/PlanSystemContext';
import { InventarioBasicoFeatureGate, InventarioAvanzadoFeatureGate, EgresosFeatureGate } from '@/components/plans';

// Mock de los hooks
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id_restaurante: 1,
      rol: 'admin'
    }
  })
}));

// Mock para plan básico
const mockPlanBasico = {
  planInfo: {
    plan: {
      id: 1,
      nombre: 'Básico',
      precio_mensual: 20,
      descripcion: 'Plan Básico',
      funcionalidades: {
        incluye_pos: true,
        incluye_inventario_basico: false,
        incluye_inventario_avanzado: false,
        incluye_egresos: false,
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
      incluye_inventario_basico: false,
      incluye_inventario_avanzado: false,
      incluye_egresos: false,
      incluye_egresos_avanzados: false,
      incluye_reportes_avanzados: false
    };
    return features[feature] || false;
  }),
  checkFeatureAccess: jest.fn((feature: string) => ({
    hasAccess: false,
    reason: 'Feature not available in current plan',
    requiredPlan: 'Profesional',
    currentPlan: 'Básico'
  })),
  canUseFeature: jest.fn(() => false),
  getCurrentPlan: jest.fn(() => 'Básico'),
  getPlanFeatures: jest.fn(() => ({
    incluye_pos: true,
    incluye_inventario_basico: false,
    incluye_inventario_avanzado: false,
    incluye_egresos: false,
    incluye_egresos_avanzados: false,
    incluye_reportes_avanzados: false
  })),
  isPlanActive: jest.fn(() => true),
  isPlanExpired: jest.fn(() => false),
  isPlanSuspended: jest.fn(() => false),
  getDaysUntilExpiration: jest.fn(() => 30),
  refreshData: jest.fn()
};

// Mock para plan profesional
const mockPlanProfesional = {
  ...mockPlanBasico,
  planInfo: {
    ...mockPlanBasico.planInfo,
    plan: {
      ...mockPlanBasico.planInfo.plan,
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
    }
  },
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
  }))
};

// Mock para plan avanzado
const mockPlanAvanzado = {
  ...mockPlanProfesional,
  planInfo: {
    ...mockPlanProfesional.planInfo,
    plan: {
      ...mockPlanProfesional.planInfo.plan,
      nombre: 'Avanzado',
      precio_mensual: 100,
      descripcion: 'Plan Avanzado',
      funcionalidades: {
        incluye_pos: true,
        incluye_inventario_basico: true,
        incluye_inventario_avanzado: true,
        incluye_egresos: true,
        incluye_egresos_avanzados: true,
        incluye_reportes_avanzados: true
      }
    }
  },
  hasFeature: jest.fn((feature: string) => {
    const features: { [key: string]: boolean } = {
      incluye_pos: true,
      incluye_inventario_basico: true,
      incluye_inventario_avanzado: true,
      incluye_egresos: true,
      incluye_egresos_avanzados: true,
      incluye_reportes_avanzados: true
    };
    return features[feature] || false;
  }),
  getCurrentPlan: jest.fn(() => 'Avanzado'),
  getPlanFeatures: jest.fn(() => ({
    incluye_pos: true,
    incluye_inventario_basico: true,
    incluye_inventario_avanzado: true,
    incluye_egresos: true,
    incluye_egresos_avanzados: true,
    incluye_reportes_avanzados: true
  }))
};

// Mock de usePlanLimits
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

// Mock de usePlanAlerts
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

describe('Plan Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Plan Básico', () => {
    beforeEach(() => {
      jest.mocked(require('@/hooks/usePlanFeaturesNew').usePlanFeaturesNew).mockReturnValue(mockPlanBasico);
    });

    it('should restrict inventario básico in plan básico', () => {
      render(
        <PlanSystemProvider>
          <InventarioBasicoFeatureGate>
            <div data-testid="inventario-basico">Inventario Básico</div>
          </InventarioBasicoFeatureGate>
        </PlanSystemProvider>
      );

      expect(screen.queryByTestId('inventario-basico')).not.toBeInTheDocument();
      expect(screen.getByText('Funcionalidad No Disponible')).toBeInTheDocument();
      expect(screen.getByText('Actualizar a Profesional')).toBeInTheDocument();
    });

    it('should restrict inventario avanzado in plan básico', () => {
      render(
        <PlanSystemProvider>
          <InventarioAvanzadoFeatureGate>
            <div data-testid="inventario-avanzado">Inventario Avanzado</div>
          </InventarioAvanzadoFeatureGate>
        </PlanSystemProvider>
      );

      expect(screen.queryByTestId('inventario-avanzado')).not.toBeInTheDocument();
      expect(screen.getByText('Funcionalidad No Disponible')).toBeInTheDocument();
    });

    it('should restrict egresos in plan básico', () => {
      render(
        <PlanSystemProvider>
          <EgresosFeatureGate>
            <div data-testid="egresos">Egresos</div>
          </EgresosFeatureGate>
        </PlanSystemProvider>
      );

      expect(screen.queryByTestId('egresos')).not.toBeInTheDocument();
      expect(screen.getByText('Funcionalidad No Disponible')).toBeInTheDocument();
    });
  });

  describe('Plan Profesional', () => {
    beforeEach(() => {
      jest.mocked(require('@/hooks/usePlanFeaturesNew').usePlanFeaturesNew).mockReturnValue(mockPlanProfesional);
    });

    it('should allow inventario básico in plan profesional', () => {
      render(
        <PlanSystemProvider>
          <InventarioBasicoFeatureGate>
            <div data-testid="inventario-basico">Inventario Básico</div>
          </InventarioBasicoFeatureGate>
        </PlanSystemProvider>
      );

      expect(screen.getByTestId('inventario-basico')).toBeInTheDocument();
      expect(screen.queryByText('Funcionalidad No Disponible')).not.toBeInTheDocument();
    });

    it('should restrict inventario avanzado in plan profesional', () => {
      render(
        <PlanSystemProvider>
          <InventarioAvanzadoFeatureGate>
            <div data-testid="inventario-avanzado">Inventario Avanzado</div>
          </InventarioAvanzadoFeatureGate>
        </PlanSystemProvider>
      );

      expect(screen.queryByTestId('inventario-avanzado')).not.toBeInTheDocument();
      expect(screen.getByText('Funcionalidad No Disponible')).toBeInTheDocument();
    });

    it('should allow egresos in plan profesional', () => {
      render(
        <PlanSystemProvider>
          <EgresosFeatureGate>
            <div data-testid="egresos">Egresos</div>
          </EgresosFeatureGate>
        </PlanSystemProvider>
      );

      expect(screen.getByTestId('egresos')).toBeInTheDocument();
      expect(screen.queryByText('Funcionalidad No Disponible')).not.toBeInTheDocument();
    });
  });

  describe('Plan Avanzado', () => {
    beforeEach(() => {
      jest.mocked(require('@/hooks/usePlanFeaturesNew').usePlanFeaturesNew).mockReturnValue(mockPlanAvanzado);
    });

    it('should allow all features in plan avanzado', () => {
      render(
        <PlanSystemProvider>
          <InventarioBasicoFeatureGate>
            <div data-testid="inventario-basico">Inventario Básico</div>
          </InventarioBasicoFeatureGate>
          <InventarioAvanzadoFeatureGate>
            <div data-testid="inventario-avanzado">Inventario Avanzado</div>
          </InventarioAvanzadoFeatureGate>
          <EgresosFeatureGate>
            <div data-testid="egresos">Egresos</div>
          </EgresosFeatureGate>
        </PlanSystemProvider>
      );

      expect(screen.getByTestId('inventario-basico')).toBeInTheDocument();
      expect(screen.getByTestId('inventario-avanzado')).toBeInTheDocument();
      expect(screen.getByTestId('egresos')).toBeInTheDocument();
      expect(screen.queryByText('Funcionalidad No Disponible')).not.toBeInTheDocument();
    });
  });

  describe('Upgrade Flow', () => {
    beforeEach(() => {
      jest.mocked(require('@/hooks/usePlanFeaturesNew').usePlanFeaturesNew).mockReturnValue(mockPlanBasico);
    });

    it('should show upgrade button and handle click', () => {
      const mockOnUpgrade = jest.fn();
      
      render(
        <PlanSystemProvider>
          <InventarioBasicoFeatureGate onUpgrade={mockOnUpgrade}>
            <div data-testid="inventario-basico">Inventario Básico</div>
          </InventarioBasicoFeatureGate>
        </PlanSystemProvider>
      );

      const upgradeButton = screen.getByText('Actualizar a Profesional');
      expect(upgradeButton).toBeInTheDocument();

      fireEvent.click(upgradeButton);
      expect(mockOnUpgrade).toHaveBeenCalledTimes(1);
    });
  });
});
