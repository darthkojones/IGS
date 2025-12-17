# Implementation Summary: Time-Based Room Availability

## Problem Statement
Rooms previously showed availability based on a static `status` field. In reality, meeting rooms can be occupied at certain times but free at others. Availability should be determined by checking the bookings table for time-based conflicts.

## Solution Implemented
Replace static status-based filtering with dynamic time-based availability checking using the bookings table.

---

## Files Modified/Created

### New Files Created:
1. **`src/mappers/bookingMapper.ts`** (NEW)
   - Maps Supabase booking rows to TypeScript `Booking` type
   - Converts snake_case columns to camelCase properties
   - Function: `mapBookingData(data)`

2. **`TIME_BASED_AVAILABILITY.md`** (NEW)
   - Comprehensive documentation of the implementation
   - Database schema, usage patterns, testing guide

### Files Modified:

3. **`src/services/bookingService.ts`** (REFACTORED)
   - Replaced REST API calls with Supabase queries
   - New methods:
     - `getBookingsByRoom(roomId)` - Get all bookings for a room
     - `getBookingsByUser(userId)` - Get all bookings for a user
     - `hasBookingConflict(roomId, startTime, endTime)` - Check availability
     - `getBookingsByTimeRange(startTime, endTime)` - Get overlapping bookings
     - `createBooking(booking)` - Create new booking
     - `updateBooking(bookingId, updates)` - Update booking
     - `cancelBooking(bookingId)` - Cancel booking
     - `deleteBooking(bookingId)` - Delete booking
     - `confirmEntry(bookingId, entryMethod)` - Confirm user entry

4. **`src/services/roomService.ts`** (UPDATED)
   - `getAvailableRooms(startTime, endTime)` - **KEY CHANGE**
     - OLD: Returned all rooms with `status === 'free'`
     - NEW: Queries bookings table and filters out rooms with conflicting bookings
     - Implementation:
       1. Fetch all rooms
       2. Query bookings with time overlap
       3. Create set of booked room IDs
       4. Return only rooms not in the booked set

5. **`src/stores/bookings.ts`** (REFACTORED)
   - Migrated from localStorage to Supabase
   - Removed `loadBookingsFromStorage()` and `saveBookingsToStorage()`
   - New state uses `bookingService` for all operations
   - New methods:
     - `fetchRoomBookings(roomId)` - Load room's bookings
     - `checkAvailability(roomId, startTime, endTime)` - Check if room is free
   - Updated methods:
     - `createBooking()` - Now uses `bookingService.createBooking()`
     - `fetchUserBookings()` - Now uses `bookingService.getBookingsByUser()`
     - `cancelBooking()` - Now uses `bookingService.cancelBooking()`
     - `confirmEntry()` - Now uses `bookingService.confirmEntry()`

6. **`src/views/RoomsView.vue`** (UPDATED)
   - Removed static status filter
   - OLD: `filtered = filtered.filter(room => room.status === 'free')`
   - NEW: Filters only by building and search query
   - Availability now checked server-side in `roomService.getAvailableRooms()`
   - Added TypeScript type import for `Room`
   - Fixed type errors (no more `any` types)

---

## Key Architecture Changes

### Before: Status-Based Availability
```
Room Table
├── room_id
├── name
├── status ('free' | 'occupied' | 'reserved') ← Single source of truth
└── ...

Frontend Logic:
- Display all rooms with status === 'free'
- No consideration for actual bookings
```

### After: Time-Based Availability
```
Room Table
├── room_id
├── name
├── status (maintenance indicator) ← Separate concern
└── ...

Bookings Table
├── booking_id
├── room_id ── FK
├── user_id ── FK
├── start_time  ← Time-based availability
├── end_time    ← Time-based availability
├── status ('reserved' | 'active' | ...)
└── ...

Frontend Logic:
- Query rooms: roomService.getAvailableRooms(startTime, endTime)
- Service queries bookings for overlaps
- Returns only non-conflicting rooms
```

---

## Data Flow for Room Booking

### Step 1: User Selects Time
```
User → BookingForm
Input: Date + Start Time + Duration
```

### Step 2: Check Availability
```
BookingForm
→ roomService.getAvailableRooms(startTime, endTime)
  → SELECT * FROM room
  → SELECT * FROM bookings WHERE status IN ('reserved', 'active')
     AND start_time < endTime AND end_time > startTime
  → Filter out booked rooms
  → Return available rooms
```

### Step 3: User Selects Room & Confirms
```
BookingForm + Room Selection
→ bookingService.createBooking(bookingData)
  → INSERT INTO bookings (...)
  → Return new booking with ID
```

### Step 4: Future Availability Checks
```
Next time user checks availability for same time:
→ Previous booking is now in the bookings table
→ That room will be excluded from getAvailableRooms()
```

---

## Database Dependency

