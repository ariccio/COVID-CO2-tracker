# frozen_string_literal: true

return unless Rails.env.local?

CypressRails.hooks.before_server_start do
    # Called once, before either the transaction or the server is started
  ::ENV['IsEndToEndBackendServerSoSTFUWithTheLogs'] = 'yes'
end
