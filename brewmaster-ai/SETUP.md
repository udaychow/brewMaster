# BrewMaster AI - Complete Setup Guide

🍺 **BrewMaster AI is now fully developed and ready for use!**

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ and npm
- Git

### 1. Initial Setup
```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd brewmaster-ai

# Install dependencies
npm install --legacy-peer-deps

# Copy environment variables
cp .env.example .env
```

### 2. Configure Environment Variables
Edit `.env` file with your API keys:
```bash
# Required for AI features
CLAUDE_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key

# Optional external integrations
SQUARE_ACCESS_TOKEN=your-square-token
QUICKBOOKS_CLIENT_ID=your-quickbooks-id
QUICKBOOKS_CLIENT_SECRET=your-quickbooks-secret
```

### 3. Start the Development Environment
```bash
# Start all services with Docker
npm run start:dev
```

This will:
- Build and start all Docker containers
- Run database migrations
- Seed the database with sample data
- Start all microservices and the web dashboard

### 4. Access the Application

**Web Dashboard**: http://localhost:3001
- **Admin Login**: admin@brewmaster.ai / admin123  
- **Brewer Login**: brewer@brewmaster.ai / brewer123

**API Gateway**: http://localhost:3000

**Individual Services**:
- Production Service: http://localhost:3003
- AI Orchestrator: http://localhost:3004  
- Inventory Service: http://localhost:3005
- Compliance Service: http://localhost:3006
- Customer Service: http://localhost:3007
- Financial Service: http://localhost:3008

**Databases**:
- PostgreSQL: localhost:5432 (brewmaster/brewmaster123)
- Redis: localhost:6379
- InfluxDB: http://localhost:8086
- MongoDB: localhost:27017

## 🏗️ Architecture Overview

### Services Implemented
✅ **API Gateway** - Authentication, routing, rate limiting  
✅ **Web Dashboard** - React frontend with full CRUD operations  
✅ **Production Service** - Batch management, recipes, fermentation tracking  
✅ **AI Orchestrator** - 5 specialized AI agents with Claude integration  
✅ **Inventory Service** - Stock management, supplier relations  
✅ **Compliance Service** - License tracking, regulatory reporting  
✅ **Customer Service** - Customer management, reservations  
✅ **Financial Service** - Transaction tracking, financial reporting  

### Key Features
- 🤖 **5 AI Agents** with 37 specialized capabilities
- 🗄️ **Complete Database Schema** with 20+ tables
- 🔐 **JWT Authentication** with role-based access
- 📊 **Real-time Dashboard** with charts and analytics
- 🐳 **Docker Containerization** for easy deployment
- 📱 **Responsive UI** built with React + TailwindCSS
- 🔧 **Comprehensive API** with proper validation and error handling

## 🛠️ Development Commands

```bash
# Start development environment
npm run start:dev

# Stop all services  
npm run stop:dev

# View logs
npm run logs

# Database operations
npm run db:migrate    # Run migrations
npm run db:seed       # Seed with sample data
npm run db:generate   # Generate Prisma client
npm run db:reset      # Reset database

# Individual services (if not using Docker)
npm run dev:gateway   # API Gateway only
npm run dev:dashboard # Web Dashboard only
npm run dev:services  # All microservices
```

## 🎯 What's Implemented

### Frontend (React Dashboard)
- ✅ Authentication system with login/register
- ✅ Production management (batches, recipes, fermentation)
- ✅ Inventory management (ingredients, suppliers, orders)  
- ✅ Customer management (customers, reservations)
- ✅ Compliance dashboard (licenses, reports)
- ✅ Financial dashboard (transactions, analytics)
- ✅ AI agents dashboard (task management)
- ✅ Real-time charts and data visualization
- ✅ Responsive mobile-friendly design

### Backend Services
- ✅ **Production Service**: Complete batch lifecycle management
- ✅ **AI Orchestrator**: 5 specialized agents with Claude AI
- ✅ **Inventory Service**: Stock tracking and automated ordering
- ✅ **Compliance Service**: Regulatory monitoring and reporting
- ✅ **Customer Service**: CRM and reservation system
- ✅ **Financial Service**: Transaction and financial analytics

### AI Capabilities
- 🧠 **Production Planning Agent**: Brewing optimization, scheduling
- 📦 **Inventory Intelligence Agent**: Stock forecasting, supplier analysis  
- ⚖️ **Compliance Agent**: Regulatory monitoring, license tracking
- 👥 **Customer Experience Agent**: Personalization, journey optimization
- 💰 **Financial Operations Agent**: Cost analysis, profitability insights

### Database & Infrastructure
- ✅ PostgreSQL with Prisma ORM
- ✅ Redis for caching and queues
- ✅ InfluxDB for time-series sensor data
- ✅ MongoDB for document storage
- ✅ Kafka for event streaming
- ✅ Docker Compose for orchestration

## 🔧 Customization

### Adding New Features
1. **New Service**: Copy existing service structure
2. **New AI Agent**: Extend base agent class
3. **New Dashboard Page**: Add to React router
4. **New Database Table**: Update Prisma schema

### Configuration
- **Environment**: Edit `.env` file
- **Database Schema**: Modify `packages/database/prisma/schema.prisma`
- **AI Prompts**: Update agent prompt templates
- **UI Theme**: Customize TailwindCSS configuration

## 🚨 Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check Docker is running
docker info

# Reset containers
npm run stop:dev
docker system prune
npm run start:dev
```

**Database connection issues:**
```bash
# Reset database
npm run db:reset
npm run db:migrate
npm run db:seed
```

**Package installation issues:**
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Getting Help
- Check service logs: `npm run logs [service-name]`
- Database health: http://localhost:3000/health
- Service endpoints: All services have `/health` endpoints

## 🎉 You're Ready!

The BrewMaster AI system is now fully operational with:
- **Complete microservices architecture**
- **AI-powered automation** 
- **Modern React dashboard**
- **Production-ready database schema**
- **Docker containerization**
- **Comprehensive API documentation**

Access the dashboard at http://localhost:3001 and start managing your brewery with AI! 🍺

---
*For additional support or feature requests, check the project documentation or create an issue.*