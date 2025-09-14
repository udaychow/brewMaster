import { Job } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { 
  Agent, 
  AgentType, 
  AgentStatus,
  Task,
  TaskStatus,
  TaskPriority
} from '@brewmaster/shared-types';
import { BaseAgent } from '../agents/base.agent';
import { ProductionPlanningAgent } from '../agents/production-planning.agent';
import { InventoryIntelligenceAgent } from '../agents/inventory-intelligence.agent';
import { ComplianceAgent } from '../agents/compliance.agent';
import { CustomerExperienceAgent } from '../agents/customer-experience.agent';
import { FinancialOperationsAgent } from '../agents/financial-operations.agent';
import { TaskQueue, QueueJobData } from '../queue/task-queue';
import { AgentExecutionContext, AgentResponse, AgentMetrics } from '../types';
import { DatabaseService } from '../services/database.service';
import logger from '../utils/logger';

export interface OrchestratorOptions {
  maxConcurrentTasks?: Record<AgentType, number>;
  healthCheckInterval?: number;
  enableScheduledTasks?: boolean;
}

export interface OrchestratorStats {
  agents: Record<AgentType, AgentMetrics>;
  queues: Record<string, any>;
  systemHealth: {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    agents: Record<AgentType, boolean>;
    queues: Record<AgentType, boolean>;
    database: boolean;
  };
}

export class AgentOrchestrator {
  private agents: Map<AgentType, BaseAgent> = new Map();
  private taskQueue: TaskQueue;
  private databaseService: DatabaseService;
  private options: Required<OrchestratorOptions>;
  private healthCheckTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(
    options: OrchestratorOptions = {},
    databaseService?: DatabaseService
  ) {
    this.options = {
      maxConcurrentTasks: options.maxConcurrentTasks || {
        [AgentType.PRODUCTION_PLANNING]: 2,
        [AgentType.INVENTORY_INTELLIGENCE]: 3,
        [AgentType.COMPLIANCE]: 1,
        [AgentType.CUSTOMER_EXPERIENCE]: 2,
        [AgentType.FINANCIAL_OPERATIONS]: 1
      },
      healthCheckInterval: options.healthCheckInterval || 60000, // 1 minute
      enableScheduledTasks: options.enableScheduledTasks ?? true
    };

    this.taskQueue = new TaskQueue();
    this.databaseService = databaseService || new DatabaseService();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Agent Orchestrator already initialized');
      return;
    }

