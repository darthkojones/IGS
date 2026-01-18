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
        <span class="room-card__status-text">{{ timeRemainingText || statusText }}</span>
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
      <!--
       <button
         v-if="isAvailable"
         class="btn btn--primary"
         @click="$emit('book', room)"
         :aria-label="`Book ${room.name}`"
       >
        Book Now
       </button> -->
       <button
         class="btn btn--primary"
         @click="$emit('view-details', room)"
         :aria-label="`View details for ${room.name}`"
       >
         View & Book
       </button>
     </div>
   </div>
 </template>

 <script setup lang="ts">
 import { computed } from 'vue';
 import type { Room, Booking } from '@/types';
 import { useRoomStatus } from '@/composables/useRoomStatus';

 interface Props {
   room: Room;
   showReachability?: boolean;
   travelTime?: number;
   selectedDatetime?: string | null;
   allBookings?: Booking[];
 }

 const props = withDefaults(defineProps<Props>(), {
   showReachability: false,
   travelTime: 0,
   selectedDatetime: null,
   allBookings: () => [],
 });

 // Check if room is booked at the selected datetime
 const bookingAtSelectedTime = computed(() => {
   if (!props.selectedDatetime) return null;

   const selectedTime = new Date(props.selectedDatetime);
   const roomBookings = props.allBookings.filter(b => b.roomId === props.room.roomId);

   return roomBookings.find(booking => {
     const bookingStart = new Date(booking.startTime);
     const bookingEnd = new Date(booking.endTime);
     return selectedTime >= bookingStart && selectedTime < bookingEnd;
   });
 });

 // Override status if room is booked at selected time
 const statusColor = computed(() => {
   if (bookingAtSelectedTime.value) return 'yellow';
   return useRoomStatus(props.room.roomId, props.room.currentBooking).statusColor.value;
 });

 const statusText = computed(() => {
   if (bookingAtSelectedTime.value) return 'Reserved';
   return useRoomStatus(props.room.roomId, props.room.currentBooking).statusText.value;
 });

 const timeRemainingText = computed(() => {
   if (bookingAtSelectedTime.value) {
     const endTime = new Date(bookingAtSelectedTime.value.endTime);
     const hours = endTime.getHours();
     const minutes = endTime.getMinutes();
     const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
     return `Occupied until ${formattedTime}`;
   }
   return useRoomStatus(props.room.roomId, props.room.currentBooking).timeRemainingText.value;
 });

 const isAvailable = computed(() => !bookingAtSelectedTime.value && statusText.value === 'Available');
 </script>

 <style scoped>
 .room-card {
   border: 1px solid var(--color-border);
   border-radius: 8px;
   padding: 1.5rem;
   background: var(--color-card-bg);
   transition: box-shadow 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
 }

 .room-card:hover {
   box-shadow: var(--shadow-lg);
   background: var(--color-card-hover);
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
   color: var(--color-heading);
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
   background: var(--color-surface-soft);
   padding: 0.25rem 0.75rem;
   border-radius: 1rem;
   font-size: 0.8125rem;
   color: var(--color-text);
 }

 .room-card__footer {
   display: flex;
   gap: 0.75rem;
   margin-top: 1rem;
   justify-content: flex-end;
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
   background: var(--color-primary);
   color: var(--color-primary-text);
 }

 .btn--primary:hover {
   background: var(--color-primary-hover);
 }

 .btn--secondary {
   background: transparent;
   color: var(--color-primary);
   border: 1px solid var(--color-primary);
 }

 .btn--secondary:hover {
   background: var(--color-primary-light);
 }
 </style>
