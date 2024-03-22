if ENV['IsEndToEndBackendServerSoSTFUWithTheLogs']
    path = Rails.root.join("lib", "support", "fake_cypress_rails_runner.rb")
    puts "Trying to load #{path}"
    exist = File.file?(path)
    puts "File exists? #{exist}"
    readable = File.readable?(path)
    puts "File readable? #{readable}"
    require_relative path
    FakeCypressRailsRunner::RunBackend.new.call(transactional_server: true)

    ActiveSupport::Notifications.subscribe("!connection.active_record") { |name, started, finished, data, payload|
        puts("name: #{name}, started: #{started}, finished: #{finished}, data: #{data}, payload: #{payload}")
    }
end