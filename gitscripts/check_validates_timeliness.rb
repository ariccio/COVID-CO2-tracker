require 'rubygems'
require 'gems'

# require "http"

# RUBYGEMS_API_BASE_URL = 'https://rubygems.org/api/v2/rubygems/'

CURRENT_VERSION = '6.0.0.beta2'
# CURRENT_VERSION = 'fartipelago'
# def check_validates_timeliness
#     validates_timeliness_in_rubygems = "#{RUBYGEMS_API_BASE_URL}/validates_timeliness"
# end

def run

    correct_latest_version = Gems.versions('validates_timeliness')[0]["number"]
    if (correct_latest_version != CURRENT_VERSION)
        puts "Possible new version available: #{correct_latest_version}"
    end
    # pp "\"latest_version\" #{Gems.latest_version('validates_timeliness')}"
end

run


