import { defineStore } from 'pinia';
import type { Room, Building } from '@/types';
import { roomService, buildingService } from '@/services/roomService';

interface RoomsState {
  rooms: Room[];
  buildings: Building[];
  selectedRoom: Room | null;
  loading: boolean;
  error: string | null;
}

export const useRoomsStore = defineStore('rooms', {
  state: (): RoomsState => ({
    rooms: [],
    buildings: [],
    selectedRoom: null,
    loading: false,
    error: null,
  }),

  getters: {
    getRoomById: (state) => (roomId: string) =>
      state.rooms.find((room: Room) => room.roomId === roomId),

    getRoomsByBuilding: (state) => (buildingId: string) =>
      state.rooms.filter((room: Room) => room.buildingId === buildingId),
  },

  actions: {
    async fetchRooms() {
      this.loading = true;
      try {
        this.rooms = await roomService.getAllRooms();
        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch rooms';
      } finally {
        this.loading = false;
      }
    },

    async fetchBuildings() {
      this.loading = true;
      try {
        this.buildings = await buildingService.getAllBuildings();
        this.error = null;
      } catch (error) {
        console.error('[rooms store] fetchBuildings error:', error);
        this.error = error instanceof Error ? error.message : 'Failed to fetch buildings';
      } finally {
        this.loading = false;
      }
    },

    selectRoom(room: Room | null) {
      this.selectedRoom = room;
    },
  },
});
