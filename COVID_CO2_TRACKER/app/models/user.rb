class User < ApplicationRecord
    has_secure_password
    has_many :devices
    validates :email, presence: true, uniqueness: true
    validates :password_digest, presence: true
  
end
