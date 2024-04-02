# # copy of https://github.com/testdouble/cypress-rails/blob/402af0e2424b68983216e542e2cc1e9b960f9a7e/lib/cypress-rails/initializer_hooks.rb
# # with only necessary functionality

# module FakeCypressRailsRunner
#     def self.hooks
#       InitializerHooks.instance
#     end
  
#     class InitializerHooks
#       def self.instance
#         @instance ||= new
#       end
  
#       def before_server_start(&blk)
#         register(:before_server_start, blk)
#       end
  
#       def after_server_start(&blk)
#         register(:after_server_start, blk)
#       end
  
#       def after_transaction_start(&blk)
#         register(:after_transaction_start, blk)
#       end
  
#       def after_state_reset(&blk)
#         register(:after_state_reset, blk)
#       end
  
#       def before_server_stop(&blk)
#         register(:before_server_stop, blk)
#       end
  
#       def reset!
#         @hooks = {}
#       end
  
#       def run(name)
#         return unless @hooks[name]
#         @hooks[name].each do |blk|
#           blk.call
#         end
#       end
  
#       private
  
#       def register(name, blk)
#         @hooks[name] ||= []
#         @hooks[name] << blk
#       end
  
#       def initialize
#         reset!
#       end
#     end
#   end