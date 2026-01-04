import { defineStore } from 'pinia';
import type { Statistics, Booking } from '@/types';
import { useBookingsStore } from './bookings';
import { bookingService } from '@/services/bookingService';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface StatisticsState {
  overallStatistics: Statistics | null;
  adminStatistics: {
    totalBookings: number;
    occupancyRate: number;
    noShowRate: number;
    bookingsPerDay: Map<string, number>;
    peakHours: Array<{ hour: number; count: number }>;
    popularRooms: Array<{ roomId: string; roomName: string; usageFrequency: number }>;
  } | null;
  loading: boolean;
  error: string | null;
  realtimeSubscription: RealtimeChannel | null;
}

export const useStatisticsStore = defineStore('statistics', {
  state: (): StatisticsState => ({
    overallStatistics: null,
    adminStatistics: null,
    loading: false,
    error: null,
    realtimeSubscription: null,
  }),

  actions: {
    /**
     * Calculate total bookings
     */
    calculateTotalBookings(bookings: Booking[]): number {
      return bookings.length;
    },

    /**
     * Calculate occupancy rate (percentage of completed bookings)
     */
    calculateOccupancyRate(bookings: Booking[]): number {
      if (bookings.length === 0) return 0;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;
      return Math.round((completedBookings / bookings.length) * 1000) / 10;
    },

    /**
     * Calculate no-show rate (expired bookings / non-cancelled bookings)
     */
    calculateNoShowRate(bookings: Booking[]): number {
      const nonCancelledBookings = bookings.filter(b => b.status !== 'cancelled');
      if (nonCancelledBookings.length === 0) return 0;
      const expiredBookings = bookings.filter(b => b.status === 'expired').length;
      return Math.round((expiredBookings / nonCancelledBookings.length) * 1000) / 10;
    },

    /**
     * Calculate bookings per day
     */
    calculateBookingsPerDay(bookings: Booking[]): Map<string, number> {
      const perDay = new Map<string, number>();
      bookings.forEach(booking => {
        const date = new Date(booking.startTime);
        const dateString = date.toISOString().split('T')[0] || '';
        perDay.set(dateString, (perDay.get(dateString) || 0) + 1);
      });
      return perDay;
    },

    /**
     * Calculate peak booking hours
     */
    calculatePeakHours(bookings: Booking[]): Array<{ hour: number; count: number }> {
      const hourCounts = new Map<number, number>();
      bookings.forEach(booking => {
        const startTime = new Date(booking.startTime);
        const hour = startTime.getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      });
      const peakHours = Array.from(hourCounts.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => b.count - a.count);
      return peakHours;
    },

    /**
     * Calculate popular rooms (by usage frequency)
     */
    calculatePopularRooms(bookings: Booking[]): Array<{ roomId: string; roomName: string; usageFrequency: number }> {
      const roomUsage = new Map<string, { name: string; count: number }>();
      bookings.forEach(booking => {
        const roomId = booking.roomId;
        const roomName = booking.room?.name || roomId;
        const current = roomUsage.get(roomId) || { name: roomName, count: 0 };
        roomUsage.set(roomId, { name: current.name, count: current.count + 1 });
      });
      const popular = Array.from(roomUsage.entries())
        .map(([roomId, data]) => ({ roomId, roomName: data.name, usageFrequency: data.count }))
        .sort((a, b) => b.usageFrequency - a.usageFrequency);
      return popular;
    },

    /**
     * Fetch admin statistics (all bookings in system)
     */
    async fetchAdminStatistics() {
      this.loading = true;
      try {
        // Fetch ALL bookings from the system (not user-specific)
        // Get a wide date range to fetch all historical bookings
        const startOfTime = new Date('2020-01-01');
        const endOfTime = new Date('2099-12-31');
        const allBookings = await bookingService.getBookingsByTimeRange(startOfTime, endOfTime);

        // Calculate all metrics
        const totalBookings = this.calculateTotalBookings(allBookings);
        const occupancyRate = this.calculateOccupancyRate(allBookings);
        const noShowRate = this.calculateNoShowRate(allBookings);
        const bookingsPerDay = this.calculateBookingsPerDay(allBookings);
        const peakHours = this.calculatePeakHours(allBookings);
        const popularRooms = this.calculatePopularRooms(allBookings);

        this.adminStatistics = {
          totalBookings,
          occupancyRate,
          noShowRate,
          bookingsPerDay,
          peakHours,
          popularRooms,
        };

        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch admin statistics';
      } finally {
        this.loading = false;
      }
    },


    /**
     * Subscribe to real-time booking changes and auto-update admin statistics
     */
    async subscribeToRealtimeAdminStatistics() {
      // Subscribe to all changes in the booking table
      this.realtimeSubscription = supabase
        .channel('booking-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'booking',
          },
          async (payload) => {
            console.log('Booking change detected, updating admin statistics:', payload.eventType);
            // Refetch statistics when a booking changes
            await this.fetchAdminStatistics();
          }
        )
        .subscribe();
    },

    /**
     * Unsubscribe from real-time updates
     */
    async unsubscribeFromRealtimeAdminStatistics() {
      if (this.realtimeSubscription) {
        await supabase.removeChannel(this.realtimeSubscription as RealtimeChannel);
        this.realtimeSubscription = null;
      }
    },

    /**
     * Fetch overall statistics for the current user
     */
    async fetchOverallStatistics() {
      this.loading = true;
      try {
        const bookingsStore = useBookingsStore();

        // Ensure bookings are loaded
        if (bookingsStore.userBookings.length === 0) {
          await bookingsStore.fetchAllBookings();
        }

        const bookings = bookingsStore.userBookings;
        const completedBookings = bookings.filter(b => b.status === 'completed');

        // Calculate average occupancy time (duration in hours)
        const totalDuration = completedBookings.reduce((sum, booking) => {
          const start = new Date(booking.startTime);
          const end = new Date(booking.endTime);
          const durationMs = end.getTime() - start.getTime();
          const durationHours = durationMs / (1000 * 60 * 60);
          return sum + durationHours;
        }, 0);

        const averageOccupancyTime = completedBookings.length > 0
          ? totalDuration / completedBookings.length
          : 0;

        // Calculate no-show rate
        // No-show = expired bookings / all non-cancelled bookings
        const nonCancelledBookings = bookings.filter(b => b.status !== 'cancelled');
        const expiredBookings = bookings.filter(b => b.status === 'expired');
        const noShowRate = nonCancelledBookings.length > 0
          ? (expiredBookings.length / nonCancelledBookings.length) * 100
          : 0;

        this.overallStatistics = {
          usageFrequency: bookings.length,
          averageOccupancyTime: Math.round(averageOccupancyTime * 10) / 10,
          totalBookings: nonCancelledBookings.length,
          noShowRate: Math.round(noShowRate * 10) / 10,
          peakHours: [],
        };

        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch statistics';
      } finally {
        this.loading = false;
      }
    },
  },
});
