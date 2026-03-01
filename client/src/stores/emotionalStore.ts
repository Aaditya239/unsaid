// ============================================
// Unified Emotional State Store
// ============================================
// Central state that connects all emotional data
// across Dashboard, Mood, Journal, Focus, and Calm.
// Everything derives from real user data.
// ============================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import api from '@/lib/api';

// ============================================
// TYPES
// ============================================

export type MoodType = 
  | 'HAPPY' | 'SAD' | 'CALM' | 'ANXIOUS' 
  | 'ANGRY' | 'NEUTRAL' | 'GRATEFUL' | 'TIRED'
  | 'HOPEFUL' | 'CONFUSED' | 'EXCITED';

export interface MoodLog {
  id: string;
  date: string;
  moodType: MoodType;
  intensity: number;
  drainedText?: string;
  helpedText?: string;
  note?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  emotion?: MoodType;
  intensity?: number;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  duration: number; // in minutes
  type: 'timer' | 'pomodoro';
  completedAt: string;
}

export interface GrowthLevel {
  name: string;
  icon: string;
  minXP: number;
  maxXP: number | null;
}

export interface WeeklyBreakdown {
  date: string;
  dominantMood: MoodType | null;
  averageIntensity: number;
  entryCount: number;
}

export interface TinyWin {
  id: string;
  label: string;
  done: boolean;
  icon: string;
}

// ============================================
// GROWTH LEVELS CONFIGURATION
// ============================================

export const GROWTH_LEVELS: GrowthLevel[] = [
  { name: 'Seed', icon: '🌱', minXP: 0, maxXP: 50 },
  { name: 'Sprout', icon: '🌿', minXP: 50, maxXP: 150 },
  { name: 'Growing', icon: '🪴', minXP: 150, maxXP: 300 },
  { name: 'Rooted', icon: '🌳', minXP: 300, maxXP: 600 },
  { name: 'Blooming', icon: '🌸', minXP: 600, maxXP: null },
];

// XP Awards
export const XP_AWARDS = {
  MOOD_LOG: 5,
  JOURNAL_ENTRY: 10,
  FOCUS_SESSION: 8,
  STREAK_BONUS_7_DAY: 15,
  STREAK_BONUS_30_DAY: 50,
};

// ============================================
// STATE INTERFACE
// ============================================

interface EmotionalState {
  // User data
  userId: string | null;
  
  // Mood data
  moodLogs: MoodLog[];
  currentMood: MoodType | null;
  todaysMood: MoodLog | null;
  
  // Journal data
  journalEntries: JournalEntry[];
  
  // Focus data
  focusSessions: FocusSession[];
  totalFocusMinutesThisWeek: number;
  
  // Growth system
  xp: number;
  streak: number;
  isStreakActive: boolean;
  lastActivityAt: string | null;
  
  // Computed summary
  weeklyInsights: {
    dominantMood: MoodType | null;
    averageIntensity: number;
    totalReflections: number;
    moodTrend: 'rising' | 'falling' | 'steady';
    emotionalSummary: string;
  };
  
  weeklyBreakdown: WeeklyBreakdown[];
  
  // Today's state
  todayEnergy: {
    label: string;
    description: string;
    color: string;
  } | null;
  
  // Tiny wins
  tinyWins: TinyWin[];
  
  // Intention
  todayIntention: string | null;
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface EmotionalActions {
  // Initialize all data
  initialize: () => Promise<void>;
  
  // Mood actions
  logMood: (data: {
    mood: MoodType;
    intensity: number;
    drainedText?: string;
    helpedText?: string;
    note?: string;
  }) => Promise<void>;
  
  // Focus actions
  completeFocusSession: (duration: number, type: 'timer' | 'pomodoro') => Promise<void>;
  
  // Growth actions
  awardXP: (amount: number, reason: string) => void;
  
  // Intention
  setTodayIntention: (intention: string) => void;
  
  // Computations
  computeWeeklyInsights: () => void;
  computeTodayEnergy: () => void;
  computeTinyWins: () => void;
  
  // Refresh
  refreshAll: () => Promise<void>;
  
  // Clear
  reset: () => void;
}

type EmotionalStore = EmotionalState & EmotionalActions;

// ============================================
// HELPER FUNCTIONS
// ============================================

function getGrowthLevel(xp: number): GrowthLevel {
  for (let i = GROWTH_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= GROWTH_LEVELS[i].minXP) {
      return GROWTH_LEVELS[i];
    }
  }
  return GROWTH_LEVELS[0];
}

