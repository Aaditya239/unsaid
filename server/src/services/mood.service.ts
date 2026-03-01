// ============================================
// Mood Service
// ============================================
// Business logic for mood tracking and analytics.
// Includes insight generation based on mood patterns.
// Always filters by userId for data isolation.
// ============================================

import { Mood, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { BadRequestError } from '../utils/appError';
import { updateReflectionStreak, awardXP, awardConsistencyBonusIfEligible } from './streak.service';
import { GrowthService } from './growth.service';
import { XP_RULES } from '../config/xpRules';

// ============================================
// TYPES
// ============================================

export interface CreateMoodInput {
  mood: Mood;
  intensity: number;
  note?: string;
  contextTag?: string;
  entryType?: 'MORNING' | 'NIGHT' | 'MANUAL';
}

export interface MoodQueryOptions {
  range?: 'week' | 'month' | 'all';
  page?: number;
  limit?: number;
}

export interface MoodStats {
  totalEntries: number;
  averageIntensity: number;
  mostFrequentMood: Mood | null;
  moodCounts: Record<string, number>;
  weeklyBreakdown: WeeklyBreakdown[];
  insight: string;
}

export interface WeeklyBreakdown {
  date: string;
  averageIntensity: number;
  dominantMood: Mood | null;
  entryCount: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get date range based on filter type
 */
const getDateRange = (range: 'week' | 'month' | 'all'): Date | null => {
  const now = new Date();

  switch (range) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return null;
  }
};

/**
 * Get start of day in UTC
 */
const getStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of day in UTC
 */
const getEndOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Create a new mood entry
 * 
 * @param userId - The ID of the user
 * @param data - Mood entry data
 * @returns The created mood entry
 */
export const createMoodEntry = async (
  userId: string,
  data: CreateMoodInput
) => {
  // Validate intensity range (1-10)
  if (data.intensity < 1 || data.intensity > 10) {
    throw BadRequestError('Intensity must be between 1 and 10');
  }

  // Check for duplicate entry (allows one per 5 minutes to prevent spam)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentEntry = await prisma.moodEntry.findFirst({
    where: {
      userId,
      createdAt: { gte: fiveMinutesAgo },
    },
  });

  if (recentEntry) {
    throw BadRequestError(
      'Please wait 5 minutes between mood entries.'
    );
  }

  const entry = await prisma.moodEntry.create({
    data: {
      mood: data.mood,
      intensity: data.intensity,
      note: data.note?.trim(),
      contextTag: data.contextTag,
      entryType: data.entryType || 'MANUAL',
      userId,
    },
    select: {
      id: true,
      mood: true,
      intensity: true,
      note: true,
      contextTag: true,
      entryType: true,
      createdAt: true,
    },
  });

  // Update reflection streak
  const streak = await updateReflectionStreak(userId);

  // Award XP (using centralized config)
  await awardXP(userId, XP_RULES.LOG_MOOD);

  // Award weekly consistency bonus once/day once streak >= 7
  if (typeof streak === 'number') {
    await awardConsistencyBonusIfEligible(userId, streak);
  }

  // Keep weekly growth cache in sync in real-time
  await GrowthService.refreshCurrentWeekForUser(userId);

  return entry;
};

/**
 * Get mood history for a user
 * 
 * @param userId - The ID of the user
 * @param options - Query options
 * @returns List of mood entries
 */
