# COVID CO2 Tracker Architecture Overview

## Project Structure
- **Backend**: Ruby on Rails API (Ruby 3.x)
- **Frontend**: React Native (Expo) in `co2_native_client/`
- **Web Client**: React in `co2_client/`
- **Admin**: ActiveAdmin interface
- **Database**: PostgreSQL (based on Rails conventions)

## Key Components
1. **Measurements System**: Core CO2 readings tracking
2. **Places/Locations**: Geographic tracking with Google Places integration
3. **Devices**: CO2 sensor device management
4. **Users**: Authentication and settings

## Current State (Aug 2025)
- Last major work: July 2024
- Recently imported AI infrastructure from Dee Dee repo
- Has test suite but needs verification
- Multiple client implementations (native + web)

## High-Priority Areas
1. Dependency updates (security)
2. Test suite verification
3. Feature completion assessment
4. Performance optimization opportunities