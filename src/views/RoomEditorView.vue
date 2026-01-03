<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoomsStore } from '@/stores/rooms';
import { roomService } from '@/services/roomService';


type SortKey = 'name' | 'building' | 'floor' | 'capacity';

const roomsStore = useRoomsStore();
const { rooms, buildings, loading, error } = storeToRefs(roomsStore);

// Filter
const search = ref('');
const buildingFilter = ref<string>(''); // buildingId
const minCapacity = ref<number | null>(null);
const projectorOnly = ref(false);
const whiteboardOnly = ref(false);
const videoConfOnly = ref(false);

// Sort
const sortKey = ref<SortKey>('name');
const sortDir = ref<'asc' | 'desc'>('asc');

const buildingNameById = computed(() => {
  const map = new Map<string, string>();
  buildings.value.forEach(b => map.set(b.buildingId, b.name));
  return map;
});

const filteredRooms = computed(() => {
  const q = search.value.trim().toLowerCase();

  return rooms.value.filter(r => {
    if (buildingFilter.value && r.buildingId !== buildingFilter.value) return false;
    if (minCapacity.value != null && r.capacity < minCapacity.value) return false;
    if (projectorOnly.value && !r.hasProjector) return false;
    if (whiteboardOnly.value && !r.hasWhiteboard) return false;
    if (videoConfOnly.value && !r.hasVideoConference) return false;

    if (!q) return true;

    const buildingName = buildingNameById.value.get(r.buildingId) ?? '';
    return (
      r.name.toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q) ||
      buildingName.toLowerCase().includes(q) ||
      String(r.floor).includes(q) ||
      String(r.capacity).includes(q)
    );
  });
});

function compare(a: string | number, b: string | number) {
  return a < b ? -1 : a > b ? 1 : 0;
}

const sortedRooms = computed(() => {
  const list = [...filteredRooms.value];

  list.sort((a, b) => {
    let av: string | number;
    let bv: string | number;

    switch (sortKey.value) {
      case 'capacity':
        av = a.capacity; bv = b.capacity;
        break;
      case 'floor':
        av = a.floor; bv = b.floor;
        break;
      case 'building':
        av = buildingNameById.value.get(a.buildingId) ?? '';
        bv = buildingNameById.value.get(b.buildingId) ?? '';
        break;
      case 'name':
      default:
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
    }

    const c = compare(av, bv);
    return sortDir.value === 'asc' ? c : -c;
  });

  return list;
});

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
}

function yesNo(v?: boolean) {
  return v ? '✓' : '—';
}

const lastTestRoomId = ref<string | null>(null);

async function createTestRoom() {
  if (buildings.value.length === 0) await roomsStore.fetchBuildings();
  if (rooms.value.length === 0) await roomsStore.fetchRooms();

  // set buildingId
  const buildingId =
    buildings.value[0]?.buildingId ??
    rooms.value[0]?.buildingId;

  if (!buildingId) {
    alert('No buildingId available (no buildings and no rooms). Cannot create room.');
    return;
  }

  const created = await roomsStore.createRoom({
    name: `TEST Room ${Date.now()}`,
    floor: 0,
    capacity: 1,
    buildingId,
    description: 'temporary test room',
    hasProjector: false,
    hasWhiteboard: false,
    hasVideoConference: false,
  });

  lastTestRoomId.value = created.roomId;
  alert(`Created test room: ${created.name}`);
}


async function updateTestRoom() {
  if (!lastTestRoomId.value) {
    alert('Create a test room first.');
    return;
  }

  const updated = await roomsStore.updateRoom(lastTestRoomId.value, {
    name: `UPDATED TEST ${Date.now()}`,
  });

  alert(`Updated room name to: ${updated.name}`);
}

async function deleteTestRoom() {
  if (!lastTestRoomId.value) {
    alert('Create a test room first.');
    return;
  }

  const count = await roomService.countBookingsForRoom(lastTestRoomId.value);
  const ok = confirm(`Delete test room? ${count} booking(s) will be removed.`);
  if (!ok) return;

  const { deletedBookings } = await roomsStore.deleteRoom(lastTestRoomId.value);
  alert(`Deleted test room. Removed ${deletedBookings} booking(s).`);
  lastTestRoomId.value = null;
}


onMounted(async () => {
  // building-name-by-id needs buildings to be loaded
  if (buildings.value.length === 0) await roomsStore.fetchBuildings();
  if (rooms.value.length === 0) await roomsStore.fetchRooms();
});
</script>

<template>
  <div class="page">
    <h1>Room Editor</h1>

    <div v-if="error" class="error">{{ error }}</div>
    <div class="actions">
    <button @click="createTestRoom">Create test room</button>
    <button @click="updateTestRoom" :disabled="!lastTestRoomId">Update test room</button>
    <button @click="deleteTestRoom" :disabled="!lastTestRoomId">Delete test room</button>
    </div>


    <div class="filters">
      <input v-model="search" type="text" placeholder="Search (name, building, description…)" />

      <select v-model="buildingFilter">
        <option value="">All buildings</option>
        <option v-for="b in buildings" :key="b.buildingId" :value="b.buildingId">
          {{ b.name }}
        </option>
      </select>

      <input v-model.number="minCapacity" type="number" min="0" placeholder="Min capacity" />

      <label><input v-model="projectorOnly" type="checkbox" /> Projector</label>
      <label><input v-model="whiteboardOnly" type="checkbox" /> Whiteboard</label>
      <label><input v-model="videoConfOnly" type="checkbox" /> Video conf</label>
    </div>

    <div v-if="loading">Loading…</div>

    <table v-else class="table">
      <thead>
        <tr>
          <th @click="toggleSort('name')" role="button">Name</th>
          <th @click="toggleSort('building')" role="button">Building</th>
          <th @click="toggleSort('floor')" role="button">Floor</th>
          <th @click="toggleSort('capacity')" role="button">Capacity</th>
          <th>Description</th>
          <th>Projector</th>
          <th>Whiteboard</th>
          <th>Video conf</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="room in sortedRooms" :key="room.roomId">
          <td>{{ room.name }}</td>
          <td>{{ buildingNameById.get(room.buildingId) ?? room.buildingId }}</td>
          <td>{{ room.floor }}</td>
          <td>{{ room.capacity }}</td>
          <td>{{ room.description ?? '—' }}</td>
          <td class="center">{{ yesNo(room.hasProjector) }}</td>
          <td class="center">{{ yesNo(room.hasWhiteboard) }}</td>
          <td class="center">{{ yesNo(room.hasVideoConference) }}</td>
        </tr>
      </tbody>
    </table>

    <p class="meta">Showing {{ sortedRooms.length }} / {{ rooms.length }} rooms</p>
  </div>
</template>

<style scoped>
.page { padding: 16px; display: grid; gap: 12px; }
.filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.filters input[type="text"] { min-width: 260px; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { border-bottom: 1px solid #ddd; padding: 8px; vertical-align: top; }
.table th { text-align: left; user-select: none; }
.table th[role="button"] { cursor: pointer; }
.center { text-align: center; }
.error { color: #b00020; }
.meta { opacity: 0.8; }
</style>
