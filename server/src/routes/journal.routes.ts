// ============================================
// Journal Routes
// ============================================
// All routes for journal entry operations.
// All routes require authentication.
// ============================================

import { Router } from 'express';
import {
  createEntry,
  getAllEntries,
  getEntry,
  updateEntry,
  deleteEntry,
  getStats,
  getJournalWeeklyReflection,
  attachMusic,
} from '../controllers/journal.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createJournalSchema,
  updateJournalSchema,
  journalQuerySchema,
  attachMusicSchema,
} from '../utils/validation';

const router = Router();

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================
router.use(authenticate);

// ============================================
// JOURNAL ROUTES
// ============================================

/**
 * GET /api/journal/stats
 * Get journal statistics for logged-in user
 * NOTE: Must be defined before /:id to avoid conflict
 */
router.get('/stats', getStats);

/**
 * POST /api/journal/weekly-reflection
 * Generate an AI weekly reflection
 * NOTE: Must be defined before /:id to avoid conflict
 */
router.post('/weekly-reflection', getJournalWeeklyReflection);

/**
 * POST /api/journal
 * Create a new journal entry
 */
router.post('/', validate(createJournalSchema), createEntry);

/**
 * GET /api/journal
 * Get all journal entries with filtering and pagination
 * 
 * Query parameters:
 * - search: Search in title and content
 * - emotion: Filter by emotion (HAPPY, SAD, etc.)
 * - sortBy: 'createdAt' | 'updatedAt'
 * - sortOrder: 'asc' | 'desc'
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
router.get('/', validate(journalQuerySchema, 'query'), getAllEntries);

/**
 * GET /api/journal/:id
 * Get a single journal entry by ID
 */
router.get('/:id', getEntry);

/**
 * PUT /api/journal/:id
 * Update a journal entry
 */
router.put('/:id', validate(updateJournalSchema), updateEntry);

/**
 * DELETE /api/journal/:id
 * Delete a journal entry
 */
router.delete('/:id', deleteEntry);

/**
 * POST /api/journal/:id/attach-music
 * Attach music metadata to a journal entry
 */
router.post('/:id/attach-music', validate(attachMusicSchema), attachMusic);

export default router;
