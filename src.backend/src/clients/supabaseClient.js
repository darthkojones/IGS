require('dotenv').config({ path: '../../.env.local'});

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

/**
 *
 * @returns {Room[]}
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
  ) ?? [];
}

/**
 *
 * @param {Room} room
 * @returns {Booking[]}
 */
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
    ) ?? [];
}

/**

 * @param {Booking[]} bookings
 * @param {Date} dateTimeNow
 * @returns {Boolean}
 */
function isRoomOccupied(bookings, dateTimeNow) {
  const now = dateTimeNow.getTime();
  return bookings.filter(b => b.startTime.getTime() < now && b.endTime.getTime() > now).length > 0;
}

/**
 *
 * @param {Booking[]} bookings
 * @param {Date} dateTimeNow
 * @returns {Booking | null}
 */
function findNextBooking(bookings, dateTimeNow) {
  const now = dateTimeNow.getTime();
  return bookings
    .filter(b => b.startTime.getTime() > now && (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.RESERVED))
    .sort((a, b) => (a.startTime.getTime() > b.startTime.getTime() ? 1 : a.startTime.getTime() < b.startTime.getTime() ? -1 : 0))
    .at(0) ?? null;
}

/**
 *
 * @param {Booking[]} bookings
 * @param {Date} dateTimeNow
 * @returns {Booking | null}
 */
function findPreviousBooking(bookings, dateTimeNow) {
  const now = dateTimeNow.getTime();
  return bookings
    .filter(b => b.endTime.getTime() < now && b.status === BookingStatus.COMPLETED)
    .sort((a, b) => (a.endTime.getTime() > b.endTime.getTime() ? -1 : a.endTime.getTime() < b.endTime.getTime() ? 1 : 0))
    .at(0) ?? null;
}

/**
 *
 * @param {Date} expiryDateTime
 * @returns {Booking[]}
 */
async function getExpiredBookings(expiryDateTime) {
  const { data, error } = await supabase
    .from('booking')
    .select('id, room_id, status, start_time, end_time, entered_at')
    .eq('status', BookingStatus.RESERVED)
    .lt('start_time', expiryDateTime.toISOString());

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
        enteredAt: new Date(b.entered_at ?? null),
      })
    ) ?? [];
}

/**
 *
 * @param {Booking[]} bookings
 * @returns {void}
 */
async function setBookingsToExpired(bookings) {
  const bookingIds = bookings.map(b => b.bookingId);

  const { error } = await supabase
    .from('booking')
    .update( { status: BookingStatus.EXPIRED } )
    .in('id', bookingIds);

  if (error) {
    console.error('Supabase error updating bookings', error);
    throw error;
  }
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
  getAllBookingsForRoom,
  isRoomOccupied,
  findNextBooking,
  findPreviousBooking,
  getExpiredBookings,
  setBookingsToExpired,
  Booking,
  Room
};
