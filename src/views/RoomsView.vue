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

        <!-- Sort dropdown -->
        <select v-model="filters.sortBy" class="filter-select" aria-label="Sort by">
          <option value="name-asc">Name ↑ (A-Z)</option>
          <option value="name-desc">Name ↓ (Z-A)</option>
          <option value="capacity-asc">Capacity ↑ (Smallest)</option>
          <option value="capacity-desc">Capacity ↓ (Largest)</option>
          <option value="distance-asc">Distance ↑ (Nearest)</option>
          <option value="distance-desc">Distance ↓ (Farthest)</option>
        </select>

        <!-- Capacity filter -->
        <select v-model="filters.capacity" class="filter-select" aria-label="Filter by minimum capacity">
          <option :value="null">Any Capacity</option>
          <option :value="4">4+ people</option>
          <option :value="8">8+ people</option>
          <option :value="10">10+ people</option>
          <option :value="20">20+ people</option>
          <option :value="30">30+ people</option>
        </select>

        <!-- Reset button -->
        <button @click="resetFilters" class="btn-reset">
          Reset Filters
        </button>
      </div>

      <!-- Equipment filters row -->
      <div class="equipment-filters">
        <label>
          <input type="checkbox" value="projector" v-model="filters.equipment" />
          Projector
        </label>
        <label>
          <input type="checkbox" value="whiteboard" v-model="filters.equipment" />
          Whiteboard
        </label>
        <label>
          <input type="checkbox" value="video_conference" v-model="filters.equipment" />
          Video Conference
        </label>
      </div>

      <!-- DateTime and Show Booked row -->
      <div class="secondary-filters">
        <div class="datetime-filter">
          <label for="start-datetime">Available from:</label>
          <input
            id="start-datetime"
            type="datetime-local"
            v-model="filters.startDateTime"
            :min="minDateTime"
            class="filter-input"
          />
        </div>

        <label class="toggle-label">
          <input type="checkbox" v-model="filters.showBooked" />
          Show booked rooms
        </label>

        <button @click="handleLocationRequest" class="btn-location" :disabled="locationLoading">
          {{ hasLocation ? 'Update Location' : 'Enable Distance' }}
        </button>
      </div>
    </header>

    <div v-if="loading" class="loading">Loading rooms...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <template v-else>
      <!-- Show location warning as a banner, not blocking content -->
      <div v-if="locationError" class="location-warning">
        Location access denied. Distance sorting unavailable.
      </div>

      <div class="rooms-grid">
        <RoomCard
          v-for="room in roomsWithDistance"
          :key="room.roomId"
          :room="room"
          :show-reachability="hasLocation && room.distance !== undefined"
          :travel-time="room.distance?.durationMinutes"
          :selected-datetime="filters.startDateTime"
          :all-bookings="bookingsStore.bookings"
          @book="handleBook"
          @view-details="handleViewDetails"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useRoomsStore } from '@/stores/rooms';
import { useBookingsStore } from '@/stores/bookings';
import { useLocation } from '@/composables/useLocation';
import RoomCard from '@/components/RoomCard.vue';
import type { Room } from '@/types';
import type { DistanceResult } from '@/services/distanceService';

const router = useRouter();
const roomsStore = useRoomsStore();
const bookingsStore = useBookingsStore();

// Location composable
const {
  hasLocation,
  locationError,
  locationLoading,
  requestLocation,
  calculateDistancesToRooms,
} = useLocation();

const searchQuery = ref('');
const filterBuilding = ref('');

// Helper function to get local datetime string for datetime-local input
const getLocalDateTimeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Filter state with default startDateTime set to now
const filters = ref({
  capacity: null as number | null,
  equipment: [] as string[],
  startDateTime: getLocalDateTimeString() as string | null, // Default to now (local time)
  showBooked: false,
  sortBy: 'name-asc' as 'name-asc' | 'name-desc' | 'capacity-asc' | 'capacity-desc' | 'distance-asc' | 'distance-desc'
});

// Minimum datetime is now
const minDateTime = computed(() => {
  return getLocalDateTimeString();
});

const loading = computed(() => roomsStore.loading);
const error = computed(() => roomsStore.error);
const rooms = computed(() => roomsStore.rooms);
const buildings = computed(() => roomsStore.buildings);

// Extended Room type with distance
interface RoomWithDistance extends Room {
  distance?: DistanceResult | null;
}

