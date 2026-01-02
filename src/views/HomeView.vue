<template>
  <div class="home-view">
    <!-- Active Booking Banner (shows when booking is within entry window) -->
    <div v-if="showActiveBooking" class="active-booking-banner">
      <div class="banner-content">
        <div class="banner-info">
          <p class="active-booking-text">
            ✓ Room {{ activeBooking?.roomId }} - Ready to Enter
          </p>
          <p class="active-booking-time">
            {{ formatBookingTime(activeBooking!) }}
          </p>
        </div>
        <div class="banner-actions">
          <button
            @click="handleCheckIn"
            class="btn btn-check-in"
            :disabled="checkingIn"
          >
            {{ checkingIn ? 'Checking in...' : 'Check In' }}
          </button>
          <button
            @click="handleCancelBooking"
            class="btn btn-cancel"
            :disabled="cancelling"
          >
            {{ cancelling ? 'Cancelling...' : 'Cancel' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Upcoming Bookings Section -->
    <section class="upcoming-bookings">
      <div class="section-header" @click="toggleBookingsList">
        <h2>Next 5 Bookings</h2>
        <button class="toggle-btn" :aria-expanded="isBookingsExpanded">
          {{ isBookingsExpanded ? '▼' : '▶' }}
        </button>
      </div>
      <div v-if="isBookingsExpanded" class="bookings-list">
        <router-link
          v-for="booking in upcomingBookings"
          :key="booking.bookingId"
          :to="`/bookings/${booking.bookingId}`"
          :class="['booking-item', getBookingStatusClass(booking)]"
        >
          <div class="booking-content">
            <p class="booking-text">{{ formatBookingDisplayWithDate(booking) }}</p>
            <span :class="['booking-status-badge', getBookingStatusClass(booking)]">
              {{ getBookingStatusText(booking) }}
            </span>
          </div>
        </router-link>
        <div v-if="upcomingBookings.length === 0" class="booking-item">
          <p>No upcoming bookings</p>
        </div>
      </div>
    </section>

    <!-- Quick Access Section -->
    <section class="quick-access">
      <div class="quick-links">
        <QuickAccessTile
          to="/rooms"
          icon="🔍"
          title="Find a Room"
        />
        <QuickAccessTile
          to="/bookings"
          icon="📋"
          title="My Bookings"
        />
        <QuickAccessTile
          to="/accessibility"
          icon="⚙️"
          title="Accessibility"
        />
        <QuickAccessTile
          v-if="authStore.isAdmin"
          to="/statistics"
          icon="📊"
          title="Statistics"
          description="Track room usage, peak hours, and booking patterns with comprehensive analytics"
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

const upcomingBookings = ref<Booking[]>([]);
const activeBooking = ref<Booking | null>(null);
const showActiveBooking = ref(false);
const checkingIn = ref(false);
const cancelling = ref(false);
const isBookingsExpanded = ref(true);

// Format booking for display
const formatBookingDisplay = (booking: Booking) => {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  return `Booking ${booking.roomId ? `Room ${booking.roomId}` : ''} Today - ${formatTime(start)} to ${formatTime(end)}`;
};

// Format booking with date for upcoming bookings
const formatBookingDisplayWithDate = (booking: Booking) => {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const bookingDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  let dateLabel = '';
  const diffDays = Math.floor((bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    dateLabel = 'Today';
  } else if (diffDays === 1) {
    dateLabel = 'Tomorrow';
  } else {
    dateLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return `Room ${booking.roomId} - ${dateLabel} ${formatTime(start)} to ${formatTime(end)}`;
};

// Toggle bookings list expansion
const toggleBookingsList = () => {
  isBookingsExpanded.value = !isBookingsExpanded.value;
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
  console.log('Total bookings to check:', upcomingBookings.value.length);

  upcomingBookings.value.forEach((booking, index) => {
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

  const nearbyBooking = upcomingBookings.value.find(booking => {
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

// Fetch upcoming bookings for the current user (next 5 from today onwards)
const fetchUpcomingBookings = async () => {
  if (!authStore.user) return;

  try {
    await bookingsStore.fetchUserBookings(authStore.user.userId);

    const now = new Date();

    console.log('=== Fetching Upcoming Bookings ===');
    console.log('Current time:', now.toLocaleString());
    console.log('Total user bookings:', bookingsStore.userBookings.length);

    // Get bookings from NOW onwards (not just start of today), sorted by start time
    const futureBookings = bookingsStore.userBookings
      .filter(booking => {
        const bookingStartTime = new Date(booking.startTime);
        // Only include bookings that haven't started yet OR are currently ongoing
        return bookingStartTime >= now || (bookingStartTime <= now && new Date(booking.endTime) >= now);
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5); // Limit to next 5 bookings

    upcomingBookings.value = futureBookings;

    console.log('Filtered upcoming bookings:', upcomingBookings.value.length);
    console.log('=================================\n');

    checkActiveBooking();
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
  }
};

// Handle check-in
const handleCheckIn = async () => {
  if (!activeBooking.value) return;

  checkingIn.value = true;
  try {
    await bookingsStore.confirmEntry(activeBooking.value.bookingId, 'manual');
    alert('Successfully checked in!');
    await fetchUpcomingBookings();
  } catch (error) {
    console.error('Check-in failed:', error);
    alert('Failed to check in. Please try again.');
  } finally {
    checkingIn.value = false;
  }
};

// Handle cancel booking
const handleCancelBooking = async () => {
  if (!activeBooking.value) return;

  const confirmCancel = confirm('Are you sure you want to cancel this booking?');
  if (!confirmCancel) return;

  cancelling.value = true;
  try {
    await bookingsStore.cancelBooking(activeBooking.value.bookingId);
    alert('Booking cancelled successfully.');
    await fetchUpcomingBookings();
  } catch (error) {
    console.error('Cancellation failed:', error);
    alert('Failed to cancel booking. Please try again.');
  } finally {
    cancelling.value = false;
  }
};

let intervalId: number | null = null;

onMounted(() => {
  fetchUpcomingBookings();
  // Refresh bookings and check active booking window every 30 seconds
  intervalId = window.setInterval(() => {
    fetchUpcomingBookings();
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

/* Active Booking Banner */
.active-booking-banner {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.banner-info {
  flex: 1;
  min-width: 250px;
}

.banner-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.active-booking-banner .btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-check-in {
  background: white;
  color: #4caf50;
}

.btn-check-in:hover:not(:disabled) {
  background: #f1f8f4;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
}

.btn-cancel:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.active-booking-text {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.active-booking-time {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.95;
  font-weight: 500;
}

/* Upcoming Bookings Section */
.upcoming-bookings {
  margin-bottom: 3rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem 0;
  user-select: none;
}

.section-header:hover h2 {
  color: #1976d2;
}

.section-header h2 {
  font-size: 2rem;
  margin: 0;
  color: #333;
  transition: color 0.3s ease;
}

.toggle-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  transition: transform 0.3s ease, color 0.3s ease;
}

.toggle-btn:hover {
  color: #1976d2;
  transform: scale(1.1);
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

  .section-header h2 {
    font-size: 1.5rem;
  }

  .quick-links {
    grid-template-columns: 1fr;
  }

  .active-booking-text {
    font-size: 1.125rem;
  }

  .active-booking-time {
    font-size: 0.95rem;
  }

  .banner-content {
    flex-direction: column;
  }

  .banner-actions {
    width: 100%;
  }

  .banner-actions .btn {
    flex: 1;
  }
}
</style>
