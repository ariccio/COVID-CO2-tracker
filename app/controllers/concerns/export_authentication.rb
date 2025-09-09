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
    if token_string.blank?
      Rails.logger.warn('Export authentication failed: No token provided')
      render(json: { error: 'Authentication required' }, status: :unauthorized)
      return
    end

    # Security checks from ExportToken.authenticate
    if token_string.length > 1000
      Rails.logger.warn("Export authentication failed: Token too long (#{token_string.length} chars)")
      render(json: { error: 'Invalid token format' }, status: :unauthorized)
      return
    end

    if token_string.include?("\u0000")
      Rails.logger.warn('Export authentication failed: Token contains null bytes')
      render(json: { error: 'Invalid token format' }, status: :unauthorized)
      return
    end

    # Find the token by hash (doesn't check expiration or revocation yet)
    hashed_token = Digest::SHA256.hexdigest(token_string)
    @export_token = ExportToken.find_by(token_hash: hashed_token)

    # Check if token exists
    unless @export_token
      Rails.logger.warn("Export authentication failed: Token not found (hash: #{hashed_token.first(8)}...)")
      render(json: { error: 'Invalid authentication token' }, status: :unauthorized)
      return
    end

    # Check if token has been revoked
    if @export_token.revoked?
      Rails.logger.warn("Export authentication failed: Token revoked at #{@export_token.revoked_at} " \
                        "(hash: #{hashed_token.first(8)}...)")
      render(json: { error: 'Token has been revoked' }, status: :unauthorized)
      return
    end

    # Check if token has expired
    if @export_token.expired?
      Rails.logger.warn("Export authentication failed: Token expired at #{@export_token.expires_at} " \
                        "(hash: #{hashed_token.first(8)}...)")
      render(json: { error: 'Token has expired' }, status: :unauthorized)
      return
    end

    # Token is valid - authentication successful
    Rails.logger.info("Export authentication successful for token: #{hashed_token.first(8)}...")
  end

  def extract_bearer_token
    auth_header = request.headers['Authorization']
    return nil unless auth_header

    # Support both "Bearer TOKEN" and "TOKEN" formats
    auth_header.sub(/^Bearer\s+/i, '')
  end
end