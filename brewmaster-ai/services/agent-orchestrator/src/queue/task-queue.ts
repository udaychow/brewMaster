import Bull, { Job, Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { 
  Task, 
  TaskStatus, 
  TaskPriority, 
  AgentType 
} from '@brewmaster/shared-types';
import { QueueJob, TaskProcessingOptions } from '../types';
import config from '../config';
import logger from '../utils/logger';

export interface QueueJobData {
  taskId: string;
  agentType: AgentType;
  taskType: string;
  input: any;
  userId?: string;
  sessionId?: string;
  priority: TaskPriority;
  retryAttempts?: number;
  timeout?: number;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export class TaskQueue {
  private queues: Map<AgentType, Queue> = new Map();
  private processingCallbacks: Map<AgentType, (job: Job<QueueJobData>) => Promise<any>> = new Map();

  constructor() {
    this.initializeQueues();
    this.setupGracefulShutdown();
  }

  private initializeQueues(): void {
    const agentTypes = Object.values(AgentType);

    agentTypes.forEach(agentType => {
      const queueName = `agent-${agentType}`;
      const queue = new Bull(queueName, {
        redis: config.queueSettings.redis,
        defaultJobOptions: {
          ...config.queueSettings.defaultJobOptions,
          removeOnComplete: 100,
          removeOnFail: 50
        }
      });

      // Event listeners
      queue.on('completed', (job, result) => {
        logger.info(`Job completed for agent ${agentType}`, {
          jobId: job.id,
          taskId: job.data.taskId,
          agentType,
          duration: Date.now() - job.processedOn!
        });
      });

      queue.on('failed', (job, err) => {
        logger.error(`Job failed for agent ${agentType}`, {
          jobId: job.id,
          taskId: job.data.taskId,
          agentType,
          error: err.message,
          attempts: job.attemptsMade
        });
      });

      queue.on('stalled', (job) => {
        logger.warn(`Job stalled for agent ${agentType}`, {
          jobId: job.id,
          taskId: job.data.taskId,
          agentType
        });
      });

      queue.on('progress', (job, progress) => {
        logger.debug(`Job progress for agent ${agentType}`, {
          jobId: job.id,
          taskId: job.data.taskId,
          agentType,
          progress
        });
      });

      this.queues.set(agentType, queue);
    });

    logger.info('Task queues initialized', {
      queueCount: this.queues.size,
      agentTypes: Array.from(this.queues.keys())
    });
  }

  public async addTask(
    agentType: AgentType,
    taskType: string,
    input: any,
    options: TaskProcessingOptions = {},
    userId?: string,
    sessionId?: string
  ): Promise<string> {
    const taskId = uuidv4();
    const queue = this.queues.get(agentType);

    if (!queue) {
      throw new Error(`Queue not found for agent type: ${agentType}`);
    }

    const jobData: QueueJobData = {
      taskId,
      agentType,
      taskType,
      input,
      userId,
      sessionId,
      priority: this.mapPriorityToNumber(options.priority || TaskPriority.MEDIUM),
      retryAttempts: options.retryAttempts || 3,
      timeout: options.timeout || 300000 // 5 minutes default
    };

    const jobOptions = {
      priority: this.mapPriorityToNumber(options.priority || TaskPriority.MEDIUM),
      attempts: options.retryAttempts || 3,
      timeout: options.timeout || 300000,
      backoff: {
        type: 'exponential' as const,
        delay: 2000
      },
      removeOnComplete: 100,
      removeOnFail: 50
    };

    try {
      const job = await queue.add(taskType, jobData, jobOptions);
      
      logger.info('Task added to queue', {
        taskId,
        jobId: job.id,
        agentType,
        taskType,
        priority: options.priority || TaskPriority.MEDIUM,
        userId,
        sessionId
      });

      return taskId;
    } catch (error) {
      logger.error('Failed to add task to queue', {
        taskId,
        agentType,
        taskType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  public registerProcessor(
    agentType: AgentType,
    processor: (job: Job<QueueJobData>) => Promise<any>,
    concurrency: number = 1
  ): void {
    const queue = this.queues.get(agentType);

    if (!queue) {
      throw new Error(`Queue not found for agent type: ${agentType}`);
    }

    this.processingCallbacks.set(agentType, processor);

    queue.process(concurrency, async (job: Job<QueueJobData>) => {
      const startTime = Date.now();
      
      logger.info('Processing job started', {
        jobId: job.id,
        taskId: job.data.taskId,
        agentType,
        taskType: job.data.taskType,
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts.attempts
      });

      try {
        // Update job progress
        await job.progress(10);

        const result = await processor(job);

        // Update job progress
        await job.progress(100);

        const duration = Date.now() - startTime;

        logger.info('Job processing completed', {
          jobId: job.id,
          taskId: job.data.taskId,
          agentType,
          duration,
          success: true
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        logger.error('Job processing failed', {
          jobId: job.id,
          taskId: job.data.taskId,
          agentType,
          duration,
          error: errorMessage,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts
        });

        throw error;
      }
    });

    logger.info(`Processor registered for agent type: ${agentType}`, {
      agentType,
      concurrency
    });
  }

  public async getQueueStats(agentType?: AgentType): Promise<QueueStats | Record<string, QueueStats>> {
    if (agentType) {
      const queue = this.queues.get(agentType);
      if (!queue) {
        throw new Error(`Queue not found for agent type: ${agentType}`);
      }
      return await this.getStatsForQueue(queue);
    }

    const allStats: Record<string, QueueStats> = {};
    for (const [type, queue] of this.queues) {
      allStats[type] = await this.getStatsForQueue(queue);
    }

    return allStats;
  }

  private async getStatsForQueue(queue: Queue): Promise<QueueStats> {
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
      queue.getPaused()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      paused: paused.length
    };
  }

  public async getJob(jobId: string, agentType: AgentType): Promise<Job<QueueJobData> | null> {
    const queue = this.queues.get(agentType);
    if (!queue) {
      throw new Error(`Queue not found for agent type: ${agentType}`);
    }

    return await queue.getJob(jobId);
  }

  public async getJobsByTaskId(taskId: string): Promise<Job<QueueJobData>[]> {
    const jobs: Job<QueueJobData>[] = [];

    for (const [agentType, queue] of this.queues) {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed()
      ]);

      const allJobs = [...waiting, ...active, ...completed, ...failed];
      const matchingJobs = allJobs.filter(job => job.data.taskId === taskId);
      jobs.push(...matchingJobs);
    }

    return jobs;
  }

  public async retryFailedJob(jobId: string, agentType: AgentType): Promise<void> {
    const queue = this.queues.get(agentType);
    if (!queue) {
      throw new Error(`Queue not found for agent type: ${agentType}`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    await job.retry();

    logger.info('Job retried', {
      jobId,
      taskId: job.data.taskId,
      agentType
    });
  }

  public async removeJob(jobId: string, agentType: AgentType): Promise<void> {
    const queue = this.queues.get(agentType);
    if (!queue) {
      throw new Error(`Queue not found for agent type: ${agentType}`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    await job.remove();

    logger.info('Job removed', {
      jobId,
      taskId: job.data.taskId,
      agentType
    });
  }

  public async pauseQueue(agentType: AgentType): Promise<void> {
    const queue = this.queues.get(agentType);
    if (!queue) {
      throw new Error(`Queue not found for agent type: ${agentType}`);
    }

    await queue.pause();

    logger.info(`Queue paused for agent type: ${agentType}`);
  }

  public async resumeQueue(agentType: AgentType): Promise<void> {
    const queue = this.queues.get(agentType);
    if (!queue) {
      throw new Error(`Queue not found for agent type: ${agentType}`);
    }

    await queue.resume();

    logger.info(`Queue resumed for agent type: ${agentType}`);
  }

  public async clearQueue(agentType: AgentType, status?: 'waiting' | 'active' | 'completed' | 'failed'): Promise<number> {
    const queue = this.queues.get(agentType);
    if (!queue) {
      throw new Error(`Queue not found for agent type: ${agentType}`);
    }

    let clearedCount = 0;

    if (!status) {
      // Clear all jobs
      await queue.empty();
      await queue.clean(0, 'completed');
      await queue.clean(0, 'failed');
      clearedCount = -1; // Unknown count when clearing all
    } else {
      // Clear specific status
      switch (status) {
        case 'waiting':
          await queue.empty();
          clearedCount = 0; // Bull doesn't return count for empty()
          break;
        case 'completed':
          clearedCount = await queue.clean(0, 'completed');
          break;
        case 'failed':
          clearedCount = await queue.clean(0, 'failed');
          break;
        case 'active':
          // Can't clear active jobs directly
          throw new Error('Cannot clear active jobs directly');
        default:
          throw new Error(`Invalid status: ${status}`);
      }
    }

    logger.info('Queue cleared', {
      agentType,
      status: status || 'all',
      clearedCount
    });

    return clearedCount;
  }

  public async getQueueHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    for (const [agentType, queue] of this.queues) {
      try {
        // Check if queue is responsive
        await queue.getWaiting();
        health[agentType] = true;
      } catch (error) {
        logger.error(`Queue health check failed for ${agentType}`, {
          agentType,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        health[agentType] = false;
      }
    }

    return health;
  }

  public async addScheduledTask(
    agentType: AgentType,
    taskType: string,
    input: any,
    delay: number,
    options: TaskProcessingOptions = {}
  ): Promise<string> {
    const taskId = uuidv4();
    const queue = this.queues.get(agentType);

    if (!queue) {
      throw new Error(`Queue not found for agent type: ${agentType}`);
    }

    const jobData: QueueJobData = {
      taskId,
      agentType,
      taskType,
      input,
      priority: this.mapPriorityToNumber(options.priority || TaskPriority.MEDIUM),
      retryAttempts: options.retryAttempts || 3,
      timeout: options.timeout || 300000
    };

    const jobOptions = {
      delay,
      priority: this.mapPriorityToNumber(options.priority || TaskPriority.MEDIUM),
      attempts: options.retryAttempts || 3,
      timeout: options.timeout || 300000,
      removeOnComplete: 100,
      removeOnFail: 50
    };

    try {
      const job = await queue.add(taskType, jobData, jobOptions);

      logger.info('Scheduled task added to queue', {
        taskId,
        jobId: job.id,
        agentType,
        taskType,
        delay,
        scheduledFor: new Date(Date.now() + delay).toISOString()
      });

      return taskId;
    } catch (error) {
      logger.error('Failed to add scheduled task to queue', {
        taskId,
        agentType,
        taskType,
        delay,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  public async addRecurringTask(
    agentType: AgentType,
    taskType: string,
    input: any,
    cronExpression: string,
    options: TaskProcessingOptions = {}
  ): Promise<void> {
    const queue = this.queues.get(agentType);

    if (!queue) {
      throw new Error(`Queue not found for agent type: ${agentType}`);
    }

    const jobData: QueueJobData = {
      taskId: `recurring-${taskType}-${Date.now()}`,
      agentType,
      taskType,
      input,
      priority: this.mapPriorityToNumber(options.priority || TaskPriority.MEDIUM),
      retryAttempts: options.retryAttempts || 3,
      timeout: options.timeout || 300000
    };

    const jobOptions = {
      repeat: { cron: cronExpression },
      priority: this.mapPriorityToNumber(options.priority || TaskPriority.MEDIUM),
      attempts: options.retryAttempts || 3,
      timeout: options.timeout || 300000,
      removeOnComplete: 10,
      removeOnFail: 10
    };

    try {
      await queue.add(taskType, jobData, jobOptions);

      logger.info('Recurring task scheduled', {
        agentType,
        taskType,
        cronExpression
      });
    } catch (error) {
      logger.error('Failed to schedule recurring task', {
        agentType,
        taskType,
        cronExpression,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private mapPriorityToNumber(priority: TaskPriority): number {
    const priorityMap: Record<TaskPriority, number> = {
      [TaskPriority.URGENT]: 1,
      [TaskPriority.HIGH]: 2,
      [TaskPriority.MEDIUM]: 3,
      [TaskPriority.LOW]: 4
    };

    return priorityMap[priority];
  }

  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      logger.info('Shutting down task queues...');

      const shutdownPromises = Array.from(this.queues.values()).map(queue => 
        queue.close()
      );

      await Promise.all(shutdownPromises);
      logger.info('Task queues shut down successfully');
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }

  public async close(): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map(queue => 
      queue.close()
    );

    await Promise.all(closePromises);
    logger.info('Task queues closed');
  }
}