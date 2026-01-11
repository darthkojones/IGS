<template>
  <div class="room-detail-view">
    <button class="back-btn" @click="$router.back()" aria-label="Go back">← Back to Rooms</button>

    <div v-if="loadingRoom" class="loading-state" role="status">
      <div class="spinner"></div>
      <p>Loading room details...</p>
    </div>

    <div v-else-if="!room" class="error-state" role="alert">
      <h2>Room not found</h2>
      <p>The room you're looking for doesn't exist or has been removed.</p>
      <button class="btn btn--primary" @click="$router.push('/rooms')">Back to Rooms</button>
    </div>

    <div v-else class="room-grid">
      <header class="room-header">
        <div class="header-left">
          <div class="header-main">
            <h1>{{ room.name }}</h1>
            <p class="room-location">
              Floor {{ room.floor }} • {{ getBuildingName(room.buildingId) }}
            </p>
          </div>
          <div class="status-container">
               <RoomStatusDisplay :room-id="room.roomId" :current-booking="room.currentBooking" />
          </div>
        </div>

        <div class="header-right">
          <img
            :src="roomImage"
            :alt="room.name"
            class="room-image"
          />
        </div>
      </header>

      <div class="main-content">
        <!-- Room Details & Features -->
        <section class="card info-card">
          <h2>About this Room</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Capacity</span>
              <span class="value">{{ room.capacity }} people</span>
            </div>
            <div class="info-item" v-if="room.description">
              <span class="label">Description</span>
              <span class="value">{{ room.description }}</span>
            </div>
          </div>

          <h3 class="section-title">Features & Equipment</h3>
          <ul class="equipment-list">
            <li v-if="room.hasProjector" class="equipment-pill">📽️ Projector</li>
            <li v-if="room.hasWhiteboard" class="equipment-pill">📝 Whiteboard</li>
            <li v-if="room.hasVideoConference" class="equipment-pill">📹 Video Conf.</li>
            <li v-for="item in room.equipment" :key="item.equipmentId" class="equipment-pill">
              🔧 {{ item.name }}
            </li>
            <li v-if="!hasAnyEquipment" class="no-equipment">No specific equipment listed</li>
          </ul>
        </section>

        <!-- Schedule Section -->
        <section class="card schedule-card">
          <div class="schedule-header">
            <h2>Room Schedule</h2>
            <div class="day-picker">
              <button
                class="icon-btn"
                @click="changeDay(-1)"
                :disabled="isToday"
                :class="{ 'is-disabled': isToday }"
                aria-label="Previous day"
              >◀</button>
              <span class="current-day">{{ displayDate }}</span>
              <button class="icon-btn" @click="changeDay(1)" aria-label="Next day">▶</button>
            </div>
          </div>

          <div v-if="loadingBookings" class="loading-inline">
            <p>Updating schedule...</p>
          </div>

          <div v-else-if="roomBookings.length" class="timeline">
            <div
              v-for="booking in roomBookings"
              :key="booking.bookingId"
              class="timeline-item"
              :class="{ 'is-own': isOrganizer(booking) }"
            >
              <div class="time-col">
                <span class="time-start">{{ formatLocalTime(booking.startTime) }}</span>
                <span class="time-end">{{ formatLocalTime(booking.endTime) }}</span>
              </div>
              <div class="content-col">
                <div class="booking-top">
                  <strong>{{ booking.title }}</strong>
                  <span class="status-badge" :class="`status--${booking.status}`">
                    {{ booking.status }}
                  </span>
                </div>

                <div class="booking-actions" v-if="isOrganizer(booking)">
                  <button
                    v-if="checkInAllowed(booking)"
                    class="btn btn--primary btn--sm"
                    @click="handleCheckIn(booking.bookingId)"
                    :disabled="bookingsStore.loading"
                  >
                    Check-in
                  </button>
                  <button
                    class="btn btn--danger-outline btn--sm"
                    @click="handleCancel(booking.bookingId)"
                    :disabled="bookingsStore.loading"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-schedule">
            <p>No bookings scheduled for this day.</p>
          </div>
        </section>
      </div>

      <!-- Booking Sidebar -->
      <aside class="sidebar">
        <div class="card booking-card">
          <BookingForm
            :selected-room="room"
            :initial-date="formattedDate"
            :initial-time="initialTime"
            :loading="bookingsStore.loading"
            :error="bookingsStore.error"
            @submit="onBookingSubmit"
            @cancel="$router.back()"
          />
        </div>
      </aside>
    </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import RoomStatusDisplay from '@/components/RoomStatusDisplay.vue'
