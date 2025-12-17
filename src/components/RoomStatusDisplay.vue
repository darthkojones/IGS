<template>
  <div
    class="room-status-display"
    :class="`room-status-display--${statusColor}`"
    role="status"
    :aria-label="`Room status: ${statusText}`"
  >
    <div class="status-indicator">
      <div class="status-light" :style="{ background: lightColor }"></div>
      <div class="status-label">{{ statusText }}</div>
    </div>

    <div v-if="currentBooking" class="booking-info">
      <h3>{{ currentBooking.title }}</h3>
      <div class="booking-time">
        <span>{{ formatLocalTime(currentBooking.startTime) }}</span>
        <span> - </span>
        <span>{{ formatLocalTime(currentBooking.endTime) }}</span>
      </div>
      <div v-if="showTimer && timeRemaining > 0" class="timer">
        <span class="timer-label">Time remaining:</span>
        <span class="timer-value">{{ formattedTime }}</span>
      </div>
    </div>

    <div v-else-if="nextBooking" class="next-booking">
      <p>Next booking:</p>
      <p class="next-booking-time">{{ formatLocalTime(nextBooking.startTime) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Booking } from '@/types';
import { useRoomStatus } from '@/composables/useRoomStatus';
import { useBookingTimer } from '@/composables/useBookingTimer';
import { formatLocalTime } from '@/utils/timezoneUtils';

interface Props {
  roomId: string;
  currentBooking?: Booking | null;
  nextBooking?: Booking | null;
  showTimer?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  currentBooking: null,
  nextBooking: null,
  showTimer: true,
});

const { statusColor, statusText } = useRoomStatus(props.roomId);

const { formattedTime, timeRemaining } = props.currentBooking
  ? useBookingTimer(props.currentBooking.startTime)
  : { formattedTime: computed(() => ''), timeRemaining: computed(() => 0) };

const lightColor = computed(() => {
  switch (statusColor.value) {
    case 'green':
      return '#4caf50';
    case 'yellow':
      return '#ffc107';
    case 'red':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
});
</script>

<style scoped>
.room-status-display {
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
}

.room-status-display--green {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.room-status-display--yellow {
  background: linear-gradient(135deg, #fff9c4 0%, #fff59d 100%);
}

.room-status-display--red {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
}

.status-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.status-light {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  box-shadow: 0 0 20px currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.status-label {
  font-size: 1.5rem;
  font-weight: 600;
  text-transform: uppercase;
}

.booking-info h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.booking-time {
  font-size: 1rem;
  color: #666;
  margin-bottom: 1rem;
}

.timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
}

.timer-value {
  font-size: 2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.next-booking {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
}

.next-booking-time {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .status-light {
    animation: none;
  }
}
</style>
