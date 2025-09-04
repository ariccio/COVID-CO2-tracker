# frozen_string_literal: true

namespace :start do
  task development: :environment do
    exec 'heroku local -f Procfile.dev'
  end
end

desc 'Start development server'
task start: 'start:development'


desc 'run tests'
task test: :environment do
  # https://relishapp.com/rspec/rspec-core/docs/command-line/rake-task
  # "We recommend you wrap this in a rescue clause"
  puts 'Running rspec tests...'
  begin
    require 'rspec/core/rake_task'
    RSpec::Core::RakeTask.new(:spec)
  rescue LoadError => e
    puts "RSpec is not available. Please add it to your Gemfile: #{e.message}"
  end
end