// ============================================
// Mood Routes
// ============================================
// All routes for mood tracking operations.
// All routes require authentication.
// ============================================

import { Router } from 'express';
import {
  logMood,
  getMoodHistory,
  getMoodStats,
  deleteMoodEntry,
  getMoodStreak,
  getSuggestions,
} from '../controllers/mood.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createMoodSchema, moodQuerySchema } from '../utils/validation';

const router = Router();

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================
router.use(authenticate);

// ============================================
// MOOD ROUTES
// ============================================

/**
 * GET /api/mood/stats
 * Get mood statistics and insights
 * NOTE: Must be defined before /:id to avoid route conflict
 */
router.get('/stats', getMoodStats);

/**
 * GET /api/mood/streak
 * Get current mood/reflection streak
 */
router.get('/streak', getMoodStreak);

/**
 * GET /api/mood/suggestions
 * Get adaptive suggestions based on mood
 */
router.get('/suggestions', getSuggestions);

/**
 * POST /api/mood
 * Log a new mood entry
 */
router.post('/', validate(createMoodSchema), logMood);

/**
 * GET /api/mood
 * Get mood history with filtering
 * 
 * Query parameters:
 * - range: 'week' | 'month' | 'all' (default: 'week')
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 */
router.get('/', validate(moodQuerySchema, 'query'), getMoodHistory);

/**
 * DELETE /api/mood/:id
 * Delete a mood entry
 */
router.delete('/:id', deleteMoodEntry);

export default router;
