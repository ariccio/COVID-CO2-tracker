# frozen_string_literal: true

source 'https://rubygems.org'

git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '3.1.1'

# Bundle edge Rails instead: gem 'rails', github: 'rails/rails', branch: 'main'
gem 'rails', '~> 6.1.2', '>= 6.1.2.1'
# Use Puma as the app server
gem 'puma', '~> 5.0'
# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
# gem 'jbuilder', '~> 2.7'
# Use Redis adapter to run Action Cable in production
# gem 'redis', '~> 4.0'
# Use Active Model has_secure_password
gem 'bcrypt', '~> 3.1.7'

# Use Active Storage variant
# gem 'image_processing', '~> 1.2'

# Reduces boot times through caching; required in config/boot.rb
gem 'bootsnap', '>= 1.4.4', require: false

# Use Rack CORS for handling Cross-Origin Resource Sharing (CORS), making cross-origin AJAX possible
gem 'rack-cors'

group :development, :test do
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug', platforms: [:mri, :mingw, :x64_mingw, :mswin]
end

group :development do
  # Use sqlite3 as the database for Active Record
  # gem 'sqlite3', '~> 1.4'
  gem 'active_record_doctor', require: false
  gem 'rails-erd', require: false

  gem 'bullet'
  gem 'brakeman', require: false
end

# group :production do
gem 'pg'
# end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby]

gem 'rbnacl', '~> 7.1'

gem 'jwt', '~> 2.2'

# Open source is wonderful.
gem 'geokit-rails'
gem 'google_places'

# gem 'google_sign_in'
gem 'googleauth'

gem 'activeadmin'
gem 'devise' # for activeadmin
gem 'sassc-rails' # needed for css in activeadmin

# WHY DOES IT NOT LOAD ON HEROKU BUT FINE ON LOCAL WITHOUT THIS, CRUEL WORLD
gem 'rexml'

gem 'jsonapi-serializer'

gem 'validates_timeliness', '~> 6.0.0.alpha1'

gem 'barnes'

gem 'sentry-ruby'

gem 'sentry-rails'


gem 'tzinfo-data'


# https://stackoverflow.com/a/70500221/625687
gem 'net-smtp', require: false

