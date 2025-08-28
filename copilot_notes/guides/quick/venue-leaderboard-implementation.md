# 🏆 Venue Leaderboard Implementation - 2 Hours
*Based on working aggregation queries from Rails exploration*
*Copy-paste ready implementation*

## Prerequisites Check (2 min)
```bash
# Verify aggregation query works
rails runner "Place.joins(:measurement).group('places.id').average('measurements.co2ppm').each {|id,avg| puts \"ID #{id}: #{avg.round}ppm\"}"

# Should output something like:
# ID 2: 1050ppm
# ID 3: 4544ppm  
# ID 1: 825ppm
```

## Step 1: Create Venue Statistics Service (10 min)

```bash
mkdir -p app/services
```

```ruby
# app/services/venue_statistics_service.rb
class VenueStatisticsService
  RISK_LEVELS = {
    safe: 0..799,
    moderate: 800..999,
    warning: 1000..1499,
    danger: 1500..1999,
    extreme: 2000..Float::INFINITY
  }.freeze
  
  def self.leaderboard(limit: 10, order: :worst_first)
    new.leaderboard(limit: limit, order: order)
  end
  
  def leaderboard(limit: 10, order: :worst_first)
    direction = order == :worst_first ? 'DESC' : 'ASC'
    
    places_with_stats = Place
      .select(
        'places.*',
        'AVG(measurements.co2ppm) as avg_co2',
        'COUNT(measurements.id) as measurement_count',
        'MAX(measurements.co2ppm) as max_co2',
        'MIN(measurements.co2ppm) as min_co2',
        'MAX(measurements.measurementtime) as last_measurement'
      )
      .joins(:measurement)
      .group('places.id')
      .having('COUNT(measurements.id) >= ?', 3) # Min 3 measurements
      .order("avg_co2 #{direction}")
      .limit(limit)
    
    places_with_stats.map do |place|
      {
        google_place_id: place.google_place_id,
        avg_co2: place.avg_co2.round,
        max_co2: place.max_co2,
        min_co2: place.min_co2,
        measurement_count: place.measurement_count,
        last_measurement: place.last_measurement,
        risk_level: risk_level(place.avg_co2),
        risk_emoji: risk_emoji(place.avg_co2),
        coordinates: {
          lat: place.place_lat,
          lng: place.place_lng
        }
      }
    end
  end
  
  def venue_details(google_place_id)
    place = Place.find_by!(google_place_id: google_place_id)
    
    measurements = place.measurement.order(measurementtime: :desc)
    
    {
      google_place_id: place.google_place_id,
      statistics: calculate_statistics(measurements),
      recent_measurements: format_recent(measurements.limit(10)),
      trend: calculate_trend(measurements),
      sub_locations: sub_location_breakdown(place)
    }
  end
  
  private
  
  def risk_level(co2_avg)
    RISK_LEVELS.find { |level, range| range.include?(co2_avg) }&.first || :unknown
  end
  
  def risk_emoji(co2_avg)
    case co2_avg
    when 0..799 then "✅"
    when 800..999 then "🟡"
    when 1000..1499 then "🟠"
    when 1500..1999 then "🔴"
    else "☠️"
    end
  end
  
  def calculate_statistics(measurements)
    co2_values = measurements.pluck(:co2ppm)
    
    {
      avg: co2_values.sum.fdiv(co2_values.size).round,
      max: co2_values.max,
      min: co2_values.min,
      median: median(co2_values),
      std_dev: standard_deviation(co2_values).round,
      count: co2_values.size
    }
  end
  
  def format_recent(measurements)
    measurements.map do |m|
      {
        co2ppm: m.co2ppm,
        time: m.measurementtime,
        location: m.sub_location.description,
        risk_level: risk_level(m.co2ppm)
      }
    end
  end
  
  def calculate_trend(measurements)
    return :insufficient_data if measurements.count < 5
    
    recent = measurements.limit(5).average(:co2ppm)
    older = measurements.offset(5).limit(5).average(:co2ppm)
    
    return :insufficient_data unless recent && older
    
    diff = recent - older
    
    case
    when diff > 100 then :worsening
    when diff < -100 then :improving
    else :stable
    end
  end
  
  def sub_location_breakdown(place)
    place.sub_location.map do |location|
      measurements = location.measurement
      next if measurements.empty?
      
      {
        description: location.description,
        avg_co2: measurements.average(:co2ppm)&.round,
        measurement_count: measurements.count,
        last_measurement: measurements.maximum(:measurementtime)
      }
    end.compact
  end
  
  def median(array)
    sorted = array.sort
    len = sorted.length
    (sorted[(len - 1) / 2] + sorted[len / 2]) / 2.0
  end
  
  def standard_deviation(array)
    mean = array.sum.fdiv(array.size)
    sum = array.inject(0) { |accum, i| accum + (i - mean) ** 2 }
    Math.sqrt(sum / (array.size - 1))
  rescue
    0
  end
end
```

