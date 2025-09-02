#!/bin/bash

# Deploy Export System to Heroku Production
# This script configures and deploys the export system with all production settings

set -e  # Exit on error

echo "================================================"
echo "COVID CO2 Tracker Export System Deployment"
echo "================================================"

# Check if logged into Heroku
if ! heroku whoami &> /dev/null; then
    echo "❌ Not logged into Heroku. Please run: heroku login"
    exit 1
fi

APP_NAME="covid-co2-tracker"

echo ""
echo "📋 Pre-deployment checklist:"
echo "----------------------------"

# 1. Set critical environment variables
echo "1️⃣ Setting critical Heroku config variables..."

# CRITICAL: Rails 7.1 on 512MB requires WEB_CONCURRENCY=1
heroku config:set WEB_CONCURRENCY=1 --app $APP_NAME
echo "   ✅ WEB_CONCURRENCY set to 1 (critical for Rails 7.1 on 512MB)"

# Set other important configs
heroku config:set RAILS_MAX_THREADS=5 --app $APP_NAME
echo "   ✅ RAILS_MAX_THREADS set to 5"

heroku config:set RAILS_LOG_TO_STDOUT=enabled --app $APP_NAME
echo "   ✅ RAILS_LOG_TO_STDOUT enabled"

# Enable preboot for zero-downtime deploys
heroku features:enable preboot --app $APP_NAME
echo "   ✅ Preboot enabled for zero-downtime deploys"

echo ""
echo "2️⃣ Checking database status..."
heroku pg:info --app $APP_NAME

echo ""
echo "3️⃣ Current dyno configuration:"
heroku ps --app $APP_NAME

echo ""
echo "4️⃣ Preparing deployment..."

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "   Consider committing before deployment"
    read -p "   Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

echo ""
echo "5️⃣ Deploying to Heroku..."
echo "----------------------------"

# Push to Heroku
git push heroku main

echo ""
echo "6️⃣ Running database migrations..."
heroku run rails db:migrate --app $APP_NAME

echo ""
echo "7️⃣ Verifying deployment..."

# Check app status
heroku ps --app $APP_NAME

# Check recent logs for errors
echo ""
echo "Recent logs (checking for errors):"
heroku logs --tail -n 50 --app $APP_NAME | grep -E "(ERROR|FATAL|crashed)" || echo "   ✅ No critical errors found"

echo ""
echo "8️⃣ Creating production export token..."
echo "----------------------------"

# Generate a secure token
EXPORT_TOKEN=$(openssl rand -hex 32)
echo "Generated token: $EXPORT_TOKEN"
echo ""
echo "To set this token in production, run:"
echo "heroku config:set EXPORT_TOKENS=$EXPORT_TOKEN --app $APP_NAME"
echo ""
echo "Save this token securely - you'll need it for API access!"

echo ""
echo "================================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Set the export token using the command above"
echo "2. Test export endpoints with:"
echo "   curl -H 'Authorization: Bearer YOUR_TOKEN' https://$APP_NAME.herokuapp.com/api/v1/exports/csv"
echo "3. Monitor performance with:"
echo "   heroku logs --tail --app $APP_NAME"
echo "4. Check memory usage with:"
echo "   heroku run 'ps aux' --app $APP_NAME"
echo ""
echo "⚠️  IMPORTANT REMINDERS:"
echo "   - WEB_CONCURRENCY=1 is CRITICAL for Rails 7.1 on 512MB"
echo "   - Monitor memory usage closely during exports"
echo "   - Rate limiting is active (10 req/min per token)"
echo "   - Indexes will be created on first migration"
echo ""
echo "📚 Documentation: docs/api/export-endpoints.md"
echo "🐛 Issues: https://github.com/your-org/COVID-CO2-tracker/issues"