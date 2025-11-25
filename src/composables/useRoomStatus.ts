import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { RoomStatus } from '@/types';

export function useRoomStatus(roomId: string) {
  const status = ref<RoomStatus>('free');
  const lastUpdated = ref<Date>(new Date());

  const statusColor = computed(() => {
    switch (status.value) {
      case 'free':
        return 'green';
      case 'reserved':
        return 'yellow';
      case 'occupied':
        return 'red';
      default:
        return 'gray';
    }
  });

  const statusText = computed(() => {
    switch (status.value) {
      case 'free':
        return 'Available';
      case 'reserved':
        return 'Reserved';
      case 'occupied':
        return 'Occupied';
      default:
        return 'Unknown';
    }
  });

  const updateStatus = (newStatus: RoomStatus) => {
    status.value = newStatus;
    lastUpdated.value = new Date();
  };

  return {
    status,
    statusColor,
    statusText,
    lastUpdated,
    updateStatus,
  };
}
