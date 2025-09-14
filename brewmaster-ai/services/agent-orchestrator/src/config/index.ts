import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3019,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Claude API
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Queue settings
  queueSettings: {
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
  },
  
  // Agent settings
  agents: {
    defaultModel: 'claude-3-sonnet-20240229',
    defaultMaxTokens: 4000,
    defaultTemperature: 0.7,
    contextRetentionDays: 30,
  },
  
  // Rate limiting
  rateLimits: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
    ai: {
      windowMs: 60 * 1000, // 1 minute
      max: 10, // limit AI requests to 10 per minute
    },
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};

export default config;