# A clone of https://github.com/testdouble/cypress-rails/blob/main/lib/cypress-rails/launches_cypress.rb#L8
# but most of the functionality is removed since I am managing cypress separately myself
# naming retained so people can more easily understand what I'm modeling this on.

require_relative "manages_transactions"
require_relative "starts_rails_server"
require_relative "initializer_hooks"


module FakeCypressRailsRunner
    class RunBackend
        def initialize
            @initializer_hooks = InitializerHooks.instance
            @manages_transactions = ManagesTransactions.instance
            @starts_rails_server = StartsRailsServer.new
        end
        def call(transactional_server:)
          puts("calling rails backend cypress transactional db server...")
            config = CypressRailsConfig.new
            puts config
            @initializer_hooks.run(:before_server_start)
            if config.transactional_server
                puts("transactional mode")
                @manages_transactions.begin_transaction
            else
                puts("NON transactional mode")
            end
            server = @starts_rails_server.call(
                host: config.host,
                port: config.port,
                transactional_server: config.transactional_server
              )
            puts("...CALLED")
            set_exit_hooks!(config)
        end
        def set_exit_hooks!(config)
            at_exit do
              puts("running at_exit hooks for backend cypress rails db manager server...")
              run_exit_hooks_if_necessary!(config)
            end
            Signal.trap("INT") do
              puts "Interrupt signal received, exiting cypress-rails…"
              exit
            end
        end
      
        def run_exit_hooks_if_necessary!(config)
          @at_exit_hooks_have_fired ||= false # avoid warning
          if @at_exit_hooks_have_fired
            puts "at_exit hooks already fired"
            return
          end
          # return if @at_exit_hooks_have_fired
    
          if config.transactional_server
            puts "running in transactional mode, need to rollback transaction..."
            @manages_transactions.rollback_transaction
          end
        ensure
          @initializer_hooks.run(:before_server_stop)
    
          @at_exit_hooks_have_fired = true
        end
          # def configure_rails_to_run_our_state_reset_on_every_request!(transactional_server)
          #   Rails.application.executor.to_run do
          #     TracksResets.instance.reset_state_if_needed(transactional_server)
          #   end
          # end
    end
end