function generateEmotionalSummary(
  dominantMood: MoodType | null,
  avgIntensity: number,
  totalReflections: number,
  trend: 'rising' | 'falling' | 'steady'
): string {
  if (totalReflections === 0) {
    return "Let's start your journey today.";
  }
  
  if (!dominantMood) {
    return "You've been exploring different emotions this week.";
  }

  const moodLabels: Record<MoodType, string> = {
    HAPPY: 'joyful',
    SAD: 'heavy',
    CALM: 'peaceful',
    ANXIOUS: 'restless',
    ANGRY: 'intense',
    NEUTRAL: 'balanced',
    GRATEFUL: 'appreciative',
    TIRED: 'drained',
    HOPEFUL: 'optimistic',
    CONFUSED: 'uncertain',
    EXCITED: 'energized',
  };

  const moodLabel = moodLabels[dominantMood] || 'mixed';
  
  let summary = `You've felt mostly ${moodLabel} this week.`;
  
  if (trend === 'falling' && avgIntensity > 5) {
    summary += ' But your intensity is softening.';
  } else if (trend === 'rising') {
    summary += ' Your energy has been building.';
  } else {
    summary += ' Your energy feels steady.';
  }
  
  summary += ` You've shown up ${totalReflections} time${totalReflections !== 1 ? 's' : ''} — that matters.`;
  
  return summary;
}

