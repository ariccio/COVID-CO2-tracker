# frozen_string_literal: true

class ExportToken < ApplicationRecord
  # Token generation and storage using SHA256 hashing for security

  # Default expiration duration for long-lived tokens (configurable)
  DEFAULT_EXPIRATION = 10.years

  validates :description, presence: true
  validates :expires_at, presence: true
  validates :token_hash, uniqueness: true, allow_nil: true
  validate :expiration_must_be_in_future, on: :create

  scope :active, -> { where('expires_at > ?', Time.current) }
  scope :expired, -> { where(expires_at: ..Time.current) }

  # Transient attribute to hold the raw token value (only available on creation)
  attr_accessor :raw_token

  # Testing flag to skip expiration validation (used only in tests)
  attr_accessor :skip_expiration_validation

  # Callback to generate and hash token before creation
  before_create :generate_and_hash_token

  # Class method to generate a new token with configurable expiration
  # @param description [String] Description of what the token is for
  # @param expires_in [ActiveSupport::Duration] Duration until expiration (default: 10 years)
  # @param created_by [String, nil] Optional identifier of who created the token
  # @param permissions [Hash, nil] Optional permissions hash for the token
  # @return [ExportToken] The newly created token with raw_token populated
  def self.generate(description:, expires_in: DEFAULT_EXPIRATION, created_by: nil, permissions: nil)
    create!(
      description: description,
      expires_at: expires_in.from_now,
      created_by: created_by,
      permissions: permissions
    )
  end

  def self.authenticate(token_string)
    return nil if token_string.blank?

    # Reject excessively long tokens to prevent DoS attacks
    return nil if token_string.length > 1000

    # Reject tokens containing null bytes (security measure against injection attacks)
    return nil if token_string.include?("\u0000")

    # Hash the incoming token to compare against stored hashes
    hashed_token = Digest::SHA256.hexdigest(token_string)
    active.find_by(token_hash: hashed_token)
  end

  # Check if the token is currently active (not expired and not revoked)
  def active?
    expires_at.present? && expires_at > Time.current && !revoked?
  end

  # Check if the token has been revoked
  def revoked?
    revoked_at.present?
  end

  def expired?
    expires_at.present? && expires_at <= Time.current
  end

  # Revoke the token, preventing further use
  # @param reason [String, nil] Optional reason for revocation (currently not stored)
  # @return [Boolean] True if successfully revoked
  def revoke!(reason: nil)
    # NOTE: reason parameter kept for API compatibility but not stored
    # Could add revocation_reason column in future if audit trail needed
    update!(revoked_at: Time.current)
  end

  def record_usage!
    # Single database operation for efficiency
    # Note: Tokens are reusable and not deleted after use
    update!(usage_count: (usage_count || 0) + 1, last_used_at: Time.current)
  end

  def can_export_format?(format)
    return true if (permissions.nil? || permissions['formats'].nil?)

    permissions['formats'].include?(format.to_s)
  end

  def max_records
    return 100_000 if permissions.nil?

    permissions['max_records'] || 100_000
  end

  def rate_limit_per_hour
    return 10 if permissions.nil?

    permissions['rate_limit_per_hour'] || 10
  end

  # Method to get a unique identifier for rate limiting (uses hash, not token)
  def rate_limit_key
    # Use the token hash directly for rate limiting keys (already hashed, no need to re-hash)
    "export_rate:#{token_hash}" if token_hash.present?
  end

  private

  def generate_and_hash_token
    # Generate a secure random token
    self.raw_token = SecureRandom.urlsafe_base64(32)
    # Store only the SHA256 hash
    self.token_hash = Digest::SHA256.hexdigest(raw_token)
  end

  def expiration_must_be_in_future
    return if skip_expiration_validation

    if expires_at.present? && expires_at <= Time.current
      errors.add(:expires_at, 'must be in the future')
    end
  end
end
