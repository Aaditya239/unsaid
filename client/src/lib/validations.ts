// ============================================
// Form Validation Schemas (Client-side)
// ============================================

import { z } from 'zod';

/**
 * Signup form validation
 */
export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must contain at least one special character'),
  
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  
  firstName: z.string().optional(),
  
  lastName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type SignupFormData = z.infer<typeof signupSchema>;

/**
 * Login form validation
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * PIN validation
 */
export const pinSchema = z
  .string()
  .length(4, 'PIN must be 4 digits')
  .regex(/^\d+$/, 'PIN must contain only numbers');

export type PinFormData = z.infer<typeof pinSchema>;

/**
 * Journal entry validation
 */
export const journalEntrySchema = z.object({
  title: z
    .string()
    .max(255, 'Title must be less than 255 characters')
    .optional(),
  
  content: z
    .string()
    .min(1, 'Content is required')
    .max(50000, 'Content must be less than 50,000 characters'),
  
  emotion: z.enum([
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
  ]).optional(),
});

export type JournalEntryFormData = z.infer<typeof journalEntrySchema>;