import BookingForm from '@/components/BookingForm.vue'
import { useRoomsStore } from '@/stores/rooms'
import { useBookingsStore } from '@/stores/bookings'
import { useAuthStore } from '@/stores/auth'
import { bookingService } from '@/services/bookingService'
import { formatLocalTime, formatLocalDate } from '@/utils/timezoneUtils'
import { type Booking, type User, type Room, BookingStatus } from '@/types'

import meetingSmall from '@/assets/icons/meeting_small.png'
import meetingMiddle from '@/assets/icons/meeting_midlle.png'
import meetingBig from '@/assets/icons/meeting_big.png'

const route = useRoute()
const roomsStore = useRoomsStore()
const bookingsStore = useBookingsStore()
const authStore = useAuthStore()

const roomImage = computed(() => {
  if (!room.value) return meetingBig
  if (room.value.capacity <= 10) return meetingSmall
  if (room.value.capacity <= 20) return meetingMiddle
  return meetingBig
})

// --- Room Data ---
const roomId = computed(() => route.params.id as string)
const room = computed<Room | undefined>(() => roomsStore.getRoomById(roomId.value))
const loadingRoom = computed(() => roomsStore.loading)

const hasAnyEquipment = computed(() => {
  if (!room.value) return false
  return (
    room.value.hasProjector ||
    room.value.hasWhiteboard ||
    room.value.hasVideoConference ||
    (room.value.equipment && room.value.equipment.length > 0)
  )
})

const getBuildingName = (buildingId: string) => {
  const b = roomsStore.buildings.find((x) => x.buildingId === buildingId)
  return b?.name || 'Main Building'
}

// --- Date Management, from RoomsView if available---
const getInitialDate = () => {
  const queryDate = route.query.date as string
  if (queryDate) {
    return new Date(queryDate)
  }
  return new Date()
}

const selectedDate = ref(getInitialDate())

const isToday = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const current = new Date(selectedDate.value)
  current.setHours(0, 0, 0, 0)
  return current.getTime() <= today.getTime()
})

const initialTime = computed(() => {
  const queryDate = route.query.date
  if (typeof queryDate === 'string' && queryDate.includes('T')) {
    const parts = queryDate.split('T')
    if (parts.length > 1 && parts[1]) {
      return parts[1].slice(0, 5)
    }
  }
  return ''
})

const formattedDate = computed(() => {
  const d = selectedDate.value
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const displayDate = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compare = new Date(selectedDate.value)
  compare.setHours(0, 0, 0, 0)

  if (today.getTime() === compare.getTime()) return 'Today'
  return formatLocalDate(selectedDate.value)
})

function changeDay(delta: number) {
  if (delta < 0 && isToday.value) return // Verhindert das Blättern vor "Heute"

  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() + delta)
  selectedDate.value = d
}

// --- Bookings ---
const loadingBookings = ref(false)
const dayBookings = ref<Booking[]>([])

