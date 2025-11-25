import type { Room, Building } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const roomService = {
  async getAllRooms(): Promise<Room[]> {
    const response = await fetch(`${API_BASE_URL}/rooms`);
    if (!response.ok) throw new Error('Failed to fetch rooms');
    return response.json();
  },

  async getRoomById(roomId: string): Promise<Room> {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`);
    if (!response.ok) throw new Error('Failed to fetch room');
    return response.json();
  },

  async getRoomsByBuilding(buildingId: string): Promise<Room[]> {
    const response = await fetch(`${API_BASE_URL}/buildings/${buildingId}/rooms`);
    if (!response.ok) throw new Error('Failed to fetch rooms');
    return response.json();
  },

  async getAvailableRooms(startTime: Date, endTime: Date): Promise<Room[]> {
    const params = new URLSearchParams({
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    });
    const response = await fetch(`${API_BASE_URL}/rooms/available?${params}`);
    if (!response.ok) throw new Error('Failed to fetch available rooms');
    return response.json();
  },

  async updateRoomStatus(roomId: string, status: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update room status');
  },

  async controlRoomEquipment(roomId: string, controls: { doors?: boolean; lights?: boolean; ventilation?: boolean }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/controls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(controls),
    });
    if (!response.ok) throw new Error('Failed to control room equipment');
  },
};

export const buildingService = {
  async getAllBuildings(): Promise<Building[]> {
    const response = await fetch(`${API_BASE_URL}/buildings`);
    if (!response.ok) throw new Error('Failed to fetch buildings');
    return response.json();
  },

  async getBuildingById(buildingId: string): Promise<Building> {
    const response = await fetch(`${API_BASE_URL}/buildings/${buildingId}`);
    if (!response.ok) throw new Error('Failed to fetch building');
    return response.json();
  },
};
