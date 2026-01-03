import { ref, computed, onMounted, onUnmounted } from 'vue';
import { bookingService } from '@/services/bookingService';
import { formatDuration, getTimeRemaining } from '@/utils/timeFormat';
import type { Booking } from '@/types';

type RoomStatusType = 'available' | 'reserved' | 'occupied';

export function useRoomStatus(roomId: string, currentBooking?: Booking) {
  const status = ref<RoomStatusType>('available');
  const lastUpdated = ref<Date>(new Date());
  const nextBooking = ref<Booking | null>(null);
  const activeBooking = ref<Booking | null>(currentBooking || null);

  const statusColor = computed(() => {
    switch (status.value) {
      case 'available':
        return 'green';
      case 'reserved':
        return 'yellow';
      case 'occupied':
        return 'red';
      default:
        return 'gray';
    }
  });

  const statusText = computed(() => {
    switch (status.value) {
      case 'available':
        return 'Available';
      case 'reserved':
        return 'Reserved';
      case 'occupied':
        return 'Occupied';
      default:
        return 'Unknown';
    }
  });

  /**
   * Get human-readable time remaining for availability or booking
   */
  const timeRemainingText = computed(() => {
    const now = new Date();

    // If room is occupied or reserved, show how long it's booked for
    if (activeBooking.value) {
      const endTime = new Date(activeBooking.value.endTime);
      const remaining = getTimeRemaining(endTime);

      if (remaining > 0) {
        return `Booked for ${formatDuration(remaining)}`;
      }
    }

    // If room is available, show how long until next booking (only if booking is TODAY)
    if (nextBooking.value && status.value === 'available') {
      const startTime = new Date(nextBooking.value.startTime);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const bookingDate = new Date(startTime);
      bookingDate.setHours(0, 0, 0, 0);

      // Only show time remaining if next booking is TODAY
      if (bookingDate.getTime() === today.getTime()) {
        const remaining = getTimeRemaining(startTime);
        if (remaining > 0) {
          return `Available for ${formatDuration(remaining)}`;
        }
      }
    }

    // Room is available (no upcoming bookings today)
    if (status.value === 'available') {
      return 'Available';
    }

    return null;
  });

  /**
   * Get time remaining in milliseconds
   */
  const timeRemainingMs = computed(() => {
    const now = new Date();

    if (activeBooking.value) {
      const endTime = new Date(activeBooking.value.endTime);
      return getTimeRemaining(endTime);
    }

    if (nextBooking.value && status.value === 'available') {
      const startTime = new Date(nextBooking.value.startTime);
      return getTimeRemaining(startTime);
    }

    return 0;
  });

  /**
   * Check if room has a booking that overlaps with current time
   */
  const checkRoomStatus = async () => {
    try {
      // Check if there's an active booking with confirmed entry for right now
      const isOccupied = await bookingService.isRoomOccupied(roomId);
      status.value = isOccupied ? 'occupied' : 'available';
      lastUpdated.value = new Date();

      // Fetch upcoming bookings to determine next booking
      const bookings = await bookingService.getBookingsByRoom(roomId);
      const now = new Date();

      // Find current active booking
      activeBooking.value = bookings.find(b => {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        return now >= start && now < end;
      }) || null;

      // Find next upcoming booking
      nextBooking.value = bookings
        .filter(b => new Date(b.startTime) > now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0] || null;

    } catch (error) {
      console.error('Failed to check room status:', error);
    }
  };

  // Check status when composable is mounted and periodically refresh
  onMounted(() => {
    checkRoomStatus();
    // Refresh every 30 seconds
    const interval = setInterval(checkRoomStatus, 30000);

    onUnmounted(() => {
      clearInterval(interval);
    });
  });

  return {
    status,
    statusColor,
    statusText,
    timeRemainingText,
    timeRemainingMs,
    lastUpdated,
    checkRoomStatus,
    activeBooking,
    nextBooking,
  };
}
