// ============================================
// Authentication Controller
// ============================================
// Handles all authentication-related operations:
// - User registration (signup)
// - User login
// - Token refresh
// - User logout
// ============================================

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/password.utils';
import {
  generateTokens,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  getRefreshTokenExpiry,
} from '../utils/jwt.utils';
import { AppError, ConflictError, UnauthorizedError } from '../utils/appError';
import { SignupInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from '../utils/validation';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../utils/email.utils';

// Maximum failed login attempts before lockout
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// ============================================
// SIGNUP CONTROLLER
// ============================================

/**
 * Register a new user
 * POST /api/auth/signup
 * 
 * Flow:
 * 1. Check if email already exists
 * 2. Hash password using bcrypt
 * 3. Create user in database
 * 4. Generate JWT tokens
 * 5. Set httpOnly cookies
 * 6. Return user data (without password)
 */
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body as SignupInput;

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw ConflictError('Email is already registered');
    }

    // 2. Hash the password
    // bcrypt automatically generates a salt and includes it in the hash
    const hashedPassword = await hashPassword(password);

    // 3. Create the user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    // 4. Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    // 5. Store refresh token in database (allows revocation)
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
        deviceInfo: req.headers['user-agent'],
        ipAddress: req.ip,
      },
    });

    // 6. Set httpOnly cookies
    setAuthCookies(res, accessToken, refreshToken);

    // 7. Send response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        accessToken, // Also send in body for mobile/API clients
        refreshToken, // Needed for cross-origin (cookies may not work)
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// LOGIN CONTROLLER
// ============================================

/**
 * Authenticate user and create session
 * POST /api/auth/login
 * 
 * Flow:
 * 1. Find user by email
 * 2. Check if account is locked
 * 3. Verify password using bcrypt
 * 4. Handle failed attempts / reset counter
 * 5. Generate tokens
 * 6. Set cookies and respond
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body as LoginInput;

    // 1. Find user by email (include password for comparison)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Security: Don't reveal if email exists or not
    if (!user) {
      throw UnauthorizedError('Invalid email or password');
    }

    // 2. Check if account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / 60000
      );
      throw new AppError(
        `Account is locked. Try again in ${remainingMinutes} minutes.`,
        423
      );
    }

    // 3. Check if account is active
    if (!user.isActive) {
      throw UnauthorizedError('Account has been deactivated');
    }

    // 4. Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      // Increment failed attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const updateData: {
        failedLoginAttempts: number;
        lockoutUntil?: Date;
      } = { failedLoginAttempts: failedAttempts };

      // Lock account if max attempts reached
      if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutUntil = new Date();
        lockoutUntil.setMinutes(lockoutUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
        updateData.lockoutUntil = lockoutUntil;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw UnauthorizedError('Invalid email or password');
    }

    // 5. Reset failed attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // 6. Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    // 7. Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
        deviceInfo: req.headers['user-agent'],
        ipAddress: req.ip,
      },
    });

    // 8. Set cookies
    setAuthCookies(res, accessToken, refreshToken);

    // 9. Send response (exclude password)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        accessToken,
        refreshToken, // Needed for cross-origin (cookies may not work)
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REFRESH TOKEN CONTROLLER
// ============================================

/**
 * Refresh access token using refresh token
 * POST /api/auth/refresh
 * 
 * Implements token rotation for security:
 * - Old refresh token is invalidated
 * - New refresh token is issued
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Get refresh token from cookie or body
    const token = req.cookies?.refreshToken || req.body.refreshToken;

    if (!token) {
      throw UnauthorizedError('Refresh token is required');
    }

    // 2. Verify the refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw UnauthorizedError('Invalid or expired refresh token');
    }

    // 3. Check if token exists in database and is not revoked
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked) {
      // Possible token reuse attack - revoke all user tokens
      if (decoded.userId) {
        await prisma.refreshToken.updateMany({
          where: { userId: decoded.userId },
          data: { isRevoked: true },
        });
      }
      throw UnauthorizedError('Invalid refresh token');
    }

    // 4. Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      throw UnauthorizedError('Refresh token has expired');
    }

    // 5. Check if user is still active
    if (!storedToken.user.isActive) {
      throw UnauthorizedError('User account is deactivated');
    }

    // 6. Revoke old refresh token (token rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // 7. Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      generateTokens(storedToken.user.id, storedToken.user.email);

    // 8. Store new refresh token
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.user.id,
        expiresAt: getRefreshTokenExpiry(),
        deviceInfo: req.headers['user-agent'],
        ipAddress: req.ip,
      },
    });

    // 9. Set new cookies
    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken, // Needed for cross-origin
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// LOGOUT CONTROLLER
// ============================================

/**
 * Logout user and invalidate tokens
 * POST /api/auth/logout
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get refresh token to revoke
    const token = req.cookies?.refreshToken;

    if (token) {
      // Revoke the refresh token
      await prisma.refreshToken.updateMany({
        where: { token },
        data: { isRevoked: true },
      });
    }

    // Clear cookies
    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// LOGOUT ALL SESSIONS
// ============================================

/**
 * Logout from all devices
 * POST /api/auth/logout-all
 * Requires authentication
 */
export const logoutAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw UnauthorizedError('Authentication required');
    }

    // Revoke all refresh tokens for user
    await prisma.refreshToken.updateMany({
      where: { userId: req.user.id },
      data: { isRevoked: true },
    });

    // Clear cookies
    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET CURRENT USER
// ============================================

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw UnauthorizedError('Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isEmailVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw UnauthorizedError('User not found');
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
// ============================================
// FORGOT PASSWORD CONTROLLER
// ============================================

/**
 * Request password reset link
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body as ForgotPasswordInput;

    // 1. Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 2. Security: Never reveal if email exists
    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, we have sent a reset link.',
      });
      return;
    }

    // 3. Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 4. Hash the token for storage
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // 5. Save to database with 15-minute expiry
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // 6. Send email
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);

      res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email.',
      });
    } catch (error) {
      // If email fails, clear the reset fields
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });
      throw new AppError('There was an error sending the email. Try again later.', 500);
    }
  } catch (error) {
    next(error);
  }
};

// ============================================
// RESET PASSWORD CONTROLLER
// ============================================

/**
 * Reset password using token
 * POST /api/auth/reset-password
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, newPassword } = req.body as ResetPasswordInput;

    // 1. Hash the received token to compare with DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // 2. Find user with valid token and expiry
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new AppError('Token is invalid or has expired', 400);
    }

    // 3. Update password and clear reset fields
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        // Reset failed login attempts on password change
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    // 4. Revoke all refresh tokens (one-time use requirement & security)
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    });

    // 5. Clear cookies
    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};
