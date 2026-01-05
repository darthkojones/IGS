import type { Booking, BookingStatus, EntryMethod } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { mapBookingData } from '@/mappers/bookingMapper';

// Constants
const ROOM_SELECT = `*,
  room:room_id (
    room_id,
    name,
    floor,
    capacity,
    building_id
  )`;

const toNumericId = (id: string): number => parseInt(id, 10);

export const bookingService = {
  async getBookingsByRoom(roomId: string): Promise<Booking[]> {
    try {
      const { data, error } = await supabase
        .from('booking')
        .select(ROOM_SELECT)
        .eq('room_id', roomId)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Supabase error fetching bookings by room:', error);
        throw error;
      }

      return (data || []).map(mapBookingData);
    } catch (err) {
      console.error('bookingService.getBookingsByRoom error:', err);
      throw err;
    }
  },

  /**
   * Fetch all bookings for a given user
   */
  async getBookingsByUser(userId: string): Promise<Booking[]> {
    try {
      const { data, error } = await supabase
        .from('booking')
        .select(ROOM_SELECT)
        .eq('user_id', userId)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Supabase error fetching bookings by user:', error);
        throw error;
      }

      const mappedBookings = (data || []).map(mapBookingData);

      // Auto-expire bookings: only RESERVED bookings can expire (not confirmed)
      // Expire if: reserved status, start_time has passed, and not yet entered
      const now = new Date();
      const toExpire = mappedBookings.filter(
        (booking) =>
          booking.status === 'reserved' &&
          !booking.enteredAt &&
          !booking.entryMethod &&
          new Date(booking.startTime) < now
      );

      if (toExpire.length > 0) {
        const expiredIds = new Set(toExpire.map(b => b.bookingId));
        // Update these bookings in the database
        await Promise.all(
          toExpire.map((booking) =>
            supabase
              .from('booking')
              .update({ status: 'expired' })
              .eq('id', toNumericId(booking.bookingId))
          )
        );
        // Update the local status
        mappedBookings.forEach((booking) => {
          if (expiredIds.has(booking.bookingId)) {
            booking.status = 'expired' as BookingStatus;
          }
        });
      }

      return mappedBookings;
    } catch (err) {
      console.error('bookingService.getBookingsByUser error:', err);
      throw err;
    }
  },

  /**
   * Check if a room is currently occupied (user has entered the booking)
   * Used to display room occupancy status
   */
  async isRoomOccupied(roomId: string): Promise<boolean> {
    try {
      const now = new Date();

      // Get bookings that are active AND have been entered (currently occupying the room)
      const { data, error } = await supabase
        .from('booking')
        .select('*')
        .eq('room_id', roomId)
        .in('status', ['confirmed', 'active'])
        .lte('start_time', now.toISOString())
        .gte('end_time', now.toISOString())
        .not('entry_method', 'is', null)
        .not('entered_at', 'is', null);

      if (error) {
        console.error('Supabase error checking room occupancy:', error);
        throw error;
      }

      return (data || []).length > 0;
    } catch (err) {
      console.error('bookingService.isRoomOccupied error:', err);
      throw err;
    }
  },

  /**
   * Check if a room has a booking overlap with a given time range
   * Returns true if there's any confirmed/active/reserved booking that overlaps (regardless of entry status)
   * Used for booking availability - prevents double-booking
   * Includes a 5-minute buffer before and after the requested time
   *
   * Conflict detection logic (adapted from your SQL requirement):
   * - (existing.start_time - 5min) <= new.start_time <= existing.end_time, OR
   * - (existing.start_time - 5min) <= new.end_time <= existing.end_time, OR
   * - new.start_time <= existing.start_time AND existing.end_time <= new.end_time (new contains existing)
   */
  async hasBookingConflict(
    roomId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    try {
      // Add 5-minute buffer (300000 ms)
      //const BUFFER_MS = 5 * 60 * 1000;
      const BUFFER_MS = 0;
      const bufferedStart = new Date(new Date(startTime).getTime() - BUFFER_MS);
      const bufferedEnd = new Date(new Date(endTime).getTime() + BUFFER_MS);

      // Get bookings for the room that could potentially conflict
      // Only fetch bookings where:
      // (start_time - 5min <= new.start <= end_time) OR
      // (start_time - 5min <= new.end <= end_time)
      // This is achieved by checking: start_time < bufferedEnd AND end_time > bufferedStart
      const { data, error } = await supabase
        .from('booking')
        .select('*')
        .eq('room_id', roomId)
        .in('status', ['reserved', 'confirmed', 'active'])
        .lt('start_time', bufferedEnd.toISOString())
        .gt('end_time', bufferedStart.toISOString());

      if (error) {
        console.error('Supabase error checking booking conflict:', error);
        throw error;
      }

      // If any bookings match the filter, there's a conflict
      return (data || []).length > 0;
    } catch (err) {
      console.error('bookingService.hasBookingConflict error:', err);
      throw err;
    }
  },

  /**
   * Get all bookings that overlap with a given time range
   */
  async getBookingsByTimeRange(
    startTime: Date,
    endTime: Date
  ): Promise<Booking[]> {
    try {
      const { data, error } = await supabase
        .from('booking')
        .select(`${ROOM_SELECT},
          user:user_id (
            id,
            first_name,
            last_name,
            email,
            role
          )`)
        .or(
          `and(start_time.lt.${endTime.toISOString()},end_time.gt.${startTime.toISOString()})`
        )
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Supabase error fetching bookings by time range:', error);
        throw error;
      }

      return (data || []).map(mapBookingData);
    } catch (err) {
      console.error('bookingService.getBookingsByTimeRange error:', err);
      throw err;
    }
  },

  /**
   * Create a new booking
   */
  async createBooking(booking: Omit<Booking, 'bookingId' | 'createdAt'>): Promise<Booking> {
    try {
      // Check for conflicts before creating
      const hasConflict = await this.hasBookingConflict(booking.roomId, booking.startTime, booking.endTime);
      if (hasConflict) {
        throw new Error('Room is not available for the requested time slot');
      }

      const { data, error } = await supabase
        .from('booking')
        .insert({
          room_id: booking.roomId,
          user_id: booking.userId,
          start_time: booking.startTime.toISOString(),
          end_time: booking.endTime.toISOString(),
          title: booking.title,
          status: booking.status || 'reserved',
          entry_method: booking.entryMethod,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating booking:', error);
        throw error;
      }

      return mapBookingData(data);
    } catch (err) {
      console.error('bookingService.createBooking error:', err);
      throw err;
    }
  },

  // update booking
  async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking> {
    try {
      const bookingIdNumeric = toNumericId(bookingId);
      const updateData: Record<string, unknown> = {};

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.startTime !== undefined)
        updateData.start_time = updates.startTime.toISOString();
      if (updates.endTime !== undefined) updateData.end_time = updates.endTime.toISOString();
      if (updates.entryMethod !== undefined) updateData.entry_method = updates.entryMethod;
      if (updates.enteredAt !== undefined)
        updateData.entered_at = updates.enteredAt.toISOString();

      const { data, error } = await supabase
        .from('booking')
        .update(updateData)
        .eq('id', bookingIdNumeric)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating booking:', error);
        throw error;
      }

      return mapBookingData(data);
    } catch (err) {
      console.error('bookingService.updateBooking error:', err);
      throw err;
    }
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string): Promise<void> {
    try {
      const bookingIdNumeric = toNumericId(bookingId);
      const { error } = await supabase
        .from('booking')
        .update({ status: 'cancelled' })
        .eq('id', bookingIdNumeric);

      if (error) {
        console.error('Supabase error cancelling booking:', error);
        throw error;
      }
    } catch (err) {
      console.error('bookingService.cancelBooking error:', err);
      throw err;
    }
  },

  /**
   * Delete a booking
   */
  async deleteBooking(bookingId: string): Promise<void> {
    try {
      const bookingIdNumeric = toNumericId(bookingId);
      const { error } = await supabase
        .from('booking')
        .delete()
        .eq('id', bookingIdNumeric);

      if (error) {
        console.error('Supabase error deleting booking:', error);
        throw error;
      }
    } catch (err) {
      console.error('bookingService.deleteBooking error:', err);
      throw err;
    }
  },

  /**
   * Confirm entry for a booking
   */
  async confirmEntry(bookingId: string, entryMethod: string): Promise<Booking> {
    try {
      const bookingIdNumeric = toNumericId(bookingId);

      // Update the booking
      const updatePayload = {
        status: 'active',
        entry_method: entryMethod,
        entered_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('booking')
        .update(updatePayload)
        .eq('id', bookingIdNumeric);

      if (error) {
        console.error('Supabase error updating booking:', error);
        throw error;
      }

      // Wait a moment for the database to sync
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch the updated booking separately
      const { data, error: fetchError } = await supabase
        .from('booking')
        .select('*')
        .eq('id', bookingIdNumeric)
        .single();

      if (fetchError) {
        // Even if fetch fails, the update succeeded, so construct the booking from what we know
        return {
          bookingId: bookingId,
          roomId: '',
          userId: '',
          startTime: new Date(),
          endTime: new Date(),
          title: '',
          status: 'active' as BookingStatus,
          entryMethod: entryMethod as EntryMethod,
          enteredAt: new Date(),
          createdAt: new Date(),
        };
      }

      return mapBookingData(data);
    } catch (err) {
      console.error('bookingService.confirmEntry error:', err);
      throw err;
    }
  },

  /**
   * Update booking statuses based on current time and booking rules:
   * - reserved → expired if start_time has passed
   * - confirmed → expired if start_time has passed
   * - active → completed if end_time has passed
   * - cancelled → remains cancelled (no change)
   * - expired → remains expired (no change)
   * - completed → remains completed (no change)
   */
  async updateExpiredBookings(bookings: Booking[]): Promise<Booking[]> {
    try {
      const now = new Date();
      const updatesToMake: Array<{ booking: Booking; newStatus: string }> = [];

      // Determine which bookings need status updates
      bookings.forEach((booking) => {
        const startTime = new Date(booking.startTime);
        const endTime = new Date(booking.endTime);

        // Skip if already in final states
        if (booking.status === 'cancelled' || booking.status === 'expired' || booking.status === 'completed') {
          return;
        }

        // If active and end time has passed → complete
        if (booking.status === 'active' && endTime < now) {
          updatesToMake.push({ booking, newStatus: 'completed' });
        }
        // If reserved or confirmed and start time has passed → expire
        else if ((booking.status === 'reserved' || booking.status === 'confirmed') && startTime < now) {
          updatesToMake.push({ booking, newStatus: 'expired' });
        }
      });

      if (updatesToMake.length === 0) {
        return bookings;
      }

      // this will need to be implemented another way.

      // Update each booking that needs a status change
      const updatedBookings = await Promise.all(
        updatesToMake.map(({ booking, newStatus }) =>
          supabase
            .from('booking')
            .update({ status: newStatus })
            .eq('id', parseInt(booking.bookingId, 10))
            .select()
            .then(({ data, error }) => {
              if (error) {
                console.warn(`Failed to update booking ${booking.bookingId}:`, error);
                return booking;
              }
              if (!data || data.length === 0) {
                console.warn(`No data returned for booking ${booking.bookingId}`);
                return booking;
              }
              return mapBookingData(data[0]);
            })
        )
      );

      // Return the merged list with updated bookings
      return bookings.map((booking) => {
        const updated = updatedBookings.find((b) => b.bookingId === booking.bookingId);
        return updated || booking;
      });
    } catch (err) {
      console.error('bookingService.updateExpiredBookings error:', err);
      throw err;
    }
  },

  /**
   * Fetch building data by ID
   */
  async getBuildingById(buildingId: string) {
    try {
      const { data, error } = await supabase
        .from('building')
        .select('id, name')
        .eq('id', buildingId)
        .single();

      if (error) {
        console.error('Supabase error fetching building:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('bookingService.getBuildingById error:', err);
      return null;
    }
  },
};
