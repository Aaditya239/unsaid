import { Router, Request, Response } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { YouTubeService, YouTubeAPIError, YOUTUBE_ERROR_CODES } from '../services/youtube.service';
import rateLimit from 'express-rate-limit';

const router = Router();

// ============================================
// RATE LIMITING FOR YOUTUBE ROUTES
// ============================================
// Stricter rate limit for YouTube to conserve API quota
const youtubeRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute per IP
    message: {
        success: false,
        error: {
            code: 'RATE_LIMITED',
            message: 'Too many YouTube search requests. Please wait a moment.',
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiter to search endpoint
router.use('/search', youtubeRateLimiter);
router.use('/mood', youtubeRateLimiter);

// ============================================
// ERROR RESPONSE HELPER
// ============================================
const sendYouTubeError = (res: Response, error: unknown) => {
    if (error instanceof YouTubeAPIError) {
        return res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                isRetryable: error.isRetryable,
            }
        });
    }

    console.error('[YouTube Route] Unexpected error:', error);
    return res.status(500).json({
        success: false,
        error: {
            code: YOUTUBE_ERROR_CODES.UNKNOWN_ERROR,
            message: 'An unexpected error occurred',
            isRetryable: false,
        }
    });
};

/**
 * GET /api/youtube/search?q=...
 * Search music videos via YouTube Data API
 */
router.get('/search', optionalAuth, async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;
        
        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: {
                    code: YOUTUBE_ERROR_CODES.INVALID_QUERY,
                    message: 'Search query must be at least 2 characters.',
                    isRetryable: false,
                }
            });
        }

        const results = await YouTubeService.search(query);
        
        return res.status(200).json({
            success: true,
            data: {
                results,
                count: results.length,
            }
        });
    } catch (error) {
        return sendYouTubeError(res, error);
    }
});

/**
 * GET /api/youtube/mood/:mood
 * Auto-recommend songs based on mood
 */
router.get('/mood/:mood', optionalAuth, async (req: Request, res: Response) => {
    try {
        const mood = req.params.mood;
        
        if (!mood || mood.length < 2) {
            return res.status(400).json({
                success: false,
                error: {
                    code: YOUTUBE_ERROR_CODES.INVALID_QUERY,
                    message: 'Mood parameter is required.',
                    isRetryable: false,
                }
            });
        }

        const results = await YouTubeService.getMoodMusic(mood);
        
        return res.status(200).json({
            success: true,
            data: {
                results,
                mood: mood.toUpperCase(),
                count: results.length,
            }
        });
    } catch (error) {
        return sendYouTubeError(res, error);
    }
});

/**
 * POST /api/youtube/favorite
 * Save a music video to user favorites
 */
router.post('/favorite', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user!.id;
        const { videoId, title, thumbnail, channelTitle } = req.body;

        if (!videoId || !title) {
            return res.status(400).json({ error: 'videoId and title are required' });
        }

        const favorite = await YouTubeService.saveFavorite(userId, { videoId, title, thumbnail, channelTitle });
        res.status(201).json({ success: true, data: { favorite } });
    } catch (error) {
        console.error('YouTube Favorite POST Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/youtube/favorites
 * Get all user favorites
 */
router.get('/favorites', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user!.id;
        const favorites = await YouTubeService.getFavorites(userId);
        res.status(200).json({ success: true, data: { favorites } });
    } catch (error) {
        console.error('YouTube Favorites GET Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/youtube/favorites/:videoId
 * Remove a video from favorites
 */
router.delete('/favorites/:videoId', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user!.id;
        const videoId = req.params.videoId;
        await YouTubeService.removeFavorite(userId, videoId);
        res.status(200).json({ success: true, message: 'Removed from favorites' });
    } catch (error) {
        console.error('YouTube Favorite DELETE Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
