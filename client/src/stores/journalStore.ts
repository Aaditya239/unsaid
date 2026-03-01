// ============================================
// Journal Store (Zustand)
// ============================================
// Global state management for journal entries.
// Handles CRUD operations, filtering, and pagination.
// ============================================

import { create } from 'zustand';
import { AxiosError } from 'axios';
import { useMoodStore } from './moodStore';
import {
  JournalEntry,
  JournalQueryParams,
  PaginationInfo,
  JournalStats,
  Emotion,
  createJournalEntry,
  getJournalEntries,
  getJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalStats,
  pinJournalEntry,
} from '@/lib/journal';

// ============================================
// TYPES
// ============================================

interface JournalState {
  // Journal entries list
  entries: JournalEntry[];
  pagination: PaginationInfo | null;

  // Current entry being edited
  currentEntry: JournalEntry | null;

  // Statistics
  stats: JournalStats | null;

  // Query state
  searchQuery: string;
  emotionFilter: Emotion | null;
  sortBy: 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';

  // UI state
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isSaving: boolean; // For auto-save indicator
  lastSaved: Date | null;
  error: string | null;
}

interface JournalActions {
  // Entry operations
  fetchEntries: (params?: JournalQueryParams) => Promise<void>;
  fetchEntry: (id: string) => Promise<void>;
  createEntry: (data: {
    title?: string;
    content: string;
    emotion?: Emotion;
    intensity?: number;
    aiResponse?: string;
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
  }) => Promise<JournalEntry>;
  updateEntry: (id: string, data: Partial<JournalEntry>) => Promise<JournalEntry>;
  deleteEntry: (id: string) => Promise<void>;

  // Statistics
  fetchStats: () => Promise<void>;

  // Filter actions
  setSearchQuery: (query: string) => void;
  setEmotionFilter: (emotion: Emotion | null) => void;
  setSortBy: (sortBy: 'createdAt' | 'updatedAt') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;

  // State management
  setCurrentEntry: (entry: JournalEntry | null) => void;
  clearError: () => void;
  resetFilters: () => void;

  // Auto-save tracking
  setSaving: (saving: boolean) => void;
  setLastSaved: (date: Date | null) => void;
  pinEntry: (id: string, isPinned: boolean) => Promise<void>;
}

type JournalStore = JournalState & JournalActions;

// ============================================
// STORE
// ============================================

export const useJournalStore = create<JournalStore>((set, get) => ({
  // Initial state
  entries: [],
  pagination: null,
  currentEntry: null,
  stats: null,
  searchQuery: '',
  emotionFilter: null,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isSaving: false,
  lastSaved: null,
  error: null,

  // ============================================
  // ENTRY OPERATIONS
  // ============================================

  /**
   * Fetch journal entries with current filters
   */
  fetchEntries: async (params?: JournalQueryParams) => {
    const state = get();
    set({ isLoading: true, error: null });

    try {
      const queryParams: JournalQueryParams = {
        search: params?.search ?? (state.searchQuery || undefined),
        emotion: params?.emotion ?? state.emotionFilter ?? undefined,
        sortBy: params?.sortBy ?? state.sortBy,
        sortOrder: params?.sortOrder ?? state.sortOrder,
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      };

      const result = await getJournalEntries(queryParams);

      set({
        entries: result.entries,
        pagination: result.pagination,
        isLoading: false,
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to fetch journal entries',
      });
    }
  },

  /**
   * Fetch a single journal entry
   */
  fetchEntry: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const entry = await getJournalEntry(id);
      set({ currentEntry: entry, isLoading: false });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to fetch journal entry',
      });
    }
  },

  /**
   * Create a new journal entry
   */
  createEntry: async (data) => {
    set({ isCreating: true, error: null });

    try {
      const entry = await createJournalEntry(data);

      // Add to entries list at the beginning
      set((state) => ({
        entries: [entry, ...state.entries],
        isCreating: false,
      }));

      // Sync growth/XP data
      useMoodStore.getState().fetchStreak();

      return entry;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      set({
        isCreating: false,
        error: axiosError.response?.data?.message || 'Failed to create journal entry',
      });
      throw error;
    }
  },

  /**
   * Update a journal entry
   */
  updateEntry: async (id, data) => {
    set({ isUpdating: true, error: null });

    try {
      const entry = await updateJournalEntry(id, data);

      // Update in entries list
      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? entry : e)),
        currentEntry: state.currentEntry?.id === id ? entry : state.currentEntry,
        isUpdating: false,
        lastSaved: new Date(),
      }));

      return entry;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      set({
        isUpdating: false,
        error: axiosError.response?.data?.message || 'Failed to update journal entry',
      });
      throw error;
    }
  },

  /**
   * Delete a journal entry
   */
  deleteEntry: async (id) => {
    set({ isDeleting: true, error: null });

    try {
      await deleteJournalEntry(id);

      // Remove from entries list
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        currentEntry: state.currentEntry?.id === id ? null : state.currentEntry,
        isDeleting: false,
      }));
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      set({
        isDeleting: false,
        error: axiosError.response?.data?.message || 'Failed to delete journal entry',
      });
      throw error;
    }
  },

  // ============================================
  // STATISTICS
  // ============================================

  fetchStats: async () => {
    try {
      const stats = await getJournalStats();
      set({ stats });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  // ============================================
  // FILTER ACTIONS
  // ============================================

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setEmotionFilter: (emotion) => {
    set({ emotionFilter: emotion });
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
  },

  setSortOrder: (order) => {
    set({ sortOrder: order });
  },

  resetFilters: () => {
    set({
      searchQuery: '',
      emotionFilter: null,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  },

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  setCurrentEntry: (entry) => {
    set({ currentEntry: entry });
  },

  clearError: () => {
    set({ error: null });
  },

  setSaving: (saving) => {
    set({ isSaving: saving });
  },

  setLastSaved: (date) => {
    set({ lastSaved: date });
  },

  pinEntry: async (id, isPinned) => {
    // Optimistic update
    set((s) => ({
      entries: s.entries.map((e) => e.id === id ? { ...e, isPinned } : e),
    }));
    try {
      await pinJournalEntry(id, isPinned);
    } catch {
      // rollback
      set((s) => ({
        entries: s.entries.map((e) => e.id === id ? { ...e, isPinned: !isPinned } : e),
      }));
    }
  },
}));
