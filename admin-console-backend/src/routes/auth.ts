import { Router } from 'express';
import { login } from '../controllers/authController';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validateRequest';
import { loginRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// POST /auth/login
router.post(
  '/login',
  loginRateLimiter,
  [
    body('email').isEmail(),
    body('password').isString().isLength({ min: 6 })
  ],
  validateRequest,
  login
);

export default router; 