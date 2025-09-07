# QueryBuilder TODOs and Gotchas

## Critical Issues to Investigate

### 1. Place ID Dual Behavior (MAJOR GOTCHA!)
**Location**: `app/services/export/query_builder.rb:59-86`

**Current Behavior**:
- Numeric strings (e.g., "123") → queries by database ID
- Non-numeric strings (e.g., "ChIJN1t...") → queries by Google Place ID  
- Mixed strings like "123abc" → extracts leading digits, queries by database ID 123
- "0" or "0abc" → searches for database ID 0, not Google Place ID

**Risks**:
- If a Google Place ID ever starts with digits, it will be misinterpreted as a database ID
- User confusion when their intended Google Place ID gets interpreted as database ID
- Silent failures where wrong data is returned

**Recommended Fix**:
Split into two separate parameters:
- `place_database_id` for internal database IDs
- `google_place_id` for Google Place IDs

### 2. Silent Type Coercion Issues
**Locations**:
- `app/services/export/query_builder.rb:45` - `filters[:above_ppm].to_i`
- `app/services/export/query_builder.rb:52` - `filters[:below_ppm].to_i`
- `app/services/export/query_builder.rb:91` - `filters[:device_id].to_i`

**Current Behavior**:
- `"abc".to_i` → 0
- `"123abc".to_i` → 123
- `"".to_i` → 0
- `nil.to_i` → 0

**Risks**:
- Invalid input silently becomes 0, potentially returning wrong results
- `above_ppm: "invalid"` becomes `co2ppm > 0` (returns almost everything!)
- No feedback to user that their input was invalid

**Recommended Fix**:
Add validation before conversion:
```ruby
def validate_numeric_filter(value, param_name)
  return nil if value.nil?
  
  # Check if it's already numeric
  return value if value.is_a?(Numeric)
  
  # For strings, validate format
  string_value = value.to_s.strip
  unless string_value.match?(/\A-?\d+\z/)
    raise Export::BaseService::ExportError, 
          "Invalid #{param_name}: expected numeric value, got '#{string_value}'"
  end
  
  string_value.to_i
end
```

## Additional Improvements to Consider

### 3. Add Input Validation Layer
Create a separate validator class that validates all filter inputs before they reach QueryBuilder.

### 4. Add Logging for Ambiguous Cases
Log when place_id interpretation might be ambiguous (e.g., when it contains both digits and letters).

### 5. Improve Error Messages
Include the invalid value in error messages (safely escaped) so users know what went wrong.

### 6. Add Tests for Edge Cases
- Test place_id with various formats
- Test invalid PPM values
- Test boundary conditions

## Timeline
- [x] Immediate: Add validation for numeric filters (prevents silent failures) - COMPLETED 2025-09-07
- [x] Short-term: Split place_id into two parameters - COMPLETED 2025-09-07
  - Added `place_database_id` for internal database IDs
  - Added `google_place_id` for Google Place IDs
  - Kept backward compatibility with deprecation warning
- [ ] Long-term: Comprehensive input validation layer