// ============================================
// Input Validation Schemas (Zod)
// ============================================
// Zod provides runtime validation with TypeScript integration.
// These schemas validate user input before processing.
// ============================================

import { z } from 'zod';

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .toLowerCase()
    .trim(),
});

/**
 * Reset password schema
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ============================================
// AUTH SCHEMAS
// ============================================

/**
 * Signup validation schema
 * Validates email format and password requirements
 */
export const signupSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long')
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      'Password must contain at least one special character'
    ),

  firstName: z
    .string()
    .max(50, 'First name is too long')
    .optional()
    .transform((val) => val?.trim()),

  lastName: z
    .string()
    .max(50, 'Last name is too long')
    .optional()
    .transform((val) => val?.trim()),
});

/**
 * Login validation schema
 * Less strict than signup - just ensures required fields exist
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .toLowerCase()
    .trim(),

  password: z.string().min(1, 'Password is required'),
});

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Change password schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ============================================
// JOURNAL SCHEMAS
// ============================================

export const emotionEnum = z.enum([
  'HAPPY',
  'SAD',
  'ANXIOUS',
  'CALM',
  'ANGRY',
  'GRATEFUL',
  'HOPEFUL',
  'CONFUSED',
  'EXCITED',
  'NEUTRAL',
]);

/**
 * Valid reflection modes enum
 */
export const reflectionModeEnum = z.enum([
  'QUICK',
  'GUIDED',
  'DEEP',
  'CHAT',
]);

/**
 * Create journal entry schema
 */
export const createJournalSchema = z.object({
  title: z
    .string()
    .max(255, 'Title must be less than 255 characters')
    .optional()
    .transform((val) => val?.trim()),

  content: z
    .string()
    .min(1, 'Content is required')
    .max(50000, 'Content must be less than 50,000 characters')
    .transform((val) => val.trim()),

  imageUrl: z
    .string()
    .url('Invalid image URL format')
    .optional()
    .nullable(),

  musicTitle: z.string().max(255).optional().nullable(),
  musicArtist: z.string().max(255).optional().nullable(),
  musicThumbnail: z.string().optional().nullable(),
  musicVideoId: z.string().max(100).optional().nullable(),
  musicUrl: z.string().optional().nullable(),
  musicPlatform: z.string().max(50).optional().nullable().default('YOUTUBE'),

  emotion: emotionEnum.optional(),

  intensity: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional(),

  aiResponse: z.string().optional(),

  mode: reflectionModeEnum.optional(),

  tags: z.array(z.string()).optional().default([]),
});

/**
 * Update journal entry schema
 * Same as create but all fields optional
 */
export const updateJournalSchema = z.object({
  title: z
    .string()
    .max(255, 'Title must be less than 255 characters')
    .optional()
    .nullable()
    .transform((val) => val?.trim()),

  content: z
    .string()
    .min(1, 'Content cannot be empty')
    .max(50000, 'Content must be less than 50,000 characters')
    .optional()
    .transform((val) => val?.trim()),

  imageUrl: z
    .string()
    .url('Invalid image URL format')
    .optional()
    .nullable(),

  musicTitle: z.string().max(255).optional().nullable(),
  musicArtist: z.string().max(255).optional().nullable(),
  musicThumbnail: z.string().optional().nullable(),
  musicVideoId: z.string().max(100).optional().nullable(),
  musicUrl: z.string().optional().nullable(),
  musicPlatform: z.string().max(50).optional().nullable(),

  isPinned: z.boolean().optional(),

  emotion: emotionEnum.optional().nullable(),

  intensity: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .nullable(),

  aiResponse: z.string().optional().nullable(),

  mode: reflectionModeEnum.optional(),

  tags: z.array(z.string()).optional(),
});

/**
 * Attach music to journal entry schema
 */
export const attachMusicSchema = z.object({
  musicTitle: z.string().min(1, 'Title is required').max(255),
  musicArtist: z.string().min(1, 'Artist is required').max(255),
  musicThumbnail: z.string().optional().nullable(),
  musicVideoId: z.string().min(1, 'Video ID is required').max(100),
  musicUrl: z.string().url('Invalid URL format'),
  musicPlatform: z.string().max(50).default('YOUTUBE'),
});

export type AttachMusicInput = z.infer<typeof attachMusicSchema>;

/**
 * Journal query parameters schema
 */
export const journalQuerySchema = z.object({
  search: z
    .string()
    .max(100, 'Search query too long')
    .optional()
    .transform((val) => val?.trim()),

  emotion: emotionEnum.optional(),

  sortBy: z.enum(['createdAt', 'updatedAt']).optional().default('createdAt'),

  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),

  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, 'Page must be positive'),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20))
    .refine((val) => val > 0, 'Limit must be positive'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateJournalInput = z.infer<typeof createJournalSchema>;
export type UpdateJournalInput = z.infer<typeof updateJournalSchema>;
export type JournalQueryInput = z.infer<typeof journalQuerySchema>;

// ============================================
// MOOD SCHEMAS
// ============================================

/**
 * Valid moods enum (must match Prisma Mood enum)
 */
export const moodEnum = z.enum([
  'HAPPY',
  'SAD',
  'ANGRY',
  'CALM',
  'ANXIOUS',
  'EXCITED',
  'TIRED',
  'STRESSED',
  'GRATEFUL',
  'NEUTRAL',
]);

/**
 * Create mood entry schema
 */
export const createMoodSchema = z.object({
  mood: moodEnum,

  intensity: z
    .number()
    .int('Intensity must be a whole number')
    .min(1, 'Intensity must be at least 1')
    .max(10, 'Intensity must be at most 10'),

  note: z
    .string()
    .max(500, 'Note must be less than 500 characters')
    .optional()
    .transform((val) => val?.trim()),
});

/**
 * Mood query parameters schema
 */
export const moodQuerySchema = z.object({
  range: z.enum(['week', 'month', 'all']).optional().default('week'),

  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, 'Page must be positive'),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 50))
    .refine((val) => val > 0, 'Limit must be positive'),
});

export type CreateMoodInput = z.infer<typeof createMoodSchema>;
export type MoodQueryInput = z.infer<typeof moodQuerySchema>;

// ============================================
// AI SCHEMAS
// ============================================

/**
 * AI support message schema
 */
export const aiSupportSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(500, 'Message must be 500 characters or less')
    .transform((val) => val.trim()),
});

export type AISupportInput = z.infer<typeof aiSupportSchema>;
