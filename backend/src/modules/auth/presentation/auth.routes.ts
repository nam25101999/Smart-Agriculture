import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateRequest } from '../../../shared/middleware/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from '../application/dtos/auth.dto.js';
import { authenticateToken } from '../../../shared/middleware/auth.middleware.js';

const router = Router();
const controller = new AuthController();

// Public routes
router.post('/register', validateRequest({ body: registerSchema }), controller.register);
router.post('/login', validateRequest({ body: loginSchema }), controller.login);
router.post('/refresh-token', validateRequest({ body: refreshTokenSchema }), controller.refreshToken);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

// Protected routes
router.get('/me', authenticateToken, controller.getProfile);
router.patch('/me', authenticateToken, controller.updateProfile);
router.post('/logout', authenticateToken, controller.logout);
router.post(
  '/change-password',
  authenticateToken,
  validateRequest({ body: changePasswordSchema }),
  controller.changePassword
);

export const authRoutes = router;

