// ============================================
// Validation Middleware
// ============================================
// Generic middleware factory for Zod schema validation.
// Use this to validate request body, params, or query.
// ============================================

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Create validation middleware for a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @param source - Request property to validate ('body', 'params', 'query')
 */
export const validate = (
  schema: ZodSchema,
  source: 'body' | 'params' | 'query' = 'body'
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Parse and validate the request data
      const validated = schema.parse(req[source]);
      
      // Replace original data with validated+transformed data
      req[source] = validated;
      
      next();
    } catch (error) {
      next(error); // Pass to error handler
    }
  };
};
