import prisma from '../utils/prisma';
import { TaskPriority, TaskCategory, EnergyLevel, RecurringType } from '@prisma/client';
import Groq from 'groq-sdk';
import { InternalError, NotFoundError, ForbiddenError, BadRequestError as BadReqError } from '../utils/appError';
import { awardXP } from './streak.service';
import { XP_RULES } from '../config/xpRules';
import { GrowthService } from './growth.service';

// Check if API key is configured
const isAIConfigured = (): boolean => {
  const apiKey = process.env.GROQ_API_KEY;
  return !!(apiKey && apiKey.startsWith('gsk_'));
};

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy-key',
});
const AI_MODEL = 'llama-3.3-70b-versatile';

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const pad = (n: number): string => n.toString().padStart(2, '0');

const toDateKey = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const getDayBounds = (dateStr: string): { dayStart: Date; dayEnd: Date } => {
  const dayStart = new Date(`${dateStr}T00:00:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59.999`);
  return { dayStart, dayEnd };
};

const getTaskEnergyCost = (task: { emotionalWeight: number; estimatedMinutes: number; priority: TaskPriority }): number => {
  const base = Number.isFinite(task.emotionalWeight) ? task.emotionalWeight : 20;
  const minuteAdjustment = Math.round(((task.estimatedMinutes || 25) / 25) * 4);
  const priorityAdjustment = task.priority === 'HIGH' ? 6 : task.priority === 'LOW' ? -2 : 0;
  return clamp(base + minuteAdjustment + priorityAdjustment, 5, 45);
};

const getMoodEnergyMultiplier = (moodType?: string | null): number => {
  const mood = (moodType || '').toUpperCase();
  if (['SAD', 'ANXIOUS', 'STRESSED', 'TIRED'].includes(mood)) return 0.85;
  if (['HAPPY', 'EXCITED', 'GRATEFUL', 'CALM'].includes(mood)) return 1.05;
  return 1;
};

const computeEmotionalTrend = (intensities: number[]): 'RISING' | 'FALLING' | 'STEADY' => {
  if (intensities.length < 2) return 'STEADY';
  const first = intensities[0];
  const last = intensities[intensities.length - 1];
  if (last - first >= 1) return 'RISING';
  if (first - last >= 1) return 'FALLING';
  return 'STEADY';
};

const getWeeklyBurnoutLevel = (heavyIncompleteCount: number): 'LOW' | 'MODERATE' | 'HIGH' => {
  if (heavyIncompleteCount >= 8) return 'HIGH';
  if (heavyIncompleteCount >= 4) return 'MODERATE';
  return 'LOW';
};

export interface CreateTaskDTO {
  title: string;
  description?: string;
  priority?: TaskPriority;
  category?: TaskCategory;
  energyLevel?: EnergyLevel;
  energyLevelRequired?: EnergyLevel;
  emotionalWeight?: number;
  estimatedMinutes?: number;
  completionFeeling?: 'LIGHTER' | 'NEUTRAL' | 'DRAINING';
  dueDate?: Date;
  taskDate?: string;
  reminderTime?: Date;
  recurring?: RecurringType;
  parentTaskId?: string;
}

/**
 * Calculate task weight based on priority
 */
const getTaskWeight = (priority: TaskPriority) => {
  switch (priority) {
    case 'HIGH': return 3;
    case 'MEDIUM': return 2;
    case 'LOW': return 1;
    default: return 1;
  }
};

/**
 * Task Service handles task business logic
 */
