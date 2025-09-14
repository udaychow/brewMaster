import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authRouter } from './routes/auth.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rateLimit.middleware';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());
app.use(rateLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway' });
});

app.use('/api/auth', authRouter);

const services = [
  {
    route: '/api/production',
    target: `http://localhost:${process.env.PRODUCTION_SERVICE_PORT || 3003}`,
    service: 'production-service'
  },
  {
    route: '/api/inventory',
    target: `http://localhost:${process.env.INVENTORY_SERVICE_PORT || 3005}`,
    service: 'inventory-service'
  },
  {
    route: '/api/compliance',
    target: `http://localhost:${process.env.COMPLIANCE_SERVICE_PORT || 3006}`,
    service: 'compliance-service'
  },
  {
    route: '/api/customer',
    target: `http://localhost:${process.env.CUSTOMER_SERVICE_PORT || 3007}`,
    service: 'customer-service'
  },
  {
    route: '/api/financial',
    target: `http://localhost:${process.env.FINANCIAL_SERVICE_PORT || 3008}`,
    service: 'financial-service'
  },
  {
    route: '/api/ai',
    target: `http://localhost:${process.env.AGENT_ORCHESTRATOR_PORT || 3004}`,
    service: 'agent-orchestrator'
  }
];

services.forEach(({ route, target, service }) => {
  app.use(
    route,
    authMiddleware,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^${route}`]: '' },
      onProxyReq: (proxyReq, req: any) => {
        if (req.user) {
          proxyReq.setHeader('X-User-Id', req.user.id);
          proxyReq.setHeader('X-User-Role', req.user.role);
        }
      },
      onError: (err, req, res: any) => {
        logger.error(`Proxy error for ${service}:`, err);
        res.status(502).json({ error: `${service} is unavailable` });
      }
    })
  );
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});