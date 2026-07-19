import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../shared/middleware/validate';
import { registerSchema, loginSchema, refreshSchema, verifyOtpSchema } from './auth.schema';
import { requireAuth } from '../../shared/middleware/auth.middleware';
import { rateLimiter } from '../../shared/middleware/rate-limiter';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  validate(registerSchema),
  authController.register.bind(authController)
);

// POST /api/auth/login
router.post(
  '/login',
  validate(loginSchema),
  authController.login.bind(authController)
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  validate(refreshSchema),
  authController.refresh.bind(authController)
);

// POST /api/auth/logout
router.post(
  '/logout',
  authController.logout.bind(authController)
);

// POST /api/auth/send-otp
router.post(
  '/send-otp',
  requireAuth,
  rateLimiter(3, 60), // 3 requests per minute per user
  authController.sendOtp.bind(authController)
);

// POST /api/auth/verify-otp
router.post(
  '/verify-otp',
  requireAuth,
  rateLimiter(10, 60), // 10 requests per minute per user
  validate(verifyOtpSchema),
  authController.verifyOtp.bind(authController)
);

export default router;
