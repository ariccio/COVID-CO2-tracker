class CreateExportTokens < ActiveRecord::Migration[7.1]
  def change
    create_table :export_tokens do |t|
      t.string :token, null: false
      t.string :description
      t.datetime :expires_at
      t.integer :usage_count, default: 0, null: false
      t.datetime :last_used_at
      t.jsonb :permissions, default: {}, null: false

      t.timestamps
    end

    add_index :export_tokens, :token, unique: true
    add_index :export_tokens, :expires_at
  end
end
