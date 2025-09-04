#!/bin/bash

# Heroku PostgreSQL Upgrade Helper Script
# For COVID CO2 Tracker Production Database
# Created: 2025-01-05

set -euo pipefail

# Configuration
APP_NAME="${HEROKU_APP_NAME:-}"
TARGET_VERSION="${PG_VERSION:-16}"
COLOR_RED='\033[0;31m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RESET='\033[0m'

# Helper functions
log_info() {
    echo -e "${COLOR_GREEN}[INFO]${COLOR_RESET} $1"
}

log_warn() {
    echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET} $1"
}

log_error() {
    echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Heroku CLI version
    if ! command -v heroku &> /dev/null; then
        log_error "Heroku CLI not installed!"
        exit 1
    fi
    
    HEROKU_VERSION=$(heroku --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    log_info "Heroku CLI version: $HEROKU_VERSION"
    
    # Check app name
    if [[ -z "$APP_NAME" ]]; then
        read -p "Enter Heroku app name: " APP_NAME
    fi
    
    log_info "Target app: $APP_NAME"
    log_info "Target PostgreSQL version: $TARGET_VERSION"
}

pre_upgrade_checks() {
    log_info "Running pre-upgrade checks..."
    
    # Get database info
    log_info "Fetching database information..."
    heroku pg:info --app "$APP_NAME"
    
    # Get database color
    DB_COLOR=$(heroku pg:info --app "$APP_NAME" | grep -E "^===" | head -1 | awk '{print $2}')
    log_info "Database identifier: $DB_COLOR"
    
    # Check database size
    DB_SIZE=$(heroku pg:info --app "$APP_NAME" | grep "Size" | awk '{print $2, $3}')
    log_info "Database size: $DB_SIZE"
    
    # Check schema count
    log_info "Checking schema complexity..."
    SCHEMA_COUNT=$(heroku pg:psql --app "$APP_NAME" -c "SELECT COUNT(DISTINCT schema_name) FROM information_schema.schemata;" | grep -E '^\s*[0-9]+' | xargs)
    log_info "Schema count: $SCHEMA_COUNT"
    
    if [[ $SCHEMA_COUNT -gt 1000 ]]; then
        log_warn "High schema count detected! Consider using follower method."
    fi
    
    # Check object count
    OBJECT_COUNT=$(heroku pg:psql --app "$APP_NAME" -c "SELECT COUNT(*) FROM pg_class WHERE relkind IN ('r','v','m','S','f','');" | grep -E '^\s*[0-9]+' | xargs)
    log_info "Database object count: $OBJECT_COUNT"
    
    if [[ $OBJECT_COUNT -gt 10000 ]]; then
        log_warn "High object count detected! Upgrade might take longer."
    fi
    
    # Check table counts
    log_info "Checking table statistics..."
    heroku pg:psql --app "$APP_NAME" -c "
        SELECT 
            schemaname, 
            COUNT(*) as table_count 
        FROM pg_tables 
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        GROUP BY schemaname
        ORDER BY table_count DESC;"
    
    # Record current state for validation
    log_info "Recording current database state..."
    MEASUREMENT_COUNT=$(heroku pg:psql --app "$APP_NAME" -t -c "SELECT COUNT(*) FROM measurements;" | xargs)
    USER_COUNT=$(heroku pg:psql --app "$APP_NAME" -t -c "SELECT COUNT(*) FROM users;" | xargs)
    DEVICE_COUNT=$(heroku pg:psql --app "$APP_NAME" -t -c "SELECT COUNT(*) FROM devices;" | xargs)
    
    log_info "Current counts - Measurements: $MEASUREMENT_COUNT, Users: $USER_COUNT, Devices: $DEVICE_COUNT"
    
    # Save to file for post-upgrade validation
    cat > /tmp/pg_upgrade_baseline.txt <<EOF
MEASUREMENT_COUNT=$MEASUREMENT_COUNT
USER_COUNT=$USER_COUNT
DEVICE_COUNT=$DEVICE_COUNT
DB_COLOR=$DB_COLOR
TIMESTAMP=$(date)
EOF
    
    log_info "Baseline saved to /tmp/pg_upgrade_baseline.txt"
}

create_backup() {
    log_info "Creating backup..."
    heroku pg:backups:capture --app "$APP_NAME"
    
    # Get latest backup ID
    BACKUP_ID=$(heroku pg:backups --app "$APP_NAME" | grep "^b" | head -1 | awk '{print $1}')
    log_info "Backup created: $BACKUP_ID"
    echo "BACKUP_ID=$BACKUP_ID" >> /tmp/pg_upgrade_baseline.txt
}

test_upgrade_feasibility() {
    log_info "Testing upgrade feasibility..."
    
    if [[ -z "${DB_COLOR:-}" ]]; then
        DB_COLOR=$(heroku pg:info --app "$APP_NAME" | grep -E "^===" | head -1 | awk '{print $2}')
    fi
    
    heroku pg:upgrade:prepare "$DB_COLOR" --app "$APP_NAME" || {
        log_error "Upgrade preparation failed! Consider using follower method."
        return 1
    }
    
    log_info "Upgrade feasibility check passed!"
}

execute_upgrade() {
    log_warn "STARTING UPGRADE PROCESS - THIS WILL CAUSE DOWNTIME"
    
    read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
    if [[ "$CONFIRM" != "yes" ]]; then
        log_info "Upgrade cancelled."
        exit 0
    fi
    
    # Load baseline
    source /tmp/pg_upgrade_baseline.txt
    
    log_info "Enabling maintenance mode..."
    heroku maintenance:on --app "$APP_NAME"
    
    log_info "Scaling down dynos..."
    heroku ps:scale web=0 worker=0 --app "$APP_NAME"
    
    log_info "Killing existing connections..."
    heroku pg:killall --app "$APP_NAME" || true
    
    log_info "Starting upgrade to PostgreSQL $TARGET_VERSION..."
    START_TIME=$(date +%s)
    
    heroku pg:upgrade:run "$DB_COLOR" --app "$APP_NAME" --version "$TARGET_VERSION"
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    log_info "Upgrade completed in $DURATION seconds"
}

post_upgrade_validation() {
    log_info "Running post-upgrade validation..."
    
    # Load baseline
    if [[ -f /tmp/pg_upgrade_baseline.txt ]]; then
        source /tmp/pg_upgrade_baseline.txt
    fi
    
    # Check version
    NEW_VERSION=$(heroku pg:psql --app "$APP_NAME" -t -c "SELECT version();" | grep -oE 'PostgreSQL [0-9]+\.[0-9]+' | awk '{print $2}')
    log_info "New PostgreSQL version: $NEW_VERSION"
    
    # Validate counts
    log_info "Validating data integrity..."
    NEW_MEASUREMENT_COUNT=$(heroku pg:psql --app "$APP_NAME" -t -c "SELECT COUNT(*) FROM measurements;" | xargs)
    NEW_USER_COUNT=$(heroku pg:psql --app "$APP_NAME" -t -c "SELECT COUNT(*) FROM users;" | xargs)
    NEW_DEVICE_COUNT=$(heroku pg:psql --app "$APP_NAME" -t -c "SELECT COUNT(*) FROM devices;" | xargs)
    
    if [[ "$NEW_MEASUREMENT_COUNT" != "${MEASUREMENT_COUNT:-0}" ]]; then
        log_error "Measurement count mismatch! Expected: ${MEASUREMENT_COUNT:-0}, Got: $NEW_MEASUREMENT_COUNT"
    else
        log_info "✓ Measurement count verified: $NEW_MEASUREMENT_COUNT"
    fi
    
    if [[ "$NEW_USER_COUNT" != "${USER_COUNT:-0}" ]]; then
        log_error "User count mismatch! Expected: ${USER_COUNT:-0}, Got: $NEW_USER_COUNT"
    else
        log_info "✓ User count verified: $NEW_USER_COUNT"
    fi
    
    if [[ "$NEW_DEVICE_COUNT" != "${DEVICE_COUNT:-0}" ]]; then
        log_error "Device count mismatch! Expected: ${DEVICE_COUNT:-0}, Got: $NEW_DEVICE_COUNT"
    else
        log_info "✓ Device count verified: $NEW_DEVICE_COUNT"
    fi
    
    # Test critical queries
    log_info "Testing critical queries..."
    heroku pg:psql --app "$APP_NAME" -c "
        SELECT 
            COUNT(*) as recent_measurements 
        FROM measurements 
        WHERE created_at >= NOW() - INTERVAL '7 days';"
    
    log_info "Post-upgrade validation complete!"
}

restore_service() {
    log_info "Restoring service..."
    
    log_info "Scaling up dynos..."
    heroku ps:scale web=1 worker=1 --app "$APP_NAME"
    
    log_info "Disabling maintenance mode..."
    heroku maintenance:off --app "$APP_NAME"
    
    log_info "Restarting app to reset connections..."
    heroku ps:restart --app "$APP_NAME"
    
    log_info "Service restored!"
}

test_application() {
    log_info "Testing application endpoints..."
    
    APP_URL="https://${APP_NAME}.herokuapp.com"
    
    # Test health endpoint
    log_info "Testing health check..."
    curl -s -o /dev/null -w "%{http_code}" "$APP_URL/health" || log_warn "Health check failed"
    
    # Test API endpoint
    log_info "Testing API endpoint..."
    curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/v1/measurements" || log_warn "API check failed"
    
    log_info "Checking recent logs for errors..."
    heroku logs --app "$APP_NAME" --tail --num 100 | grep -i error | tail -5 || log_info "No recent errors found"
}

rollback() {
    log_error "INITIATING ROLLBACK!"
    
    if [[ -f /tmp/pg_upgrade_baseline.txt ]]; then
        source /tmp/pg_upgrade_baseline.txt
    fi
    
    if [[ -z "${BACKUP_ID:-}" ]]; then
        log_error "No backup ID found! List backups with: heroku pg:backups --app $APP_NAME"
        read -p "Enter backup ID to restore: " BACKUP_ID
    fi
    
    log_info "Restoring from backup $BACKUP_ID..."
    heroku pg:backups:restore "$BACKUP_ID" DATABASE_URL --app "$APP_NAME" --confirm "$APP_NAME"
    
    log_info "Restarting app..."
    heroku ps:restart --app "$APP_NAME"
    
    log_info "Restoring service..."
    restore_service
    
    log_info "Rollback complete!"
}

# Main menu
main() {
    echo "========================================="
    echo "  Heroku PostgreSQL Upgrade Helper"
    echo "  COVID CO2 Tracker"
    echo "========================================="
    echo ""
    echo "Select an option:"
    echo "1) Run pre-upgrade checks"
    echo "2) Create backup"
    echo "3) Test upgrade feasibility"
    echo "4) Execute full upgrade (includes all steps)"
    echo "5) Run post-upgrade validation"
    echo "6) Test application endpoints"
    echo "7) Emergency rollback"
    echo "8) Exit"
    echo ""
    read -p "Enter choice [1-8]: " choice
    
    case $choice in
        1)
            check_prerequisites
            pre_upgrade_checks
            ;;
        2)
            check_prerequisites
            create_backup
            ;;
        3)
            check_prerequisites
            test_upgrade_feasibility
            ;;
        4)
            check_prerequisites
            pre_upgrade_checks
            create_backup
            test_upgrade_feasibility && {
                execute_upgrade
                post_upgrade_validation
                restore_service
                test_application
            }
            ;;
        5)
            check_prerequisites
            post_upgrade_validation
            ;;
        6)
            check_prerequisites
            test_application
            ;;
        7)
            check_prerequisites
            rollback
            ;;
        8)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid option!"
            exit 1
            ;;
    esac
}

# Run main menu
main