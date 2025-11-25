<template>
  <div class="new-booking-view">
    <h1>New Booking</h1>
    
    <div v-if="!selectedRoom" class="room-selection">
      <h2>Select a Room</h2>
      
      <div v-if="roomsLoading" class="loading">Loading rooms...</div>
      
      <div v-else class="rooms-grid">
        <div
          v-for="room in availableRooms"
          :key="room.roomId"
          class="room-card"
          @click="selectRoom(room)"
        >
          <div class="room-header">
            <h3>{{ room.name }}</h3>
            <span class="room-status" :class="`status--${room.status}`">
              {{ room.status }}
            </span>
          </div>
          <div class="room-details">
            <p><strong>Capacity:</strong> {{ room.capacity }} people</p>
            <p><strong>Floor:</strong> {{ room.floor }}</p>
            <p class="room-description">{{ room.description }}</p>
          </div>
          <div class="room-features">
            <span v-if="room.hasProjector" class="feature">📽️ Projector</span>
            <span v-if="room.hasWhiteboard" class="feature">📋 Whiteboard</span>
            <span v-if="room.hasVideoConference" class="feature">🎥 Video</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="booking-section">
      <button @click="clearRoomSelection" class="btn btn--secondary back-btn">
        ← Change Room
      </button>
      
      <BookingForm
        :selected-room="selectedRoom"
        :loading="loading"
        :error="error"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useRoomsStore } from '@/stores/rooms';
import { useBookingsStore } from '@/stores/bookings';
import { useAuthStore } from '@/stores/auth';
import BookingForm from '@/components/BookingForm.vue';
import type { Booking, Room } from '@/types';

const router = useRouter();
const roomsStore = useRoomsStore();
const bookingsStore = useBookingsStore();
const authStore = useAuthStore();

const selectedRoom = computed(() => roomsStore.selectedRoom);
const loading = computed(() => bookingsStore.loading);
const error = computed(() => bookingsStore.error);
const roomsLoading = computed(() => roomsStore.loading);
const availableRooms = computed(() => roomsStore.rooms);

const selectRoom = (room: Room) => {
  roomsStore.selectRoom(room);
};

const clearRoomSelection = () => {
  roomsStore.selectRoom(null);
};

const handleSubmit = async (bookingData: Partial<Booking>) => {
  if (!authStore.currentUser) {
    router.push({ name: 'login' });
    return;
  }

  try {
    const completeBookingData = {
      ...bookingData,
      userId: authStore.currentUser.userId,
    };

    await bookingsStore.createBooking(completeBookingData as Omit<Booking, 'bookingId' | 'createdAt' | 'status'>);
    alert('Booking created successfully!');
    router.push({ name: 'bookings' });
  } catch (err) {
    console.error('Failed to create booking:', err);
  }
};

const handleCancel = () => {
  router.back();
};

onMounted(() => {
  roomsStore.fetchRooms();
  roomsStore.fetchBuildings();
});
</script>

<style scoped>
.new-booking-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.new-booking-view h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.room-selection h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.room-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.room-card:hover {
  border-color: #1976d2;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15);
  transform: translateY(-2px);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.room-header h3 {
  margin: 0;
  color: #333;
}

.room-status {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status--free {
  background: #e8f5e9;
  color: #2e7d32;
}

.status--reserved {
  background: #fff3e0;
  color: #f57c00;
}

.status--occupied {
  background: #ffebee;
  color: #c62828;
}

.room-details {
  margin-bottom: 1rem;
}

.room-details p {
  margin: 0.5rem 0;
  color: #666;
}

.room-description {
  font-size: 0.9rem;
  color: #777;
  font-style: italic;
}

.room-features {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.feature {
  padding: 0.25rem 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 0.85rem;
}

.booking-section {
  max-width: 800px;
  margin: 0 auto;
}

.back-btn {
  margin-bottom: 1.5rem;
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

.btn--secondary {
  background: #f5f5f5;
  color: #333;
}

.btn--secondary:hover {
  background: #e0e0e0;
}
</style>