function getTodayEnergy(mood: MoodType | null, intensity: number): { label: string; description: string; color: string } | null {
  if (!mood) {
    return {
      label: 'Unknown',
      description: "Let's check in to understand your energy.",
      color: 'text-white/50',
    };
  }

  const energyMap: Record<MoodType, { label: string; description: string; color: string }> = {
    HAPPY: { label: 'Light', description: "You're carrying positive energy today.", color: 'text-amber-400' },
    SAD: { label: 'Heavy', description: "There's weight on your heart today.", color: 'text-blue-400' },
    CALM: { label: 'Peaceful', description: "A stillness flows through you.", color: 'text-teal-400' },
    ANXIOUS: { label: 'Restless', description: "Your mind feels active today.", color: 'text-purple-400' },
    ANGRY: { label: 'Intense', description: "Strong feelings are present.", color: 'text-red-400' },
    NEUTRAL: { label: 'Balanced', description: "You're in a steady place.", color: 'text-slate-400' },
    GRATEFUL: { label: 'Open', description: "Your heart feels appreciative.", color: 'text-rose-400' },
    TIRED: { label: 'Low', description: "Your energy needs restoration.", color: 'text-indigo-400' },
    HOPEFUL: { label: 'Rising', description: "There's light on your horizon.", color: 'text-yellow-400' },
    CONFUSED: { label: 'Scattered', description: "Things feel unclear right now.", color: 'text-gray-400' },
    EXCITED: { label: 'High', description: "You're buzzing with energy.", color: 'text-orange-400' },
  };

  return energyMap[mood] || { label: 'Mixed', description: 'A blend of feelings today.', color: 'text-white/60' };
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useEmotionalStore = create<EmotionalStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    userId: null,
    moodLogs: [],
    currentMood: null,
    todaysMood: null,
    journalEntries: [],
    focusSessions: [],
    totalFocusMinutesThisWeek: 0,
    xp: 0,
    streak: 0,
    isStreakActive: false,
    lastActivityAt: null,
    weeklyInsights: {
      dominantMood: null,
      averageIntensity: 0,
      totalReflections: 0,
      moodTrend: 'steady',
      emotionalSummary: "Let's start your journey today.",
    },
    weeklyBreakdown: [],
    todayEnergy: null,
    tinyWins: [],
    todayIntention: null,
    isLoading: false,
    isInitialized: false,
    error: null,

    // ============================================
    // INITIALIZE
    // ============================================
    
    initialize: async () => {
      if (get().isInitialized) return;
      
      set({ isLoading: true, error: null });
      
      try {
        // Fetch all data in parallel
        const [moodRes, streakRes, journalRes, focusRes] = await Promise.allSettled([
          api.get('/api/mood?range=week&limit=50'),
          api.get('/api/mood/streak'),
          api.get('/api/journal?limit=20'),
          api.get('/api/calm/stats'),
        ]);

        // Process mood data
        let moodLogs: MoodLog[] = [];
        if (moodRes.status === 'fulfilled') {
          moodLogs = moodRes.value.data.data?.entries || [];
        }

        // Process streak data
        let streak = 0;
        let isStreakActive = false;
        let xp = 0;
        let lastActivityAt: string | null = null;
        
        if (streakRes.status === 'fulfilled') {
          const streakData = streakRes.value.data.data;
          streak = streakData?.streak || 0;
          isStreakActive = streakData?.isActive || false;
          xp = streakData?.xp || 0;
          lastActivityAt = streakData?.lastReflectionAt || null;
        }

        // Process journal entries
        let journalEntries: JournalEntry[] = [];
        if (journalRes.status === 'fulfilled') {
          journalEntries = journalRes.value.data.data?.entries || [];
        }

        // Process focus sessions
        let totalFocusMinutes = 0;
        if (focusRes.status === 'fulfilled') {
          totalFocusMinutes = focusRes.value.data.data?.totalMinutes || 0;
        }

        // Find today's mood
        const today = new Date().toDateString();
        const todaysMood = moodLogs.find(m => 
          new Date(m.createdAt).toDateString() === today
        ) || null;

        // Load saved intention
        const savedIntention = typeof window !== 'undefined' 
          ? localStorage.getItem('dailyIntention')
          : null;
        const intentionDate = typeof window !== 'undefined'
          ? localStorage.getItem('intentionDate')
          : null;
        const todayIntention = intentionDate === today ? savedIntention : null;

        set({
          moodLogs,
          currentMood: todaysMood?.moodType || moodLogs[0]?.moodType || null,
          todaysMood,
          journalEntries,
          totalFocusMinutesThisWeek: totalFocusMinutes,
          xp,
          streak,
          isStreakActive,
          lastActivityAt,
          todayIntention,
          isLoading: false,
          isInitialized: true,
        });

        // Compute derived state
        get().computeWeeklyInsights();
        get().computeTodayEnergy();
        get().computeTinyWins();

      } catch (error) {
        console.error('Failed to initialize emotional state:', error);
        set({
          isLoading: false,
          error: 'Failed to load your emotional data',
        });
      }
    },

    // ============================================
    // LOG MOOD
    // ============================================
    
    logMood: async (data) => {
      try {
        const response = await api.post('/api/mood', {
          mood: data.mood,
          intensity: data.intensity,
          note: data.note,
          drainedBy: data.drainedText ? [data.drainedText] : [],
          helpedBy: data.helpedText ? [data.helpedText] : [],
          entryType: 'MANUAL',
        });
        
        const newEntry: MoodLog = response.data.data;
        
        set((state) => {
          const today = new Date().toDateString();
          const isToday = new Date(newEntry.createdAt).toDateString() === today;
          
          return {
            moodLogs: [newEntry, ...state.moodLogs],
            currentMood: newEntry.moodType,
            todaysMood: isToday ? newEntry : state.todaysMood,
          };
        });
        
        // Award XP
        get().awardXP(XP_AWARDS.MOOD_LOG, 'mood_log');
        
        // Recompute everything
        get().computeWeeklyInsights();
        get().computeTodayEnergy();
        get().computeTinyWins();
        
        // Refresh streak from server
        try {
          const streakRes = await api.get('/api/mood/streak');
          set({
            streak: streakRes.data.data?.streak || get().streak,
            isStreakActive: streakRes.data.data?.isActive || true,
            xp: streakRes.data.data?.xp || get().xp,
          });
        } catch (e) {
          console.error('Failed to refresh streak:', e);
        }
        
      } catch (error) {
        console.error('Failed to log mood:', error);
        throw error;
      }
    },

    // ============================================
    // COMPLETE FOCUS SESSION
    // ============================================
    
    completeFocusSession: async (duration, type) => {
      try {
        await api.post('/api/calm/session', {
          duration,
          sessionType: type === 'pomodoro' ? 'FOCUS' : 'BREATHE',
        });
        
        set((state) => ({
          totalFocusMinutesThisWeek: state.totalFocusMinutesThisWeek + duration,
          focusSessions: [
            {
              id: Date.now().toString(),
              duration,
              type,
              completedAt: new Date().toISOString(),
            },
            ...state.focusSessions,
          ],
        }));
        
        // Award XP
        get().awardXP(XP_AWARDS.FOCUS_SESSION, 'focus_session');
        get().computeTinyWins();
        
      } catch (error) {
        console.error('Failed to save focus session:', error);
      }
    },

    // ============================================
    // AWARD XP
    // ============================================
    
    awardXP: (amount, reason) => {
      set((state) => {
        const newXP = state.xp + amount;
        console.log(`Awarded ${amount} XP for ${reason}. Total: ${newXP}`);
        return { xp: newXP };
      });
    },

    // ============================================
    // SET INTENTION
    // ============================================
    
    setTodayIntention: (intention) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('dailyIntention', intention);
        localStorage.setItem('intentionDate', new Date().toDateString());
      }
      set({ todayIntention: intention });
    },

    // ============================================
    // COMPUTE WEEKLY INSIGHTS
    // ============================================
    
    computeWeeklyInsights: () => {
      const state = get();
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Filter this week's moods
      const weekMoods = state.moodLogs.filter(m => 
        new Date(m.createdAt) >= weekAgo
      );
      
      if (weekMoods.length === 0) {
        set({
          weeklyInsights: {
            dominantMood: null,
            averageIntensity: 0,
            totalReflections: 0,
            moodTrend: 'steady',
            emotionalSummary: "Let's start your journey today.",
          },
          weeklyBreakdown: generateEmptyWeekBreakdown(),
        });
        return;
      }
      
      // Calculate dominant mood
      const moodCounts: Record<string, number> = {};
      let totalIntensity = 0;
      
      weekMoods.forEach(m => {
        moodCounts[m.moodType] = (moodCounts[m.moodType] || 0) + 1;
        totalIntensity += m.intensity;
      });
      
      let dominantMood: MoodType | null = null;
      let maxCount = 0;
      for (const [mood, count] of Object.entries(moodCounts)) {
        if (count > maxCount) {
          maxCount = count;
          dominantMood = mood as MoodType;
        }
      }
      
      const avgIntensity = totalIntensity / weekMoods.length;
      
      // Calculate trend
      let trend: 'rising' | 'falling' | 'steady' = 'steady';
      if (weekMoods.length >= 2) {
        const recentIntensity = weekMoods.slice(0, Math.ceil(weekMoods.length / 2))
          .reduce((sum, m) => sum + m.intensity, 0) / Math.ceil(weekMoods.length / 2);
        const olderIntensity = weekMoods.slice(Math.ceil(weekMoods.length / 2))
          .reduce((sum, m) => sum + m.intensity, 0) / (weekMoods.length - Math.ceil(weekMoods.length / 2));
        
        if (recentIntensity > olderIntensity + 1) trend = 'rising';
        else if (recentIntensity < olderIntensity - 1) trend = 'falling';
      }
      
      // Generate summary
      const emotionalSummary = generateEmotionalSummary(
        dominantMood,
        avgIntensity,
        weekMoods.length,
        trend
      );
      
      // Generate weekly breakdown
      const weeklyBreakdown = generateWeekBreakdown(state.moodLogs);
      
      set({
        weeklyInsights: {
          dominantMood,
          averageIntensity: Math.round(avgIntensity * 10) / 10,
          totalReflections: weekMoods.length,
          moodTrend: trend,
          emotionalSummary,
        },
        weeklyBreakdown,
      });
    },

    // ============================================
    // COMPUTE TODAY'S ENERGY
    // ============================================
    
    computeTodayEnergy: () => {
      const state = get();
      const todayEnergy = getTodayEnergy(
        state.todaysMood?.moodType || state.currentMood,
        state.todaysMood?.intensity || 5
      );
      set({ todayEnergy });
    },

    // ============================================
    // COMPUTE TINY WINS
    // ============================================
    
    computeTinyWins: () => {
      const state = get();
      const today = new Date().toDateString();
      
      const wins: TinyWin[] = [
        {
          id: 'showed-up',
          label: 'Showed up today',
          done: true, // Always true if they're viewing
          icon: '✓',
        },
        {
          id: 'mood-logged',
          label: 'Logged mood',
          done: state.todaysMood !== null,
          icon: '🎯',
        },
        {
          id: 'streak',
          label: state.streak > 0 ? `${state.streak}-day streak` : 'Start a streak',
          done: state.streak >= 2,
          icon: '🔥',
        },
        {
          id: 'focus',
          label: 'Completed focus',
          done: state.focusSessions.some(s => 
            new Date(s.completedAt).toDateString() === today
          ),
          icon: '⚡',
        },
      ];
      
      set({ tinyWins: wins });
    },

    // ============================================
    // REFRESH ALL
    // ============================================
    
    refreshAll: async () => {
      set({ isInitialized: false });
      await get().initialize();
    },

    // ============================================
    // RESET
    // ============================================
    
    reset: () => {
      set({
        userId: null,
        moodLogs: [],
        currentMood: null,
        todaysMood: null,
        journalEntries: [],
        focusSessions: [],
        totalFocusMinutesThisWeek: 0,
        xp: 0,
        streak: 0,
        isStreakActive: false,
        lastActivityAt: null,
        weeklyInsights: {
          dominantMood: null,
          averageIntensity: 0,
          totalReflections: 0,
          moodTrend: 'steady',
          emotionalSummary: "Let's start your journey today.",
        },
        weeklyBreakdown: [],
        todayEnergy: null,
        tinyWins: [],
        todayIntention: null,
        isLoading: false,
        isInitialized: false,
        error: null,
      });
    },
  }))
);

