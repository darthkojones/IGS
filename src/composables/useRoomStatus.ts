import { ref, computed, onMounted, onUnmounted } from 'vue';
import { bookingService } from '@/services/bookingService';

type RoomStatusType = 'available' | 'reserved' | 'occupied';

export function useRoomStatus(roomId: string) {
  const status = ref<RoomStatusType>('available');
  const lastUpdated = ref<Date>(new Date());

  const statusColor = computed(() => {
    switch (status.value) {
      case 'available':
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
      case 'available':
        return 'Available';
      case 'reserved':
        return 'Reserved';
      case 'occupied':
        return 'Occupied';
      default:
        return 'Unknown';
    }
  });

  /**
   * Check if room has a booking that overlaps with current time
   */
  const checkRoomStatus = async () => {
    try {
      // Check if there's an active booking with confirmed entry for right now
      const isOccupied = await bookingService.isRoomOccupied(roomId);
      status.value = isOccupied ? 'occupied' : 'available';
      lastUpdated.value = new Date();
    } catch (error) {
      console.error('Failed to check room status:', error);
    }
  };

  // Check status when composable is mounted and periodically refresh
  onMounted(() => {
    checkRoomStatus();
    // Refresh every 30 seconds
    const interval = setInterval(checkRoomStatus, 30000);

    onUnmounted(() => {
      clearInterval(interval);
    });
  });

  return {
    status,
    statusColor,
    statusText,
    lastUpdated,
    checkRoomStatus,
  };
}
