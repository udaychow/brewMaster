import { Request, Response, NextFunction } from 'express';
import { 
  ProductionServiceError, 
  ValidationError, 
  NotFoundError, 
  ConflictError,
  ApiResponse 
} from '../types';

// Custom error types for different scenarios
export class DatabaseError extends ProductionServiceError {
  constructor(message: string, originalError?: Error) {
    super(message, 'DATABASE_ERROR', 500);
    this.name = 'DatabaseError';
    
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

export class AuthenticationError extends ProductionServiceError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ProductionServiceError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends ProductionServiceError {
  constructor(message: string = 'Too many requests') {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends ProductionServiceError {
  constructor(service: string, message: string) {
    super(`${service} service error: ${message}`, 'EXTERNAL_SERVICE_ERROR', 503);
    this.name = 'ExternalServiceError';
  }
}

// Error response formatter
const formatErrorResponse = (error: Error, req: Request): ApiResponse<null> => {
  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  };

  if (error instanceof ProductionServiceError) {
    response.error = error.code;
    response.message = error.message;
  } else if (error.name === 'PrismaClientValidationError') {
    response.error = 'VALIDATION_ERROR';
    response.message = 'Invalid data provided';
  } else if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        response.error = 'DUPLICATE_ERROR';
        response.message = 'A record with this value already exists';
        break;
      case 'P2025':
        response.error = 'NOT_FOUND';
        response.message = 'Record not found';
        break;
      case 'P2003':
        response.error = 'FOREIGN_KEY_ERROR';
        response.message = 'Referenced record does not exist';
        break;
      default:
        response.error = 'DATABASE_ERROR';
        response.message = 'Database operation failed';
    }
  } else if (error.name === 'ValidationError' && error.message.includes('Cast to ObjectId')) {
    response.error = 'INVALID_ID';
    response.message = 'Invalid ID format provided';
  }

  return response;
};

// Main error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error details (in production, use proper logging service)
  console.error('Error occurred:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    requestId: req.headers['x-request-id'],
    userId: (req as any).user?.id
  });

  const errorResponse = formatErrorResponse(error, req);
  let statusCode = 500;

  // Determine status code
  if (error instanceof ProductionServiceError) {
    statusCode = error.statusCode;
  } else if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409; // Conflict
        break;
      case 'P2025':
        statusCode = 404; // Not Found
        break;
      case 'P2003':
        statusCode = 400; // Bad Request
        break;
      default:
        statusCode = 500; // Internal Server Error
    }
  } else if (error.name === 'PrismaClientValidationError') {
    statusCode = 400; // Bad Request
  }

  // Add additional error context in development
  if (process.env.NODE_ENV === 'development') {
    (errorResponse as any).stack = error.stack;
    (errorResponse as any).details = error;
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError('Route', req.originalUrl);
  next(error);
};

// Request timeout handler
export const timeoutHandler = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      const error = new ProductionServiceError(
        'Request timeout',
        'REQUEST_TIMEOUT',
        408
      );
      next(error);
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

// Database connection error handler
export const handleDatabaseError = (error: any): DatabaseError => {
  if (error.code === 'ECONNREFUSED') {
    return new DatabaseError('Database connection refused. Please check database status.');
  }
  
  if (error.code === 'ETIMEDOUT') {
    return new DatabaseError('Database connection timed out.');
  }

  if (error.name === 'PrismaClientInitializationError') {
    return new DatabaseError('Database initialization failed. Check connection string.');
  }

  return new DatabaseError('Database operation failed', error);
};

// Validation error helper
export const createValidationError = (field: string, message: string): ValidationError => {
  const error = new ValidationError(`Validation failed for field '${field}': ${message}`, field);
  return error;
};

// Business logic error helpers
export const createBusinessLogicError = {
  batchAlreadyStarted: (batchId: string) => 
    new ConflictError(`Batch ${batchId} has already been started and cannot be modified`),
  
  invalidStatusTransition: (from: string, to: string) =>
    new ConflictError(`Invalid status transition from ${from} to ${to}`),
  
  insufficientInventory: (ingredient: string) =>
    new ConflictError(`Insufficient inventory for ingredient: ${ingredient}`),
  
  recipeInUse: (recipeId: string) =>
    new ConflictError(`Recipe ${recipeId} is currently in use and cannot be deleted`),
  
  batchNotFound: (batchNumber: string) =>
    new NotFoundError('Batch', batchNumber),
  
  recipeNotFound: (recipeName: string) =>
    new NotFoundError('Recipe', recipeName),
  
  userNotFound: (userId: string) =>
    new NotFoundError('User', userId),
  
  duplicateRecipeName: (name: string) =>
    new ConflictError(`Recipe with name '${name}' already exists`),
  
  invalidFermentationData: (reason: string) =>
    new ValidationError(`Invalid fermentation data: ${reason}`),
  
  qualityCheckFailed: (checkType: string, reason: string) =>
    new ConflictError(`Quality check '${checkType}' failed: ${reason}`),
  
  schedulingConflict: (date: string, reason: string) =>
    new ConflictError(`Scheduling conflict on ${date}: ${reason}`)
};

// Error logging utility
export const logError = (error: Error, context?: any) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context
  };

  // In production, send to logging service (e.g., Winston, Sentry, etc.)
  console.error('Production Service Error:', errorLog);

  // Could integrate with external logging services here
  // Example: Sentry.captureException(error, { extra: context });
};

// Health check error handler
export const healthCheckError = (service: string, error: any): ExternalServiceError => {
  return new ExternalServiceError(service, `Health check failed: ${error.message}`);
};

// Rate limiting error handler
export const handleRateLimitError = (req: Request): RateLimitError => {
  const clientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  return new RateLimitError(`Rate limit exceeded for client ${clientId}`);
};

// Error recovery utilities
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw new DatabaseError(
          `Operation failed after ${maxRetries} attempts: ${lastError.message}`,
          lastError
        );
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
};

// Circuit breaker pattern for external services
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: number;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - (this.lastFailureTime || 0) > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new ExternalServiceError('CircuitBreaker', 'Service temporarily unavailable');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

export const circuitBreaker = new CircuitBreaker();