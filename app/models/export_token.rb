# frozen_string_literal: true

class ExportToken < ApplicationRecord
  require 'digest'

  # Remove has_secure_token - we'll handle token generation manually with hashing

  validates :description, presence: true
  validates :expires_at, presence: true

  scope :active, -> { where('expires_at > ?', Time.current) }
  scope :expired, -> { where(expires_at: ..Time.current) }

  # Transient attribute to hold the raw token value (only available on creation)
  attr_accessor :raw_token

  # Callback to generate and hash token before creation
  before_create :generate_and_hash_token

  def self.authenticate(token_string)
    return nil if token_string.blank?

    # Reject tokens containing null bytes (security measure against injection attacks)
    return nil if token_string.include?("\u0000")

    # Hash the incoming token to compare against stored hashes
    hashed_token = Digest::SHA256.hexdigest(token_string)
    active.find_by(token_hash: hashed_token)
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

  # Method to get a unique identifier for rate limiting (uses hash, not token)
  def rate_limit_key
    # Use the token hash for rate limiting keys (secure against prediction)
    "export_rate:#{Digest::SHA256.hexdigest(token_hash)}" if token_hash.present?
  end

  private

  def generate_and_hash_token
    # Generate a secure random token
    self.raw_token = SecureRandom.urlsafe_base64(32)
    # Store only the SHA256 hash
    self.token_hash = Digest::SHA256.hexdigest(raw_token)
  end
end
