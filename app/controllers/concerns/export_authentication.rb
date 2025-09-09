# frozen_string_literal: true

# Authentication concern for export controllers
# Handles token validation and sets up instance variables
module ExportAuthentication
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_export_token
  end

  private

  def authenticate_export_token
    token_string = extract_bearer_token

    # Handle missing token
    return render_auth_error('Authentication required', 'No token provided') if token_string.blank?

    # Security validation
    return unless validate_token_format(token_string)

    # Find and validate the token
    hashed_token = Digest::SHA256.hexdigest(token_string)
    @export_token = ExportToken.find_by(token_hash: hashed_token)

    return unless validate_token_exists(hashed_token)
    return unless validate_token_not_revoked(hashed_token)
    return unless validate_token_not_expired(hashed_token)

    # Token is valid - authentication successful
    Rails.logger.info("Export authentication successful for token: #{hashed_token.first(8)}...")
  end

  def validate_token_format(token_string)
    if token_string.length > 1000
      Rails.logger.warn("Export authentication failed: Token too long (#{token_string.length} chars)")
      render(json: { error: 'Invalid token format' }, status: :unauthorized)
      return false
    end

    if token_string.include?("\u0000")
      Rails.logger.warn('Export authentication failed: Token contains null bytes')
      render(json: { error: 'Invalid token format' }, status: :unauthorized)
      return false
    end

    true
  end

  def validate_token_exists(hashed_token)
    return true if @export_token

    Rails.logger.warn("Export authentication failed: Token not found (hash: #{hashed_token.first(8)}...)")
    render(json: { error: 'Invalid authentication token' }, status: :unauthorized)
    false
  end

  def validate_token_not_revoked(hashed_token)
    return true unless @export_token.revoked?

    Rails.logger.warn("Export authentication failed: Token revoked at #{@export_token.revoked_at} " \
                      "(hash: #{hashed_token.first(8)}...)")
    render(json: { error: 'Token has been revoked' }, status: :unauthorized)
    false
  end

  def validate_token_not_expired(hashed_token)
    return true unless @export_token.expired?

    Rails.logger.warn("Export authentication failed: Token expired at #{@export_token.expires_at} " \
                      "(hash: #{hashed_token.first(8)}...)")
    render(json: { error: 'Token has expired' }, status: :unauthorized)
    false
  end

  def render_auth_error(error_message, log_message)
    Rails.logger.warn("Export authentication failed: #{log_message}")
    render(json: { error: error_message }, status: :unauthorized)
    false
  end

  def extract_bearer_token
    auth_header = request.headers['Authorization']
    return nil unless auth_header

    # Support both "Bearer TOKEN" and "TOKEN" formats
    auth_header.sub(/^Bearer\s+/i, '')
  end
end