## Step 2: Create API Endpoints (15 min)

```ruby
# config/routes.rb
# Add inside namespace :api, :v1 block (around line 25)

      # Venue leaderboard
      get '/venues/leaderboard', to: 'venues#leaderboard'
      get '/venues/:google_place_id/statistics', to: 'venues#statistics'
      get '/venues/search', to: 'venues#search'
```

```ruby
# app/controllers/api/v1/venues_controller.rb
module Api
  module V1
    class VenuesController < ApiController
      skip_before_action :authorized, only: [:leaderboard, :statistics]
      
      def leaderboard
        limit = params[:limit]&.to_i || 10
        order = params[:order]&.to_sym || :worst_first
        
        venues = VenueStatisticsService.leaderboard(
          limit: limit,
          order: order
        )
        
        # Cache for 1 hour
        expires_in 1.hour, public: true
        
        render json: {
          leaderboard: venues,
          generated_at: Time.current,
          criteria: {
            limit: limit,
            order: order,
            minimum_measurements: 3
          }
        }
      end
      
      def statistics
        venue = VenueStatisticsService.new.venue_details(
          params[:google_place_id]
        )
        
        # Cache for 15 minutes
        expires_in 15.minutes, public: true
        
        render json: venue
      rescue ActiveRecord::RecordNotFound
        render json: { 
          error: "Venue not found" 
        }, status: :not_found
      end
      
      def search
        # Requires authentication to prevent abuse
        
        if params[:near_lat] && params[:near_lng]
          venues = search_nearby
        elsif params[:city]
          venues = search_by_city
        else
          return render json: { 
            error: "Provide near_lat/near_lng or city" 
          }, status: :bad_request
        end
        
        render json: { venues: venues }
      end
      
      private
      
      def search_nearby
        lat = params[:near_lat].to_f
        lng = params[:near_lng].to_f
        radius = params[:radius]&.to_f || 5.0 # miles
        
        Place
          .within(radius, origin: [lat, lng])
          .joins(:measurement)
          .group('places.id')
          .select(
            'places.*',
            'AVG(measurements.co2ppm) as avg_co2',
            'COUNT(measurements.id) as measurement_count'
          )
          .map do |place|
            {
              google_place_id: place.google_place_id,
              distance: place.distance_to([lat, lng]).round(2),
              avg_co2: place.avg_co2.round,
              measurement_count: place.measurement_count
            }
          end
      end
      
      def search_by_city
        # Simplified - you'd want geocoding here
        Place
          .joins(:measurement)
          .group('places.id')
          .having('COUNT(measurements.id) >= ?', 1)
          .select(
            'places.*',
            'AVG(measurements.co2ppm) as avg_co2'
          )
          .limit(20)
          .map do |place|
            {
              google_place_id: place.google_place_id,
              avg_co2: place.avg_co2.round
            }
          end
      end
    end
  end
end
```

## Step 3: Add Caching Layer (10 min)

```ruby
# config/environments/development.rb
# Enable caching in development for testing
config.cache_store = :memory_store

# config/environments/production.rb  
# Use Redis in production
config.cache_store = :redis_cache_store, { url: ENV['REDIS_URL'] }
```

```ruby
# app/services/cached_venue_service.rb
class CachedVenueService
  CACHE_KEY = 'venue_leaderboard'
  CACHE_DURATION = 1.hour
  
  def self.leaderboard(force_refresh: false)
    Rails.cache.fetch(
      CACHE_KEY,
      expires_in: CACHE_DURATION,
      force: force_refresh
    ) do
      VenueStatisticsService.leaderboard
    end
  end
  
  def self.venue_stats(google_place_id, force_refresh: false)
    cache_key = "venue_stats_#{google_place_id}"
    
    Rails.cache.fetch(
      cache_key,
      expires_in: 15.minutes,
      force: force_refresh
    ) do
      VenueStatisticsService.new.venue_details(google_place_id)
    end
  end
  
  def self.clear_cache!
    Rails.cache.delete(CACHE_KEY)
    Rails.cache.delete_matched("venue_stats_*")
  end
end
```

## Step 4: Add Admin Panel View (10 min)

