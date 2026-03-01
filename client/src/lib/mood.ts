// ============================================
// Mood API Client
// ============================================
// Frontend API functions for mood tracking.
// Uses the base api client with automatic auth handling.
// ============================================

import api from './api';

// ============================================
// TYPES
// ============================================

export type Mood =
  | 'HAPPY'
  | 'SAD'
  | 'ANGRY'
  | 'CALM'
  | 'ANXIOUS'
  | 'EXCITED'
  | 'TIRED'
  | 'STRESSED'
  | 'GRATEFUL'
  | 'NEUTRAL';

export type EntryType = 'MORNING' | 'NIGHT' | 'MANUAL';

export interface MoodEntry {
  id: string;
  mood: Mood;
  intensity: number;
  note: string | null;
  contextTag: string | null;
  entryType: EntryType;
  createdAt: string;
}

export interface CreateMoodInput {
  mood: Mood;
  intensity: number;
  note?: string;
  contextTag?: string;
  entryType?: EntryType;
}

export interface MoodQueryParams {
  range?: 'week' | 'month' | 'all';
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

export interface MoodListResponse {
  entries: MoodEntry[];
  pagination: PaginationInfo;
}

export interface WeeklyBreakdown {
  date: string;
  averageIntensity: number;
  dominantMood: Mood | null;
  entryCount: number;
}

export interface MoodStats {
  totalEntries: number;
  averageIntensity: number;
  mostFrequentMood: Mood | null;
  moodCounts: Record<string, number>;
  weeklyBreakdown: WeeklyBreakdown[];
  insight: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ============================================
// MOOD CONFIG
// ============================================

export interface MoodConfig {
  value: Mood;
  label: string;
  emoji: string;
  color: string;
  hexColor: string;
  bgColor: string;
}

export const MOODS: MoodConfig[] = [
  { value: 'HAPPY', label: 'Happy', emoji: '😊', color: 'text-yellow-600', hexColor: '#CA8A04', bgColor: 'bg-yellow-100' },
  { value: 'SAD', label: 'Sad', emoji: '😢', color: 'text-blue-600', hexColor: '#2563EB', bgColor: 'bg-blue-100' },
  { value: 'ANGRY', label: 'Angry', emoji: '😠', color: 'text-red-600', hexColor: '#DC2626', bgColor: 'bg-red-100' },
  { value: 'CALM', label: 'Calm', emoji: '😌', color: 'text-green-600', hexColor: '#16A34A', bgColor: 'bg-green-100' },
  { value: 'ANXIOUS', label: 'Anxious', emoji: '😰', color: 'text-purple-600', hexColor: '#9333EA', bgColor: 'bg-purple-100' },
  { value: 'EXCITED', label: 'Excited', emoji: '🤩', color: 'text-orange-600', hexColor: '#EA580C', bgColor: 'bg-orange-100' },
  { value: 'TIRED', label: 'Tired', emoji: '😴', color: 'text-slate-600', hexColor: '#475569', bgColor: 'bg-slate-100' },
  { value: 'STRESSED', label: 'Stressed', emoji: '😫', color: 'text-pink-600', hexColor: '#DB2777', bgColor: 'bg-pink-100' },
  { value: 'GRATEFUL', label: 'Grateful', emoji: '🙏', color: 'text-emerald-600', hexColor: '#059669', bgColor: 'bg-emerald-100' },
  { value: 'NEUTRAL', label: 'Neutral', emoji: '😐', color: 'text-gray-600', hexColor: '#4B5563', bgColor: 'bg-gray-100' },
];

export const getMoodConfig = (mood: Mood): MoodConfig | undefined => {
  return MOODS.find((m) => m.value === mood);
};

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Log a new mood entry
 */
export const logMood = async (data: CreateMoodInput): Promise<MoodEntry> => {
  const response = await api.post<ApiResponse<{ entry: MoodEntry }>>(
    '/mood',
    data
  );
  return response.data.data.entry;
};

/**
 * Get mood history with optional filtering
 */
export const getMoodHistory = async (
  params: MoodQueryParams = {}
): Promise<MoodListResponse> => {
  const response = await api.get<ApiResponse<MoodListResponse>>('/mood', {
    params,
  });
  return response.data.data;
};

/**
 * Get mood statistics and insights
 */
export const getMoodStats = async (
  range: 'week' | 'month' = 'week'
): Promise<MoodStats> => {
  const response = await api.get<ApiResponse<{ stats: MoodStats }>>(
    '/mood/stats',
    { params: { range } }
  );
  return response.data.data.stats;
};

/**
 * Delete a mood entry
 */
export const deleteMoodEntry = async (id: string): Promise<void> => {
  await api.delete(`/mood/${id}`);
};
