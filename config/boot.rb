# frozen_string_literal: true
puts "#{Time.now.strftime('%H:%M:%S:%L')}: Start of config/boot.rb"

::ENV['BUNDLE_GEMFILE'] ||= ::File.expand_path('../Gemfile', __dir__)

require 'bundler/setup' # Set up gems listed in the Gemfile.
puts "\t#{Time.now.strftime('%H:%M:%S:%L')}: bootsnap setup"
require 'bootsnap/setup' # Speed up boot time by caching expensive operations.
puts "#{Time.now.strftime('%H:%M:%S:%L')}: end   of config/boot.rb"
puts ''

