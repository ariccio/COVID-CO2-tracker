# copy of https://github.com/testdouble/cypress-rails/blob/402af0e2424b68983216e542e2cc1e9b960f9a7e/lib/cypress-rails/manages_transactions.rb#L4
# with only necessary functionality
require_relative "initializer_hooks"



module FakeCypressRailsRunner
    class ManagesTransactions
        def self.instance
          @instance ||= new
        end
    
        # https://github.com/rails/rails/blob/3ecc26981476d6a8c4f1ba5bd33bfdeef1659a0f/activesupport/lib/active_support/log_subscriber.rb#L68C1-L74C6
        # ANSI sequence modes
        MODES = {
          clear:     0,
          bold:      1,
          italic:    3,
          underline: 4,
        }

        # https://github.com/rails/rails/blob/3ecc26981476d6a8c4f1ba5bd33bfdeef1659a0f/activesupport/lib/active_support/log_subscriber.rb#L76C1-L84C23
          # ANSI sequence colors
          COLORS = {
            BLACK: "\e[30m",
            RED: "\e[31m",
            GREEN: "\e[32m",
            YELLOW: "\e[33m",
            BLUE: "\e[34m",
            MAGENTA: "\e[35m",
            CYAN: "\e[36m",
            WHITE: "\e[37m"
          }


        # https://github.com/rails/rails/blob/3ecc26981476d6a8c4f1ba5bd33bfdeef1659a0f/activesupport/lib/active_support/log_subscriber.rb#L175
        def color(text, color)
          color = COLORS[color] if color.is_a?(Symbol)
          # puts "color: #{color}"
          # MODES = {
          #   clear:     0,
          #   bold:      1,
          #   italic:    3,
          #   underline: 4,
          # }
          # "\e[#{modes.join(";")}m"
          
          bold_mode = "\e[1m"
          italic_mode = "\e[3m"
          underline_mode = "\e[4m"
          
          clear = "\e[0m"
          "#{bold_mode}#{color}#{text}#{clear}"
        end

        def begin_transaction
          puts (color("connection_pool_names: #{ActiveRecord::Base.connection_handler.connection_pool_names}", :BLUE))
          ActiveRecord::Base.connection_handler.flush_idle_connections!
          ActiveRecord::Base.connection_handler.clear_active_connections!(:all)
          # ActiveRecord::Base.connection_handler.clear_all_connections!(:all)
          # ActiveRecord::Base.connection_handler.remove_connection
          @connections ||= []
          ActiveRecord::Base.connection_handler.connection_pool_list.each_with_index do |pool, pool_idx|
            puts(color("beginning transaction... #{pool_idx} #{pool.connection}, pool.connection.active?: #{pool.connection.active?}", :MAGENTA))
            puts("")
            # next if pool.connection.active?
            pool.connection.begin_transaction joinable: false, _lazy: false
            pool.connection.lock_thread = true
            puts(color("beginning transaction... #{pool_idx} #{pool.connection}, pool.connection.active?: #{pool.connection.active?}", :MAGENTA))
            puts(color("beginning transaction... #{pool_idx} #{pool.stat}", :MAGENTA))
            @connections << pool.connection
          end
          # @connections = gather_connections
          # @connections.each_with_index do |connection, index|
          #   puts(color("beginning transaction... #{index} #{connection.pool.stat}", :MAGENTA))
          #   next if connection.closed?
          #   connection.begin_transaction joinable: false, _lazy: false
          #   connection.pool.lock_thread = true
          #   puts(color("beginning transaction... #{index} #{connection.pool.stat}", :MAGENTA))
          # end

          # ActiveRecord::Base.connection_handler.connection_pool_list.each_with_index do |pool, pool_index|
          #   pool.connections.each_with_index do |connection, connection_index|
          #     puts(color("#{pool_index} #{connection_index} #{connection}", :MAGENTA))
          #   end

          # end
    
          # When connections are established in the future, begin a transaction too
          
          # see also: https://github.com/instructure/switchman/blob/master/lib/switchman/active_record/test_fixtures.rb
          @connection_subscriber = ActiveSupport::Notifications.subscribe("!connection.active_record") { |name, started, finished, data, payload|
            # puts payload
            

            puts(color("ATTEMPT beginning transaction for #{name}, #{started}, #{finished}, #{data}, #{payload}", :RED))
            if payload.key?(:spec_name) && (spec_name = payload[:spec_name])
              puts("payload.key?(:spec_name) && (spec_name = payload[:spec_name])")
              setup_shared_connection_pool
    
              begin
                connection = ActiveRecord::Base.connection_handler.retrieve_connection(spec_name)
              rescue ActiveRecord::ConnectionNotEstablished
                connection = nil
                puts( color("connection NOT established for #{spec_name}", :RED))
              end
    
              if connection && !@connections.include?(connection)
                puts("beginning transaction for #{spec_name}")
                connection.begin_transaction joinable: false, _lazy: false
                connection.pool.lock_thread = true
                @connections << connection
              end
            end
          }
    
          @initializer_hooks.run(:after_transaction_start)
        end
    
        def rollback_transaction
          if @connections.present?
            # puts("rollback_transaction: connections present to rollback")
          else
            puts(color("rollback_transaction: NO connections present to rollback", :RED))
            # return
          end
    
          if @connection_subscriber
            puts("unsubscribing from connection subscriber")
            ActiveSupport::Notifications.unsubscribe(@connection_subscriber)
          else
            puts ("no connection subscriber to unsubscribe from")
          end
    
          puts("number of connections before rollback, flush, and release: #{@connections.length}")
          @connections.each_with_index do |connection, idx|
            # puts connection.connection_db_config
            # puts(color("connection_specification_name: #{connection.connection_specification_name}", :BLUE))
            # puts("owner: #{connection.owner}")
            if connection.active?
              puts("#{idx} active connection.adapter_name: #{connection.adapter_name}")
            else 
              puts("#{idx} NON-active connection.adapter_name: #{connection.adapter_name}")
            end
            puts(color("#{idx} current transaction: #{connection.current_transaction}", :RED))
            puts(color("#{idx} open transactions: #{connection.open_transactions}", :RED))
            if connection.transaction_open?
              connection.rollback_transaction
            end 
            connection.disconnect!
            # connection.close
            connection.throw_away!
            connection.pool.lock_thread = false
            # connection.pool.flush!
            # connection.pool.checkin(connection)
            # ActiveRecord::Base.connection_handler.remove_connection(connection)
            puts("#{idx} Num waiting: #{connection.pool.num_waiting_in_queue}")
          end
          if @connections.length > 0
            puts("number of connections after rollback, flush, and release: #{@connections.length}... clearing")
            @connections.clear

          else
            # puts ("No connections after rollback, flush")
          end
          # ActiveRecord::Base.connection_handler.flush_idle_connections!
          # ActiveRecord::Base.connection_handler.clear_active_connections!
          if ActiveRecord::Base.connection_handler.nil?
            puts ("connection handler is nil")
            return
          else
            # puts ("connection handler NOT nil after flushing and clearing...")
          end
          if (ActiveRecord::Base.connection_handler.connection_pool_list.nil?)
            puts ("connection handler connection pool list is nil")
            return
          else
            # puts ("connection_pool_list NOT nil after flushing and clearing...")
          end
          puts("number of connections after rollback_transaction: #{ActiveRecord::Base.connection_handler&.connection_pool_list&.length}")
        end
    
        private
    
        def initialize
          @initializer_hooks = InitializerHooks.instance
        end
    
        def gather_connections
          setup_shared_connection_pool
    
          ActiveRecord::Base.connection_handler.connection_pool_list.map(&:connection)
        end
    
        # Shares the writing connection pool with connections on
        # other handlers.
        #
        # In an application with a primary and replica the test fixtures
        # need to share a connection pool so that the reading connection
        # can see data in the open transaction on the writing connection.
        def setup_shared_connection_pool
          return unless ActiveRecord::TestFixtures.respond_to?(:setup_shared_connection_pool)
          @legacy_saved_pool_configs ||= Hash.new { |hash, key| hash[key] = {} }
          @saved_pool_configs ||= Hash.new { |hash, key| hash[key] = {} }
    
          ActiveRecord::TestFixtures.instance_method(:setup_shared_connection_pool).bind(self).call
        end
      end    
end
