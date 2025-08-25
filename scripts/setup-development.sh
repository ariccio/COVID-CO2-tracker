#!/bin/bash
# Development environment setup for COVID CO2 Tracker

set -e

echo "🔧 Setting up development environment..."

# Ruby dependencies
bundle install

# JavaScript dependencies
npm install
cd co2_native_client && npm install && cd ..
cd co2_client && npm install && cd ..

# Database setup
rails db:create db:migrate db:seed

# Create .env file if missing
if [ ! -f .env ]; then
    cat > .env << 'ENVFILE'
DATABASE_URL=postgresql://localhost/co2_tracker_development
REDIS_URL=redis://localhost:6379
RAILS_ENV=development
ENVFILE
    echo "✅ Created .env file"
fi

echo "✅ Development environment ready!"
echo "Run 'rails s' to start the API"
echo "Run 'cd co2_native_client && npm start' for mobile"
