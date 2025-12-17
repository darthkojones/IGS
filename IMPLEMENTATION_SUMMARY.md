## Booking methods
1. **Booking service unctions**
     - `getBookingsByRoom(roomId)` - Get all bookings for a room
     - `getBookingsByUser(userId)` - Get all bookings for a user
     - `hasBookingConflict(roomId, startTime, endTime)` - Check availability
     - `getBookingsByTimeRange(startTime, endTime)` - Get overlapping bookings
     - `createBooking(booking)` - Create new booking
     - `updateBooking(bookingId, updates)` - Update booking
     - `cancelBooking(bookingId)` - Cancel booking
     - `deleteBooking(bookingId)` - Delete booking
     - `confirmEntry(bookingId, entryMethod)` - Confirm user entry


2. **Bookings store functions**
   - Migrated from localStorage to Supabase
   - New state uses `bookingService` for all operations
   - New methods:
     - `fetchRoomBookings(roomId)` - Load room's bookings
     - `checkAvailability(roomId, startTime, endTime)` - Check if room is free
   - Updated methods:
     - `createBooking()`
     - `getBookingsByUser()`
     - `cancelBooking()`
     - `confirmEntry()`


3. **User registration and authentication**: User registers for a profile, adds a password and other personal data, Authentication is handled by Supabase (authentication is managed by supabase) and profile info is stored in users table.pasword is hidden from dashboard.
user can then login with email and password. for now, email verification is disabled. pasword check as well. 

4. **Authentication service** makes use of supabase's
```ts 
// import supabase
import { supabase } from '@/lib/supabaseClient'

// sign in authentication
await supabase.auth.signInWithPassword({ email, password }).

// sign up
await supabase.auth.signUp({ email, password })

// Authentication service also includes functions to fetch current user and logout.
``` 

5. **Autrhentication store**
 then makes use of the authentication service to fetch user data, and maintain user state.

## Key Architecture Changes

### Before: Status-Based Availability
```

Bookings Table
├── booking_id
├── room_id ── FK
├── user_id ── FK
├── start_time  ← Time-based availability
├── end_time    ← Time-based availability
├── status ('reserved' | 'active' | ...)
└── ...

### Database rules
- Users can only add a booking that is related t thir id.
- users can `SELECT *` from books but only if authoirised (logged in). 
- users can only update bookings with (booking.user_id == auth.user_id)

Frontend Logic:
- Query rooms: roomService.getAvailableRooms(startTime, endTime)
- Service queries bookings for overlaps
- Returns only non-conflicting rooms
```

