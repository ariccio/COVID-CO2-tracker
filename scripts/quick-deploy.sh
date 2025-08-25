#!/bin/bash
# Quick deployment script for COVID CO2 Tracker

set -e

echo "🚀 Starting quick deployment..."

# Run tests
echo "Running tests..."
bundle exec rspec --fail-fast || {
    echo "❌ Tests failed! Fix before deploying."
    exit 1
}

# Check for security issues
echo "Checking security..."
bundle audit check || echo "⚠️  Security warnings found"

# Deploy
echo "Deploying to production..."
git push heroku main

# Run migrations
echo "Running migrations..."
heroku run rails db:migrate

# Verify deployment
echo "Verifying deployment..."
curl -s https://your-app.herokuapp.com/api/v1/health || echo "⚠️  Health check failed"

echo "✅ Deployment complete!"
