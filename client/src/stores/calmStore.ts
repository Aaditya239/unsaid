// ============================================
// Calm Store (Zustand)
// ============================================
// Global state management for Calm Space.
// ============================================

import { create } from 'zustand';
import { useMoodStore } from './moodStore';
import {
  SoundSuggestion,
  AISoundSuggestion,
  CalmStats,
  getSoundSuggestion,
  getAISoundSuggestion,
  saveCalmSession,
  getCalmStats,
  CalmSessionInput,
} from '@/lib/calm';

interface CalmState {
  // Suggestions
  moodSuggestion: SoundSuggestion | null;
  aiSuggestion: AISoundSuggestion | null;

  // Stats
  stats: CalmStats | null;

  // UI State
  isLoadingSuggestion: boolean;
  isLoadingAISuggestion: boolean;
  isLoadingStats: boolean;
  isSavingSession: boolean;
  error: string | null;
}

interface CalmActions {
  fetchMoodSuggestion: () => Promise<void>;
  fetchAISuggestion: () => Promise<void>;
  fetchStats: () => Promise<void>;
  saveSession: (data: CalmSessionInput) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type CalmStore = CalmState & CalmActions;

export const useCalmStore = create<CalmStore>((set) => ({
  // Initial state
  moodSuggestion: null,
  aiSuggestion: null,
  stats: null,
  isLoadingSuggestion: false,
  isLoadingAISuggestion: false,
  isLoadingStats: false,
  isSavingSession: false,
  error: null,

  // Fetch mood-based suggestion
  fetchMoodSuggestion: async () => {
    set({ isLoadingSuggestion: true, error: null });
    try {
      const suggestion = await getSoundSuggestion();
      set({ moodSuggestion: suggestion, isLoadingSuggestion: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to get suggestion',
        isLoadingSuggestion: false,
      });
    }
  },

  // Fetch AI suggestion
  fetchAISuggestion: async () => {
    set({ isLoadingAISuggestion: true, error: null });
    try {
      const suggestion = await getAISoundSuggestion();
      set({ aiSuggestion: suggestion, isLoadingAISuggestion: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to get AI suggestion',
        isLoadingAISuggestion: false,
      });
    }
  },

  // Fetch stats
  fetchStats: async () => {
    set({ isLoadingStats: true, error: null });
    try {
      const stats = await getCalmStats();
      set({ stats, isLoadingStats: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to get stats',
        isLoadingStats: false,
      });
    }
  },

  // Save session
  saveSession: async (data: CalmSessionInput) => {
    set({ isSavingSession: true, error: null });
    try {
      await saveCalmSession(data);
      // Refresh stats after saving
      const stats = await getCalmStats();
      set({ stats, isSavingSession: false });

      // Sync growth/XP data
      useMoodStore.getState().fetchStreak();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save session',
        isSavingSession: false,
      });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    moodSuggestion: null,
    aiSuggestion: null,
    stats: null,
    error: null,
  }),
}));