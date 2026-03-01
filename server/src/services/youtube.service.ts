import axios, { AxiosError } from 'axios';
import prisma from '../utils/prisma';

const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// ============================================
// CUSTOM YOUTUBE ERRORS
// ============================================
export class YouTubeAPIError extends Error {
    public code: string;
    public statusCode: number;
    public isRetryable: boolean;

    constructor(message: string, code: string, statusCode: number = 500, isRetryable: boolean = false) {
        super(message);
        this.name = 'YouTubeAPIError';
        this.code = code;
        this.statusCode = statusCode;
        this.isRetryable = isRetryable;
    }
}

// Error codes for frontend handling
export const YOUTUBE_ERROR_CODES = {
    MISSING_API_KEY: 'YOUTUBE_MISSING_API_KEY',
    QUOTA_EXCEEDED: 'YOUTUBE_QUOTA_EXCEEDED',
    PERMISSION_DENIED: 'YOUTUBE_PERMISSION_DENIED',
    IP_BLOCKED: 'YOUTUBE_IP_BLOCKED',
    INVALID_KEY: 'YOUTUBE_INVALID_KEY',
    NETWORK_ERROR: 'YOUTUBE_NETWORK_ERROR',
    UNKNOWN_ERROR: 'YOUTUBE_UNKNOWN_ERROR',
    INVALID_QUERY: 'YOUTUBE_INVALID_QUERY',
} as const;

// ============================================
// VIDEO RESPONSE INTERFACE
// ============================================
export interface YouTubeVideoResult {
    id: string;
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    url: string;       // Watch URL
    embedUrl: string;  // Embed URL for iframe
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get YouTube API key from environment - checked at runtime, not module load
 */
const getApiKey = (): string => {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) {
        throw new YouTubeAPIError(
            'YouTube API key is not configured. Please set YOUTUBE_API_KEY in environment variables.',
            YOUTUBE_ERROR_CODES.MISSING_API_KEY,
            500,
            false
        );
    }
    return key;
};

/**
 * Parse YouTube API error and return appropriate custom error
 */
const parseYouTubeError = (error: AxiosError): YouTubeAPIError => {
    const data = error.response?.data as any;
    const status = error.response?.status || 500;
    const errorDetails = data?.error?.errors?.[0];
    const reason = errorDetails?.reason || '';
    const message = data?.error?.message || error.message;

    console.error('[YouTubeService] API Error:', {
        status,
        reason,
        message,
        details: errorDetails
    });

    // Handle specific error types
    if (status === 403) {
        if (reason === 'quotaExceeded' || message.toLowerCase().includes('quota')) {
            return new YouTubeAPIError(
                'YouTube API daily quota exceeded. Please try again tomorrow or upgrade your API quota.',
                YOUTUBE_ERROR_CODES.QUOTA_EXCEEDED,
                429,
                false
            );
        }
        if (reason === 'ipRefererBlocked' || message.includes('IP')) {
            return new YouTubeAPIError(
                'API key has IP restrictions that are blocking this request. Check Google Cloud Console API restrictions.',
                YOUTUBE_ERROR_CODES.IP_BLOCKED,
                403,
                false
            );
        }
        if (reason === 'accessNotConfigured' || reason === 'forbidden') {
            return new YouTubeAPIError(
                'YouTube Data API is not enabled or access is denied. Enable it in Google Cloud Console.',
                YOUTUBE_ERROR_CODES.PERMISSION_DENIED,
                403,
                false
            );
        }
    }

    if (status === 400 && message.includes('API key')) {
        return new YouTubeAPIError(
            'Invalid YouTube API key. Please check your YOUTUBE_API_KEY.',
            YOUTUBE_ERROR_CODES.INVALID_KEY,
            400,
            false
        );
    }

    if (!error.response) {
        return new YouTubeAPIError(
            'Network error while connecting to YouTube API. Please check your internet connection.',
            YOUTUBE_ERROR_CODES.NETWORK_ERROR,
            503,
            true
        );
    }

    return new YouTubeAPIError(
        `YouTube API error: ${message}`,
        YOUTUBE_ERROR_CODES.UNKNOWN_ERROR,
        status,
        status >= 500
    );
};

