<template>
  <div class="booking-form" role="form" aria-label="Room booking form">
    <h2>Book a Room</h2>

    <div v-if="selectedRoom" class="form-group">
      <label class="form-label">Selected Room</label>
      <div class="selected-room">
        <strong>{{ selectedRoom.name }}</strong>
        <span class="capacity">Capacity: {{ selectedRoom.capacity }}</span>
      </div>
    </div>

    <div class="form-group">
      <label for="booking-title" class="form-label">Title</label>
      <input
        id="booking-title"
        v-model="form.title"
        type="text"
        class="form-control"
        placeholder="Meeting title"
        required
        aria-required="true"
      />
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
          <option value="30">30 minutes</option>
          <option value="60">1 hour</option>
          <option value="90">1.5 hours</option>
          <option value="120">2 hours</option>
          <option value="180">3 hours</option>
        </select>
      </div>
    </div>

    <div v-if="error" class="error-message" role="alert">
      {{ error }}
    </div>

    <div class="form-actions">
      <button
        type="button"
        class="btn btn--secondary"
        @click="$emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="btn btn--primary"
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
import { ref, computed, reactive } from 'vue';
import type { Room, Booking } from '@/types';

interface Props {
  selectedRoom?: Room | null;
  loading?: boolean;
  error?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  selectedRoom: null,
  loading: false,
  error: null,
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
});

const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

const isFormValid = computed(() => {
  return form.title && form.date && form.startTime && form.duration > 0;
});

const handleSubmit = () => {
  if (!isFormValid.value || !props.selectedRoom) return;

  const startDateTime = new Date(`${form.date}T${form.startTime}`);
  const endDateTime = new Date(startDateTime.getTime() + form.duration * 60000);

  const bookingData: Partial<Booking> = {
    roomId: props.selectedRoom.roomId,
    title: form.title,
    startTime: startDateTime,
    endTime: endDateTime,
  };

  emit('submit', bookingData);
};
</script>

<style scoped>
.booking-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.booking-form h2 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.selected-room {
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-message {
  padding: 0.75rem;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: #1976d2;
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: #1565c0;
}

.btn--secondary {
  background: transparent;
  color: #1976d2;
  border: 1px solid #1976d2;
}

.btn--secondary:hover {
  background: #e3f2fd;
}
</style>
