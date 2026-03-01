// ============================================
// Authentication Routes
// ============================================
// All routes for authentication operations
// ============================================

import { Router } from 'express';
import {
  signup,
  login,
  logout,
  logoutAll,
  refreshToken,
  getCurrentUser,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validation';

const router = Router();

// ============================================
// PUBLIC ROUTES (no authentication required)
// ============================================

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', validate(signupSchema), signup);

/**
 * POST /api/auth/login
 * Authenticate user
 */
router.post('/login', validate(loginSchema), login);

/**
 * POST /api/auth/forgot-password
 * Request reset link
 */
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', refreshToken);

/**
 * POST /api/auth/logout
 * Logout current session (works with or without auth)
 */
router.post('/logout', logout);

// ============================================
// PROTECTED ROUTES (authentication required)
// ============================================

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * POST /api/auth/logout-all
 * Logout from all devices
 */
router.post('/logout-all', authenticate, logoutAll);

export default router;
