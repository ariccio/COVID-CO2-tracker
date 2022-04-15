# frozen_string_literal: true
puts "Start of config/boot.rb: #{Time.now}"

::ENV['BUNDLE_GEMFILE'] ||= ::File.expand_path('../Gemfile', __dir__)

require 'bundler/setup' # Set up gems listed in the Gemfile.
puts "bootsnap setup: #{Time.now}"
require 'bootsnap/setup' # Speed up boot time by caching expensive operations.
puts "end   of config/boot.rb: #{Time.now}"
puts ""

