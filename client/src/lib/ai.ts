// ============================================
// AI API Client
// ============================================
// API functions for AI emotional support features.
// ============================================

import { api } from './api';

// ============================================
// TYPES
// ============================================

export interface AIConversation {
  id: string;
  message: string;
  response: string;
  createdAt: string;
}

export interface AISupportResponse {
  id: string;
  message: string;
  response: string;
  isCrisisDetected: boolean;
  contextUsed: boolean;
  createdAt: string;
}

export interface AIEmotionResponse {
  success: boolean;
  reply: string;
}

export interface WeeklySummary {
  dominantMood: string | null;
  averageIntensity: number;
  insightMessage: string;
  encouragement: string;
  moodDistribution: Record<string, number>;
  entryCount: number;
}

export interface DailyReflection {
  question: string;
  encouragement: string;
  cached: boolean;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Send message to AI emotional support
 */
export const sendSupportMessage = async (message: string): Promise<AISupportResponse> => {
  const response = await api.post('/ai/support', { message });
  return response.data.data;
};

/**
 * Send message to AI Emotion Supporter explicitly mapped to /api/ai/emotion
 */
export const sendEmotionSupportMessage = async (message: string, userName: string): Promise<string> => {
  const response = await api.post('/ai/emotion', { message, userName });
  return response.data.reply;
};

/**
 * Get conversation history
 */
export const getConversationHistory = async (limit: number = 20): Promise<{
  conversations: AIConversation[];
  count: number;
}> => {
  const response = await api.get('/ai/conversations', { params: { limit } });
  return response.data.data;
};

/**
 * Get weekly emotional summary
 */
export const getWeeklySummary = async (): Promise<WeeklySummary> => {
  const response = await api.get('/ai/weekly-summary');
  return response.data.data;
};

/**
 * Get daily reflection prompt
 */
export const getDailyReflection = async (): Promise<DailyReflection> => {
  const response = await api.get('/ai/daily-reflection');
  return response.data.data;
};
