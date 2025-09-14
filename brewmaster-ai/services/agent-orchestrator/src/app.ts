import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AgentOrchestrator } from './orchestrator/agent-orchestrator';
import { createAgentRoutes } from './routes/agent.routes';
import { DatabaseService } from './services/database.service';
import { MetricsService } from './monitoring/metrics.service';
import { ErrorMiddleware } from './middleware/error.middleware';
import config from './config';
import logger from './utils/logger';

export class AgentOrchestratorApp {
  private app: express.Application;
  private orchestrator: AgentOrchestrator;
  private databaseService: DatabaseService;
  private metricsService: MetricsService;
  private server?: any;

  constructor() {
    this.app = express();
    this.databaseService = new DatabaseService();
    this.metricsService = new MetricsService();
    this.orchestrator = new AgentOrchestrator({
      maxConcurrentTasks: {
        production_planning: 2,
        inventory_intelligence: 3,
        compliance: 1,
        customer_experience: 2,
        financial_operations: 1
      },
      healthCheckInterval: 60000,
      enableScheduledTasks: true
    }, this.databaseService);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupGracefulShutdown();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      },
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      credentials: true,
      maxAge: 86400 // 24 hours
    }));

    // Body parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      strict: true
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // Request logging and metrics
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Add request ID to request object
      (req as any).requestId = requestId;
      res.setHeader('X-Request-ID', requestId);

      // Log request
      logger.info('Incoming request', {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        contentLength: req.get('Content-Length')
      });

      // Capture response metrics
      const originalSend = res.send;
      const app = this.app;
      res.send = function(data: any) {
        const duration = Date.now() - startTime;
        const success = res.statusCode < 400;

        // Record metrics
        app.locals.metricsService?.recordRequest(duration, success);

        // Log response
        logger.info('Request completed', {
          requestId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          success
        });

        return originalSend.call(res, data);
      };

      next();
    });

    // Make metrics service available to middleware
    this.app.locals.metricsService = this.metricsService;

    logger.info('Middleware setup completed');
  }

  private setupRoutes(): void {
    // Health check endpoint (before other middleware)
    this.app.get('/ping', (req, res) => {
      res.json({ 
        success: true, 
        message: 'pong', 
        timestamp: new Date().toISOString() 
      });
    });

    // Metrics endpoint for Prometheus
    this.app.get('/metrics', (req, res) => {
      const metricsFormat = req.headers.accept?.includes('text/plain') ? 'prometheus' : 'json';
      
      if (metricsFormat === 'prometheus') {
        res.set('Content-Type', 'text/plain');
        res.send(this.metricsService.exportPrometheusMetrics());
      } else {
        res.json({
          success: true,
          data: this.metricsService.getMetricsReport()
        });
      }
    });

    // API routes
    this.app.use('/api/v1', createAgentRoutes(this.orchestrator));

    // API documentation endpoint
    this.app.get('/api/docs', (req, res) => {
      res.json({
        success: true,
        data: {
          service: 'BrewMaster AI Agent Orchestrator',
          version: process.env.npm_package_version || '1.0.0',
          documentation: {
            openapi: '3.0.0',
            info: {
              title: 'BrewMaster AI Agent Orchestrator API',
              description: 'RESTful API for managing AI agents in the BrewMaster brewery management system',
              version: process.env.npm_package_version || '1.0.0'
            },
            servers: [
              {
                url: `http://localhost:${config.port}/api/v1`,
                description: 'Development server'
              }
            ],
            paths: this.generateOpenAPISchema()
          }
        }
      });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        data: {
          service: 'BrewMaster AI Agent Orchestrator',
          version: process.env.npm_package_version || '1.0.0',
          environment: config.nodeEnv,
          uptime: process.uptime(),
          endpoints: {
            health: '/api/v1/health',
            docs: '/api/docs',
            metrics: '/metrics'
          }
        }
      });
    });

    logger.info('Routes setup completed');
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(ErrorMiddleware.handleNotFound);

    // Global error handler
    this.app.use(ErrorMiddleware.handleError);

    // Process-level error handlers
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.stack });
      this.shutdown('SIGTERM');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { 
        reason: reason instanceof Error ? reason.stack : reason,
        promise 
      });
      this.shutdown('SIGTERM');
    });

    logger.info('Error handling setup completed');
  }

  private setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      this.shutdown(signal);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart

    logger.info('Graceful shutdown handlers setup completed');
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing Agent Orchestrator App...');

      // Initialize database service
      await this.databaseService.initialize();
      logger.info('Database service initialized');

      // Initialize orchestrator
      await this.orchestrator.initialize();
      logger.info('Agent orchestrator initialized');

      // Setup metrics event listeners
      this.setupMetricsListeners();

      logger.info('Agent Orchestrator App initialization completed');
    } catch (error) {
      logger.error('Failed to initialize Agent Orchestrator App', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private setupMetricsListeners(): void {
    // Listen to orchestrator events for metrics
    this.metricsService.on('request-recorded', (data) => {
      logger.debug('Request metrics recorded', data);
    });

    this.metricsService.on('agent-task-recorded', (data) => {
      logger.debug('Agent task metrics recorded', data);
    });

    this.metricsService.on('system-metrics', (data) => {
      logger.debug('System metrics collected', data);
    });
  }

  public async start(): Promise<void> {
    try {
      await this.initialize();

      this.server = this.app.listen(config.port, () => {
        logger.info(`🚀 Agent Orchestrator running on port ${config.port}`, {
          port: config.port,
          environment: config.nodeEnv,
          processId: process.pid
        });
      });

      // Handle server errors
      this.server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${config.port} is already in use`);
        } else {
          logger.error('Server error', { error: error.message });
        }
        process.exit(1);
      });

    } catch (error) {
      logger.error('Failed to start Agent Orchestrator App', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      process.exit(1);
    }
  }

  public async shutdown(signal: string): Promise<void> {
    logger.info(`Starting graceful shutdown (${signal})...`);

    const shutdownTimeout = setTimeout(() => {
      logger.error('Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, 30000); // 30 second timeout

    try {
      // Stop accepting new requests
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
        });
      }

      // Shutdown orchestrator (which will close queues and agents)
      await this.orchestrator.shutdown();
      logger.info('Agent orchestrator shutdown completed');

      // Stop metrics service
      this.metricsService.stop();
      logger.info('Metrics service stopped');

      // Close database connections
      await this.databaseService.close();
      logger.info('Database connections closed');

      clearTimeout(shutdownTimeout);
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  }

  private generateOpenAPISchema(): any {
    // Simplified OpenAPI schema generation
    // In production, you might want to use swagger-jsdoc or similar
    return {
      '/health': {
        get: {
          summary: 'Health check',
          responses: {
            200: { description: 'Service is healthy' },
            503: { description: 'Service is unhealthy' }
          }
        }
      },
      '/tasks/execute': {
        post: {
          summary: 'Execute a task with an AI agent',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['agentType', 'taskType', 'input'],
                  properties: {
                    agentType: { type: 'string', enum: Object.values(['production_planning', 'inventory_intelligence', 'compliance', 'customer_experience', 'financial_operations']) },
                    taskType: { type: 'string' },
                    input: { type: 'object' },
                    priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'] },
                    userId: { type: 'string' },
                    sessionId: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            202: { description: 'Task queued for execution' },
            400: { description: 'Invalid request' },
            503: { description: 'Service unavailable' }
          }
        }
      }
      // Add more endpoints as needed
    };
  }

  // Getter for testing purposes
  public getApp(): express.Application {
    return this.app;
  }

  public getOrchestrator(): AgentOrchestrator {
    return this.orchestrator;
  }

  public getMetricsService(): MetricsService {
    return this.metricsService;
  }
}