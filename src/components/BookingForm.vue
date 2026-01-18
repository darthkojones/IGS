<template>
  <div class="booking-form" role="form" aria-label="Room booking form">
    <h2>Book this Room</h2>

    <div v-if="selectedRoom" class="form-group">
      <label class="form-label">Selected Room</label>
      <div class="selected-room">
        <strong>{{ selectedRoom.name }}</strong>
        <span class="capacity">Capacity: {{ selectedRoom.capacity }}</span>
      </div>
    </div>

    <div class="form-group">
      <label for="booking-title" class="form-label">
        Title <span class="required-mark">*</span>
      </label>
      <input
        id="booking-title"
        v-model="form.title"
        type="text"
        class="form-control"
        :class="{ 'input--error': !form.title && form.touched }"
        placeholder="Meeting Title"
        required
        aria-required="true"
        @blur="form.touched = true"
      />
      <span v-if="!form.title && form.touched" class="field-error">Please enter a meeting title</span>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="booking-date" class="form-label">Date</label>
        <input
          id="booking-date"
          v-model="form.date"
          type="date"
          class="form-control"
          :min="minDate"
          required
          aria-required="true"
        />
      </div>

      <div class="form-group">
        <label for="booking-start-time" class="form-label">Start Time</label>
        <input
          id="booking-start-time"
          v-model="form.startTime"
          type="time"
          class="form-control"
          required
          aria-required="true"
        />
      </div>

      <div class="form-group">
        <label for="booking-duration" class="form-label">Duration</label>
        <select
          id="booking-duration"
          v-model="form.duration"
          class="form-control"
          required
          aria-required="true"
        >
          <option :value="30">30 minutes</option>
          <option :value="60">1 hour</option>
          <option :value="90">1.5 hours</option>
          <option :value="120">2 hours</option>
          <option :value="150">2.5 hours</option>
          <option :value="180">3 hours</option>
          <option :value="210">3.5 hours</option>
          <option :value="240">4 hours</option>
          <option :value="480">8 hours</option>
        </select>
      </div>
    </div>

    <div v-if="error || availabilityError" class="error-message" role="alert">
      {{ error || availabilityError }}
    </div>

    <div class="booking-policy">
      <span class="policy-icon">ℹ️</span>
      <p>
        Please check in via this Website or QR code within 10 minutes of the start time.
        Otherwise, your booking will be automatically cancelled.
      </p>
    </div>


    <div class="form-actions">
      <button
        type="submit"
        class="btn btn--primary btn--block"
        @click="handleSubmit"
        :disabled="loading || !isFormValid"
        :aria-busy="loading"
      >
        {{ loading ? 'Booking...' : 'Confirm Booking' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import type { Room, Booking } from '@/types';
import { bookingService } from '@/services/bookingService';
import { localTimeToUTC } from '@/utils/timezoneUtils';

interface Props {
  selectedRoom?: Room | null;
  loading?: boolean;
  error?: string | null;
  initialDate?: string;
  initialTime?: string;
}

const props = withDefaults(defineProps<Props>(), {
  selectedRoom: null,
  loading: false,
  error: null,
  initialDate: '',
  initialTime: '',
});

const emit = defineEmits<{
  submit: [bookingData: Partial<Booking>];
  cancel: [];
}>();

const form = reactive({
  title: '',
  date: '',
  startTime: '',
  duration: 60,
  touched: false,
});

const availabilityError = ref('');

const minDate = computed(() => {
  // Get today's date in the user's local timezone
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});

const isFormValid = computed(() => {
  return form.title && form.date && form.startTime && form.duration > 0;
});

const handleSubmit = async () => {
  if (!isFormValid.value || !props.selectedRoom) return;

  // Convert local time from form to UTC
  const startDateTime = localTimeToUTC(form.date, form.startTime);
  const endDateTime = new Date(startDateTime.getTime() + form.duration * 60000);

  // Check room availability with 5-minute buffer
  try {
    availabilityError.value = '';
    const hasConflict = await bookingService.hasBookingConflict(
      props.selectedRoom.roomId,
      startDateTime,
      endDateTime
    );

    if (hasConflict) {
      availabilityError.value = 'This room is not available for the selected time. Please choose a different time or room.';
      return;
    }

    const bookingData: Partial<Booking> = {
      roomId: props.selectedRoom.roomId,
      title: form.title,
      startTime: startDateTime,
      endTime: endDateTime,
    };

    emit('submit', bookingData);
  } catch {
    availabilityError.value = 'Failed to check availability. Please try again.';
  }
};

watch(
  () => props.initialDate,
  (d) => {
    if (d) form.date = d;
  },
  { immediate: true }
);

watch(
  () => props.initialTime,
  (t) => {
    if (t) form.startTime = t;
  },
  { immediate: true }
);

</script>

<style scoped>
.booking-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.booking-form h2 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  color: var(--color-heading);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr; /* Stacked by default for sidebar */
  gap: 1rem;
}

/* Wenn genug Platz da ist (z.B. in der Desktop-Ansicht außerhalb der Sidebar) */
@media (min-width: 500px) {
  .form-row {
    grid-template-columns: 1fr 1fr;
  }
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}

.required-mark {
  color: #dc2626;
}

.form-control {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.95rem;
  color: var(--color-text);
  transition: all 0.2s ease;
  background-color: var(--color-card-bg);
}

.form-control:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-control.input--error {
  border-color: #dc2626;
  background-color: #fffafb;
}

.booking-policy {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-info-bg);
  border: 1px solid var(--color-info-border);
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--color-info);
  line-height: 1.4;
}

.policy-icon {
  font-size: 1.1rem;
}

.selected-room {
  padding: 0.75rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.field-error {
  font-size: 0.75rem;
  color: #dc2626;
  margin-top: 0.25rem;
}

.capacity {
  color: var(--color-text-soft);
  font-size: 0.8rem;
}

.error-message {
  padding: 0.75rem;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fee2e2;
  border-radius: 6px;
  font-size: 0.85rem;
}

.form-actions {
  margin-top: 0.5rem;
}

.btn {
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn--block {
  width: 100%;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--color-primary);
  color: var(--color-primary-text);
}

.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}
</style>
