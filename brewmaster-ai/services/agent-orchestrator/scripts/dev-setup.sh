#!/bin/bash

# BrewMaster AI Agent Orchestrator - Development Setup Script

set -e

echo "🍺 BrewMaster AI Agent Orchestrator - Development Setup"
echo "======================================================"

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null || echo "not found")
if [[ "$NODE_VERSION" == "not found" ]]; then
    echo "❌ Node.js not found. Please install Node.js 18 or higher."
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ package.json not found. Please run this script from the agent-orchestrator directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [[ ! -f ".env" ]]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before running the service."
fi

# Check PostgreSQL connection
echo "🗄️  Checking database connection..."
if [[ -z "$DATABASE_URL" ]]; then
    echo "⚠️  DATABASE_URL not set in environment. Please configure your database."
else
    echo "✅ Database URL configured"
fi

# Check Redis
echo "📡 Checking Redis connection..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis is not running. Starting Redis with Docker..."
        docker run -d --name brewmaster-redis -p 6379:6379 redis:7-alpine || echo "❌ Failed to start Redis. Please start Redis manually."
    fi
else
    echo "⚠️  Redis CLI not found. Please install Redis or start it with Docker:"
    echo "   docker run -d --name brewmaster-redis -p 6379:6379 redis:7-alpine"
fi

# Check Anthropic API Key
if [[ -z "$ANTHROPIC_API_KEY" ]]; then
    echo "⚠️  ANTHROPIC_API_KEY not set. Please configure your Claude API key in .env"
else
    echo "✅ Claude API key configured"
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your .env file with the correct values"
echo "2. Ensure your database is set up and accessible"
echo "3. Start the service with: npm run dev"
echo ""
echo "🔗 Useful commands:"
echo "   npm run dev     - Start in development mode"
echo "   npm run build   - Build for production"
echo "   npm start       - Start in production mode"
echo "   npm test        - Run tests"
echo ""
echo "📚 API Documentation: http://localhost:3019/api/docs"
echo "💓 Health Check: http://localhost:3019/api/v1/health"
echo ""