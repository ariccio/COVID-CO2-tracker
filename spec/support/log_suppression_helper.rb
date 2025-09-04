# frozen_string_literal: true

module LogSuppressionHelper
  # Suppress logs during tests that intentionally trigger errors
  def suppress_logs
    original_level = Rails.logger.level
    Rails.logger.level = Logger::FATAL
    yield
  ensure
    Rails.logger.level = original_level
  end

  # Suppress logs for SQL injection tests
  def with_suppressed_sql_injection_logs(&)
    suppress_logs(&)
  end
end

RSpec.configure do |config|
  config.include LogSuppressionHelper
end

# Shared context for tests that generate expected error logs
RSpec.shared_context 'suppress error logs', :suppress_error_logs do
  around do |example|
    original_level = Rails.logger.level
    Rails.logger.level = Logger::FATAL
    example.run
  ensure
    Rails.logger.level = original_level
  end
end