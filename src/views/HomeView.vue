<template>
  <div class="home-view">
    <!-- Confirm Booking Section (shows when booking is within entry window) -->
    <div v-if="showActiveBooking" class="confirm-booking-section">
      <div class="confirm-booking-info">
        <p class="confirm-booking-text">
          ✓ Room {{ activeBooking?.roomId }} - Ready to Enter
        </p>
        <p class="confirm-booking-time">
          {{ formatBookingTime(activeBooking!) }}
        </p>
      </div>
      <div class="confirm-booking-actions">
        <button class="btn-check-in" @click="handleCheckIn">
          Check-In
        </button>
        <button class="btn-cancel" @click="handleCancelBooking">
          Cancel
        </button>
      </div>
    </div>

    <!-- Today's Bookings Section -->
    <section class="todays-bookings">
      <div class="section-header" @click="toggleBookingsExpanded">
        <h2>Todays bookings</h2>
        <span class="toggle-icon">{{ bookingsExpanded ? '▼' : '▶' }}</span>
      </div>
      <div v-show="bookingsExpanded" class="bookings-list">
        <router-link
          v-for="booking in todaysBookings"
          :key="booking.bookingId"
          :to="`/bookings/${booking.bookingId}`"
          :class="['booking-item', getBookingStatusClass(booking)]"
        >
          <div class="booking-content">
            <p class="booking-text">{{ formatBookingDisplay(booking) }}</p>
            <span :class="['booking-status-badge', getBookingStatusClass(booking)]">
              {{ getBookingStatusText(booking) }}
            </span>
          </div>
        </router-link>
        <div v-if="todaysBookings.length === 0" class="booking-item">
          <p>No bookings today</p>
        </div>
      </div>
    </section>

    <!-- Quick Access Section -->
    <section class="quick-access">
      <div class="quick-links">
        <QuickAccessTile
          v-for="tile in visibleTiles"
          :key="tile.to"
          :to="tile.to"
          :icon="tile.icon"
          :title="tile.title"
          :description="tile.description"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useBookingsStore } from '@/stores/bookings';
import QuickAccessTile from '@/components/QuickAccessTile.vue';
import type { Booking } from '@/types';

const authStore = useAuthStore();
const bookingsStore = useBookingsStore();

const todaysBookings = ref<Booking[]>([]);
const activeBooking = ref<Booking | null>(null);
const showActiveBooking = ref(false);
const bookingsExpanded = ref(true);

// Define available tiles
interface QuickAccessTileData {
  to: string;
  icon: string;
  title: string;
  description?: string;
  requiresAdmin?: boolean;
}

const allTiles: QuickAccessTileData[] = [
  {
    to: '/rooms',
    icon: '🔍',
    title: 'Find a Room'
  },
  {
    to: '/bookings',
    icon: '📋',
    title: 'My Bookings'
  },
  {
    to: '/accessibility',
    icon: '⚙️',
    title: 'Accessibility'
  },
  {
    to: '/statistics',
    icon: '📊',
    title: 'Statistics',
    description: 'Track room usage, peak hours, and booking patterns with comprehensive analytics',
    requiresAdmin: true
  }
];

// Filter tiles based on user role
const visibleTiles = computed(() => {
  return allTiles.filter(tile => {
    if (tile.requiresAdmin) {
      return authStore.isAdmin;
    }
    return true;
  });
});

// Toggle bookings section
const toggleBookingsExpanded = () => {
  bookingsExpanded.value = !bookingsExpanded.value;
};

// Handle check-in (no functionality yet)
const handleCheckIn = () => {
  console.log('Check-in clicked for booking:', activeBooking.value?.bookingId);
  // Placeholder for future check-in functionality
};

// Handle cancel booking with confirmation
const handleCancelBooking = () => {
  if (!activeBooking.value) return;

  const confirmed = confirm(
    `Are you sure you want to cancel your booking for Room ${activeBooking.value.roomId}?`
  );

  if (confirmed) {
    console.log('Booking cancelled:', activeBooking.value.bookingId);
    // Placeholder for future cancel functionality
  }
};

// Format booking for display
const formatBookingDisplay = (booking: Booking) => {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  return `Booking ${booking.roomId ? `Room ${booking.roomId}` : ''} Today - ${formatTime(start)} to ${formatTime(end)}`;
};

// Get booking status class for styling
const getBookingStatusClass = (booking: Booking) => {
  const now = new Date();
  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);

  // Expired: past end time or status is expired
  if (now > endTime || booking.status === 'expired' || booking.status === 'cancelled') {
    return 'status-expired';
  }

  // Confirmed/Active: status is confirmed or active (user has entered)
  if (booking.status === 'confirmed' || booking.status === 'active') {
    return 'status-confirmed';
  }

  // Pending: reserved but not yet confirmed (even if in time slot)
  if (booking.status === 'reserved') {
    return 'status-pending';
  }

  return 'status-pending'; // Default to pending
};

// Get booking status text for badge
const getBookingStatusText = (booking: Booking) => {
  const now = new Date();
  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);

  if (now > endTime || booking.status === 'expired') {
    return 'Expired';
  }

  if (booking.status === 'cancelled') {
    return 'Cancelled';
  }

  if (booking.status === 'confirmed' || booking.status === 'active') {
    return 'Confirmed';
  }

  if (booking.status === 'reserved') {
    return 'Pending';
  }

  return 'Pending';
};