/**
 * Sanitize search query
 */
const sanitizeQuery = (query: string): string => {
    // Remove potentially harmful characters, limit length
    return query
        .trim()
        .replace(/[<>'"]/g, '')
        .substring(0, 100);
};

// ============================================
// YOUTUBE SERVICE
// ============================================
export const YouTubeService = {
    /**
     * Search YouTube for music videos
     * @throws {YouTubeAPIError} When API call fails
     */
    search: async (query: string): Promise<YouTubeVideoResult[]> => {
        // Validate query
        const sanitizedQuery = sanitizeQuery(query);
        if (!sanitizedQuery || sanitizedQuery.length < 2) {
            throw new YouTubeAPIError(
                'Search query must be at least 2 characters',
                YOUTUBE_ERROR_CODES.INVALID_QUERY,
                400,
                false
            );
        }

        // Get API key at runtime
        const apiKey = getApiKey();

        try {
            const response = await axios.get(`${YOUTUBE_BASE_URL}/search`, {
                params: {
                    part: 'snippet',
                    q: sanitizedQuery,
                    type: 'video',
                    videoCategoryId: '10', // Music category
                    maxResults: 10,
                    key: apiKey,
                },
                timeout: 10000, // 10 second timeout
            });

            const items = response.data.items || [];
            
            return items.map((item: any): YouTubeVideoResult => {
                const videoId = item.id.videoId;
                return {
                    id: videoId,
                    videoId: videoId,
                    title: item.snippet.title,
                    channelTitle: item.snippet.channelTitle,
                    thumbnail: item.snippet.thumbnails.high?.url || 
                               item.snippet.thumbnails.medium?.url || 
                               item.snippet.thumbnails.default?.url || '',
                    url: `https://www.youtube.com/watch?v=${videoId}`,
                    embedUrl: `https://www.youtube.com/embed/${videoId}`,
                };
            });
        } catch (error) {
            if (error instanceof YouTubeAPIError) {
                throw error;
            }
            if (axios.isAxiosError(error)) {
                throw parseYouTubeError(error);
            }
            throw new YouTubeAPIError(
                'An unexpected error occurred while searching YouTube',
                YOUTUBE_ERROR_CODES.UNKNOWN_ERROR,
                500,
                false
            );
        }
    },

    /**
     * Get recommended music based on mood
     */
    getMoodMusic: async (mood: string) => {
        const moodMap: Record<string, string> = {
            CALM: 'lofi calm music 1 hour',
            FOCUS: 'deep focus music',
            ANXIOUS: 'relaxing piano ambient',
            SAD: 'uplifting instrumental music',
            SLEEP: 'sleep meditation 8 hours',
            HAPPY: 'upbeat happy pop music',
            STRESSED: 'stress relief meditation music',
            TIRED: 'restorative ambient soundscapes'
        };

        const query = moodMap[mood.toUpperCase()] || 'chill lofi hip hop';
        const results = await YouTubeService.search(query);
        return results.slice(0, 5); // Return top 5 as requested
    },

    /**
     * Save a video to favorites
     */
    saveFavorite: async (userId: string, data: { videoId: string; title: string, thumbnail: string, channelTitle: string }) => {
        return prisma.youTubeFavorite.upsert({
            where: {
                userId_videoId: { userId, videoId: data.videoId }
            },
            create: {
                userId,
                videoId: data.videoId,
                title: data.title,
                thumbnail: data.thumbnail,
                channelTitle: data.channelTitle
            },
            update: {
                addedAt: new Date()
            },
        });
    },

    /**
     * Get user's favorite videos
     */
    getFavorites: async (userId: string) => {
        return prisma.youTubeFavorite.findMany({
            where: { userId },
            orderBy: { addedAt: 'desc' },
        });
    },

    /**
     * Remove a video from favorites
     */
    removeFavorite: async (userId: string, videoId: string) => {
        return prisma.youTubeFavorite.deleteMany({
            where: { userId, videoId },
        });
    }
};
