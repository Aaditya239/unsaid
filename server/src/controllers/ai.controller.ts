// ============================================
// AI Controller
// ============================================
// Handles HTTP requests for AI emotional support features.
// All routes require authentication.
// ============================================

import { Request, Response, NextFunction } from 'express';
import {
  generateEmotionalResponse,
  saveConversation,
  getConversationHistory,
  generateWeeklySummary,
  getDailyReflection,
  analyzeWeeklyEmotion,
} from '../services/ai.service';
import { BadRequestError } from '../utils/appError';

// ============================================
// TYPES
// ============================================

interface SupportRequestBody {
  message: string;
}

interface EmotionRequestBody {
  message: string;
  userName: string;
}

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

/**
 * POST /api/ai/support
 * Get AI emotional support response
 */
export const getSupport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { message } = req.body as SupportRequestBody;

    // Validate message
    if (!message || typeof message !== 'string') {
      throw BadRequestError('Message is required');
    }

    if (message.length > 500) {
      throw BadRequestError('Message must be 500 characters or less');
    }

    if (message.trim().length === 0) {
      throw BadRequestError('Message cannot be empty');
    }

    // Generate AI response
    const aiResponse = await generateEmotionalResponse(userId, message.trim());

    // Save conversation to database
    const savedConversation = await saveConversation(
      userId,
      message.trim(),
      aiResponse.response,
      aiResponse.contextUsed
    );

    res.status(200).json({
      success: true,
      data: {
        id: savedConversation.id,
        message: message.trim(),
        response: aiResponse.response,
        isCrisisDetected: aiResponse.isCrisisDetected,
        contextUsed: aiResponse.contextUsed,
        createdAt: savedConversation.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/emotion
 * Original specific implementation path mapped to frontend requests
 */
export const getEmotionSupport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id; // Route must be authenticated
    const { message, userName } = req.body as EmotionRequestBody;

    // Validate message is not empty.
    if (!message || typeof message !== 'string') {
      throw BadRequestError('Message is required');
    }

    if (message.trim().length === 0) {
      throw BadRequestError('Message cannot be empty');
    }

    if (message.length > 500) {
      throw BadRequestError('Message must be 500 characters or less');
    }

    // Call service 
    // The service handles building the system personality prompt & hitting Grok/Groq API
    // We pass the trimmed message
    const aiResponse = await generateEmotionalResponse(userId, message.trim());

    // Save conversation to database automatically inside generateEmotionalResponse workflow 
    await saveConversation(
      userId,
      message.trim(),
      aiResponse.response,
      aiResponse.contextUsed
    );

    // Return format explicitly asked: { reply: string }
    res.status(200).json({
      success: true,
      reply: aiResponse.response
    });

  } catch (error) {
    // Log errors server-side only
    console.error('AI Emotion Endpoint Error:', error);
    next(error);
  }
};

/**
 * GET /api/ai/conversations
 * Get conversation history
 */
export const getConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;

    const conversations = await getConversationHistory(userId, Math.min(limit, 50));

    res.status(200).json({
      success: true,
      data: {
        conversations: conversations.reverse(), // Chronological order
        count: conversations.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/weekly-summary
 * Get weekly emotional summary
 */
export const getWeeklySummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const summary = await generateWeeklySummary(userId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/daily-reflection
 * Get daily reflection prompt
 */
export const getDailyReflectionPrompt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const reflection = await getDailyReflection(userId);

    res.status(200).json({
      success: true,
      data: reflection,
    });
  } catch (error) {
    next(error);
  }
};
/**
 * GET /api/ai/emotional-analysis
 * Get human-first emotional analysis for the week
 */
export const getWeeklyEmotionAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const analysis = await analyzeWeeklyEmotion(userId);
    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};
