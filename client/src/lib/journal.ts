// ============================================
// Journal API Client
// ============================================

import { api } from './api';

export type Emotion =
  | 'HAPPY'
  | 'SAD'
  | 'ANXIOUS'
  | 'CALM'
  | 'ANGRY'
  | 'GRATEFUL'
  | 'HOPEFUL'
  | 'CONFUSED'
  | 'EXCITED'
  | 'NEUTRAL'
  | 'TIRED';

export interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  emotion: Emotion | null;
  intensity: number | null;
  aiResponse: string | null;
  mode: 'QUICK' | 'GUIDED' | 'DEEP' | 'CHAT';
  tags: string[];
  imageUrl: string | null;
  musicTitle: string | null;
  musicArtist: string | null;
  musicThumbnail: string | null;
  musicVideoId: string | null;
  musicUrl: string | null;
  musicPlatform: string | null;
  isPinned: boolean;
  affectedBy: string | null;
  energyLevel: string | null;
  drainedBy: string[];
  need: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalInput {
  title?: string | null;
  content: string;
  emotion?: Emotion | null;
  intensity?: number | null;
  aiResponse?: string | null;
  mode?: 'QUICK' | 'GUIDED' | 'DEEP' | 'CHAT';
  tags?: string[];
  imageUrl?: string | null;
  musicTitle?: string | null;
  musicArtist?: string | null;
  musicThumbnail?: string | null;
  musicVideoId?: string | null;
  musicUrl?: string | null;
  musicPlatform?: string | null;
  affectedBy?: string | null;
  energyLevel?: string | null;
  drainedBy?: string[];
  need?: string | null;
}

export interface UpdateJournalInput {
  title?: string | null;
  content?: string;
  emotion?: Emotion | null;
  intensity?: number | null;
  aiResponse?: string | null;
  mode?: 'QUICK' | 'GUIDED' | 'DEEP' | 'CHAT';
  tags?: string[];
  imageUrl?: string | null;
  musicTitle?: string | null;
  musicArtist?: string | null;
  musicThumbnail?: string | null;
  musicVideoId?: string | null;
  musicUrl?: string | null;
  musicPlatform?: string | null;
  isPinned?: boolean;
  affectedBy?: string | null;
  energyLevel?: string | null;
  drainedBy?: string[];
  need?: string | null;
}

export interface JournalQueryParams {
  search?: string;
  emotion?: Emotion;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface JournalListResponse {
  entries: JournalEntry[];
  pagination: PaginationInfo;
}

export interface JournalStats {
  totalEntries: number;
  emotionCounts: Record<string, number>;
  recentActivity: number;
}

export const EMOTIONS: { value: Emotion; label: string; emoji: string; color: string }[] = [
  { value: 'HAPPY', label: 'Happy', emoji: '😊', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'SAD', label: 'Sad', emoji: '😢', color: 'bg-blue-100 text-blue-800' },
  { value: 'ANXIOUS', label: 'Anxious', emoji: '😰', color: 'bg-purple-100 text-purple-800' },
  { value: 'CALM', label: 'Calm', emoji: '😌', color: 'bg-green-100 text-green-800' },
  { value: 'ANGRY', label: 'Angry', emoji: '😠', color: 'bg-red-100 text-red-800' },
  { value: 'GRATEFUL', label: 'Grateful', emoji: '🙏', color: 'bg-pink-100 text-pink-800' },
  { value: 'HOPEFUL', label: 'Hopeful', emoji: '🌟', color: 'bg-amber-100 text-amber-800' },
  { value: 'CONFUSED', label: 'Confused', emoji: '😕', color: 'bg-gray-100 text-gray-800' },
  { value: 'EXCITED', label: 'Excited', emoji: '🎉', color: 'bg-orange-100 text-orange-800' },
  { value: 'NEUTRAL', label: 'Neutral', emoji: '😐', color: 'bg-slate-100 text-slate-800' },
  { value: 'TIRED', label: 'Tired', emoji: '🥱', color: 'bg-indigo-100 text-indigo-800' },
];

export const getEmotionInfo = (emotion: Emotion | null) => {
  if (!emotion) return null;
  return EMOTIONS.find((e) => e.value === emotion);
};

// ============================================
// API METHODS
// ============================================

export const createJournalEntry = async (
  data: CreateJournalInput
): Promise<JournalEntry> => {
  const response = await api.post('/journal', data);
  return response.data.data.entry;
};

export const getJournalEntries = async (
  params: JournalQueryParams = {}
): Promise<JournalListResponse> => {
  const response = await api.get('/journal', { params });
  return response.data.data;
};

export const getJournalEntry = async (id: string): Promise<JournalEntry> => {
  const response = await api.get(`/journal/${id}`);
  return response.data.data.entry;
};

export const updateJournalEntry = async (
  id: string,
  data: UpdateJournalInput
): Promise<JournalEntry> => {
  const response = await api.put(`/journal/${id}`, data);
  return response.data.data.entry;
};

export const deleteJournalEntry = async (id: string): Promise<void> => {
  await api.delete(`/journal/${id}`);
};

export const getJournalStats = async (): Promise<JournalStats> => {
  const response = await api.get('/journal/stats');
  return response.data.data.stats;
};

export const pinJournalEntry = async (id: string, isPinned: boolean): Promise<JournalEntry> => {
  const response = await api.put(`/journal/${id}`, { isPinned });
  return response.data.data.entry;
};

// ============================================
// UPLOAD API
// ============================================

export const uploadImageFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data.data.imageUrl;
};

// ============================================
// MUSIC API (YOUTUBE)
// ============================================

export interface YouTubeMusic {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
  embedUrl?: string;
}

export interface YouTubeSearchError {
  code: string;
  message: string;
  isRetryable: boolean;
}

export class YouTubeMusicSearchError extends Error {
  public code: string;
  public isRetryable: boolean;

  constructor(error: YouTubeSearchError) {
    super(error.message);
    this.name = 'YouTubeMusicSearchError';
    this.code = error.code;
    this.isRetryable = error.isRetryable;
  }
}

export const searchYouTubeMusic = async (query: string): Promise<YouTubeMusic[]> => {
  try {
    const response = await api.get('/youtube/search', { params: { q: query.trim() } });

    if (response.data.success && response.data.data?.results) {
      return response.data.data.results.map((result: any): YouTubeMusic => ({
        id: result.id || result.videoId,
        videoId: result.videoId,
        title: result.title,
        channelTitle: result.channelTitle,
        thumbnail: result.thumbnail || '',
        url: result.url || `https://www.youtube.com/watch?v=${result.videoId}`,
        embedUrl: result.embedUrl || `https://www.youtube.com/embed/${result.videoId}`,
      }));
    }

    return [];
  } catch (err: any) {
    // Extract error from API response
    if (err.response?.data?.error) {
      throw new YouTubeMusicSearchError(err.response.data.error);
    }

    // Network or other error
    throw new YouTubeMusicSearchError({
      code: 'YOUTUBE_NETWORK_ERROR',
      message: 'Failed to connect to server. Please check your connection.',
      isRetryable: true,
    });
  }
};

export const attachMusicToJournal = async (entryId: string, musicData: Partial<YouTubeMusic>): Promise<JournalEntry> => {
  const response = await api.post(`/journal/${entryId}/attach-music`, {
    musicTitle: musicData.title,
    musicArtist: musicData.channelTitle,
    musicThumbnail: musicData.thumbnail,
    musicVideoId: musicData.videoId,
    musicUrl: musicData.url,
    musicPlatform: 'YOUTUBE'
  });
  return response.data.data.entry;
};
