// ============================================
// Calm Routes
// ============================================
// All routes for Calm Space feature.
// All routes require authentication.
// ============================================

import { Router, Request, Response } from 'express';
import {
  getSuggestion,
  getAISuggestion,
  saveSession,
  getStats,
} from '../controllers/calm.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const router = Router();

// Valid music categories
const VALID_CATEGORIES = ['calm', 'focus', 'energy', 'emotional', 'night'] as const;
type MusicCategory = typeof VALID_CATEGORIES[number];

/**
 * GET /api/calm/local-music/:category
 * Get local music files for a category
 * Public endpoint (no auth required for music files)
 */
router.get('/local-music/:category', (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    
    // Validate category
    if (!VALID_CATEGORIES.includes(category as MusicCategory)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    // Path to music directory (in client/public/music)
    // Capitalize first letter to match folder names (Calm, Focus, etc.)
    const folderName = category.charAt(0).toUpperCase() + category.slice(1);
    const musicDir = path.join(process.cwd(), '..', 'client', 'public', 'music', folderName);
    
    // Check if directory exists
    if (!fs.existsSync(musicDir)) {
      return res.status(200).json({
        success: true,
        data: [],
        message: `No music found for category: ${category}`,
      });
    }

    // Read directory and filter for mp3 files
    const files = fs.readdirSync(musicDir)
      .filter(file => file.toLowerCase().endsWith('.mp3'))
      .map((file, index) => {
        // Clean title from filename
        const title = file
          .replace(/\.mp3$/i, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
        
        return {
          id: `${category}-${index + 1}`,
          title,
          src: `/music/${folderName}/${encodeURIComponent(file)}`,
          category,
        };
      });

    return res.status(200).json({
      success: true,
      data: files,
      count: files.length,
    });
  } catch (error) {
    console.error('Error reading music directory:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load music files',
    });
  }
});

/**
 * GET /api/calm/local-music
 * Get all local music files across all categories
 */
router.get('/local-music', (_req: Request, res: Response) => {
  try {
    const allMusic: Record<string, any[]> = {};
    
    for (const category of VALID_CATEGORIES) {
      const folderName = category.charAt(0).toUpperCase() + category.slice(1);
      const musicDir = path.join(process.cwd(), '..', 'client', 'public', 'music', folderName);
      
      if (fs.existsSync(musicDir)) {
        const files = fs.readdirSync(musicDir)
          .filter(file => file.toLowerCase().endsWith('.mp3'))
          .map((file, index) => {
            const title = file
              .replace(/\.mp3$/i, '')
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, c => c.toUpperCase());
            
            return {
              id: `${category}-${index + 1}`,
              title,
              src: `/music/${folderName}/${encodeURIComponent(file)}`,
              category,
            };
          });
        
        allMusic[category] = files;
      } else {
        allMusic[category] = [];
      }
    }

    return res.status(200).json({
      success: true,
      data: allMusic,
      categories: VALID_CATEGORIES,
    });
  } catch (error) {
    console.error('Error reading music directories:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load music files',
    });
  }
});

// All routes below require authentication
router.use(authenticate);

// Validation schemas
const saveSessionSchema = z.object({
  body: z.object({
    sound: z.string().min(1).max(100),
    duration: z.number().int().min(1).max(120),
    focusMode: z.boolean().optional(),
    completed: z.boolean().optional(),
  }),
});

/**
 * GET /api/calm/suggestion
 * Get mood-based sound suggestion
 */
router.get('/suggestion', getSuggestion);

/**
 * POST /api/calm/ai-suggestion
 * Get AI-powered sound suggestion
 */
router.post('/ai-suggestion', getAISuggestion);

/**
 * POST /api/calm/session
 * Save a completed calm session
 */
router.post('/session', validate(saveSessionSchema), saveSession);

/**
 * GET /api/calm/stats
 * Get calm space statistics
 */
router.get('/stats', getStats);

export default router;