// ============================================
// HELPER: Generate Empty Week Breakdown
// ============================================

function generateEmptyWeekBreakdown(): WeeklyBreakdown[] {
  const breakdown: WeeklyBreakdown[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    breakdown.push({
      date: date.toISOString(),
      dominantMood: null,
      averageIntensity: 0,
      entryCount: 0,
    });
  }
  
  return breakdown;
}

// ============================================
// HELPER: Generate Week Breakdown
// ============================================

function generateWeekBreakdown(moodLogs: MoodLog[]): WeeklyBreakdown[] {
  const breakdown: WeeklyBreakdown[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toDateString();
    
    const dayMoods = moodLogs.filter(m => 
      new Date(m.createdAt).toDateString() === dateStr
    );
    
    let dominantMood: MoodType | null = null;
    let avgIntensity = 0;
    
    if (dayMoods.length > 0) {
      const moodCounts: Record<string, number> = {};
      let totalIntensity = 0;
      
      dayMoods.forEach(m => {
        moodCounts[m.moodType] = (moodCounts[m.moodType] || 0) + 1;
        totalIntensity += m.intensity;
      });
      
      let maxCount = 0;
      for (const [mood, count] of Object.entries(moodCounts)) {
        if (count > maxCount) {
          maxCount = count;
          dominantMood = mood as MoodType;
        }
      }
      
      avgIntensity = totalIntensity / dayMoods.length;
    }
    
    breakdown.push({
      date: date.toISOString(),
      dominantMood,
      averageIntensity: Math.round(avgIntensity * 10) / 10,
      entryCount: dayMoods.length,
    });
  }
  
  return breakdown;
}

// ============================================
// SELECTORS (For optimized subscriptions)
// ============================================

export const selectCurrentMood = (state: EmotionalStore) => state.currentMood;
export const selectTodaysMood = (state: EmotionalStore) => state.todaysMood;
export const selectWeeklyInsights = (state: EmotionalStore) => state.weeklyInsights;
export const selectGrowthLevel = (state: EmotionalStore) => getGrowthLevel(state.xp);
export const selectXP = (state: EmotionalStore) => state.xp;
export const selectStreak = (state: EmotionalStore) => state.streak;
export const selectTinyWins = (state: EmotionalStore) => state.tinyWins;
export const selectTodayEnergy = (state: EmotionalStore) => state.todayEnergy;
export const selectWeeklyBreakdown = (state: EmotionalStore) => state.weeklyBreakdown;

// Export growth level helper
export { getGrowthLevel };
