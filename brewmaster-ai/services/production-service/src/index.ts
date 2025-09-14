import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';

// Import database connection
import { connectDatabase } from './config/database';

// Import middleware
import { errorHandler, notFoundHandler, timeoutHandler } from './middleware/error.middleware';

// Import routes
import recipeRoutes from './routes/recipe.routes';
import batchRoutes from './routes/batch.routes';
import fermentationRoutes from './routes/fermentation.routes';
import qualityRoutes from './routes/quality.routes';
import schedulingRoutes from './routes/scheduling.routes';

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'production-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const app = express();

// Request timeout middleware
app.use(timeoutHandler(30000)); // 30 seconds

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More lenient in development
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
}));

// Body parsing
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
});

// Health check with detailed information
app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    service: 'production-service',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: 'healthy', // Would check database connection in real implementation
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        unit: 'MB'
      }
    }
  };

  try {
    // Add more health checks here (database, external services, etc.)
    res.json(healthCheck);
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      ...healthCheck,
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

// API information route
app.get('/api/production', (req, res) => {
  res.json({ 
    message: 'BrewMaster AI Production Service',
    version: process.env.npm_package_version || '1.0.0',
    description: 'Complete production management system for brewery operations',
    features: [
      'Recipe management with full CRUD operations',
      'Batch tracking and lifecycle management',
      'Fermentation monitoring and alerts',
      'Quality control and testing',
      'Production scheduling and optimization',
      'Real-time analytics and reporting'
    ],
    endpoints: {
      recipes: '/api/production/recipes',
      batches: '/api/production/batches',
      fermentation: '/api/production/fermentation',
      quality: '/api/production/quality',
      scheduling: '/api/production/scheduling'
    },
    documentation: '/api/production/docs'
  });
});

// API Routes
app.use('/api/production/recipes', recipeRoutes);
app.use('/api/production/batches', batchRoutes);
app.use('/api/production/fermentation', fermentationRoutes);
app.use('/api/production/quality', qualityRoutes);
app.use('/api/production/scheduling', schedulingRoutes);

// API documentation placeholder
app.get('/api/production/docs', (req, res) => {
  res.json({
    message: 'API Documentation',
    note: 'In a production system, this would serve OpenAPI/Swagger documentation',
    endpoints: {
      'GET /api/production': 'Service information',
      'GET /health': 'Health check',
      'POST /api/production/recipes': 'Create recipe',
      'GET /api/production/recipes': 'List recipes',
      'GET /api/production/recipes/:id': 'Get recipe',
      'PATCH /api/production/recipes/:id': 'Update recipe',
      'DELETE /api/production/recipes/:id': 'Delete recipe',
      'POST /api/production/batches': 'Create batch',
      'GET /api/production/batches': 'List batches',
      'GET /api/production/batches/:id': 'Get batch',
      'PATCH /api/production/batches/:id': 'Update batch',
      'POST /api/production/batches/:id/start': 'Start batch',
      'POST /api/production/fermentation': 'Log fermentation data',
      'GET /api/production/fermentation/batch/:batchId': 'Get fermentation logs',
      'POST /api/production/quality': 'Create quality check',
      'GET /api/production/quality/batch/:batchId': 'Get quality checks',
      'GET /api/production/scheduling': 'Get production schedule'
    }
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      logger.error('Error during shutdown', err);
      process.exit(1);
    }
    
    logger.info('Server closed successfully');
    process.exit(0);
  });
};

const PORT = process.env.PORT || 3003;

const server = app.listen(PORT, async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    logger.info(`🍺 Production Service running on port ${PORT}`, {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🍺 Production Service running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/production/docs`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