const filteredRooms = computed(() => {
  let filtered = rooms.value;

  // Filter by building
  if (filterBuilding.value) {
    filtered = filtered.filter(room => room.buildingId === filterBuilding.value);
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(room =>
      room.name.toLowerCase().includes(query)
    );
  }

  // Filter by capacity
  if (filters.value.capacity !== null) {
    filtered = filtered.filter(room => room.capacity >= filters.value.capacity!);
  }

  // Filter by equipment
  if (filters.value.equipment.length > 0) {
    filtered = filtered.filter(room => {
      return filters.value.equipment.every(equipType => {
        // Check equipment array
        if (room.equipment?.some(eq => eq.type === equipType)) return true;

        // Check boolean flags
        if (equipType === 'projector' && room.hasProjector) return true;
        if (equipType === 'whiteboard' && room.hasWhiteboard) return true;
        if (equipType === 'video_conference' && room.hasVideoConference) return true;

        return false;
      });
    });
  }

  // Filter by availability based on datetime and showBooked toggle
  if (!filters.value.showBooked) {
    // Only show rooms that are available at the selected time
    if (filters.value.startDateTime) {
      const selectedTime = new Date(filters.value.startDateTime);

      filtered = filtered.filter(room => {
        // Check all bookings for this room, not just currentBooking
        const roomBookings = bookingsStore.bookings.filter(b => b.roomId === room.roomId);

        if (roomBookings.length === 0) return true; // No bookings, room is available

        // Room is available if selected time is NOT within any booking's time range
        return !roomBookings.some(booking => {
          const bookingStart = new Date(booking.startTime);
          const bookingEnd = new Date(booking.endTime);

          // Check if selected time falls within this booking
          return selectedTime >= bookingStart && selectedTime < bookingEnd;
        });
      });
    } else {
      // No datetime selected, just hide rooms with current bookings
      filtered = filtered.filter(room => !room.currentBooking);
    }
  }
  // If showBooked is true, show all rooms regardless of booking status

  return filtered;
});

// Rooms with distance calculated
const roomsWithDistance = ref<RoomWithDistance[]>([]);

// Watch for filtered rooms changes and recalculate distances
watch(filteredRooms, async (newRooms) => {
  if (hasLocation.value) {
    roomsWithDistance.value = await calculateDistancesToRooms(newRooms);
  } else {
    roomsWithDistance.value = newRooms;
  }
  applySorting();
}, { immediate: true });

// Apply sorting to rooms with distance
const applySorting = () => {
  roomsWithDistance.value = [...roomsWithDistance.value].sort((a, b) => {
    switch (filters.value.sortBy) {
      case 'capacity-asc':
        return a.capacity - b.capacity; // Smallest first
      case 'capacity-desc':
        return b.capacity - a.capacity; // Largest first
      case 'name-asc':
        return a.name.localeCompare(b.name); // A-Z
      case 'name-desc':
        return b.name.localeCompare(a.name); // Z-A
      case 'distance-asc':
        // Sort by distance - nearest first
        if (a.distance && b.distance) {
          return a.distance.distanceMeters - b.distance.distanceMeters;
        }
        // Push rooms without distance to the end
        if (a.distance) return -1;
        if (b.distance) return 1;
        return 0;
      case 'distance-desc':
        // Sort by distance - farthest first
        if (a.distance && b.distance) {
          return b.distance.distanceMeters - a.distance.distanceMeters;
        }
        // Push rooms without distance to the end
        if (!a.distance && !b.distance) return 0;
        if (!a.distance) return 1;
        if (!b.distance) return -1;
        return 0;
      default:
        return 0;
    }
  });
};

// Watch for sort changes
watch(() => filters.value.sortBy, () => {
  applySorting();
});

// Reset all filters function
const resetFilters = () => {
  filters.value = {
    capacity: null,
    equipment: [],
    startDateTime: getLocalDateTimeString(), // Use local time helper
    showBooked: false,
    sortBy: 'name-asc'
  };
  searchQuery.value = '';
  filterBuilding.value = '';
};

// Request user location and calculate distances
const handleLocationRequest = async () => {
  await requestLocation();
  if (hasLocation.value) {
    roomsWithDistance.value = await calculateDistancesToRooms(filteredRooms.value);
    applySorting();
  }
};

const handleBook = (room: Room) => {
  roomsStore.selectRoom(room);
  router.push({ name: 'new-booking' });
};

const handleViewDetails = (room: Room) => {
  router.push({
    name: 'room-detail',
    params: { id: room.roomId },
    query: { date: filters.value.startDateTime }
  });
};

onMounted(() => {
  roomsStore.fetchRooms();
  roomsStore.fetchBuildings();
  bookingsStore.fetchAllBookings();
});
</script>

<style scoped>
.rooms-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
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
  flex-wrap: wrap;
  align-items: center;
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
  min-width: 200px;
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

/* Equipment filters styling */
.equipment-filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
  margin-top: 1rem;
}

.equipment-filters label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
  transition: all 0.2s;
}

.equipment-filters label:hover {
  border-color: #1976d2;
  background: #e3f2fd;
}

.equipment-filters input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Secondary filters row */
.secondary-filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 1rem;
}

/* DateTime filter styling */
.datetime-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

/* Toggle label styling */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.75rem 1rem;
  background: #e3f2fd;
  border-radius: 4px;
  font-weight: 500;
  border: 1px solid #90caf9;
  transition: all 0.2s;
}

.toggle-label:hover {
  background: #bbdefb;
}

.toggle-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Reset button styling */
.btn-reset {
  padding: 0.75rem 1.5rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-reset:hover {
  background: #d32f2f;
}

.btn-reset:active {
  transform: scale(0.98);
}

/* Location button styling */
.btn-location {
  padding: 0.75rem 1.5rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-location:hover:not(:disabled) {
  background: #45a049;
}

.btn-location:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Location warning */
.location-warning {
  text-align: center;
  padding: 1rem;
  background: #fff3cd;
  color: #856404;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}
</style>
