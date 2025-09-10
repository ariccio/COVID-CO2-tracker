class AddRevocationReasonToExportTokens < ActiveRecord::Migration[7.1]
  def change
    add_column :export_tokens, :revocation_reason, :string
  end
end
