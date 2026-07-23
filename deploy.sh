#!/usr/bin/env bash
set -e

echo "=================================================="
echo "🚀 Accelirate Exam Platform - Production Deployment"
echo "=================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker command not found. Please install Docker first."
    exit 1
fi

# Check for .env file without auto-creating it
if [ -f .env ]; then
    STORAGE_SETTING=$(grep -E '^(STORAGE_PROVIDER|StorageProvider)=' .env | cut -d '=' -f2 | tr -d '\r"' || echo "csv")
    echo "📋 Detected StorageProvider setting in .env: '${STORAGE_SETTING}'"
else
    echo "ℹ️ .env file not found. Continuing with container environment defaults (copy .env when needed)."
    STORAGE_SETTING="csv"
fi

# 1. Production Lint Validation
echo ""
echo "🔍 Running production lint validation (npm run lint)..."
if command -v npm &> /dev/null; then
    npm run lint || {
        echo "❌ Production Validation Failed: ESLint checks failed."
        exit 1
    }
    echo "✓ Lint validation passed successfully."
else
    echo "⚠️ npm command not found locally. Skipping local lint check (Docker multi-stage build will validate)."
fi

# 2. Production Build Validation
echo ""
echo "🏗️ Running production build validation (npm run build)..."
if command -v npm &> /dev/null; then
    npm run build || {
        echo "❌ Production Validation Failed: Next.js build failed."
        exit 1
    }
    echo "✓ Build validation passed successfully."
else
    echo "⚠️ npm command not found locally. Skipping local build check (Docker multi-stage build will validate)."
fi

# Determine docker compose binary command
DOCKER_COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "❌ Error: Neither 'docker compose' nor 'docker-compose' is installed."
    exit 1
fi

echo ""
echo "📦 Building Docker image and starting production services ($DOCKER_COMPOSE_CMD)..."
$DOCKER_COMPOSE_CMD up --build -d

echo ""
echo "=================================================="
echo "✅ Production deployment completed successfully!"
echo "📍 Application URL: http://localhost:3000"
echo "=================================================="
echo "To view live logs from the app container, run:"
echo "   $DOCKER_COMPOSE_CMD logs -f app"
echo "=================================================="
