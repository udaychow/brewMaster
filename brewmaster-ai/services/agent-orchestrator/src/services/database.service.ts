import { prisma } from '@brewmaster/database';
import { Task, TaskStatus, AgentType } from '@brewmaster/shared-types';
import logger from '../utils/logger';

export interface TaskQueryOptions {
  agentType?: AgentType;
  status?: TaskStatus;
  userId?: string;
  sessionId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface TaskUpdateData {
  status?: TaskStatus;
  output?: any;
  assignedAgentId?: string;
  completedAt?: Date;
  updatedAt: Date;
}

export interface AgentMemoryData {
  agentId: string;
  type: 'shortTerm' | 'longTerm';
  key: string;
  value: any;
  expiresAt?: Date;
}

export class DatabaseService {
  private initialized = false;

  public async initialize(): Promise<void> {
    try {
      // Test database connection
      await prisma.$connect();
      
      // Run any necessary migrations or setup
      await this.setupDatabase();
      
      this.initialized = true;
      logger.info('Database service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database service', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async setupDatabase(): Promise<void> {
    try {
      // Check if database is accessible and tables exist
      await prisma.aITask.findFirst();
      logger.info('Database connection verified');
    } catch (error) {
      logger.error('Database setup failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  public async createTask(task: Task): Promise<Task> {
    if (!this.initialized) {
      throw new Error('Database service not initialized');
    }

    try {
      const aiTask = await prisma.aITask.create({
        data: {
          id: task.id,
          agentType: task.assignedAgentId ? this.getAgentTypeFromId(task.assignedAgentId) : 'UNKNOWN',
          taskType: task.type,
          status: this.mapTaskStatusToAITaskStatus(task.status),
          priority: this.mapTaskPriorityToNumber(task.priority),
          input: task.input,
          output: task.output || null,
          startedAt: task.status === TaskStatus.PROCESSING ? new Date() : null,
          completedAt: task.completedAt || null,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt
        }
      });

      logger.info('Task created in database', {
        taskId: task.id,
        agentType: aiTask.agentType,
        taskType: task.type,
        status: task.status
      });

      return this.mapAITaskToTask(aiTask);
    } catch (error) {
      logger.error('Failed to create task in database', {
        taskId: task.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  public async getTask(taskId: string): Promise<Task | null> {
    if (!this.initialized) {
      throw new Error('Database service not initialized');
    }

    try {
      const aiTask = await prisma.aITask.findUnique({
        where: { id: taskId }
      });

      if (!aiTask) {
        return null;
      }

      return this.mapAITaskToTask(aiTask);
    } catch (error) {
      logger.error('Failed to get task from database', {
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  public async updateTask(taskId: string, updateData: TaskUpdateData): Promise<Task | null> {
    if (!this.initialized) {
      throw new Error('Database service not initialized');
    }

    try {
      const aiTask = await prisma.aITask.update({
        where: { id: taskId },
        data: {
          status: updateData.status ? this.mapTaskStatusToAITaskStatus(updateData.status) : undefined,
          output: updateData.output,
          startedAt: updateData.status === TaskStatus.PROCESSING ? new Date() : undefined,
          completedAt: updateData.completedAt,
          updatedAt: updateData.updatedAt
        }
      });

      logger.info('Task updated in database', {
        taskId,
        status: updateData.status,
        completedAt: updateData.completedAt
      });

      return this.mapAITaskToTask(aiTask);
    } catch (error) {
      logger.error('Failed to update task in database', {
        taskId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  public async getTaskHistory(options: TaskQueryOptions = {}): Promise<Task[]> {
    if (!this.initialized) {
      throw new Error('Database service not initialized');
    }

    try {
      const where: any = {};

      if (options.agentType) {
        where.agentType = options.agentType;
      }

      if (options.status) {
        where.status = this.mapTaskStatusToAITaskStatus(options.status);
      }

      if (options.startDate || options.endDate) {
        where.createdAt = {};
        if (options.startDate) {
          where.createdAt.gte = options.startDate;
        }
        if (options.endDate) {
          where.createdAt.lte = options.endDate;
        }
      }

      const aiTasks = await prisma.aITask.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0
      });

      return aiTasks.map(task => this.mapAITaskToTask(task));
    } catch (error) {
      logger.error('Failed to get task history from database', {
        options,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  public async getTaskStats(agentType?: AgentType, timeframe: number = 24): Promise<any> {
    if (!this.initialized) {
      throw new Error('Database service not initialized');
    }

    try {
      const since = new Date(Date.now() - timeframe * 60 * 60 * 1000);
      const where: any = {
        createdAt: { gte: since }
      };

      if (agentType) {
        where.agentType = agentType;
      }

      const [totalTasks, completedTasks, failedTasks, averageExecutionTime] = await Promise.all([
        prisma.aITask.count({ where }),
        prisma.aITask.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.aITask.count({ where: { ...where, status: 'FAILED' } }),
        this.getAverageExecutionTime(where)
      ]);

      const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        totalTasks,
        completedTasks,
        failedTasks,
        successRate,
        averageExecutionTime,
        timeframe: `${timeframe} hours`
      };
    } catch (error) {
      logger.error('Failed to get task statistics', {
        agentType,
        timeframe,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  public async storeAgentMemory(agentId: string, type: 'shortTerm' | 'longTerm', key: string, value: any, expiresAt?: Date): Promise<void> {
    if (!this.initialized) {
      throw new Error('Database service not initialized');
    }

    try {
      // For now, we'll use a simple key-value approach with JSON storage
      // In a production system, you might want a dedicated agent_memory table
      const memoryKey = `${agentId}:${type}:${key}`;
      
      // Store in a generic way for now - this could be enhanced with a dedicated table
      await prisma.aITask.create({
        data: {
          id: `memory-${Date.now()}-${Math.random()}`,
          agentType: 'MEMORY_STORAGE',
          taskType: 'store_memory',
          status: 'COMPLETED',
          priority: 5,
          input: {
            agentId,
            type,
            key,
            memoryKey,
            expiresAt: expiresAt?.toISOString()
          },
          output: value,
          startedAt: new Date(),
          completedAt: new Date()
        }
      });

      logger.debug('Agent memory stored', {
        agentId,
        type,
        key,
        expiresAt
      });
    } catch (error) {
      logger.error('Failed to store agent memory', {
        agentId,
        type,
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public async getAgentMemory(agentId: string, type: 'shortTerm' | 'longTerm', key?: string): Promise<any> {
    if (!this.initialized) {
      throw new Error('Database service not initialized');
    }

    try {
      const where: any = {
        agentType: 'MEMORY_STORAGE',
        taskType: 'store_memory',
        input: {
          path: ['agentId'],
          equals: agentId
        }
      };

      // Add type filter
      where.input = {
        ...where.input,
        path: ['type'],
        equals: type
      };

      if (key) {
        where.input = {
          ...where.input,
          path: ['key'],
          equals: key
        };
      }

      const memoryRecords = await prisma.aITask.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      // Filter out expired memory
      const currentTime = new Date();
      const validMemory = memoryRecords.filter(record => {
        const expiresAt = record.input?.expiresAt;
        return !expiresAt || new Date(expiresAt) > currentTime;
      });

      if (key) {
        return validMemory.length > 0 ? validMemory[0].output : null;
      }

      // Return all memory for this agent/type
      const memoryMap: Record<string, any> = {};
      validMemory.forEach(record => {
        const recordKey = record.input?.key;
        if (recordKey) {
          memoryMap[recordKey] = record.output;
        }
      });

      return memoryMap;
    } catch (error) {
      logger.error('Failed to get agent memory', {
        agentId,
        type,
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  public async cleanupExpiredMemory(): Promise<number> {
    if (!this.initialized) {
      throw new Error('Database service not initialized');
    }

    try {
      const currentTime = new Date();
      
      const expiredMemory = await prisma.aITask.findMany({
        where: {
          agentType: 'MEMORY_STORAGE',
          taskType: 'store_memory',
          input: {
            path: ['expiresAt'],
            not: null
          }
        }
      });

      const expiredIds = expiredMemory
        .filter(record => {
          const expiresAt = record.input?.expiresAt;
          return expiresAt && new Date(expiresAt) <= currentTime;
        })
        .map(record => record.id);

      if (expiredIds.length > 0) {
        const result = await prisma.aITask.deleteMany({
          where: {
            id: { in: expiredIds }
          }
        });

        logger.info('Cleaned up expired agent memory', {
          cleanedCount: result.count
        });

        return result.count;
      }

      return 0;
    } catch (error) {
      logger.error('Failed to cleanup expired memory', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  public async checkHealth(): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    try {
      // Simple health check - try to query the database
      await prisma.aITask.findFirst({
        take: 1
      });
      return true;
    } catch (error) {
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  public async close(): Promise<void> {
    if (this.initialized) {
      await prisma.$disconnect();
      this.initialized = false;
      logger.info('Database service closed');
    }
  }

  // Helper methods for data mapping
  private mapTaskStatusToAITaskStatus(status: TaskStatus): string {
    const statusMap: Record<TaskStatus, string> = {
      [TaskStatus.PENDING]: 'PENDING',
      [TaskStatus.ASSIGNED]: 'PENDING',
      [TaskStatus.PROCESSING]: 'RUNNING',
      [TaskStatus.COMPLETED]: 'COMPLETED',
      [TaskStatus.FAILED]: 'FAILED'
    };

    return statusMap[status] || 'PENDING';
  }

  private mapAITaskStatusToTaskStatus(status: string): TaskStatus {
    const statusMap: Record<string, TaskStatus> = {
      'PENDING': TaskStatus.PENDING,
      'RUNNING': TaskStatus.PROCESSING,
      'COMPLETED': TaskStatus.COMPLETED,
      'FAILED': TaskStatus.FAILED,
      'CANCELLED': TaskStatus.FAILED
    };

    return statusMap[status] || TaskStatus.PENDING;
  }

  private mapTaskPriorityToNumber(priority: any): number {
    if (typeof priority === 'number') return priority;
    
    const priorityMap: Record<string, number> = {
      'URGENT': 1,
      'HIGH': 2,
      'MEDIUM': 3,
      'LOW': 4
    };

    return priorityMap[priority] || 3;
  }

  private mapAITaskToTask(aiTask: any): Task {
    return {
      id: aiTask.id,
      type: aiTask.taskType,
      priority: this.mapNumberToTaskPriority(aiTask.priority),
      assignedAgentId: aiTask.agentType !== 'MEMORY_STORAGE' ? `agent-${aiTask.agentType}` : undefined,
      status: this.mapAITaskStatusToTaskStatus(aiTask.status),
      input: aiTask.input,
      output: aiTask.output,
      createdAt: aiTask.createdAt,
      updatedAt: aiTask.updatedAt,
      completedAt: aiTask.completedAt
    };
  }

  private mapNumberToTaskPriority(priority: number): any {
    const priorityMap: Record<number, string> = {
      1: 'URGENT',
      2: 'HIGH',
      3: 'MEDIUM',
      4: 'LOW'
    };

    return priorityMap[priority] || 'MEDIUM';
  }

  private getAgentTypeFromId(agentId: string): string {
    // Simple mapping from agent ID to type
    // In a real implementation, you might store this mapping separately
    if (agentId.includes('production')) return 'PRODUCTION_PLANNING';
    if (agentId.includes('inventory')) return 'INVENTORY_INTELLIGENCE';
    if (agentId.includes('compliance')) return 'COMPLIANCE';
    if (agentId.includes('customer')) return 'CUSTOMER_EXPERIENCE';
    if (agentId.includes('financial')) return 'FINANCIAL_OPERATIONS';
    return 'UNKNOWN';
  }

  private async getAverageExecutionTime(where: any): Promise<number> {
    try {
      const tasks = await prisma.aITask.findMany({
        where: {
          ...where,
          status: 'COMPLETED',
          startedAt: { not: null },
          completedAt: { not: null }
        },
        select: {
          startedAt: true,
          completedAt: true
        }
      });

      if (tasks.length === 0) return 0;

      const totalTime = tasks.reduce((sum, task) => {
        if (task.startedAt && task.completedAt) {
          return sum + (task.completedAt.getTime() - task.startedAt.getTime());
        }
        return sum;
      }, 0);

      return Math.round(totalTime / tasks.length); // Average in milliseconds
    } catch (error) {
      logger.error('Failed to calculate average execution time', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }
}