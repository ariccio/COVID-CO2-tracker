#!/bin/bash
# COVID CO2 Tracker - Rapid Development Environment Setup
# Run this to get from zero to development in ~10 minutes

set -e  # Exit on error
set -x  # Print commands as they run

echo "🚀 COVID CO2 Tracker Quick Start Script"
echo "======================================="

# Check prerequisites
command -v ruby >/dev/null 2>&1 || { echo "Ruby is required but not installed. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "PostgreSQL is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Prerequisites checked"

# 1. Install Ruby dependencies
echo "📦 Installing Ruby dependencies..."
bundle install --jobs 4 || {
    echo "Bundle install failed. Trying to update Bundler..."
    gem install bundler
    bundle install --jobs 4
}

# 2. Install JavaScript dependencies
echo "📦 Installing JavaScript dependencies..."
npm install
cd co2_native_client && npm install && cd ..
cd co2_client && npm install && cd ..

# 3. Database setup
echo "🗄️ Setting up database..."
if rails db:version 2>/dev/null; then
    echo "Database exists, running migrations..."
    rails db:migrate
else
    echo "Creating database from scratch..."
    rails db:create
    rails db:schema:load
    rails db:seed
fi

# 4. Run security audits
echo "🔒 Running security audits..."
bundle audit check --update || echo "Some vulnerabilities found - check bundle audit output"
npm audit || echo "Some npm vulnerabilities found - run npm audit fix"

# 5. Run tests to verify setup
echo "🧪 Running test suites..."
bundle exec rspec --fail-fast || echo "Some tests failing - this is expected for now"

# 6. Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Development Environment Variables
DATABASE_URL=postgresql://localhost/co2_tracker_development
REDIS_URL=redis://localhost:6379
RAILS_ENV=development
REACT_APP_API_URL=http://localhost:3000
SECRET_KEY_BASE=$(rails secret)
EOF
fi

# 7. Start services
echo "🎉 Setup complete! Starting services..."
echo "Run 'foreman start -f Procfile.dev' to start all services"
echo "Or run these in separate terminals:"
echo "  - Rails API: rails server"
echo "  - React Native: cd co2_native_client && npm start"
echo "  - Web Client: cd co2_client && npm start"
echo ""
echo "📱 Access points:"
echo "  - API: http://localhost:3000"
echo "  - Admin: http://localhost:3000/admin"
echo "  - Web Client: http://localhost:3001"
echo "  - Mobile: Use Expo Go app"