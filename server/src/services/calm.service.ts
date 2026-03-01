// ============================================
// Calm Space Service
// ============================================
// Business logic for mood-based sound suggestions,
// AI recommendations, and session tracking.
// ============================================

import Groq from 'groq-sdk';
import prisma from '../utils/prisma';
import { awardXP } from './streak.service';
import { Mood } from '@prisma/client';
import { InternalError } from '../utils/appError';
import { XP_RULES } from '../config/xpRules';

// ============================================
// TYPES
// ============================================

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

// ============================================
// MOOD TO SOUND MAPPING
// ============================================

const MOOD_SOUND_MAP: Record<string, { sound: string; id: string; reason: string }> = {
  HAPPY: {
    sound: 'Soft Piano',
    id: 'soft-piano',
    reason: 'Gentle melodies complement your positive energy'
  },
  SAD: {
    sound: 'Rain',
    id: 'rain',
    reason: 'The soothing sound of rain can be comforting during difficult moments'
  },
  ANGRY: {
    sound: 'Wind',
    id: 'wind',
    reason: 'Gentle wind sounds help release tension and restore calm'
  },
  CALM: {
    sound: 'Fireplace',
    id: 'fireplace',
    reason: 'The warm crackle maintains your peaceful state'
  },
  ANXIOUS: {
    sound: 'Ocean',
    id: 'ocean',
    reason: 'Ocean waves promote deep breathing and reduce anxiety'
  },
  EXCITED: {
    sound: 'Forest',
    id: 'forest',
    reason: 'Nature sounds help channel your energy into focus'
  },
  TIRED: {
    sound: 'Rain',
    id: 'rain',
    reason: 'Gentle rain creates a cozy atmosphere for rest'
  },
  STRESSED: {
    sound: 'Ocean',
    id: 'ocean',
    reason: 'Rhythmic waves ease tension and promote relaxation'
  },
  GRATEFUL: {
    sound: 'Soft Piano',
    id: 'soft-piano',
    reason: 'Soft melodies enhance your warm, grateful feelings'
  },
  NEUTRAL: {
    sound: 'Forest',
    id: 'forest',
    reason: 'Natural sounds create a balanced, peaceful environment'
  },
};

// ============================================
// GROQ CLIENT
// ============================================

const isAIConfigured = (): boolean => {
  const apiKey = process.env.GROQ_API_KEY;
  return !!(apiKey && apiKey.startsWith('gsk_'));
};

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy-key',
});

const AI_MODEL = 'llama-3.3-70b-versatile';

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Get sound suggestion based on user's latest mood
 */
export const getSoundSuggestion = async (userId: string): Promise<SoundSuggestion> => {
  // Fetch latest mood entry
  const latestMood = await prisma.moodEntry.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { mood: true },
  });

  // Default mood if no entries exist
  const mood = latestMood?.mood || 'NEUTRAL';
  const suggestion = MOOD_SOUND_MAP[mood] || MOOD_SOUND_MAP.NEUTRAL;

  return {
    mood,
    suggestedSound: suggestion.sound,
    soundId: suggestion.id,
    reason: suggestion.reason,
  };
};

/**
 * Get AI-powered sound suggestion based on mood history and journal
 */
export const getAISoundSuggestion = async (userId: string): Promise<AISoundSuggestion> => {
  // Check AI configuration
  if (!isAIConfigured()) {
    return getDefaultAISuggestion(userId);
  }

  try {
    // Fetch last 5 mood entries
    const recentMoods = await prisma.moodEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { mood: true, intensity: true, note: true, createdAt: true },
    });

    // Fetch latest journal entry for context
    const latestJournal = await prisma.journalEntry.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { content: true, emotion: true },
    });

    // Build context for AI
    const moodContext = recentMoods.length > 0
      ? recentMoods.map(m => `${m.mood} (intensity: ${m.intensity})`).join(', ')
      : 'No recent mood data';

    const journalContext = latestJournal
      ? `Recent journal: ${latestJournal.content.substring(0, 200)}...`
      : 'No recent journal entries';

    const prompt = `Based on this user's emotional context, suggest calming sounds.

Recent moods: ${moodContext}
${journalContext}

Available sounds: Rain, Ocean, Soft Piano, Fireplace, Wind, Forest

Provide:
1. A brief, warm explanation (2-3 sentences) of why certain sounds would help
2. List 1-3 recommended sounds from the available options

Keep your response calm, supportive, and avoid any medical/therapeutic claims.
Format your response as JSON: { "suggestion": "...", "recommendedSounds": ["..."] }`;

    const completion = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a gentle wellness companion helping users find calming sounds. Be warm and supportive. Respond only in valid JSON format.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        suggestion: parsed.suggestion || 'Let gentle sounds guide you to a peaceful state.',
        recommendedSounds: parsed.recommendedSounds || ['Rain', 'Ocean'],
        personalizedMessage: `Based on your recent emotional journey, these sounds were chosen for you.`,
      };
    }

    return getDefaultAISuggestion(userId);
  } catch (error) {
    console.error('AI suggestion error:', error);
    return getDefaultAISuggestion(userId);
  }
};

/**
 * Fallback when AI is not available
 */
const getDefaultAISuggestion = async (userId: string): Promise<AISoundSuggestion> => {
  const suggestion = await getSoundSuggestion(userId);
  return {
    suggestion: suggestion.reason,
    recommendedSounds: [suggestion.suggestedSound],
    personalizedMessage: `Based on your ${suggestion.mood.toLowerCase()} mood, we recommend ${suggestion.suggestedSound}.`,
  };
};

/**
 * Save a completed calm session
 * Awards 8 XP for completed focus sessions
 */
export const saveCalmSession = async (
  userId: string,
  data: CalmSessionInput
) => {
  const session = await prisma.calmSession.create({
    data: {
      userId,
      sound: data.sound,
      duration: data.duration,
      focusMode: data.focusMode ?? false,
      completed: data.completed ?? true,
    },
  });

  // Award 10 XP for completed sessions
  if (data.completed !== false) {
    await awardXP(userId, XP_RULES.FOCUS_SESSION);
  }

  return session;
};

/**
 * Get calm statistics for user
 */
export const getCalmStats = async (userId: string): Promise<CalmStats> => {
  // Get all sessions
  const sessions = await prisma.calmSession.findMany({
    where: { userId },
  });

  // Calculate total minutes
  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
  const focusSessions = sessions.filter(s => s.focusMode).length;
  const averageSessionLength = sessions.length > 0
    ? Math.round(totalMinutes / sessions.length)
    : 0;

  // Count favorite sounds
  const soundCounts: Record<string, number> = {};
  sessions.forEach(s => {
    soundCounts[s.sound] = (soundCounts[s.sound] || 0) + 1;
  });

  const favoriteSounds = Object.entries(soundCounts)
    .map(([sound, count]) => ({ sound, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Weekly activity (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyActivity: Array<{ date: string; sessions: number; minutes: number }> = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const daySessions = sessions.filter(s => {
      const sessionDate = new Date(s.createdAt).toISOString().split('T')[0];
      return sessionDate === dateStr;
    });

    weeklyActivity.push({
      date: dateStr,
      sessions: daySessions.length,
      minutes: daySessions.reduce((acc, s) => acc + s.duration, 0),
    });
  }

  return {
    totalSessions: sessions.length,
    totalMinutes,
    favoriteSounds,
    focusSessions,
    averageSessionLength,
    weeklyActivity,
  };
};