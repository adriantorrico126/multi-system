import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PlanSystemProvider } from '@/context/PlanSystemContext';
import { PlanLimitAlert } from '@/components/plans';

// Mock de los hooks
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id_restaurante: 1,
      rol: 'admin'
    }
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
    hasFeature: jest.fn(() => true),
    checkFeatureAccess: jest.fn(() => ({
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

describe('Plan Limits Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Normal Usage', () => {
    beforeEach(() => {
      jest.mocked(require('@/hooks/usePlanLimits').usePlanLimits).mockReturnValue({
        planInfo: null,
        isLoading: false,
        error: null,
        isLimitExceeded: jest.fn(() => false),
        canAddResource: jest.fn(() => true),
        getRemainingLimit: jest.fn(() => 100),
        getUsagePercentage: jest.fn(() => 50),
        getSucursalesInfo: jest.fn(() => ({ 
          current: 1, 
          max: 5, 
          remaining: 4, 
          percentage: 20, 
          unlimited: false, 
          exceeded: false 
        })),
        getUsuariosInfo: jest.fn(() => ({ 
          current: 2, 
          max: 10, 
          remaining: 8, 
          percentage: 20, 
          unlimited: false, 
          exceeded: false 
        })),
        getProductosInfo: jest.fn(() => ({ 
          current: 50, 
          max: 100, 
          remaining: 50, 
          percentage: 50, 
          unlimited: false, 
          exceeded: false 
        })),
        getTransaccionesInfo: jest.fn(() => ({ 
          current: 100, 
          max: 1000, 
          remaining: 900, 
          percentage: 10, 
          unlimited: false, 
          exceeded: false 
        })),
        getAlmacenamientoInfo: jest.fn(() => ({ 
          current: 1, 
          max: 5, 
          remaining: 4, 
          percentage: 20, 
          unlimited: false, 
          exceeded: false 
        })),
        refreshData: jest.fn(),
        updateUsage: jest.fn()
      });
    });

    it('should show normal usage for productos', () => {
      render(
        <PlanSystemProvider>
          <PlanLimitAlert limitType="productos" />
        </PlanSystemProvider>
      );

      expect(screen.getByText('Límite de Productos')).toBeInTheDocument();
      expect(screen.getByText('50/100 productos')).toBeInTheDocument();
      expect(screen.getByText('50% utilizado')).toBeInTheDocument();
      expect(screen.queryByText('Actualizar Plan')).not.toBeInTheDocument();
    });

    it('should show normal usage for sucursales', () => {
      render(
        <PlanSystemProvider>
          <PlanLimitAlert limitType="sucursales" />
        </PlanSystemProvider>
      );

      expect(screen.getByText('Límite de Sucursales')).toBeInTheDocument();
      expect(screen.getByText('1/5 sucursales')).toBeInTheDocument();
      expect(screen.getByText('20% utilizado')).toBeInTheDocument();
    });

    it('should show normal usage for usuarios', () => {
      render(
        <PlanSystemProvider>
          <PlanLimitAlert limitType="usuarios" />
        </PlanSystemProvider>
      );

      expect(screen.getByText('Límite de Usuarios')).toBeInTheDocument();
      expect(screen.getByText('2/10 usuarios')).toBeInTheDocument();
      expect(screen.getByText('20% utilizado')).toBeInTheDocument();
    });
  });

  describe('High Usage (80-90%)', () => {
    beforeEach(() => {
      jest.mocked(require('@/hooks/usePlanLimits').usePlanLimits).mockReturnValue({
        planInfo: null,
        isLoading: false,
        error: null,
        isLimitExceeded: jest.fn(() => false),
        canAddResource: jest.fn(() => true),
        getRemainingLimit: jest.fn(() => 20),
        getUsagePercentage: jest.fn(() => 85),
        getSucursalesInfo: jest.fn(() => ({ 
          current: 4, 
          max: 5, 
          remaining: 1, 
          percentage: 85, 
          unlimited: false, 
          exceeded: false 
        })),
        getUsuariosInfo: jest.fn(() => ({ 
          current: 8, 
          max: 10, 
          remaining: 2, 
          percentage: 85, 
          unlimited: false, 
          exceeded: false 
        })),
        getProductosInfo: jest.fn(() => ({ 
          current: 85, 
          max: 100, 
          remaining: 15, 
          percentage: 85, 
          unlimited: false, 
          exceeded: false 
        })),
        getTransaccionesInfo: jest.fn(() => ({ 
          current: 850, 
          max: 1000, 
          remaining: 150, 
          percentage: 85, 
          unlimited: false, 
          exceeded: false 
        })),
        getAlmacenamientoInfo: jest.fn(() => ({ 
          current: 4, 
          max: 5, 
          remaining: 1, 
          percentage: 85, 
          unlimited: false, 
          exceeded: false 
        })),
        refreshData: jest.fn(),
        updateUsage: jest.fn()
      });
    });

    it('should show high usage warning for productos', () => {
      render(
        <PlanSystemProvider>
          <PlanLimitAlert limitType="productos" />
        </PlanSystemProvider>
      );

      expect(screen.getByText('Has usado el 85% de tu límite de productos.')).toBeInTheDocument();
      expect(screen.getByText('85/100 productos')).toBeInTheDocument();
      expect(screen.getByText('Actualizar Plan')).toBeInTheDocument();
    });
  });

  describe('Critical Usage (90%+)', () => {
    beforeEach(() => {
      jest.mocked(require('@/hooks/usePlanLimits').usePlanLimits).mockReturnValue({
        planInfo: null,
        isLoading: false,
        error: null,
        isLimitExceeded: jest.fn(() => false),
        canAddResource: jest.fn(() => true),
        getRemainingLimit: jest.fn(() => 5),
        getUsagePercentage: jest.fn(() => 95),
        getSucursalesInfo: jest.fn(() => ({ 
          current: 4, 
          max: 5, 
          remaining: 1, 
          percentage: 95, 
          unlimited: false, 
          exceeded: false 
        })),
        getUsuariosInfo: jest.fn(() => ({ 
          current: 9, 
          max: 10, 
          remaining: 1, 
          percentage: 95, 
          unlimited: false, 
          exceeded: false 
        })),
        getProductosInfo: jest.fn(() => ({ 
          current: 95, 
          max: 100, 
          remaining: 5, 
          percentage: 95, 
          unlimited: false, 
          exceeded: false 
        })),
        getTransaccionesInfo: jest.fn(() => ({ 
          current: 950, 
          max: 1000, 
          remaining: 50, 
          percentage: 95, 
          unlimited: false, 
          exceeded: false 
        })),
        getAlmacenamientoInfo: jest.fn(() => ({ 
          current: 4, 
          max: 5, 
          remaining: 1, 
          percentage: 95, 
          unlimited: false, 
          exceeded: false 
        })),
        refreshData: jest.fn(),
        updateUsage: jest.fn()
      });
    });

    it('should show critical usage warning for productos', () => {
      render(
        <PlanSystemProvider>
          <PlanLimitAlert limitType="productos" />
        </PlanSystemProvider>
      );

      expect(screen.getByText('Estás cerca del límite de productos (95% usado). Considera actualizar tu plan.')).toBeInTheDocument();
      expect(screen.getByText('95/100 productos')).toBeInTheDocument();
      expect(screen.getByText('Actualizar Plan')).toBeInTheDocument();
    });
  });

  describe('Exceeded Limits', () => {
    beforeEach(() => {
      jest.mocked(require('@/hooks/usePlanLimits').usePlanLimits).mockReturnValue({
        planInfo: null,
        isLoading: false,
        error: null,
        isLimitExceeded: jest.fn(() => true),
        canAddResource: jest.fn(() => false),
        getRemainingLimit: jest.fn(() => -10),
        getUsagePercentage: jest.fn(() => 110),
        getSucursalesInfo: jest.fn(() => ({ 
          current: 6, 
          max: 5, 
          remaining: -1, 
          percentage: 110, 
          unlimited: false, 
          exceeded: true 
        })),
        getUsuariosInfo: jest.fn(() => ({ 
          current: 12, 
          max: 10, 
          remaining: -2, 
          percentage: 110, 
          unlimited: false, 
          exceeded: true 
        })),
        getProductosInfo: jest.fn(() => ({ 
          current: 110, 
          max: 100, 
          remaining: -10, 
          percentage: 110, 
          unlimited: false, 
          exceeded: true 
        })),
        getTransaccionesInfo: jest.fn(() => ({ 
          current: 1100, 
          max: 1000, 
          remaining: -100, 
          percentage: 110, 
          unlimited: false, 
          exceeded: true 
        })),
        getAlmacenamientoInfo: jest.fn(() => ({ 
          current: 6, 
          max: 5, 
          remaining: -1, 
          percentage: 110, 
          unlimited: false, 
          exceeded: true 
        })),
        refreshData: jest.fn(),
        updateUsage: jest.fn()
      });
    });

    it('should show exceeded limit for productos', () => {
      render(
        <PlanSystemProvider>
          <PlanLimitAlert limitType="productos" />
        </PlanSystemProvider>
      );

      expect(screen.getByText('Has excedido el límite de productos. No puedes agregar más productos hasta que actualices tu plan.')).toBeInTheDocument();
      expect(screen.getByText('110/100 productos')).toBeInTheDocument();
      expect(screen.getByText('Actualizar Plan')).toBeInTheDocument();
    });
  });

  describe('Unlimited Plans', () => {
    beforeEach(() => {
      jest.mocked(require('@/hooks/usePlanLimits').usePlanLimits).mockReturnValue({
        planInfo: null,
        isLoading: false,
        error: null,
        isLimitExceeded: jest.fn(() => false),
        canAddResource: jest.fn(() => true),
        getRemainingLimit: jest.fn(() => Infinity),
        getUsagePercentage: jest.fn(() => 0),
        getSucursalesInfo: jest.fn(() => ({ 
          current: 10, 
          max: Infinity, 
          remaining: Infinity, 
          percentage: 0, 
          unlimited: true, 
          exceeded: false 
        })),
        getUsuariosInfo: jest.fn(() => ({ 
          current: 50, 
          max: Infinity, 
          remaining: Infinity, 
          percentage: 0, 
          unlimited: true, 
          exceeded: false 
        })),
        getProductosInfo: jest.fn(() => ({ 
          current: 1000, 
          max: Infinity, 
          remaining: Infinity, 
          percentage: 0, 
          unlimited: true, 
          exceeded: false 
        })),
        getTransaccionesInfo: jest.fn(() => ({ 
          current: 10000, 
          max: Infinity, 
          remaining: Infinity, 
          percentage: 0, 
          unlimited: true, 
          exceeded: false 
        })),
        getAlmacenamientoInfo: jest.fn(() => ({ 
          current: 100, 
          max: Infinity, 
          remaining: Infinity, 
          percentage: 0, 
          unlimited: true, 
          exceeded: false 
        })),
        refreshData: jest.fn(),
        updateUsage: jest.fn()
      });
    });

    it('should show unlimited usage for productos', () => {
      render(
        <PlanSystemProvider>
          <PlanLimitAlert limitType="productos" />
        </PlanSystemProvider>
      );

      expect(screen.getByText('Uso normal de productos (0% del límite).')).toBeInTheDocument();
      expect(screen.getByText('1000 productos')).toBeInTheDocument();
      expect(screen.getByText('Ilimitado')).toBeInTheDocument();
      expect(screen.queryByText('Actualizar Plan')).not.toBeInTheDocument();
    });
  });
});
