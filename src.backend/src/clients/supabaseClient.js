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

async function getAllBookingsForRoom(room) {
  const roomId = room.roomId;

  const { data, error } = await supabase
    .from('booking')
    .select('id, room_id, status, start_time, end_time, entered_at')
    .eq('room_id', roomId);

  if (error) {
    console.error('Supabase error fetching bookings', error);
    throw error;
  }

  return data
    .map(b =>
      Object.assign(new Booking(), {
        bookingId: b.id ?? null,
        roomId: b.room_id ?? null,
        status: b.status ?? null,
        startTime: new Date(b.start_time ?? null),
        endTime: new Date(b.end_time ?? null),
        enteredAt: new Date(b.entered_at ?? null)
      })
    ).filter(b =>
      b.bookingId != null &&
      b.roomId != null &&
      b.status != null &&
      b.startTime != null &&
      b.endTime != null
    );
}

async function isRoomOccupied(bookings, dateTimeNow) {
  const now = dateTimeNow.getTime();
  return bookings
    .filter(b => b.startTime.getTime() < now && b.endTime.getTime() > now)
    .length > 0;
}

function findNextBooking(bookings, dateTimeNow) {
  const now = dateTimeNow.getTime();
  return bookings
    .filter(b => b.startTime.getTime() > now && (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.RESERVED))
    .sort((a, b) => (a.startTime.getTime() > b.startTime.getTime() ? 1 : a.startTime.getTime() < b.startTime.getTime() ? -1 : 0))
    .at(0);
}

function findPreviousBooking(bookings, dateTimeNow) {
  const now = dateTimeNow.getTime();
  return bookings
    .filter(b => b.endTime.getTime() < now && b.status === BookingStatus.COMPLETED)
    .sort((a, b) => (a.endTime.getTime() > b.endTime.getTime() ? -1 : a.endTime.getTime() < b.endTime.getTime() ? 1 : 0))
    .at(0);
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
  findPreviousBooking,
  findNextBooking,
  isRoomOccupied,
  getAllBookingsForRoom,
  Booking
};
