# copy of https://github.com/testdouble/cypress-rails/blob/402af0e2424b68983216e542e2cc1e9b960f9a7e/lib/cypress-rails/resets_state.rb 
# with only necessary functionality

require_relative "cypress_rails_config"
require_relative "manages_transactions"
require_relative "initializer_hooks"

module FakeCypressRailsRunner
  class ResetsState
    def initialize
      @manages_transactions = ManagesTransactions.instance
      @initializer_hooks = InitializerHooks.instance
    end

    def call(transactional_server:)
      
      if transactional_server
        puts("calling ResetsState for transactional server...")
        @manages_transactions.rollback_transaction
        
        @manages_transactions.begin_transaction
      else
        puts("calling ResetsState for NON-transactional server, skipping setup of transactions...")
      end
      @initializer_hooks.run(:after_state_reset)
    end
  end
end