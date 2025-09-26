import { Router } from 'express';
import { login, verifyTwoFactor, requestPasswordReset, verifyResetCode, resetPassword } from '../controllers/authController';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validateRequest';
import { loginRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// POST /auth/login
router.post(
  '/login',
  // loginRateLimiter, // Temporalmente deshabilitado para pruebas
  [
    body('email').optional().isEmail(),
    body('username').optional().isString().isLength({ min: 1 }),
    body('password').isString().isLength({ min: 1 })
  ],
  // Validación personalizada para asegurar que al menos email o username esté presente
  (req: any, res: any, next: any) => {
    if (!req.body.email && !req.body.username) {
      return res.status(400).json({ 
        message: 'Se requiere email o username',
        errors: [{ msg: 'Se requiere email o username', param: 'email/username' }]
      });
    }
    next();
  },
  validateRequest,
  login
);

// POST /auth/verify-2fa
router.post(
  '/verify-2fa',
  [
    body('email').isEmail(),
    body('code').isString().isLength({ min: 6, max: 6 })
  ],
  validateRequest,
  verifyTwoFactor
);

// POST /auth/request-password-reset
router.post(
  '/request-password-reset',
  [
    body('email').isEmail()
  ],
  validateRequest,
  requestPasswordReset
);

// POST /auth/verify-reset-code
router.post(
  '/verify-reset-code',
  [
    body('token').isString(),
    body('code').isString().isLength({ min: 6, max: 6 })
  ],
  validateRequest,
  verifyResetCode
);

// POST /auth/reset-password
router.post(
  '/reset-password',
  [
    body('token').isString(),
    body('newPassword').isString().isLength({ min: 8 })
  ],
  validateRequest,
  resetPassword
);

export default router; 