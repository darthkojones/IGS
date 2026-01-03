# IGS Room Booking - Implementation Guide

## Overview

All three tasks have been successfully implemented:

### ✅ Task 1: Sort and Filter
- Filter for capacity, equipment, building, booking start date time
- Show/hide booked rooms toggle
- Reset filter function
- Default start date time automatically set to "now"
- Sorting by name, capacity, and distance

### ✅ Task 2: Detailed Status
- Room cards show time remaining ("Available for 2h 30min" or "Booked for 45 min")
- Smart time formatting (5 min, 2 hours, 2h 30min)
- Real-time status updates every 30 seconds

### ✅ Task 3: Distance Calculation
- Distance service with Google Maps Distance Matrix API integration
- Fallback to Haversine formula when API is unavailable
- User location detection via browser Geolocation API
- Distance displayed on room cards (e.g., "5 min walk")
- Distance-based sorting functionality

---

## Files Created/Modified

### New Files Created:

1. **src/utils/timeFormat.ts**
   - Smart time duration formatting
   - Helper functions for time calculations

2. **src/services/distanceService.ts**
   - Google Maps Distance Matrix API integration
   - Haversine formula fallback
   - Geocoding service for addresses
   - Current location detection

3. **src/config/maps.config.ts**
   - Google Maps API configuration
   - Travel mode settings
   - Fallback speed configuration

4. **src/composables/useLocation.ts**
   - Location management composable
   - Distance calculation for rooms
   - User location state management

5. **.env.example**
   - Environment variable template
   - API key setup instructions

### Modified Files:

1. **src/types/index.ts**
   - Added `latitude` and `longitude` fields to Building interface

2. **src/composables/useRoomStatus.ts**
   - Enhanced with time remaining calculations
   - Added next booking detection
   - Smart status text with duration

3. **src/components/RoomCard.vue**
   - Displays time remaining for availability/bookings
   - Shows distance from current location

4. **src/views/RoomsView.vue**
   - Complete filter UI (capacity, equipment, datetime, show booked)
   - Location request button
   - Distance calculation and sorting
   - Auto-set start datetime to "now"

---

## Setup Instructions

### 1. Install Dependencies
No new dependencies are required - everything uses native browser APIs and fetch.

### 2. Configure Google Maps API (Optional but Recommended)

#### Get an API Key:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - **Distance Matrix API** (required for accurate distance/time)
   - **Geocoding API** (optional, for converting addresses to coordinates)

4. Create an API Key:
   - Go to "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated key

#### Add API Key to Your Project:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API key:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

3. Restart your development server

**Note:** If you don't configure the API key, the system will automatically use the Haversine formula fallback for distance calculation.

### 3. Add Building Coordinates to Database

You need to add latitude and longitude to your buildings. You have two options:

#### Option A: Manual Entry
Update your database buildings with coordinates:
```sql
UPDATE buildings
SET latitude = 48.137154, longitude = 11.576124
WHERE building_id = 'your-building-id';
```

#### Option B: Use Geocoding API
If you have Google Maps API configured, you can use the geocoding service:
```typescript
import { distanceService } from '@/services/distanceService';

const coords = await distanceService.geocodeAddress("Building address");
// Then save coords.latitude and coords.longitude to database
```

---

## How to Use

### For Users:

1. **Basic Filtering:**
   - Use search box to find rooms by name
   - Select building from dropdown
   - Choose minimum capacity
   - Select required equipment (Projector, Whiteboard, Video Conference)

2. **Time-based Filtering:**
   - The "Available from" datetime is pre-filled with current time
   - Adjust the datetime to check availability for a specific time
   - Toggle "Show booked rooms" to see all rooms or only available ones

3. **Distance Features:**
   - Click "Enable Distance" button
   - Allow browser location access when prompted
   - Room cards will show walking time (e.g., "5 min walk")
   - Sort by "Distance" to see nearest rooms first

4. **Sorting (with ascending/descending):**
   - Name ↑ (A-Z) or Name ↓ (Z-A)
   - Capacity ↑ (Smallest first) or Capacity ↓ (Largest first)
   - Distance ↑ (Nearest first) or Distance ↓ (Farthest first) - requires location

5. **Reset:**
   - Click "Reset Filters" to clear all filters and return to defaults

### Room Card Information:

Each room card now displays:
- Room name
- Status with time remaining:
  - "Available for 2h 30min" (until next booking)
  - "Booked for 45 min" (remaining booking time)
  - "Available" (no upcoming bookings)
- Capacity
- Floor
- Equipment list
- Distance (if location is enabled): "5 min walk"

---

## Technical Details

### Distance Calculation

The system uses a two-tier approach:

1. **Primary: Google Maps Distance Matrix API**
   - Provides accurate walking/driving times
   - Accounts for actual routes and terrain
   - Requires API key

2. **Fallback: Haversine Formula**
   - Calculates straight-line distance
   - Estimates walking time (80 meters/minute)
   - Always available, no API required

### Time Formatting

Smart formatting based on duration:
- < 1 min: "less than 1 min"
- 1-59 min: "5 min", "45 min"
- Exactly 1 hour: "1 hour"
- Exactly 2+ hours: "2 hours", "5 hours"
- Mixed: "2h 30min"

### Status Updates

Room status is checked:
- On component mount
- Every 30 seconds automatically
- When filters change

### Location Privacy

- Location is only requested when user clicks "Enable Distance"
- Browser shows permission prompt - user has full control
- Location is cached for 5 minutes to reduce requests
- No location data is sent to your server

---

## Browser Compatibility

- **Geolocation API:** All modern browsers (Chrome, Firefox, Safari, Edge)
- **HTTPS Required:** Location features only work on HTTPS (or localhost)
- **Permissions:** Users must grant location permission

---

## Next Steps

1. **Add Building Coordinates:**
   - Manually add lat/lng to your buildings table, OR
   - Use the geocoding service to convert addresses

2. **Optional - Set up Google Maps API:**
   - Get API key from Google Cloud Console
   - Add to `.env` file
   - Restart dev server

3. **Test the Features:**
   - Try different filters
   - Enable location and test distance
   - Check time remaining displays

4. **Production:**
   - Restrict API key to your production domain
   - Monitor API usage in Google Cloud Console
   - Consider caching distance calculations

---

## Troubleshooting

### Location not working:
- Ensure you're on HTTPS (or localhost)
- Check browser permissions
- Look for blocked location icon in address bar

### Distances not showing:
- Check that buildings have latitude/longitude
- Verify .env file is loaded (restart server)
- Check browser console for errors

### API errors:
- Verify API key is correct
- Check that Distance Matrix API is enabled
- Review Google Cloud Console for quota/billing

### Time remaining not updating:
- Check network tab for booking API calls
- Verify room has bookings in database
- Look for errors in browser console

---

## Summary

All requested features have been implemented:
- ✅ Complete filtering system (capacity, equipment, building, datetime)
- ✅ Show/hide booked rooms
- ✅ Reset filters functionality
- ✅ Default datetime set to "now"
- ✅ Sorting by name, capacity, and distance
- ✅ Time remaining display on cards
- ✅ Smart time formatting
- ✅ Distance calculation with Google Maps API
- ✅ Fallback distance calculation
- ✅ User location detection
- ✅ Distance display on cards
- ✅ Distance-based sorting

The implementation is production-ready and includes proper error handling, fallbacks, and user privacy considerations.
