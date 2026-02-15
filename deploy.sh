#!/bin/bash
echo "🚀 Starting deployment..."

# Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# Rebuild containers
echo "🏗️ Rebuilding Docker containers..."
docker-compose build backend frontend

# Restart services
echo "nhRestarting services..."
docker-compose up -d

echo "✅ Deployment complete!"
echo "📜 Check logs with: docker-compose logs -f backend"
