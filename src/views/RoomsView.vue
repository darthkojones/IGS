<template>
  <div class="rooms-view">
    <header class="page-header">
      <h1>Available Rooms</h1>
      <div class="header-actions">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search rooms..."
          class="search-input"
          aria-label="Search rooms"
        />
        <select v-model="filterBuilding" class="filter-select" aria-label="Filter by building">
          <option value="">All Buildings</option>
          <option v-for="building in buildings" :key="building.buildingId" :value="building.buildingId">
            {{ building.name }}
          </option>
        </select>
      </div>
    </header>

    <div v-if="loading" class="loading">Loading rooms...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <div v-else class="rooms-grid">
      <RoomCard
        v-for="room in filteredRooms"
        :key="room.roomId"
        :room="room"
        @book="handleBook"
        @view-details="handleViewDetails"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useRoomsStore } from '@/stores/rooms';
import RoomCard from '@/components/RoomCard.vue';

const router = useRouter();
const roomsStore = useRoomsStore();

const searchQuery = ref('');
const filterBuilding = ref('');

const loading = computed(() => roomsStore.loading);
const error = computed(() => roomsStore.error);
const rooms = computed(() => roomsStore.rooms);
const buildings = computed(() => roomsStore.buildings);

const filteredRooms = computed(() => {
  let filtered = rooms.value;

  if (filterBuilding.value) {
    filtered = filtered.filter(room => room.buildingId === filterBuilding.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(room =>
      room.name.toLowerCase().includes(query)
    );
  }

  return filtered;
});

const handleBook = (room: any) => {
  roomsStore.selectRoom(room);
  router.push({ name: 'new-booking' });
};

const handleViewDetails = (room: any) => {
  router.push({ name: 'room-detail', params: { id: room.roomId } });
};

onMounted(() => {
  roomsStore.fetchRooms();
  roomsStore.fetchBuildings();
});
</script>

<style scoped>
.rooms-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.search-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.search-input {
  flex: 1;
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.loading,
.error {
  text-align: center;
  padding: 3rem;
  font-size: 1.125rem;
}

.error {
  color: #c62828;
}
</style>
