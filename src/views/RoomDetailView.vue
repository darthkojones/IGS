<template>
  <div class="room-detail-view">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="!room" class="error">Room not found</div>

    <div v-else class="room-detail">
      <header class="room-header">
        <h1>{{ room.name }}</h1>
        <RoomStatusDisplay
          :room-id="room.roomId"
          :current-booking="room.currentBooking"
        />
      </header>

      <div class="room-content">
        <section class="room-info">
          <h2>Room Information</h2>
          <dl>
            <dt>Floor:</dt>
            <dd>{{ room.floor }}</dd>
            <dt>Capacity:</dt>
            <dd>{{ room.capacity }} people</dd>
            <dt>Building:</dt>
            <dd>{{ getBuildingName(room.buildingId) }}</dd>
          </dl>
        </section>

        <section class="room-equipment">
          <h2>Available Equipment</h2>
          <ul v-if="room.equipment && room.equipment.length">
            <li v-for="item in room.equipment" :key="item.equipmentId">
              <span class="equipment-icon">🔧</span>
              {{ item.name }} ({{ item.type }})
            </li>
          </ul>
          <p v-else>No equipment listed</p>
        </section>

        <section class="room-schedule">
          <h2>Today's Schedule</h2>
          <div v-if="roomBookings.length > 0" class="schedule-timeline">
            <div
              v-for="booking in roomBookings"
              :key="booking.bookingId"
              class="schedule-item"
            >
              <div class="schedule-time">
                {{ formatLocalTime(booking.startTime) }} - {{ formatLocalTime(booking.endTime) }}
              </div>
              <div class="schedule-details">
                <strong>{{ booking.title }}</strong>
                <div class="schedule-status" :class="`status-${booking.status}`">
                  {{ booking.status }}
                </div>
              </div>
            </div>
          </div>
          <p v-else class="no-bookings">No bookings for today</p>
        </section>
      </div>

      <div class="room-actions">
        <button
          class="btn btn--primary btn--large"
          @click="bookRoom"
        >
          Book This Room
        </button>
        <button class="btn btn--secondary" @click="$router.back()">
          Back to Rooms
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useRoomsStore } from '@/stores/rooms';
import { useBookingsStore } from '@/stores/bookings';
import { formatLocalTime } from '@/utils/timezoneUtils';
import RoomStatusDisplay from '@/components/RoomStatusDisplay.vue';

const router = useRouter();
const route = useRoute();
const roomsStore = useRoomsStore();
const bookingsStore = useBookingsStore();

const roomId = computed(() => route.params.id as string);
const room = computed(() => roomsStore.getRoomById(roomId.value));
const loading = computed(() => roomsStore.loading);

// Get today's bookings for this specific room
const roomBookings = computed(() => {
  const now = new Date();

  // Get today's date boundaries in UTC
  // Adjust for local timezone offset to get correct UTC day boundaries
  const tzOffset = now.getTimezoneOffset() * 60000;
  const localMidnight = new Date(now.getTime() - (now.getTime() % 86400000) - tzOffset);
  const startOfDayUTC = new Date(localMidnight.getTime());
  const endOfDayUTC = new Date(startOfDayUTC.getTime() + 86400000);

  return bookingsStore.bookings
    .filter(booking => {
      const bookingStart = new Date(booking.startTime);
      return booking.roomId === roomId.value && bookingStart >= startOfDayUTC && bookingStart < endOfDayUTC;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
});

const getBuildingName = (buildingId: string) => {
  const building = roomsStore.buildings.find(b => b.buildingId === buildingId);
  return building?.name || 'Unknown';
};

const bookRoom = () => {
  if (room.value) {
    roomsStore.selectRoom(room.value);
    router.push({ name: 'new-booking' });
  }
};

onMounted(() => {
  if (roomsStore.rooms.length === 0) {
    roomsStore.fetchRooms();
  }
  if (roomsStore.buildings.length === 0) {
    roomsStore.fetchBuildings();
  }
  // Fetch bookings to show today's schedule
  bookingsStore.fetchAllBookings?.();
});
</script>

<style scoped>
.room-detail-view {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #e0e0e0;
}

.room-header h1 {
  font-size: 2.5rem;
  margin: 0;
}

.room-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

section h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #333;
}

dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem;
}

dt {
  font-weight: 600;
  color: #666;
}

dd {
  margin: 0;
  color: #333;
}

.room-equipment ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.room-equipment li {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.room-actions {
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

.btn--large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
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

/* Schedule Styles */
.schedule-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-item {
  background: #f9f9f9;
  border-left: 4px solid #2563eb;
  border-radius: 4px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
}

.schedule-time {
  font-weight: 600;
  color: #2563eb;
  min-width: 100px;
  padding-top: 0.25rem;
  font-size: 0.95rem;
}

.schedule-details {
  flex: 1;
}

.schedule-details strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.schedule-status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-reserved {
  background-color: #fef08a;
  color: #854d0e;
}

.status-active {
  background-color: #dbeafe;
  color: #0c4a6e;
}

.status-completed {
  background-color: #dcfce7;
  color: #166534;
}

.status-cancelled {
  background-color: #fee2e2;
  color: #991b1b;
}

.no-bookings {
  color: #999;
  font-style: italic;
  margin: 0;
}
</style>
