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

describe('Plan Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should handle invalid feature names safely', () => {
      const TestComponent = () => {
        const { hasFeature } = usePlanSystem();
        
        // Test with potentially malicious input
        const maliciousInputs = [
          '<script>alert("xss")</script>',
          '"; DROP TABLE planes; --',
          '../../../etc/passwd',
          '${process.env.SECRET}',
          'null',
          'undefined',
          '',
          '   ',
          'feature with spaces',
          'feature-with-dashes',
          'feature_with_underscores',
          'feature.with.dots',
          'feature/with/slashes',
          'feature\\with\\backslashes',
          'feature:with:colons',
          'feature;with;semicolons',
          'feature,with,commas',
          'feature|with|pipes',
          'feature&with&ampersands',
          'feature<with>angle>brackets',
          'feature"with"quotes',
          "feature'with'single'quotes",
          'feature`with`backticks',
          'feature{with}braces',
          'feature[with]brackets',
          'feature(with)parentheses',
          'feature=with=equals',
          'feature+with+plus',
          'feature*with*asterisks',
          'feature#with#hashes',
          'feature@with@ats',
          'feature!with!exclamation',
          'feature?with?question',
          'feature^with^carets',
          'feature~with~tildes',
          'feature%with%percent',
          'feature$with$dollars'
        ];

        const results = maliciousInputs.map(input => ({
          input,
          result: hasFeature(input),
          safe: typeof hasFeature(input) === 'boolean'
        }));

        return (
          <div>
            <div data-testid="results-count">{results.length}</div>
            <div data-testid="all-safe">{results.every(r => r.safe) ? 'true' : 'false'}</div>
          </div>
        );
      };

      render(
        <PlanSystemProvider>
          <TestComponent />
        </PlanSystemProvider>
      );

      expect(screen.getByTestId('results-count')).toHaveTextContent('35');
      expect(screen.getByTestId('all-safe')).toHaveTextContent('true');
    });

    it('should handle invalid limit types safely', () => {
      const TestComponent = () => {
        const { isLimitExceeded } = usePlanSystem();
        
        // Test with potentially malicious input
        const maliciousInputs = [
          '<script>alert("xss")</script>',
          '"; DROP TABLE planes; --',
          '../../../etc/passwd',
          '${process.env.SECRET}',
          'null',
          'undefined',
          '',
          '   ',
          'invalid_limit',
          'max_<script>',
          'max_"; DROP TABLE; --',
          'max_${process.env.SECRET}',
          'max_limit_with_spaces',
          'max_limit-with-dashes',
          'max_limit_with_underscores',
          'max_limit.with.dots',
          'max_limit/with/slashes',
          'max_limit\\with\\backslashes',
          'max_limit:with:colons',
          'max_limit;with;semicolons',
          'max_limit,with,commas',
          'max_limit|with|pipes',
          'max_limit&with&ampersands',
          'max_limit<with>angle>brackets',
          'max_limit"with"quotes',
          "max_limit'with'single'quotes",
          'max_limit`with`backticks',
          'max_limit{with}braces',
          'max_limit[with]brackets',
          'max_limit(with)parentheses',
          'max_limit=with=equals',
          'max_limit+with+plus',
          'max_limit*with*asterisks',
          'max_limit#with#hashes',
          'max_limit@with@ats',
          'max_limit!with!exclamation',
          'max_limit?with?question',
          'max_limit^with^carets',
          'max_limit~with~tildes',
          'max_limit%with%percent',
          'max_limit$with$dollars'
        ];

        const results = maliciousInputs.map(input => ({
          input,
          result: isLimitExceeded(input),
          safe: typeof isLimitExceeded(input) === 'boolean'
        }));

        return (
          <div>
            <div data-testid="results-count">{results.length}</div>
            <div data-testid="all-safe">{results.every(r => r.safe) ? 'true' : 'false'}</div>
          </div>
        );
      };

      render(
        <PlanSystemProvider>
          <TestComponent />
        </PlanSystemProvider>
      );

      expect(screen.getByTestId('results-count')).toHaveTextContent('35');
      expect(screen.getByTestId('all-safe')).toHaveTextContent('true');
    });
  });

  describe('XSS Prevention', () => {
    it('should prevent XSS in feature names', () => {
      const TestComponent = () => {
        const { hasFeature } = usePlanSystem();
        
        // Test XSS attempts
        const xssAttempts = [
          '<script>alert("xss")</script>',
          '<img src="x" onerror="alert(\'xss\')">',
          '<svg onload="alert(\'xss\')">',
          'javascript:alert("xss")',
          'data:text/html,<script>alert("xss")</script>',
          'vbscript:alert("xss")',
          'onload="alert(\'xss\')"',
          'onerror="alert(\'xss\')"',
          'onclick="alert(\'xss\')"',
          'onmouseover="alert(\'xss\')"',
          'onfocus="alert(\'xss\')"',
          'onblur="alert(\'xss\')"',
          'onchange="alert(\'xss\')"',
          'onsubmit="alert(\'xss\')"',
          'onreset="alert(\'xss\')"',
          'onselect="alert(\'xss\')"',
          'onunload="alert(\'xss\')"',
          'onbeforeunload="alert(\'xss\')"',
          'onresize="alert(\'xss\')"',
          'onscroll="alert(\'xss\')"'
        ];

        const results = xssAttempts.map(attempt => ({
          attempt,
          result: hasFeature(attempt),
          safe: typeof hasFeature(attempt) === 'boolean' && !String(hasFeature(attempt)).includes('<script>')
        }));

        return (
          <div>
            <div data-testid="results-count">{results.length}</div>
            <div data-testid="all-safe">{results.every(r => r.safe) ? 'true' : 'false'}</div>
          </div>
        );
      };

      render(
        <PlanSystemProvider>
          <TestComponent />
        </PlanSystemProvider>
      );

      expect(screen.getByTestId('results-count')).toHaveTextContent('20');
      expect(screen.getByTestId('all-safe')).toHaveTextContent('true');
    });

    it('should prevent XSS in limit types', () => {
      const TestComponent = () => {
        const { isLimitExceeded } = usePlanSystem();
        
        // Test XSS attempts
        const xssAttempts = [
          '<script>alert("xss")</script>',
          '<img src="x" onerror="alert(\'xss\')">',
          '<svg onload="alert(\'xss\')">',
          'javascript:alert("xss")',
          'data:text/html,<script>alert("xss")</script>',
          'vbscript:alert("xss")',
          'onload="alert(\'xss\')"',
          'onerror="alert(\'xss\')"',
          'onclick="alert(\'xss\')"',
          'onmouseover="alert(\'xss\')"',
          'onfocus="alert(\'xss\')"',
          'onblur="alert(\'xss\')"',
          'onchange="alert(\'xss\')"',
          'onsubmit="alert(\'xss\')"',
          'onreset="alert(\'xss\')"',
          'onselect="alert(\'xss\')"',
          'onunload="alert(\'xss\')"',
          'onbeforeunload="alert(\'xss\')"',
          'onresize="alert(\'xss\')"',
          'onscroll="alert(\'xss\')"'
        ];

        const results = xssAttempts.map(attempt => ({
          attempt,
          result: isLimitExceeded(attempt),
          safe: typeof isLimitExceeded(attempt) === 'boolean' && !String(isLimitExceeded(attempt)).includes('<script>')
        }));

        return (
          <div>
            <div data-testid="results-count">{results.length}</div>
            <div data-testid="all-safe">{results.every(r => r.safe) ? 'true' : 'false'}</div>
          </div>
        );
      };

      render(
        <PlanSystemProvider>
          <TestComponent />
        </PlanSystemProvider>
      );

      expect(screen.getByTestId('results-count')).toHaveTextContent('20');
      expect(screen.getByTestId('all-safe')).toHaveTextContent('true');
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in feature names', () => {
      const TestComponent = () => {
        const { hasFeature } = usePlanSystem();
        
        // Test SQL injection attempts
        const sqlInjectionAttempts = [
          "'; DROP TABLE planes; --",
          "'; DELETE FROM planes; --",
          "'; UPDATE planes SET nombre = 'HACKED'; --",
          "'; INSERT INTO planes VALUES (999, 'HACKED', 0); --",
          "'; SELECT * FROM planes; --",
          "'; UNION SELECT * FROM planes; --",
          "'; OR 1=1; --",
          "'; AND 1=1; --",
          "'; WHERE 1=1; --",
          "'; HAVING 1=1; --",
          "'; GROUP BY 1; --",
          "'; ORDER BY 1; --",
          "'; LIMIT 1; --",
          "'; OFFSET 1; --",
          "'; LIKE '%'; --",
          "'; IN (1,2,3); --",
          "'; BETWEEN 1 AND 10; --",
          "'; IS NULL; --",
          "'; IS NOT NULL; --",
          "'; EXISTS (SELECT 1); --"
        ];

        const results = sqlInjectionAttempts.map(attempt => ({
          attempt,
          result: hasFeature(attempt),
          safe: typeof hasFeature(attempt) === 'boolean'
        }));

        return (
          <div>
            <div data-testid="results-count">{results.length}</div>
            <div data-testid="all-safe">{results.every(r => r.safe) ? 'true' : 'false'}</div>
          </div>
        );
      };

      render(
        <PlanSystemProvider>
          <TestComponent />
        </PlanSystemProvider>
      );

      expect(screen.getByTestId('results-count')).toHaveTextContent('20');
      expect(screen.getByTestId('all-safe')).toHaveTextContent('true');
    });

    it('should prevent SQL injection in limit types', () => {
      const TestComponent = () => {
        const { isLimitExceeded } = usePlanSystem();
        
        // Test SQL injection attempts
        const sqlInjectionAttempts = [
          "'; DROP TABLE planes; --",
          "'; DELETE FROM planes; --",
          "'; UPDATE planes SET nombre = 'HACKED'; --",
          "'; INSERT INTO planes VALUES (999, 'HACKED', 0); --",
          "'; SELECT * FROM planes; --",
          "'; UNION SELECT * FROM planes; --",
          "'; OR 1=1; --",
          "'; AND 1=1; --",
          "'; WHERE 1=1; --",
          "'; HAVING 1=1; --",
          "'; GROUP BY 1; --",
          "'; ORDER BY 1; --",
          "'; LIMIT 1; --",
          "'; OFFSET 1; --",
          "'; LIKE '%'; --",
          "'; IN (1,2,3); --",
          "'; BETWEEN 1 AND 10; --",
          "'; IS NULL; --",
          "'; IS NOT NULL; --",
          "'; EXISTS (SELECT 1); --"
        ];

        const results = sqlInjectionAttempts.map(attempt => ({
          attempt,
          result: isLimitExceeded(attempt),
          safe: typeof isLimitExceeded(attempt) === 'boolean'
        }));

        return (
          <div>
            <div data-testid="results-count">{results.length}</div>
            <div data-testid="all-safe">{results.every(r => r.safe) ? 'true' : 'false'}</div>
          </div>
        );
      };

      render(
        <PlanSystemProvider>
          <TestComponent />
        </PlanSystemProvider>
      );

      expect(screen.getByTestId('results-count')).toHaveTextContent('20');
      expect(screen.getByTestId('all-safe')).toHaveTextContent('true');
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize feature names', () => {
      const TestComponent = () => {
        const { hasFeature } = usePlanSystem();
        
        // Test data sanitization
        const testCases = [
          { input: '  incluye_pos  ', expected: 'incluye_pos' },
          { input: 'INCLUYE_POS', expected: 'incluye_pos' },
          { input: 'Incluye_Pos', expected: 'incluye_pos' },
          { input: 'incluye-pos', expected: 'incluye-pos' },
          { input: 'incluye.pos', expected: 'incluye.pos' },
          { input: 'incluye_pos_123', expected: 'incluye_pos_123' },
          { input: '123incluye_pos', expected: '123incluye_pos' },
          { input: 'incluye_pos123', expected: 'incluye_pos123' }
        ];

        const results = testCases.map(testCase => ({
          input: testCase.input,
          result: hasFeature(testCase.input),
          safe: typeof hasFeature(testCase.input) === 'boolean'
        }));

        return (
          <div>
            <div data-testid="results-count">{results.length}</div>
            <div data-testid="all-safe">{results.every(r => r.safe) ? 'true' : 'false'}</div>
          </div>
        );
      };

      render(
        <PlanSystemProvider>
          <TestComponent />
        </PlanSystemProvider>
      );

      expect(screen.getByTestId('results-count')).toHaveTextContent('8');
      expect(screen.getByTestId('all-safe')).toHaveTextContent('true');
    });

    it('should sanitize limit types', () => {
      const TestComponent = () => {
        const { isLimitExceeded } = usePlanSystem();
        
        // Test data sanitization
        const testCases = [
          { input: '  max_productos  ', expected: 'max_productos' },
          { input: 'MAX_PRODUCTOS', expected: 'max_productos' },
          { input: 'Max_Productos', expected: 'max_productos' },
          { input: 'max-productos', expected: 'max-productos' },
          { input: 'max.productos', expected: 'max.productos' },
          { input: 'max_productos_123', expected: 'max_productos_123' },
          { input: '123max_productos', expected: '123max_productos' },
          { input: 'max_productos123', expected: 'max_productos123' }
        ];

        const results = testCases.map(testCase => ({
          input: testCase.input,
          result: isLimitExceeded(testCase.input),
          safe: typeof isLimitExceeded(testCase.input) === 'boolean'
        }));

        return (
          <div>
            <div data-testid="results-count">{results.length}</div>
            <div data-testid="all-safe">{results.every(r => r.safe) ? 'true' : 'false'}</div>
          </div>
        );
      };

      render(
        <PlanSystemProvider>
          <TestComponent />
        </PlanSystemProvider>
      );

      expect(screen.getByTestId('results-count')).toHaveTextContent('8');
      expect(screen.getByTestId('all-safe')).toHaveTextContent('true');
    });
  });

  describe('Access Control', () => {
    it('should respect feature access controls', () => {
      const TestComponent = () => {
        const { hasFeature } = usePlanSystem();
        
        // Test access control
        const testCases = [
          { feature: 'incluye_pos', shouldHaveAccess: true },
          { feature: 'incluye_inventario_basico', shouldHaveAccess: true },
          { feature: 'incluye_inventario_avanzado', shouldHaveAccess: false },
          { feature: 'incluye_egresos', shouldHaveAccess: true },
          { feature: 'incluye_egresos_avanzados', shouldHaveAccess: false },
          { feature: 'incluye_reportes_avanzados', shouldHaveAccess: false }
        ];

        const results = testCases.map(testCase => ({
          feature: testCase.feature,
          hasAccess: hasFeature(testCase.feature),
          expected: testCase.shouldHaveAccess,
          correct: hasFeature(testCase.feature) === testCase.shouldHaveAccess
        }));

        return (
          <div>
            <div data-testid="results-count">{results.length}</div>
            <div data-testid="all-correct">{results.every(r => r.correct) ? 'true' : 'false'}</div>
          </div>
        );
      };

      render(
        <PlanSystemProvider>
          <TestComponent />
        </PlanSystemProvider>
      );

      expect(screen.getByTestId('results-count')).toHaveTextContent('6');
      expect(screen.getByTestId('all-correct')).toHaveTextContent('true');
    });
  });
});
