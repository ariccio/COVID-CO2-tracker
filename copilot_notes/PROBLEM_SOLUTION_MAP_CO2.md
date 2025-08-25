# Problem → Solution Mapping for COVID CO2 Tracker

## Common Issues and Solutions

### Measurement Issues
```yaml
"Measurements not saving":
  symptoms: Form submits but no data in database
  check: 
    - Database connection
    - Redis queue status
    - Validation errors in logs
  solution: Check app/models/measurement.rb validations
  reference: measurement-persistence-debugging.md

"CO2 readings seem wrong":
  symptoms: Impossible values (>10000ppm, negative)
  check:
    - Sensor calibration
    - Unit conversion
    - Data type casting
  solution: Validate at model level, add bounds checking
```

### Alert Delivery
```yaml
"SMS alerts not sending":
  symptoms: Measurements exceed threshold but no notifications
  check:
    - Twilio credentials in ENV
    - Phone number format
    - Rate limiting
  solution: app/services/alert_service.rb debugging
  reference: alert-delivery-debugging.md

"Alert fatigue complaints":
  symptoms: Users disabling notifications
  check:
    - Threshold settings
    - Frequency of alerts
    - Time-based suppression
  solution: Implement cooldown period between alerts
```

### Mobile App Issues
```yaml
"Bluetooth won't connect":
  symptoms: Can't find or connect to CO2 sensor
  check:
    - iOS/Android permissions
    - Bluetooth enabled
    - Device compatibility
  solution: co2_native_client/src/features/bluetooth/
  reference: bluetooth-troubleshooting-guide.md

"App crashes on launch":
  symptoms: Immediate crash, white screen
  check:
    - expo start --clear
    - Native dependencies
    - AsyncStorage corruption
  solution: Clear cache and reinstall
  debug_command: expo start --ios --clear
```

### Deployment Problems
```yaml
"Deploy fails on Heroku":
  symptoms: Build succeeds locally but fails on Heroku
  check:
    - Buildpack versions
    - ENV variables set
    - Database migrations
  solution: heroku logs --tail
  reference: deployment-troubleshooting.md
```

## Quick Debug Commands
```bash
# Rails/Backend
rails console                    # Interactive debugging
tail -f log/development.log     # Watch logs
bundle exec rspec --fail-fast   # Quick test run

# Mobile
expo doctor                      # Check environment
expo start --clear              # Clear cache
adb logcat | grep -i erro      # Android logs

# Production
heroku logs --tail              # Live logs
heroku run rails console        # Production console
heroku pg:psql                  # Database access
```
