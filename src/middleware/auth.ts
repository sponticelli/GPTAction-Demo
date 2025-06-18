import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

/**
 * API Key Authentication Middleware
 * Validates the X-API-Key header against the configured API key
 */
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedApiKey = process.env.API_KEY;

  // Skip authentication in development if no API key is configured
  if (!expectedApiKey && process.env.NODE_ENV === 'development') {
    next();
    return;
  }

  if (!apiKey) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Unauthorized',
      message: 'API key is required. Please provide X-API-Key header.',
    };
    res.status(401).json(response);
    return;
  }

  if (apiKey !== expectedApiKey) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Unauthorized',
      message: 'Invalid API key.',
    };
    res.status(401).json(response);
    return;
  }

  // Add API key to request context for logging
  (req as any).apiKey = apiKey;
  next();
};

/**
 * Optional authentication middleware for development
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'production') {
    authenticateApiKey(req, res, next);
    return;
  }
  next();
};
