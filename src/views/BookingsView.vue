<template>
  <div class="bookings-view">
    <header class="page-header">
      <h1>My Bookings</h1>
      <router-link to="/rooms" class="btn btn--primary">
        New Booking
      </router-link>
    </header>

    <div class="bookings-tabs">
      <button
        :class="{ active: activeTab === 'upcoming' }"
        @click="activeTab = 'upcoming'"
      >
        Upcoming
      </button>
      <button
        :class="{ active: activeTab === 'ongoing' }"
        @click="activeTab = 'ongoing'"
      >
        Ongoing
      </button>
      <button
        :class="{ active: activeTab === 'past' }"
        @click="activeTab = 'past'"
      >
        Past
      </button>
    </div>

    <div v-if="loading" class="loading">Loading bookings...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="bookingsStore.userBookings.length === 0" class="no-bookings">
      <p>No bookings found. <router-link to="/bookings/new">Create one now</router-link></p>
    </div>

    <div v-else class="bookings-list">
      <div
        v-for="booking in displayedBookings"
        :key="booking.bookingId"
        class="booking-card"
      >
        <div class="booking-header">
          <h3>{{ booking.title }}</h3>
          <span class="booking-status" :class="`status--${booking.status}`">
            {{ booking.status }}
          </span>
        </div>
        <div class="booking-details">
          <p><strong>Date:</strong> {{ formatLocalDate(booking.startTime, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) }}</p>
          <p><strong>Time:</strong> {{ formatLocalTime(booking.startTime) }} - {{ formatLocalTime(booking.endTime) }}</p>
        </div>
        <div class="booking-actions">
          <router-link
            :to="{ name: 'booking-detail', params: { id: booking.bookingId } }"
            class="btn btn--secondary"
          >
            View Details
          </router-link>
          <button
            v-if="booking.status === 'reserved'"
            @click="cancelBooking(booking.bookingId)"
            class="btn btn--danger"
          >
            Cancel
          </button>
        </div>
      </div>

      <div v-if="displayedBookings.length === 0" class="no-bookings">
        <p>No {{ activeTab }} bookings found.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useBookingsStore } from '@/stores/bookings';
import { useAuthStore } from '@/stores/auth';
import { useBookingRealtime } from '@/composables/useBookingRealtime';
import { formatLocalDate, formatLocalTime } from '@/utils/timezoneUtils';
import type { Booking } from '@/types';

const bookingsStore = useBookingsStore();
const authStore = useAuthStore();

const activeTab = ref<'upcoming' | 'ongoing' | 'past'>('upcoming');

const loading = computed(() => bookingsStore.loading);
const error = computed(() => bookingsStore.error);

const displayedBookings = computed(() => {
  const now = new Date();
  if (activeTab.value === 'upcoming') {
    // Show reserved/confirmed bookings with future start times
    return bookingsStore.userBookings.filter((booking: Booking) => {
      const startTime = new Date(booking.startTime);
      return (booking.status === 'reserved') && startTime > now;
    });
  } else if (activeTab.value === 'ongoing') {
    // Show active bookings (currently happening)
    return bookingsStore.userBookings.filter((booking: Booking) => {
      // time now should be between start and end time
      const startTime = new Date(booking.startTime);
      const endTime = new Date(booking.endTime);
      const isOngoing = startTime <= now && endTime >= now;

      //TODO: we have to fix this to include active and confirmed bookings only
      return (booking.status === 'active' || booking.status === 'confirmed') && isOngoing;
    });
  } else {
    // Show past and completed bookings (any that are not upcoming)
    return bookingsStore.userBookings.filter((booking: Booking) => {
      const endTime = new Date(booking.endTime);
      const isFinalState = ['completed', 'expired', 'cancelled'].includes(booking.status);
      return isFinalState || endTime < now;
    });
  }
});

const cancelBooking = async (bookingId: string) => {
  if (confirm('Are you sure you want to cancel this booking?')) {
    await bookingsStore.cancelBooking(bookingId);
  }
};


// Setup realtime subscription for live updates
const refreshBookings = async () => {
  if (authStore.currentUser) {
    await bookingsStore.fetchUserBookings(authStore.currentUser.userId);
  }
};

// Subscribe to realtime changes on bookings table
if (authStore.currentUser) {
  useBookingRealtime(authStore.currentUser.userId, refreshBookings);
}

onMounted(async () => {
  // If user is already loaded, fetch bookings immediately
  if (authStore.currentUser) {
    await bookingsStore.fetchUserBookings(authStore.currentUser.userId);
  }
});
</script>

<style scoped>
.bookings-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;  background: var(--color-background);
  min-height: 100vh;}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  color: var(--color-heading);
}

.bookings-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid var(--color-border);
}

.bookings-tabs button {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--color-text-soft);
}

.bookings-tabs button.active {
  border-bottom-color: var(--color-primary);
  color: var(--color-primary);
}

.bookings-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.booking-card {
  padding: 1.5rem;
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.booking-card:hover {
  box-shadow: var(--shadow-md);
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.booking-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-heading);
}

.booking-details {
  color: var(--color-text);
}

.booking-status {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status--reserved {
  background: #fff9c4;
  color: #f57f17;
}

.status--active {
  background: #c8e6c9;
  color: #2e7d32;
}

.status--completed {
  background: #e0e0e0;
  color: #616161;
}

.booking-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}

.btn--primary {
  background: var(--color-primary);
  color: var(--color-primary-text);
}

.btn--primary:hover {
  background: var(--color-primary-hover);
}

.btn--secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.btn--secondary:hover {
  background: var(--color-primary-light);
}

.btn--danger {
  background: var(--color-error);
  color: white;
}

.btn--danger:hover {
  background: #b71c1c;
}

.no-bookings {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-soft);
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  color: var(--color-text);
}

.error {
  color: var(--color-error);
}
</style>
