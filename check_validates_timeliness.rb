require 'rubygems'
require 'gems'

# require "http"

# RUBYGEMS_API_BASE_URL = 'https://rubygems.org/api/v2/rubygems/'

# def check_validates_timeliness
#     validates_timeliness_in_rubygems = "#{RUBYGEMS_API_BASE_URL}/validates_timeliness"
# end

correct_latest_version = Gems.versions('validates_timeliness')[0]["number"]

pp "latest correct version: #{correct_latest_version}"
pp "\"latest_version\" #{Gems.latest_version('validates_timeliness')}"


