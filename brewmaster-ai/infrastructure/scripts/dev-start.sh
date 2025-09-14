#!/bin/bash
set -e

echo "🍺 Starting BrewMaster AI Development Environment"
echo "================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your API keys and secrets"
fi

# Build and start services
echo "🐳 Building and starting Docker services..."
docker-compose -f infrastructure/docker/docker-compose.dev.yml up --build -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose -f infrastructure/docker/docker-compose.dev.yml exec -T postgres pg_isready -U brewmaster > /dev/null 2>&1; do
    sleep 2
done

# Run database migrations
echo "🗄️  Running database migrations..."
npm run db:migrate

# Seed the database with initial data
echo "🌱 Seeding database with initial data..."
npm run db:seed

echo "✅ Development environment is ready!"
echo ""
echo "🌐 Services available at:"
echo "   - API Gateway:     http://localhost:3000"
echo "   - Web Dashboard:   http://localhost:3001" 
echo "   - Production:      http://localhost:3003"
echo "   - AI Orchestrator: http://localhost:3004"
echo "   - Inventory:       http://localhost:3005"
echo "   - Compliance:      http://localhost:3006"
echo "   - Customer:        http://localhost:3007"
echo "   - Financial:       http://localhost:3008"
echo ""
echo "📊 Database interfaces:"
echo "   - PostgreSQL:      localhost:5432"
echo "   - Redis:           localhost:6379"
echo "   - InfluxDB:        http://localhost:8086"
echo "   - MongoDB:         localhost:27017"
echo ""
echo "📝 To view logs:"
echo "   docker-compose -f infrastructure/docker/docker-compose.dev.yml logs -f [service-name]"
echo ""
echo "🛑 To stop:"
echo "   npm run stop:local"