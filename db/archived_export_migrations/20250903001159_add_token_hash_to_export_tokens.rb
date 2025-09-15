class AddTokenHashToExportTokens < ActiveRecord::Migration[7.1]
  def up
    # Add the new token_hash column with index for fast lookups
    add_column :export_tokens, :token_hash, :string
    add_index :export_tokens, :token_hash, unique: true

    # Migrate existing tokens to hashed versions
    # This is a one-way migration - we cannot recover original tokens
    ExportToken.reset_column_information
    ExportToken.find_each do |token|
      if token.token.present?
        # Hash the existing plaintext token
        token.update_column(:token_hash, Digest::SHA256.hexdigest(token.token))
      end
    end

    # Make token_hash required after migration
    change_column_null :export_tokens, :token_hash, false

    # Remove the old token column (commented out for safety)
    # You should uncomment this after verifying the migration worked
    # remove_column :export_tokens, :token
  end

  def down
    # NOTE: This is a destructive migration - we cannot recover original tokens
    # remove_index :export_tokens, :token_hash
    # remove_column :export_tokens, :token_hash

    # If you need to rollback, you'll need to regenerate all tokens
    raise ActiveRecord::IrreversibleMigration, 'Cannot reverse token hashing - tokens cannot be recovered'
  end
end