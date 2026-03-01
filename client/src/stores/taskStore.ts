import { create } from 'zustand';
import api from '../lib/api';
import dayjs from 'dayjs';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: 'WORK' | 'HEALTH' | 'PERSONAL' | 'STUDY' | 'FINANCE' | 'OTHER';
  energyLevelRequired: 'LOW' | 'MEDIUM' | 'HIGH';
  energyLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  emotionalWeight?: number;
  estimatedMinutes?: number;
  completionFeeling?: 'LIGHTER' | 'NEUTRAL' | 'DRAINING';
  dueDate?: string;
  reminderTime?: string;
  recurring: 'NONE' | 'DAILY' | 'WEEKLY' | 'CUSTOM';
  isCompleted: boolean;
  subTasks?: Task[];
  orderIndex: number;
  focusMinutes: number;
  focusSessionsCount: number;
  streakDays: number;
  parentTaskId?: string;
  taskDate?: string;
  emotionalFeedback?: string;
  breakdownGenerated?: boolean;
  burnoutFlag?: boolean;
}

interface InsightsData {
  insights: string[];
  chartData: Array<{ date: string; completionRate: number; taskCount: number }>;
}

interface BurnoutData {
  burnout: boolean;
  heavyIncompleteCount: number;
  weeklyBurnoutLevel?: 'LOW' | 'MODERATE' | 'HIGH';
  message: string | null;
}

interface EODSummary {
  planned: number;
  completed: number;
  focusHours: string;
  moodLabel: string;
  balance: string;
  summary: string;
}

interface ExecutionContext {
  moodType: string;
  intensity: number;
  emotionalTrend: 'RISING' | 'FALLING' | 'STEADY';
  weeklyBurnoutLevel: 'LOW' | 'MODERATE' | 'HIGH';
  gentleModeActive: boolean;
  supportiveBanner: string | null;
}

interface DailyCapacity {
  total: number;
  current: number;
  used: number;
  percentage: number;
  gentleModeActive: boolean;
  message: string | null;
}

interface CalendarDaySummary {
  date: string;
  mood: string | null;
  completed: number;
  total: number;
  completionRatio: number;
  capacityPercentage: number;
  energyUsed: number;
}

interface TinyWin {
  id: string;
  label: string;
  done: boolean;
  icon: string;
}

interface TaskState {
  today: Task[];
  tomorrow: Task[];
  upcoming: Task[];
  noDate: Task[];
  hiddenHighEnergyTasks: Task[];
  isLoading: boolean;
  progress: { totalTasks: number; completedTasks: number; completionRate: number } | null;
  analytics: any | null;
  selectedDate: Date;
  insights: InsightsData | null;
  burnoutData: BurnoutData | null;
  eodSummary: EODSummary | null;
  executionContext: ExecutionContext | null;
  dailyCapacity: DailyCapacity | null;
  calendarSummary: CalendarDaySummary[];
  tinyWins: TinyWin[];

