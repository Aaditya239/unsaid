import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Require authentication for all task routes
router.use(authenticate);

// Core CRUD
router.get('/', TaskController.getTasks);
router.post('/', TaskController.createTask);
router.get('/timeframe', TaskController.getTasksByTimeframe);
router.patch('/:id/status', TaskController.updateTaskStatus);
router.put('/reorder/all', TaskController.reorderTasks);
router.put('/:id', TaskController.updateTask);
router.delete('/:id', TaskController.deleteTask);

// Canonical task insights routes
router.get('/progress', TaskController.getDailyProgress);
router.get('/analytics/weekly', TaskController.getAnalytics);
router.get('/calendar-summary', TaskController.getCalendarSummary);
router.get('/execution-context', TaskController.getExecutionContext);
router.get('/resistance', TaskController.getResistanceFlagged);
router.get('/weekly-letter', TaskController.getWeeklyLetter);

// Backward-compatible aliases
router.get('/progress/daily', TaskController.getDailyProgress);
router.get('/calendar/summary', TaskController.getCalendarSummary);
router.get('/execution/context', TaskController.getExecutionContext);

// AI & Smart Features
router.get('/suggest', TaskController.getMoodSuggestedTasks);
router.post('/ai/subtasks', TaskController.generateAISubtasks);
router.post('/:id/generate-steps', TaskController.generateSteps);

// Level 3 — Emotional Intelligence
router.patch('/:id/emotional-feedback', TaskController.saveEmotionalFeedback);
router.get('/insights/emotional', TaskController.getEmotionalInsights);
router.get('/burnout/check', TaskController.checkBurnout);
router.get('/eod-summary', TaskController.getEODSummary);
router.post('/ai/plan-day', TaskController.planDay);

// Level 4 — Productivity Intelligence
router.get('/analytics/load', TaskController.getDailyLoad);
router.get('/analytics/daily', TaskController.getDailyLoad);
router.get('/capacity/daily', TaskController.getDailyCapacity);
router.get('/tiny-wins/daily', TaskController.getTinyWins);
router.delete('/resistance/:id', TaskController.clearResistanceFlag);
router.get('/analytics/mood-correlation', TaskController.getMoodCorrelation);
router.post('/ai/rewrite-title', TaskController.rewriteTaskTitle);

export default router;

