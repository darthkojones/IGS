/**
 * Author: wa7205@mci4me.at
 * Modified: 18 Jan 2025
 */

const supabase = require('../clients/supabaseClient')

/**
 * Gets a list of all rooms
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
 * Gets room by ID
 * @param {string} roomId
 * @returns {Room | null}
 */
async function getRoomById(roomId) {
  const { data, error } = await supabase
    .from('room')
    .select('room_id, name, floor, building_id')
    .eq('room_id', roomId)

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
  ).at(0) ?? null;
}

/**
 * Gets todays bookings for the room
 * @param {Room} room
 * @returns {Booking[]}
 */
async function getTodaysBookingsForRoom(room) {
  const roomId = room.roomId;

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const endOfToday = new Date(startOfToday.getTime());
  endOfToday.setUTCHours(23, 59, 59, 59);

  const { data, error } = await supabase
    .from('booking')
    .select('id, room_id, status, start_time, end_time, entered_at')
    .eq('room_id', roomId)
    .gte('start_time', startOfToday.toISOString())  // Every booking that starts after today 00:00
    .lte('start_time', endOfToday.toISOString());   // Every booking that starts before today 00:00

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
 * Gets bookings confirmed after checkedInAfterDateTime
 * @param {Date} checkedInAfterDateTime
 * @returns {Booking[]}
 */
async function getConfirmedBookings(checkedInAfterDateTime) {
  const { data, error } = await supabase
    .from('booking')
    .select('id, room_id, status, start_time, end_time, entered_at')
    .in('status', [BookingStatus.CONFIRMED, BookingStatus.ACTIVE] )
    .gt('entered_at', checkedInAfterDateTime.toISOString());

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
 * Gets bookings completed after completedAfterDateTime
 * @param {Date} completedAfterDateTime
 * @returns {Booking[]}
 */
async function getCompletedBookings(completedAfterDateTime) {
    const { data, error } = await supabase
    .from('booking')
    .select('id, room_id, status, start_time, end_time, entered_at')
    .eq('status', BookingStatus.COMPLETED)
    .gt('end_time', completedAfterDateTime.toISOString());

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
 * Gets bookings expired after expiryDateTime
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
 * Sets bookings to status expired
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

/**
 * Needs to mirror statuses used in frontend
 */
const BookingStatus = {
  RESERVED: 'reserved',   // Initial state when booking is created
  CONFIRMED: 'confirmed', // User confirmed they will attend
  ACTIVE: 'active',       // Meeting is currently ongoing
  EXPIRED: 'expired',     // Start time passed without confirmation
  CANCELLED: 'cancelled', // User or admin cancelled the booking
  COMPLETED: 'completed'  // Meeting ended (only if was active)
}

/**
 * Class Booking is only dataclass and has no methods
 * All members are public
 */
class Booking {
  bookingId;  // string
  roomId;     // string
  status;     // string BookingStatus
  startTime;  // Date
  endTime;    // Date
  enteredAt;  // Date
}

/**
 * Class Room is only dataclass and has no methods
 * All members are public
 */
class Room {
  roomId;     // string
  name;       // string
  floor;      // number
  buildingId; // string
}

module.exports = {
  supabase,
  Booking,
  Room,
  getAllRooms,
  getExpiredBookings,
  setBookingsToExpired,
  getTodaysBookingsForRoom,
  getConfirmedBookings,
  getCompletedBookings,
  getRoomById
};
