import { v4 as uuidv4 } from 'uuid';
import { 
  Agent, 
  AgentType, 
  AgentStatus, 
  AgentMemory, 
  AgentConfig,
  Task,
  TaskStatus,
  ContextEntry
} from '@brewmaster/shared-types';
import { ClaudeIntegration } from '../integrations/claude';
import { AgentExecutionContext, AgentResponse, AgentMetrics } from '../types';
import logger from '../utils/logger';
import config from '../config';

export abstract class BaseAgent {
  protected agent: Agent;
  protected claude: ClaudeIntegration;
  protected metrics: AgentMetrics;

  constructor(
    type: AgentType,
    name: string,
    description: string,
    systemPrompt: string,
    agentConfig?: Partial<AgentConfig>
  ) {
    this.agent = {
      id: uuidv4(),
      type,
      name,
      description,
      capabilities: this.getCapabilities(),
      status: AgentStatus.ACTIVE,
      memory: {
        shortTerm: {},
        longTerm: {},
        contextHistory: []
      },
      config: {
        model: agentConfig?.model || config.agents.defaultModel,
        temperature: agentConfig?.temperature || config.agents.defaultTemperature,
        maxTokens: agentConfig?.maxTokens || config.agents.defaultMaxTokens,
        systemPrompt
      }
    };

    this.claude = new ClaudeIntegration();
    this.metrics = {
      tasksProcessed: 0,
      successRate: 100,
      averageResponseTime: 0,
      lastError: undefined,
      lastErrorTime: undefined
    };
  }

  // Abstract methods that must be implemented by subclasses
  protected abstract getCapabilities(): any[];
  public abstract processTask(task: Task, context: AgentExecutionContext): Promise<AgentResponse>;

