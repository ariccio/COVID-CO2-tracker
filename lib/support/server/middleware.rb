# # https://github.com/testdouble/cypress-rails/blob/402af0e2424b68983216e542e2cc1e9b960f9a7e/lib/cypress-rails/server/middleware.rb
# # A whole server, really?

# module FakeCypressRailsRunner
#     class Server
#       class Middleware
#         class Counter
#           def initialize
#             @value = []
#             @mutex = Mutex.new
#           end
  
#           def increment(uri)
#             @mutex.synchronize { @value.push(uri) }
#           end
  
#           def decrement(uri)
#             @mutex.synchronize { @value.delete_at(@value.index(uri) || @value.length) }
#           end
  
#           def positive?
#             @mutex.synchronize { @value.length.positive? }
#           end
  
#           def value
#             @mutex.synchronize { @value.dup }
#           end
#         end
  
#         attr_reader :error
  
#         def initialize(app, server_errors, extra_middleware = [])
#           @app = app
#           @extended_app = extra_middleware.inject(@app) { |ex_app, klass|
#             klass.new(ex_app)
#           }
#           @counter = Counter.new
#           @server_errors = server_errors
#         end
  
#         def pending_requests
#           puts("pending_requests: #{@counter.value}")
#           @counter.value
#         end
  
#         def pending_requests?
#           @counter.positive?
#         end
  
#         def clear_error
#           @error = nil
#         end
  
#         def call(env)
#           puts("env: #{env}")
#           if env["PATH_INFO"] == "/__identify__"
#             [200, {}, [@app.object_id.to_s]]
#           else
#             @counter.increment(env["REQUEST_URI"])
#             begin
#               @extended_app.call(env)
#             rescue *@server_errors => e
#               @error ||= e
#               puts "Cypress rails db hackwork exception: #{e.full_message}"
#               raise e
#             ensure
#               @counter.decrement(env["REQUEST_URI"])
#             end
#           end
#         end
#       end
#     end
#   end