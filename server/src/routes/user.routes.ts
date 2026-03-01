// ============================================
// User Routes
// ============================================
// All routes for user operations (protected)
// ============================================

import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getSessions,
  revokeSession,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { changePasswordSchema } from '../utils/validation';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// ============================================
// PROFILE ROUTES
// ============================================

/**
 * GET /api/users/profile
 * Get authenticated user's profile
 */
router.get('/profile', getProfile);

/**
 * PATCH /api/users/profile
 * Update profile information
 */
router.patch('/profile', updateProfile);

/**
 * POST /api/users/change-password
 * Change user password
 */
router.post(
  '/change-password',
  validate(changePasswordSchema),
  changePassword
);

// ============================================
// SESSION MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/users/sessions
 * Get all active sessions
 */
router.get('/sessions', getSessions);

/**
 * DELETE /api/users/sessions/:sessionId
 * Revoke a specific session
 */
router.delete('/sessions/:sessionId', revokeSession);

export default router;