  // Core agent functionality
  public async execute(task: Task, context: AgentExecutionContext): Promise<AgentResponse> {
    const startTime = Date.now();
    this.agent.status = AgentStatus.PROCESSING;

    try {
      logger.info(`Agent ${this.agent.name} starting task ${task.id}`, {
        agentId: this.agent.id,
        taskId: task.id,
        taskType: task.type
      });

      // Add context to memory
      await this.updateContext(task, context);

      // Process the task
      const response = await this.processTask(task, context);

      // Update metrics
      const executionTime = Date.now() - startTime;
      this.updateMetrics(true, executionTime);

      // Update memory with results
      if (response.success) {
        await this.storeInMemory('shortTerm', `task_${task.id}`, {
          result: response.data,
          executionTime,
          timestamp: new Date()
        });
      }

      this.agent.status = AgentStatus.ACTIVE;

      logger.info(`Agent ${this.agent.name} completed task ${task.id}`, {
        agentId: this.agent.id,
        taskId: task.id,
        success: response.success,
        executionTime
      });

      return {
        ...response,
        metadata: {
          ...response.metadata,
          executionTime,
          agentId: this.agent.id
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.updateMetrics(false, executionTime);
      this.metrics.lastError = errorMessage;
      this.metrics.lastErrorTime = new Date();
      
      this.agent.status = AgentStatus.ERROR;

      logger.error(`Agent ${this.agent.name} failed task ${task.id}`, {
        agentId: this.agent.id,
        taskId: task.id,
        error: errorMessage,
        executionTime
      });

      return {
        success: false,
        error: errorMessage,
        metadata: {
          executionTime,
          agentId: this.agent.id
        }
      };
    }
  }

  // Memory management
  public async storeInMemory(type: 'shortTerm' | 'longTerm', key: string, value: any): Promise<void> {
    this.agent.memory[type][key] = value;

    // Clean up old short-term memory (keep only last 100 items)
    if (type === 'shortTerm') {
      const keys = Object.keys(this.agent.memory.shortTerm);
      if (keys.length > 100) {
        const oldestKeys = keys.slice(0, keys.length - 100);
        oldestKeys.forEach(k => delete this.agent.memory.shortTerm[k]);
      }
    }
  }

  public getFromMemory(type: 'shortTerm' | 'longTerm', key: string): any {
    return this.agent.memory[type][key];
  }

  public async updateContext(task: Task, context: AgentExecutionContext): Promise<void> {
    const contextEntry: ContextEntry = {
      timestamp: context.timestamp,
      context: JSON.stringify({
        taskId: task.id,
        taskType: task.type,
        userId: context.userId,
        sessionId: context.sessionId
      }),
      relevance: this.calculateContextRelevance(task)
    };

    this.agent.memory.contextHistory.push(contextEntry);

    // Keep only the most recent context entries (last 50)
    if (this.agent.memory.contextHistory.length > 50) {
      this.agent.memory.contextHistory = this.agent.memory.contextHistory.slice(-50);
    }
  }

  private calculateContextRelevance(task: Task): number {
    // Simple relevance calculation - can be made more sophisticated
    // Higher relevance for recent tasks of the same type
    const recentSimilarTasks = this.agent.memory.contextHistory
      .filter(entry => {
        try {
          const context = JSON.parse(entry.context);
          return context.taskType === task.type;
        } catch {
          return false;
        }
      })
      .length;

    return Math.min(1, 0.5 + (recentSimilarTasks * 0.1));
  }

  // Metrics
  private updateMetrics(success: boolean, executionTime: number): void {
    this.metrics.tasksProcessed++;
    
    // Update success rate
    const previousSuccesses = Math.floor(this.metrics.successRate * (this.metrics.tasksProcessed - 1) / 100);
    const newSuccesses = success ? previousSuccesses + 1 : previousSuccesses;
    this.metrics.successRate = (newSuccesses / this.metrics.tasksProcessed) * 100;

    // Update average response time
    this.metrics.averageResponseTime = 
      ((this.metrics.averageResponseTime * (this.metrics.tasksProcessed - 1)) + executionTime) 
      / this.metrics.tasksProcessed;
  }

  // Claude integration helpers
  protected async generateResponse(
    userPrompt: string,
    context?: any,
    customSystemPrompt?: string
  ): Promise<{ content: string; tokensUsed: number }> {
    const systemPrompt = customSystemPrompt || this.agent.config.systemPrompt;
    
    const result = await this.claude.generateResponse(
      systemPrompt,
      userPrompt,
      this.agent.config,
      {
        ...context,
        agentMemory: this.getRelevantMemory(context),
        agentCapabilities: this.agent.capabilities
      }
    );

    return {
      content: result.content,
      tokensUsed: result.tokensUsed
    };
  }

  protected getRelevantMemory(context?: any): any {
    // Return relevant memory based on context
    // This is a simplified implementation - can be made more sophisticated
    const recentShortTerm = Object.entries(this.agent.memory.shortTerm)
      .slice(-10)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, any>);

    const recentContext = this.agent.memory.contextHistory
      .slice(-10)
      .filter(entry => entry.relevance > 0.5);

    return {
      shortTerm: recentShortTerm,
      recentContext,
      longTerm: this.agent.memory.longTerm
    };
  }

  // Getters
  public getAgent(): Agent {
    return { ...this.agent };
  }

  public getMetrics(): AgentMetrics {
    return { ...this.metrics };
  }

  public getId(): string {
    return this.agent.id;
  }

  public getType(): AgentType {
    return this.agent.type;
  }

  public getStatus(): AgentStatus {
    return this.agent.status;
  }

  // Status management
  public setStatus(status: AgentStatus): void {
    this.agent.status = status;
    logger.info(`Agent ${this.agent.name} status changed to ${status}`, {
      agentId: this.agent.id,
      status
    });
  }

  public isHealthy(): boolean {
    return this.agent.status === AgentStatus.ACTIVE && 
           this.metrics.successRate > 50; // Consider healthy if success rate > 50%
  }
}