export const getMoodEntries = async (
  userId: string,
  options: MoodQueryOptions = {}
) => {
  const { range = 'week', page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.MoodEntryWhereInput = { userId };

  const startDate = getDateRange(range);
  if (startDate) {
    where.createdAt = { gte: startDate };
  }

  const [entries, total] = await Promise.all([
    prisma.moodEntry.findMany({
      where,
      select: {
        id: true,
        mood: true,
        intensity: true,
        note: true,
        contextTag: true,
        entryType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.moodEntry.count({ where }),
  ]);

  return {
    entries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + entries.length < total,
    },
  };
};

/**
 * Get mood statistics and insights for a user
 * 
 * @param userId - The ID of the user
 * @param range - Time range for stats
 * @returns Mood statistics with insights
 */
export const getMoodStats = async (
  userId: string,
  range: 'week' | 'month' = 'week'
): Promise<MoodStats> => {
  const startDate = getDateRange(range);

  const where: Prisma.MoodEntryWhereInput = {
    userId,
    ...(startDate && { createdAt: { gte: startDate } }),
  };

  // Get all entries for the period
  const entries = await prisma.moodEntry.findMany({
    where,
    select: {
      mood: true,
      intensity: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Calculate basic stats
  const totalEntries = entries.length;

  if (totalEntries === 0) {
    return {
      totalEntries: 0,
      averageIntensity: 0,
      mostFrequentMood: null,
      moodCounts: {},
      weeklyBreakdown: [],
      insight: 'Start logging your moods to see insights here.',
    };
  }

  // Average intensity
  const averageIntensity =
    entries.reduce((sum, e) => sum + e.intensity, 0) / totalEntries;

  // Mood frequency counts
  const moodCounts: Record<string, number> = {};
  entries.forEach((entry) => {
    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
  });

  // Most frequent mood
  const mostFrequentMood = Object.entries(moodCounts).reduce(
    (max, [mood, count]) => (count > (max.count || 0) ? { mood, count } : max),
    { mood: null as string | null, count: 0 }
  ).mood as Mood | null;

  // Weekly breakdown (group by date)
  const dailyData = new Map<string, { intensities: number[]; moods: Mood[] }>();

  entries.forEach((entry) => {
    const dateKey = entry.createdAt.toISOString().split('T')[0];
    const existing = dailyData.get(dateKey) || { intensities: [], moods: [] };
    existing.intensities.push(entry.intensity);
    existing.moods.push(entry.mood);
    dailyData.set(dateKey, existing);
  });

  const weeklyBreakdown: WeeklyBreakdown[] = Array.from(dailyData.entries())
    .map(([date, data]) => {
      // Find dominant mood for the day
      const moodCount: Record<string, number> = {};
      data.moods.forEach((m) => {
        moodCount[m] = (moodCount[m] || 0) + 1;
      });
      const dominantMood = Object.entries(moodCount).reduce(
        (max, [mood, count]) => (count > max.count ? { mood, count } : max),
        { mood: null as string | null, count: 0 }
      ).mood as Mood | null;

      return {
        date,
        averageIntensity:
          data.intensities.reduce((a, b) => a + b, 0) / data.intensities.length,
        dominantMood,
        entryCount: data.intensities.length,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Generate insight
  const insight = generateInsight(entries, moodCounts, averageIntensity, range);

  return {
    totalEntries,
    averageIntensity: Math.round(averageIntensity * 10) / 10,
    mostFrequentMood,
    moodCounts,
    weeklyBreakdown,
    insight,
  };
};

// ============================================
// INSIGHT ENGINE
// ============================================

/**
 * Generate a human-readable insight based on mood data
 * Uses simple logic aggregation (no AI)
 */
const generateInsight = (
  entries: { mood: Mood; intensity: number; createdAt: Date }[],
  moodCounts: Record<string, number>,
  averageIntensity: number,
  range: 'week' | 'month'
): string => {
  const period = range === 'week' ? 'this week' : 'this month';
  const insights: string[] = [];

  // 1. Most frequent mood insight
  const sortedMoods = Object.entries(moodCounts).sort(([, a], [, b]) => b - a);
  if (sortedMoods.length > 0) {
    const [topMood, count] = sortedMoods[0];
    const moodLabel = topMood.toLowerCase();
    const percentage = Math.round((count / entries.length) * 100);

    if (topMood === 'SAD' || topMood === 'STRESSED' || topMood === 'ANXIOUS') {
      if (percentage > 50) {
        insights.push(`This week felt a little heavier than usual.`);
      } else {
        insights.push(`There were some moments of weight this week, but you're carrying them.`);
      }
    } else if (topMood === 'HAPPY' || topMood === 'GRATEFUL' || topMood === 'EXCITED') {
      insights.push(`It’s been a week of light and connection.`);
    } else if (topMood === 'CALM' || topMood === 'NEUTRAL') {
      insights.push(`You’ve found a steady rhythm this week.`);
    }
  }

  // 2. Intensity insight
  if (averageIntensity >= 8) {
    insights.push(`Things have felt quite overwhelming lately.`);
  } else if (averageIntensity >= 6) {
    insights.push(`There's been a lot on your plate recently.`);
  } else if (averageIntensity <= 3) {
    insights.push(`Your energy has been soft and quiet lately.`);
  }

  // 3. Pattern detection - weekend vs weekday
  const weekdayEntries = entries.filter((e) => {
    const day = e.createdAt.getDay();
    return day !== 0 && day !== 6;
  });
  const weekendEntries = entries.filter((e) => {
    const day = e.createdAt.getDay();
    return day === 0 || day === 6;
  });

  if (weekdayEntries.length > 0 && weekendEntries.length > 0) {
    const weekdayAvg =
      weekdayEntries.reduce((sum, e) => sum + e.intensity, 0) / weekdayEntries.length;
    const weekendAvg =
      weekendEntries.reduce((sum, e) => sum + e.intensity, 0) / weekendEntries.length;

    if (weekendAvg > weekdayAvg + 1) {
      insights.push('You tend to feel better on weekends.');
    } else if (weekdayAvg > weekendAvg + 1) {
      insights.push('Weekdays seem more positive for you.');
    }
  }

  // 4. Mood variety insight
  const uniqueMoods = Object.keys(moodCounts).length;
  if (uniqueMoods === 1) {
    insights.push('Your mood has been consistent — try noting what influences it.');
  } else if (uniqueMoods >= 5) {
    insights.push("You're experiencing a range of emotions — that's completely normal.");
  }

  // 5. Positive vs negative mood balance
  const positiveMoods = ['HAPPY', 'CALM', 'EXCITED', 'GRATEFUL'];
  const negativeMoods = ['SAD', 'ANGRY', 'ANXIOUS', 'STRESSED'];

  let positiveCount = 0;
  let negativeCount = 0;

  entries.forEach((e) => {
    if (positiveMoods.includes(e.mood)) positiveCount++;
    if (negativeMoods.includes(e.mood)) negativeCount++;
  });

  if (positiveCount > negativeCount * 2) {
    insights.push("Overall, you've been in a positive space. Keep it up!");
  } else if (negativeCount > positiveCount * 2) {
    insights.push('Consider what small changes might lift your mood.');
  }

  // Return combined insights (max 3)
  return insights.slice(0, 3).join(' ') ||
    `You logged ${entries.length} mood ${entries.length === 1 ? 'entry' : 'entries'} ${period}.`;
};

/**
 * Capitalize first letter
 */
const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Delete a mood entry (for user corrections)
 */
export const deleteMoodEntry = async (
  entryId: string,
  userId: string
): Promise<void> => {
  const entry = await prisma.moodEntry.findUnique({
    where: { id: entryId },
    select: { userId: true },
  });

  if (!entry) {
    throw BadRequestError('Mood entry not found');
  }

  if (entry.userId !== userId) {
    throw BadRequestError('You do not have permission to delete this entry');
  }

  await prisma.moodEntry.delete({ where: { id: entryId } });
};