export const TaskService = {
  createTask: async (userId: string, data: CreateTaskDTO) => {
    return prisma.task.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        category: data.category || 'OTHER',
        energyLevel: data.energyLevel || data.energyLevelRequired || 'MEDIUM',
        energyLevelRequired: data.energyLevelRequired || 'MEDIUM',
        emotionalWeight: data.emotionalWeight ?? 20,
        estimatedMinutes: data.estimatedMinutes ?? 25,
        completionFeeling: data.completionFeeling,
        dueDate: data.dueDate,
        taskDate: data.taskDate || (data.dueDate instanceof Date ? data.dueDate.toISOString().split('T')[0] : null),
        reminderTime: data.reminderTime,
        recurring: data.recurring || 'NONE',
        parentTaskId: data.parentTaskId,
      }
    });
  },

  getTasks: async (userId: string, dateStr?: string) => {
    let where: any = { userId, parentTaskId: null };
    if (dateStr) {
      where.taskDate = dateStr;
    }

    return prisma.task.findMany({
      where,
      include: { subTasks: true },
      orderBy: [
        { orderIndex: 'asc' },
        { isCompleted: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    });
  },

  getTasksByTimeframe: async (userId: string) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const tomorrowEnd = new Date(todayEnd);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    const tasks = await prisma.task.findMany({
      where: { userId, parentTaskId: null },
      include: { subTasks: true },
      orderBy: [
        { orderIndex: 'asc' },
        { isCompleted: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    });

    const today = tasks.filter(t => t.dueDate && t.dueDate >= todayStart && t.dueDate < todayEnd);
    const tomorrow = tasks.filter(t => t.dueDate && t.dueDate >= todayEnd && t.dueDate < tomorrowEnd);
    const upcoming = tasks.filter(t => t.dueDate && t.dueDate >= tomorrowEnd);
    const noDate = tasks.filter(t => !t.dueDate);

    return { today, tomorrow, upcoming, noDate };
  },

  updateTaskStatus: async (userId: string, taskId: string, isCompleted: boolean) => {
    const completedAt = isCompleted ? new Date() : null;

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
      select: {
        id: true,
        taskDate: true,
        emotionalWeight: true,
        estimatedMinutes: true,
        priority: true,
        isCompleted: true,
      }
    });

    if (!task) {
      return { count: 0 };
    }

    const result = await prisma.task.updateMany({
      where: { id: taskId, userId },
      data: { isCompleted, completedAt }
    });

    if (isCompleted && !task.isCompleted) {
      await awardXP(userId, XP_RULES.COMPLETE_TASK);

      const date = task.taskDate || toDateKey(new Date());
      const delta = getTaskEnergyCost(task);

      await prisma.emotionalCapacityDay.upsert({
        where: { userId_date: { userId, date } },
        create: {
          userId,
          date,
          capacity: 100,
          energyUsed: clamp(delta, 0, 100),
          gentleModeActive: false,
          consistencyBonusAwarded: false,
        },
        update: {
          energyUsed: { increment: delta },
        },
      });
    }

    if (!isCompleted && task.isCompleted) {
      const date = task.taskDate || toDateKey(new Date());
      const delta = getTaskEnergyCost(task);
      const current = await prisma.emotionalCapacityDay.findUnique({ where: { userId_date: { userId, date } } });
      if (current) {
        await prisma.emotionalCapacityDay.update({
          where: { userId_date: { userId, date } },
          data: { energyUsed: Math.max(0, current.energyUsed - delta) },
        });
      }
    }

    try {
      await GrowthService.refreshCurrentWeekForUser(userId);
    } catch (error) {
      console.warn('Growth refresh skipped after task status update', error);
    }

    return result;
  },

  updateTask: async (userId: string, taskId: string, data: Partial<CreateTaskDTO> & { orderIndex?: number, focusMinutes?: number, focusSessionsCount?: number }) => {
    return prisma.task.updateMany({
      where: { id: taskId, userId },
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        energyLevel: data.energyLevel,
        energyLevelRequired: data.energyLevelRequired,
        emotionalWeight: data.emotionalWeight,
        estimatedMinutes: data.estimatedMinutes,
        completionFeeling: data.completionFeeling,
        dueDate: data.dueDate,
        taskDate: data.taskDate,
        reminderTime: data.reminderTime,
        recurring: data.recurring,
        breakdownGenerated: (data as any).breakdownGenerated,
        orderIndex: data.orderIndex,
        focusMinutes: data.focusMinutes,
        focusSessionsCount: data.focusSessionsCount
      }
    });
  },

  reorderTasks: async (userId: string, tasks: { id: string, orderIndex: number }[]) => {
    const updates = tasks.map(task =>
      prisma.task.updateMany({
        where: { id: task.id, userId },
        data: { orderIndex: task.orderIndex }
      })
    );
    return prisma.$transaction(updates);
  },

  deleteTask: async (userId: string, taskId: string) => {
    return prisma.task.deleteMany({
      where: { id: taskId, userId }
    });
  },

  getDailyProgress: async (userId: string, dateStr: string) => {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        taskDate: dateStr,
        parentTaskId: null,
      }
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.isCompleted).length;

    let totalWeight = 0;
    let completedWeight = 0;

    tasks.forEach(task => {
      const weight = getTaskWeight(task.priority);
      totalWeight += weight;
      if (task.isCompleted) {
        completedWeight += weight;
      }
    });

    const completionRate = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      completionRate: Math.round(completionRate),
    };
  },

  getSuggestedTasksForMood: async (userId: string, moodIntensity: number, moodType: string) => {
    let targetEnergy: EnergyLevel = 'MEDIUM';

    const lowEnergyMoods = ['SAD', 'ANXIOUS', 'TIRED', 'STRESSED'];
    if (lowEnergyMoods.includes(moodType.toUpperCase())) {
      targetEnergy = 'LOW';
    } else if (['HAPPY', 'EXCITED', 'CALM'].includes(moodType.toUpperCase())) {
      targetEnergy = 'HIGH';
    }

    const tasks = await prisma.task.findMany({
      where: { userId, isCompleted: false },
      orderBy: { dueDate: 'asc' }
    });

    if (tasks.length === 0) return [];

    if (targetEnergy === 'LOW') {
      return tasks.filter(t => t.energyLevelRequired === 'LOW').slice(0, 3);
    } else if (targetEnergy === 'HIGH') {
      return tasks.filter(t => t.priority === 'HIGH' || t.energyLevelRequired === 'HIGH').slice(0, 3);
    }

    return tasks.slice(0, 3);
  },

  generateSubtasksWithAI: async (title: string, description?: string, existingSteps: string[] = []) => {
    if (!isAIConfigured()) {
      return ['Break this task down manually', 'Take the first step'];
    }

    try {
      const existingBlock = existingSteps.length > 0
        ? `\nAlready existing steps (DO NOT repeat these):\n${existingSteps.map(s => `- ${s}`).join('\n')}`
        : '';

      const prompt = `You are a mindful task planner that breaks tasks into small, gentle steps.

Task: "${title}"${description ? `\nContext: ${description}` : ''}${existingBlock}

Rules:
1. Break the task into small, actionable steps a person can start immediately.
2. Maximum 5 steps. For simple tasks, use fewer (2-3 steps is fine).
3. Each step should be completable in under 15 minutes.
4. Do NOT repeat any existing steps listed above.
5. Return ONLY a valid JSON array of objects with a "title" field. No markdown, no explanation.

Example output: [{"title": "Gather requirements"}, {"title": "Draft outline"}]`;

      const completion = await groq.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.3,
      });

      const raw = (completion.choices[0]?.message?.content || '').trim();
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed: Array<{ title: string }> = JSON.parse(cleaned);

      // Dedup against existing steps
      const existingNorm = new Set(existingSteps.map(s => s.toLowerCase().trim()));
      return parsed
        .filter(item => item && typeof item.title === 'string')
        .map(item => item.title.trim())
        .filter(t => t && !existingNorm.has(t.toLowerCase().trim()))
        .slice(0, 5);
    } catch (error) {
      console.error('Failed to generate subtasks', error);
      return ['Identify key requirements', 'Plan the first step'];
    }
  },

  /**
   * Generate steps for a task and persist them as subtasks in one server-side operation.
   * Validates ownership, prevents duplicate generation, and handles all AI + DB logic.
   */
  generateAndPersistSteps: async (userId: string, taskId: string) => {
    // 1. Fetch the task and verify ownership
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { subTasks: { select: { id: true, title: true } } },
    });

    if (!task) {
      throw NotFoundError('Task not found');
    }
    if (task.userId !== userId) {
      throw ForbiddenError('You do not own this task');
    }

    // 2. Guard: already broken down
    if (task.breakdownGenerated) {
      return {
        alreadyGenerated: true,
        subTasks: task.subTasks,
        message: 'Steps have already been generated for this task.',
      };
    }

    // 3. Guard: subtasks of subtasks not allowed
    if (task.parentTaskId) {
      throw BadReqError('Cannot break down a subtask');
    }

    // 4. Collect existing subtask titles for dedup
    const existingTitles = (task.subTasks ?? []).map(s => s.title);

    // 5. Generate steps via AI
    const steps = await TaskService.generateSubtasksWithAI(
      task.title,
      task.description || undefined,
      existingTitles,
    );

    if (steps.length === 0) {
      return {
        alreadyGenerated: false,
        subTasks: task.subTasks,
        message: 'AI could not generate steps. Try again later.',
      };
    }

    // 6. Persist new subtasks
    const createdSubTasks = [];
    const startIndex = (task.subTasks ?? []).length;
    for (let i = 0; i < steps.length; i++) {
      const sub = await prisma.task.create({
        data: {
          userId,
          title: steps[i],
          priority: 'LOW',
          category: task.category || 'OTHER',
          energyLevel: 'LOW',
          energyLevelRequired: 'LOW',
          emotionalWeight: 10,
          estimatedMinutes: 15,
          recurring: 'NONE',
          taskDate: task.taskDate,
          parentTaskId: taskId,
          orderIndex: startIndex + i,
        },
      });
      createdSubTasks.push(sub);
    }

    // 7. Mark breakdown as generated
    await prisma.task.update({
      where: { id: taskId },
      data: { breakdownGenerated: true },
    });

    // 8. Return all subtasks (existing + new)
    const allSubTasks = await prisma.task.findMany({
      where: { parentTaskId: taskId },
      orderBy: { orderIndex: 'asc' },
    });

    return {
      alreadyGenerated: false,
      subTasks: allSubTasks,
      message: `Generated ${createdSubTasks.length} steps.`,
    };
  },

  getWeeklyAnalytics: async (userId: string) => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const tasks = await prisma.task.findMany({
      where: { userId, dueDate: { gte: startOfWeek } }
    });

    const completionByDay: Record<string, { total: number, completed: number }> = {};
    tasks.forEach(task => {
      if (!task.dueDate) return;
      const day = task.dueDate.toISOString().split('T')[0];
      if (!completionByDay[day]) completionByDay[day] = { total: 0, completed: 0 };
      completionByDay[day].total++;
      if (task.isCompleted) completionByDay[day].completed++;
    });

    let mostProductiveDay = null;
    let maxCompleted = -1;
    for (const [day, stats] of Object.entries(completionByDay)) {
      if (stats.completed > maxCompleted) {
        maxCompleted = stats.completed;
        mostProductiveDay = day;
      }
    }

    const completedTasksWithTimes = tasks.filter(t => t.isCompleted && t.createdAt && t.completedAt);
    let totalFocusMinutes = 0;
    tasks.forEach(task => { if (task.focusMinutes) totalFocusMinutes += task.focusMinutes; });

    return {
      completionByDay,
      mostProductiveDay,
      totalCompletedThisWeek: completedTasksWithTimes.length,
      totalFocusMinutes
    };
  },

  saveEmotionalFeedback: async (userId: string, taskId: string, feedback: string) => {
    const result = await prisma.task.updateMany({
      where: { id: taskId, userId },
      data: { emotionalFeedback: feedback }
    });

    // Award XP for reflection
    await awardXP(userId, XP_RULES.TASK_REFLECTION);

    try {
      await GrowthService.refreshCurrentWeekForUser(userId);
    } catch (error) {
      console.warn('Growth refresh skipped after emotional feedback', error);
    }

    return result;
  },

  getEmotionalInsights: async (userId: string) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const tasks = await prisma.task.findMany({
      where: { userId, createdAt: { gte: sevenDaysAgo } }
    });

    const byFeedback: Record<string, { total: number; completed: number }> = {};
    tasks.forEach(t => {
      const key = t.emotionalFeedback || 'UNKNOWN';
      if (!byFeedback[key]) byFeedback[key] = { total: 0, completed: 0 };
      byFeedback[key].total++;
      if (t.isCompleted) byFeedback[key].completed++;
    });

    const insights: string[] = [];
    if (byFeedback['ENERGIZING'] && byFeedback['ENERGIZING'].total > 0) {
      const rate = Math.round((byFeedback['ENERGIZING'].completed / byFeedback['ENERGIZING'].total) * 100);
      insights.push(`You complete ${rate}% of tasks that feel energising.`);
    }

    const chartData: Array<{ date: string; completionRate: number; taskCount: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const dayTasks = tasks.filter(t => (t as any).taskDate === dateStr);
      const completed = dayTasks.filter(t => t.isCompleted).length;
      chartData.push({
        date: dateStr,
        completionRate: dayTasks.length > 0 ? Math.round((completed / dayTasks.length) * 100) : 0,
        taskCount: dayTasks.length
      });
    }

    return { insights, chartData };
  },

  computeDailyAnalytics: async (userId: string, dateStr: string) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const tasks = await prisma.task.findMany({ where: { userId, taskDate: dateStr } });

    const priorityWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const energyWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

    const totalWeight = tasks.reduce((sum, t) => {
      return sum + (priorityWeight[t.priority] || 2) * (energyWeight[t.energyLevelRequired] || 2);
    }, 0);
    const maxWeight = tasks.length * 9;
    const dailyLoadScore = maxWeight > 0 ? Math.min(100, Math.round((totalWeight / maxWeight) * 100)) : 0;
    const loadLabel = dailyLoadScore <= 40 ? 'Balanced' : dailyLoadScore <= 70 ? 'Heavy' : 'Overloaded';

    const yesterday = new Date(dateStr + 'T00:00:00');
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;
    const prevRow = await prisma.taskAnalytics.findUnique({ where: { userId_date: { userId, date: yStr } } });
    const heavyDayStreak = loadLabel !== 'Balanced' ? (prevRow?.heavyDayStreak ?? 0) + 1 : 0;

    const completedTasks = tasks.filter(t => t.isCompleted).length;
    const focusMinutesTotal = tasks.reduce((sum, t) => sum + (t.focusMinutes || 0), 0);
    const focusScore = Math.round((tasks.length > 0 ? (completedTasks / tasks.length) * 60 : 0) + Math.min(40, (focusMinutesTotal / 120) * 40));

    const dayStart = new Date(dateStr + 'T00:00:00');
    const dayEnd = new Date(dateStr + 'T23:59:59');
    const moods = await prisma.moodEntry.findMany({ where: { userId, createdAt: { gte: dayStart, lte: dayEnd } } });
    const moodIntensityAvg = moods.length > 0 ? moods.reduce((s, m) => s + m.intensity, 0) / moods.length : 0;
    const dominantMoodOnDay = moods.length > 0 ? moods.sort((a, b) => b.intensity - a.intensity)[0].mood.toString() : null;

    return prisma.taskAnalytics.upsert({
      where: { userId_date: { userId, date: dateStr } },
      create: {
        userId, date: dateStr,
        dailyLoadScore, loadLabel, heavyDayStreak,
        focusScore, focusMinutesTotal, tasksCompleted: completedTasks, tasksPlanned: tasks.length,
        moodIntensityAvg, dominantMoodOnDay
      },
      update: {
        dailyLoadScore, loadLabel, heavyDayStreak,
        focusScore, focusMinutesTotal, tasksCompleted: completedTasks, tasksPlanned: tasks.length,
        moodIntensityAvg, dominantMoodOnDay
      }
    });
  },

  getDailyLoad: async (userId: string, dateStr: string) => {
    const existing = await prisma.taskAnalytics.findUnique({ where: { userId_date: { userId, date: dateStr } } });
    if (existing) return { dailyLoadScore: existing.dailyLoadScore, loadLabel: existing.loadLabel, heavyDayStreak: existing.heavyDayStreak, focusScore: existing.focusScore };
    const row = await TaskService.computeDailyAnalytics(userId, dateStr);
    return { dailyLoadScore: row.dailyLoadScore, loadLabel: row.loadLabel, heavyDayStreak: row.heavyDayStreak, focusScore: row.focusScore };
  },

  getWeeklyLetter: async (userId: string) => {
    const row = await prisma.taskAnalytics.findFirst({
      where: { userId, weeklyLetterContent: { not: null } },
      orderBy: { date: 'desc' }
    });
    if (!row) return { letter: null, date: null };
    return { letter: row.weeklyLetterContent, date: row.weeklyLetterDate };
  },

  generateAndCacheWeeklyLetter: async (userId: string, saturdayDateStr: string, letterContent: string) => {
    return prisma.taskAnalytics.upsert({
      where: { userId_date: { userId, date: saturdayDateStr } },
      create: { userId, date: saturdayDateStr, weeklyLetterContent: letterContent, weeklyLetterDate: saturdayDateStr },
      update: { weeklyLetterContent: letterContent, weeklyLetterDate: saturdayDateStr }
    });
  },

  checkBurnout: async (userId: string) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const heavyIncompleteCount = await prisma.task.count({
      where: {
        userId,
        isCompleted: false,
        parentTaskId: null,
        OR: [{ priority: 'HIGH' }, { energyLevelRequired: 'HIGH' }],
        createdAt: { gte: sevenDaysAgo },
      },
    });

    const weeklyBurnoutLevel = getWeeklyBurnoutLevel(heavyIncompleteCount);

    return {
      burnout: weeklyBurnoutLevel !== 'LOW',
      heavyIncompleteCount,
      weeklyBurnoutLevel,
      message: weeklyBurnoutLevel === 'HIGH'
        ? 'A gentle day can help you recover. Focus on one meaningful step.'
        : weeklyBurnoutLevel === 'MODERATE'
          ? 'Your week looks heavy. Keep tasks smaller and kinder today.'
          : null,
    };
  },

  getEODSummary: async (userId: string, dateStr: string) => {
    const tasks = await prisma.task.findMany({
      where: { userId, taskDate: dateStr, parentTaskId: null },
      select: { isCompleted: true, focusMinutes: true, emotionalFeedback: true },
    });

    const planned = tasks.length;
    const completed = tasks.filter((task) => task.isCompleted).length;
    const totalFocusMinutes = tasks.reduce((sum, task) => sum + (task.focusMinutes || 0), 0);
    const focusHours = (totalFocusMinutes / 60).toFixed(1);

    const { dayStart, dayEnd } = getDayBounds(dateStr);
    const moods = await prisma.moodEntry.findMany({
      where: { userId, createdAt: { gte: dayStart, lte: dayEnd } },
      orderBy: { createdAt: 'desc' },
      select: { mood: true, intensity: true },
    });

    const moodLabel = moods.length > 0 ? moods[0].mood.toString() : 'NEUTRAL';
    const completionRate = planned > 0 ? Math.round((completed / planned) * 100) : 0;
    const balance = completionRate >= 70 ? 'steady' : completionRate >= 40 ? 'in progress' : 'gentle reset';

    return {
      planned,
      completed,
      focusHours,
      moodLabel,
      balance,
      summary: completionRate >= 70
        ? 'You kept momentum with care today.'
        : completionRate >= 40
          ? 'You made progress; tomorrow can stay simple.'
          : 'Today asked a lot. A lighter plan tomorrow can help.',
    };
  },

  planDay: async (userId: string, dateStr: string, moodContext: string) => {
    const tasks = await prisma.task.findMany({
      where: { userId, taskDate: dateStr, isCompleted: false, parentTaskId: null },
      select: { id: true, title: true, priority: true, energyLevelRequired: true, emotionalWeight: true, createdAt: true },
    });

    const mood = (moodContext || 'NEUTRAL').toUpperCase();
    const isLowMood = ['SAD', 'ANXIOUS', 'STRESSED', 'TIRED'].includes(mood);

    const scored = tasks.map((task) => {
      const priorityScore = task.priority === 'HIGH' ? 3 : task.priority === 'MEDIUM' ? 2 : 1;
      const energyPenalty = isLowMood && task.energyLevelRequired === 'HIGH' ? -2 : 0;
      const emotionalEase = Math.round((30 - Math.min(task.emotionalWeight || 20, 30)) / 10);
      const recency = -Math.min(2, Math.floor((Date.now() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 3)));
      return { task, score: priorityScore + energyPenalty + emotionalEase + recency };
    }).sort((a, b) => b.score - a.score);

    return scored.map((entry, index) => ({
      id: entry.task.id,
      title: entry.task.title,
      priority: entry.task.priority,
      suggestedIndex: index,
    }));
  },

  getResistanceFlagged: async (userId: string) => {
    const threshold = new Date();
    threshold.setHours(0, 0, 0, 0);
    threshold.setDate(threshold.getDate() - 3);

    await prisma.task.updateMany({
      where: {
        userId,
        isCompleted: false,
        parentTaskId: null,
        createdAt: { lt: threshold },
        resistanceFlag: false,
      },
      data: { resistanceFlag: true, resistanceFlaggedAt: new Date() },
    });

    return prisma.task.findMany({
      where: { userId, resistanceFlag: true, isCompleted: false, parentTaskId: null },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: 10,
    });
  },

  clearResistanceFlag: async (userId: string, taskId: string) => {
    return prisma.task.updateMany({
      where: { id: taskId, userId },
      data: { resistanceFlag: false, resistanceFlaggedAt: null },
    });
  },

  getMoodCorrelation: async (userId: string) => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const tasks = await prisma.task.findMany({
      where: { userId, taskDate: { not: null }, createdAt: { gte: fourteenDaysAgo }, parentTaskId: null },
      select: { taskDate: true, isCompleted: true },
    });

    const moods = await prisma.moodEntry.findMany({
      where: { userId, createdAt: { gte: fourteenDaysAgo } },
      select: { mood: true, intensity: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const moodByDate = new Map<string, { mood: string; intensity: number }>();
    moods.forEach((entry) => {
      const key = toDateKey(entry.createdAt);
      if (!moodByDate.has(key)) {
        moodByDate.set(key, { mood: entry.mood.toString(), intensity: entry.intensity });
      }
    });

    const byMood: Record<string, { total: number; completed: number; avgIntensity: number; _sumIntensity: number }> = {};

    tasks.forEach((task) => {
      const dayMood = task.taskDate ? moodByDate.get(task.taskDate) : undefined;
      const mood = dayMood?.mood || 'UNKNOWN';
      if (!byMood[mood]) byMood[mood] = { total: 0, completed: 0, avgIntensity: 0, _sumIntensity: 0 };
      byMood[mood].total += 1;
      if (task.isCompleted) byMood[mood].completed += 1;
      byMood[mood]._sumIntensity += dayMood?.intensity || 0;
    });

    const correlations = Object.entries(byMood).map(([mood, stats]) => ({
      mood,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      sampleSize: stats.total,
      avgIntensity: stats.total > 0 ? Math.round((stats._sumIntensity / stats.total) * 10) / 10 : 0,
    }));

    return { correlations };
  },

  getExecutionContext: async (userId: string, dateStr: string) => {
    const { dayStart, dayEnd } = getDayBounds(dateStr);

    const [dayMoods, recentMoods, burnoutInfo] = await Promise.all([
      prisma.moodEntry.findMany({
        where: { userId, createdAt: { gte: dayStart, lte: dayEnd } },
        orderBy: { createdAt: 'desc' },
        select: { mood: true, intensity: true },
      }),
      prisma.moodEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { intensity: true },
      }),
      TaskService.checkBurnout(userId),
    ]);

    const moodType = dayMoods[0]?.mood?.toString() || 'NEUTRAL';
    const intensity = dayMoods[0]?.intensity ?? 5;
    const emotionalTrend = computeEmotionalTrend(recentMoods.map((entry) => entry.intensity).reverse());

    const capacity = await TaskService.getDailyCapacity(userId, dateStr);
    const lowMood = ['SAD', 'ANXIOUS', 'STRESSED', 'TIRED'].includes(moodType.toUpperCase()) || intensity <= 4;
    const gentleModeActive = lowMood || burnoutInfo.weeklyBurnoutLevel === 'HIGH' || capacity.current <= 35;

    const allTasks = await prisma.task.findMany({
      where: { userId, taskDate: dateStr, parentTaskId: null },
      include: { subTasks: true },
      orderBy: [
        { orderIndex: 'asc' },
        { isCompleted: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    const hiddenHighEnergyTasks = gentleModeActive
      ? allTasks.filter((task) => !task.isCompleted && task.energyLevelRequired === 'HIGH' && task.priority !== 'HIGH')
      : [];

    const hiddenIds = new Set(hiddenHighEnergyTasks.map((task) => task.id));
    const tasks = allTasks.filter((task) => !hiddenIds.has(task.id));

    const supportiveBanner = gentleModeActive
      ? (burnoutInfo.weeklyBurnoutLevel === 'HIGH'
        ? 'Today is for lighter steps. High-energy tasks are tucked away for now.'
        : 'A gentle mode is active. Start with one small, meaningful task.')
      : null;

    return {
      moodType,
      intensity,
      emotionalTrend,
      weeklyBurnoutLevel: burnoutInfo.weeklyBurnoutLevel,
      gentleModeActive,
      supportiveBanner,
      capacity,
      tasks,
      hiddenHighEnergyTasks,
    };
  },

  getDailyCapacity: async (userId: string, dateStr: string) => {
    const { dayStart, dayEnd } = getDayBounds(dateStr);

    const [dayMoods, completedTasks] = await Promise.all([
      prisma.moodEntry.findMany({
        where: { userId, createdAt: { gte: dayStart, lte: dayEnd } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { mood: true, intensity: true },
      }),
      prisma.task.findMany({
        where: { userId, taskDate: dateStr, isCompleted: true, parentTaskId: null },
        select: { emotionalWeight: true, estimatedMinutes: true, priority: true },
      }),
    ]);

    const moodMultiplier = getMoodEnergyMultiplier(dayMoods[0]?.mood?.toString());
    const adjustedTotal = clamp(Math.round(100 * moodMultiplier), 70, 115);

    const recomputedEnergyUsed = clamp(
      completedTasks.reduce((sum, task) => sum + getTaskEnergyCost(task), 0),
      0,
      100
    );

    const row = await prisma.emotionalCapacityDay.upsert({
      where: { userId_date: { userId, date: dateStr } },
      create: {
        userId,
        date: dateStr,
        capacity: adjustedTotal,
        energyUsed: recomputedEnergyUsed,
        gentleModeActive: recomputedEnergyUsed >= Math.round(adjustedTotal * 0.7),
        consistencyBonusAwarded: false,
      },
      update: {
        capacity: adjustedTotal,
        energyUsed: recomputedEnergyUsed,
        gentleModeActive: recomputedEnergyUsed >= Math.round(adjustedTotal * 0.7),
      },
    });

    const used = clamp(row.energyUsed, 0, row.capacity);
    const current = clamp(row.capacity - used, 0, row.capacity);
    const percentage = row.capacity > 0 ? Math.round((current / row.capacity) * 100) : 0;
    const gentleModeActive = row.gentleModeActive || percentage <= 35;

    return {
      total: row.capacity,
      current,
      used,
      percentage,
      gentleModeActive,
      message: gentleModeActive
        ? 'Energy is running low. Smaller steps are enough today.'
        : 'Capacity looks stable. Keep your pace gentle and steady.',
    };
  },

  getCalendarSummary: async (userId: string, dateStr: string) => {
    const center = new Date(`${dateStr}T00:00:00`);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(center);
      d.setDate(center.getDate() - 3 + i);
      return toDateKey(d);
    });

    const [tasks, moods, capacities] = await Promise.all([
      prisma.task.findMany({
        where: { userId, taskDate: { in: days }, parentTaskId: null },
        select: { taskDate: true, isCompleted: true },
      }),
      prisma.moodEntry.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(`${days[0]}T00:00:00`),
            lte: new Date(`${days[days.length - 1]}T23:59:59.999`),
          },
        },
        select: { mood: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.emotionalCapacityDay.findMany({
        where: { userId, date: { in: days } },
        select: { date: true, capacity: true, energyUsed: true },
      }),
    ]);

    const moodByDate = new Map<string, string>();
    moods.forEach((entry: any) => {
      const key = toDateKey(entry.createdAt);
      if (!moodByDate.has(key)) {
        moodByDate.set(key, entry.mood.toString());
      }
    });

    const capacityByDate = new Map<string, { capacity: number; energyUsed: number }>();
    capacities.forEach((entry: any) => {
      capacityByDate.set(entry.date, { capacity: entry.capacity, energyUsed: entry.energyUsed });
    });

    const taskByDate = new Map<string, { total: number; completed: number }>();
    tasks.forEach((task: any) => {
      if (!task.taskDate) return;
      const current = taskByDate.get(task.taskDate) || { total: 0, completed: 0 };
      current.total += 1;
      if (task.isCompleted) current.completed += 1;
      taskByDate.set(task.taskDate, current);
    });

    return {
      days: days.map((date) => {
        const taskStats = taskByDate.get(date) || { total: 0, completed: 0 };
        const cap = capacityByDate.get(date) || { capacity: 100, energyUsed: 0 };
        const completionRatio = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;
        const capacityPercentage = cap.capacity > 0 ? Math.round(((cap.capacity - Math.min(cap.energyUsed, cap.capacity)) / cap.capacity) * 100) : 0;
        return {
          date,
          mood: moodByDate.get(date) || null,
          completed: taskStats.completed,
          total: taskStats.total,
          completionRatio,
          capacityPercentage,
          energyUsed: Math.min(100, cap.energyUsed),
        };
      }),
    };
  },

  getTinyWinsForToday: async (userId: string, dateStr: string) => {
    const [tasks, moods, focusCount] = await Promise.all([
      prisma.task.findMany({
        where: { userId, taskDate: dateStr, parentTaskId: null },
        select: { isCompleted: true, emotionalFeedback: true },
      }),
      prisma.moodEntry.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(`${dateStr}T00:00:00`),
            lte: new Date(`${dateStr}T23:59:59.999`),
          },
        },
      }),
      prisma.calmSession.count({
        where: {
          userId,
          focusMode: true,
          completed: true,
          createdAt: {
            gte: new Date(`${dateStr}T00:00:00`),
            lte: new Date(`${dateStr}T23:59:59.999`),
          },
        },
      }),
    ]);

    const completedCount = tasks.filter((task) => task.isCompleted).length;
    const reflectedCount = tasks.filter((task) => !!task.emotionalFeedback).length;

    const wins = [
      { id: 'win-task', label: 'Completed one mindful task', done: completedCount >= 1, icon: 'check' },
      { id: 'win-reflect', label: 'Reflected after completion', done: reflectedCount >= 1, icon: 'sparkles' },
      { id: 'win-mood', label: 'Checked in with your mood', done: moods >= 1, icon: 'heart' },
      { id: 'win-focus', label: 'Took one focus session', done: focusCount >= 1, icon: 'timer' },
    ];

    return { wins };
  }
};
