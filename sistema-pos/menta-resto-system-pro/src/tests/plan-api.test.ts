import { planesSistemaApi, suscripcionesApi, contadoresApi, alertasApi } from '@/services/planesApi';

// Mock de axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

// Mock de la instancia de API
const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
};

// Mock de la instancia de API base
jest.mock('@/services/api', () => ({
  api: mockApi
}));

describe('Plan API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('planesSistemaApi', () => {
    it('should fetch all plans', async () => {
      const mockPlans = [
        {
          id: 1,
          nombre: 'Básico',
          precio_mensual: 20,
          descripcion: 'Plan Básico',
          funcionalidades: {
            incluye_pos: true,
            incluye_inventario_basico: false
          }
        },
        {
          id: 2,
          nombre: 'Profesional',
          precio_mensual: 50,
          descripcion: 'Plan Profesional',
          funcionalidades: {
            incluye_pos: true,
            incluye_inventario_basico: true
          }
        }
      ];

      mockApi.get.mockResolvedValue({ data: mockPlans });

      const result = await planesSistemaApi.getAll();
      
      expect(mockApi.get).toHaveBeenCalledWith('/planes-sistema');
      expect(result).toEqual(mockPlans);
    });

    it('should fetch plan by id', async () => {
      const mockPlan = {
        id: 1,
        nombre: 'Básico',
        precio_mensual: 20,
        descripcion: 'Plan Básico',
        funcionalidades: {
          incluye_pos: true,
          incluye_inventario_basico: false
        }
      };

      mockApi.get.mockResolvedValue({ data: mockPlan });

      const result = await planesSistemaApi.getById(1);
      
      expect(mockApi.get).toHaveBeenCalledWith('/planes-sistema/1');
      expect(result).toEqual(mockPlan);
    });

    it('should validate feature', async () => {
      const mockValidation = {
        hasFeature: true,
        reason: 'Feature available',
        requiredPlan: 'Profesional',
        currentPlan: 'Profesional'
      };

      mockApi.post.mockResolvedValue({ data: mockValidation });

      const result = await planesSistemaApi.validateFeature(1, 'incluye_inventario_basico');
      
      expect(mockApi.post).toHaveBeenCalledWith('/planes-sistema/1/validate-feature', {
        feature: 'incluye_inventario_basico'
      });
      expect(result).toEqual(mockValidation);
    });

    it('should compare plans', async () => {
      const mockComparison = {
        plan1: { id: 1, nombre: 'Básico' },
        plan2: { id: 2, nombre: 'Profesional' },
        differences: [
          { feature: 'incluye_inventario_basico', plan1: false, plan2: true }
        ]
      };

      mockApi.post.mockResolvedValue({ data: mockComparison });

      const result = await planesSistemaApi.comparePlans(1, 2);
      
      expect(mockApi.post).toHaveBeenCalledWith('/planes-sistema/compare', {
        plan1Id: 1,
        plan2Id: 2
      });
      expect(result).toEqual(mockComparison);
    });
  });

  describe('suscripcionesApi', () => {
    it('should fetch subscription by restaurant', async () => {
      const mockSubscription = {
        id: 1,
        id_restaurante: 1,
        id_plan: 2,
        estado: 'activa',
        fecha_inicio: '2024-01-01',
        fecha_fin: '2024-12-31'
      };

      mockApi.get.mockResolvedValue({ data: mockSubscription });

      const result = await suscripcionesApi.getByRestaurant(1);
      
      expect(mockApi.get).toHaveBeenCalledWith('/suscripciones-sistema/restaurant/1');
      expect(result).toEqual(mockSubscription);
    });

    it('should create subscription', async () => {
      const mockNewSubscription = {
        id_restaurante: 1,
        id_plan: 2,
        fecha_inicio: '2024-01-01',
        fecha_fin: '2024-12-31'
      };

      const mockCreatedSubscription = {
        id: 1,
        ...mockNewSubscription,
        estado: 'activa'
      };

      mockApi.post.mockResolvedValue({ data: mockCreatedSubscription });

      const result = await suscripcionesApi.create(mockNewSubscription);
      
      expect(mockApi.post).toHaveBeenCalledWith('/suscripciones-sistema', mockNewSubscription);
      expect(result).toEqual(mockCreatedSubscription);
    });

    it('should update subscription', async () => {
      const mockUpdateData = {
        id_plan: 3,
        fecha_fin: '2025-12-31'
      };

      const mockUpdatedSubscription = {
        id: 1,
        id_restaurante: 1,
        id_plan: 3,
        estado: 'activa',
        fecha_inicio: '2024-01-01',
        fecha_fin: '2025-12-31'
      };

      mockApi.put.mockResolvedValue({ data: mockUpdatedSubscription });

      const result = await suscripcionesApi.update(1, mockUpdateData);
      
      expect(mockApi.put).toHaveBeenCalledWith('/suscripciones-sistema/1', mockUpdateData);
      expect(result).toEqual(mockUpdatedSubscription);
    });

    it('should change plan', async () => {
      const mockPlanChange = {
        newPlanId: 3,
        fecha_cambio: '2024-06-01'
      };

      const mockUpdatedSubscription = {
        id: 1,
        id_restaurante: 1,
        id_plan: 3,
        estado: 'activa',
        fecha_inicio: '2024-01-01',
        fecha_fin: '2024-12-31'
      };

      mockApi.post.mockResolvedValue({ data: mockUpdatedSubscription });

      const result = await suscripcionesApi.changePlan(1, mockPlanChange);
      
      expect(mockApi.post).toHaveBeenCalledWith('/suscripciones-sistema/1/change-plan', mockPlanChange);
      expect(result).toEqual(mockUpdatedSubscription);
    });

    it('should suspend subscription', async () => {
      const mockSuspendedSubscription = {
        id: 1,
        id_restaurante: 1,
        id_plan: 2,
        estado: 'suspendida',
        fecha_inicio: '2024-01-01',
        fecha_fin: '2024-12-31'
      };

      mockApi.post.mockResolvedValue({ data: mockSuspendedSubscription });

      const result = await suscripcionesApi.suspend(1, 'Payment issue');
      
      expect(mockApi.post).toHaveBeenCalledWith('/suscripciones-sistema/1/suspend', {
        motivo: 'Payment issue'
      });
      expect(result).toEqual(mockSuspendedSubscription);
    });

    it('should reactivate subscription', async () => {
      const mockReactivatedSubscription = {
        id: 1,
        id_restaurante: 1,
        id_plan: 2,
        estado: 'activa',
        fecha_inicio: '2024-01-01',
        fecha_fin: '2024-12-31'
      };

      mockApi.post.mockResolvedValue({ data: mockReactivatedSubscription });

      const result = await suscripcionesApi.reactivate(1);
      
      expect(mockApi.post).toHaveBeenCalledWith('/suscripciones-sistema/1/reactivate');
      expect(result).toEqual(mockReactivatedSubscription);
    });
  });

  describe('contadoresApi', () => {
    it('should fetch usage counters by restaurant', async () => {
      const mockCounters = {
        id: 1,
        id_restaurante: 1,
        contador_sucursales: 2,
        contador_usuarios: 5,
        contador_productos: 50,
        contador_transacciones_mes: 100,
        contador_almacenamiento_gb: 2.5
      };

      mockApi.get.mockResolvedValue({ data: mockCounters });

      const result = await contadoresApi.getByRestaurant(1);
      
      expect(mockApi.get).toHaveBeenCalledWith('/contadores-sistema/restaurant/1');
      expect(result).toEqual(mockCounters);
    });

    it('should update usage counter', async () => {
      const mockUpdateData = {
        contador_productos: 55
      };

      const mockUpdatedCounter = {
        id: 1,
        id_restaurante: 1,
        contador_sucursales: 2,
        contador_usuarios: 5,
        contador_productos: 55,
        contador_transacciones_mes: 100,
        contador_almacenamiento_gb: 2.5
      };

      mockApi.put.mockResolvedValue({ data: mockUpdatedCounter });

      const result = await contadoresApi.update(1, mockUpdateData);
      
      expect(mockApi.put).toHaveBeenCalledWith('/contadores-sistema/1', mockUpdateData);
      expect(result).toEqual(mockUpdatedCounter);
    });

    it('should validate limit', async () => {
      const mockValidation = {
        canAdd: true,
        current: 50,
        limit: 100,
        remaining: 50,
        percentage: 50
      };

      mockApi.post.mockResolvedValue({ data: mockValidation });

      const result = await contadoresApi.validateLimit(1, 'productos', 10);
      
      expect(mockApi.post).toHaveBeenCalledWith('/contadores-sistema/1/validate-limit', {
        resource: 'productos',
        amount: 10
      });
      expect(result).toEqual(mockValidation);
    });

    it('should get global statistics', async () => {
      const mockStats = {
        totalRestaurants: 100,
        totalSucursales: 250,
        totalUsuarios: 500,
        totalProductos: 5000,
        totalTransacciones: 10000,
        totalAlmacenamiento: 1000
      };

      mockApi.get.mockResolvedValue({ data: mockStats });

      const result = await contadoresApi.getGlobalStats();
      
      expect(mockApi.get).toHaveBeenCalledWith('/contadores-sistema/global-stats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('alertasApi', () => {
    it('should fetch alerts by restaurant', async () => {
      const mockAlerts = [
        {
          id: 1,
          id_restaurante: 1,
          tipo_alerta: 'limite_productos',
          urgencia: 'medium',
          estado: 'pending',
          mensaje: 'Has usado el 80% de tu límite de productos',
          fecha_creacion: '2024-01-01T00:00:00Z'
        }
      ];

      mockApi.get.mockResolvedValue({ data: mockAlerts });

      const result = await alertasApi.getByRestaurant(1);
      
      expect(mockApi.get).toHaveBeenCalledWith('/alertas-sistema/restaurant/1');
      expect(result).toEqual(mockAlerts);
    });

    it('should resolve alert', async () => {
      const mockResolvedAlert = {
        id: 1,
        id_restaurante: 1,
        tipo_alerta: 'limite_productos',
        urgencia: 'medium',
        estado: 'resolved',
        mensaje: 'Has usado el 80% de tu límite de productos',
        fecha_creacion: '2024-01-01T00:00:00Z',
        fecha_resolucion: '2024-01-02T00:00:00Z',
        mensaje_resolucion: 'Plan actualizado'
      };

      mockApi.post.mockResolvedValue({ data: mockResolvedAlert });

      const result = await alertasApi.resolve(1, 'Plan actualizado');
      
      expect(mockApi.post).toHaveBeenCalledWith('/alertas-sistema/1/resolve', {
        mensaje_resolucion: 'Plan actualizado'
      });
      expect(result).toEqual(mockResolvedAlert);
    });

    it('should ignore alert', async () => {
      const mockIgnoredAlert = {
        id: 1,
        id_restaurante: 1,
        tipo_alerta: 'limite_productos',
        urgencia: 'medium',
        estado: 'ignored',
        mensaje: 'Has usado el 80% de tu límite de productos',
        fecha_creacion: '2024-01-01T00:00:00Z',
        fecha_resolucion: '2024-01-02T00:00:00Z',
        mensaje_resolucion: 'No es relevante'
      };

      mockApi.post.mockResolvedValue({ data: mockIgnoredAlert });

      const result = await alertasApi.ignore(1, 'No es relevante');
      
      expect(mockApi.post).toHaveBeenCalledWith('/alertas-sistema/1/ignore', {
        motivo: 'No es relevante'
      });
      expect(result).toEqual(mockIgnoredAlert);
    });

    it('should mark all as read', async () => {
      mockApi.post.mockResolvedValue({ data: { success: true } });

      const result = await alertasApi.markAllAsRead(1);
      
      expect(mockApi.post).toHaveBeenCalledWith('/alertas-sistema/restaurant/1/mark-all-read');
      expect(result).toEqual({ success: true });
    });

    it('should get alert statistics', async () => {
      const mockStats = {
        total: 50,
        pending: 10,
        resolved: 30,
        ignored: 10,
        byType: {
          limite_productos: 20,
          limite_usuarios: 15,
          limite_sucursales: 10,
          limite_transacciones: 5
        },
        byUrgency: {
          low: 10,
          medium: 25,
          high: 10,
          critical: 5
        }
      };

      mockApi.get.mockResolvedValue({ data: mockStats });

      const result = await alertasApi.getStats(1);
      
      expect(mockApi.get).toHaveBeenCalledWith('/alertas-sistema/restaurant/1/stats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      mockApi.get.mockRejectedValue(mockError);

      await expect(planesSistemaApi.getAll()).rejects.toThrow('Network error');
    });

    it('should handle 404 errors', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Plan not found' }
        }
      };
      mockApi.get.mockRejectedValue(mockError);

      await expect(planesSistemaApi.getById(999)).rejects.toEqual(mockError);
    });

    it('should handle 400 errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Invalid data' }
        }
      };
      mockApi.post.mockRejectedValue(mockError);

      await expect(planesSistemaApi.validateFeature(1, 'invalid_feature')).rejects.toEqual(mockError);
    });
  });
});
