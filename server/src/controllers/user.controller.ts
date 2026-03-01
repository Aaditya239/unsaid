// ============================================
// User Controller
// ============================================
// Handles user profile operations (protected routes)
// ============================================

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/password.utils';
import { UnauthorizedError, BadRequestError } from '../utils/appError';
import { ChangePasswordInput } from '../utils/validation';

// ============================================
// GET USER PROFILE
// ============================================

/**
 * Get authenticated user's profile
 * GET /api/users/profile
 */
export const getProfile = async (
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
        updatedAt: true,
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
// UPDATE USER PROFILE
// ============================================

/**
 * Update user profile
 * PATCH /api/users/profile
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw UnauthorizedError('Authentication required');
    }

    const { firstName, lastName } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CHANGE PASSWORD
// ============================================

/**
 * Change user password
 * POST /api/users/change-password
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw UnauthorizedError('Authentication required');
    }

    const { currentPassword, newPassword } = req.body as ChangePasswordInput;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw UnauthorizedError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw BadRequestError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    // Optionally: Revoke all refresh tokens to force re-login on other devices
    await prisma.refreshToken.updateMany({
      where: { userId: req.user.id },
      data: { isRevoked: true },
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET ACTIVE SESSIONS
// ============================================

/**
 * Get all active sessions for user
 * GET /api/users/sessions
 */
export const getSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw UnauthorizedError('Authentication required');
    }

    const sessions = await prisma.refreshToken.findMany({
      where: {
        userId: req.user.id,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REVOKE SESSION
// ============================================

/**
 * Revoke a specific session
 * DELETE /api/users/sessions/:sessionId
 */
export const revokeSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw UnauthorizedError('Authentication required');
    }

    const { sessionId } = req.params;

    // Verify session belongs to user
    const session = await prisma.refreshToken.findFirst({
      where: {
        id: sessionId,
        userId: req.user.id,
      },
    });

    if (!session) {
      throw BadRequestError('Session not found');
    }

    // Revoke the session
    await prisma.refreshToken.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });

    res.status(200).json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    next(error);
  }
};
