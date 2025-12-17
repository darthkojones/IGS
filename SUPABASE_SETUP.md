# Supabase Setup for Time-Based Room Availability

This guide provides the SQL scripts needed to set up the bookings system in Supabase.

## Prerequisites
- Supabase project created
- `public.room` and `auth.users` tables exist
- Access to Supabase SQL Editor

## SQL Setup Scripts

### 1. Create Bookings Table

Copy and paste into Supabase SQL Editor:

```sql
-- Create sequence for booking IDs
CREATE SEQUENCE IF NOT EXISTS public.bookings_id_seq
  START 1
  INCREMENT 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  booking_id bigint PRIMARY KEY DEFAULT nextval('public.bookings_id_seq'),
  room_id bigint NOT NULL REFERENCES public.room(room_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  title varchar(255) NOT NULL,
  status varchar(50) NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'active', 'completed', 'cancelled', 'no_show')),
  entry_method varchar(50) CHECK (entry_method IN ('qr_code', 'nfc', 'motion_sensor') OR entry_method IS NULL),
  entered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_times CHECK (start_time < end_time),
  CONSTRAINT check_entered_at CHECK (entered_at IS NULL OR entered_at >= start_time)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON public.bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_time_range ON public.bookings(room_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
```

### 2. Enable Row Level Security (RLS) Policies

```sql
-- Policy: Authenticated users can view all bookings
CREATE POLICY "Users can view all bookings"
  ON public.bookings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can create bookings
CREATE POLICY "Users can create bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own bookings
CREATE POLICY "Users can update own bookings"
  ON public.bookings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own bookings
CREATE POLICY "Users can delete own bookings"
  ON public.bookings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Admins can manage all bookings
CREATE POLICY "Admins can manage all bookings"
  ON public.bookings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

### 3. Create Sample Bookings for Testing

```sql
-- Get user ID and room ID (replace with actual values)
-- Get authenticated user: SELECT auth.uid();
-- Get first room: SELECT room_id FROM public.room LIMIT 1;

-- Example: Create a booking for Classroom 301 (room_id: 1)
INSERT INTO public.bookings (room_id, user_id, start_time, end_time, title, status)
VALUES (
  1,  -- Replace with actual room_id
  'USER-UUID-HERE',  -- Replace with actual user UUID from auth.users
  NOW() AT TIME ZONE 'UTC' + INTERVAL '2 hours',
  NOW() AT TIME ZONE 'UTC' + INTERVAL '3 hours',
  'Team Standup',
  'reserved'
);

-- Create another booking for a different time slot
INSERT INTO public.bookings (room_id, user_id, start_time, end_time, title, status)
VALUES (
  1,
  'USER-UUID-HERE',
  NOW() AT TIME ZONE 'UTC' + INTERVAL '5 hours',
  NOW() AT TIME ZONE 'UTC' + INTERVAL '6 hours',
  'Project Review',
  'reserved'
);

-- Create a booking for a different room
INSERT INTO public.bookings (room_id, user_id, start_time, end_time, title, status)
VALUES (
  2,  -- Different room
  'USER-UUID-HERE',
  NOW() AT TIME ZONE 'UTC' + INTERVAL '2 hours',
  NOW() AT TIME ZONE 'UTC' + INTERVAL '4 hours',
  'Training Session',
  'reserved'
);
```

### 4. Verify Setup

```sql
-- Check bookings table exists and has indexes
SELECT tablename FROM pg_tables WHERE tablename = 'bookings';

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'bookings';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'bookings';

-- Check sample data
SELECT * FROM public.bookings ORDER BY created_at DESC LIMIT 5;

-- Test availability query: Rooms available in next 2 hours
SELECT DISTINCT r.room_id, r.name
FROM public.room r
LEFT JOIN public.bookings b ON r.room_id = b.room_id
  AND b.status IN ('reserved', 'active')
  AND b.start_time < NOW() + INTERVAL '2 hours'
  AND b.end_time > NOW()
WHERE b.booking_id IS NULL
ORDER BY r.name;
```

## Verification Checklist

- [ ] Bookings table created
- [ ] Sequences created for ID generation
- [ ] Indexes created for performance
- [ ] RLS enabled on table
- [ ] RLS policies created
- [ ] Sample bookings inserted
- [ ] Availability query returns correct results

## Troubleshooting

### Issue: "relation 'bookings' does not exist"
**Solution**: Run the table creation script first

### Issue: RLS policies denying access
**Solution**: 
1. Check user is authenticated: `SELECT auth.role();`
2. Verify user exists in `auth.users`
3. Ensure RLS policy `USING` clause matches your user

### Issue: Bookings not showing in availability query
**Solution**:
1. Verify bookings have `status IN ('reserved', 'active')`
2. Check `start_time` and `end_time` are in correct timezone
3. Ensure `room_id` foreign key references exist

### Issue: Poor query performance
**Solution**: Verify indexes exist with:
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'bookings';
```

## Testing the Integration

### 1. Check Available Rooms

In your application:
```typescript
const available = await roomService.getAvailableRooms(
  new Date(), // Now
  new Date(Date.now() + 2 * 60 * 60 * 1000) // +2 hours
);
console.log('Available rooms:', available);
```

### 2. Create a Booking

```typescript
const booking = await bookingService.createBooking({
  roomId: '1',
  userId: 'your-user-id',
  startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // +2 hours
  endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // +3 hours
  title: 'Test Meeting',
  status: 'reserved'
});
console.log('Created booking:', booking);
```

### 3. Verify Availability Changed

```typescript
const available2 = await roomService.getAvailableRooms(
  new Date(Date.now() + 2 * 60 * 60 * 1000), // +2 hours
  new Date(Date.now() + 3 * 60 * 60 * 1000) // +3 hours
);
console.log('Available rooms (should exclude booked room):', available2);
```

## Performance Tips

1. **Add Indexes**: Already included in setup script
2. **Archive Old Bookings**: Consider archiving completed bookings older than 1 year
3. **Monitor Query Performance**: Use `EXPLAIN ANALYZE` before optimization
4. **Pagination**: When displaying many bookings, use LIMIT/OFFSET
5. **Caching**: Cache room availability for 5-10 minutes in the UI

## Maintenance Tasks

### Monthly: Cleanup Cancelled Bookings
```sql
-- Delete bookings cancelled more than 90 days ago
DELETE FROM public.bookings
WHERE status = 'cancelled' 
  AND created_at < NOW() - INTERVAL '90 days';
```

### Quarterly: Archive Completed Bookings
```sql
-- Create archive table if needed
CREATE TABLE IF NOT EXISTS public.bookings_archive AS
SELECT * FROM public.bookings WHERE 1=0;

-- Archive old completed bookings
INSERT INTO public.bookings_archive
SELECT * FROM public.bookings
WHERE status = 'completed' AND end_time < NOW() - INTERVAL '1 year';

-- Delete archived bookings from main table
DELETE FROM public.bookings
WHERE status = 'completed' AND end_time < NOW() - INTERVAL '1 year';
```

### Monthly: Analyze Query Performance
```sql
-- Analyze table for query planner
ANALYZE public.bookings;

-- Check if indexes are being used
EXPLAIN ANALYZE
SELECT * FROM public.bookings
WHERE room_id = 1
  AND status IN ('reserved', 'active')
  AND start_time < NOW() + INTERVAL '1 day'
  AND end_time > NOW();
```

