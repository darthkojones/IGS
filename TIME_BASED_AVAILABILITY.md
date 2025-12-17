# Time-Based Room Availability Implementation

## Overview
Rooms are now filtered based on **actual bookings** rather than a static status field. A room is "available" only if there are no active or reserved bookings during the requested time period.

## Database Schema

### Bookings Table
The `public.bookings` table stores room reservations with time-based information:

```sql
CREATE TABLE public.bookings (
  booking_id bigint PRIMARY KEY DEFAULT nextval('bookings_id_seq'),
  room_id bigint NOT NULL REFERENCES public.room(room_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  title varchar(255) NOT NULL,
  status varchar(50) NOT NULL DEFAULT 'reserved', -- 'reserved', 'active', 'completed', 'cancelled', 'no_show'
  entry_method varchar(50), -- 'qr_code', 'nfc', 'motion_sensor'
  entered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_times CHECK (start_time < end_time),
  CONSTRAINT valid_status CHECK (status IN ('reserved', 'active', 'completed', 'cancelled', 'no_show'))
);
```

## Key Changes

### 1. Room Service (`src/services/roomService.ts`)
- **`getAvailableRooms(startTime, endTime)`** now:
  1. Fetches all rooms
  2. Queries bookings table for overlapping time ranges
  3. Filters out rooms with booking conflicts
  4. Returns only truly available rooms

**Time overlap detection:**
```sql
status IN ('reserved', 'active') 
AND start_time < end_time_requested 
AND end_time > start_time_requested
```

### 2. Booking Service (`src/services/bookingService.ts`)
New service with complete CRUD operations:
- `getBookingsByRoom(roomId)` - All bookings for a room
- `getBookingsByUser(userId)` - All bookings for a user
- `hasBookingConflict(roomId, startTime, endTime)` - Check availability
- `getBookingsByTimeRange(startTime, endTime)` - Get all bookings in a time range
- `createBooking(booking)` - Create new booking
- `updateBooking(bookingId, updates)` - Update booking details
- `cancelBooking(bookingId)` - Cancel a booking
- `confirmEntry(bookingId, entryMethod)` - Mark booking as active with entry method

### 3. Booking Mapper (`src/mappers/bookingMapper.ts`)
Converts database rows (snake_case) to TypeScript types (camelCase):
- `booking_id` → `bookingId`
- `room_id` → `roomId`
- `user_id` → `userId`
- `start_time` → `startTime`
- `end_time` → `endTime`
- `entry_method` → `entryMethod`
- `entered_at` → `enteredAt`
- `created_at` → `createdAt`

### 4. Bookings Store (`src/stores/bookings.ts`)
Refactored from localStorage to Supabase:
- `createBooking(bookingData)` - Creates booking in database
- `fetchUserBookings(userId)` - Loads user's bookings
- `fetchRoomBookings(roomId)` - Loads room's bookings
- `checkAvailability(roomId, startTime, endTime)` - Checks room availability
- `cancelBooking(bookingId)` - Cancels booking
- `confirmEntry(bookingId, entryMethod)` - Confirms user entry

### 5. Room View (`src/views/RoomsView.vue`)
**Simplified filtering:**
- Removed status-based filtering (`room.status === 'free'`)
- Now only filters by building and search query
- Actual availability checked server-side in `getAvailableRooms()`

**New workflow:**
1. User selects a time range for booking
2. `getAvailableRooms(startTime, endTime)` queries database for conflicts
3. Only non-conflicting rooms are displayed
4. User selects a room and confirms booking

## Usage Flow

### For Users Booking a Room:
1. Navigate to "Book a Room"
2. Select desired date and time range
3. System queries available rooms via `roomService.getAvailableRooms(startTime, endTime)`
4. Only rooms without bookings in that time are shown
5. User selects a room and completes booking

### For Checking Room Availability:
```typescript
// In any component
const availableRooms = await roomService.getAvailableRooms(
  new Date('2025-12-15T09:00:00'),
  new Date('2025-12-15T10:00:00')
);
// Returns only rooms with no 'reserved' or 'active' bookings in that time
```

### For Creating a Booking:
```typescript
const booking = await bookingService.createBooking({
  roomId: 'room-123',
  userId: 'user-uuid',
  startTime: new Date('2025-12-15T09:00:00'),
  endTime: new Date('2025-12-15T10:00:00'),
  title: 'Team Meeting',
  status: 'reserved'
});
```

## Database RLS Policies Required
```sql
-- Allow authenticated users to read all bookings
CREATE POLICY "Users can view all bookings"
  ON public.bookings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to create bookings
CREATE POLICY "Users can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update/delete their own bookings
CREATE POLICY "Users can manage own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookings"
  ON public.bookings FOR DELETE
  USING (auth.uid() = user_id);
```

## TypeScript Types

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
  RESERVED = 'reserved',      // Booking confirmed, waiting for entry
  ACTIVE = 'active',          // User has entered the room
  COMPLETED = 'completed',    // Booking period ended
  CANCELLED = 'cancelled',    // Booking was cancelled
  NO_SHOW = 'no_show'         // User didn't show up
}

export enum EntryMethod {
  QR_CODE = 'qr_code',
  NFC = 'nfc',
  MOTION_SENSOR = 'motion_sensor'
}
```

## Testing Time-Based Availability

To test with sample bookings, insert test data:
```sql
-- Create a booking for Classroom 301 from 10:00-11:00 today
INSERT INTO public.bookings (room_id, user_id, start_time, end_time, title, status)
VALUES (
  1,  -- room_id
  'user-uuid',
  NOW() AT TIME ZONE 'UTC' + INTERVAL '2 hours',
  NOW() AT TIME ZONE 'UTC' + INTERVAL '3 hours',
  'Test Booking',
  'reserved'
);
```

Then call:
```typescript
const available = await roomService.getAvailableRooms(
  new Date(Date.now() + 2 * 60 * 60 * 1000),  // +2 hours
  new Date(Date.now() + 3 * 60 * 60 * 1000)   // +3 hours
);
// Room 1 (Classroom 301) should NOT be in the results
```

## Migration from Status-Based to Time-Based

Previously, room availability was determined by a static `room.status` column:
- `'free'` = available
- `'occupied'` = in use
- `'reserved'` = booked

This was replaced with:
- Status field now indicates room readiness (maintenance, etc.) - not booking availability
- Availability is computed dynamically from bookings table
- A room can be "free" (status) but "booked" (has overlapping booking)
- A room can be "occupied" (status) but still be "free" (no booking conflicts)

## Performance Considerations

The current implementation queries:
1. All rooms (typically < 100)
2. All bookings in the time range (typically < 1000)

For better performance with large datasets, consider:
1. Database indexes on `bookings(room_id, status, start_time, end_time)`
2. Caching availability results with a short TTL
3. Pagination if displaying very large room lists
4. Using Supabase Realtime for live updates

