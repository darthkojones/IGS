require('dotenv').config({ path: '../../.env.local'});

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

/**
 *
 * @returns {Room[]}: List of all rooms
 */
async function getAllRooms() {
  const { data, error } = await supabase
    .from('room')
    .select('room_id, name, floor, building_id')

  if (error) {
    console.error('Supabase error fetching rooms', error);
    throw error;
  }

  return data.map(r =>
    Object.assign(new Room(), {
      roomId: r.room_id ?? null,
      name: r.name ?? null,
      floor: r.floor ?? null,
      buildingId: r.building_id ?? null
    })
  )
}

/**
 *
 * @param {Room} room: The room for which the previous and next meeting should be queried
 * @param {Date} timestampNow: The timestamp that serves as 'now'
 * @returns {null | { previous: float, next: float }}The minutes to the previous and next booking; returns null if there is an active booking
 */
async function getMinutesToPreviousAndNextBooking(room, timestampNow) {
  const roomId = room.roomId;
  if (!roomId) throw new Error('Invalid argument, hand over valid room.');

  if (!(timestampNow instanceof Date)) throw new Error('Invalid argument, hand over valid date.')
  const utcDate = timestampNow.getTime();

  const { data, error } = await supabase
    .from('booking')
    .select('id, room_id, status, start_time, end_time, entered_at')
    .eq('room_id', roomId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Supabase error fetching bookings', error);
    throw error;
  }

  let prevAndNext = { prev: new Date(0).getTime(), next: new Date(2100, 0) }
  for (let b of data) {
    if (!b.start_time || !b.end_time || !b.status) continue;

    entry = {
      start: new Date(b.start_time).getTime(),
      end: new Date(b.end_time).getTime(),
      status: b.status
    };

    if (
      entry.status === BookingStatus.ACTIVE &&
      entry.start <= utcDate &&
      entry.end >= utcDate
    ) {
      return null;
    } else if (
      entry.status === BookingStatus.COMPLETED &&
      entry.end <= utcDate &&
      entry.end > prevAndNext.previous
      ) {
      prevAndNext.prev = entry.end;
    } else if (
      (entry.status === BookingStatus.RESERVED || entry.status === BookingStatus.CONFIRMED) &&
      entry.start >= utcDate &&
      entry.start < prevAndNext.next
      ) {
      prevAndNext.next = entry.start;
    }
  }

  prevAndNext.next = (prevAndNext.next - utcDate) / 1000 / 60;
  prevAndNext.prev = (utcDate - prevAndNext.prev) / 1000 / 60;

  return prevAndNext;
}

/**
 * Gets bookings that are reserved and the start_date is smaller than the expiryDateTime are returned;
 * These bookings count as expired because the user did not check in within n minutes after the start date.
 * @param {Date} expiryDateTime: Bookings with start_date smaller than this are returned.
 * @returns {Booking[]}: Object of class Booking defined in supaBaseClient.js for use in the backend.
 */
async function getExpiredBookings(expiryDateTime) {
  const { data, error } = await supabase
    .from('booking')
    .select('id, room_id, status, start_time, end_time, entered_at')
    .eq('status', BookingStatus.RESERVED)
    .lt('start_time', expiryDateTime);

  if (error) {
    console.error('Supabase error fetching bookings', error);
    throw error;
  }

  const returnArray = [];
  data.forEach(b => {
    const returnElement = new Booking();
    returnElement.bookingId = b.id ?? "";
    returnElement.roomId = b.room_id ?? "";
    returnElement.status = b.status ?? "";
    returnElement.startTime = b.start_time ?? null;
    returnElement.endTime = b.end_time ?? null;
    returnElement.enteredAt = b.entered_at ?? null;
    returnArray.push(returnElement)
  })
  return returnArray;
}

/**
 * Bumps (sets to expired) the bookings handed over
 * @param {Booking[]} bookings
 * @returns {int} Number of bookings updated
 */
async function setBookingsToExpired(bookings) {
  const bookingIds = bookings
    .map(b => b.bookingId)
    .filter(id => id != null);

  const { error } = await supabase
    .from('booking')
    .update( { status: BookingStatus.EXPIRED } )
    .in('id', bookingIds);

  if (error) {
    console.error('Supabase error updating bookings', error);
    throw error;
  }

  return bookingIds.length;
}

const BookingStatus = {
  RESERVED: 'reserved',   // Initial state when booking is created
  CONFIRMED: 'confirmed', // User confirmed they will attend
  ACTIVE: 'active',       // Meeting is currently ongoing
  EXPIRED: 'expired',     // Start time passed without confirmation
  CANCELLED: 'cancelled', // User or admin cancelled the booking
  COMPLETED: 'completed'  // Meeting ended (only if was active)
}

class Booking {
  bookingId;  // str
  roomId;     // str
  status;     // str
  startTime;  // Date
  endTime;    // Date
  enteredAt;  // Date
}

class Room {
  roomId;     // str
  name;       // str
  floor;      // num
  buildingId; // str
}

module.exports = {
  supabase,
  getAllRooms,
  getExpiredBookings,
  getMinutesToPreviousAndNextBooking,
  setBookingsToExpired,
  Booking
};
