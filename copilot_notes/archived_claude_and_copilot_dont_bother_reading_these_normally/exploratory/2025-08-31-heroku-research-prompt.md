# Heroku Research Prompt for COVID CO2 Tracker Production Operations

## Research Context

You are researching Heroku deployment and operations documentation for the **COVID CO2 Tracker**, a Rails 7.1+ application with specific technical requirements and constraints. This research will inform production deployment decisions and create an operations manual.

### Current Production Environment
- **Platform**: Heroku (Salesforce-owned, post-2022 changes)
- **Stack**: Heroku-22 (considering upgrade to Heroku-24)
- **Database**: PostgreSQL 14.17 on essential-1 plan (20 connections, 10GB limit)
- **Dyno**: Standard-1X (512MB RAM, ephemeral filesystem)
- **Current DB Usage**: Only 445KB but preparing for growth
- **Application Type**: Public health monitoring with CO2 sensor data

### New Features Requiring Research
- **ActionController::Live streaming** for real-time data exports
- **Large ZIP file generation** (potentially 100MB+ with sensor data)
- **Batch data processing** with memory constraints
- **Database migrations** on production data
- **Streaming CSV/JSON exports** without memory exhaustion

## Primary Research Areas

### 1. Platform and Stack Management
**Research the following with specific focus on our constraints:**

- **Heroku-22 to Heroku-24 stack upgrade**: 
  - Migration process, downtime requirements, rollback procedures
  - Ruby 3.3+ compatibility changes
  - New stack limitations or benefits for Rails apps
  - Command sequences for zero-downtime upgrades

- **Recent Heroku platform changes (2024-2025)**:
  - Post-Salesforce acquisition impacts on pricing, features, support
  - New security policies, compliance changes
  - Deprecated features affecting Rails applications
  - Changes to dyno restart behavior, networking, or filesystem

### 2. Database Operations and Optimization
**Focus on PostgreSQL 14.17 and essential-1 plan specifics:**

- **Connection pooling best practices**:
  - Optimal pool size for 20-connection limit with Rails app + background jobs
  - PgBouncer configuration on Heroku
  - Connection leak detection and prevention
  - Database connection monitoring commands

- **Database performance optimization**:
  - Query optimization for 512MB RAM constraint
  - Index strategies for time-series CO2 data
  - VACUUM and ANALYZE scheduling on essential-1 plan
  - Performance monitoring tools available on Heroku

- **Migration safety and strategies**:
  - Safe migration patterns for production (avoiding locks)
  - Timeout configurations for large table changes
  - Rollback strategies for failed migrations
  - Database maintenance windows and scheduling

- **Backup and disaster recovery**:
  - Automated backup schedules on essential-1 plan
  - Point-in-time recovery procedures
  - Database restore testing procedures
  - Export strategies for compliance/archival

### 3. Memory Management and Performance
**Critical for 512MB dyno with streaming operations:**

- **ActionController::Live on Heroku**:
  - Nginx buffering configuration and overrides
  - Streaming timeout settings (both Heroku and Rails)
  - Memory usage patterns for long-running connections
  - Connection limits and concurrent streaming users

- **Large file operations on ephemeral filesystem**:
  - Temporary file cleanup strategies
  - ZIP file generation without memory exhaustion
  - Streaming file uploads/downloads through Rails
  - Disk space monitoring and alerts

- **Memory optimization techniques**:
  - Ruby garbage collection tuning for Heroku
  - Memory profiling tools available on Heroku
  - Identifying and preventing memory leaks
  - Background job memory management

### 4. Deployment and Operations
**Production deployment best practices:**

- **Deployment strategies**:
  - Zero-downtime deployment procedures
  - Preboot configuration and warm-up strategies  
  - Database migration coordination with deployments
  - Rollback procedures for failed deployments

- **Monitoring and alerting**:
  - Built-in Heroku metrics vs third-party solutions
  - Critical alerts for our use case (memory, database, errors)
  - Log aggregation and search strategies
  - Performance monitoring for streaming endpoints

- **Error handling and debugging**:
  - Common Heroku deployment failures and solutions
  - Production error tracking and notification
  - Log analysis for memory and database issues
  - Debug tools available in production environment

### 5. Security and Compliance
**For public health application:**

- **Security best practices**:
  - Environment variable management for secrets
  - Database connection security
  - Rate limiting and DDoS protection options
  - SSL/TLS configuration for streaming endpoints

- **Compliance considerations**:
  - Data retention policies on Heroku
  - Audit logging capabilities
  - Geographic data residency options
  - GDPR/privacy compliance tools

### 6. Scaling and Cost Optimization
**Planning for growth:**

- **Vertical scaling options**:
  - When to upgrade from Standard-1X dynos
  - Database plan upgrade decision points
  - Cost-benefit analysis of different dyno types

- **Horizontal scaling strategies**:
  - Multi-dyno coordination for streaming
  - Background job scaling patterns
  - Database connection pooling across dynos

- **Cost optimization**:
  - Dyno sleeping patterns and warm-up strategies
  - Database plan optimization (when to upgrade from essential-1)
  - Add-on cost analysis for monitoring/logging
  - Free tier limitations and upgrade triggers

## Research Output Requirements

### Format and Detail Level
- **Provide specific commands and code examples** (not just concepts)
- **Include exact error messages and solutions** for common issues
- **Document recent changes** with dates when policies/features changed
- **Provide links to current official documentation** (verify 2024-2025 accuracy)
- **Include real-world examples** from Rails applications with similar constraints

### Critical Information Needed
1. **Step-by-step procedures** for common operations (deployments, migrations, rollbacks)
2. **Configuration examples** with actual values for our dyno/database size
3. **Troubleshooting guides** for memory, database, and streaming issues
4. **Monitoring commands** for checking system health
5. **Emergency procedures** for common failure scenarios

### Focus Areas for Gotchas
- **Memory exhaustion scenarios** and prevention
- **Database connection exhaustion** and recovery
- **Nginx timeout issues** with streaming
- **Deployment failures** and recovery procedures
- **Cost surprises** from unexpected usage patterns

## Expected Deliverables

Create comprehensive documentation covering:

1. **Quick Reference Guide**: Common commands and procedures
2. **Deployment Runbook**: Step-by-step deployment and rollback procedures  
3. **Troubleshooting Guide**: Common issues and solutions
4. **Monitoring Checklist**: Key metrics and alert thresholds
5. **Emergency Procedures**: What to do when things break
6. **Scaling Playbook**: When and how to scale resources

**Prioritize actionable, specific information over general concepts. This research will directly inform production deployment decisions and serve as our primary operations manual.**

---
*Research Target: Create a complete Heroku operations guide specific to Rails 7.1+ applications with streaming capabilities, memory constraints, and public health data requirements.*