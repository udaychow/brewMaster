import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class ErrorMiddleware {
  // Global error handler
  static handleError = (
    err: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const code = err.code || 'INTERNAL_ERROR';

    // Log error details
    logger.error('API Error', {
      error: {
        message: err.message,
        stack: err.stack,
        statusCode,
        code
      },
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    // Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const errorResponse: any = {
      success: false,
      error: message,
      code,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    };

    // Include additional details in development
    if (isDevelopment) {
      errorResponse.details = err.details;
      errorResponse.stack = err.stack;
    }

    // Include request ID if present
    const requestId = req.headers['x-request-id'] || req.headers['request-id'];
    if (requestId) {
      errorResponse.requestId = requestId;
    }

    res.status(statusCode).json(errorResponse);
  };

  // 404 handler for undefined routes
  static handleNotFound = (req: Request, res: Response, next: NextFunction) => {
    const error: ApiError = new Error(`Route ${req.method} ${req.path} not found`);
    error.statusCode = 404;
    error.code = 'ROUTE_NOT_FOUND';
    next(error);
  };

  // Async error wrapper
  static asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  // Specific error creators
  static createValidationError = (message: string, details?: any): ApiError => {
    const error: ApiError = new Error(message);
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    error.details = details;
    return error;
  };

  static createNotFoundError = (resource: string, id?: string): ApiError => {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    const error: ApiError = new Error(message);
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    return error;
  };

  static createConflictError = (message: string, details?: any): ApiError => {
    const error: ApiError = new Error(message);
    error.statusCode = 409;
    error.code = 'CONFLICT';
    error.details = details;
    return error;
  };

  static createUnauthorizedError = (message: string = 'Unauthorized'): ApiError => {
    const error: ApiError = new Error(message);
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    return error;
  };

  static createForbiddenError = (message: string = 'Forbidden'): ApiError => {
    const error: ApiError = new Error(message);
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    return error;
  };

  static createRateLimitError = (message: string = 'Rate limit exceeded'): ApiError => {
    const error: ApiError = new Error(message);
    error.statusCode = 429;
    error.code = 'RATE_LIMIT_EXCEEDED';
    return error;
  };

  static createInternalError = (message: string = 'Internal server error', details?: any): ApiError => {
    const error: ApiError = new Error(message);
    error.statusCode = 500;
    error.code = 'INTERNAL_ERROR';
    error.details = details;
    return error;
  };

  static createServiceUnavailableError = (message: string = 'Service temporarily unavailable'): ApiError => {
    const error: ApiError = new Error(message);
    error.statusCode = 503;
    error.code = 'SERVICE_UNAVAILABLE';
    return error;
  };

  static createBadRequestError = (message: string, details?: any): ApiError => {
    const error: ApiError = new Error(message);
    error.statusCode = 400;
    error.code = 'BAD_REQUEST';
    error.details = details;
    return error;
  };

  // Request timeout handler
  static createTimeoutHandler = (timeoutMs: number = 30000) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          const error: ApiError = new Error(`Request timeout after ${timeoutMs}ms`);
          error.statusCode = 408;
          error.code = 'REQUEST_TIMEOUT';
          next(error);
        }
      }, timeoutMs);

      // Clear timeout when response finishes
      res.on('finish', () => clearTimeout(timeout));
      res.on('close', () => clearTimeout(timeout));

      next();
    };
  };

  // Health check error handler
  static handleHealthCheckError = (service: string) => {
    return (error: any): ApiError => {
      logger.error(`Health check failed for ${service}`, {
        service,
        error: error.message || error
      });

      const healthError: ApiError = new Error(`${service} health check failed`);
      healthError.statusCode = 503;
      healthError.code = 'HEALTH_CHECK_FAILED';
      healthError.details = { service, originalError: error.message };
      return healthError;
    };
  };

  // Database error handler
  static handleDatabaseError = (error: any): ApiError => {
    logger.error('Database error', { error });

    // Map common Prisma errors
    if (error.code === 'P2002') {
      return ErrorMiddleware.createConflictError('Unique constraint violation', {
        field: error.meta?.target
      });
    }

    if (error.code === 'P2025') {
      return ErrorMiddleware.createNotFoundError('Record', 'specified');
    }

    if (error.code === 'P2003') {
      return ErrorMiddleware.createValidationError('Foreign key constraint failed', {
        field: error.meta?.field_name
      });
    }

    // Generic database error
    return ErrorMiddleware.createInternalError('Database operation failed');
  };

  // Queue error handler
  static handleQueueError = (error: any): ApiError => {
    logger.error('Queue error', { error });

    if (error.message?.includes('connection')) {
      return ErrorMiddleware.createServiceUnavailableError('Task queue temporarily unavailable');
    }

    if (error.message?.includes('timeout')) {
      return ErrorMiddleware.createInternalError('Task queue timeout');
    }

    return ErrorMiddleware.createInternalError('Task queue operation failed');
  };

  // Agent error handler
  static handleAgentError = (error: any, agentType?: string): ApiError => {
    logger.error('Agent error', { error, agentType });

    if (error.message?.includes('not found')) {
      return ErrorMiddleware.createNotFoundError('Agent', agentType);
    }

    if (error.message?.includes('unavailable') || error.message?.includes('unhealthy')) {
      return ErrorMiddleware.createServiceUnavailableError(`Agent ${agentType} temporarily unavailable`);
    }

    if (error.message?.includes('timeout')) {
      return ErrorMiddleware.createInternalError(`Agent ${agentType} timeout`);
    }

    return ErrorMiddleware.createInternalError(`Agent ${agentType} operation failed`);
  };
}