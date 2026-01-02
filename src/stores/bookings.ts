import { defineStore } from 'pinia';
import type { Booking, BookingStatus } from '@/types';
import { bookingService } from '@/services/bookingService';

interface BookingsState {
  bookings: Booking[];
  userBookings: Booking[];
  selectedBooking: Booking | null;
  loading: boolean;
  error: string | null;
}

// Helper to update booking in both arrays
const updateBookingInArrays = (arrays: { bookings: Booking[]; userBookings: Booking[] }, bookingId: string, updater: (b: Booking) => void) => {
  const bookingIdx = arrays.bookings.findIndex((b: Booking) => b.bookingId === bookingId);
  if (bookingIdx >= 0 && arrays.bookings[bookingIdx]) {
    updater(arrays.bookings[bookingIdx]!);
  }
  const userIdx = arrays.userBookings.findIndex((b: Booking) => b.bookingId === bookingId);
  if (userIdx >= 0 && arrays.userBookings[userIdx]) {
    updater(arrays.userBookings[userIdx]!);
  }
};

export const useBookingsStore = defineStore('booking', {
  state: (): BookingsState => ({
    bookings: [],
    userBookings: [],
    selectedBooking: null,
    loading: false,
    error: null,
  }),

  getters: {
    activeBookings: (state) =>
      state.bookings.filter((booking: Booking) => booking.status === 'active'),

    upcomingBookings: (state) =>
      state.userBookings.filter((booking: Booking) =>
        booking.status === 'reserved' && new Date(booking.startTime) > new Date()
      ),

    pastBookings: (state) =>
      state.userBookings.filter((booking: Booking) =>
        booking.status === 'completed' || new Date(booking.endTime) < new Date()
      ),
  },

  actions: {
    async createBooking(bookingData: Omit<Booking, 'bookingId' | 'createdAt'>) {
      this.loading = true;
      this.error = null;
      try {
        const newBooking = await bookingService.createBooking(bookingData);
        this.bookings.push(newBooking);
        this.userBookings.push(newBooking);
        return newBooking;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create booking';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchUserBookings(userId: string) {
      this.loading = true;
      this.error = null;
      try {
        const bookings = await bookingService.getBookingsByUser(userId);
        this.userBookings = bookings;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch bookings';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchRoomBookings(roomId: string) {
      this.loading = true;
      this.error = null;
      try {
        const bookings = await bookingService.getBookingsByRoom(roomId);
        return bookings;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch room bookings';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchAllBookings() {
      this.loading = true;
      this.error = null;
      try {
        // Fetch bookings for a wide date range to get all bookings (today + next 30 days)
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        const localMidnight = new Date(now.getTime() - (now.getTime() % 86400000) - tzOffset);
        const startOfDay = new Date(localMidnight.getTime());
        const endDate = new Date(startOfDay.getTime() + (30 * 86400000)); // 30 days from now

        const bookings = await bookingService.getBookingsByTimeRange(startOfDay, endDate);
        this.bookings = bookings;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch bookings';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async checkAvailability(roomId: string, startTime: Date, endTime: Date): Promise<boolean> {
      try {
        const hasConflict = await bookingService.hasBookingConflict(roomId, startTime, endTime);
        return !hasConflict; // Room is available if there's no conflict
      } catch (error) {
        console.error('Failed to check availability:', error);
        throw error;
      }
    },

    async cancelBooking(bookingId: string) {
      this.loading = true;
      this.error = null;
      try {
        await bookingService.cancelBooking(bookingId);
        updateBookingInArrays(this, bookingId, (b) => {
          b.status = 'cancelled' as BookingStatus;
        });
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to cancel booking';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async confirmEntry(bookingId: string, entryMethod: string) {
      this.loading = true;
      this.error = null;
      try {
        const updatedBooking = await bookingService.confirmEntry(bookingId, entryMethod);
        updateBookingInArrays(this, bookingId, (b) => {
          Object.assign(b, updatedBooking);
        });
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to confirm entry';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    selectBooking(booking: Booking | null) {
      this.selectedBooking = booking;
    },
  },
});
