const { authenticateToken, authorizeRoles, ensureTenantContext } = require('../../middlewares/authMiddleware');
const jwt = require('jsonwebtoken');
const logger = require('../../config/logger');

// Mock de dependencias
jest.mock('jsonwebtoken');
jest.mock('../../config/logger', () => ({
  warn: jest.fn(),
}));

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Pruebas para authenticateToken
  describe('authenticateToken', () => {
    it('debe llamar a next() si el token es válido', () => {
      req.headers.authorization = 'Bearer validtoken';
      const decodedUser = { id: 1, rol: 'admin' };
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, decodedUser);
      });

      authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'test-secret-key', expect.any(Function));
      expect(req.user).toEqual(decodedUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debe devolver 401 si no se proporciona token', () => {
      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acceso denegado. No se proporcionó un token de autenticación.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('debe devolver 403 si el token es inválido', () => {
      req.headers.authorization = 'Bearer invalidtoken';
      const error = new Error('Token inválido');
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(error, null);
      });

      authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('invalidtoken', 'test-secret-key', expect.any(Function));
      expect(logger.warn).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token de autenticación inválido o expirado.' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  // Pruebas para authorizeRoles
  describe('authorizeRoles', () => {
    it('debe llamar a next() si el usuario tiene el rol permitido', () => {
      req.user = { rol: 'admin' };
      const middleware = authorizeRoles('admin', 'super_admin');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('debe devolver 403 si el usuario no tiene el rol permitido', () => {
      req.user = { rol: 'mesero' };
      const middleware = authorizeRoles('admin', 'super_admin');
      middleware(req, res, next);

      expect(logger.warn).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acceso denegado. No tienes los permisos necesarios.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('debe devolver 403 si el usuario no tiene rol', () => {
      req.user = {}; // Sin propiedad 'rol'
      const middleware = authorizeRoles('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // Pruebas para ensureTenantContext
  describe('ensureTenantContext', () => {
    it('debe llamar a next() si el rol es super_admin', () => {
      req.user = { rol: 'super_admin' };
      ensureTenantContext(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('debe llamar a next() si el usuario tiene id_restaurante', () => {
      req.user = { rol: 'admin', id_restaurante: 123 };
      ensureTenantContext(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('debe devolver 403 si el usuario no es super_admin y no tiene id_restaurante', () => {
      req.user = { rol: 'admin' }; // Sin id_restaurante
      ensureTenantContext(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acceso denegado. No se pudo determinar el restaurante asociado a su usuario.' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});