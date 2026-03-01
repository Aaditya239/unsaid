// ============================================
// Error Handling Middleware
// ============================================
// Global error handler that catches all errors and
// sends appropriate responses based on error type.
// ============================================

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { ZodError } from 'zod';

/**
 * Format Zod validation errors into readable messages
 */
const formatZodError = (error: ZodError): string => {
  return error.errors
    .map((err) => `${err.path.join('.')}: ${err.message}`)
    .join(', ');
};

/**
 * Send error response in development (with stack trace)
 */
const sendErrorDev = (err: AppError, res: Response): void => {
  if (err.statusCode === 401) {
    res.status(401).json({
      success: false,
      status: err.status,
      message: err.message,
      error: err.message,
      // Still include debug info in dev, but main key is 'error'
      stack: err.stack,
      details: err
    });
    return;
  }
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

/**
 * Send error response in production (minimal info)
 */
const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    if (err.statusCode === 401) {
      res.status(401).json({
        success: false,
        status: err.status,
        message: err.message,
        error: err.message,
      });
      return;
    }
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or unknown error: don't leak details
    console.error('ERROR 💥:', err);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default values
  let error: AppError;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    error = new AppError(formatZodError(err), 400);
  }
  // Handle Prisma errors
  else if (err.name === 'PrismaClientKnownRequestError') {
    // @ts-expect-error - Prisma error has code property
    const code = err.code;

    if (code === 'P2002') {
      error = new AppError('A record with this value already exists', 409);
    } else if (code === 'P2025') {
      error = new AppError('Record not found', 404);
    } else {
      error = new AppError('Database error', 500);
    }
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  } else if (err.name === 'TokenExpiredError') {
    error = new AppError('Token has expired', 401);
  }
  // Handle existing AppError
  else if (err instanceof AppError) {
    error = err;
  }
  // Handle unknown errors
  else {
    error = new AppError(err.message || 'Internal server error', 500);
    error.isOperational = false;
  }

  // Send appropriate response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};
