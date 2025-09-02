# Export API Documentation

## Overview

The COVID CO2 Tracker Export API provides secure access to measurement data in multiple formats. All endpoints require authentication via bearer token and include rate limiting for system stability.

## Authentication

All export endpoints require a bearer token in the Authorization header:

```bash
Authorization: Bearer YOUR_EXPORT_TOKEN
```

To obtain a production token, contact the system administrator. Tokens are long-lived but should be rotated periodically for security.

## Rate Limiting

- **Default limit**: 10 requests per minute per token
- **Burst limit**: 20 requests per hour
- **Response headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

## Endpoints

### 1. CSV Export

Export measurements as CSV with configurable fields.

**Endpoint**: `GET /api/v1/exports/csv`

**Parameters**:
| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `fields` | string | Comma-separated field names | `co2_ppm,timestamp,lat,lng` | `co2_ppm,timestamp,user_name,device_serial` |
| `from` | date | Start date (ISO 8601) | None | `2024-01-15` |
| `to` | date | End date (ISO 8601) | None | `2024-01-31` |
| `place_id` | string | Google Place ID | None | `ChIJOwg_06VPwokRYv534QaPC8g` |
| `device_serial` | string | Device serial number | None | `ARANET4_A1B2` |
| `above_ppm` | integer | Minimum CO2 threshold | None | `800` |
| `below_ppm` | integer | Maximum CO2 threshold | None | `1500` |

**Available Fields**:
- `measurement_id` - Unique measurement identifier
- `co2_ppm` - CO2 concentration in parts per million
- `timestamp` - ISO 8601 formatted timestamp
- `crowding` - Crowding level (1-5)
- `lat` - Latitude
- `lng` - Longitude
- `place_name` - Human-readable place name
- `place_google_id` - Google Place ID
- `device_serial` - Device serial number
- `device_model` - Device model name
- `manufacturer` - Device manufacturer
- `is_realtime` - Boolean for real-time measurement
- `user_name` - Name of device owner (no email for privacy)

**Example Request**:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://your-app.herokuapp.com/api/v1/exports/csv?fields=co2_ppm,timestamp,user_name&from=2024-01-01&to=2024-01-31&above_ppm=1000"
```

**Example Response**:
```csv
co2_ppm,timestamp,user_name
1234,2024-01-15T10:30:00Z,John Doe
1456,2024-01-15T11:00:00Z,Jane Smith
```

### 2. JSON Export

Export measurements as JSON with metadata.

**Endpoint**: `GET /api/v1/exports/json`

**Parameters**: Same as CSV export

**Example Request**:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://your-app.herokuapp.com/api/v1/exports/json?from=2024-01-01&to=2024-01-31"
```

**Example Response**:
```json
{
  "measurements": [
    {
      "co2_ppm": 1234,
      "timestamp": "2024-01-15T10:30:00Z",
      "lat": 40.7128,
      "lng": -74.0060
    }
  ],
  "metadata": {
    "total_records": 1,
    "export_time": "2024-02-01T12:00:00Z",
    "filters": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    }
  }
}
```

### 3. Streaming CSV Export

Stream large datasets efficiently without loading all data into memory.

**Endpoint**: `GET /api/v1/exports/stream`

**Parameters**: Same as CSV export

**Headers**:
- `Transfer-Encoding: chunked`
- `Content-Type: text/csv`

**Example Request**:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://your-app.herokuapp.com/api/v1/exports/stream" \
  --output measurements.csv
```

**Notes**:
- Ideal for large datasets (>10,000 records)
- Data is streamed in 1,000-record batches
- Lower memory footprint on server
- Progress can be monitored via chunked transfer

### 4. Multi-File ZIP Export

Export complete dataset as multiple CSV files in a ZIP archive.

**Endpoint**: `GET /api/v1/exports/multi`

**Parameters**: Same filters as other endpoints

**ZIP Contents**:
- `measurements.csv` - All measurement data
- `places.csv` - Unique places with coordinates
- `sub_locations.csv` - Sub-locations within places
- `devices.csv` - Device information
- `users.csv` - User names and measurement counts
- `metadata.json` - Export metadata and statistics

**Example Request**:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://your-app.herokuapp.com/api/v1/exports/multi" \
  --output export.zip
```

**Example users.csv**:
```csv
user_id,name,measurements_count
1,John Doe,1523
2,Jane Smith,892
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid date range: 'from' date must be before 'to' date"
}
```

### 401 Unauthorized
```json
{
  "error": "Missing or invalid export token"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded. Please wait 60 seconds."
}
```

### 503 Service Unavailable
```json
{
  "error": "Insufficient memory for export operation"
}
```

## Best Practices

1. **Use streaming for large exports**: For datasets over 10,000 records, use `/api/v1/exports/stream`

2. **Apply filters**: Always use date ranges and other filters to reduce data size

3. **Handle rate limits**: Implement exponential backoff when receiving 429 responses

4. **Cache responses**: Export data changes infrequently; cache responses when appropriate

5. **Monitor memory**: On Heroku's 512MB dynos, exports over 100,000 records may fail

## Performance Considerations

- **Date range queries**: Optimized with database indexes
- **Batch size**: 1,000 records per batch for streaming
- **Memory limit**: 450MB threshold before rejecting exports
- **Timeout**: 25 seconds (Rack::Timeout configured)

## Security Notes

- Tokens are stored as SHA256 hashes
- No personally identifiable information (PII) like emails are exported
- User names are included for data integrity but can be anonymized if needed
- All endpoints use HTTPS in production
- Rate limiting prevents abuse

## Example Integration

### Python
```python
import requests
import pandas as pd
from io import StringIO

headers = {'Authorization': 'Bearer YOUR_TOKEN'}
params = {
    'from': '2024-01-01',
    'to': '2024-01-31',
    'above_ppm': 1000
}

response = requests.get(
    'https://your-app.herokuapp.com/api/v1/exports/csv',
    headers=headers,
    params=params
)

df = pd.read_csv(StringIO(response.text))
print(f"Loaded {len(df)} measurements")
```

### Node.js
```javascript
const axios = require('axios');
const fs = require('fs');

async function exportData() {
  const response = await axios.get(
    'https://your-app.herokuapp.com/api/v1/exports/stream',
    {
      headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
      params: {
        from: '2024-01-01',
        to: '2024-01-31'
      },
      responseType: 'stream'
    }
  );
  
  response.data.pipe(fs.createWriteStream('measurements.csv'));
}
```

## Support

For API access, token generation, or technical issues, contact the development team through the GitHub repository.