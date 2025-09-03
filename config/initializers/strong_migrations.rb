# frozen_string_literal: true

# StrongMigrations helps catch unsafe migrations in development
# and provides warnings about potentially dangerous operations
if defined?(StrongMigrations)
  StrongMigrations.configure do |config|
  # Set the database version for migration checks
    config.target_version = 14 # PostgreSQL 14

  # Check for unsafe operations in all environments
  config.check_down = true

  # Allow migrations to run with a lock timeout to prevent blocking
  config.lock_timeout = 10.seconds

  # Set statement timeout for migrations (Heroku recommends 30s max)
  config.statement_timeout = 30.seconds

  # Custom error messages for better developer experience
  config.error_messages[:add_column_with_default] = <<~TEXT
    Adding a column with a non-null default causes the entire table to be rewritten.
    Instead, add the column without a default value, then change the default.

    class Add<%= column.to_s.camelize %>To<%= table.to_s.camelize %> < ActiveRecord::Migration[7.1]
      def up
        add_column :<%= table %>, :<%= column %>, :<%= type %>
        change_column_default :<%= table %>, :<%= column %>, <%= default %>
      end
    #{'  '}
      def down
        remove_column :<%= table %>, :<%= column %>
      end
    end
  TEXT

  # Start checking migrations after the last deployed migration
  # Update this after each production deployment
  config.start_after = 20_240_101_000_000

  # Custom checks for our specific needs
  config.add_check do |method, args|
    if method == :add_index && args[0].to_s == 'measurements'
      stop! 'Index on measurements table should be added concurrently due to table size'
    end
  end
  end
end