### Required Bookings Table Schema
```sql
CREATE TABLE public.bookings (
  booking_id bigint PRIMARY KEY,
  room_id bigint NOT NULL REFERENCES public.room(room_id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  title varchar(255) NOT NULL,
  status varchar(50) DEFAULT 'reserved',
  entry_method varchar(50),
  entered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT NOW(),
  CONSTRAINT check_times CHECK (start_time < end_time),
  CONSTRAINT valid_status CHECK (status IN ('reserved', 'active', 'completed', 'cancelled', 'no_show'))
);
```

### Time Overlap Query Logic
```sql
-- Find bookings that overlap with requested time
WHERE room_id = $1
  AND status IN ('reserved', 'active')
  AND start_time < $endTime
  AND end_time > $startTime
```

This covers all overlap scenarios:
- Booking starts before, ends during
- Booking starts during, ends after
- Booking completely within range
- Booking completely contains range

---

## Type System

### Booking TypeScript Interface
```typescript
export interface Booking {
  bookingId: string;
  roomId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  title: string;
  status: BookingStatus;
  entryMethod?: EntryMethod;
  enteredAt?: Date;
  createdAt: Date;
}

export enum BookingStatus {
  RESERVED = 'reserved',    // Waiting for entry
  ACTIVE = 'active',        // User entered
  COMPLETED = 'completed',  // Time elapsed
  CANCELLED = 'cancelled',  // User cancelled
  NO_SHOW = 'no_show'       // Didn't show up
}

export enum EntryMethod {
  QR_CODE = 'qr_code',
  NFC = 'nfc',
  MOTION_SENSOR = 'motion_sensor'
}
```

---

## Testing Scenarios

### Test 1: Room With No Bookings
```typescript
// Before test: Delete all bookings for room 1
await bookingService.deleteBooking('*'); // Delete all

// Check availability
const available = await roomService.getAvailableRooms(
  new Date('2025-12-15T09:00'),
  new Date('2025-12-15T10:00')
);
// ✓ Room 1 should be in results
```

### Test 2: Room With Overlapping Booking
```typescript
// Create booking for room 1, 10:00-11:00
await bookingService.createBooking({
  roomId: '1',
  userId: 'user-uuid',
  startTime: new Date('2025-12-15T10:00'),
  endTime: new Date('2025-12-15T11:00'),
  title: 'Team Meeting',
  status: 'reserved'
});

// Check availability for overlapping time
const available = await roomService.getAvailableRooms(
  new Date('2025-12-15T10:30'),  // Overlaps!
  new Date('2025-12-15T11:30')
);
// ✗ Room 1 should NOT be in results

// Check availability for non-overlapping time
const available2 = await roomService.getAvailableRooms(
  new Date('2025-12-15T11:00'),  // Starts when booking ends
  new Date('2025-12-15T12:00')
);
// ✓ Room 1 should be in results
```

### Test 3: Multiple Rooms, Multiple Bookings
```typescript
// Setup: Rooms 1, 2, 3; Bookings: Room1@10-11, Room2@10-11
// Query: 10:00-11:00
// Expected: Only Room 3 available
const available = await roomService.getAvailableRooms(
  new Date('2025-12-15T10:00'),
  new Date('2025-12-15T11:00')
);
// Should return only Room 3
```

---

## Performance Considerations

### Current Implementation
- Fetches all rooms (typically < 100)
- Fetches all overlapping bookings for time range (typically < 1000)
- Filters in-memory with Set lookup O(n)

### Optimization Opportunities
1. Add database index on `bookings(room_id, status, start_time, end_time)`
2. Implement short-lived caching (Redis/Supabase cache)
3. Paginate if room count > 500
4. Use Supabase Realtime for live updates

---

## Migration Path from Old System

For applications upgrading from status-based to time-based availability:

1. Keep `room.status` field for maintenance/closure indication
2. Ignore `room.status` in availability queries
3. Rely entirely on `bookings` table for scheduling
4. Example statuses that can coexist:
   - Room status = 'occupied' (maintenance) → Never available
   - Room status = 'free' + Has booking → Unavailable for that time
   - Room status = 'free' + No booking → Available

---

## Summary of Changes

| Component | Old Behavior | New Behavior |
|-----------|--------------|--------------|
| `getAvailableRooms()` | Filter by `status === 'free'` | Query bookings table, filter conflicts |
| `bookingService` | REST API | Supabase queries |
| `bookingsStore` | localStorage | Supabase via service |
| `RoomsView` | Static status filter | Dynamic time-based filter |
| Availability | Single timestamp | Time range (startTime, endTime) |
| Booking conflicts | Not checked | Checked for overlaps |

---

## Next Steps

1. **RLS Policies**: Ensure Supabase RLS policies are configured for bookings table
2. **Sample Data**: Create test bookings in database for QA testing
3. **UI Integration**: Update NewBookingForm to pass time range to availability check
4. **Validation**: Add conflict checking before booking creation
5. **Notifications**: Implement real-time updates for availability changes

