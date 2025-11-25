import { defineStore } from 'pinia';
import type { Room, Building, RoomStatus } from '@/types';

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
    availableRooms: (state) => state.rooms.filter((room: Room) => room.status === 'free'),
    
    getRoomById: (state) => (roomId: string) => 
      state.rooms.find((room: Room) => room.roomId === roomId),
    
    getRoomsByBuilding: (state) => (buildingId: string) =>
      state.rooms.filter((room: Room) => room.buildingId === buildingId),
    
    getRoomsByStatus: (state) => (status: RoomStatus) =>
      state.rooms.filter((room: Room) => room.status === status),
  },

  actions: {
    async fetchRooms() {
      this.loading = true;
      try {
        // TODO: Implement API call
        // Mock data for now
        this.rooms = [
          {
            roomId: 'room-101',
            name: 'Conference Room A',
            buildingId: 'building-1',
            capacity: 12,
            hasProjector: true,
            hasWhiteboard: true,
            hasVideoConference: true,
            status: 'free' as RoomStatus,
            floor: 1,
            description: 'Large conference room with video conferencing capabilities',
            equipment: [],
          },
          {
            roomId: 'room-102',
            name: 'Meeting Room B',
            buildingId: 'building-1',
            capacity: 6,
            hasProjector: false,
            hasWhiteboard: true,
            hasVideoConference: false,
            status: 'free' as RoomStatus,
            floor: 1,
            description: 'Small meeting room perfect for team discussions',
            equipment: [],
          },
          {
            roomId: 'room-201',
            name: 'Executive Boardroom',
            buildingId: 'building-1',
            capacity: 20,
            hasProjector: true,
            hasWhiteboard: true,
            hasVideoConference: true,
            status: 'free' as RoomStatus,
            floor: 2,
            description: 'Premium boardroom with state-of-the-art equipment',
            equipment: [],
          },
          {
            roomId: 'room-202',
            name: 'Training Room',
            buildingId: 'building-1',
            capacity: 30,
            hasProjector: true,
            hasWhiteboard: true,
            hasVideoConference: false,
            status: 'reserved' as RoomStatus,
            floor: 2,
            description: 'Large training room with flexible seating',
            equipment: [],
          },
          {
            roomId: 'room-301',
            name: 'Innovation Lab',
            buildingId: 'building-2',
            capacity: 8,
            hasProjector: true,
            hasWhiteboard: true,
            hasVideoConference: true,
            status: 'free' as RoomStatus,
            floor: 3,
            description: 'Creative space for brainstorming and innovation',
            equipment: [],
          },
          {
            roomId: 'room-302',
            name: 'Focus Room',
            buildingId: 'building-2',
            capacity: 4,
            hasProjector: false,
            hasWhiteboard: false,
            hasVideoConference: true,
            status: 'free' as RoomStatus,
            floor: 3,
            description: 'Quiet space for focused work and small meetings',
            equipment: [],
          },
        ];
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
        // TODO: Implement API call
        this.buildings = [
          {
            buildingId: 'building-1',
            name: 'Main Building',
            address: '123 Campus Drive',
            institutionId: 'mci-001',
          },
          {
            buildingId: 'building-2',
            name: 'Innovation Center',
            address: '456 Research Way',
            institutionId: 'mci-001',
          },
        ];
        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch buildings';
      } finally {
        this.loading = false;
      }
    },

    selectRoom(room: Room | null) {
      this.selectedRoom = room;
    },

    updateRoomStatus(roomId: string, status: RoomStatus) {
      const room = this.rooms.find((r: Room) => r.roomId === roomId);
      if (room) {
        room.status = status;
      }
    },
  },
});
