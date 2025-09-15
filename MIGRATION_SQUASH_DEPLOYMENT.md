# Migration Squash Deployment Guide

## Summary
Successfully squashed 7 export system migrations into a single migration for cleaner deployment to production.

## Squashed Migrations
The following 7 migrations have been combined into `20250828000000_create_export_system.rb`:
1. `20250828091545_create_export_tokens.rb` - Created export_tokens table
2. `20250902195626_add_indexes_for_export_performance.rb` - Added performance indexes
3. `20250903001159_add_token_hash_to_export_tokens.rb` - Added secure token hashing
4. `20250903035656_remove_token_from_export_tokens.rb` - Removed plaintext token
5. `20250903181653_add_unique_index_to_models.rb` - Added unique constraint
6. `20250909032108_add_revocation_and_creator_to_export_tokens.rb` - Added revocation tracking
7. `20250910203748_add_revocation_reason_to_export_tokens.rb` - Added revocation reason

## Deployment Steps

### 1. Pre-deployment Verification
```bash
# Verify current production state
heroku run rails db:migrate:status --app covid-co2-tracker

# Should show no export-related migrations
```

### 2. Deploy Code
```bash
# Push the squashed migration to production
git add db/migrate/20250828000000_create_export_system.rb
git add db/schema.rb
git commit -m "Squash export system migrations for production deployment

Combined 7 migrations into single CreateExportSystem migration.
This creates the complete export token system with all indexes
and performance optimizations in one atomic operation."

git push heroku main
```

### 3. Run Migration
```bash
# Run the single squashed migration
heroku run rails db:migrate --app covid-co2-tracker

# Expected output:
# == 20250828000000 CreateExportSystem: migrating ===============================
# -- create_table(:export_tokens)
# -- add_index(:export_tokens, :token_hash, {:unique=>true})
# -- add_index(:export_tokens, :expires_at)
# -- [... more indexes ...]
# == 20250828000000 CreateExportSystem: migrated (X.XXXXs) ======================
```

### 4. Post-deployment Verification
```bash
# Verify migration completed
heroku run rails db:migrate:status --app covid-co2-tracker | grep export

# Should show:
#   up     20250828000000  Create export system

# Test the export system
heroku run rails runner "puts ExportToken.count" --app covid-co2-tracker

# Create a test token to verify functionality
heroku run rails console --app covid-co2-tracker
> token = ExportToken.create_with_token(description: "Post-deployment test")
> puts token.raw_token  # Save this for testing
> exit

# Test export endpoint with the token
curl -H "Authorization: Bearer [TOKEN]" \
     https://covid-co2-tracker.herokuapp.com/api/v1/exports.csv
```

## Rollback Plan
If issues occur, the migration can be rolled back:

```bash
# Rollback the migration
heroku run rails db:rollback --app covid-co2-tracker

# The squashed migration drops the entire export_tokens table on rollback
# No data loss risk as no production tokens exist yet
```

## Important Notes

1. **No Production Data**: Since these migrations never ran in production, there's no data migration needed.

2. **Schema Version**: The schema version will show `20250828000000` instead of `20250910203748`, but this is correct as it produces the identical schema.

3. **Archived Migrations**: Original migration files are preserved in `db/archived_export_migrations/` for reference but are not loaded by Rails.

4. **Index Note**: The `index_places_on_google_place_id` already existed as a unique index, so the squashed migration skips it.

## Testing Completed
- ✓ All 7 migrations rolled back successfully
- ✓ Squashed migration applied successfully
- ✓ Schema comparison shows identical structure
- ✓ All export system tests pass (90 examples, 0 failures)
- ✓ Export token creation and validation works
- ✓ API endpoints respond correctly

## Files Changed
- Added: `db/migrate/20250828000000_create_export_system.rb`
- Removed: 7 individual migration files (archived in `db/archived_export_migrations/`)
- Updated: `db/schema.rb` (version changed to 20250828000000)
- Modified: Two original migrations to allow rollback for testing

## Next Steps
1. Deploy to production using the steps above
2. Create initial export tokens for authorized users
3. Monitor for any issues in the first 24 hours
4. Remove archived migrations after 30 days if no issues

---
Generated: 2025-09-15