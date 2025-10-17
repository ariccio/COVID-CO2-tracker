# Rails-Specific Patterns and Idioms for COVID CO2 Tracker

This guide contains deep Rails patterns, idioms, and gotchas specific to this project's architecture. Load this when working on Rails architecture, refactoring, or encountering Rails-specific issues.

## Table of Contents
1. [Rails Initialization Gotchas](#rails-initialization-gotchas)
2. [Service Object Patterns](#service-object-patterns)
3. [ActiveRecord Patterns](#activerecord-patterns)
4. [Background Job Best Practices](#background-job-best-practices)
5. [Rails Testing Patterns](#rails-testing-patterns)
6. [Database Migration Safety](#database-migration-safety)
7. [Rails Security Patterns](#rails-security-patterns)
8. [Performance Optimization](#performance-optimization)

---

## Rails Initialization Gotchas

### Critical: Time.zone Usage During Initialization

**The Problem**: Using `Time.zone` in files that run during Rails initialization will fail because the time zone hasn't been configured yet.

**Files that run during initialization** (BEFORE Time.zone available):
- `config/boot.rb`
- `config/application.rb` (before `Rails.application.initialize!`)
- `config/environments/*.rb` (early parts)
- `config/initializers/*.rb` (depends on order)
- Service modules loaded at startup

**Symptoms**:
```ruby
NoMethodError: undefined method `zone' for Time:Class
  # or
  # Silent failures with incorrect times
```

**Pattern to use instead**:
```ruby
# BAD - Fails during initialization
module ExportService
  def self.calculate_timestamp
    Time.zone.now  # Time.zone not available yet!
  end
end

# GOOD - Use Time.current (Rails provides this)
module ExportService
  def self.calculate_timestamp
    Time.current  # Works during initialization
  end
end

# ALSO GOOD - Lazy evaluation
module ExportService
  def self.calculate_timestamp
    -> { Time.zone.now }  # Proc evaluated later, when Time.zone available
  end
end
```

**When it's safe to use Time.zone**:
✓ Inside controller actions (request time)
✓ Inside model methods (runtime)
✓ Inside background jobs (job execution time)
✓ In rails console
✓ In tests (after Rails fully loads)

**Check before fixing**:
```bash
git log -p -S "Time.zone" config/initializers/
# Look for previous attempts to fix this
```

### Initialization Order Dependencies

**Framework features loading order**:
1. Gems (`Gemfile`, `bundle exec`)
2. Boot (`config/boot.rb`)
3. Application (`config/application.rb`)
4. Environments (`config/environments/*.rb`)
5. Initializers (`config/initializers/*.rb`, alphabetical)
6. Rake tasks and routes
7. Full Rails stack available

**What's NOT available in early initializers**:
- Database connection (depending on initializer order)
- Routes (not loaded yet)
- All models (may not be loaded yet)
- Time.zone (not configured yet)
- I18n (not fully configured)

**Red flags requiring extra caution**:
- Files named: `boot`, `bootstrap`, `init`, `startup`, `config`, `setup`
- Early hooks: `before_configuration`, `initializers`, `pre_init`, `on_load`

**Pattern for safe initialization**:
```ruby
# config/initializers/export_config.rb

# BAD - Database query during initialization
ExportService.configure do |config|
  config.default_format = Export.pluck(:format).first  # Database not ready!
end

# GOOD - Lazy evaluation
ExportService.configure do |config|
  config.default_format = -> { Export.pluck(:format).first }
end

# BEST - Use environment variables or constants
ExportService.configure do |config|
  config.default_format = ENV.fetch('DEFAULT_EXPORT_FORMAT', 'csv')
end
```

---

## Service Object Patterns

### Module Methods vs Instance Methods

**STRONGLY prefer module methods** for service objects. Instance methods only when truly need instance state.

**Why module methods**:
- Explicit dependencies (parameters)
- No hidden state
- Easier to test
- More functional
- Composable
- No confusion about instance variables

**Pattern**:
```ruby
# BAD - Instance methods with hidden dependencies
class ExportService
  def initialize(user, export_params)
    @user = user
    @export_params = export_params
  end

  def create_export
    validate_params  # What parameters does this use?
    authorize_user   # What does this check?
    generate_export  # Where does data come from?
  end

  private

  def validate_params
    # Uses @export_params implicitly
  end

  def authorize_user
    # Uses @user implicitly
  end

  def generate_export
    # Uses both @user and @export_params implicitly
  end
end

# GOOD - Module methods with explicit parameters
module ExportService
  def self.create(user:, export_params:, format: 'csv')
    validate(params: export_params)
    authorize(user: user, action: :create_export)
    generate(user: user, params: export_params, format: format)
  end

  def self.validate(params:)
    # Explicit: knows it needs params
    raise ArgumentError, "Invalid format" unless valid_format?(params[:format])
    return params
  end

  def self.authorize(user:, action:)
    # Explicit: knows it needs user and action
    raise AuthorizationError unless user.can?(action)
    return true
  end

  def self.generate(user:, params:, format:)
    # Explicit: knows it needs user, params, and format
    Export.create!(
      user: user,
      format: format,
      data: format_data(data: params[:data], format: format)
    )
  end

  def self.format_data(data:, format:)
    # Even helper methods are explicit
    case format
    when 'csv' then CsvFormatter.format(data: data)
    when 'json' then JsonFormatter.format(data: data)
    else raise ArgumentError, "Unknown format: #{format}"
    end
  end

  def self.valid_format?(format)
    ['csv', 'json', 'xml'].include?(format)
  end
end
```

### Embrace Many Parameters

**Don't be afraid of many parameters**. Explicit is better than implicit.

```ruby
# EXCELLENT - Many explicit parameters
module ExportDataProcessor
  def self.process(
    records:,
    user_id:,
    format:,
    filters:,
    pagination:,
    sort_order:,
    include_relations:,
    timestamp:,
    options: {}
  )
    # Every dependency is obvious
    # Easy to test with exact inputs
    # No hidden state
    # Clear what can affect behavior
  end
end

# This is MUCH better than:
class ExportDataProcessor
  def initialize(records, user_id, format)
    @records = records
    @user_id = user_id
    @format = format
    @filters = nil
    @pagination = nil
    # ... where do these get set?
  end

  def process
    # What instance variables does this use?
    # Where do filters come from?
    # Can't tell without reading entire class
  end
end
```

### Breaking Down Complex Methods

**When a method exceeds 50 lines**, extract into smaller module methods:

```ruby
# BAD - 80 line method doing everything
module ExportService
  def self.create_and_process(user:, params:)
    # 80 lines of mixed concerns
  end
end

# GOOD - Broken into focused methods
module ExportService
  def self.create_and_process(user:, params:)
    validated_params = validate_params(params: params)
    export = create_export(user: user, params: validated_params)
    schedule_processing(export: export)
    notify_user(user: user, export: export)
    return export
  end

  def self.validate_params(params:)
    # 10-15 lines focused on validation
  end

  def self.create_export(user:, params:)
    # 10-15 lines focused on creation
  end

  def self.schedule_processing(export:)
    # 10-15 lines focused on job scheduling
  end

  def self.notify_user(user:, export:)
    # 10-15 lines focused on notification
  end
end
```

**Each method**:
- Single responsibility
- Clear purpose (name describes what it does)
- 10-60 lines max
- Explicit parameters
- Returns value or raises exception
- No side effects except the main purpose

### Fail-Fast Pattern

**Prefer early returns over nested conditionals**:

```ruby
# BAD - Arrow code (nested conditionals)
module ExportService
  def self.create(user:, params:)
    if user.present?
      if user.can?(:create_export)
        if params[:format].present?
          if valid_format?(params[:format])
            # 20 lines of actual work nested deeply
          else
            raise InvalidFormatError
          end
        else
          raise MissingFormatError
        end
      else
        raise UnauthorizedError
      end
    else
      raise UserRequiredError
    end
  end
end

# GOOD - Fail-fast with early returns/raises
module ExportService
  def self.create(user:, params:)
    # Check preconditions first, fail fast
    raise UserRequiredError if user.blank?
    raise UnauthorizedError unless user.can?(:create_export)
    raise MissingFormatError if params[:format].blank?
    raise InvalidFormatError unless valid_format?(params[:format])

    # Actual work at the main level (not nested)
    export = Export.create!(
      user: user,
      format: params[:format],
      data: prepare_data(params: params)
    )

    schedule_processing(export: export)
    return export
  end

  def self.prepare_data(params:)
    # More focused work
  end

  def self.schedule_processing(export:)
    # More focused work
  end

  def self.valid_format?(format)
    ['csv', 'json', 'xml'].include?(format)
  end
end
```

---

## ActiveRecord Patterns

### N+1 Query Prevention

**Use includes for eager loading**:

```ruby
# BAD - N+1 queries (100 measurements = 301 queries)
measurements = Measurement.all
measurements.each do |measurement|
  puts measurement.venue.name  # Query for each measurement
  puts measurement.venue.user.email  # Another query for each
  puts measurement.co2_readings.count  # And another for each
end

# GOOD - Eager loading with includes (4 queries total)
measurements = Measurement
  .includes(venue: [:user, :place])
  .preload(:co2_readings)

measurements.each do |measurement|
  puts measurement.venue.name  # No query, already loaded
  puts measurement.venue.user.email  # No query, already loaded
  puts measurement.co2_readings.count  # No query, already loaded
end
```

**Differences**:
- `includes`: Eager loads, can use in where clause
- `preload`: Eager loads with separate queries (better for large has_many)
- `joins`: Only for filtering, doesn't eager load
- `eager_load`: Forces LEFT OUTER JOIN

**Pattern for this project**:
```ruby
# For measurements with venue details
Measurement.includes(venue: [:user, :place]).preload(:co2_readings)

# For exports with user
Export.includes(:user)

# For venue leaderboard
Venue.includes(:measurements).where("measurements.co2_ppm > ?", 800)
```

### Query Optimization

**Extract complex navigation chains**:

```ruby
# BAD - High Rubocop ABC complexity
def venue_details
  measurement.venue&.place&.name + " - " +
  measurement.venue&.user&.email + " " +
  measurement.venue&.co2_readings&.average(:ppm)&.to_s
end

# GOOD - Extracted into descriptive methods
def venue_details
  "#{place_name} - #{owner_email} #{average_co2}"
end

def place_name
  measurement.venue&.place&.name || "Unknown"
end

def owner_email
  measurement.venue&.user&.email || "unknown@example.com"
end

def average_co2
  measurement.venue&.co2_readings&.average(:ppm)&.to_s || "N/A"
end
```

### Scopes for Reusable Queries

```ruby
# app/models/measurement.rb

# BAD - Repeated query logic
Measurement.where("co2_ppm > ?", 800).where(verified: true).order(created_at: :desc)
Measurement.where("co2_ppm > ?", 800).where(verified: true).limit(10)

# GOOD - Reusable scopes
class Measurement < ApplicationRecord
  scope :high_co2, -> { where("co2_ppm > ?", 800) }
  scope :verified, -> { where(verified: true) }
  scope :recent, -> { order(created_at: :desc) }
  scope :top, ->(limit = 10) { limit(limit) }

  # Chainable
  scope :dangerous, -> { high_co2.verified.recent }
end

# Usage
Measurement.dangerous.top(10)
Measurement.high_co2.verified.top(20)
```

---

## Background Job Best Practices

### Explicit Job Coordination

**Pattern for this project** (Sidekiq or delayed_job):

```ruby
# BAD - Implicit dependencies, unclear priority
class ExportWorker
  def perform(export_id)
    export = Export.find(export_id)
    process(export)  # What happens if this fails?
  end
end

# GOOD - Explicit error handling, priority, retry logic
class ExportWorker
  include Sidekiq::Worker

  sidekiq_options(
    queue: :exports,
    retry: 3,
    backtrace: true
  )

  def perform(export_id)
    export = Export.find(export_id)

    ExportService.process(
      export: export,
      on_error: ->(error) { handle_error(export: export, error: error) }
    )

  rescue ActiveRecord::RecordNotFound => e
    # Export deleted, log and skip
    Rails.logger.warn("Export #{export_id} not found: #{e.message}")
  rescue StandardError => e
    # Unexpected error, will retry via Sidekiq
    Rails.logger.error("Export #{export_id} failed: #{e.message}")
    raise  # Let Sidekiq retry
  end

  private

  def handle_error(export:, error:)
    export.update!(
      status: 'failed',
      error_message: error.message
    )
    ExportMailer.failure_notification(export: export).deliver_later
  end
end
```

### Job Priorities

**This project's queue priorities**:
```ruby
# config/sidekiq.yml
:queues:
  - [critical, 10]    # User-facing actions (exports, alerts)
  - [default, 5]      # Background processing
  - [low, 1]          # Cleanup, analytics
```

**Usage**:
```ruby
# High priority - user waiting
ExportWorker.set(queue: :critical).perform_later(export.id)

# Normal priority - background
DataCleanupWorker.set(queue: :default).perform_later

# Low priority - can wait
AnalyticsWorker.set(queue: :low).perform_later
```

---

## Rails Testing Patterns

### RSpec Structure for This Project

```ruby
# spec/services/export_service_spec.rb

RSpec.describe ExportService do
  let(:user) { create(:user) }
  let(:measurements) { create_list(:measurement, 10, user: user) }
  let(:export_params) do
    {
      format: 'csv',
      filters: { start_date: '2025-01-01' },
      include_relations: true
    }
  end

  describe '.create' do
    context 'with valid parameters' do
      it 'creates an export record' do
        expect {
          ExportService.create(user: user, params: export_params)
        }.to change { Export.count }.by(1)
      end

      it 'schedules background processing' do
        expect(ExportWorker).to receive(:perform_later)
        ExportService.create(user: user, params: export_params)
      end

      it 'returns the export record' do
        export = ExportService.create(user: user, params: export_params)
        expect(export).to be_a(Export)
        expect(export.user).to eq(user)
        expect(export.format).to eq('csv')
      end
    end

    context 'with invalid format' do
      let(:invalid_params) { export_params.merge(format: 'invalid') }

      it 'raises InvalidFormatError' do
        expect {
          ExportService.create(user: user, params: invalid_params)
        }.to raise_error(ExportService::InvalidFormatError)
      end

      it 'does not create an export record' do
        expect {
          ExportService.create(user: user, params: invalid_params) rescue nil
        }.not_to change { Export.count }
      end
    end

    context 'when user lacks permission' do
      let(:unauthorized_user) { create(:user, :unprivileged) }

      it 'raises UnauthorizedError' do
        expect {
          ExportService.create(user: unauthorized_user, params: export_params)
        }.to raise_error(ExportService::UnauthorizedError)
      end
    end
  end

  describe '.validate' do
    it 'returns validated parameters for valid input' do
      result = ExportService.validate(params: export_params)
      expect(result[:format]).to eq('csv')
      expect(result[:filters]).to be_a(Hash)
    end

    it 'raises error for missing format' do
      invalid = export_params.except(:format)
      expect {
        ExportService.validate(params: invalid)
      }.to raise_error(ArgumentError, /format/i)
    end
  end
end
```

### Testing Module Methods

**Pattern**:
```ruby
# Module method testing
RSpec.describe ExportService do
  describe '.format_data' do
    let(:data) { [{ name: 'Test', value: 123 }] }

    context 'with csv format' do
      it 'returns CSV string' do
        result = ExportService.format_data(data: data, format: 'csv')
        expect(result).to include('name,value')
        expect(result).to include('Test,123')
      end
    end

    context 'with json format' do
      it 'returns JSON string' do
        result = ExportService.format_data(data: data, format: 'json')
        parsed = JSON.parse(result)
        expect(parsed.first['name']).to eq('Test')
        expect(parsed.first['value']).to eq(123)
      end
    end
  end
end
```

---

## Database Migration Safety

### Zero-Downtime Deploy Pattern

**Adding a column**:
```ruby
# Step 1: Add column with default (nullable first)
class AddVersionToExports < ActiveRecord::Migration[7.0]
  def change
    add_column :exports, :version, :integer, default: 1
  end
end

# Deploy and run migration
# Old code still works (ignores new column)

# Step 2: Update code to use new column
# Deploy new code

# Step 3: Make column non-nullable (separate migration)
class MakeExportVersionNotNull < ActiveRecord::Migration[7.0]
  def change
    change_column_null :exports, :version, false
  end
end
```

**Removing a column**:
```ruby
# Step 1: Deploy code that stops using column
# (but column still exists)

# Step 2: Remove column in separate migration
class RemoveDeprecatedFromExports < ActiveRecord::Migration[7.0]
  def change
    remove_column :exports, :deprecated_field
  end
end

# Deploy and run migration
```

### Data Migration Pattern

```ruby
class AddExportVersioning < ActiveRecord::Migration[7.0]
  def up
    add_column :exports, :version, :integer

    # Data migration in reversible block
    reversible do |dir|
      dir.up do
        # Set version for existing exports
        Export.where(version: nil).find_each do |export|
          export.update_column(:version, 1)
        end
      end

      dir.down do
        # Rollback doesn't need to restore data
        # (column will be removed)
      end
    end

    # Now make it non-nullable
    change_column_null :exports, :version, false
  end

  def down
    remove_column :exports, :version
  end
end
```

### Index Addition (Long Tables)

**Problem**: Adding index locks table on large tables

**Solution**: Add index concurrently
```ruby
class AddIndexToMeasurementsCo2Ppm < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!  # Required for concurrent

  def change
    add_index :measurements, :co2_ppm, algorithm: :concurrently
  end
end
```

---

## Rails Security Patterns

### Strong Parameters

```ruby
# app/controllers/exports_controller.rb

class ExportsController < ApplicationController
  def create
    export = Export.new(export_params)
    export.user = current_user  # Explicit assignment, not from params

    if export.save
      ExportWorker.perform_later(export.id)
      render json: export, status: :created
    else
      render json: { errors: export.errors }, status: :unprocessable_entity
    end
  end

  private

  def export_params
    params.require(:export).permit(
      :format,
      :start_date,
      :end_date,
      filters: [:venue_id, :min_co2, :max_co2],
      options: [:include_relations, :aggregate]
    )
  end
end
```

### Authorization Pattern

```ruby
# app/services/export_service.rb

module ExportService
  class UnauthorizedError < StandardError; end

  def self.create(user:, params:)
    # Explicit authorization check
    authorize_user!(user: user, action: :create_export)

    # ... rest of method
  end

  def self.authorize_user!(user:, action:)
    unless user.can?(action)
      raise UnauthorizedError, "User #{user.id} cannot #{action}"
    end
    return true
  end
end
```

---

## Performance Optimization

### Query Performance

**Use bullet gem** to detect N+1:
```ruby
# config/environments/development.rb

config.after_initialize do
  Bullet.enable = true
  Bullet.bullet_logger = true
  Bullet.console = true
end
```

**Analyze queries**:
```ruby
# In rails console
ActiveRecord::Base.logger = Logger.new(STDOUT)

# Then run your query
Measurement.includes(venue: :user).where("co2_ppm > ?", 800).to_a

# Watch SQL output
```

### Caching Patterns

```ruby
# Fragment caching in views
<% cache measurement do %>
  <%= render measurement %>
<% end %>

# Russian doll caching
<% cache venue do %>
  <%= venue.name %>
  <%= render venue.measurements %>
<% end %>

# Low-level caching
def expensive_calculation
  Rails.cache.fetch("expensive_calc_#{id}", expires_in: 1.hour) do
    # Expensive operation
    calculate_something_slow
  end
end
```

---

## Critical Gotchas to Remember

⚠ **Don't use Time.zone in initialization code** - Use Time.current instead
⚠ **Prefer module methods over instance methods** - Explicit parameters
⚠ **Embrace many parameters** - Better than hidden dependencies
⚠ **Fail-fast with early returns** - Avoid arrow code
⚠ **Eager load associations** - Prevent N+1 queries
⚠ **Test before deploying migrations** - Especially on large tables
⚠ **Add indexes concurrently** - Don't lock production tables
⚠ **Never return default values on error** - Bubble errors up
⚠ **Use strong parameters** - Prevent mass assignment
⚠ **Explicit authorization checks** - Don't rely on implicit rules

✓ Following Rails best practices and this project's patterns.
