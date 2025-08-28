# Rails Architecture Deep Dive - COVID CO2 Tracker
*Generated from extensive exploration using Rails MCP Server and manual navigation*
*Date: 2025-08-28*

## 🏗️ Project Overview

### Tech Stack
- **Rails Version**: 7.1.0+ (API-only mode)
- **Ruby Version**: 3.2.2
- **Database**: PostgreSQL with PostGIS extension (via geokit-rails)
- **Admin Panel**: ActiveAdmin with Devise authentication
- **Error Tracking**: Sentry
- **API Format**: JSON API (using jsonapi-serializer)

### Project Type
- API-only Rails application (no server-side views except admin)
- Serves both React web client (`co2_client/`) and React Native mobile app (`co2_native_client/`)
- Real-time CO2 monitoring with venue tracking

## 📊 Database Schema & Models

### Core Domain Models

#### 1. **Measurement** (Heart of the System)
```ruby
# Central data model for CO2 readings
- co2ppm: integer (validated 0-80,000ppm with warnings at various levels)
- measurementtime: datetime (must be after 2020-01-01)
- crowding: integer (1-5 scale, optional for realtime)
- device_id: foreign key (required)
- sub_location_id: foreign key (where in venue)
- extra_measurement_info_id: foreign key (for realtime flag)
```

**Key Validations**:
- 30,000ppm: Industrial hygienist threshold warning
- 40,000ppm: Immediately dangerous to life warning
- 50,000ppm: Check meter warning
- 80,000ppm: Lethal level rejection

#### 2. **Place** (Venue Management)
```ruby
# Google Places integrated venue tracking
- google_place_id: string (unique, required)
- place_lat/place_lng: decimal (10,6 precision)
- last_fetched: datetime (refresh if >30 days old)
- acts_as_mappable for geospatial queries
```

**Relationships**:
- Has many sub_locations (areas within venue)
- Has many measurements through sub_locations

#### 3. **SubLocation** (Venue Areas)
```ruby
# Specific areas within venues
- description: string (e.g., "main dining room", "bar area")
- place_id: foreign key
```

#### 4. **Device** (CO2 Sensors)
```ruby
# Physical sensor devices
- serial: string (unique per model)
- model_id: foreign key
- user_id: foreign key (owner)
```

#### 5. **User** (Device Owners)
```ruby
# App users who own sensors
- email: string (unique)
- name: string
- sub_google_uid: string (Google OAuth)
- Has many devices
- Has one user_setting
```

#### 6. **UserSetting** (Preferences)
```ruby
# Real-time upload preferences
- realtime_upload_place_id: foreign key
- realtime_upload_sub_location_id: foreign key
- user_id: foreign key
```

#### 7. **Model & Manufacturer** (Device Metadata)
```ruby
# Device model information
Model:
- name: string
- manufacturer_id: foreign key

Manufacturer:
- name: string (unique)
```

### Database Indexes
- Measurements: indexed on device_id, measurementtime, sub_location_id
- Places: indexed on google_place_id (unique), place_lat, place_lng
- Users: indexed on email (unique), sub_google_uid (unique)

## 🚀 API Structure

### Route Namespaces
```
/api/v1/ - Main API version
/api/v2/ - Has highest_measurement endpoint
/admin/ - ActiveAdmin interface
```

### Key API Endpoints

#### Authentication
- `POST /api/v1/auth` - Create session
- `DELETE /api/v1/auth` - Destroy session
- `POST /api/v1/google_login_token` - Google OAuth
- `GET /api/v1/email` - Get user email

#### Measurements (Core Feature)
- `POST /api/v1/measurement` - Create measurement
- `GET /api/v1/measurement/:id` - Show measurement
- `DELETE /api/v1/measurement/:id` - Delete measurement
- `POST /api/v1/realtime_measurement` - Real-time upload
- `GET /api/v1/user_last_measurement` - User's latest reading
- `GET /api/v2/highest_measurement/index` - Highest readings

#### Places/Venues
- `GET /api/v1/places` - List places
- `POST /api/v1/places` - Create place
- `GET /api/v1/places/:id` - Show place
- `GET /api/v1/places_by_google_place_id/:id` - Find by Google ID
- `GET /api/v1/places_by_google_place_id_exists/:id` - Check existence
- `GET /api/v1/places_in_bounds` - Geospatial search

#### Devices
- `POST /api/v1/device` - Register device
- `GET /api/v1/device/:id` - Show device
- `DELETE /api/v1/device/:id` - Remove device
- `GET /api/v1/my_devices` - User's devices
- `POST /api/v1/device_name_serial/device_ids_to_names` - Bulk lookup

#### User Settings
- `GET /api/v1/user_settings` - Show settings
- `POST /api/v1/user_settings` - Create/update
- `DELETE /api/v1/user_settings` - Remove

