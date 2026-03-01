// ============================================
// Mood Store (Zustand)
// ============================================
// Global state management for mood tracking.
// Handles mood logging, history, and statistics.
// ============================================

import { create } from 'zustand';
import { AxiosError } from 'axios';
import api from '@/lib/api';
import {
  MoodEntry,
  MoodStats,
  Mood,
  CreateMoodInput,
  MoodQueryParams,
  PaginationInfo,
  logMood,
  getMoodHistory,
  getMoodStats,
  deleteMoodEntry,
} from '@/lib/mood';

// ============================================
// TYPES
// ============================================

interface MoodState {
  // Mood entries
  entries: MoodEntry[];
  pagination: PaginationInfo | null;

  // Statistics
  stats: MoodStats | null;

  // Range filter
  range: 'week' | 'month' | 'all';

  // Emotional Analysis
  emotionalAnalysis: {
    dominantMood: string | null;
    moodShiftTrend: string;
    averageIntensity: number;
    supportiveSentences: string[];
    insightSentence: string;
    suggestion: string;
    moodTaskCorrelation: {
      mood: string;
      completionRate: number;
    } | null;
    entryCount: number;
  } | null;

  // UI state
  isLoading: boolean;
  isLogging: boolean;
  isLoadingStats: boolean;
  isLoadingAnalysis: boolean;
  isLoadingStreak: boolean;
  streak: {
    streak: number;
    isActive: boolean;
    lastReflectionAt: string | null;
    xp: number;
    level: {
      name: string;
      icon: string;
      nextLevelThreshold: number | null;
      currentRange: string;
    };
  } | null;
  error: string | null;
}

interface MoodActions {
  // Entry operations
  fetchEntries: (params?: MoodQueryParams) => Promise<void>;
  logEntry: (data: CreateMoodInput) => Promise<MoodEntry>;
  removeEntry: (id: string) => Promise<void>;

  // Statistics & Analysis
  fetchStats: (range?: 'week' | 'month') => Promise<void>;
  fetchEmotionalAnalysis: () => Promise<void>;
  fetchStreak: () => Promise<void>;

  // Filters
  setRange: (range: 'week' | 'month' | 'all') => void;

  // State management
  clearError: () => void;
  reset: () => void;
}

type MoodStore = MoodState & MoodActions;

// ============================================
// STORE
// ============================================

export const useMoodStore = create<MoodStore>((set, get) => ({
  // Initial state
  entries: [],
  pagination: null,
  stats: null,
  range: 'week',
  emotionalAnalysis: null,
  isLoading: false,
  isLogging: false,
  isLoadingStats: false,
  isLoadingAnalysis: false,
  isLoadingStreak: false,
  streak: null,
  error: null,

  // ============================================
  // ENTRY OPERATIONS
  // ============================================

  /**
   * Fetch mood entries with current range
   */
  fetchEntries: async (params?: MoodQueryParams) => {
    const state = get();
    set({ isLoading: true, error: null });

    try {
      const queryParams: MoodQueryParams = {
        range: params?.range ?? state.range,
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
      };

      const result = await getMoodHistory(queryParams);

      set({
        entries: result.entries,
        pagination: result.pagination,
        isLoading: false,
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to fetch mood entries',
      });
    }
  },

  /**
   * Log a new mood entry
   */
  logEntry: async (data: CreateMoodInput) => {
    set({ isLogging: true, error: null });

    try {
      const entry = await logMood(data);

      // Add to beginning of entries list
      set((state) => ({
        entries: [entry, ...state.entries],
        isLogging: false,
      }));

      // Refresh stats and streak after logging
      get().fetchStats();
      get().fetchStreak();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mood:logged', { detail: { mood: data.mood, intensity: data.intensity } }));
      }

      return entry;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to log mood';
      set({
        isLogging: false,
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }
  },

  /**
   * Remove a mood entry
   */
  removeEntry: async (id: string) => {
    try {
      await deleteMoodEntry(id);

      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
      }));

      // Refresh stats after deletion
      get().fetchStats();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      set({
        error: axiosError.response?.data?.message || 'Failed to delete entry',
      });
      throw error;
    }
  },

  // ============================================
  // STATISTICS
  // ============================================

  fetchStats: async (range?: 'week' | 'month') => {
    const state = get();
    const statsRange = range ?? (state.range === 'all' ? 'month' : state.range);

    set({ isLoadingStats: true });

    try {
      const stats = await getMoodStats(statsRange as 'week' | 'month');
      set({ stats, isLoadingStats: false });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      set({ isLoadingStats: false });
    }
  },

  fetchEmotionalAnalysis: async () => {
    set({ isLoadingAnalysis: true });
    try {
      const response = await api.get('/ai/emotional-analysis');
      set({
        emotionalAnalysis: response.data.data,
        isLoadingAnalysis: false
      });
    } catch (error) {
      console.error('Failed to fetch emotional analysis:', error);
      set({ isLoadingAnalysis: false });
    }
  },

  fetchStreak: async () => {
    set({ isLoadingStreak: true });
    try {
      const response = await api.get('/api/mood/streak');
      set({
        streak: response.data.data,
        isLoadingStreak: false
      });
    } catch (error) {
      console.error('Failed to fetch streak:', error);
      set({ isLoadingStreak: false });
    }
  },

  // ============================================
  // FILTERS
  // ============================================

  setRange: (range) => {
    set({ range });
    get().fetchEntries({ range });
    if (range !== 'all') {
      get().fetchStats(range);
    }
  },

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      entries: [],
      pagination: null,
      stats: null,
      range: 'week',
      emotionalAnalysis: null,
      isLoading: false,
      isLogging: false,
      isLoadingStats: false,
      isLoadingAnalysis: false,
      streak: null,
      error: null,
    });
  },
}));
