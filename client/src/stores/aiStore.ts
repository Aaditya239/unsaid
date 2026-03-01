// ============================================
// AI Store (Zustand)
// ============================================
// Global state management for AI emotional support.
// Handles conversations, weekly summaries, and daily reflections.
// ============================================

import { create } from 'zustand';
import { AxiosError } from 'axios';
import {
  AIConversation,
  AISupportResponse,
  WeeklySummary,
  DailyReflection,
  sendSupportMessage,
  getConversationHistory,
  getWeeklySummary,
  getDailyReflection,
} from '@/lib/ai';

// ============================================
// TYPES
// ============================================

interface AIState {
  // Conversations
  conversations: AIConversation[];
  
  // Weekly summary
  weeklySummary: WeeklySummary | null;
  
  // Daily reflection
  dailyReflection: DailyReflection | null;
  
  // UI state
  isLoading: boolean;
  isSending: boolean;
  isLoadingSummary: boolean;
  isLoadingReflection: boolean;
  error: string | null;
}

interface AIActions {
  // Conversation operations
  sendMessage: (message: string) => Promise<AISupportResponse>;
  fetchConversations: (limit?: number) => Promise<void>;
  
  // Weekly summary
  fetchWeeklySummary: () => Promise<void>;
  
  // Daily reflection
  fetchDailyReflection: () => Promise<void>;
  
  // State management
  clearError: () => void;
  reset: () => void;
}

type AIStore = AIState & AIActions;

// ============================================
// STORE
// ============================================

export const useAIStore = create<AIStore>((set, get) => ({
  // Initial state
  conversations: [],
  weeklySummary: null,
  dailyReflection: null,
  isLoading: false,
  isSending: false,
  isLoadingSummary: false,
  isLoadingReflection: false,
  error: null,

  // ============================================
  // CONVERSATION OPERATIONS
  // ============================================

  /**
   * Send message to AI support
   */
  sendMessage: async (message: string): Promise<AISupportResponse> => {
    set({ isSending: true, error: null });

    try {
      const response = await sendSupportMessage(message);
      
      // Add to conversations list
      const newConversation: AIConversation = {
        id: response.id,
        message: response.message,
        response: response.response,
        createdAt: response.createdAt,
      };
      
      set((state) => ({
        conversations: [...state.conversations, newConversation],
        isSending: false,
      }));
      
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to send message';
      
      set({ isSending: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Fetch conversation history
   */
  fetchConversations: async (limit: number = 20) => {
    set({ isLoading: true, error: null });

    try {
      const result = await getConversationHistory(limit);
      set({
        conversations: result.conversations,
        isLoading: false,
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to load conversations';
      
      set({ isLoading: false, error: errorMessage });
    }
  },

  // ============================================
  // WEEKLY SUMMARY
  // ============================================

  /**
   * Fetch weekly emotional summary
   */
  fetchWeeklySummary: async () => {
    set({ isLoadingSummary: true, error: null });

    try {
      const summary = await getWeeklySummary();
      set({
        weeklySummary: summary,
        isLoadingSummary: false,
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to load weekly summary';
      
      set({ isLoadingSummary: false, error: errorMessage });
    }
  },

  // ============================================
  // DAILY REFLECTION
  // ============================================

  /**
   * Fetch daily reflection prompt
   */
  fetchDailyReflection: async () => {
    set({ isLoadingReflection: true, error: null });

    try {
      const reflection = await getDailyReflection();
      set({
        dailyReflection: reflection,
        isLoadingReflection: false,
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to load daily reflection';
      
      set({ isLoadingReflection: false, error: errorMessage });
    }
  },

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),

  /**
   * Reset store
   */
  reset: () => set({
    conversations: [],
    weeklySummary: null,
    dailyReflection: null,
    isLoading: false,
    isSending: false,
    isLoadingSummary: false,
    isLoadingReflection: false,
    error: null,
  }),
}));
