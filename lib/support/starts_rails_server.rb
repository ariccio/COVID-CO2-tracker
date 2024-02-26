# copied from https://github.com/testdouble/cypress-rails/blob/402af0e2424b68983216e542e2cc1e9b960f9a7e/lib/cypress-rails/starts_rails_server.rb#L5
# with only necessary functionality


## this is probably wrong

require_relative "tracks_resets"
require_relative "server"

module FakeCypressRailsRunner
  class StartsRailsServer
    def call(host:, port:, transactional_server:)
      configure_rails_to_run_our_state_reset_on_every_request!(transactional_server)
      app = create_rack_app
      puts("starting new backend cypress rails db manager server")
      Server.new(app, host: host, port: port).tap do |server|
        server.boot
      end
    end

    def configure_rails_to_run_our_state_reset_on_every_request!(transactional_server)
      Rails.application.executor.to_run do
        TracksResets.instance.reset_state_if_needed(transactional_server)
      end
    end

    def create_rack_app
      puts "creating ugly basic rack app to respond to cypress reset state requests"
      Rack::Builder.new do
        use Rack::CommonLogger
        map "/cypress_rails_reset_state" do
          run lambda { |env|
            if Rails.env.production?
              raise StandardError, "Logic error - do not continue"
            end
            puts("\n\n\n\n\nRESETTING DB\n\n\n\n\n")
            TracksResets.instance.reset_needed!
            [202, {"Content-Type" => "text/plain"}, ["Accepted"]]
          }
        end
        # map "/" do
        #   run Rails.application
        # end
      end
    end
  end
end