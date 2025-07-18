#!/bin/bash

# Audio Transcription API Startup Script
echo "🚀 Starting Audio Transcription API"
echo "=================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "Please copy .env.example to .env and update with your AssemblyAI API key"
    echo ""
    echo "cp .env.example .env"
    echo "# Then edit .env with your API key"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "Please start Docker and try again"
    exit 1
fi

# Build and start the application
echo "🏗️  Building and starting the application..."
docker-compose up --build

echo "✅ Application started!"
echo "📖 API Documentation: http://localhost:8000/docs"
echo "🔍 Health Check: http://localhost:8000/health"
