<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoomsStore } from '@/stores/rooms';
import { roomService } from '@/services/roomService';
import type { Room } from '@/types';

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

// fallback: wenn buildings leer sind, nimm buildingIds aus rooms (damit man trotzdem auswählen kann)
const buildingOptions = computed(() => {
  if (buildings.value.length > 0) {
    return buildings.value.map(b => ({ id: b.buildingId, label: b.name }));
  }

  const ids = Array.from(new Set(rooms.value.map(r => r.buildingId).filter(Boolean)));
  return ids.map(id => ({ id, label: `Building ${id}` }));
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

// --- Form (Create + Edit) ---
const formOpen = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const editingRoomId = ref<string | null>(null);
const saving = ref(false);
const formError = ref<string | null>(null);

const form = ref({
  buildingId: '',
  name: '',
  floor: 0,
  capacity: 1,
  description: '',
  hasProjector: false,
  hasWhiteboard: false,
  hasVideoConference: false,
});

function openCreateForm() {
  formMode.value = 'create';
  editingRoomId.value = null;
  formError.value = null;

  const defaultBuildingId =
    buildingFilter.value ||
    buildingOptions.value[0]?.id ||
    '';

  form.value = {
    buildingId: defaultBuildingId,
    name: '',
    floor: 0,
    capacity: 1,
    description: '',
    hasProjector: false,
    hasWhiteboard: false,
    hasVideoConference: false,
  };

  formOpen.value = true;
}

function openEditForm(room: Room) {
  formMode.value = 'edit';
  editingRoomId.value = room.roomId;
  formError.value = null;

  form.value = {
    buildingId: room.buildingId ?? '',
    name: room.name ?? '',
    floor: room.floor ?? 0,
    capacity: room.capacity ?? 0,
    description: room.description ?? '',
    hasProjector: !!room.hasProjector,
    hasWhiteboard: !!room.hasWhiteboard,
    hasVideoConference: !!room.hasVideoConference,
  };

  formOpen.value = true;
}

function closeForm() {
  formOpen.value = false;
  formError.value = null;
}

function getErrMsg(e: unknown, fallback: string) {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
  return fallback;
}

async function saveForm() {
  formError.value = null;

  const name = form.value.name.trim();
  if (!name) {
    formError.value = 'Name is required.';
    return;
  }

  if (!form.value.buildingId) {
    formError.value = 'Building is required.';
    return;
  }

  if (!Number.isFinite(form.value.capacity) || form.value.capacity < 0) {
    formError.value = 'Capacity must be a valid number (>= 0).';
    return;
  }

  if (!Number.isFinite(form.value.floor)) {
    formError.value = 'Floor must be a valid number.';
    return;
  }

  saving.value = true;
  try {
    const payload = {
      name,
      buildingId: form.value.buildingId,
      floor: form.value.floor,
      capacity: form.value.capacity,
      description: form.value.description.trim() ? form.value.description.trim() : undefined,
      hasProjector: form.value.hasProjector,
      hasWhiteboard: form.value.hasWhiteboard,
      hasVideoConference: form.value.hasVideoConference,
    };

    if (formMode.value === 'create') {
      await roomsStore.createRoom(payload);
    } else {
      if (!editingRoomId.value) {
        formError.value = 'Missing room id for update.';
        return;
      }
      await roomsStore.updateRoom(editingRoomId.value, payload);
    }

    closeForm();
  } catch (e) {
    formError.value = getErrMsg(e, 'Save failed');
  } finally {
    saving.value = false;
  }
}

// --- Delete ---
async function deleteRoom(roomId: string, roomName: string) {
  try {
    const count = await roomService.countBookingsForRoom(roomId);
    const ok = confirm(`Delete "${roomName}"? ${count} booking(s) will be removed.`);
    if (!ok) return;

    const { deletedBookings } = await roomsStore.deleteRoom(roomId);
    alert(`Deleted "${roomName}". Removed ${deletedBookings} booking(s).`);
  } catch (e) {
    alert(getErrMsg(e, 'Delete failed'));
  }
}

onMounted(async () => {
  if (buildings.value.length === 0) await roomsStore.fetchBuildings();
  if (rooms.value.length === 0) await roomsStore.fetchRooms();
});

// --- Tooling keep-alive (für Projekte, die tsc/noUnusedLocals statt vue-tsc verwenden) ---
void [
  toggleSort,
  yesNo,
  openCreateForm,
  openEditForm,
  closeForm,
  saveForm,
  deleteRoom,
  sortedRooms,
  buildingOptions,
  formOpen,
  formMode,
  editingRoomId,
  formError,
  form,
  saving,
];
</script>

<template>
  <div class="page">
    <h1>Room Editor</h1>

    <div v-if="error" class="error">{{ error }}</div>

    <!-- Create button (wie vorher Create test room) -->
    <div class="actions">
      <button @click="openCreateForm">Create room</button>
    </div>

    <!-- Create/Edit Maske -->
    <div v-if="formOpen" class="form">
      <h2>{{ formMode === 'create' ? 'Create Room' : 'Edit Room' }}</h2>

      <p v-if="formMode === 'edit' && editingRoomId" class="meta">ID: {{ editingRoomId }}</p>

      <div v-if="formError" class="error">{{ formError }}</div>

      <div class="form-grid">
        <label class="full">
          Building
          <select v-model="form.buildingId">
            <option value="" disabled>Select building</option>
            <option v-for="b in buildingOptions" :key="b.id" :value="b.id">
              {{ b.label }}
            </option>
          </select>
        </label>

        <label class="full">
          Name
          <input v-model="form.name" type="text" placeholder="Room name" />
        </label>

        <label>
          Floor
          <input v-model.number="form.floor" type="number" />
        </label>

        <label>
          Capacity
          <input v-model.number="form.capacity" type="number" min="0" />
        </label>

        <label class="full">
          Description
          <input v-model="form.description" type="text" placeholder="Optional" />
        </label>

        <label>
          <input v-model="form.hasProjector" type="checkbox" />
          Projector
        </label>
        <label>
          <input v-model="form.hasWhiteboard" type="checkbox" />
          Whiteboard
        </label>
        <label>
          <input v-model="form.hasVideoConference" type="checkbox" />
          Video conf
        </label>
      </div>

      <div class="form-actions">
        <button @click="saveForm" :disabled="saving">
          {{ formMode === 'create' ? 'Create' : 'Save' }}
        </button>
        <button @click="closeForm" :disabled="saving">Cancel</button>
      </div>
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
          <th>Actions</th>
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
          <td class="actions-cell">
            <button @click="openEditForm(room)">Edit</button>
            <button @click="deleteRoom(room.roomId, room.name)">Delete</button>
          </td>
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

.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.actions button { padding: 6px 10px; }

.form { border: 1px solid #ddd; padding: 12px; border-radius: 6px; display: grid; gap: 10px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.form-grid label { display: grid; gap: 6px; }
.form-grid .full { grid-column: 1 / -1; }
.form-actions { display: flex; gap: 8px; }
.actions-cell { display: flex; gap: 8px; }

.table { width: 100%; border-collapse: collapse; }
.table th, .table td { border-bottom: 1px solid #ddd; padding: 8px; vertical-align: top; }
.table th { text-align: left; user-select: none; }
.table th[role="button"] { cursor: pointer; }
.center { text-align: center; }

.error { color: #b00020; }
.meta { opacity: 0.8; }
</style>
