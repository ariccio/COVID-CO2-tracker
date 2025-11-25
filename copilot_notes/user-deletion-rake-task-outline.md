# User Deletion Rake Task Outline

Created: 2025-11-24
Context: After manually deleting user evanchaney@mac.com (ID 555) from production

## Proposed Location
`lib/tasks/user_management.rake`

## Task Structure

```ruby
# frozen_string_literal: true

namespace :users do
  desc 'Preview what would be deleted for a user (dry run)'
  task :deletion_preview, [:email] => :environment do |_t, args|
    # 1. Find user by email
    # 2. Display: user info, device count, measurement count, user_setting, admin comments
    # 3. Show date ranges of measurements if any exist
    # 4. Print summary of what WOULD be deleted
    # 5. Exit without modifying anything
  end

  desc 'Delete a user and all their data (IRREVERSIBLE) - requires CONFIRM=yes'
  task :delete, [:email] => :environment do |_t, args|
    # 1. Require CONFIRM=yes environment variable for safety
    # 2. Find user by email, abort if not found
    # 3. Run deletion_preview first to show what will be deleted
    # 4. Wrap in transaction:
    #    a. Delete measurements for each device (handles restrict_with_exception)
    #    b. Delete devices
    #    c. Delete user (user_setting auto-deletes via dependent: :destroy)
    #    d. Delete any ActiveAdmin::Comment referencing the user
    # 5. Verify deletion succeeded
    # 6. Print confirmation with timestamp for compliance records
  end

  desc 'Export user data to JSON before deletion (GDPR data portability)'
  task :export, [:email] => :environment do |_t, args|
    # 1. Find user
    # 2. Build JSON with: user record, devices, measurements, user_setting
    # 3. Write to tmp/user_exports/user_{id}_{timestamp}.json
    # 4. Print file path
  end
end
```

## Usage Examples

```bash
# Preview (safe, read-only)
rails users:deletion_preview[user@example.com]

# Delete (requires explicit confirmation)
CONFIRM=yes rails users:delete[user@example.com]

# Export before deletion
rails users:export[user@example.com]
```

## Key Implementation Notes

1. **Deletion Order Matters**: Due to `dependent: :restrict_with_exception` on User->Device and Device->Measurement associations, must delete in order:
   - Measurements first
   - Then Devices
   - Then User (UserSetting auto-deletes)

2. **Transaction Safety**: Wrap all deletions in `ActiveRecord::Base.transaction` to rollback on any failure

3. **Confirmation Gate**: Require `CONFIRM=yes` env var to prevent accidental execution

4. **Compliance Logging**: Print timestamps and counts for audit trail

5. **Edge Cases**:
   - User with no devices/measurements (simple case - just delete user)
   - User with devices but no measurements (delete devices, then user)
   - User with full data chain (delete measurements -> devices -> user)

## Reference: Manual Deletion Command Used

```ruby
# What we ran for evanchaney@mac.com (had no associated data)
ActiveRecord::Base.transaction do
  user = User.find_by(email: "evanchaney@mac.com")
  user.destroy!
end
```

## Full Deletion for User WITH Data

```ruby
ActiveRecord::Base.transaction do
  user = User.find_by(email: "user@example.com")

  # Delete measurements first (unblocks device deletion)
  user.devices.each { |d| d.measurement.destroy_all }

  # Delete devices (unblocks user deletion)
  user.devices.destroy_all

  # Delete user (user_setting auto-deletes)
  user.destroy!
end
```
