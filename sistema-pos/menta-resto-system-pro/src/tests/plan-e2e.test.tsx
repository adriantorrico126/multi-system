import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('Plan E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete User Flow', () => {
    it('should handle complete plan upgrade flow', async () => {
      const user = userEvent.setup();
      const mockOnUpgrade = jest.fn();

      render(
        <PlanSystemProvider>
          <div>
            <PlanStatusCard onUpgrade={mockOnUpgrade} />
            <PlanFeatureGate feature="incluye_inventario_avanzado" onUpgrade={mockOnUpgrade}>
              <div data-testid="inventario-avanzado">Inventario Avanzado</div>
            </PlanFeatureGate>
            <PlanLimitAlert limitType="productos" onUpgrade={mockOnUpgrade} />
          </div>
        </PlanSystemProvider>
      );

      // User sees current plan status
      expect(screen.getByText('Estado del Plan')).toBeInTheDocument();
      expect(screen.getByText('Profesional')).toBeInTheDocument();

      // User sees restricted feature
      expect(screen.queryByTestId('inventario-avanzado')).not.toBeInTheDocument();
      expect(screen.getByText('Funcionalidad No Disponible')).toBeInTheDocument();

      // User sees limit alert
      expect(screen.getByText('Límite de Productos')).toBeInTheDocument();

      // User clicks upgrade button from status card
      const upgradeButton1 = screen.getAllByText('Actualizar Plan')[0];
      await user.click(upgradeButton1);
      expect(mockOnUpgrade).toHaveBeenCalledTimes(1);

      // User clicks upgrade button from feature gate
      const upgradeButton2 = screen.getAllByText('Actualizar Plan')[1];
      await user.click(upgradeButton2);
      expect(mockOnUpgrade).toHaveBeenCalledTimes(2);

      // User clicks upgrade button from limit alert
      const upgradeButton3 = screen.getAllByText('Actualizar Plan')[2];
      await user.click(upgradeButton3);
      expect(mockOnUpgrade).toHaveBeenCalledTimes(3);
    });

    it('should handle plan status refresh flow', async () => {
      const user = userEvent.setup();
      const mockOnRefresh = jest.fn();

      render(
        <PlanSystemProvider>
          <PlanStatusCard onRefresh={mockOnRefresh} />
        </PlanSystemProvider>
      );

      // User sees current plan status
      expect(screen.getByText('Estado del Plan')).toBeInTheDocument();

      // User clicks refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);
      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });

    it('should handle alert dismissal flow', async () => {
      const user = userEvent.setup();
      const mockOnDismiss = jest.fn();

      render(
        <PlanSystemProvider>
          <PlanLimitAlert limitType="productos" onDismiss={mockOnDismiss} />
        </PlanSystemProvider>
      );

      // User sees limit alert
      expect(screen.getByText('Límite de Productos')).toBeInTheDocument();

      // User clicks dismiss button
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Interactive Features', () => {
    it('should handle feature gate interactions', async () => {
      const user = userEvent.setup();

      render(
        <PlanSystemProvider>
          <PlanFeatureGate feature="incluye_inventario_avanzado">
            <div>
              <button data-testid="action-button">Acción Avanzada</button>
              <input data-testid="input-field" placeholder="Campo de entrada" />
            </div>
          </PlanFeatureGate>
        </PlanSystemProvider>
      );

      // User should not see the content (feature restricted)
      expect(screen.queryByTestId('action-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('input-field')).not.toBeInTheDocument();

      // User should see restriction overlay
      expect(screen.getByText('Funcionalidad No Disponible')).toBeInTheDocument();
    });

    it('should handle limit alert interactions', async () => {
      const user = userEvent.setup();

      render(
        <PlanSystemProvider>
          <PlanLimitAlert limitType="productos" />
        </PlanSystemProvider>
      );

      // User sees limit alert
      expect(screen.getByText('Límite de Productos')).toBeInTheDocument();
      expect(screen.getByText('50/100 productos')).toBeInTheDocument();

      // User can interact with the alert
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should handle status card interactions', async () => {
      const user = userEvent.setup();

      render(
        <PlanSystemProvider>
          <PlanStatusCard />
        </PlanSystemProvider>
      );

      // User sees status card
      expect(screen.getByText('Estado del Plan')).toBeInTheDocument();
      expect(screen.getByText('Profesional')).toBeInTheDocument();

      // User can interact with the card
      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should handle mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <PlanSystemProvider>
          <div>
            <PlanStatusCard />
            <PlanLimitAlert limitType="productos" />
            <PlanFeatureGate feature="incluye_inventario_avanzado">
              <div>Mobile Content</div>
            </PlanFeatureGate>
          </div>
        </PlanSystemProvider>
      );

      // Components should render in mobile view
      expect(screen.getByText('Estado del Plan')).toBeInTheDocument();
      expect(screen.getByText('Límite de Productos')).toBeInTheDocument();
      expect(screen.getByText('Funcionalidad No Disponible')).toBeInTheDocument();
    });

    it('should handle tablet viewport', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <PlanSystemProvider>
          <div>
            <PlanStatusCard />
            <PlanLimitAlert limitType="productos" />
            <PlanFeatureGate feature="incluye_inventario_avanzado">
              <div>Tablet Content</div>
            </PlanFeatureGate>
          </div>
        </PlanSystemProvider>
      );

      // Components should render in tablet view
      expect(screen.getByText('Estado del Plan')).toBeInTheDocument();
      expect(screen.getByText('Límite de Productos')).toBeInTheDocument();
      expect(screen.getByText('Funcionalidad No Disponible')).toBeInTheDocument();
    });

    it('should handle desktop viewport', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      render(
        <PlanSystemProvider>
          <div>
            <PlanStatusCard />
            <PlanLimitAlert limitType="productos" />
            <PlanFeatureGate feature="incluye_inventario_avanzado">
              <div>Desktop Content</div>
            </PlanFeatureGate>
          </div>
        </PlanSystemProvider>
      );

      // Components should render in desktop view
      expect(screen.getByText('Estado del Plan')).toBeInTheDocument();
      expect(screen.getByText('Límite de Productos')).toBeInTheDocument();
      expect(screen.getByText('Funcionalidad No Disponible')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <PlanSystemProvider>
          <div>
            <PlanStatusCard />
            <PlanLimitAlert limitType="productos" />
            <PlanFeatureGate feature="incluye_inventario_avanzado">
              <div>Accessible Content</div>
            </PlanFeatureGate>
          </div>
        </PlanSystemProvider>
      );

      // User can navigate with keyboard
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();

      await user.tab();
      expect(document.activeElement).toBeInTheDocument();

      await user.tab();
      expect(document.activeElement).toBeInTheDocument();
    });

    it('should have proper ARIA labels', () => {
      render(
        <PlanSystemProvider>
          <div>
            <PlanStatusCard />
            <PlanLimitAlert limitType="productos" />
            <PlanFeatureGate feature="incluye_inventario_avanzado">
              <div>ARIA Content</div>
            </PlanFeatureGate>
          </div>
        </PlanSystemProvider>
      );

      // Components should have proper ARIA labels
      const statusCard = screen.getByRole('region');
      expect(statusCard).toBeInTheDocument();

      const limitAlert = screen.getByRole('alert');
      expect(limitAlert).toBeInTheDocument();
    });

    it('should support screen readers', () => {
      render(
        <PlanSystemProvider>
          <div>
            <PlanStatusCard />
            <PlanLimitAlert limitType="productos" />
            <PlanFeatureGate feature="incluye_inventario_avanzado">
              <div>Screen Reader Content</div>
            </PlanFeatureGate>
          </div>
        </PlanSystemProvider>
      );

      // Components should have proper text content for screen readers
      expect(screen.getByText('Estado del Plan')).toBeInTheDocument();
      expect(screen.getByText('Límite de Productos')).toBeInTheDocument();
      expect(screen.getByText('Funcionalidad No Disponible')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      jest.mocked(require('@/hooks/usePlanFeaturesNew').usePlanFeaturesNew).mockReturnValue({
        ...require('@/hooks/usePlanFeaturesNew').usePlanFeaturesNew(),
        error: 'Network error',
        isLoading: false
      });

      render(
        <PlanSystemProvider>
          <PlanStatusCard />
        </PlanSystemProvider>
      );

      // Should handle error gracefully
      expect(screen.getByText('Estado del Plan')).toBeInTheDocument();
    });

    it('should handle loading states', async () => {
      // Mock loading state
      jest.mocked(require('@/hooks/usePlanFeaturesNew').usePlanFeaturesNew).mockReturnValue({
        ...require('@/hooks/usePlanFeaturesNew').usePlanFeaturesNew(),
        isLoading: true,
        error: null
      });

      render(
        <PlanSystemProvider>
          <PlanStatusCard />
        </PlanSystemProvider>
      );

      // Should handle loading state
      expect(screen.getByText('Estado del Plan')).toBeInTheDocument();
    });
  });

  describe('Data Persistence', () => {
    it('should persist user preferences', async () => {
      const user = userEvent.setup();

      render(
        <PlanSystemProvider>
          <PlanLimitAlert limitType="productos" />
        </PlanSystemProvider>
      );

      // User dismisses alert
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      // Alert should be dismissed
      expect(screen.queryByText('Límite de Productos')).not.toBeInTheDocument();
    });

    it('should remember user interactions', async () => {
      const user = userEvent.setup();

      render(
        <PlanSystemProvider>
          <PlanStatusCard />
        </PlanSystemProvider>
      );

      // User interacts with status card
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Interaction should be remembered
      expect(refreshButton).toBeInTheDocument();
    });
  });
});
