<template>
  <div class="booking-detail-view">
    <div v-if="loading" class="loading">Loading booking...</div>
    <div v-else-if="!booking" class="error">Booking not found</div>

    <div v-else class="booking-detail">
      <header class="booking-header">
        <h1>{{ booking.title }}</h1>
        <span class="booking-status" :class="`status--${booking.status}`">
          {{ booking.status }}
        </span>
      </header>

      <div class="booking-content">
        <section class="booking-info">
          <h2>Booking Information</h2>
          <dl>
            <dt>Date:</dt>
            <dd>{{ formatLocalDate(booking.startTime) }}</dd>
            <dt>Time:</dt>
            <dd>{{ formatLocalTime(booking.startTime) }} - {{ formatLocalTime(booking.endTime) }}</dd>
            <dt>Duration:</dt>
            <dd>{{ calculateDuration(booking.startTime, booking.endTime) }}</dd>
            <dt>Status:</dt>
            <dd>{{ booking.status }}</dd>
          </dl>
        </section>

        <section v-if="booking.room" class="room-info">
          <h2>Room Information</h2>
          <dl>
            <dt>Room:</dt>
            <dd>
              <router-link :to="{ name: 'room-detail', params: { id: booking.room.roomId } }" class="room-link">
                {{ booking.room.name }}
              </router-link>
            </dd>
            <dt>Floor:</dt>
            <dd>{{ booking.room.floor }}</dd>
            <dt>Building:</dt>
            <dd v-if="booking.room.building">
              {{ booking.room.building.name }}
            </dd>
            <dd v-else>Unknown Building</dd>
          </dl>
        </section>

        <section v-if="(booking.status === 'reserved' || booking.status === 'confirmed') && !isExpiredFromTimer" class="entry-section">
          <div v-if="!isWithinWindow" class="window-closed">
            <h2>⏰ Entry Window Not Open</h2>
            <p>You can confirm entry within 10 minutes of the booking start time.</p>
            <p class="time-info">Booking starts: {{ formatLocalTime(booking.startTime) }}</p>
          </div>

          <div v-else class="entry-ready">
            <h2>Entry Confirmation</h2>
            <p>Please enter the room within:</p>
            <div class="timer">
              <span class="timer-value">{{ formattedTime }}</span>
            </div>

            <div class="entry-methods">
              <button @click="confirmEntry('qr_code')" class="btn btn--primary">
                📱 Scan QR Code
              </button>
              <button @click="confirmEntry('nfc')" class="btn btn--primary">
                💳 Tap NFC Card
              </button>
            </div>
          </div>
        </section>

        <section v-if="booking.enteredAt" class="entry-confirmed">
          <h2>✅ Entry Confirmed</h2>
          <p>Entered at: {{ formatLocalTime(booking.enteredAt) }}</p>
          <p>Entry method: {{ booking.entryMethod }}</p>
        </section>
      </div>

      <div class="booking-actions">
        <button
          v-if="booking.status === 'reserved' || booking.status === 'confirmed'"
          @click="handleCancel"
          class="btn btn--danger"
        >
          Cancel Booking
        </button>
        <button class="btn btn--secondary" @click="$router.push('/bookings')">
          Back to Bookings
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBookingsStore } from '@/stores/bookings';
import { bookingService } from '@/services/bookingService';
import { useBookingTimer } from '@/composables/useBookingTimer';
import { useBookingRealtime } from '@/composables/useBookingRealtime';
import { formatLocalDate, formatLocalTime } from '@/utils/timezoneUtils';
import type { Booking, BookingStatus } from '@/types';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const bookingsStore = useBookingsStore();

const bookingId = computed(() => route.params.id as string);
const booking = ref<Booking | null>(null);
const loading = computed(() => bookingsStore.loading || !booking.value);

// Helper to load building data if needed
const loadBuildingData = async (foundBooking: Booking) => {
  if (foundBooking.room?.buildingId && !foundBooking.room.building) {
    try {
      const building = await bookingService.getBuildingById(foundBooking.room.buildingId);
      if (building && foundBooking.room) {
        foundBooking.room.building = {
          buildingId: building.id,
          name: building.name,
          address: '',
          institutionId: '',
        };
      }
    } catch (error) {
      console.error('Failed to fetch building details:', error);
    }
  }
};

// Load booking from database or store
const loadBooking = async () => {
  const userId = authStore.currentUser?.userId;
  if (userId) {
    try {
      const bookings = await bookingService.getBookingsByUser(userId);
      const foundBooking = bookings.find(b => b.bookingId === bookingId.value);
      if (foundBooking) {
        await loadBuildingData(foundBooking);
        booking.value = foundBooking;
        return;
      }
    } catch (error) {
      console.error('Failed to fetch booking details:', error);
    }
  }

  // Fallback: try to find in store
  const foundBooking =
    bookingsStore.bookings.find(b => b.bookingId === bookingId.value) ||
    bookingsStore.userBookings.find(b => b.bookingId === bookingId.value);

  if (foundBooking) {
    await loadBuildingData(foundBooking);
    booking.value = foundBooking;
  }
};