async function fetchBookings() {
  if (!roomId.value) return
  loadingBookings.value = true
  try {
    const start = new Date(selectedDate.value)
    start.setHours(0, 0, 0, 0)
    const end = new Date(selectedDate.value)
    end.setHours(23, 59, 59, 999)

    const all = await bookingService.getBookingsByTimeRange(start, end)
    dayBookings.value = all
      .filter((b: Booking) => b.roomId === roomId.value)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  } catch (e) {
    console.error('Failed to load schedule:', e)
  } finally {
    loadingBookings.value = false
  }
}

const roomBookings = computed(() => dayBookings.value)

// --- Actions & Permissions ---
const currentUserId = computed(() => (authStore.currentUser as User | null)?.userId || null)

function isOrganizer(booking: Booking) {
  const organizerId = booking.userId
  return !!currentUserId.value && organizerId === currentUserId.value
}

function checkInAllowed(booking: Booking) {
  if (booking.status !== 'reserved') return false
  const now = new Date()
  const start = new Date(booking.startTime)
  const diffMin = (start.getTime() - now.getTime()) / 60000
  return diffMin <= 15 && diffMin >= -15 // Window reduced for better UX
}

async function handleCancel(bookingId: string) {
  if (confirm('Cancel this booking?')) {
    try {
      await bookingsStore.cancelBooking(bookingId)
      await fetchBookings()
    } catch  {
      alert('Could not cancel booking.')
    }
  }
}

async function handleCheckIn(bookingId: string) {
  try {
    await bookingsStore.confirmEntry(bookingId, 'manual')
    await fetchBookings()
  } catch  {
    alert('Check-in failed.')
  }
}

async function onBookingSubmit(bookingData: Partial<Booking>) {
  if (!currentUserId.value) {
    alert('Please log in to book a room.')
    return
  }

  try {
    const payload: Omit<Booking, 'bookingId' | 'createdAt'> = {
      roomId: roomId.value,
      userId: currentUserId.value,
      title: bookingData.title || 'Meeting',
      startTime: bookingData.startTime as Date,
      endTime: bookingData.endTime as Date,
      status: BookingStatus.RESERVED,
    }

    await bookingsStore.createBooking(payload)
    await fetchBookings()
  } catch  {
    // Error is handled in the store and displayed via props.error in BookingForm
  }
}

// --- Lifecycle ---
onMounted(async () => {
  if (!roomsStore.rooms.length) await roomsStore.fetchRooms()
  if (!roomsStore.buildings.length) await roomsStore.fetchBuildings()
  await fetchBookings()
})

watch(formattedDate, fetchBookings)
</script>

##############################################################
// ... existing code ...
<style scoped>
.room-detail-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;  background: var(--color-background);
  min-height: 100vh;}

.back-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #1e293b;
}

.room-grid {
  display: grid;
  grid-template-areas:
    'header header'
    'main sidebar';
  grid-template-columns: 1fr 380px;
  gap: 1.5rem;
}

.room-header {
  grid-area: header;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  background: var(--color-card-bg);
  padding: 0;
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.header-left {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0,75rem;
  flex: 1;
}

.header-main h1 {
  margin: 0;
  font-size: 1.85rem;
  color: var(--color-heading);
}

.room-location {
  color: var(--color-text-soft);
  margin: 0.25rem 0 0;
}

.status-container {
  display: flex;
  justify-content: flex-start;
}

/* Umstyling von RoomStatusDisplay im Stil der RoomCard */
.status-container :deep(.room-status-display) {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  background: #f1f5f9;
  border: none;
  text-align: left;
  min-width: fit-content;
}

.status-container :deep(.status-indicator) {
  margin: 0;
  flex-direction: row;
  gap: 0.5rem;
}

.status-container :deep(.status-light) {
  width: 10px;
  height: 10px;
  box-shadow: none;
  animation: none;
}

.status-container :deep(.status-label) {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: none;
}

/* Ausblenden der großen Info-Blöcke der Komponente */
.status-container :deep(.booking-info),
.status-container :deep(.next-booking) {
  display: none;
}

/* Spezifische Farben passend zur RoomCard */
.status-container :deep(.room-status-display--green) {
  background: #e6f7e6;
  color: #2d862d;
}
.status-container :deep(.room-status-display--green .status-light) {
  background: #2d862d !important;
}

.status-container :deep(.room-status-display--yellow) {
  background: #fff8e6;
  color: #b38600;
}
.status-container :deep(.room-status-display--yellow .status-light) {
  background: #ffc107 !important;
}

.status-container :deep(.room-status-display--red) {
  background: #ffe6e6;
  color: #c62828;
}
.status-container :deep(.room-status-display--red .status-light) {
  background: #c62828 !important;
}

.header-right {
  width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 1rem;
}

.room-image {
  /* Passt sich dynamisch an die Höhe des Containers (und damit des Textes) an */
  height: 100%;
  max-height: 60px; /* Begrenzt das Icon, damit es nicht größer als die Textgruppe wird */
  width: auto;
  object-fit: contain;
}

.room-image:hover {
  opacity: 0.9;
}

/* Lightbox Styles */
.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: zoom-out;
  padding: 2rem;
}

