# COVID-CO2-tracker CSV Export Documentation

This document describes the CSV export functionality added to export CO2 measurement data for Airspot or other external systems.

## Overview

The CSV export system allows exporting all CO2 measurement data from the database to CSV files that can be imported into external systems. The export includes all relevant measurement data while respecting user privacy by excluding sensitive information.

## Privacy & Security

**Data Included:**
- Measurement data: CO2 ppm, timestamp, crowding level
- Device information: serial number, model name, manufacturer name
- Location data: latitude/longitude coordinates, sub-location descriptions
- Metadata: creation and update timestamps

**Data Excluded (Privacy Protection):**
- User emails, names, Google UIDs
- Any other personally identifiable information (PII)
- Only data available through normal APIs is exported

## Usage

### Export from Live Database

```bash
# Basic export to /tmp
rake export:measurements_to_csv

# Export to custom directory
OUTPUT_DIR=/path/to/exports rake export:measurements_to_csv
```

### Export from PostgreSQL Dump File

```bash
# Export from dump file
rake export:measurements_from_dump[/path/to/backup.sql]

# Export from dump with custom output directory
OUTPUT_DIR=/exports rake export:measurements_from_dump[/path/to/backup.sql]
```

### Get Help

```bash
rake export:help
```

## CSV Format

The exported CSV contains the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| `measurement_id` | Unique measurement identifier | `1234` |
| `co2_ppm` | CO2 concentration in parts per million | `450` |
| `measurement_time` | When measurement was taken (ISO 8601) | `2023-12-01T09:30:00Z` |
| `crowding_level` | Crowding level (1-5 scale) | `3` |
| `is_realtime` | Whether measurement was taken in realtime | `false` |
| `device_serial` | Device serial number | `AN4-123456` |
| `device_model` | Device model name | `Aranet4` |
| `device_manufacturer` | Device manufacturer name | `Aranet` |
| `place_latitude` | Location latitude | `40.7128` |
| `place_longitude` | Location longitude | `-74.0060` |
| `sub_location_description` | Specific location within place | `Conference Room A` |
| `created_at` | Record creation timestamp (ISO 8601) | `2023-12-01T09:28:00Z` |
| `updated_at` | Record last update timestamp (ISO 8601) | `2023-12-01T09:28:00Z` |

## File Naming

Exported CSV files are named with timestamps to prevent conflicts:
- Format: `co2_measurements_export_YYYYMMDD_HHMMSS.csv`
- Example: `co2_measurements_export_20231201_143022.csv`

## Safety Features

### Validation Checks
- Database connection validation
- Table existence verification
- Output directory permission checks
- Dump file validation (for dump exports)

### Error Handling
- Graceful handling of missing associations
- Individual record error logging (continues processing)
- Automatic cleanup of temporary resources
- Detailed error messages and logging

### Performance
- Batched processing (1,000 records at a time) for large datasets
- Efficient database queries with proper includes
- Progress logging every 10,000 records
- Memory-efficient streaming for large exports

## PostgreSQL Dump Export

The dump export feature allows processing measurement data from backup files without affecting the live database:

### How it Works
1. Creates a temporary database with unique name
2. Loads the dump file into the temporary database
3. Switches ActiveRecord connection to temporary database
4. Performs the CSV export using the same logic
5. Automatically cleans up temporary database

### Requirements
- `psql` command available in system PATH
- PostgreSQL connection permissions
- Sufficient disk space for temporary database

### Security
- Temporary databases are automatically cleaned up
- Original database connection is always restored
- Temporary database names include timestamp and PID to prevent conflicts

## Examples

### Sample Output
```
=========================================
COVID-CO2-tracker Measurement CSV Export
=========================================

Output directory: /tmp
Starting export...

✅ Export completed successfully!
📁 File: /tmp/co2_measurements_export_20231201_143022.csv
📊 Records exported: 1,234
💡 Successfully exported 1,234 measurements to co2_measurements_export_20231201_143022.csv

Export task completed.
```

### Sample CSV Content
```csv
measurement_id,co2_ppm,measurement_time,crowding_level,is_realtime,device_serial,device_model,device_manufacturer,place_latitude,place_longitude,sub_location_description,created_at,updated_at
1,450,2023-12-01T09:30:00Z,3,false,AN4-123456,Aranet4,Aranet,40.7128,-74.0060,Conference Room A,2023-12-01T09:28:00Z,2023-12-01T09:28:00Z
2,485,2023-12-01T10:00:00Z,4,false,AN4-123456,Aranet4,Aranet,40.7128,-74.0060,Conference Room A,2023-12-01T09:58:00Z,2023-12-01T09:58:00Z
```

## Troubleshooting

### Common Issues

**Permission Denied**
```
Error: Output directory is not writable: /path/to/dir
```
Solution: Ensure the output directory exists and is writable, or use a different directory.

**Database Connection Failed**
```
Error: Database connection is not active
```
Solution: Check database configuration and ensure the database is running.

**Dump File Not Found**
```
Error: Dump file does not exist: /path/to/dump.sql
```
Solution: Verify the dump file path and ensure the file exists and is readable.

### Logs
- Application logs contain detailed progress information
- Individual record errors are logged but don't stop the export
- Database cleanup operations are logged for troubleshooting

## Integration with Airspot

This export format is designed to be compatible with Airspot's data import requirements. The CSV includes:
- Standard CO2 measurement values
- Temporal data with ISO 8601 formatting
- Geographic coordinates for mapping
- Device identification for data provenance
- Privacy-compliant data structure

For Airspot integration, you can:
1. Run the export to generate CSV files
2. Transfer files to Airspot import system
3. Map CSV columns to Airspot's expected format
4. Import data using Airspot's standard procedures

## Development and Testing

A demonstration script is available to test the export format without database setup:

```bash
ruby demo_csv_export.rb [output_directory]
```

This creates sample measurement data and exports it to CSV, showing the exact format that would be generated from real data.