onMounted(() => {
  loadBooking();
});

// Refresh booking data from realtime updates
const refreshBooking = async () => {
  await loadBooking();
};

// Subscribe to realtime updates for this booking
if (authStore.currentUser) {
  useBookingRealtime(authStore.currentUser.userId, refreshBooking);
}// Check if booking start time is within next 10 minutes
const isWithinWindow = computed(() => {
  if (!booking.value) return false;
  const now = new Date();
  const startTime = new Date(booking.value.startTime);
  const timeDiff = startTime.getTime() - now.getTime();
  const minutesDiff = timeDiff / (1000 * 60);

  // Must be within 10 minutes before start and before it has started
  return minutesDiff <= 10 && minutesDiff >= 0;
});

// Only use the timer if we're within the window and in entry-ready state
const timerComposable = ref<ReturnType<typeof useBookingTimer> | null>(null);
const formattedTime = computed(() => timerComposable.value?.formattedTime || '');
const isExpiredFromTimer = computed(() => timerComposable.value?.isExpired || false);

// Watch for changes in window/status to manage timer lifecycle
watch(
  () => ({
    isWithinWindow: isWithinWindow.value,
    status: booking.value?.status,
    startTime: booking.value?.startTime,
  }),
  (newVal) => {
    // Stop existing timer
    if (timerComposable.value) {
      timerComposable.value.stopTimer();
      timerComposable.value = null;
    }

    // Start new timer if conditions are met
    if (
      newVal.isWithinWindow &&
      newVal.status &&
      (newVal.status === 'reserved' || newVal.status === 'confirmed') &&
      newVal.startTime
    ) {
      timerComposable.value = useBookingTimer(new Date(newVal.startTime));
      timerComposable.value?.startTimer();
    }
  },
  { deep: false }
);

// Watch for timer expiration and update booking status
watch(isExpiredFromTimer, async (expired) => {
  if (expired && booking.value && booking.value.status === 'reserved') {
    try {
      await bookingService.updateBooking(booking.value.bookingId, { status: 'expired' as BookingStatus });
      booking.value.status = 'expired' as BookingStatus;
    } catch (error) {
      console.error('Failed to update booking status on timer expiration:', error);
    }
  }
});

const calculateDuration = (start: Date, end: Date) => {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
};

const confirmEntry = async (method: string) => {
  if (!booking.value) return;
  await bookingsStore.confirmEntry(booking.value.bookingId, method);
  alert('Entry confirmed! Welcome to your room.');
};

const handleCancel = async () => {
  if (!booking.value) return;
  if (confirm('Are you sure you want to cancel this booking?')) {
    await bookingsStore.cancelBooking(booking.value.bookingId);
    router.push('/bookings');
  }
};

// Cleanup timer when component unmounts
onUnmounted(() => {
  if (timerComposable.value) {
    timerComposable.value.stopTimer();
    timerComposable.value = null;
  }
});
</script>

<style scoped>
.booking-detail-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #e0e0e0;
}

.booking-header h1 {
  font-size: 2rem;
  margin: 0;
}

.booking-status {
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-size: 0.875rem;
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

.booking-content {
  display: grid;
  gap: 2rem;
  margin-bottom: 2rem;
}

section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

section h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
}

dt {
  font-weight: 600;
  color: #666;
}

dd {
  margin: 0;
  color: #333;
}

.timer {
  text-align: center;
  padding: 2rem;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 1rem 0;
}

.timer-value {
  font-size: 3rem;
  font-weight: 700;
  color: #1976d2;
  font-variant-numeric: tabular-nums;
}

.entry-methods {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.entry-confirmed {
  text-align: center;
  background: #e8f5e9;
}

.window-closed {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
  padding: 1.5rem;
  border-radius: 4px;
}

.window-closed h2 {
  color: #e65100;
  margin-top: 0;
}

.window-closed p {
  color: #bf360c;
  margin: 0.5rem 0;
}

.time-info {
  font-weight: 600;
  color: #ff6f00;
}

.location-check {
  background: #f3e5f5;
  border-left: 4px solid #9c27b0;
  padding: 1.5rem;
  border-radius: 4px;
}

.location-check h2 {
  color: #6a1b9a;
  margin-top: 0;
}

.location-check p {
  color: #4a148c;
  margin: 0.5rem 0;
}

.entry-ready {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 1.5rem;
  border-radius: 4px;
}

.booking-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
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
</style>
