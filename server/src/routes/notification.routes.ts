import { Router } from 'express';
import {
    subscribeUser,
    getNotificationPreferences,
    updateNotificationPreferences
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protect all notification routes
router.use(authenticate);

router.post('/subscribe', subscribeUser);
router.get('/preferences', getNotificationPreferences);
router.patch('/preferences', updateNotificationPreferences);

export default router;
