# Public Venue Leaderboard - 2 Hour Implementation

## The Goal
Create a public page showing which venues have the best/worst air quality.
This creates social pressure for improvement.

## Quick Implementation

### Step 1: Create Controller (20 minutes)
```ruby
# app/controllers/leaderboard_controller.rb
class LeaderboardController < ApplicationController
  def index
    @best_venues = Place.joins(:measurements)
      .where('measurements.created_at > ?', 24.hours.ago)
      .group('places.id')
      .having('AVG(measurements.co2_ppm) < ?', 800)
      .order('AVG(measurements.co2_ppm) ASC')
      .limit(10)
      .select('places.*, AVG(measurements.co2_ppm) as avg_co2')
    
    @worst_venues = Place.joins(:measurements)
      .where('measurements.created_at > ?', 24.hours.ago)
      .group('places.id')
      .having('AVG(measurements.co2_ppm) > ?', 1000)
      .order('AVG(measurements.co2_ppm) DESC')
      .limit(10)
      .select('places.*, AVG(measurements.co2_ppm) as avg_co2')
  end
end
```

### Step 2: Create View (30 minutes)
```erb
<!-- app/views/leaderboard/index.html.erb -->
<div class="leaderboard">
  <h1>🏆 Venue Air Quality Leaderboard</h1>
  
  <div class="best-venues">
    <h2>✅ Safest Venues (Last 24 Hours)</h2>
    <% @best_venues.each_with_index do |venue, index| %>
      <div class="venue-card safe">
        <span class="rank">#<%= index + 1 %></span>
        <h3><%= venue.name %></h3>
        <p class="co2">Avg: <%= venue.avg_co2.round %>ppm</p>
      </div>
    <% end %>
  </div>
  
  <div class="worst-venues">
    <h2>⚠️ Venues Needing Improvement</h2>
    <% @worst_venues.each_with_index do |venue, index| %>
      <div class="venue-card danger">
        <span class="rank">#<%= index + 1 %></span>
        <h3><%= venue.name %></h3>
        <p class="co2">Avg: <%= venue.avg_co2.round %>ppm</p>
      </div>
    <% end %>
  </div>
</div>
```

### Step 3: Add Route (5 minutes)
```ruby
# config/routes.rb
get 'leaderboard', to: 'leaderboard#index'
root 'leaderboard#index' # Make it the homepage!
```

### Step 4: Cache for Performance (15 minutes)
```ruby
# app/controllers/leaderboard_controller.rb
def index
  @best_venues = Rails.cache.fetch("best_venues", expires_in: 5.minutes) do
    # ... query ...
  end
  
  @worst_venues = Rails.cache.fetch("worst_venues", expires_in: 5.minutes) do
    # ... query ...
  end
end
```

### Step 5: Make It Shareable (20 minutes)
Add social meta tags for sharing

### Step 6: Deploy (30 minutes)
Push to production and share everywhere!

## Impact
- Venues will improve to get off the "worst" list
- Good venues get free marketing
- Public health win!
