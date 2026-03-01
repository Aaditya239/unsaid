import { Router } from 'express';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
} from '../controllers/inAppNotification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.post('/mark-all-read', markAllAsRead);

export default router;
