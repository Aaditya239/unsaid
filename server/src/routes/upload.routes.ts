import { Router } from 'express';
import { uploadImage } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Require authentication for uploads
router.use(authenticate);

// POST /api/upload/image
router.post('/image', uploadImage);

export default router;
