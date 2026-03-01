import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getWeeklyGrowth } from '../controllers/growth.controller';

const router = Router();

router.use(authenticate);

router.get('/weekly', getWeeklyGrowth);

export default router;
