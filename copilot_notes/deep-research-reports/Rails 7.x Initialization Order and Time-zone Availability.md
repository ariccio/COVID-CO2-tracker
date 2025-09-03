# Rails 7.x Initialization Order and Time.zone Availability

ActiveSupport::TimeZone becomes available **after Rails railtie initializers run**, specifically during the ActiveSupport railtie's `initialize_time_zone` initializer. This occurs after `config/boot.rb` and `config/application.rb` are processed but before `config/initializers/*` files are loaded.

## When ActiveSupport::TimeZone becomes available

The Rails initialization sequence follows this critical order:

1. **config/boot.rb** - Sets up Bundler and load paths only. No Rails components loaded. **Time.zone NOT available**
2. **config/application.rb** - Defines application class and configuration. Rails frameworks not initialized yet. **Time.zone NOT available**
3. **Rails railtie loading** - `require "rails/all"` loads framework railties
4. **Railtie initializers run** - ActiveSupport railtie runs `initialize_time_zone`. **Time.zone becomes available HERE**
5. **config/initializers/*** - Custom initializers run. **Time.zone available**

The ActiveSupport railtie initializer that sets up Time.zone runs during the **bootstrap phase** of Rails initialization, after application configuration is read but before custom initializers execute.

## Why config/boot.rb and config/application.rb run before Time.zone

These files run before Time.zone is available because they serve different purposes in the boot sequence:

**config/boot.rb** only handles gem loading through Bundler. It executes before any Rails code, setting up `ENV["BUNDLE_GEMFILE"]` and requiring `bundler/setup`. No Rails components exist at this stage.

**config/application.rb** defines the Rails::Application subclass and sets configuration values like `config.time_zone = "Eastern Time (US & Canada)"`. However, this only **stores** the configuration. The actual Time.zone initialization happens later when the ActiveSupport railtie processes this stored configuration during its `initialize_time_zone` initializer.

The separation ensures configuration is collected before frameworks initialize, allowing Rails to apply settings properly during the railtie initialization phase.

## Official Rails guidance on Time.now vs Time.zone.now

Rails provides **Time.current** as the official solution for initialization timing issues. The Rails API documentation shows its implementation:

```ruby
def current
  ::Time.zone ? ::Time.zone.now : ::Time.now
end
```

**Official recommendations:**

- **In initializers**: Use `Time.current` or `Time.now`. Avoid `Time.zone.now` because Time.zone may be nil
- **In application code**: Prefer `Time.zone.now` or `Time.current` after initialization completes
- **Configuration placement**: Set `config.time_zone` in `config/application.rb`, never in initializers

Time.current provides a safe fallback mechanism specifically designed to handle the initialization timing issue where Time.zone might not be available yet.

## Rails documentation on initialization timing

The Rails edge guides provide detailed documentation:

**Rails Initialization Process Guide** (edgeguides.rubyonrails.org/initialization.html) explains the complete boot sequence, showing that `Railtie#initializer` methods run after application configuration but before custom initializers.

**Rails::Application API** (api.rubyonrails.org/classes/Rails/Application.html) documents that `initialize!` executes initializers in three phases: bootstrap (including time zone setup), railtie, and finisher.

**Rails Configuration Guide** explicitly warns that `config.time_zone` must be set in `config/application.rb`, not in initializers. GitHub issue #24748 documents that setting timezone in initializers has no effect because Time.zone default is already set by the ActiveSupport railtie before custom initializers run.

**Key technical detail**: The `run_initializers` method in Rails::Application traverses all class ancestors, sorts initializers by name, and executes them in order. ActiveSupport's `initialize_time_zone` runs during the bootstrap phase, making Time.zone available for subsequent railtie and custom initializers but not during early boot files.