# copy of https://github.com/testdouble/cypress-rails/blob/402af0e2424b68983216e542e2cc1e9b960f9a7e/lib/cypress-rails/tracks_resets.rb
# with only necessary functionality

require_relative "resets_state"

module FakeCypressRailsRunner
  class TracksResets
    def self.instance
      @instance ||= new
    end

    def reset_needed!
      Thread.list.each_with_index do |t, i|
        puts("Thread #{i}: alive?: #{t.alive?}")
        puts("Thread #{i}: stop?: #{t.stop?}")
        t.backtrace.take(15).each_with_index do |line, index|
          puts("\t\tbacktrace #{index}: #{line}")
        end
        puts("Thread #{i}: group: #{t.group}")
        puts("Thread #{i}: status: #{t.status}")
        puts("Thread #{i}: inspect: #{t.inspect}")
      end
      @reset_needed = true
    end

    def reset_state_if_needed(transactional_server)
      if @reset_needed
        Thread.list.each_with_index do |t, i|
          puts("Thread #{i}: alive?: #{t.alive?}")
          puts("Thread #{i}: stop?: #{t.stop?}")
          t.backtrace.take(15).each_with_index do |line, index|
            puts("\t\tbacktrace #{index}: #{line}")
          end
          puts("Thread #{i}: group: #{t.group}")
          puts("Thread #{i}: status: #{t.status}")
          puts("Thread #{i}: inspect: #{t.inspect}")
        end
          puts("reset needed from backend cypress db manager rails server...")
        ResetsState.new.call(transactional_server: transactional_server)
        @reset_needed = false
      end
    end

    private

    def initialize
      @reset_needed = false
    end
  end
end