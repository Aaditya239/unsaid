// ============================================
// Authentication Middleware
// ============================================
// This middleware verifies JWT tokens and protects routes.
// It extracts tokens from either cookies or Authorization header.
// ============================================

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, DecodedToken } from '../utils/jwt.utils';
import { UnauthorizedError } from '../utils/appError';
import prisma from '../utils/prisma';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * Extract token from request
 * Priority: Cookie > Authorization header
 */
const extractToken = (req: Request): string | null => {
  // 1. Check httpOnly cookie (most secure)
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  // 2. Check Authorization header (for mobile/API clients)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

/**
 * Authentication middleware
 * Verifies JWT and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token
    const token = extractToken(req);

    if (!token) {
      throw UnauthorizedError('Access token is required');
    }

    // 2. Verify token
    let decoded: DecodedToken;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      // Handle specific JWT errors
      if ((error as Error).name === 'TokenExpiredError') {
        throw UnauthorizedError('Access token has expired');
      }
      if ((error as Error).name === 'JsonWebTokenError') {
        throw UnauthorizedError('Invalid access token');
      }
      throw error;
    }

    // 3. Check if it's an access token (not refresh)
    if (decoded.type !== 'access') {
      throw UnauthorizedError('Invalid token type');
    }

    // 4. Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, isActive: true },
    });

    if (!user) {
      throw UnauthorizedError('User no longer exists');
    }

    if (!user.isActive) {
      throw UnauthorizedError('User account is deactivated');
    }

    // 5. Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    const message = (error as Error)?.message || 'Unauthorized';
    res.status(401).json({ success: false, message });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token exists, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      try {
        const decoded = verifyAccessToken(token);

        if (decoded.type === 'access') {
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, isActive: true },
          });

          if (user && user.isActive) {
            req.user = {
              id: user.id,
              email: user.email,
            };
          }
        }
      } catch {
        // Token invalid, continue without user
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