#### Device Metadata
- `GET /api/v1/manufacturers` - Show manufacturer
- `POST /api/v1/manufacturers` - Create manufacturer
- `GET /api/v1/all_manufacturers` - List all
- `GET /api/v1/model/:id` - Show model
- `POST /api/v1/model` - Create model
- `GET /api/v1/model/:id/measurements` - Model's measurements

## 🔐 Authentication & Security

### Authentication Flow
1. JWT-based authentication (see `ApiController`)
2. Google OAuth integration for user signup/login
3. `skip_before_action :authorized` for public endpoints
4. Admin uses Devise through ActiveAdmin

### Security Measures
- CORS configured via rack-cors
- Parameter filtering for sensitive data
- Sentry error tracking for production issues
- JWT tokens for API authentication

## 🎯 Business Logic Patterns

### Measurement Creation Flow
1. Client sends measurement with device_id, co2ppm, location
2. System validates CO2 levels against safety thresholds
3. Creates or finds SubLocation within Place
4. Associates with Device and User
5. Optional real-time flag via ExtraMeasurementInfo

### Place Management
- Integrates with Google Places API
- Auto-refreshes place data if >30 days old
- Geospatial queries via geokit-rails
- Acts as container for SubLocations

### Real-time vs Regular Measurements
- Regular: Requires crowding level (1-5)
- Real-time: No crowding required, has ExtraMeasurementInfo
- Both require device, CO2 level, time, location

## 🚨 Missing Components for SMS Alerts

### What's NOT There Yet
1. **No Alert Service** - No `app/services/alert_service.rb`
2. **No Mailers** - Empty `app/mailers/` directory
3. **No Background Jobs** - No Sidekiq/DelayedJob configured
4. **No SMS Integration** - No Twilio gem in Gemfile
5. **No Notification Models** - No alert preferences storage

### What IS There (Foundation)
1. **User Model** - Has email, can add phone
2. **Measurement Validations** - Thresholds already defined
3. **Place Association** - Can track venue-specific alerts
4. **UserSetting Model** - Can extend for alert preferences
5. **API Structure** - Clean controller patterns to extend

## 📁 Directory Structure Insights

### App Organization
```
app/
├── admin/          # ActiveAdmin configurations
├── blueprints/     # JSON API serialization blueprints
├── controllers/
│   ├── api/
│   │   └── v1/     # Main API version controllers
│   └── concerns/   # Shared controller logic
├── models/         # ActiveRecord models
├── serializers/    # JSON API serializers
└── utils/          # Custom error classes
```

### No Services Layer Yet
- Controllers handle business logic directly
- Good candidate for refactoring when adding alerts
- Would benefit from service objects pattern

## 🔄 API Response Patterns

### Success Responses
```ruby
{
  data: SerializedObject,
  additional_field: value
}
```

### Error Responses
```ruby
{
  errors: [
    {
      message: "Human readable",
      detail: "Technical detail",
      source: "Component"
    }
  ]
}
```

## 🎓 Key Technical Insights

### 1. Measurement Validation Logic
- Extensive CO2 safety validations
- Progressive warnings at dangerous levels
- Prevents impossible values

### 2. Place/SubLocation Pattern
- Smart venue area tracking
- Allows "bar area" vs "dining room" readings
- Flexible location_where_inside_info handling

### 3. Real-time Feature Design
- Separate controller inherits from MeasurementController
- Uses ExtraMeasurementInfo for metadata
- Skips crowding requirement

### 4. Error Handling
- Consistent error format across endpoints
- Sentry integration for production monitoring
- ActiveRecord validation bubbling

## 🚀 Implementation Opportunities

### Quick Wins for SMS Alerts
1. Add `gem 'twilio-ruby'` to Gemfile
2. Create `AlertService` in new `app/services/` directory
3. Add `phone_number` to User model
4. Create AlertPreference model for thresholds
5. Hook into Measurement#create callback

### Suggested Architecture for Alerts
```ruby
app/services/
├── alert_service.rb        # Main alerting logic
├── sms_service.rb          # Twilio integration
└── threshold_checker.rb    # CO2 level analysis

app/models/
├── alert_preference.rb     # User alert settings
└── alert_log.rb           # Track sent alerts

app/jobs/
└── send_alert_job.rb      # Background processing
```

## 📝 Notes for Implementation

### Database Migrations Needed
1. Add phone_number to users
2. Create alert_preferences table
3. Create alert_logs table
4. Add indexes for performance

### API Endpoints to Add
- `POST /api/v1/alert_preferences`
- `GET /api/v1/alert_preferences`
- `PUT /api/v1/alert_preferences`
- `GET /api/v1/alert_logs`

### Configuration Needed
- Twilio credentials in Rails credentials
- Background job processor (Sidekiq recommended)
- SMS rate limiting logic

---

*This architecture analysis provides the foundation for implementing SMS alerts and other features. The codebase is well-structured for extending with notification capabilities.*