// ============================================
// Calm Controller
// ============================================
// Handles HTTP requests for Calm Space feature.
// ============================================

import { Request, Response, NextFunction } from 'express';
import {
  getSoundSuggestion,
  getAISoundSuggestion,
  saveCalmSession,
  getCalmStats,
  CalmSessionInput,
} from '../services/calm.service';

/**
 * GET /api/calm/suggestion
 * Get mood-based sound suggestion
 */
export const getSuggestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const suggestion = await getSoundSuggestion(userId);

    res.status(200).json({
      success: true,
      data: suggestion,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/calm/ai-suggestion
 * Get AI-powered sound suggestion
 */
export const getAISuggestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const suggestion = await getAISoundSuggestion(userId);

    res.status(200).json({
      success: true,
      data: suggestion,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/calm/session
 * Save a completed calm session
 */
export const saveSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { sound, duration, focusMode, completed } = req.body as CalmSessionInput;

    const session = await saveCalmSession(userId, {
      sound,
      duration,
      focusMode,
      completed,
    });

    res.status(201).json({
      success: true,
      message: 'Session saved successfully',
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/calm/stats
 * Get calm space statistics
 */
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const stats = await getCalmStats(userId);

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};