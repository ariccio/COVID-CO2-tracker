class RemoveAuthTokenFromUsers < ActiveRecord::Migration[6.1]
  def change
    remove_column(:users, :auth_token, :text)
  end
end
