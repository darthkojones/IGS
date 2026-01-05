import type { Booking, BookingStatus, EntryMethod } from '@/types';
import { mapRoomData } from './roomMapper';
import { mapSupabaseUserToUser } from './userMapper';

/**
 * Map Supabase booking row to TypeScript Booking interface
 * Converts snake_case database columns to camelCase TypeScript properties
 */
export function mapBookingData(data: Record<string, unknown>): Booking {
  console.log('=== Mapping Booking Data ===');
  console.log('Raw data:', data);
  console.log('User data present?', !!data.user);
  console.log('User data:', data.user);
  
  const booking: Booking = {
    bookingId: String(data.id ?? data.booking_id ?? ''),
    roomId: String(data.room_id ?? ''),
    userId: String(data.user_id ?? ''),
    startTime: data.start_time ? new Date(String(data.start_time)) : new Date(),
    endTime: data.end_time ? new Date(String(data.end_time)) : new Date(),
    title: String(data.title ?? ''),
    status: String(data.status ?? 'reserved') as BookingStatus,
    entryMethod: data.entry_method ? (String(data.entry_method) as EntryMethod) : undefined,
    enteredAt: data.entered_at ? new Date(String(data.entered_at)) : undefined,
    createdAt: data.created_at ? new Date(String(data.created_at)) : new Date(),
  };

  // Map room data if available
  if (data.room && typeof data.room === 'object') {
    booking.room = mapRoomData(data.room as Record<string, unknown>);
    console.log('Room mapped:', booking.room?.name);
  }

  // Map user data if available
  if (data.user && typeof data.user === 'object') {
    console.log('Attempting to map user...');
    const mappedUser = mapSupabaseUserToUser(data.user as Record<string, unknown>);
    if (mappedUser) {
      booking.user = mappedUser;
      console.log('User mapped:', mappedUser.firstName, mappedUser.lastName);
    } else {
      console.log('User mapping returned null');
    }
  } else {
    console.log('No user data in booking object');
  }
  
  console.log('Final booking.user:', booking.user);
  console.log('===========================\n');

  return booking;
}
