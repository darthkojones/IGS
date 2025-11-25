import { ref, computed, onMounted, onUnmounted } from 'vue';
import { RoomStatus } from '@/types';

export function useRoomStatus(roomId: string) {
  const status = ref<RoomStatus>(RoomStatus.FREE);
  const lastUpdated = ref<Date>(new Date());

  const statusColor = computed(() => {
    switch (status.value) {
      case RoomStatus.FREE:
        return 'green';
      case RoomStatus.RESERVED:
        return 'yellow';
      case RoomStatus.OCCUPIED:
        return 'red';
      default:
        return 'gray';
    }
  });

  const statusText = computed(() => {
    switch (status.value) {
      case RoomStatus.FREE:
        return 'Available';
      case RoomStatus.RESERVED:
        return 'Reserved';
      case RoomStatus.OCCUPIED:
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
