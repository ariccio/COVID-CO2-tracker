return unless Rails.env.test? || Rails.env.development?

CypressRails.hooks.before_server_start do
    # Called once, before either the transaction or the server is started
    ::ENV['IsEndToEndBackendServerSoSTFUWithTheLogs'] = 'yes'
  end
