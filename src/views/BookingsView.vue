<template>
  <div class="bookings-view">
    <header class="page-header">
      <h1>My Bookings</h1>
      <router-link to="/bookings/new" class="btn btn--primary">
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
        :class="{ active: activeTab === 'past' }"
        @click="activeTab = 'past'"
      >
        Past
      </button>
    </div>

    <div v-if="loading" class="loading">Loading bookings...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    
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
          <p><strong>Date:</strong> {{ formatDate(booking.startTime) }}</p>
          <p><strong>Time:</strong> {{ formatTime(booking.startTime) }} - {{ formatTime(booking.endTime) }}</p>
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

const bookingsStore = useBookingsStore();
const authStore = useAuthStore();

const activeTab = ref<'upcoming' | 'past'>('upcoming');

const loading = computed(() => bookingsStore.loading);
const error = computed(() => bookingsStore.error);

const displayedBookings = computed(() => {
  return activeTab.value === 'upcoming'
    ? bookingsStore.upcomingBookings
    : bookingsStore.pastBookings;
});

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const cancelBooking = async (bookingId: string) => {
  if (confirm('Are you sure you want to cancel this booking?')) {
    await bookingsStore.cancelBooking(bookingId);
  }
};

onMounted(() => {
  if (authStore.currentUser) {
    bookingsStore.fetchUserBookings(authStore.currentUser.userId);
  }
});
</script>

<style scoped>
.bookings-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.bookings-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e0e0e0;
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
}

.bookings-tabs button.active {
  border-bottom-color: #1976d2;
  color: #1976d2;
}

.bookings-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.booking-card {
  padding: 1.5rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
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
  background: #1976d2;
  color: white;
}

.btn--secondary {
  background: transparent;
  color: #1976d2;
  border: 1px solid #1976d2;
}

.btn--danger {
  background: #d32f2f;
  color: white;
}

.no-bookings {
  text-align: center;
  padding: 3rem;
  color: #757575;
}
</style>
