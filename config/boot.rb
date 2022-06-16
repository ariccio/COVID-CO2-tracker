# frozen_string_literal: true
puts "Start of config/boot.rb: #{Time.now.strftime("%H:%M:%S:%L")}"

::ENV['BUNDLE_GEMFILE'] ||= ::File.expand_path('../Gemfile', __dir__)

require 'bundler/setup' # Set up gems listed in the Gemfile.
puts "\tbootsnap setup: #{Time.now.strftime("%H:%M:%S:%L")}"
require 'bootsnap/setup' # Speed up boot time by caching expensive operations.
puts "end   of config/boot.rb: #{Time.now.strftime("%H:%M:%S:%L")}"
puts ""