```ruby
# app/admin/venue_leaderboard.rb
ActiveAdmin.register_page "Venue Leaderboard" do
  menu priority: 2, label: "🏆 CO2 Leaderboard"
  
  content title: "Venue CO2 Leaderboard" do
    venues = VenueStatisticsService.leaderboard(limit: 20)
    
    panel "Worst Venues (Highest Average CO2)" do
      table_for venues do
        column :rank do |v|
          venues.index(v) + 1
        end
        column :risk do |v|
          v[:risk_emoji]
        end
        column "Google Place ID" do |v|
          link_to v[:google_place_id], 
                  "https://www.google.com/maps/place/?q=place_id:#{v[:google_place_id]}",
                  target: "_blank"
        end
        column "Avg CO2" do |v|
          status_tag "#{v[:avg_co2]}ppm", 
                     class: v[:risk_level]
        end
        column "Max CO2" do |v|
          "#{v[:max_co2]}ppm"
        end
        column "Measurements" do |v|
          v[:measurement_count]
        end
        column "Last Reading" do |v|
          time_ago_in_words(v[:last_measurement]) + " ago"
        end
      end
    end
    
    panel "Statistics" do
      div do
        total_venues = Place.joins(:measurement).distinct.count
        total_measurements = Measurement.count
        avg_all = Measurement.average(:co2ppm)&.round || 0
        
        h3 "Summary"
        ul do
          li "Total venues monitored: #{total_venues}"
          li "Total measurements: #{total_measurements}"
          li "Overall average CO2: #{avg_all}ppm"
        end
      end
    end
  end
  
  sidebar "Actions" do
    button_to "Refresh Cache", 
              admin_venue_leaderboard_refresh_path,
              method: :post,
              class: "button"
              
    para "Cache expires every hour"
    para "Last updated: #{Time.current}"
  end
  
  page_action :refresh, method: :post do
    CachedVenueService.clear_cache!
    redirect_to admin_venue_leaderboard_path, 
                notice: "Cache cleared!"
  end
end
```

## Step 5: Create Background Job for Updates (10 min)

```bash
# Add to Gemfile
bundle add sidekiq
bundle add redis
```

```ruby
# app/jobs/update_venue_statistics_job.rb
class UpdateVenueStatisticsJob < ApplicationJob
  queue_as :default
  
  def perform
    # Update cache proactively
    VenueStatisticsService.leaderboard(limit: 100)
    
    # Update individual venue stats for top venues
    top_venues = Place
      .joins(:measurement)
      .group('places.id')
      .order('COUNT(measurements.id) DESC')
      .limit(20)
    
    top_venues.each do |venue|
      CachedVenueService.venue_stats(
        venue.google_place_id,
        force_refresh: true
      )
    end
    
    Rails.logger.info "Updated venue statistics at #{Time.current}"
  end
end
```

```ruby
# config/schedule.rb (if using whenever gem)
every 1.hour do
  runner "UpdateVenueStatisticsJob.perform_later"
end
```

## Step 6: Add Public Leaderboard View (15 min)

```ruby
# app/controllers/leaderboard_controller.rb
class LeaderboardController < ApplicationController
  def index
    @venues = CachedVenueService.leaderboard(limit: 50)
    
    respond_to do |format|
      format.json { render json: @venues }
      format.html # Renders views/leaderboard/index.html.erb
    end
  end
  
  def embed
    @venues = CachedVenueService.leaderboard(limit: 10)
    render layout: 'embed'
  end
end
```

