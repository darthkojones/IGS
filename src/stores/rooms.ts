import { defineStore } from 'pinia';
import type { Room, Building } from '@/types';
import { roomService, buildingService, type RoomCreateInput, type RoomUpdateInput } from '@/services/roomService';

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

    async createRoom(input: RoomCreateInput) {
      this.loading = true;
      try {
        const created = await roomService.createRoom(input);
        this.rooms.push(created);
        this.error = null;
        return created;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create room';
        throw error;
      } finally {
        this.loading = false;
      }
    },

   async updateRoom(roomId: string, patch: RoomUpdateInput) {
    this.loading = true;
    try {
      const updated = await roomService.updateRoom(roomId, patch);
      const idx = this.rooms.findIndex(r => r.roomId === roomId);
      if (idx !== -1) this.rooms[idx] = updated;
      this.error = null;
      return updated;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to update room';
      throw error;
    } finally {
      this.loading = false;
    }
  },

  async deleteRoom(roomId: string) {
    this.loading = true;
    try {
      const result = await roomService.deleteRoom(roomId); // { deletedBookings }
      this.rooms = this.rooms.filter(r => r.roomId !== roomId);
      this.error = null;
      return result;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to delete room';
      throw error;
    } finally {
      this.loading = false;
    }
  },

    selectRoom(room: Room | null) {
      this.selectedRoom = room;
    },
  },
});
