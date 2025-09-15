# frozen_string_literal: true

class AddRevocationAndCreatorToExportTokens < ActiveRecord::Migration[7.1]
  def change
    # Add revoked_at column for token revocation
    # This allows soft-deletion of tokens while preserving audit trail
    add_column :export_tokens, :revoked_at, :datetime

    # Add created_by column to track who created the token
    # This is optional and can be null for system-generated tokens
    add_column :export_tokens, :created_by, :string

    # Add index on revoked_at for efficient filtering of active tokens
    # Most queries will want to exclude revoked tokens, so this helps performance
    add_index :export_tokens, :revoked_at,
              name: 'index_export_tokens_on_revoked_at'

    # Add composite index for efficient lookup of active tokens by hash
    # This optimizes the common query pattern: WHERE token_hash = ? AND revoked_at IS NULL
    add_index :export_tokens, [:token_hash, :revoked_at],
              name: 'index_export_tokens_on_token_hash_and_revoked_at'

    # Add index on created_by for auditing and filtering by creator
    add_index :export_tokens, :created_by,
              name: 'index_export_tokens_on_created_by'

    # NOTE: We already have these indexes from previous migrations:
    # - Unique index on token_hash for fast token lookup
    # - Index on expires_at for expiration checking
    # These work together with the new revoked_at index for comprehensive query optimization
  end

  # The down method for rollback
  def down
    # Remove indexes first (in reverse order of creation)
    remove_index :export_tokens, name: 'index_export_tokens_on_created_by'
    remove_index :export_tokens, name: 'index_export_tokens_on_token_hash_and_revoked_at'
    remove_index :export_tokens, name: 'index_export_tokens_on_revoked_at'

    # Remove columns
    remove_column :export_tokens, :created_by
    remove_column :export_tokens, :revoked_at
  end
end