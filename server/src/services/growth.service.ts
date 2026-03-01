import prisma from '../utils/prisma';

export interface WeeklyGrowthBreakdown {
  consistency: number;
  engagement: number;
  stability: number;
  action: number;
}

export interface WeeklyGrowthResult {
  score: number;
  delta: number;
  breakdown: WeeklyGrowthBreakdown;
}

const MAX_MOOD_VARIANCE = 20.25;

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const round2 = (value: number): number => {
  return Math.round(value * 100) / 100;
};

const getUtcWeekStartMonday = (date: Date): Date => {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - diffToMonday);
  utc.setUTCHours(0, 0, 0, 0);
  return utc;
};

const addDays = (date: Date, days: number): Date => {
  const out = new Date(date);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
};

const asDateKey = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

const calculateMoodVariance = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
};

const computeWeeklyBreakdown = async (userId: string, weekStart: Date, weekEnd: Date): Promise<WeeklyGrowthBreakdown> => {
  const [
    moodEntries,
    journalEntries,
    aiInteractions,
    focusSessions,
    weeklyTasks,
  ] = await Promise.all([
    prisma.moodEntry.findMany({
      where: {
        userId,
        createdAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      select: {
        createdAt: true,
        intensity: true,
      },
    }),
    prisma.journalEntry.findMany({
      where: {
        userId,
        createdAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      select: {
        createdAt: true,
        drainedBy: true,
        need: true,
        affectedBy: true,
      },
    }),
    prisma.aIConversation.count({
      where: {
        userId,
        createdAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
    }),
    prisma.calmSession.count({
      where: {
        userId,
        focusMode: true,
        completed: true,
        createdAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
    }),
    prisma.task.findMany({
      where: {
        userId,
        createdAt: {
          gte: weekStart,
          lt: weekEnd,
        },
        parentTaskId: null,
      },
      select: {
        isCompleted: true,
      },
    }),
  ]);

  const activeDays = new Set<string>();
  moodEntries.forEach((entry) => activeDays.add(asDateKey(entry.createdAt)));
  journalEntries.forEach((entry) => activeDays.add(asDateKey(entry.createdAt)));

  const consistencyScore = (activeDays.size / 7) * 30;

  const reflectionAnswers = journalEntries.reduce((count, entry) => {
    const hasDrainedBy = Array.isArray(entry.drainedBy) && entry.drainedBy.length > 0;
    const hasNeed = typeof entry.need === 'string' && entry.need.trim().length > 0;
    const hasAffectedBy = typeof entry.affectedBy === 'string' && entry.affectedBy.trim().length > 0;
    return count + (hasDrainedBy || hasNeed || hasAffectedBy ? 1 : 0);
  }, 0);

  const totalInteractions = journalEntries.length + aiInteractions + focusSessions + reflectionAnswers;
  const engagementScore = Math.min(totalInteractions / 12, 1) * 25;

  const moodValues = moodEntries
    .map((entry) => entry.intensity)
    .filter((value): value is number => typeof value === 'number');

  const stabilityScore = moodValues.length < 2
    ? 0
    : (1 - clamp(calculateMoodVariance(moodValues) / MAX_MOOD_VARIANCE, 0, 1)) * 25;

  const completionRate = weeklyTasks.length === 0
    ? 0
    : weeklyTasks.filter((task) => task.isCompleted).length / weeklyTasks.length;
  const actionScore = completionRate * 20;

  return {
    consistency: round2(clamp(consistencyScore, 0, 30)),
    engagement: round2(clamp(engagementScore, 0, 25)),
    stability: round2(clamp(stabilityScore, 0, 25)),
    action: round2(clamp(actionScore, 0, 20)),
  };
};

const hasNoActivity = (breakdown: WeeklyGrowthBreakdown): boolean => {
  return breakdown.consistency === 0
    && breakdown.engagement === 0
    && breakdown.stability === 0
    && breakdown.action === 0;
};

const toFinalScore = (breakdown: WeeklyGrowthBreakdown): number => {
  if (hasNoActivity(breakdown)) return 0;
  const total = breakdown.consistency + breakdown.engagement + breakdown.stability + breakdown.action;
  return clamp(Math.round(total), 0, 100);
};

export const GrowthService = {
  getWeeklyGrowth: async (userId: string, now: Date = new Date()): Promise<WeeklyGrowthResult> => {
    const weekStart = getUtcWeekStartMonday(now);

    const cached = await prisma.emotionalGrowth.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
    });

    if (cached) {
      return {
        score: cached.score,
        delta: cached.delta ?? 0,
        breakdown: {
          consistency: cached.consistencyScore,
          engagement: cached.engagementScore,
          stability: cached.stabilityScore,
          action: cached.actionScore,
        },
      };
    }

    const weekEnd = addDays(weekStart, 7);
    const previousWeekStart = addDays(weekStart, -7);

    const [breakdown, previousWeek] = await Promise.all([
      computeWeeklyBreakdown(userId, weekStart, weekEnd),
      prisma.emotionalGrowth.findUnique({
        where: {
          userId_weekStart: {
            userId,
            weekStart: previousWeekStart,
          },
        },
        select: {
          score: true,
        },
      }),
    ]);

    const score = toFinalScore(breakdown);
    const delta = previousWeek ? score - previousWeek.score : 0;

    const created = await prisma.emotionalGrowth.create({
      data: {
        userId,
        weekStart,
        score,
        delta,
        consistencyScore: breakdown.consistency,
        engagementScore: breakdown.engagement,
        stabilityScore: breakdown.stability,
        actionScore: breakdown.action,
      },
    });

    return {
      score: created.score,
      delta: created.delta ?? 0,
      breakdown,
    };
  },

  recalculateCurrentWeekForAllUsers: async (now: Date = new Date()): Promise<{ processed: number }> => {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const user of users) {
      await GrowthService.refreshCurrentWeekForUser(user.id, now);
    }

    return { processed: users.length };
  },

  refreshCurrentWeekForUser: async (userId: string, now: Date = new Date()): Promise<WeeklyGrowthResult> => {
    const weekStart = getUtcWeekStartMonday(now);
    const weekEnd = addDays(weekStart, 7);
    const previousWeekStart = addDays(weekStart, -7);

    const [breakdown, previousWeek] = await Promise.all([
      computeWeeklyBreakdown(userId, weekStart, weekEnd),
      prisma.emotionalGrowth.findUnique({
        where: {
          userId_weekStart: {
            userId,
            weekStart: previousWeekStart,
          },
        },
        select: {
          score: true,
        },
      }),
    ]);

    const score = toFinalScore(breakdown);
    const delta = previousWeek ? score - previousWeek.score : 0;

    const row = await prisma.emotionalGrowth.upsert({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
      create: {
        userId,
        weekStart,
        score,
        delta,
        consistencyScore: breakdown.consistency,
        engagementScore: breakdown.engagement,
        stabilityScore: breakdown.stability,
        actionScore: breakdown.action,
      },
      update: {
        score,
        delta,
        consistencyScore: breakdown.consistency,
        engagementScore: breakdown.engagement,
        stabilityScore: breakdown.stability,
        actionScore: breakdown.action,
      },
    });

    return {
      score: row.score,
      delta: row.delta ?? 0,
      breakdown,
    };
  },
};
