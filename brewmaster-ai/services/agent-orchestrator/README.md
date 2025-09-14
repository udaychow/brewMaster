# BrewMaster AI Agent Orchestrator

A comprehensive AI agent orchestration service for the BrewMaster brewery management system. This service manages multiple specialized AI agents powered by Claude AI to optimize brewery operations across production planning, inventory management, compliance, customer experience, and financial operations.

## Features

### 🤖 Specialized AI Agents
- **Production Planning Agent**: Optimizes brewing schedules and resource allocation
- **Inventory Intelligence Agent**: Manages stock levels and procurement strategies
- **Compliance Agent**: Monitors regulatory compliance and licensing requirements
- **Customer Experience Agent**: Analyzes customer behavior and optimizes experiences
- **Financial Operations Agent**: Performs cost analysis and profitability optimization

### 🚀 Core Capabilities
- **Task Queue Management**: Priority-based task distribution with retry logic
- **Real-time Processing**: Concurrent task execution with configurable limits
- **Memory Management**: Short-term and long-term memory for agent context
- **Database Integration**: Persistent task storage and result tracking
- **Comprehensive Monitoring**: Metrics collection and health monitoring
- **RESTful API**: Full REST API for agent interactions and task management

### 📊 Monitoring & Observability
- Prometheus metrics export
- Request/response tracking
- Agent performance metrics
- System health monitoring
- Structured logging with Winston

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                Agent Orchestrator                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Task Queue   │ │ Agent Memory │ │ Metrics      │        │
│  │ Management   │ │ Management   │ │ Collection   │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────┬───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│                     AI Agents                               │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │ Production  │ │ Inventory   │ │ Compliance  │ │Customer │ │
│ │ Planning    │ │Intelligence │ │   Agent     │ │Experience│ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│ ┌─────────────┐                                             │
│ │ Financial   │                                             │
│ │ Operations  │                                             │
│ └─────────────┘                                             │
└─────────┬───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│              External Integrations                          │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ Claude AI   │ │ Database    │ │ Redis Queue │            │
│ │ API         │ │ (PostgreSQL)│ │             │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+
- Claude API key from Anthropic

### Setup

1. **Clone the repository**
   ```bash
   cd /path/to/brewmaster-ai/services/agent-orchestrator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   - Ensure PostgreSQL is running
   - Create the BrewMaster database (if not already created)
   - Run database migrations from the main project

5. **Start Redis**
   ```bash
   # Using Docker
   docker run -d --name redis -p 6379:6379 redis:7-alpine
   
   # Or using local Redis installation
   redis-server
   ```

6. **Start the service**
   ```bash
   # Development mode with hot reload
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3019` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `ANTHROPIC_API_KEY` | Claude AI API key | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | `info` |

### Agent Configuration

Each agent can be configured with different concurrency limits and parameters:

```typescript
{
  maxConcurrentTasks: {
    production_planning: 2,
    inventory_intelligence: 3,
    compliance: 1,
    customer_experience: 2,
    financial_operations: 1
  }
}
```

## API Usage

### Base URL
```
http://localhost:3019/api/v1
```

### Execute a Task

```bash
curl -X POST http://localhost:3019/api/v1/tasks/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "production_planning",
    "taskType": "optimize_brewing_schedule",
    "input": {
      "timeframe": 30,
      "constraints": {
        "maxBatches": 10
      }
    },
    "priority": "high"
  }'
