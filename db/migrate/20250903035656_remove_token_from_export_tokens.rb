class RemoveTokenFromExportTokens < ActiveRecord::Migration[7.1]
  def change
    # Remove the old plaintext token column as we've migrated to token_hash
    # This completes the migration started in 20250903001159_add_token_hash_to_export_tokens
    
    # First remove the unique index on token
    remove_index :export_tokens, :token if index_exists?(:export_tokens, :token)
    
    # Then remove the column itself
    remove_column :export_tokens, :token, :string
  end
end