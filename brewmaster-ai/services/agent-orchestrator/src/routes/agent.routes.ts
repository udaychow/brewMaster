import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AgentController } from '../controllers/agent.controller';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import { ErrorMiddleware } from '../middleware/error.middleware';
import { AgentOrchestrator } from '../orchestrator/agent-orchestrator';
import config from '../config';

// Create rate limiters
const generalLimiter = rateLimit({
  windowMs: config.rateLimits.general.windowMs,
  max: config.rateLimits.general.max,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const aiTaskLimiter = rateLimit({
  windowMs: config.rateLimits.ai.windowMs,
  max: config.rateLimits.ai.max,
  message: {
    success: false,
    error: 'Too many AI task requests, please slow down.',
    code: 'AI_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export function createAgentRoutes(orchestrator: AgentOrchestrator): Router {
  const router = Router();
  const agentController = new AgentController(orchestrator);

  // Apply general rate limiting to all routes
  router.use(generalLimiter);

  // Middleware for content type validation
  router.use(ValidationMiddleware.validateContentType);

  // Request size validation (1MB limit)
  router.use(ValidationMiddleware.validateRequestSize(1024 * 1024));

  // Health and system information routes (no AI rate limiting)
  router.get('/health', agentController.healthCheck);
  router.get('/info', agentController.getSystemInfo);
  router.get('/stats', agentController.getOrchestratorStats);

  // Task execution routes (with AI rate limiting)
  router.post('/tasks/execute', 
    aiTaskLimiter,
    ValidationMiddleware.validateExecuteTask,
    agentController.executeTask
  );

  router.post('/tasks/schedule',
    aiTaskLimiter,
    ValidationMiddleware.validateScheduleTask,
    agentController.scheduleTask
  );

  // Task management routes
  router.get('/tasks/history',
    ValidationMiddleware.validateTaskQuery,
    agentController.getTaskHistory
  );

  router.get('/tasks/:taskId',
    ValidationMiddleware.validateTaskId,
    agentController.getTaskStatus
  );

  router.post('/tasks/retry',
    ValidationMiddleware.validateTaskRetry,
    agentController.retryTask
  );

  // Agent status and control routes
  router.get('/agents',
    agentController.getAllAgentsStatus
  );

  router.get('/agents/:agentType',
    ValidationMiddleware.validateAgentTypeParam,
    agentController.getAgentStatus
  );

  router.get('/agents/:agentType/metrics',
    ValidationMiddleware.validateAgentTypeParam,
    agentController.getAgentMetrics
  );

  router.get('/metrics',
    agentController.getAllAgentsMetrics
  );

  // Agent control routes
  router.post('/agents/pause',
    ValidationMiddleware.validateAgentControl,
    agentController.pauseAgent
  );

  router.post('/agents/resume',
    ValidationMiddleware.validateAgentControl,
    agentController.resumeAgent
  );

  // Error handling middleware (must be last)
  router.use(ErrorMiddleware.handleNotFound);
  router.use(ErrorMiddleware.handleError);

  return router;
}

// Export route configuration for external use
export const routeConfig = {
  basePath: '/api/v1',
  routes: [
    {
      method: 'GET',
      path: '/health',
      description: 'Health check endpoint',
      authentication: false,
      rateLimit: 'general'
    },
    {
      method: 'GET',
      path: '/info',
      description: 'System information',
      authentication: false,
      rateLimit: 'general'
    },
    {
      method: 'GET',
      path: '/stats',
      description: 'Orchestrator statistics',
      authentication: false,
      rateLimit: 'general'
    },
    {
      method: 'POST',
      path: '/tasks/execute',
      description: 'Execute a task with an AI agent',
      authentication: false,
      rateLimit: 'ai',
      bodySchema: 'executeTaskSchema'
    },
    {
      method: 'POST',
      path: '/tasks/schedule',
      description: 'Schedule a task for future execution',
      authentication: false,
      rateLimit: 'ai',
      bodySchema: 'scheduleTaskSchema'
    },
    {
      method: 'GET',
      path: '/tasks/history',
      description: 'Get task execution history',
      authentication: false,
      rateLimit: 'general',
      querySchema: 'taskQuerySchema'
    },
    {
      method: 'GET',
      path: '/tasks/:taskId',
      description: 'Get status of a specific task',
      authentication: false,
      rateLimit: 'general',
      parameters: ['taskId']
    },
    {
      method: 'POST',
      path: '/tasks/retry',
      description: 'Retry a failed task',
      authentication: false,
      rateLimit: 'general',
      bodySchema: 'taskRetrySchema'
    },
    {
      method: 'GET',
      path: '/agents',
      description: 'Get status of all agents',
      authentication: false,
      rateLimit: 'general'
    },
    {
      method: 'GET',
      path: '/agents/:agentType',
      description: 'Get status of a specific agent',
      authentication: false,
      rateLimit: 'general',
      parameters: ['agentType']
    },
    {
      method: 'GET',
      path: '/agents/:agentType/metrics',
      description: 'Get metrics for a specific agent',
      authentication: false,
      rateLimit: 'general',
      parameters: ['agentType']
    },
    {
      method: 'GET',
      path: '/metrics',
      description: 'Get metrics for all agents',
      authentication: false,
      rateLimit: 'general'
    },
    {
      method: 'POST',
      path: '/agents/pause',
      description: 'Pause an agent',
      authentication: false,
      rateLimit: 'general',
      bodySchema: 'agentControlSchema'
    },
    {
      method: 'POST',
      path: '/agents/resume',
      description: 'Resume a paused agent',
      authentication: false,
      rateLimit: 'general',
      bodySchema: 'agentControlSchema'
    }
  ]
};