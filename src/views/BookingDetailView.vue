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
            <dd>{{ formatDate(booking.startTime) }}</dd>
            <dt>Time:</dt>
            <dd>{{ formatTime(booking.startTime) }} - {{ formatTime(booking.endTime) }}</dd>
            <dt>Duration:</dt>
            <dd>{{ calculateDuration(booking.startTime, booking.endTime) }}</dd>
            <dt>Status:</dt>
            <dd>{{ booking.status }}</dd>
          </dl>
        </section>

        <section v-if="booking.status === 'reserved' && !isExpired" class="entry-section">
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
        </section>

        <section v-if="booking.enteredAt" class="entry-confirmed">
          <h2>✅ Entry Confirmed</h2>
          <p>Entered at: {{ formatTime(booking.enteredAt) }}</p>
          <p>Entry method: {{ booking.entryMethod }}</p>
        </section>
      </div>

      <div class="booking-actions">
        <button
          v-if="booking.status === 'reserved'"
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
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBookingsStore } from '@/stores/bookings';
import { useBookingTimer } from '@/composables/useBookingTimer';

const route = useRoute();
const router = useRouter();
const bookingsStore = useBookingsStore();

const bookingId = computed(() => route.params.id as string);
const booking = computed(() => 
  bookingsStore.bookings.find(b => b.bookingId === bookingId.value) ||
  bookingsStore.userBookings.find(b => b.bookingId === bookingId.value)
);
const loading = computed(() => bookingsStore.loading);

const { formattedTime, isExpired } = booking.value && booking.value.status === 'reserved'
  ? useBookingTimer(booking.value.startTime)
  : { formattedTime: computed(() => ''), isExpired: computed(() => false) };

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

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
  try {
    await bookingsStore.confirmEntry(booking.value.bookingId, method);
    alert('Entry confirmed! Welcome to your room.');
  } catch (error) {
    alert('Failed to confirm entry. Please try again.');
  }
};

const handleCancel = async () => {
  if (!booking.value) return;
  if (confirm('Are you sure you want to cancel this booking?')) {
    try {
      await bookingsStore.cancelBooking(booking.value.bookingId);
      router.push('/bookings');
    } catch (error) {
      alert('Failed to cancel booking. Please try again.');
    }
  }
};

onMounted(() => {
  // Fetch booking if needed
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
