#!/bin/bash
set -e

echo "🛑 Stopping BrewMaster AI Development Environment"
echo "================================================"

# Stop all services
docker-compose -f infrastructure/docker/docker-compose.dev.yml down

# Optional: Remove volumes (uncomment if you want to reset data)
# echo "🗑️  Removing volumes..."
# docker-compose -f infrastructure/docker/docker-compose.dev.yml down -v

echo "✅ Development environment stopped"