```erb
<!-- app/views/leaderboard/index.html.erb -->
<div class="leaderboard-container">
  <h1>🏆 CO2 Venue Leaderboard</h1>
  <p class="subtitle">Real-time air quality rankings</p>
  
  <div class="leaderboard">
    <% @venues.each_with_index do |venue, index| %>
      <div class="venue-card risk-<%= venue[:risk_level] %>">
        <div class="rank">#<%= index + 1 %></div>
        <div class="venue-info">
          <div class="risk-emoji"><%= venue[:risk_emoji] %></div>
          <div class="stats">
            <h3><%= venue[:google_place_id] %></h3>
            <p>Average CO2: <strong><%= venue[:avg_co2] %>ppm</strong></p>
            <p>Max: <%= venue[:max_co2] %>ppm | Min: <%= venue[:min_co2] %>ppm</p>
            <p class="measurements">
              <%= venue[:measurement_count] %> measurements
            </p>
          </div>
        </div>
      </div>
    <% end %>
  </div>
  
  <div class="legend">
    <h3>Risk Levels</h3>
    <div class="risk-item">✅ Safe (< 800ppm)</div>
    <div class="risk-item">🟡 Moderate (800-999ppm)</div>
    <div class="risk-item">🟠 Warning (1000-1499ppm)</div>
    <div class="risk-item">🔴 Danger (1500-1999ppm)</div>
    <div class="risk-item">☠️ Extreme (2000+ ppm)</div>
  </div>
</div>

<style>
.leaderboard-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.venue-card {
  display: flex;
  align-items: center;
  padding: 15px;
  margin: 10px 0;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.venue-card.risk-safe { border-left: 5px solid #22c55e; }
.venue-card.risk-moderate { border-left: 5px solid #eab308; }
.venue-card.risk-warning { border-left: 5px solid #f97316; }
.venue-card.risk-danger { border-left: 5px solid #ef4444; }
.venue-card.risk-extreme { border-left: 5px solid #000; }

.rank {
  font-size: 24px;
  font-weight: bold;
  margin-right: 20px;
  color: #666;
}

.risk-emoji {
  font-size: 36px;
  margin-right: 15px;
}

.legend {
  margin-top: 30px;
  padding: 20px;
  background: #f3f4f6;
  border-radius: 8px;
}

.risk-item {
  padding: 5px 0;
}
</style>
```

## Step 7: Add Routes (5 min)

```ruby
# config/routes.rb
# Add outside API namespace

# Public leaderboard
get '/leaderboard', to: 'leaderboard#index'
get '/leaderboard/embed', to: 'leaderboard#embed'
```

## Step 8: Testing (10 min)

```ruby
# rails console

# Test the service
venues = VenueStatisticsService.leaderboard
pp venues

# Test specific venue
place = Place.first
stats = VenueStatisticsService.new.venue_details(place.google_place_id)
pp stats

# Test caching
CachedVenueService.leaderboard
CachedVenueService.clear_cache!

# Test API endpoint
app.get '/api/v1/venues/leaderboard'
JSON.parse(app.response.body)
```

## Step 9: Add to Measurement Callback (5 min)

```ruby
# app/models/measurement.rb
# Add after existing callbacks

  after_create :invalidate_venue_cache
  
  private
  
  def invalidate_venue_cache
    # Clear main leaderboard cache if high reading
    if co2ppm > 2000
      CachedVenueService.clear_cache!
    end
    
    # Clear specific venue cache
    venue_id = sub_location.place.google_place_id
    Rails.cache.delete("venue_stats_#{venue_id}")
  end
```

## ✅ Testing Checklist

```bash
# 1. Service works
rails console
VenueStatisticsService.leaderboard
# Should return array of venue hashes

# 2. API endpoint works  
curl http://localhost:3000/api/v1/venues/leaderboard
# Should return JSON with leaderboard

# 3. Admin panel shows
open http://localhost:3000/admin/venue_leaderboard
# Should show table of venues

# 4. Public page works
open http://localhost:3000/leaderboard
# Should show formatted leaderboard

# 5. Caching works
rails console
CachedVenueService.leaderboard  # First call hits DB
CachedVenueService.leaderboard  # Second call uses cache
```

## 🚀 Deploy Considerations

### Environment Variables
```bash
REDIS_URL=redis://localhost:6379/0  # For caching
```

### Database Indexes (for performance)
```ruby
# db/migrate/xxx_add_venue_indexes.rb
class AddVenueIndexes < ActiveRecord::Migration[7.1]
  def change
    add_index :measurements, [:sub_location_id, :co2ppm]
    add_index :measurements, [:sub_location_id, :measurementtime]
    add_index :places, [:place_lat, :place_lng]
  end
end
```

### Monitoring
- Track cache hit rate
- Monitor query performance  
- Alert if no new measurements in 24 hours

## 🎨 UI Enhancement Ideas

1. **Google Places Integration**
   - Fetch venue names from Google API
   - Show venue photos
   - Display address and hours

2. **Interactive Map**
   - Plot venues on map
   - Color code by risk level
   - Click for details

3. **Social Sharing**
   - Tweet worst venue
   - Share on Facebook
   - Generate infographic

4. **Gamification**
   - Venue improvement badges
   - User contribution points
   - Weekly/monthly rankings

## 📊 Success Metrics

✅ Leaderboard loads in < 500ms (cached)
✅ Updates within 1 hour of new data
✅ Shows risk levels clearly
✅ Mobile responsive
✅ Accessible via API and web

---

*Total implementation time: ~90-120 minutes*
*Performance impact: Minimal with caching*
*User value: HIGH - Public accountability for venues*