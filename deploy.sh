#!/usr/bin/env bash
set -e

echo "=================================================="
echo "🚀 Accelirate Exam Platform - Docker Deployment"
echo "=================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker command not found. Please install Docker first."
    exit 1
fi

# Ensure .env exists
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "⚠️ .env file not found. Creating from .env.example..."
        cp .env.example .env
    else
        echo "⚠️ .env file not found. Generating default .env file..."
        cat <<EOT > .env
STORAGE_PROVIDER=csv
DATABASE_URL=postgres://postgres:postgres@postgres:5432/exam_platform
PGHOST=postgres
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=exam_platform
ADMIN_EMAIL=admin
ADMIN_PASSWORD=Admin@260723
JWT_SECRET=exam-platform-dev-secret-key-2026
EOT
    fi
fi

# Extract StorageProvider setting for display
STORAGE_SETTING=$(grep -E '^(STORAGE_PROVIDER|StorageProvider)=' .env | cut -d '=' -f2 | tr -d '\r"' || echo "csv")
echo "📋 Detected StorageProvider setting in .env: '${STORAGE_SETTING}'"

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

echo "📦 Building Docker image and starting services ($DOCKER_COMPOSE_CMD)..."
$DOCKER_COMPOSE_CMD up --build -d

echo ""
echo "=================================================="
echo "✅ Deployment completed successfully!"
echo "📍 Application URL: http://localhost:3000"
echo "=================================================="
echo "To view live logs from the app container, run:"
echo "   $DOCKER_COMPOSE_CMD logs -f app"
echo "=================================================="
