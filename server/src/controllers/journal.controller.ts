// ============================================
// Journal Controller
// ============================================
// Handles HTTP requests for journal operations.
// Uses the service layer for business logic.
// All endpoints require authentication.
// ============================================

import { Request, Response, NextFunction } from 'express';
import * as journalService from '../services/journal.service';
import {
  CreateJournalInput,
  UpdateJournalInput,
  JournalQueryInput,
  AttachMusicInput,
} from '../utils/validation';
import { BadRequestError } from '../utils/appError';
import * as aiService from '../services/ai.service';

// ============================================
// CREATE JOURNAL ENTRY
// ============================================

/**
 * Create a new journal entry
 * POST /api/journal
 * 
 * @requires Authentication
 */
export const createEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // User ID comes from auth middleware
    const userId = req.user?.id;

    if (!userId) {
      throw BadRequestError('User ID not found in request');
    }

    const data = req.body as CreateJournalInput;

    const entry = await journalService.createJournalEntry(userId, {
      title: data.title,
      content: data.content,
      emotion: data.emotion,
      intensity: data.intensity,
      aiResponse: data.aiResponse,
      mode: data.mode,
      tags: data.tags,
      imageUrl: data.imageUrl,
      musicTitle: data.musicTitle,
      musicArtist: data.musicArtist,
      musicThumbnail: data.musicThumbnail,
      musicVideoId: data.musicVideoId,
      musicUrl: data.musicUrl,
      musicPlatform: data.musicPlatform,
    });

    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully',
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET ALL JOURNAL ENTRIES
// ============================================

/**
 * Get all journal entries for logged-in user
 * GET /api/journal
 * 
 * Query Parameters:
 * - search: Search in title and content
 * - emotion: Filter by emotion
 * - sortBy: 'createdAt' | 'updatedAt'
 * - sortOrder: 'asc' | 'desc'
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * 
 * @requires Authentication
 */
export const getAllEntries = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw BadRequestError('User ID not found in request');
    }

    // Query params are validated by middleware
    const query = req.query as unknown as JournalQueryInput;

    const result = await journalService.getJournalEntries(userId, {
      search: query.search,
      emotion: query.emotion,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      page: query.page,
      limit: query.limit,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET SINGLE JOURNAL ENTRY
// ============================================

/**
 * Get a single journal entry by ID
 * GET /api/journal/:id
 * 
 * @requires Authentication
 * @requires Ownership verification
 */
export const getEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id: entryId } = req.params;

    if (!userId) {
      throw BadRequestError('User ID not found in request');
    }

    // Service handles ownership verification
    const entry = await journalService.getJournalEntryById(entryId, userId);

    res.status(200).json({
      success: true,
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// UPDATE JOURNAL ENTRY
// ============================================

/**
 * Update a journal entry
 * PUT /api/journal/:id
 * 
 * @requires Authentication
 * @requires Ownership verification
 */
export const updateEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id: entryId } = req.params;

    if (!userId) {
      throw BadRequestError('User ID not found in request');
    }

    const data = req.body as UpdateJournalInput;

    // Service handles ownership verification
    const entry = await journalService.updateJournalEntry(entryId, userId, {
      title: data.title,
      content: data.content,
      emotion: data.emotion,
      intensity: data.intensity,
      aiResponse: data.aiResponse,
      mode: data.mode,
      tags: data.tags,
      imageUrl: data.imageUrl,
      musicTitle: data.musicTitle,
      musicArtist: data.musicArtist,
      musicThumbnail: data.musicThumbnail,
      musicVideoId: data.musicVideoId,
      musicUrl: data.musicUrl,
      musicPlatform: data.musicPlatform,
    });

    res.status(200).json({
      success: true,
      message: 'Journal entry updated successfully',
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// DELETE JOURNAL ENTRY
// ============================================

/**
 * Delete a journal entry
 * DELETE /api/journal/:id
 * 
 * @requires Authentication
 * @requires Ownership verification
 */
export const deleteEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id: entryId } = req.params;

    if (!userId) {
      throw BadRequestError('User ID not found in request');
    }

    // Service handles ownership verification
    await journalService.deleteJournalEntry(entryId, userId);

    res.status(200).json({
      success: true,
      message: 'Journal entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET JOURNAL STATISTICS
// ============================================

/**
 * Get statistics about user's journal entries
 * GET /api/journal/stats
 * 
 * @requires Authentication
 */
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw BadRequestError('User ID not found in request');
    }

    const stats = await journalService.getJournalStats(userId);

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};
// ============================================
// GET JOURNAL WEEKLY REFLECTION (AI)
// ============================================

/**
 * Generate a thoughtful AI review for the Journal's weekly reflection section
 * POST /api/journal/weekly-reflection
 */
export const getJournalWeeklyReflection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw BadRequestError('User ID not found in request');
    }

    const { moodSummary, count } = req.body;

    // Fallback if no data
    if (!count || count < 2) {
      res.status(200).json({
        success: true,
        data: { reflection: "You've been writing. That's enough." }
      });
      return;
    }

    const reflection = await aiService.generateJournalWeeklyReflection(moodSummary, count);

    res.status(200).json({
      success: true,
      data: { reflection },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Attach music to a journal entry
 * POST /api/journal/:id/attach-music
 */
export const attachMusic = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id: entryId } = req.params;

    if (!userId) {
      throw BadRequestError('User ID not found');
    }

    const data = req.body as AttachMusicInput;

    const entry = await journalService.attachMusicToEntry(entryId, userId, {
      musicTitle: data.musicTitle,
      musicArtist: data.musicArtist,
      musicThumbnail: data.musicThumbnail,
      musicVideoId: data.musicVideoId,
      musicUrl: data.musicUrl,
      musicPlatform: data.musicPlatform,
    });

    res.status(200).json({
      success: true,
      message: 'Music attached successfully',
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
};

