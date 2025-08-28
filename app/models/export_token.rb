class ExportToken < ApplicationRecord
  has_secure_token :token
  
  validates :description, presence: true
  validates :expires_at, presence: true
  
  scope :active, -> { where('expires_at > ?', Time.current) }
  scope :expired, -> { where('expires_at <= ?', Time.current) }
  
  def self.authenticate(token_string)
    return nil if token_string.blank?
    active.find_by(token: token_string)
  end
  
  def active?
    expires_at.present? && expires_at > Time.current
  end
  
  def expired?
    !active?
  end
  
  def record_usage!
    increment!(:usage_count)
    update!(last_used_at: Time.current)
  end
  
  def can_export_format?(format)
    return true if permissions['formats'].nil?
    permissions['formats'].include?(format.to_s)
  end
  
  def max_records
    permissions['max_records'] || 100_000
  end
  
  def rate_limit_per_hour
    permissions['rate_limit_per_hour'] || 10
  end
end
