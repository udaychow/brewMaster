import { Request, Response, NextFunction } from 'express';
import { AgentType, TaskPriority } from '@brewmaster/shared-types';
import { AgentOrchestrator } from '../orchestrator/agent-orchestrator';
import { ErrorMiddleware } from '../middleware/error.middleware';
import logger from '../utils/logger';

export class AgentController {
  constructor(private orchestrator: AgentOrchestrator) {}

  // Execute a task with an agent
  executeTask = ErrorMiddleware.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { agentType, taskType, input, priority, userId, sessionId } = req.body;

    try {
      const taskId = await this.orchestrator.executeTask(
        agentType as AgentType,
        taskType,
        input,
        priority as TaskPriority,
        userId,
        sessionId
      );

      logger.info('Task execution initiated', {
        taskId,
        agentType,
        taskType,
        userId,
        sessionId
      });

      res.status(202).json({
        success: true,
        data: {
          taskId,
          status: 'queued',
          message: 'Task has been queued for execution'
        }
      });
    } catch (error) {
      next(ErrorMiddleware.handleAgentError(error, agentType));
    }
  });

  // Schedule a task for future execution
  scheduleTask = ErrorMiddleware.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { agentType, taskType, input, delay, priority } = req.body;

    try {
      const taskId = await this.orchestrator.scheduleTask(
        agentType as AgentType,
        taskType,
        input,
        delay,
        priority as TaskPriority
      );

      const scheduledFor = new Date(Date.now() + delay);

      logger.info('Task scheduled', {
        taskId,
        agentType,
        taskType,
        delay,
        scheduledFor: scheduledFor.toISOString()
      });

      res.status(202).json({
        success: true,
        data: {
          taskId,
          status: 'scheduled',
          scheduledFor: scheduledFor.toISOString(),
          message: 'Task has been scheduled for execution'
        }
      });
    } catch (error) {
      next(ErrorMiddleware.handleAgentError(error, agentType));
    }
  });

  // Get task status
  getTaskStatus = ErrorMiddleware.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { taskId } = req.params;

    try {
      const task = await this.orchestrator.getTaskStatus(taskId);

      if (!task) {
        throw ErrorMiddleware.createNotFoundError('Task', taskId);
      }

      logger.debug('Task status retrieved', { taskId, status: task.status });

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      if (error.statusCode) {
        next(error);
      } else {
        next(ErrorMiddleware.handleDatabaseError(error));
      }
    }
  });

  // Get task history
  getTaskHistory = ErrorMiddleware.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const queryParams = req.query as any;

    try {
      const tasks = await this.orchestrator.getTaskHistory(
        queryParams.agentType,
        queryParams.limit,
        queryParams.offset
      );

      logger.debug('Task history retrieved', {
        agentType: queryParams.agentType,
        count: tasks.length,
        limit: queryParams.limit,
        offset: queryParams.offset
      });

      res.json({
        success: true,
        data: {
          tasks,
          pagination: {
            limit: queryParams.limit,
            offset: queryParams.offset,
            hasMore: tasks.length === queryParams.limit
          }
        }
      });
    } catch (error) {
      next(ErrorMiddleware.handleDatabaseError(error));
    }
  });

  // Get agent status
  getAgentStatus = ErrorMiddleware.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { agentType } = req.params;

    try {
      const agentStatus = await this.orchestrator.getAgentStatus(
        agentType as AgentType
      );

      logger.debug('Agent status retrieved', { agentType });

      res.json({
        success: true,
        data: agentStatus
      });
    } catch (error) {
      next(ErrorMiddleware.handleAgentError(error, agentType));
    }
  });

  // Get all agents status
  getAllAgentsStatus = ErrorMiddleware.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agentsStatus = await this.orchestrator.getAgentStatus();

      logger.debug('All agents status retrieved');

      res.json({
        success: true,
        data: agentsStatus
      });
    } catch (error) {
      next(ErrorMiddleware.handleAgentError(error));
    }
  });

  // Get agent metrics
  getAgentMetrics = ErrorMiddleware.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { agentType } = req.params;

    try {
      const metrics = await this.orchestrator.getAgentMetrics(
        agentType as AgentType
      );

      logger.debug('Agent metrics retrieved', { agentType });

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(ErrorMiddleware.handleAgentError(error, agentType));
    }
  });

  // Get all agents metrics
  getAllAgentsMetrics = ErrorMiddleware.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const metrics = await this.orchestrator.getAgentMetrics();

      logger.debug('All agents metrics retrieved');

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(ErrorMiddleware.handleAgentError(error));
    }
  });

  // Pause an agent
  pauseAgent = ErrorMiddleware.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { agentType } = req.body;

    try {
      await this.orchestrator.pauseAgent(agentType as AgentType);

      logger.info('Agent paused', { agentType });

      res.json({
        success: true,
        data: {
          agentType,
          status: 'paused',
          message: 'Agent has been paused'
        }
      });
    } catch (error) {
      next(ErrorMiddleware.handleAgentError(error, agentType));
    }
  });

  // Resume an agent
  resumeAgent = ErrorMiddleware.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { agentType } = req.body;

    try {
      await this.orchestrator.resumeAgent(agentType as AgentType);

      logger.info('Agent resumed', { agentType });

      res.json({
        success: true,
        data: {
          agentType,
          status: 'active',
          message: 'Agent has been resumed'
        }
      });
    } catch (error) {
      next(ErrorMiddleware.handleAgentError(error, agentType));
    }
  });

  // Retry a failed task
  retryTask = ErrorMiddleware.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { taskId, agentType } = req.body;

    try {
      await this.orchestrator.retryTask(taskId, agentType as AgentType);

      logger.info('Task retry initiated', { taskId, agentType });

      res.json({
        success: true,
        data: {
          taskId,
          status: 'retrying',
          message: 'Task has been queued for retry'
        }
      });
    } catch (error) {
      next(ErrorMiddleware.handleAgentError(error, agentType));
    }
  });

  // Get orchestrator statistics
  getOrchestratorStats = ErrorMiddleware.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.orchestrator.getOrchestratorStats();

      logger.debug('Orchestrator stats retrieved');

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(ErrorMiddleware.handleInternalError('Failed to retrieve orchestrator statistics'));
    }
  });

  // Health check endpoint
  healthCheck = ErrorMiddleware.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.orchestrator.getOrchestratorStats();
      const isHealthy = stats.systemHealth.overall === 'healthy';
      const statusCode = isHealthy ? 200 : 503;

      logger.debug('Health check performed', { 
        healthy: isHealthy, 
        overall: stats.systemHealth.overall 
      });

      res.status(statusCode).json({
        success: isHealthy,
        data: {
          status: stats.systemHealth.overall,
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0',
          uptime: process.uptime(),
          systemHealth: stats.systemHealth
        }
      });
    } catch (error) {
      next(ErrorMiddleware.handleHealthCheckError('agent-orchestrator')(error));
    }
  });

  // Get system information
  getSystemInfo = ErrorMiddleware.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.orchestrator.getOrchestratorStats();

      res.json({
        success: true,
        data: {
          service: 'agent-orchestrator',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          system: {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version
          },
          agents: Object.keys(stats.agents),
          health: stats.systemHealth
        }
      });
    } catch (error) {
      next(ErrorMiddleware.handleInternalError('Failed to retrieve system information'));
    }
  });
}