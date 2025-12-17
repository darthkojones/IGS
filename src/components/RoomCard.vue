<template>
  <div
    class="room-card"
    :class="{ 'room-card--available': isAvailable }"
    role="article"
    :aria-label="`Room ${room.name}, ${statusText}`"
  >
    <div class="room-card__header">
      <h3 class="room-card__title">{{ room.name }}</h3>
      <div
        class="room-card__status"
        :class="`room-card__status--${statusColor}`"
        :aria-label="`Status: ${statusText}`"
      >
        <span class="room-card__status-indicator"></span>
        <span class="room-card__status-text">{{ statusText }}</span>
      </div>
    </div>

    <div class="room-card__body">
      <div class="room-card__info">
        <p class="room-card__capacity">
          <span class="icon">👥</span>
          Capacity: {{ room.capacity }}
        </p>
        <p class="room-card__floor">
          <span class="icon">📍</span>
          Floor: {{ room.floor }}
        </p>
      </div>

      <div v-if="room.equipment && room.equipment.length" class="room-card__equipment">
        <h4>Equipment:</h4>
        <ul>
          <li v-for="item in room.equipment" :key="item.equipmentId">
            {{ item.name }}
          </li>
        </ul>
      </div>

      <div v-if="showReachability && travelTime" class="room-card__reachability">
        <span class="icon">🚶</span>
        {{ travelTime }} min walk
      </div>
    </div>

    <div class="room-card__footer">
      <button
        v-if="isAvailable"
        class="btn btn--primary"
        @click="$emit('book', room)"
        :aria-label="`Book ${room.name}`"
      >
        Book Now
      </button>
      <button
        class="btn btn--secondary"
        @click="$emit('view-details', room)"
        :aria-label="`View details for ${room.name}`"
      >
        View Details
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Room } from '@/types';
import { useRoomStatus } from '@/composables/useRoomStatus';

interface Props {
  room: Room;
  showReachability?: boolean;
  travelTime?: number;
}

const props = withDefaults(defineProps<Props>(), {
  showReachability: false,
  travelTime: 0,
});

const { statusColor, statusText } = useRoomStatus(props.room.roomId);

const isAvailable = computed(() => statusText.value === 'Available');
</script>

<style scoped>
.room-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  background: white;
  transition: box-shadow 0.3s ease;
}

.room-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.room-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.room-card__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.room-card__status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.room-card__status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.room-card__status--green {
  background: #e6f7e6;
  color: #2d862d;
}

.room-card__status--green .room-card__status-indicator {
  background: #2d862d;
}

.room-card__status--yellow {
  background: #fff8e6;
  color: #b38600;
}

.room-card__status--yellow .room-card__status-indicator {
  background: #ffc107;
}

.room-card__status--red {
  background: #ffe6e6;
  color: #c62828;
}

.room-card__status--red .room-card__status-indicator {
  background: #c62828;
}

.room-card__body {
  margin-bottom: 1rem;
}

.room-card__info p {
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.room-card__equipment {
  margin-top: 1rem;
}

.room-card__equipment h4 {
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.room-card__equipment ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.room-card__equipment li {
  background: #f0f0f0;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8125rem;
}

.room-card__footer {
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
  transition: all 0.2s ease;
}

.btn--primary {
  background: #1976d2;
  color: white;
}

.btn--primary:hover {
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
