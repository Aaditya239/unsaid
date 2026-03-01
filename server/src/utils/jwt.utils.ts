// ============================================
// JWT Token Utilities
// ============================================
// This module handles all JWT operations:
// - Token generation (access & refresh)
// - Token verification
// - Cookie configuration
// ============================================

import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { randomUUID } from 'crypto';

// Token payload interface
export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  jti?: string;
}

// Decoded token interface
export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generate an access token (short-lived)
 * Used for API authentication
 */
export const generateAccessToken = (userId: string, email: string): string => {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId,
    email,
    type: 'access',
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Generate a refresh token (long-lived)
 * Used to obtain new access tokens
 */
export const generateRefreshToken = (userId: string, email: string): string => {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId,
    email,
    type: 'refresh',
    jti: randomUUID(),
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Generate both tokens at once
 */
export const generateTokens = (
  userId: string,
  email: string
): { accessToken: string; refreshToken: string } => {
  return {
    accessToken: generateAccessToken(userId, email),
    refreshToken: generateRefreshToken(userId, email),
  };
};

// ============================================
// TOKEN VERIFICATION
// ============================================

/**
 * Verify an access token
 */
export const verifyAccessToken = (token: string): DecodedToken => {
  return jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
};

/**
 * Verify a refresh token
 */
export const verifyRefreshToken = (token: string): DecodedToken => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as DecodedToken;
};

// ============================================
// COOKIE CONFIGURATION
// ============================================

// Cross-origin requires sameSite: 'none' (Vercel frontend ↔ Render backend)
const isProduction = process.env.NODE_ENV === 'production';
const sameSiteSetting: 'lax' | 'none' = isProduction ? 'none' : 'lax';

// Cookie options for access token (httpOnly for security)
export const accessTokenCookieOptions = {
  httpOnly: true, // Prevents XSS attacks - cannot be accessed by JavaScript
  secure: isProduction || process.env.COOKIE_SECURE === 'true',
  sameSite: sameSiteSetting,
  maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: '/',
};

// Cookie options for refresh token (longer expiry)
export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction || process.env.COOKIE_SECURE === 'true',
  sameSite: sameSiteSetting,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: '/',
};

/**
 * Set authentication cookies on response
 * Uses httpOnly cookies for security (immune to XSS)
 */
export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  res.cookie('accessToken', accessToken, accessTokenCookieOptions);
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
};

/**
 * Clear authentication cookies (for logout)
 */
export const clearAuthCookies = (res: Response): void => {
  res.cookie('accessToken', '', { ...accessTokenCookieOptions, maxAge: 0 });
  res.cookie('refreshToken', '', { ...refreshTokenCookieOptions, maxAge: 0 });
};

// ============================================
// TOKEN EXPIRY HELPERS
// ============================================

/**
 * Get refresh token expiry date
 */
export const getRefreshTokenExpiry = (): Date => {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const days = parseInt(expiresIn);
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
};
