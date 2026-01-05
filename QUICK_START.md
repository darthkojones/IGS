# Quick Start Guide

## What Was Implemented ✅

All three tasks are complete:

1. **Task 1: Sort and Filter** - All filters working, default time set to "now"
2. **Task 2: Detailed Status** - Cards show "Available for 2h 30min" or "Booked for 45 min"
3. **Task 3: Distance** - Google Maps integration with fallback, distance sorting

## What You Need to Do

### Required Steps:

#### 1. Add Coordinates to Buildings
Your buildings need latitude and longitude. Update your database:

```sql
-- Example for each building:
UPDATE buildings SET 
  latitude = 48.137154, 
  longitude = 11.576124 
WHERE building_id = 'building-1';
```

Find coordinates on Google Maps: Right-click → "What's here?"

### Optional Steps (Recommended):

#### 2. Set Up Google Maps API

**Why:** For accurate walking times instead of estimates.

**Steps:**
1. Get free API key: https://console.cloud.google.com/
2. Enable "Distance Matrix API"
3. Copy `.env.example` to `.env`
4. Add your key to `.env`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_key_here
   ```
5. Restart dev server: `npm run dev`

**Without API:** The system still works using straight-line distance estimates.

## Features Overview

### Filters:
- Search by room name
- Filter by building
- Filter by minimum capacity (4+, 8+, 10+, 20+, 30+)
- Filter by equipment (Projector, Whiteboard, Video Conference)
- Filter by available time (defaults to NOW)
- Toggle show/hide booked rooms
- Reset all filters button

### Sorting:
- By Name (A-Z)
- By Capacity (largest first)
- By Distance (nearest first, after enabling location)

### Room Cards Show:
- Status: "Available for 2h 30min" or "Booked for 45 min"
- Distance: "5 min walk" (after enabling location)
- Capacity, floor, equipment

### Location Features:
- Click "Enable Distance" button
- Browser asks for permission
- Cards show walking time
- Sort by distance becomes useful

## Testing Without Google Maps API

The system works perfectly fine without the API:
- Distance calculations use Haversine formula (straight-line)
- Walking time estimated at 80 meters/minute
- All features functional

## Files to Check

- **src/views/RoomsView.vue** - Main filtering logic
- **src/components/RoomCard.vue** - Time remaining display
- **src/services/distanceService.ts** - Distance calculations
- **src/composables/useRoomStatus.ts** - Status with time remaining
- **.env.example** - Environment variables template

## Questions?

See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for detailed documentation.
