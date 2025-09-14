export interface AgentExecutionContext {
  taskId: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    executionTime?: number;
    confidence?: number;
  };
}

export interface TaskProcessingOptions {
  timeout?: number;
  retryAttempts?: number;
  priority?: number;
}

export interface AgentMetrics {
  tasksProcessed: number;
  successRate: number;
  averageResponseTime: number;
  lastError?: string;
  lastErrorTime?: Date;
}

export interface QueueJob {
  id: string;
  taskId: string;
  agentType: string;
  payload: any;
  options: TaskProcessingOptions;
  createdAt: Date;
}

export interface DatabaseModels {
  User: any;
  Recipe: any;
  Batch: any;
  Ingredient: any;
  Order: any;
  Customer: any;
  License: any;
  Transaction: any;
  AITask: any;
}