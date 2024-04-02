# # https://github.com/testdouble/cypress-rails/blob/402af0e2424b68983216e542e2cc1e9b960f9a7e/lib/cypress-rails/server/timer.rb
# # fuck


# module FakeCypressRailsRunner
#     class Server
#       class Timer
#         def initialize(expire_in)
#           @start = current
#           @expire_in = expire_in
#         end
  
#         def expired?
#           current - @start >= @expire_in
#         end
  
#         def stalled?
#           @start == current
#         end
  
#         private
  
#         def current
#           Process.clock_gettime(Process::CLOCK_MONOTONIC)
#         end
#       end
#     end
#   end