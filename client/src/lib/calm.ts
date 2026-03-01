// ============================================
// Calm Space API Client
// ============================================
// Frontend API functions for Calm Space feature.
// ============================================

import api from './api';

// ============================================
// TYPES
// ============================================

export interface SoundConfig {
  id: string;
  name: string;
  emoji: string;
  description: string;
  audioUrl: string;
  color: string;
  bgGradient: string;
  category: string;
}

export interface SoundSuggestion {
  mood: string;
  suggestedSound: string;
  soundId: string;
  reason: string;
}

export interface AISoundSuggestion {
  suggestion: string;
  recommendedSounds: string[];
  personalizedMessage: string;
}

export interface CalmSessionInput {
  sound: string;
  duration: number;
  focusMode?: boolean;
  completed?: boolean;
}

export interface CalmStats {
  totalSessions: number;
  totalMinutes: number;
  favoriteSounds: Array<{ sound: string; count: number }>;
  focusSessions: number;
  averageSessionLength: number;
  weeklyActivity: Array<{ date: string; sessions: number; minutes: number }>;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ============================================
// SOUND LIBRARY
// ============================================

export const SOUNDS: SoundConfig[] = [
  {
    id: 'rain',
    name: 'Rain',
    emoji: '🌧️',
    description: 'Gentle rainfall for peaceful moments',
    audioUrl: '/sounds/rain.mp3',
    color: 'from-blue-400 to-blue-600',
    bgGradient: 'bg-gradient-to-br from-blue-50 to-blue-100',
    category: 'Nature',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    description: 'Calming waves washing ashore',
    audioUrl: '/sounds/ocean.mp3',
    color: 'from-cyan-400 to-teal-600',
    bgGradient: 'bg-gradient-to-br from-cyan-50 to-teal-100',
    category: 'Nature',
  },
  {
    id: 'soft-piano',
    name: 'Soft Piano',
    emoji: '🎹',
    description: 'Gentle melodies for reflection',
    audioUrl: '/sounds/soft-piano.mp3',
    color: 'from-purple-400 to-pink-500',
    bgGradient: 'bg-gradient-to-br from-purple-50 to-pink-100',
    category: 'Focus',
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    emoji: '🔥',
    description: 'Warm crackling fire sounds',
    audioUrl: '/sounds/fireplace.mp3',
    color: 'from-orange-400 to-red-500',
    bgGradient: 'bg-gradient-to-br from-orange-50 to-red-100',
    category: 'Sleep',
  },
  {
    id: 'wind',
    name: 'Wind',
    emoji: '🌬️',
    description: 'Soft breeze through the trees',
    audioUrl: '/sounds/wind.mp3',
    color: 'from-gray-400 to-slate-500',
    bgGradient: 'bg-gradient-to-br from-gray-50 to-slate-100',
    category: 'Nature',
  },
  {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    description: 'Birds and nature ambience',
    audioUrl: '/sounds/forest.mp3',
    color: 'from-green-400 to-emerald-600',
    bgGradient: 'bg-gradient-to-br from-green-50 to-emerald-100',
    category: 'Nature',
  },
];

export const getSoundById = (id: string): SoundConfig | undefined => {
  return SOUNDS.find(s => s.id === id);
};

export const getSoundByName = (name: string): SoundConfig | undefined => {
  return SOUNDS.find(s => s.name.toLowerCase() === name.toLowerCase());
};

// ============================================
// TIMER PRESETS
// ============================================

export const TIMER_PRESETS = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 25, label: '25 min' },
  { value: 45, label: '45 min' },
];

export const FOCUS_PRESETS = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
};

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get mood-based sound suggestion
 */
export const getSoundSuggestion = async (): Promise<SoundSuggestion> => {
  const response = await api.get<ApiResponse<SoundSuggestion>>('/calm/suggestion');
  return response.data.data;
};

/**
 * Get AI-powered sound suggestion
 */
export const getAISoundSuggestion = async (): Promise<AISoundSuggestion> => {
  const response = await api.post<ApiResponse<AISoundSuggestion>>('/calm/ai-suggestion');
  return response.data.data;
};

/**
 * Save a calm session
 */
export const saveCalmSession = async (data: CalmSessionInput): Promise<void> => {
  await api.post('/calm/session', data);
};

/**
 * Get calm statistics
 */
export const getCalmStats = async (): Promise<CalmStats> => {
  const response = await api.get<ApiResponse<{ stats: CalmStats }>>('/calm/stats');
  return response.data.data.stats;
};