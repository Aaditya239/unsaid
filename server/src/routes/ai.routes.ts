// ============================================
// AI Routes
// ============================================
// Routes for AI emotional support features.
// Includes specific rate limiting for AI endpoints.
// ============================================

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getSupport,
  getEmotionSupport,
  getConversations,
  getWeeklySummary,
  getDailyReflectionPrompt,
  getWeeklyEmotionAnalysis,
} from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { aiSupportSchema } from '../utils/validation';

const router = Router();

// ============================================
// RATE LIMITERS
// ============================================

// Rate limit for AI support (20 requests per minute per user)
const aiSupportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    success: false,
    message: 'Too many requests. Please wait a moment before sending another message.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
  skip: (req) => !req.user, // Skip if not authenticated (will fail auth anyway)
});

// Rate limit for weekly summary (30 per hour)
const weeklySummaryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: {
    success: false,
    message: 'Too many summary requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
});

// Rate limit for daily reflection (60 per hour - since it's cached)
const dailyReflectionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60,
  message: {
    success: false,
    message: 'Too many reflection requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
});

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================
router.use(authenticate);

// ============================================
// AI ROUTES
// ============================================

/**
 * POST /api/ai/support
 * Get AI emotional support response
 * 
 * Body: { message: string }
 * Rate limit: 5 requests per minute per user
 */
router.post(
  '/support',
  aiSupportLimiter,
  validate(aiSupportSchema),
  getSupport
);

/**
 * POST /api/ai/emotion
 * Get AI emotional support response explicitly mapped to frontend interactions
 * 
 * Body: { message: string, userName: string }
 */
router.post(
  '/emotion',
  aiSupportLimiter,
  getEmotionSupport
);

/**
 * GET /api/ai/conversations
 * Get conversation history
 * 
 * Query: { limit?: number } (default: 20, max: 50)
 */
router.get('/conversations', getConversations);

/**
 * GET /api/ai/weekly-summary
 * Get weekly emotional summary with AI insights
 * 
 * Rate limit: 10 requests per hour per user
 */
router.get('/weekly-summary', weeklySummaryLimiter, getWeeklySummary);

/**
 * GET /api/ai/emotional-analysis
 * Get human-first emotional analysis for the week
 */
router.get('/emotional-analysis', getWeeklyEmotionAnalysis);

/**
 * GET /api/ai/daily-reflection
 * Get AI-generated daily reflection prompt
 * 
 * Rate limit: 60 requests per hour per user (cached)
 */
router.get('/daily-reflection', dailyReflectionLimiter, getDailyReflectionPrompt);

export default router;
