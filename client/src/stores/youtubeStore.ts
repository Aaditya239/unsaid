import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import { AxiosError } from 'axios';

// ============================================
// YOUTUBE ERROR CODES (match backend)
// ============================================
export const YOUTUBE_ERROR_CODES = {
    MISSING_API_KEY: 'YOUTUBE_MISSING_API_KEY',
    QUOTA_EXCEEDED: 'YOUTUBE_QUOTA_EXCEEDED',
    PERMISSION_DENIED: 'YOUTUBE_PERMISSION_DENIED',
    IP_BLOCKED: 'YOUTUBE_IP_BLOCKED',
    INVALID_KEY: 'YOUTUBE_INVALID_KEY',
    NETWORK_ERROR: 'YOUTUBE_NETWORK_ERROR',
    UNKNOWN_ERROR: 'YOUTUBE_UNKNOWN_ERROR',
    INVALID_QUERY: 'YOUTUBE_INVALID_QUERY',
    RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type YouTubeErrorCode = typeof YOUTUBE_ERROR_CODES[keyof typeof YOUTUBE_ERROR_CODES];

// ============================================
// INTERFACES
// ============================================
export interface YouTubeVideo {
    id: string;
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnail: string | null;
    url?: string;
    embedUrl?: string;
}

export interface YouTubeFavorite extends YouTubeVideo {
    addedAt: string;
}

export interface YouTubeError {
    code: YouTubeErrorCode;
    message: string;
    isRetryable: boolean;
}

interface YouTubeState {
    currentVideo: YouTubeVideo | null;
    isPlaying: boolean;
    isLooping: boolean;
    volume: number;
    favorites: YouTubeFavorite[];
    recommendations: YouTubeVideo[];
    searchResults: YouTubeVideo[];
    isLoading: boolean;
    error: YouTubeError | null;

    // Actions
    setCurrentVideo: (video: YouTubeVideo | null) => void;
    setIsPlaying: (playing: boolean) => void;
    setIsLooping: (looping: boolean) => void;
    setVolume: (volume: number) => void;
    clearError: () => void;

    // API Calls
    searchVideos: (query: string) => Promise<void>;
    fetchMoodRecommendations: (mood: string) => Promise<void>;
    fetchFavorites: () => Promise<void>;
    toggleFavorite: (video: YouTubeVideo) => Promise<void>;
    isFavorite: (videoId: string) => boolean;

    // Playback Helpers
    playVideo: (video: YouTubeVideo) => void;
    stopVideo: () => void;
    setSearchResults: (results: YouTubeVideo[]) => void;
}

// ============================================
// ERROR MESSAGE HELPERS
// ============================================
const getUserFriendlyErrorMessage = (code: YouTubeErrorCode): string => {
    switch (code) {
        case YOUTUBE_ERROR_CODES.QUOTA_EXCEEDED:
            return 'Daily YouTube search limit reached. Please try again tomorrow.';
        case YOUTUBE_ERROR_CODES.PERMISSION_DENIED:
            return 'YouTube access is not configured. Please contact support.';
        case YOUTUBE_ERROR_CODES.IP_BLOCKED:
            return 'YouTube API access is blocked. Please contact support.';
        case YOUTUBE_ERROR_CODES.INVALID_KEY:
            return 'YouTube API configuration error. Please contact support.';
        case YOUTUBE_ERROR_CODES.MISSING_API_KEY:
            return 'YouTube search is not available. Please contact support.';
        case YOUTUBE_ERROR_CODES.NETWORK_ERROR:
            return 'Network error. Please check your connection and try again.';
        case YOUTUBE_ERROR_CODES.RATE_LIMITED:
            return 'Too many requests. Please wait a moment and try again.';
        case YOUTUBE_ERROR_CODES.INVALID_QUERY:
            return 'Please enter a valid search term (at least 2 characters).';
        default:
            return 'Failed to search YouTube. Please try again.';
    }
};

const parseApiError = (err: unknown): YouTubeError => {
    if (err instanceof AxiosError && err.response?.data?.error) {
        const apiError = err.response.data.error;
        return {
            code: apiError.code || YOUTUBE_ERROR_CODES.UNKNOWN_ERROR,
            message: getUserFriendlyErrorMessage(apiError.code),
            isRetryable: apiError.isRetryable ?? false,
        };
    }
    return {
        code: YOUTUBE_ERROR_CODES.UNKNOWN_ERROR,
        message: 'An unexpected error occurred. Please try again.',
        isRetryable: true,
    };
};

// ============================================
// STORE
// ============================================
export const useYouTubeStore = create<YouTubeState>()(
    persist(
        (set, get) => ({
            currentVideo: null,
            isPlaying: false,
            isLooping: false,
            volume: 50,
            favorites: [],
            recommendations: [],
            searchResults: [],
            isLoading: false,
            error: null,

            setCurrentVideo: (video) => set({ currentVideo: video }),
            setIsPlaying: (playing) => set({ isPlaying: playing }),
            setIsLooping: (looping) => set({ isLooping: looping }),
            setVolume: (volume) => set({ volume }),
            setSearchResults: (results) => set({ searchResults: results }),
            clearError: () => set({ error: null }),

            searchVideos: async (query) => {
                if (!query || query.trim().length < 2) {
                    set({ searchResults: [], error: null });
                    return;
                }
                
                set({ isLoading: true, error: null });
                
                try {
                    const { data } = await api.get(`/youtube/search?q=${encodeURIComponent(query.trim())}`);
                    
                    if (data.success && data.data?.results) {
                        set({ 
                            searchResults: data.data.results, 
                            isLoading: false,
                            error: null,
                        });
                    } else {
                        set({ 
                            searchResults: [], 
                            isLoading: false,
                            error: {
                                code: YOUTUBE_ERROR_CODES.UNKNOWN_ERROR,
                                message: 'Unexpected response format',
                                isRetryable: true,
                            }
                        });
                    }
                } catch (err) {
                    const error = parseApiError(err);
                    set({ 
                        searchResults: [],
                        error,
                        isLoading: false,
                    });
                    console.error('[YouTubeStore] Search error:', error);
                }
            },

            fetchMoodRecommendations: async (mood) => {
                set({ isLoading: true, error: null });
                
                try {
                    const { data } = await api.get(`/youtube/mood/${encodeURIComponent(mood)}`);
                    
                    if (data.success && data.data?.results) {
                        set({ 
                            recommendations: data.data.results, 
                            isLoading: false,
                            error: null,
                        });
                    } else {
                        set({ 
                            recommendations: [], 
                            isLoading: false,
                        });
                    }
                } catch (err) {
                    const error = parseApiError(err);
                    console.error('[YouTubeStore] Mood recommendations error:', error);
                    // Don't show error for recommendations - just log it
                    set({ recommendations: [], isLoading: false });
                }
            },

            fetchFavorites: async () => {
                try {
                    const { data } = await api.get('/youtube/favorites');
                    if (data.success && data.data?.favorites) {
                        set({ favorites: data.data.favorites });
                    }
                } catch (err) {
                    console.error('[YouTubeStore] Favorites fetch failed:', err);
                }
            },

            toggleFavorite: async (video) => {
                const isFav = get().isFavorite(video.videoId);
                if (isFav) {
                    // Optimistic remove
                    set((s) => ({ favorites: s.favorites.filter((f) => f.videoId !== video.videoId) }));
                    try {
                        await api.delete(`/youtube/favorites/${video.videoId}`);
                    } catch {
                        get().fetchFavorites(); // Rollback
                    }
                } else {
                    // Optimistic add
                    const newFav = { ...video, addedAt: new Date().toISOString() };
                    set((s) => ({ favorites: [newFav as YouTubeFavorite, ...s.favorites] }));
                    try {
                        await api.post('/youtube/favorite', video);
                    } catch {
                        get().fetchFavorites(); // Rollback
                    }
                }
            },

            isFavorite: (videoId) => get().favorites.some((f) => f.videoId === videoId),

            playVideo: (video) => {
                set({ currentVideo: video, isPlaying: true });
            },

            stopVideo: () => set({ currentVideo: null, isPlaying: false }),
        }),
        {
            name: 'youtube-storage',
            partialize: (state) => ({
                favorites: state.favorites,
                currentVideo: state.currentVideo,
                volume: state.volume,
                isLooping: state.isLooping,
            }),
        }
    )
);
