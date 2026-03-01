// ============================================
// UNSAID - Main Server Entry Point
// ============================================
// This file initializes and configures the Express server with
// all necessary security middleware and route configurations.
// ============================================
import calmRoutes from './routes/calm.routes';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config();

// ============================================
// REQUIRED ENV VALIDATION
// ============================================
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`\n❌ Missing required environment variables: ${missing.join(', ')}\n`);
  process.exit(1);
}

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import journalRoutes from './routes/journal.routes';
import moodRoutes from './routes/mood.routes';
import aiRoutes from './routes/ai.routes';
import uploadRoutes from './routes/upload.routes';
import youtubeRoutes from './routes/youtube.routes';
import taskRoutes from './routes/task.routes';
import notificationRoutes from './routes/notification.routes';
import inAppNotificationRoutes from './routes/inAppNotification.routes';
import growthRoutes from './routes/growth.routes';

// Import custom error handler
import { errorHandler } from './middleware/error.middleware';
import { AppError } from './utils/appError';
import { CronService } from './services/cron.service';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet: Sets various HTTP headers for security
// - Protects against XSS, clickjacking, MIME sniffing
// - Sets Content-Security-Policy, X-Frame-Options, etc.
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
// - Allows requests from specified frontend origin
// - Enables credentials (cookies) to be sent cross-origin
const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile, curl, server-to-server)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

// Rate Limiting
// - Prevents brute force attacks
// - Limits requests per IP address
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 5000 : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Increase drastically for development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 10, // Increase for dev
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// ============================================
// BODY PARSERS
// ============================================

// Parse JSON bodies (limit size to prevent DoS)
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parse cookies (for httpOnly cookie authentication)
app.use(cookieParser());

// ============================================
// ROUTES
// ============================================

// Serve static files from the uploads directory securely
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'UNSAID API is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes: /api/auth/*
app.use('/api/auth', authRoutes);

// User routes: /api/users/* (protected)
app.use('/api/users', userRoutes);

// Journal routes: /api/journal/* (protected)
app.use('/api/journal', journalRoutes);

// Mood routes: /api/mood/* (protected)
app.use('/api/mood', moodRoutes);

// AI routes: /api/ai/* (protected)
app.use('/api/ai', aiRoutes);

// Upload routes: /api/upload/* (protected)
app.use('/api/upload', uploadRoutes);

// Add route (after existing routes)
app.use('/api/calm', calmRoutes);

// YouTube routes: /api/youtube/*
app.use('/api/youtube', youtubeRoutes);

// Task routes: /api/tasks/* (protected)
app.use('/api/tasks', taskRoutes);

// Push Notification routes: /api/push-notifications/* (protected)
app.use('/api/push-notifications', notificationRoutes);

// In-App Notification routes: /api/notifications/* (protected)
app.use('/api/notifications', inAppNotificationRoutes);

// Emotional Growth routes: /api/growth/* (protected)
app.use('/api/growth', growthRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// Handle 404 - Route not found
app.all('*', (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Global error handler
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

try {
  CronService.init();
} catch (error) {
  console.error('[CRON] Failed to initialize cron jobs:', error);
}

process.on('unhandledRejection', (reason) => {
  console.error('[PROCESS] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[PROCESS] Uncaught Exception:', error);
});

app.listen(PORT, () => {
  console.log(`
========================================
🚀 UNSAID Server Started
========================================
🌐 Environment: ${process.env.NODE_ENV || 'development'}
📡 Port: ${PORT}
🔗 API URL: http://localhost:${PORT}/api
🏥 Health: http://localhost:${PORT}/api/health
========================================
  `);
});

export default app;
