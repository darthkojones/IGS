import { defineStore } from 'pinia';
import type { Booking, BookingStatus } from '@/types';

interface BookingsState {
  bookings: Booking[];
  userBookings: Booking[];
  selectedBooking: Booking | null;
  loading: boolean;
  error: string | null;
}

// Load bookings from localStorage
const loadBookingsFromStorage = (): Booking[] => {
  try {
    const stored = localStorage.getItem('igs-bookings');
    if (stored) {
      const bookings = JSON.parse(stored);
      // Convert date strings back to Date objects
      return bookings.map((b: any) => ({
        ...b,
        startTime: new Date(b.startTime),
        endTime: new Date(b.endTime),
        createdAt: new Date(b.createdAt),
        enteredAt: b.enteredAt ? new Date(b.enteredAt) : undefined,
      }));
    }
  } catch (error) {
    console.error('Failed to load bookings from storage:', error);
  }
  return [];
};

// Save bookings to localStorage
const saveBookingsToStorage = (bookings: Booking[]) => {
  try {
    localStorage.setItem('igs-bookings', JSON.stringify(bookings));
  } catch (error) {
    console.error('Failed to save bookings to storage:', error);
  }
};

export const useBookingsStore = defineStore('bookings', {
  state: (): BookingsState => ({
    bookings: loadBookingsFromStorage(),
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
    async createBooking(bookingData: Omit<Booking, 'bookingId' | 'createdAt' | 'status'>) {
      this.loading = true;
      try {
        // TODO: Implement API call
        const newBooking: Booking = {
          ...bookingData,
          bookingId: Date.now().toString(),
          status: 'reserved' as BookingStatus,
          createdAt: new Date(),
        };
        this.bookings.push(newBooking);
        this.userBookings.push(newBooking);
        saveBookingsToStorage(this.bookings);
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
      try {
        // TODO: Implement API call
        // For now, filter bookings by userId from the main bookings array
        this.userBookings = this.bookings.filter((b: Booking) => b.userId === userId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch bookings';
      } finally {
        this.loading = false;
      }
    },

    async cancelBooking(bookingId: string) {
      this.loading = true;
      try {
        // TODO: Implement API call
        const booking = this.bookings.find((b: Booking) => b.bookingId === bookingId);
        if (booking) {
          booking.status = 'cancelled' as BookingStatus;
          saveBookingsToStorage(this.bookings);
        }
        const userBooking = this.userBookings.find((b: Booking) => b.bookingId === bookingId);
        if (userBooking) {
          userBooking.status = 'cancelled' as BookingStatus;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to cancel booking';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async confirmEntry(bookingId: string, entryMethod: string) {
      // TODO: Implement entry confirmation logic
      const booking = this.bookings.find((b: Booking) => b.bookingId === bookingId);
      if (booking) {
        booking.status = 'active' as BookingStatus;
        booking.enteredAt = new Date();
      }
    },
  },
});