```

### Get Task Status

```bash
curl http://localhost:3019/api/v1/tasks/{taskId}
```

### Get Agent Metrics

```bash
curl http://localhost:3019/api/v1/agents/production_planning/metrics
```

### Health Check

```bash
curl http://localhost:3019/api/v1/health
```

## Agent Capabilities

### Production Planning Agent
- `optimize_brewing_schedule`: Create optimal brewing schedules
- `analyze_production_efficiency`: Analyze current production efficiency
- `plan_batch_sequencing`: Optimize batch sequence timing
- `forecast_resource_needs`: Forecast ingredient requirements
- `assess_capacity_utilization`: Analyze facility capacity usage

### Inventory Intelligence Agent
- `optimize_inventory_levels`: Calculate optimal stock levels
- `forecast_demand`: Predict ingredient demand patterns
- `analyze_supplier_performance`: Evaluate supplier reliability
- `identify_procurement_opportunities`: Find cost-saving opportunities
- `assess_stock_risks`: Identify inventory risks
- `optimize_purchasing_timing`: Optimize purchase timing

### Compliance Agent
- `monitor_license_status`: Track license renewals and compliance
- `assess_regulatory_compliance`: Comprehensive compliance assessment
- `generate_compliance_report`: Generate audit reports
- `calculate_excise_taxes`: Calculate tax obligations
- `validate_labeling_compliance`: Validate product labels
- `track_regulatory_changes`: Monitor regulatory updates
- `manage_recalls`: Coordinate product recall procedures

### Customer Experience Agent
- `analyze_customer_behavior`: Analyze customer patterns
- `optimize_customer_journey`: Improve customer touchpoints
- `generate_personalized_recommendations`: Create personalized experiences
- `analyze_customer_feedback`: Process feedback and sentiment
- `optimize_loyalty_program`: Improve loyalty programs
- `plan_customer_events`: Plan engaging customer events
- `assess_service_quality`: Evaluate service performance

### Financial Operations Agent
- `analyze_product_costs`: Analyze product profitability
- `assess_profitability`: Multi-dimensional profitability analysis
- `forecast_cash_flow`: Predict cash flow requirements
- `optimize_pricing_strategy`: Optimize product pricing
- `analyze_financial_performance`: Comprehensive financial analysis
- `evaluate_investment_opportunities`: Assess investment ROI
- `manage_working_capital`: Optimize working capital

## Monitoring

### Metrics Endpoints

- **Prometheus metrics**: `GET /metrics` (with `Accept: text/plain`)
- **JSON metrics**: `GET /metrics` (with `Accept: application/json`)
- **System info**: `GET /api/v1/info`
- **Orchestrator stats**: `GET /api/v1/stats`

### Health Checks

The service provides comprehensive health monitoring:
- Database connectivity
- Redis queue health
- Agent responsiveness
- System resource usage

## Development

### Project Structure

```
src/
├── agents/                 # AI agent implementations
│   ├── base.agent.ts      # Base agent class
│   ├── production-planning.agent.ts
│   ├── inventory-intelligence.agent.ts
│   ├── compliance.agent.ts
│   ├── customer-experience.agent.ts
│   └── financial-operations.agent.ts
├── config/                 # Configuration
├── controllers/            # API controllers
├── integrations/          # External service integrations
├── middleware/            # Express middleware
├── monitoring/            # Metrics and monitoring
├── orchestrator/          # Main orchestration logic
├── queue/                 # Task queue management
├── routes/                # API routes
├── services/              # Business services
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Building for Production

```bash
npm run build
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3019
CMD ["npm", "start"]
```

### Environment Setup

1. Set up PostgreSQL database
2. Set up Redis cluster
3. Configure environment variables
4. Deploy with your preferred orchestration tool (Kubernetes, Docker Compose, etc.)

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Ensure database is running and accessible
   - Check if database migrations are up to date

2. **Redis Connection Issues**
   - Verify Redis is running
   - Check REDIS_URL configuration
   - Ensure Redis version compatibility (6+)

3. **Claude API Issues**
   - Verify ANTHROPIC_API_KEY is valid
   - Check API quota and limits
   - Monitor rate limiting logs

4. **High Memory Usage**
   - Review agent memory settings
   - Check for memory leaks in task processing
   - Monitor queue sizes

### Logging

The service uses structured logging with Winston. Logs include:
- Request/response tracking
- Agent execution metrics
- Error details with stack traces
- Performance metrics

Log levels: `error`, `warn`, `info`, `debug`

### Performance Tuning

1. **Adjust Concurrency**: Modify `maxConcurrentTasks` per agent
2. **Queue Management**: Configure Redis memory settings
3. **Database Optimization**: Ensure proper indexing and connection pooling
4. **Memory Management**: Tune agent memory retention settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is part of the BrewMaster AI system. See the main project LICENSE file for details.