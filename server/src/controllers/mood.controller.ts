// ============================================
// Mood Controller
// ============================================
// Handles HTTP requests for mood tracking operations.
// All endpoints require authentication.
// ============================================

import { Request, Response, NextFunction } from 'express';
import * as moodService from '../services/mood.service';
import { CreateMoodInput, MoodQueryOptions } from '../services/mood.service';
import { getStreakInfo, getEngagementInfo } from '../services/streak.service';
import { getSuggestionsForMood } from '../services/suggestion.service';
import { BadRequestError } from '../utils/appError';

// ============================================
// LOG MOOD
// ============================================

/**
 * Create a new mood entry
 * POST /api/mood
 * 
 * @requires Authentication
 */
export const logMood = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw BadRequestError('User ID not found in request');
    }

    const data = req.body as CreateMoodInput;

    const entry = await moodService.createMoodEntry(userId, data);

    res.status(201).json({
      success: true,
      message: 'Mood logged successfully',
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET MOOD HISTORY
// ============================================

/**
 * Get mood history with optional range filter
 * GET /api/mood
 * 
 * Query Parameters:
 * - range: 'week' | 'month' | 'all' (default: 'week')
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 * 
 * @requires Authentication
 */
export const getMoodHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw BadRequestError('User ID not found in request');
    }

    const options: MoodQueryOptions = {
      range: (req.query.range as 'week' | 'month' | 'all') || 'week',
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
    };

    const result = await moodService.getMoodEntries(userId, options);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET MOOD STATS
// ============================================

/**
 * Get mood statistics and insights
 * GET /api/mood/stats
 * 
 * Query Parameters:
 * - range: 'week' | 'month' (default: 'week')
 * 
 * @requires Authentication
 */
export const getMoodStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw BadRequestError('User ID not found in request');
    }

    const range = (req.query.range as 'week' | 'month') || 'week';
    const stats = await moodService.getMoodStats(userId, range);

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// DELETE MOOD ENTRY
// ============================================

/**
 * Delete a mood entry
 * DELETE /api/mood/:id
 * 
 * @requires Authentication
 * @requires Ownership
 */
export const deleteMoodEntry = async (
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

    await moodService.deleteMoodEntry(entryId, userId);

    res.status(200).json({
      success: true,
      message: 'Mood entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET MOOD STREAK
// ============================================

/**
 * Get current mood/reflection streak info
 * GET /api/mood/streak
 * 
 * @requires Authentication
 */
export const getMoodStreak = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw BadRequestError('User ID not found in request');
    }

    const streakInfo = await getEngagementInfo(userId);

    res.status(200).json({
      success: true,
      data: streakInfo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get adaptive suggestions based on latest mood
 */
export const getSuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw BadRequestError('User ID not found in request');
    }

    const entries = await moodService.getMoodEntries(userId, { range: 'all', limit: 1 });
    const latestMood = entries.entries[0]?.mood || 'NEUTRAL';

    const suggestions = getSuggestionsForMood(latestMood);

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};
