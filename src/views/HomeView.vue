<template>
  <div class="home-view">
    <!-- Active Booking Banner (shows when booking is within entry window) -->
    <div v-if="showActiveBooking" class="active-booking-banner">
      <p class="active-booking-text">
        ✓ Room {{ activeBooking?.roomId }} - Ready to Enter
      </p>
      <p class="active-booking-time">
        {{ formatBookingTime(activeBooking!) }}
      </p>
    </div>

    <!-- Today's Bookings Section -->
    <section class="todays-bookings">
      <h2>Todays bookings</h2>
      <div class="bookings-list">
        <div
          v-for="booking in todaysBookings"
          :key="booking.bookingId"
          class="booking-item"
        >
          <p>{{ formatBookingDisplay(booking) }}</p>
        </div>
        <div v-if="todaysBookings.length === 0" class="booking-item">
          <p>No bookings today</p>
        </div>
      </div>
    </section>

    <!-- Quick Access Section -->
    <section class="quick-access">
      <div class="quick-links">
        <router-link to="/rooms" class="quick-link">
          <div class="quick-link-icon">🔍</div>
          <div class="quick-link-text">Find a Room</div>
        </router-link>
        <router-link to="/bookings" class="quick-link">
          <div class="quick-link-icon">📋</div>
          <div class="quick-link-text">My Bookings</div>
        </router-link>
        <router-link to="/accessibility" class="quick-link">
          <div class="quick-link-icon">⚙️</div>
          <div class="quick-link-text">Accessibility</div>
        </router-link>
        <router-link to="/statistics" class="quick-link">
          <div class="quick-link-icon">📊</div>
          <div class="quick-link-text">Statistics</div>
          <p class="quick-link-description">Track room usage, peak hours, and booking patterns with comprehensive analytics</p>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useBookingsStore } from '@/stores/bookings';
import type { Booking } from '@/types';

const authStore = useAuthStore();
const bookingsStore = useBookingsStore();

const todaysBookings = ref<Booking[]>([]);
const activeBooking = ref<Booking | null>(null);
const showActiveBooking = ref(false);

// Format booking for display
const formatBookingDisplay = (booking: Booking) => {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  return `Booking ${booking.roomId ? `Room ${booking.roomId}` : ''} Today - ${formatTime(start)} to ${formatTime(end)}`;
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

  const nearbyBooking = todaysBookings.value.find(booking => {
    const startTime = new Date(booking.startTime);
    const timeDiff = startTime.getTime() - now.getTime();
    // Show if current time is between -10 minutes and +9 minutes from booking start
    return timeDiff <= tenMinutesBefore && timeDiff >= -nineMinutesAfter && booking.status === 'reserved';
  });

  if (nearbyBooking) {
    activeBooking.value = nearbyBooking;
    showActiveBooking.value = true;
  } else {
    showActiveBooking.value = false;
    activeBooking.value = null;
  }
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

    todaysBookings.value = bookingsStore.userBookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate >= startOfDay && bookingDate < endOfDay;
    });

    checkActiveBooking();
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
  }
};

let intervalId: number | null = null;

onMounted(() => {
  fetchTodaysBookings();
  // Check active booking window every 30 seconds
  intervalId = window.setInterval(checkActiveBooking, 30000);
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
  text-align: center;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
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

/* Today's Bookings Section */
.todays-bookings {
  margin-bottom: 3rem;
}

.todays-bookings h2 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.bookings-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.booking-item {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.booking-item:hover {
  border-color: #1976d2;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15);
}

.booking-item p {
  margin: 0;
  font-size: 1.125rem;
  color: #333;
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

.quick-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;
  min-height: 180px;
}

.quick-link:hover {
  border-color: #1976d2;
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
}

.quick-link-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.quick-link-text {
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
}

.quick-link-description {
  font-size: 0.875rem;
  color: #666;
  text-align: center;
  margin-top: 0.75rem;
  line-height: 1.4;
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

  .active-booking-text {
    font-size: 1.125rem;
  }
  
  .active-booking-time {
    font-size: 0.95rem;
  }
}
</style>
