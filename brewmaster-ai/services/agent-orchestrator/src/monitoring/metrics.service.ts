import { EventEmitter } from 'events';
import { AgentType } from '@brewmaster/shared-types';
import logger from '../utils/logger';

export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  activeConnections: number;
}

export interface AgentMetrics {
  tasksProcessed: number;
  tasksSuccessful: number;
  tasksFailed: number;
  averageExecutionTime: number;
  queueLength: number;
  lastActivity: Date;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  heapUsed: number;
  heapTotal: number;
  eventLoopLag: number;
  uptime: number;
}

export class MetricsService extends EventEmitter {
  private performanceMetrics: PerformanceMetrics = {
    requestCount: 0,
    errorCount: 0,
    averageResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    activeConnections: 0
  };

  private agentMetrics: Map<AgentType, AgentMetrics> = new Map();
  private responseTimes: number[] = [];
  private maxResponseTimeHistory = 1000; // Keep last 1000 response times

  private metricsInterval?: NodeJS.Timeout;
  private readonly metricsIntervalMs = 60000; // 1 minute

  constructor() {
    super();
    this.initializeAgentMetrics();
    this.startMetricsCollection();
  }

  private initializeAgentMetrics(): void {
    Object.values(AgentType).forEach(agentType => {
      this.agentMetrics.set(agentType, {
        tasksProcessed: 0,
        tasksSuccessful: 0,
        tasksFailed: 0,
        averageExecutionTime: 0,
        queueLength: 0,
        lastActivity: new Date()
      });
    });
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      try {
        const systemMetrics = this.collectSystemMetrics();
        this.emit('system-metrics', systemMetrics);

        // Clean up old response times
        if (this.responseTimes.length > this.maxResponseTimeHistory) {
          this.responseTimes = this.responseTimes.slice(-this.maxResponseTimeHistory);
        }

        // Calculate percentiles
        this.calculateResponseTimePercentiles();

        logger.debug('Metrics collected', {
          performanceMetrics: this.performanceMetrics,
          systemMetrics,
          agentCount: this.agentMetrics.size
        });
      } catch (error) {
        logger.error('Error collecting metrics', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, this.metricsIntervalMs);

    logger.info('Metrics collection started', {
      intervalMs: this.metricsIntervalMs
    });
  }

  // Record API request metrics
  recordRequest(responseTime: number, success: boolean = true): void {
    this.performanceMetrics.requestCount++;
    
    if (!success) {
      this.performanceMetrics.errorCount++;
    }

    // Add to response times for percentile calculation
    this.responseTimes.push(responseTime);

    // Update average response time
    const totalRequests = this.performanceMetrics.requestCount;
    const currentAverage = this.performanceMetrics.averageResponseTime;
    this.performanceMetrics.averageResponseTime = 
      (currentAverage * (totalRequests - 1) + responseTime) / totalRequests;

    this.emit('request-recorded', {
      responseTime,
      success,
      totalRequests
    });
  }

  // Record agent task metrics
  recordAgentTask(
    agentType: AgentType, 
    executionTime: number, 
    success: boolean = true
  ): void {
    const metrics = this.agentMetrics.get(agentType);
    if (!metrics) {
      logger.warn('Agent metrics not found', { agentType });
      return;
    }

    metrics.tasksProcessed++;
    metrics.lastActivity = new Date();

    if (success) {
      metrics.tasksSuccessful++;
    } else {
      metrics.tasksFailed++;
    }

    // Update average execution time
    const totalTasks = metrics.tasksProcessed;
    const currentAverage = metrics.averageExecutionTime;
    metrics.averageExecutionTime = 
      (currentAverage * (totalTasks - 1) + executionTime) / totalTasks;

    this.emit('agent-task-recorded', {
      agentType,
      executionTime,
      success,
      totalTasks
    });

    logger.debug('Agent task recorded', {
      agentType,
      executionTime,
      success,
      totalTasks: metrics.tasksProcessed
    });
  }

  // Update queue length for agent
  updateQueueLength(agentType: AgentType, length: number): void {
    const metrics = this.agentMetrics.get(agentType);
    if (metrics) {
      metrics.queueLength = length;
    }
  }

  // Record active connections
  recordActiveConnections(count: number): void {
    this.performanceMetrics.activeConnections = count;
  }

  // Get performance metrics
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  // Get agent metrics
  getAgentMetrics(agentType?: AgentType): AgentMetrics | Map<AgentType, AgentMetrics> {
    if (agentType) {
      const metrics = this.agentMetrics.get(agentType);
      return metrics ? { ...metrics } : {
        tasksProcessed: 0,
        tasksSuccessful: 0,
        tasksFailed: 0,
        averageExecutionTime: 0,
        queueLength: 0,
        lastActivity: new Date()
      };
    }

    const allMetrics = new Map<AgentType, AgentMetrics>();
    this.agentMetrics.forEach((metrics, agentType) => {
      allMetrics.set(agentType, { ...metrics });
    });
    
    return allMetrics;
  }

  // Get system metrics
  getSystemMetrics(): SystemMetrics {
    return this.collectSystemMetrics();
  }

  // Get comprehensive metrics report
  getMetricsReport(): {
    timestamp: Date;
    performance: PerformanceMetrics;
    agents: Record<string, AgentMetrics>;
    system: SystemMetrics;
  } {
    const agentMetricsObj: Record<string, AgentMetrics> = {};
    this.agentMetrics.forEach((metrics, agentType) => {
      agentMetricsObj[agentType] = { ...metrics };
    });

    return {
      timestamp: new Date(),
      performance: this.getPerformanceMetrics(),
      agents: agentMetricsObj,
      system: this.getSystemMetrics()
    };
  }

  // Reset metrics (useful for testing)
  resetMetrics(): void {
    this.performanceMetrics = {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      activeConnections: 0
    };

    this.responseTimes = [];
    this.initializeAgentMetrics();

    logger.info('Metrics reset');
  }

  // Export metrics in Prometheus format
  exportPrometheusMetrics(): string {
    const timestamp = Date.now();
    const metrics: string[] = [];

    // Performance metrics
    metrics.push(`# HELP brewmaster_requests_total Total number of requests`);
    metrics.push(`# TYPE brewmaster_requests_total counter`);
    metrics.push(`brewmaster_requests_total ${this.performanceMetrics.requestCount} ${timestamp}`);

    metrics.push(`# HELP brewmaster_errors_total Total number of errors`);
    metrics.push(`# TYPE brewmaster_errors_total counter`);
    metrics.push(`brewmaster_errors_total ${this.performanceMetrics.errorCount} ${timestamp}`);

    metrics.push(`# HELP brewmaster_response_time_average Average response time in milliseconds`);
    metrics.push(`# TYPE brewmaster_response_time_average gauge`);
    metrics.push(`brewmaster_response_time_average ${this.performanceMetrics.averageResponseTime} ${timestamp}`);

    metrics.push(`# HELP brewmaster_active_connections Active connections`);
    metrics.push(`# TYPE brewmaster_active_connections gauge`);
    metrics.push(`brewmaster_active_connections ${this.performanceMetrics.activeConnections} ${timestamp}`);

    // Agent metrics
    this.agentMetrics.forEach((agentMetrics, agentType) => {
      const agentLabel = `agent="${agentType}"`;

      metrics.push(`# HELP brewmaster_agent_tasks_processed_total Total tasks processed by agent`);
      metrics.push(`# TYPE brewmaster_agent_tasks_processed_total counter`);
      metrics.push(`brewmaster_agent_tasks_processed_total{${agentLabel}} ${agentMetrics.tasksProcessed} ${timestamp}`);

      metrics.push(`# HELP brewmaster_agent_tasks_successful_total Successful tasks by agent`);
      metrics.push(`# TYPE brewmaster_agent_tasks_successful_total counter`);
      metrics.push(`brewmaster_agent_tasks_successful_total{${agentLabel}} ${agentMetrics.tasksSuccessful} ${timestamp}`);

      metrics.push(`# HELP brewmaster_agent_queue_length Current queue length for agent`);
      metrics.push(`# TYPE brewmaster_agent_queue_length gauge`);
      metrics.push(`brewmaster_agent_queue_length{${agentLabel}} ${agentMetrics.queueLength} ${timestamp}`);
    });

    // System metrics
    const systemMetrics = this.getSystemMetrics();
    metrics.push(`# HELP brewmaster_memory_usage_bytes Memory usage in bytes`);
    metrics.push(`# TYPE brewmaster_memory_usage_bytes gauge`);
    metrics.push(`brewmaster_memory_usage_bytes ${systemMetrics.memoryUsage} ${timestamp}`);

    metrics.push(`# HELP brewmaster_cpu_usage CPU usage percentage`);
    metrics.push(`# TYPE brewmaster_cpu_usage gauge`);
    metrics.push(`brewmaster_cpu_usage ${systemMetrics.cpuUsage} ${timestamp}`);

    return metrics.join('\n');
  }

  private collectSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    
    return {
      cpuUsage: this.getCPUUsage(),
      memoryUsage: memoryUsage.rss,
      memoryTotal: memoryUsage.rss + memoryUsage.external,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      eventLoopLag: this.getEventLoopLag(),
      uptime: process.uptime()
    };
  }

  private getCPUUsage(): number {
    // Simplified CPU usage - in production you might want to use a proper library
    const usage = process.cpuUsage();
    return (usage.user + usage.system) / 1000000; // Convert to milliseconds
  }

  private getEventLoopLag(): number {
    const start = process.hrtime.bigint();
    return new Promise<number>(resolve => {
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
        resolve(lag);
      });
    }) as any; // Simplified for demo - use proper async handling in production
  }

  private calculateResponseTimePercentiles(): void {
    if (this.responseTimes.length === 0) return;

    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.ceil(sortedTimes.length * 0.95) - 1;
    const p99Index = Math.ceil(sortedTimes.length * 0.99) - 1;

    this.performanceMetrics.p95ResponseTime = sortedTimes[p95Index] || 0;
    this.performanceMetrics.p99ResponseTime = sortedTimes[p99Index] || 0;
  }

  // Cleanup
  stop(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }

    this.removeAllListeners();
    logger.info('Metrics service stopped');
  }
}