  setSelectedDate: (date: Date) => void;
  fetchTasksForDate: (date: Date) => Promise<void>;
  fetchTasks: () => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<Task | null>;
  updateTaskStatus: (id: string, isCompleted: boolean) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  updateSubtaskStatus: (id: string, isCompleted: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (tasks: Task[], listType: 'today' | 'tomorrow' | 'upcoming' | 'noDate') => Promise<void>;
  fetchProgress: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  generateSubtasks: (title: string, description?: string, existingSteps?: string[]) => Promise<string[]>;
  generateStepsForTask: (taskId: string) => Promise<{ subTasks: Task[]; alreadyGenerated: boolean; message: string } | null>;
  saveEmotionalFeedback: (id: string, feedback: string) => Promise<void>;
  fetchInsights: () => Promise<void>;
  checkBurnout: () => Promise<void>;
  fetchEODSummary: (dateStr: string) => Promise<void>;
  planDay: (moodContext: string) => Promise<Array<{ id: string; title: string; priority: string; suggestedIndex: number }>>;
  fetchExecutionContext: (dateStr?: string) => Promise<void>;
  fetchDailyCapacity: (dateStr?: string) => Promise<void>;
  fetchCalendarSummary: (dateStr?: string) => Promise<void>;
  fetchTinyWins: (dateStr?: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  today: [],
  tomorrow: [],
  upcoming: [],
  noDate: [],
  hiddenHighEnergyTasks: [],
  isLoading: false,
  progress: null,
  analytics: null,
  selectedDate: new Date(new Date().setHours(0, 0, 0, 0)),
  insights: null,
  burnoutData: null,
  eodSummary: null,
  executionContext: null,
  dailyCapacity: null,
  calendarSummary: [],
  tinyWins: [],

  setSelectedDate: (date) => set({ selectedDate: date }),

  fetchTasksForDate: async (date) => {
    set({ isLoading: true });
    try {
      const dateStr = dayjs(date).format('YYYY-MM-DD');
      const [{ data: contextData }, { data: progressData }] = await Promise.all([
        api.get(`/tasks/execution-context?date=${dateStr}`),
        api.get(`/tasks/progress?date=${dateStr}`),
      ]);

      set({
        today: contextData.data.tasks,
        hiddenHighEnergyTasks: contextData.data.hiddenHighEnergyTasks || [],
        executionContext: {
          moodType: contextData.data.moodType,
          intensity: contextData.data.intensity,
          emotionalTrend: contextData.data.emotionalTrend,
          weeklyBurnoutLevel: contextData.data.weeklyBurnoutLevel,
          gentleModeActive: contextData.data.gentleModeActive,
          supportiveBanner: contextData.data.supportiveBanner,
        },
        dailyCapacity: contextData.data.capacity,
        progress: progressData.data.progress,
      });

      await Promise.all([get().fetchCalendarSummary(dateStr), get().fetchTinyWins(dateStr)]);
    } catch (error) {
      console.error('Failed to fetch tasks for date', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/tasks/timeframe');
      set({
        today: data.data.today,
        tomorrow: data.data.tomorrow,
        upcoming: data.data.upcoming,
        noDate: data.data.noDate,
      });

      await Promise.all([get().fetchExecutionContext(), get().fetchDailyCapacity(), get().fetchTinyWins()]);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createTask: async (taskData) => {
    try {
      const dateStr = dayjs(get().selectedDate).format('YYYY-MM-DD');
      const isSubtask = !!taskData.parentTaskId;
      const payload = isSubtask
        ? { ...taskData }
        : {
          ...taskData,
          taskDate: taskData.taskDate ?? dateStr,
          dueDate: taskData.dueDate || new Date(`${dateStr}T00:00:00`),
          energyLevel: taskData.energyLevel || taskData.energyLevelRequired || 'MEDIUM',
          energyLevelRequired: taskData.energyLevelRequired || taskData.energyLevel || 'MEDIUM',
          estimatedMinutes: taskData.estimatedMinutes || 25,
        };

      const { data } = await api.post('/tasks', payload);
      await get().fetchTasksForDate(get().selectedDate);
      return data.data.task;
    } catch (error) {
      console.error('Failed to create task', error);
      return null;
    }
  },

  updateTaskStatus: async (id, isCompleted) => {
    const updateInArray = (arr: Task[]) => arr.map((t) => (t.id === id ? { ...t, isCompleted } : t));
    set({
      today: updateInArray(get().today),
      tomorrow: updateInArray(get().tomorrow),
      upcoming: updateInArray(get().upcoming),
      noDate: updateInArray(get().noDate),
    });

    try {
      await api.patch(`/tasks/${id}/status`, { isCompleted });
      await get().fetchTasksForDate(get().selectedDate);
      get().fetchTinyWins(dayjs(get().selectedDate).format('YYYY-MM-DD'));
    } catch (error) {
      console.error('Failed to update task status', error);
      get().fetchTasksForDate(get().selectedDate);
    }
  },

  updateSubtaskStatus: async (id, isCompleted) => {
    const patchSubtask = (arr: Task[]): Task[] => arr.map((t) => ({
      ...t,
      subTasks: t.subTasks?.map((s) => (s.id === id ? { ...s, isCompleted } : s)),
    }));

    set({
      today: patchSubtask(get().today),
      tomorrow: patchSubtask(get().tomorrow),
      upcoming: patchSubtask(get().upcoming),
      noDate: patchSubtask(get().noDate),
    });

    try {
      await api.patch(`/tasks/${id}/status`, { isCompleted });
      get().fetchTasksForDate(get().selectedDate);
    } catch (error) {
      console.error('Failed to update subtask status', error);
      get().fetchTasksForDate(get().selectedDate);
    }
  },

  updateTask: async (id, data) => {
    try {
      await api.put(`/tasks/${id}`, data);
      get().fetchTasksForDate(get().selectedDate);
    } catch (error) {
      console.error('Failed to update task', error);
    }
  },

  deleteTask: async (id) => {
    const removeFromArray = (arr: Task[]) => arr.filter((t) => t.id !== id);
    set({
      today: removeFromArray(get().today),
      tomorrow: removeFromArray(get().tomorrow),
      upcoming: removeFromArray(get().upcoming),
      noDate: removeFromArray(get().noDate),
    });

    try {
      await api.delete(`/tasks/${id}`);
      get().fetchTasksForDate(get().selectedDate);
    } catch (error) {
      console.error('Failed to delete task', error);
      get().fetchTasksForDate(get().selectedDate);
    }
  },

  reorderTasks: async (newOrder, listType) => {
    set({ [listType]: newOrder } as any);
    const tasksPayload = newOrder.map((t, index) => ({ id: t.id, orderIndex: index }));

    try {
      await api.put('/tasks/reorder/all', { tasks: tasksPayload });
    } catch (error) {
      console.error('Failed to reorder tasks', error);
      get().fetchTasksForDate(get().selectedDate);
    }
  },

  fetchProgress: async () => {
    try {
      const date = dayjs(get().selectedDate).format('YYYY-MM-DD');
      const { data } = await api.get(`/tasks/progress?date=${date}`);
      set({ progress: data.data.progress });
    } catch (error) {
      console.error('Failed to fetch progress', error);
    }
  },

  fetchAnalytics: async () => {
    try {
      const { data } = await api.get('/tasks/analytics/weekly');
      set({ analytics: data.data.analytics });
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    }
  },

  generateSubtasks: async (title, description, existingSteps = []) => {
    try {
      const { data } = await api.post('/tasks/ai/subtasks', { title, description, existingSteps });
      return data.data.subtasks;
    } catch {
      return [];
    }
  },

  generateStepsForTask: async (taskId) => {
    try {
      const { data } = await api.post(`/tasks/${taskId}/generate-steps`);
      const result = {
        subTasks: data.data.subTasks as Task[],
        alreadyGenerated: data.data.alreadyGenerated as boolean,
        message: data.message as string,
      };

      // Optimistically patch the local task with the new subtasks
      const patchTask = (arr: Task[]): Task[] =>
        arr.map((t) =>
          t.id === taskId
            ? { ...t, subTasks: result.subTasks, breakdownGenerated: true }
            : t
        );

      set({
        today: patchTask(get().today),
        tomorrow: patchTask(get().tomorrow),
        upcoming: patchTask(get().upcoming),
        noDate: patchTask(get().noDate),
      });

      return result;
    } catch (error) {
      console.error('Failed to generate steps for task', error);
      return null;
    }
  },

  saveEmotionalFeedback: async (id, feedback) => {
    try {
      await api.patch(`/tasks/${id}/emotional-feedback`, { feedback });
      get().fetchTasksForDate(get().selectedDate);
      get().fetchTinyWins(dayjs(get().selectedDate).format('YYYY-MM-DD'));
    } catch (error) {
      console.error('Failed to save emotional feedback', error);
    }
  },

  fetchInsights: async () => {
    try {
      const { data } = await api.get('/tasks/insights/emotional');
      set({ insights: data.data });
    } catch (error) {
      console.error('Failed to fetch insights', error);
    }
  },

  checkBurnout: async () => {
    try {
      const { data } = await api.get('/tasks/burnout/check');
      set({ burnoutData: data.data });
    } catch (error) {
      console.error('Failed to check burnout', error);
    }
  },

  fetchEODSummary: async (dateStr) => {
    try {
      const { data } = await api.get(`/tasks/eod-summary?date=${dateStr}`);
      set({ eodSummary: data.data });
    } catch (error) {
      console.error('Failed to fetch EOD summary', error);
    }
  },

  planDay: async (moodContext) => {
    try {
      const dateStr = dayjs(get().selectedDate).format('YYYY-MM-DD');
      const { data } = await api.post('/tasks/ai/plan-day', { date: dateStr, moodContext });
      return data.data.plan;
    } catch (error) {
      console.error('Failed to plan day', error);
      return [];
    }
  },

  fetchExecutionContext: async (dateStr) => {
    try {
      const date = dateStr || dayjs(get().selectedDate).format('YYYY-MM-DD');
      const { data } = await api.get(`/tasks/execution-context?date=${date}`);
      set({
        executionContext: {
          moodType: data.data.moodType,
          intensity: data.data.intensity,
          emotionalTrend: data.data.emotionalTrend,
          weeklyBurnoutLevel: data.data.weeklyBurnoutLevel,
          gentleModeActive: data.data.gentleModeActive,
          supportiveBanner: data.data.supportiveBanner,
        },
        dailyCapacity: data.data.capacity,
        hiddenHighEnergyTasks: data.data.hiddenHighEnergyTasks || [],
      });
    } catch (error) {
      console.error('Failed to fetch execution context', error);
    }
  },

  fetchDailyCapacity: async (dateStr) => {
    try {
      const date = dateStr || dayjs(get().selectedDate).format('YYYY-MM-DD');
      const { data } = await api.get(`/tasks/capacity/daily?date=${date}`);
      set({ dailyCapacity: data.data });
    } catch (error) {
      console.error('Failed to fetch daily capacity', error);
    }
  },

  fetchCalendarSummary: async (dateStr) => {
    try {
      const date = dateStr || dayjs(get().selectedDate).format('YYYY-MM-DD');
      const { data } = await api.get(`/tasks/calendar-summary?date=${date}`);
      set({ calendarSummary: data.data.days || [] });
    } catch (error) {
      console.error('Failed to fetch calendar summary', error);
    }
  },

  fetchTinyWins: async (dateStr) => {
    try {
      const date = dateStr || dayjs(get().selectedDate).format('YYYY-MM-DD');
      const { data } = await api.get(`/tasks/tiny-wins/daily?date=${date}`);
      set({ tinyWins: data.data.wins || [] });
    } catch (error) {
      console.error('Failed to fetch tiny wins', error);
    }
  },
}));
