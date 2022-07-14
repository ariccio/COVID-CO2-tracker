require 'rubygems'
require 'gems'

# require "http"
# RUBYGEMS_API_BASE_URL = 'https://rubygems.org/api/v2/rubygems/'
# def check_validates_timeliness
#     validates_timeliness_in_rubygems = "#{RUBYGEMS_API_BASE_URL}/validates_timeliness"
# end

CURRENT_VERSION = '6.0.0.beta2'
# CURRENT_VERSION = 'fartipelago'
VALIDATES_TIMELINESS = 'validates_timeliness'

def run
    correct_latest_version = Gems.versions(VALIDATES_TIMELINESS)[0]["number"]
    
    if (correct_latest_version == CURRENT_VERSION)
        puts "Probably no new version of #{VALIDATES_TIMELINESS} available."
        # pp "\"latest_version\" #{Gems.latest_version('validates_timeliness')}"
        return
    end
    
    puts "Possible new version #{VALIDATES_TIMELINESS} available: #{correct_latest_version}"
    # Lefthook will treat this as a fail and stop the push.
    exit(1)
end

run


