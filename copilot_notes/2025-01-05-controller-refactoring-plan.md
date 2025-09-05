# Controller Refactoring Plan

## Current State
- Controller: 505 lines (after Tempfile fix)
- Target: <150 lines

## What to Remove/Replace

### 1. Authentication (lines 71-79)
- Replace with: `include ExportAuthentication` 
- Remove method definition

### 2. Rate Limiting (lines 81-123)
- Replace with: `include ExportRateLimiting`
- Remove method definition

### 3. ZIP Generation Methods (lines 415-481)
- Replace with: `Export::ZipGenerator` service call
- Remove all add_*_to_zip methods

### 4. Multi-CSV Logic (lines 241-269)
- Replace with simpler call to ZipGenerator

## Integration Strategy
1. Include concerns at top of controller
2. Adjust before_action calls to use concern methods
3. Replace inline ZIP generation with service call
4. Keep only coordination logic in controller

## Expected Result
- Controller reduced from 505 to ~200 lines
- Better separation of concerns
- More testable components