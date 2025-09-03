# CRITICAL DEPLOYMENT CHECKLIST: Token Hash Migration

## ⚠️ CRITICAL: Database Migration Required Before Deployment

### Migration Status
- **Migration File**: `db/migrate/20250903001159_add_token_hash_to_export_tokens.rb`
- **Purpose**: Adds SHA256 token hashing to the export_tokens table for enhanced security
- **Local Status**: ✓ Migration successfully run locally on 2025-09-02

### What This Migration Does
1. Adds a new `token_hash` column to the `export_tokens` table
2. Creates a unique index on the `token_hash` column
3. Migrates existing tokens to hashed format
4. Makes the `token_hash` column non-nullable

### Required Deployment Steps

#### 1. Pre-Deployment Verification
```bash
# Check current migration status on Heroku
heroku run rails db:migrate:status --app covid-co2-tracker
```

#### 2. Run Migration on Heroku (REQUIRED)
```bash
# Execute the migration on production
heroku run rails db:migrate --app covid-co2-tracker
```

#### 3. Post-Migration Verification
```bash
# Verify migration succeeded
heroku run rails db:migrate:status --app covid-co2-tracker

# Optionally check the schema
heroku run rails console --app covid-co2-tracker
# In console: ExportToken.column_names
# Should include: token_hash
```

### Important Notes
- **Security Impact**: This migration enhances security by storing hashed tokens instead of plaintext
- **Backward Compatibility**: The application code has been updated to work with hashed tokens
- **Data Migration**: Existing tokens are automatically hashed during migration
- **Rollback**: If issues occur, use `heroku run rails db:rollback --app covid-co2-tracker`

### Related Migrations Also Applied
- `20250902195626_add_indexes_for_export_performance.rb` - Adds performance indexes for export queries

### Checklist
- [x] Migration run locally
- [ ] Migration run on Heroku staging (if applicable)
- [ ] Migration run on Heroku production
- [ ] Verified token authentication still works
- [ ] Monitored error logs post-deployment

### Emergency Rollback Commands
If issues arise after deployment:
```bash
# Rollback the last migration
heroku run rails db:rollback --app covid-co2-tracker

# Or rollback to specific version if needed
heroku run rails db:migrate VERSION=20250828091545 --app covid-co2-tracker
```

### Contact
If issues arise during deployment, check:
1. Heroku logs: `heroku logs --tail --app covid-co2-tracker`
2. Database status: `heroku pg:info --app covid-co2-tracker`
3. Application metrics in Heroku dashboard

---
*Last Updated: 2025-09-02*
*Migration completed locally successfully*