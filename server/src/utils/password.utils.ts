// ============================================
// Password Utilities (bcrypt)
// ============================================
// This module handles password hashing and verification
// using bcrypt with secure configuration.
// ============================================

import bcrypt from 'bcrypt';

// Salt rounds determine the computational cost of hashing
// Higher = more secure but slower
// 12 is a good balance for production
const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * - Automatically generates a salt
 * - Salt is embedded in the hash output
 * 
 * @param password - Plain text password to hash
 * @returns Hashed password string
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain text password with a hashed password
 * Uses constant-time comparison to prevent timing attacks
 * 
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password from database
 * @returns true if passwords match, false otherwise
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// ============================================
// PASSWORD VALIDATION RULES
// ============================================

/**
 * Validate password strength
 * Returns array of validation errors (empty if valid)
 */
export const validatePasswordStrength = (password: string): string[] => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return errors;
};
