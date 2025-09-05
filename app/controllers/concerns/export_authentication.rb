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
    token = extract_bearer_token

    @export_token = ExportToken.authenticate(token)

    unless @export_token
      Rails.logger.warn("Export authentication failed for token: #{token&.first(8)}...")
      render(json: { error: 'Invalid or expired token' }, status: :unauthorized)
    end
  end

  def extract_bearer_token
    auth_header = request.headers['Authorization']
    return nil unless auth_header

    # Support both "Bearer TOKEN" and "TOKEN" formats
    auth_header.sub(/^Bearer\s+/i, '')
  end
end