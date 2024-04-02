# # https://github.com/testdouble/cypress-rails/blob/402af0e2424b68983216e542e2cc1e9b960f9a7e/lib/cypress-rails/server/checker.rb
# # grr, cranky

# SSL_OPTIONS = {use_ssl: true, verify_mode: OpenSSL::SSL::VERIFY_NONE}

# module FakeCypressRailsRunner
#     class Server
#       class Checker
#         TRY_HTTPS_ERRORS = [EOFError, Net::ReadTimeout, Errno::ECONNRESET].freeze
  
#         def initialize(host, port)
#           @host, @port = host, port
#           @ssl = false
#         end
  
#         def request(&block)
#           ssl? ? https_request(&block) : http_request(&block)
#         rescue *TRY_HTTPS_ERRORS => e
#           res = https_request(&block)
#           @ssl = true
#           puts("Cypress rails db hackwork exception: #{e.full_message}")
#           res
#         end
  
#         def ssl?
#           @ssl
#         end
  
#         private
  
#         def http_request(&block)
#           make_request(read_timeout: 2, &block)
#         end
  
#         # def https_request(&block)
#         #   make_request(**ssl_options, &block)
#         # end
#         def https_request(&block)
#           make_request(**SSL_OPTIONS, &block)
#         end

        
#         def make_request(**options, &block)
#           Net::HTTP.start(@host, @port, options.merge(max_retries: 0), &block)
#         end
  
#         # def ssl_options
#         #   {use_ssl: true, verify_mode: OpenSSL::SSL::VERIFY_NONE}
#         # end
#       end
#     end
#   end