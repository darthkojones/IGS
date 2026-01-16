<template>
  <div class="check-in-view">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Verifying your access...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <h2>❌ Access Denied</h2>
      <p>{{ error }}</p>
      <button @click="$router.push('/bookings')" class="btn btn--primary">
        Back to Bookings
      </button>
    </div>

    <div v-else-if="success" class="success-message">
      <h2>✅ Check-In Successful!</h2>
      <p>Welcome to {{ roomName }}</p>
      <p class="details">You have successfully checked in to your booking.</p>
      <div class="booking-info">
        <p><strong>Booking:</strong> {{ bookingTitle }}</p>
        <p><strong>Time:</strong> {{ bookingTime }}</p>
      </div>
      <button @click="$router.push(`/bookings/${bookingId}`)" class="btn btn--primary">
        View Booking Details
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBookingsStore } from '@/stores/bookings';
import { bookingService } from '@/services/bookingService';
import { formatLocalTime } from '@/utils/timezoneUtils';
import type { Booking } from '@/types';

const route = useRoute();
const authStore = useAuthStore();
const bookingsStore = useBookingsStore();

const loading = ref(true);
const error = ref('');
const success = ref(false);
const roomName = ref('');
const bookingTitle = ref('');
const bookingTime = ref('');
const bookingId = ref('');

// Decode and validate the access token
const validateToken = (token: string, bookingIdParam: string): { valid: boolean; userId: string } => {
  try {
    console.log('=== Token Validation ===');
    console.log('Token:', token);
    console.log('Booking ID Param:', bookingIdParam);

    // Decode the base64 token
    const decoded = atob(token);
    console.log('Decoded token:', decoded);

    // Token format from booking service: userId:timestamp:random
    const [userId, timestamp, random] = decoded.split(':');
    console.log('Parsed - UserID:', userId, 'Timestamp:', timestamp, 'Random:', random);
    console.log('Token valid!');
    return { valid: true, userId: userId || '' };
  } catch (e) {
    console.error('Token validation error:', e);
    return { valid: false, userId: '' };
  }
};

const performCheckIn = async () => {
  try {
    const token = route.query.token as string | undefined;
    const bookingIdParam = route.query.booking as string | undefined;

    if (!token || !bookingIdParam) {
      error.value = 'Invalid check-in link. Missing required parameters.';
      loading.value = false;
      return;
    }

    // Validate token
    const validation = validateToken(token, bookingIdParam);
    if (!validation.valid) {
      error.value = 'Invalid or expired access token.';
      loading.value = false;
      return;
    }

    // Check if user is logged in
    if (!authStore.isAuthenticated) {
      error.value = 'You must be logged in to check in. Please log in and try again.';
      loading.value = false;
      return;
    }

    // Verify the logged-in user matches the token
    if (authStore.currentUser?.userId !== validation.userId) {
      error.value = 'This QR code belongs to a different user. Please log in with the correct account.';
      loading.value = false;
      return;
    }

    // Fetch the booking
    const bookings = await bookingService.getBookingsByUser(validation.userId);
    const booking = bookings.find((b: Booking) => b.bookingId === bookingIdParam);

    if (!booking) {
      error.value = 'Booking not found.';
      loading.value = false;
      return;
    }

    // Check if booking is in valid state
    if (booking.status !== 'reserved' && booking.status !== 'confirmed') {
      error.value = `Cannot check in. Booking status is: ${booking.status}`;
      loading.value = false;
      return;
    }

    // Check if within time window (10 minutes before start)
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const timeDiff = startTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff > 10) {
      error.value = 'Check-in window not open yet. You can check in within 10 minutes of your booking start time.';
      loading.value = false;
      return;
    }

    if (minutesDiff < -30) {
      error.value = 'Check-in window has closed. Your booking may have expired.';
      loading.value = false;
      return;
    }

    // Perform the check-in
    await bookingsStore.confirmEntry(bookingIdParam, 'qr_code');

    // Set success state
    success.value = true;
    bookingId.value = bookingIdParam;
    roomName.value = booking.room?.name || 'Your Room';
    bookingTitle.value = booking.title;
    bookingTime.value = `${formatLocalTime(booking.startTime)} - ${formatLocalTime(booking.endTime)}`;
    loading.value = false;

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred during check-in. Please try again.';
    console.error('Check-in error:', err);
    error.value = errorMessage;
    loading.value = false;
  }
};

onMounted(() => {
  performCheckIn();
});
</script>

<style scoped>
.check-in-view {
  max-width: 600px;
  margin: 4rem auto;
  padding: 2rem;
  text-align: center;
}

.loading {
  padding: 3rem;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: #ffebee;
  border: 2px solid #f44336;
  border-radius: 8px;
  padding: 2rem;
}

.error-message h2 {
  color: #c62828;
  margin-top: 0;
}

.error-message p {
  color: #d32f2f;
  font-size: 1.1rem;
  margin: 1rem 0;
}

.success-message {
  background: #e8f5e9;
  border: 2px solid #4caf50;
  border-radius: 8px;
  padding: 2rem;
}

.success-message h2 {
  color: #2e7d32;
  margin-top: 0;
  font-size: 2rem;
}

.success-message p {
  color: #1b5e20;
  font-size: 1.2rem;
  margin: 0.5rem 0;
}

.details {
  font-size: 1rem !important;
  color: #388e3c !important;
}

.booking-info {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  text-align: left;
}

.booking-info p {
  margin: 0.5rem 0;
  color: #333 !important;
  font-size: 1rem !important;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1rem;
}

.btn--primary {
  background: #1976d2;
  color: white;
}

.btn--primary:hover {
  background: #1565c0;
}
</style>
