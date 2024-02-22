# copy of https://github.com/testdouble/cypress-rails/blob/402af0e2424b68983216e542e2cc1e9b960f9a7e/lib/cypress-rails/tracks_resets.rb
# with only necessary functionality

require_relative "resets_state"

module FakeCypressRailsRunner
  class TracksResets
    def self.instance
      @instance ||= new
    end

    def reset_needed!
      @reset_needed = true
    end

    def reset_state_if_needed(transactional_server)
      if @reset_needed
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