    try {
      // Initialize agents
      await this.initializeAgents();

      // Initialize database service
      await this.databaseService.initialize();

      // Register processors with the queue
      this.registerQueueProcessors();

      // Start scheduled tasks if enabled
      if (this.options.enableScheduledTasks) {
        await this.setupScheduledTasks();
      }

      // Start health monitoring
      this.startHealthMonitoring();

      this.isInitialized = true;

      logger.info('Agent Orchestrator initialized successfully', {
        agentCount: this.agents.size,
        enabledAgents: Array.from(this.agents.keys()),
        scheduledTasks: this.options.enableScheduledTasks,
        healthCheckInterval: this.options.healthCheckInterval
      });
    } catch (error) {
      logger.error('Failed to initialize Agent Orchestrator', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async initializeAgents(): Promise<void> {
    const agentInstances: [AgentType, BaseAgent][] = [
      [AgentType.PRODUCTION_PLANNING, new ProductionPlanningAgent()],
      [AgentType.INVENTORY_INTELLIGENCE, new InventoryIntelligenceAgent()],
      [AgentType.COMPLIANCE, new ComplianceAgent()],
      [AgentType.CUSTOMER_EXPERIENCE, new CustomerExperienceAgent()],
      [AgentType.FINANCIAL_OPERATIONS, new FinancialOperationsAgent()]
    ];

    for (const [agentType, agentInstance] of agentInstances) {
      this.agents.set(agentType, agentInstance);
      logger.info(`Initialized agent: ${agentType}`, {
        agentId: agentInstance.getId(),
        agentType
      });
    }
  }

  private registerQueueProcessors(): void {
    for (const [agentType, agent] of this.agents) {
      const concurrency = this.options.maxConcurrentTasks[agentType] || 1;

      this.taskQueue.registerProcessor(
        agentType,
        async (job: Job<QueueJobData>) => {
          return await this.processAgentTask(agentType, job);
        },
        concurrency
      );

      logger.info(`Registered processor for agent ${agentType}`, {
        agentType,
        concurrency
      });
    }
  }

  private async processAgentTask(agentType: AgentType, job: Job<QueueJobData>): Promise<AgentResponse> {
    const agent = this.agents.get(agentType);
    if (!agent) {
      throw new Error(`Agent not found for type: ${agentType}`);
    }

    // Create task object
    const task: Task = {
      id: job.data.taskId,
      type: job.data.taskType,
      priority: this.mapNumberToPriority(job.data.priority),
      assignedAgentId: agent.getId(),
      status: TaskStatus.PROCESSING,
      input: job.data.input,
      createdAt: new Date(job.timestamp),
      updatedAt: new Date()
    };

    // Create execution context
    const context: AgentExecutionContext = {
      taskId: job.data.taskId,
      userId: job.data.userId,
      sessionId: job.data.sessionId,
      timestamp: new Date()
    };

    // Update job progress
    await job.progress(20);

    // Store task in database
    await this.databaseService.createTask(task);

    try {
      // Update job progress
      await job.progress(40);

      // Execute the task
      const result = await agent.execute(task, context);

      // Update job progress
      await job.progress(80);

      // Update task in database
      await this.databaseService.updateTask(task.id, {
        status: result.success ? TaskStatus.COMPLETED : TaskStatus.FAILED,
        output: result.data,
        completedAt: result.success ? new Date() : undefined,
        updatedAt: new Date()
      });

      // Update job progress
      await job.progress(100);

      logger.info('Agent task completed successfully', {
        taskId: job.data.taskId,
        agentType,
        success: result.success,
        executionTime: result.metadata?.executionTime
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update task in database
      await this.databaseService.updateTask(task.id, {
        status: TaskStatus.FAILED,
        output: { error: errorMessage },
        updatedAt: new Date()
      });

      logger.error('Agent task failed', {
        taskId: job.data.taskId,
        agentType,
        error: errorMessage
      });

      throw error;
    }
  }

  public async executeTask(
    agentType: AgentType,
    taskType: string,
    input: any,
    priority: TaskPriority = TaskPriority.MEDIUM,
    userId?: string,
    sessionId?: string
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Agent Orchestrator not initialized');
    }

    if (!this.agents.has(agentType)) {
      throw new Error(`Agent type not supported: ${agentType}`);
    }

    try {
      const taskId = await this.taskQueue.addTask(
        agentType,
        taskType,
        input,
        { priority },
        userId,
        sessionId
      );

      logger.info('Task queued for execution', {
        taskId,
        agentType,
        taskType,
        priority,
        userId,
        sessionId
      });

      return taskId;
    } catch (error) {
      logger.error('Failed to queue task', {
        agentType,
        taskType,
        priority,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  public async scheduleTask(
    agentType: AgentType,
    taskType: string,
    input: any,
    delay: number,
    priority: TaskPriority = TaskPriority.MEDIUM
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Agent Orchestrator not initialized');
    }

    try {
      const taskId = await this.taskQueue.addScheduledTask(
        agentType,
        taskType,
        input,
        delay,
        { priority }
      );

      logger.info('Task scheduled for execution', {
        taskId,
        agentType,
        taskType,
        delay,
        scheduledFor: new Date(Date.now() + delay).toISOString(),
        priority
      });

      return taskId;
    } catch (error) {
      logger.error('Failed to schedule task', {
        agentType,
        taskType,
        delay,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  public async getTaskStatus(taskId: string): Promise<Task | null> {
    try {
      return await this.databaseService.getTask(taskId);
    } catch (error) {
      logger.error('Failed to get task status', {
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  public async getTaskHistory(
    agentType?: AgentType,
    limit: number = 50,
    offset: number = 0
  ): Promise<Task[]> {
    try {
      return await this.databaseService.getTaskHistory({
        agentType,
        limit,
        offset
      });
    } catch (error) {
      logger.error('Failed to get task history', {
        agentType,
        limit,
        offset,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  public async getAgentStatus(agentType?: AgentType): Promise<Agent | Agent[]> {
    if (agentType) {
      const agent = this.agents.get(agentType);
      if (!agent) {
        throw new Error(`Agent not found: ${agentType}`);
      }
      return agent.getAgent();
    }

    return Array.from(this.agents.values()).map(agent => agent.getAgent());
  }

  public async getAgentMetrics(agentType?: AgentType): Promise<AgentMetrics | Record<string, AgentMetrics>> {
    if (agentType) {
      const agent = this.agents.get(agentType);
      if (!agent) {
        throw new Error(`Agent not found: ${agentType}`);
      }
      return agent.getMetrics();
    }

    const allMetrics: Record<string, AgentMetrics> = {};
    for (const [type, agent] of this.agents) {
      allMetrics[type] = agent.getMetrics();
    }

    return allMetrics;
  }

  public async getOrchestratorStats(): Promise<OrchestratorStats> {
    const agentMetrics: Record<AgentType, AgentMetrics> = {};
    const agentHealth: Record<AgentType, boolean> = {};

    for (const [agentType, agent] of this.agents) {
      agentMetrics[agentType] = agent.getMetrics();
      agentHealth[agentType] = agent.isHealthy();
    }

    const queueStats = await this.taskQueue.getQueueStats();
    const queueHealth = await this.taskQueue.getQueueHealth();
    const databaseHealth = await this.databaseService.checkHealth();

    const overallHealth = this.calculateOverallHealth(agentHealth, queueHealth, databaseHealth);

    return {
      agents: agentMetrics,
      queues: queueStats,
      systemHealth: {
        overall: overallHealth,
        agents: agentHealth,
        queues: queueHealth,
        database: databaseHealth
      }
    };
  }

  public async pauseAgent(agentType: AgentType): Promise<void> {
    const agent = this.agents.get(agentType);
    if (!agent) {
      throw new Error(`Agent not found: ${agentType}`);
    }

    agent.setStatus(AgentStatus.INACTIVE);
    await this.taskQueue.pauseQueue(agentType);

    logger.info(`Agent paused: ${agentType}`);
  }

  public async resumeAgent(agentType: AgentType): Promise<void> {
    const agent = this.agents.get(agentType);
    if (!agent) {
      throw new Error(`Agent not found: ${agentType}`);
    }

    agent.setStatus(AgentStatus.ACTIVE);
    await this.taskQueue.resumeQueue(agentType);

    logger.info(`Agent resumed: ${agentType}`);
  }

  public async retryTask(taskId: string, agentType: AgentType): Promise<void> {
    const jobs = await this.taskQueue.getJobsByTaskId(taskId);
    const job = jobs.find(j => j.data.agentType === agentType);

    if (!job) {
      throw new Error(`Job not found for task: ${taskId}`);
    }

    await this.taskQueue.retryFailedJob(job.id!.toString(), agentType);
    
    // Update task status in database
    await this.databaseService.updateTask(taskId, {
      status: TaskStatus.PENDING,
      updatedAt: new Date()
    });

    logger.info('Task retry initiated', { taskId, agentType });
  }

  private async setupScheduledTasks(): Promise<void> {
    // Example scheduled tasks - these can be configured based on business needs
    const scheduledTasks = [
      {
        agentType: AgentType.COMPLIANCE,
        taskType: 'monitor_license_status',
        input: { notificationThresholds: { critical: 30, warning: 90 } },
        cronExpression: '0 9 * * *', // Daily at 9 AM
        priority: TaskPriority.HIGH
      },
      {
        agentType: AgentType.INVENTORY_INTELLIGENCE,
        taskType: 'assess_stock_risks',
        input: { riskTolerance: { stockout: 0.05, overstock: 0.15 } },
        cronExpression: '0 8 * * 1', // Weekly on Mondays at 8 AM
        priority: TaskPriority.MEDIUM
      },
      {
        agentType: AgentType.FINANCIAL_OPERATIONS,
        taskType: 'analyze_financial_performance',
        input: { period: '1 month' },
        cronExpression: '0 7 1 * *', // Monthly on the 1st at 7 AM
        priority: TaskPriority.MEDIUM
      }
    ];

    for (const task of scheduledTasks) {
      try {
        await this.taskQueue.addRecurringTask(
          task.agentType,
          task.taskType,
          task.input,
          task.cronExpression,
          { priority: task.priority }
        );

        logger.info('Scheduled task configured', {
          agentType: task.agentType,
          taskType: task.taskType,
          cronExpression: task.cronExpression
        });
      } catch (error) {
        logger.error('Failed to schedule recurring task', {
          agentType: task.agentType,
          taskType: task.taskType,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        const stats = await this.getOrchestratorStats();
        
        if (stats.systemHealth.overall !== 'healthy') {
          logger.warn('System health check detected issues', {
            overallHealth: stats.systemHealth.overall,
            agentHealth: stats.systemHealth.agents,
            queueHealth: stats.systemHealth.queues,
            databaseHealth: stats.systemHealth.database
          });
        }

        // Log metrics periodically
        logger.debug('System health metrics', {
          agentMetrics: stats.agents,
          queueStats: stats.queues
        });
      } catch (error) {
        logger.error('Health check failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, this.options.healthCheckInterval);

    logger.info('Health monitoring started', {
      interval: this.options.healthCheckInterval
    });
  }

  private calculateOverallHealth(
    agentHealth: Record<AgentType, boolean>,
    queueHealth: Record<AgentType, boolean>,
    databaseHealth: boolean
  ): 'healthy' | 'degraded' | 'unhealthy' {
    if (!databaseHealth) {
      return 'unhealthy';
    }

    const healthyAgents = Object.values(agentHealth).filter(Boolean).length;
    const totalAgents = Object.values(agentHealth).length;
    const healthyQueues = Object.values(queueHealth).filter(Boolean).length;
    const totalQueues = Object.values(queueHealth).length;

    const agentHealthRatio = healthyAgents / totalAgents;
    const queueHealthRatio = healthyQueues / totalQueues;

    if (agentHealthRatio === 1 && queueHealthRatio === 1) {
      return 'healthy';
    } else if (agentHealthRatio >= 0.5 && queueHealthRatio >= 0.5) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  private mapNumberToPriority(priorityNumber: number): TaskPriority {
    const priorityMap: Record<number, TaskPriority> = {
      1: TaskPriority.URGENT,
      2: TaskPriority.HIGH,
      3: TaskPriority.MEDIUM,
      4: TaskPriority.LOW
    };

    return priorityMap[priorityNumber] || TaskPriority.MEDIUM;
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down Agent Orchestrator...');

    // Stop health monitoring
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // Close task queue
    await this.taskQueue.close();

    // Close database connections
    await this.databaseService.close();

    this.isInitialized = false;

    logger.info('Agent Orchestrator shutdown complete');
  }
}