.lightbox-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.lightbox-content img {
  width: 100%;
  height: auto;
  max-height: 90vh;
  border-radius: 8px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.5);
}

.close-lightbox {
  position: absolute;
  top: -40px;
  right: -40px;
  background: none;
  border: none;
  color: white;
  font-size: 2.5rem;
  cursor: pointer;
  line-height: 1;
}

.image-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.main-content {
  grid-area: main;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sidebar {
  grid-area: sidebar;
}

.card {
  background: var(--color-card-bg);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  padding: 1.5rem;
  transition: background-color 0.3s ease;
}

h2 {
  font-size: 1.25rem;
  margin: 0 0 1.25rem;
  color: var(--color-heading);
}

.section-title {
  font-size: 1rem;
  margin: 1.5rem 0 0.75rem;
  color: var(--color-text-soft);
}

/* Info Card */
.info-grid {
  display: grid;
  gap: 1rem;
}

.label {
  display: block;
  font-size: 0.8rem;
  text-transform: uppercase;
  color: var(--color-text-muted);
  letter-spacing: 0.025em;
  margin-bottom: 0.2rem;
}

.value {
  color: var(--color-text);
  font-weight: 500;
}

.equipment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.equipment-pill {
  background: var(--color-surface-soft);
  color: var(--color-text);
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Schedule */
.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.day-picker {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f8fafc;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
}

.current-day {
  font-weight: 600;
  min-width: 100px;
  text-align: center;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.icon-btn:hover {
  background: #e2e8f0;
}

.icon-btn.is-disabled {
  opacity: 0.3;
  cursor: not-allowed;
  filter: grayscale(1);
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timeline-item {
  display: flex;
  gap: 1.5rem;
  padding: 1rem;
  border-radius: 8px;
  background: #f8fafc;
  border-left: 4px solid #cbd5e1;
}

.timeline-item.is-own {
  background: var(--color-primary-light);
  border-left-color: var(--color-primary);
}

.time-col {
  display: flex;
  flex-direction: column;
  min-width: 80px;
  font-variant-numeric: tabular-nums;
}

.time-start {
  font-weight: 700;
  color: var(--color-heading);
}

.time-end {
  font-size: 0.85rem;
  color: var(--color-text-soft);
}

.content-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.booking-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.status--reserved {
  background: #fef3c7;
  color: #92400e;
}

.status--active {
  background: #dcfce7;
  color: #166534;
}

.booking-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-size: 0.9rem;
}

.btn--sm {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
}

.btn--primary {
  background: #2563eb;
  color: white;
}

.btn--danger-outline {
  background: white;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 1rem;
}

@media (max-width: 1024px) {
  .room-grid {
    grid-template-areas:
      'header'
      'sidebar'
      'main';
    grid-template-columns: 1fr;
  }

  .header-right {
    display: none;
  }
}
</style>
