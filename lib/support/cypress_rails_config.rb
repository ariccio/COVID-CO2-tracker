require_relative "cypress_rails_env"

module FakeCypressRailsRunner
    class CypressRailsConfig
        attr_accessor :rails_dir, :cypress_dir, :host, :port, :base_path, :transactional_server, :cypress_cli_opts

        def initialize(
          rails_dir: Env.fetch("CYPRESS_RAILS_DIR", default: Dir.pwd),
          cypress_dir: Env.fetch("CYPRESS_RAILS_CYPRESS_DIR", default: rails_dir),
          host: Env.fetch("CYPRESS_RAILS_HOST", default: "127.0.0.1"),
          port: Env.fetch("CYPRESS_RAILS_PORT", default: 3002),
          base_path: Env.fetch("CYPRESS_RAILS_BASE_PATH", default: "/"),
          transactional_server: Env.fetch("CYPRESS_RAILS_TRANSACTIONAL_SERVER", type: :boolean, default: true),
          cypress_cli_opts: Env.fetch("CYPRESS_RAILS_CYPRESS_OPTS", default: "")
        )
          @rails_dir = rails_dir
          @cypress_dir = cypress_dir
          @host = host
          @port = port
          @base_path = base_path
          @transactional_server = transactional_server
          @cypress_cli_opts = cypress_cli_opts
        end
    
        def to_s
          <<~DESC
    
            cypress-rails configuration:
            ============================
             CYPRESS_RAILS_DIR.....................#{rails_dir.inspect}
             CYPRESS_RAILS_CYPRESS_DIR.............#{cypress_dir.inspect}
             CYPRESS_RAILS_HOST....................#{host.inspect}
             CYPRESS_RAILS_PORT....................#{port.inspect}
             CYPRESS_RAILS_BASE_PATH...............#{base_path.inspect}
             CYPRESS_RAILS_TRANSACTIONAL_SERVER....#{transactional_server.inspect}
             CYPRESS_RAILS_CYPRESS_OPTS............#{cypress_cli_opts.inspect}
             -----

             RAILS_MAX_THREADS.....................#{::ENV.fetch('RAILS_MAX_THREADS', '(not set in ENV)')}
             RAILS_MIN_THREADS.....................#{::ENV.fetch('RAILS_MIN_THREADS', '(not set in ENV)')}
    
          DESC
        end    
    end
end