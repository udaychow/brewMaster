import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AgentType, TaskPriority } from '@brewmaster/shared-types';
import logger from '../utils/logger';

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationMiddleware {
  // Schema for task execution request
  static executeTaskSchema = Joi.object({
    agentType: Joi.string().valid(...Object.values(AgentType)).required(),
    taskType: Joi.string().required(),
    input: Joi.object().required(),
    priority: Joi.string().valid(...Object.values(TaskPriority)).default(TaskPriority.MEDIUM),
    userId: Joi.string().optional(),
    sessionId: Joi.string().optional()
  });

  // Schema for scheduled task request
  static scheduleTaskSchema = Joi.object({
    agentType: Joi.string().valid(...Object.values(AgentType)).required(),
    taskType: Joi.string().required(),
    input: Joi.object().required(),
    delay: Joi.number().min(0).required(),
    priority: Joi.string().valid(...Object.values(TaskPriority)).default(TaskPriority.MEDIUM)
  });

  // Schema for task query parameters
  static taskQuerySchema = Joi.object({
    agentType: Joi.string().valid(...Object.values(AgentType)).optional(),
    status: Joi.string().valid('PENDING', 'ASSIGNED', 'PROCESSING', 'COMPLETED', 'FAILED').optional(),
    userId: Joi.string().optional(),
    sessionId: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    limit: Joi.number().min(1).max(1000).default(50),
    offset: Joi.number().min(0).default(0)
  });

  // Schema for agent control requests
  static agentControlSchema = Joi.object({
    agentType: Joi.string().valid(...Object.values(AgentType)).required()
  });

  // Schema for task retry request
  static taskRetrySchema = Joi.object({
    taskId: Joi.string().required(),
    agentType: Joi.string().valid(...Object.values(AgentType)).required()
  });

  // Generic validation middleware factory
  static validate(schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') {
    return (req: Request, res: Response, next: NextFunction) => {
      const dataToValidate = req[source];
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const validationErrors: ValidationError[] = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        logger.warn('Validation failed', {
          source,
          errors: validationErrors,
          originalData: dataToValidate
        });

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationErrors
        });
      }

      // Replace the original data with validated and sanitized data
      req[source] = value;
      next();
    };
  }

  // Specific validation middlewares
  static validateExecuteTask = ValidationMiddleware.validate(ValidationMiddleware.executeTaskSchema, 'body');
  static validateScheduleTask = ValidationMiddleware.validate(ValidationMiddleware.scheduleTaskSchema, 'body');
  static validateTaskQuery = ValidationMiddleware.validate(ValidationMiddleware.taskQuerySchema, 'query');
  static validateAgentControl = ValidationMiddleware.validate(ValidationMiddleware.agentControlSchema, 'body');
  static validateTaskRetry = ValidationMiddleware.validate(ValidationMiddleware.taskRetrySchema, 'body');

  // Task ID parameter validation
  static validateTaskId = (req: Request, res: Response, next: NextFunction) => {
    const { taskId } = req.params;
    
    if (!taskId || typeof taskId !== 'string' || taskId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid taskId parameter is required'
      });
    }

    next();
  };

  // Agent type parameter validation
  static validateAgentTypeParam = (req: Request, res: Response, next: NextFunction) => {
    const { agentType } = req.params;
    
    if (agentType && !Object.values(AgentType).includes(agentType as AgentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agentType: ${agentType}. Must be one of: ${Object.values(AgentType).join(', ')}`
      });
    }

    next();
  };

  // Content type validation
  static validateContentType = (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      if (!req.is('application/json')) {
        return res.status(415).json({
          success: false,
          error: 'Content-Type must be application/json'
        });
      }
    }

    next();
  };

  // Request size validation
  static validateRequestSize = (maxSize: number = 1024 * 1024) => { // 1MB default
    return (req: Request, res: Response, next: NextFunction) => {
      const contentLength = req.headers['content-length'];
      
      if (contentLength && parseInt(contentLength) > maxSize) {
        return res.status(413).json({
          success: false,
          error: `Request too large. Maximum size: ${maxSize} bytes`
        });
      }

      next();
    };
  };
}