// Format booking time for active banner
const formatBookingTime = (booking: Booking) => {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  return `${formatTime(start)} - ${formatTime(end)}`;
};

// Check if booking is within active window (-10 minutes to +9 minutes from start)
const checkActiveBooking = () => {
  if (!authStore.user) return;

  const now = new Date();
  const tenMinutesBefore = 10 * 60 * 1000;
  const nineMinutesAfter = 9 * 60 * 1000;

  console.log('=== Checking Active Booking ===');
  console.log('Current time:', now.toLocaleString());
  console.log('Total bookings to check:', todaysBookings.value.length);

  todaysBookings.value.forEach((booking, index) => {
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const timeDiff = startTime.getTime() - now.getTime();
    const minutesDiff = Math.round(timeDiff / 60000);

    console.log(`\nBooking ${index + 1}:`, {
      roomId: booking.roomId,
      status: booking.status,
      startTime: startTime.toLocaleString(),
      endTime: endTime.toLocaleString(),
      minutesUntilStart: minutesDiff,
      isInWindow: timeDiff <= tenMinutesBefore && timeDiff >= -nineMinutesAfter,
      isReserved: booking.status === 'reserved',
      isPast: now > endTime,
      isOngoing: now >= startTime && now <= endTime,
      isUpcoming: now < startTime
    });
  });

  const nearbyBooking = todaysBookings.value.find(booking => {
    const startTime = new Date(booking.startTime);
    const timeDiff = startTime.getTime() - now.getTime();
    // Show if current time is between -10 minutes and +9 minutes from booking start
    return timeDiff <= tenMinutesBefore && timeDiff >= -nineMinutesAfter && booking.status === 'reserved';
  });

  if (nearbyBooking) {
    console.log('✓ Active booking found:', nearbyBooking.roomId);
    activeBooking.value = nearbyBooking;
    showActiveBooking.value = true;
  } else {
    console.log('✗ No active booking in window');
    showActiveBooking.value = false;
    activeBooking.value = null;
  }
  console.log('=========================\n');
};

// Fetch today's bookings for the current user
const fetchTodaysBookings = async () => {
  if (!authStore.user) return;

  try {
    await bookingsStore.fetchUserBookings(authStore.user.userId);

    // Filter for today's bookings
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    console.log('=== Fetching Today\'s Bookings ===');
    console.log('Start of day:', startOfDay.toLocaleString());
    console.log('End of day:', endOfDay.toLocaleString());
    console.log('Total user bookings:', bookingsStore.userBookings.length);

    todaysBookings.value = bookingsStore.userBookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate >= startOfDay && bookingDate < endOfDay;
    });

    console.log('Filtered today\'s bookings:', todaysBookings.value.length);
    console.log('=================================\n');

    checkActiveBooking();
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
  }
};

let intervalId: number | null = null;

onMounted(() => {
  fetchTodaysBookings();
  // Refresh bookings and check active booking window every 30 seconds
  intervalId = window.setInterval(() => {
    fetchTodaysBookings();
  }, 30000);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>


<style scoped>
.home-view {
  min-height: 100vh;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Confirm Booking Section */
.confirm-booking-section {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.confirm-booking-info {
  text-align: center;
  margin-bottom: 1.5rem;
}

.confirm-booking-text {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.confirm-booking-time {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.95;
  font-weight: 500;
}

.confirm-booking-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.confirm-booking-actions button {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-check-in {
  background: white;
  color: #4caf50;
}

.btn-check-in:hover {
  background: #f1f1f1;
  transform: translateY(-1px);
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* Today's Bookings Section */
.todays-bookings {
  margin-bottom: 3rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  margin-bottom: 1.5rem;
}

.section-header:hover h2 {
  color: #1976d2;
}

.todays-bookings h2 {
  font-size: 2rem;
  margin: 0;
  color: #333;
  transition: color 0.2s ease;
}

.toggle-icon {
  font-size: 1.5rem;
  color: #666;
  transition: color 0.2s ease;
}

.section-header:hover .toggle-icon {
  color: #1976d2;
}

.bookings-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.booking-item {
  display: block;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

/* Status-based styling */
.booking-item.status-expired {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  border-color: #ef5350;
}

.booking-item.status-pending {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  border-color: #ffa726;
}

.booking-item.status-confirmed {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-color: #66bb6a;
}

.booking-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.booking-item.status-expired:hover {
  border-color: #e53935;
}

.booking-item.status-pending:hover {
  border-color: #ff9800;
}

.booking-item.status-confirmed:hover {
  border-color: #4caf50;
}

.booking-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.booking-text {
  margin: 0;
  font-size: 1.125rem;
  color: #333;
  flex: 1;
}

.booking-status-badge {
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.booking-status-badge.status-expired {
  background: #ef5350;
  color: white;
}

.booking-status-badge.status-pending {
  background: #ffa726;
  color: white;
}

.booking-status-badge.status-confirmed {
  background: #66bb6a;
  color: white;
}

/* Quick Access Section */
.quick-access {
  margin-top: 3rem;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .home-view {
    padding: 1rem;
  }

  .todays-bookings h2 {
    font-size: 1.5rem;
  }

  .quick-links {
    grid-template-columns: 1fr;
  }

  .confirm-booking-text {
    font-size: 1.125rem;
  }

  .confirm-booking-time {
    font-size: 0.95rem;
  }

  .confirm-booking-actions {
    flex-direction: column;
  }

  .confirm-booking-actions button {
    width: 100%;
  }
}
</style>
