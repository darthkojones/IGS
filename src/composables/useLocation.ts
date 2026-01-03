/**
 * Composable for managing user location and calculating distances to rooms
 */

import { ref, computed } from 'vue';
import { distanceService, type Coordinates, type DistanceResult } from '@/services/distanceService';
import type { Room } from '@/types';

interface RoomWithDistance extends Room {
  distance?: DistanceResult;
}

const userLocation = ref<Coordinates | null>(null);
const locationError = ref<string | null>(null);
const locationLoading = ref(false);

export function useLocation() {
  /**
   * Request user's current location
   */
  const requestLocation = async () => {
    locationLoading.value = true;
    locationError.value = null;

    try {
      userLocation.value = await distanceService.getCurrentLocation();
    } catch (error) {
      locationError.value = error instanceof Error ? error.message : 'Failed to get location';
      console.error('Location request failed:', error);
    } finally {
      locationLoading.value = false;
    }
  };

  /**
   * Calculate distance from user's location to a specific room
   */
  const calculateDistanceToRoom = async (room: Room): Promise<DistanceResult | null> => {
    if (!userLocation.value) {
      return null;
    }

    // Get building coordinates
    const building = room.building;
    if (!building || (!building.latitude || !building.longitude)) {
      console.warn(`No coordinates for building ${building?.name || 'unknown'}`);
      return null;
    }

    const destination: Coordinates = {
      latitude: building.latitude,
      longitude: building.longitude,
    };

    try {
      return await distanceService.calculateDistance(userLocation.value, destination);
    } catch (error) {
      console.error('Distance calculation failed:', error);
      return null;
    }
  };

  /**
   * Calculate distances to all rooms
   */
  const calculateDistancesToRooms = async (rooms: Room[]): Promise<RoomWithDistance[]> => {
    if (!userLocation.value) {
      return rooms;
    }

    const roomsWithDistance: RoomWithDistance[] = await Promise.all(
      rooms.map(async (room) => {
        const distance = await calculateDistanceToRoom(room);
        return {
          ...room,
          distance,
        };
      })
    );

    return roomsWithDistance;
  };

  /**
   * Check if location is available
   */
  const hasLocation = computed(() => userLocation.value !== null);

  /**
   * Clear stored location
   */
  const clearLocation = () => {
    userLocation.value = null;
    locationError.value = null;
  };

  return {
    userLocation,
    locationError,
    locationLoading,
    hasLocation,
    requestLocation,
    calculateDistanceToRoom,
    calculateDistancesToRooms,
    clearLocation,
  };
}
