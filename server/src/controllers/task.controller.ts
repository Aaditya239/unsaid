import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { BadRequestError } from '../utils/appError';
import { z } from 'zod';

const getUserIdOr401 = (req: Request, res: Response): string | null => {
    if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return null;
    }
    return req.user.id;
};

const getRequiredDateQuery = (req: Request, res: Response): string | null => {
    const date = req.query.date;
    if (!date || typeof date !== 'string' || !date.trim()) {
        res.status(400).json({ success: false, message: 'date query param is required' });
        return null;
    }
    return date;
};

export const TaskController = {
    createTask: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const data = req.body;

            if (!data?.title || typeof data.title !== 'string') {
                throw BadRequestError('title is required');
            }

            if (data?.dueDate && typeof data.dueDate === 'string') {
                data.dueDate = new Date(data.dueDate);
            }
            if (data?.reminderTime && typeof data.reminderTime === 'string') {
                data.reminderTime = new Date(data.reminderTime);
            }

            if (data?.estimatedMinutes !== undefined && (!Number.isFinite(data.estimatedMinutes) || data.estimatedMinutes <= 0)) {
                throw BadRequestError('estimatedMinutes must be positive');
            }

            const task = await TaskService.createTask(userId, data);
            res.status(201).json({ success: true, data: { task } });
        } catch (error) {
            next(error);
        }
    },

    getTasks: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const { date } = req.query;
            let dateStr: string | undefined;
            if (date) {
                dateStr = date as string;
            }
            const tasks = await TaskService.getTasks(userId, dateStr);
            res.status(200).json({ success: true, data: { tasks } });
        } catch (error) {
            next(error);
        }
    },

    getTasksByTimeframe: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const data = await TaskService.getTasksByTimeframe(userId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    updateTaskStatus: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const taskId = req.params.id;
            const { isCompleted } = req.body;

            if (!z.string().uuid().safeParse(taskId).success) {
                throw BadRequestError('Invalid task ID');
            }

            await TaskService.updateTaskStatus(userId, taskId, isCompleted);
            res.status(200).json({ success: true, message: 'Task updated successfully' });
        } catch (error) {
            next(error);
        }
    },

    updateTask: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const taskId = req.params.id;
            const data = req.body;

            if (!z.string().uuid().safeParse(taskId).success) {
                throw BadRequestError('Invalid task ID');
            }

            if (data?.estimatedMinutes !== undefined && (!Number.isFinite(data.estimatedMinutes) || data.estimatedMinutes <= 0)) {
                throw BadRequestError('estimatedMinutes must be positive');
            }

            await TaskService.updateTask(userId, taskId, data);
            res.status(200).json({ success: true, message: 'Task updated successfully' });
        } catch (error) {
            next(error);
        }
    },

    reorderTasks: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const { tasks } = req.body;

            if (!Array.isArray(tasks)) {
                throw BadRequestError('Invalid tasks payload layout');
            }

            await TaskService.reorderTasks(userId, tasks);
            res.status(200).json({ success: true, message: 'Tasks reordered successfully' });
        } catch (error) {
            next(error);
        }
    },

    deleteTask: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const taskId = req.params.id;

            if (!z.string().uuid().safeParse(taskId).success) {
                throw BadRequestError('Invalid task ID');
            }

            await TaskService.deleteTask(userId, taskId);
            res.status(200).json({ success: true, message: 'Task deleted successfully' });
        } catch (error) {
            next(error);
        }
    },

    getDailyProgress: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const dateStr = getRequiredDateQuery(req, res);
            if (!dateStr) return;

            const progress = await TaskService.getDailyProgress(userId, dateStr);
            res.status(200).json({ success: true, data: { progress } });
        } catch (error) {
            next(error);
        }
    },

    getMoodSuggestedTasks: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const { intensity, mood } = req.query;

            const suggestions = await TaskService.getSuggestedTasksForMood(userId, parseInt(intensity as string) || 5, (mood as string) || 'NEUTRAL');
            res.status(200).json({ success: true, data: { suggestions } });
        } catch (error) {
            next(error);
        }
    },

    generateAISubtasks: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { title, description, existingSteps } = req.body;
            const subtasks = await TaskService.generateSubtasksWithAI(
                title,
                description,
                Array.isArray(existingSteps) ? existingSteps : []
            );
            res.status(200).json({ success: true, data: { subtasks } });
        } catch (error) {
            next(error);
        }
    },

    generateSteps: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const taskId = req.params.id;

            if (!z.string().uuid().safeParse(taskId).success) {
                throw BadRequestError('Invalid task ID');
            }

            const result = await TaskService.generateAndPersistSteps(userId, taskId);

            if (result.alreadyGenerated) {
                return res.status(200).json({
                    success: true,
                    data: { subTasks: result.subTasks, alreadyGenerated: true },
                    message: result.message,
                });
            }

            res.status(201).json({
                success: true,
                data: { subTasks: result.subTasks, alreadyGenerated: false },
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    },

    getAnalytics: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const analytics = await TaskService.getWeeklyAnalytics(userId);
            res.status(200).json({ success: true, data: { analytics } });
        } catch (error) {
            next(error);
        }
    },

    saveEmotionalFeedback: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const { id } = req.params;
            const rawFeedback = typeof req.body?.feedback === 'string' ? req.body.feedback.toUpperCase() : '';
            const feedback = rawFeedback === 'LIGHTER' ? 'ENERGIZING' : rawFeedback;
            if (!['ENERGIZING', 'NEUTRAL', 'DRAINING'].includes(feedback)) {
                return res.status(400).json({ success: false, message: 'Invalid feedback value' });
            }
            await TaskService.saveEmotionalFeedback(userId, id, feedback);
            res.status(200).json({ success: true, message: 'Feedback saved' });
        } catch (error) {
            next(error);
        }
    },

    getEmotionalInsights: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const data = await TaskService.getEmotionalInsights(userId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    checkBurnout: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const data = await TaskService.checkBurnout(userId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    getEODSummary: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const { date } = req.query;
            const pad = (n: number) => n.toString().padStart(2, '0');
            const today = new Date();
            const dateStr = (date as string) || `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
            const data = await TaskService.getEODSummary(userId, dateStr);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    planDay: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const { date, moodContext } = req.body;
            const pad = (n: number) => n.toString().padStart(2, '0');
            const today = new Date();
            const dateStr = date || `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
            const plan = await TaskService.planDay(userId, dateStr, moodContext || 'NEUTRAL');
            res.status(200).json({ success: true, data: { plan } });
        } catch (error) {
            next(error);
        }
    },

    // ─── Level 4: Productivity Intelligence ──────────────────────────────────

    getDailyLoad: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const { date } = req.query;
            const pad = (n: number) => n.toString().padStart(2, '0');
            const today = new Date();
            const dateStr = (date as string) || `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
            const data = await TaskService.getDailyLoad(userId, dateStr);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    },

    getResistanceFlagged: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const tasks = await TaskService.getResistanceFlagged(userId);
            res.status(200).json({ success: true, data: { tasks } });
        } catch (error) { next(error); }
    },

    clearResistanceFlag: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const { id } = req.params;
            await TaskService.clearResistanceFlag(userId, id);
            res.status(200).json({ success: true, message: 'Flag cleared' });
        } catch (error) { next(error); }
    },

    getMoodCorrelation: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const data = await TaskService.getMoodCorrelation(userId);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    },

    getWeeklyLetter: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const data = await TaskService.getWeeklyLetter(userId);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    },

    rewriteTaskTitle: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { title } = req.body;
            if (!title || typeof title !== 'string') {
                return res.status(400).json({ success: false, message: 'title is required' });
            }
            const { rewriteTaskTitle } = await import('../services/ai.service');
            const suggestion = await rewriteTaskTitle(title);
            res.status(200).json({ success: true, data: { suggestion } });
        } catch (error) { next(error); }
    },

    getExecutionContext: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const date = getRequiredDateQuery(req, res);
            if (!date) return;
            const data = await TaskService.getExecutionContext(userId, date);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    },

    getDailyCapacity: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const date = getRequiredDateQuery(req, res);
            if (!date) return;
            const data = await TaskService.getDailyCapacity(userId, date);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    },

    getCalendarSummary: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const date = getRequiredDateQuery(req, res);
            if (!date) return;
            const data = await TaskService.getCalendarSummary(userId, date);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    },

    getTinyWins: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserIdOr401(req, res);
            if (!userId) return;
            const date = getRequiredDateQuery(req, res);
            if (!date) return;
            const data = await TaskService.getTinyWinsForToday(userId, date);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    }
};
