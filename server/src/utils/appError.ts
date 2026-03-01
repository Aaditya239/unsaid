// ============================================
// Custom Application Error Class
// ============================================
// This class extends the built-in Error class to include
// HTTP status codes and operational error flags.
// Operational errors are expected errors (wrong input, etc.)
// Programming errors are bugs that need to be fixed.
// ============================================

export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Operational errors are expected

    // Capture stack trace (excluding constructor call)
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factory functions
export const BadRequestError = (message: string) => new AppError(message, 400);
export const UnauthorizedError = (message: string = 'Not authorized') => new AppError(message, 401);
export const ForbiddenError = (message: string = 'Access forbidden') => new AppError(message, 403);
export const NotFoundError = (message: string) => new AppError(message, 404);
export const ConflictError = (message: string) => new AppError(message, 409);
export const InternalError = (message: string = 'Internal server error') => new AppError(message, 500);
