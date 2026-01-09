import type { Room, Building } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { mapRoomData } from '@/mappers/roomMapper';
import { mapBuildingData } from '@/mappers/buildingMapper';

export type RoomCreateInput = {
  name: string;
  floor: number;
  capacity: number;
  buildingId: string;
  description?: string;
  hasProjector?: boolean;
  hasWhiteboard?: boolean;
  hasVideoConference?: boolean;
};

export type RoomUpdateInput = Partial<RoomCreateInput>;

export const roomService = {
  /**
   * Fetch all rooms from the database
   */
  async getAllRooms(): Promise<Room[]> {
    try {
      const { data, error } = await supabase
        .from('room')
        .select('*')
        .order('name');

      if (error) {
        console.error('Supabase error fetching rooms:', error);
        throw error;
      }

      return (data || []).map(mapRoomData);
    } catch (err) {
      console.error('roomService.getAllRooms error:', err);
      throw err;
    }
  },

  /**
   * Fetch a single room by ID
   */
  async getRoomById(roomId: string): Promise<Room | null> {
    try {
      const { data, error } = await supabase
        .from('room')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (error) {
        console.error('Supabase error fetching room:', error);
        throw error;
      }

      return data ? mapRoomData(data) : null;
    } catch (err) {
      console.error('roomService.getRoomById error:', err);
      throw err;
    }
  },

  /**
   * Fetch rooms by building ID
   */
  async getRoomsByBuilding(buildingId: string): Promise<Room[]> {
    try {
      const { data, error } = await supabase
        .from('room')
        .select('*')
        .eq('building_id', buildingId)
        .order('name');

      if (error) {
        console.error('Supabase error fetching rooms by building:', error);
        throw error;
      }

      return (data || []).map(mapRoomData);
    } catch (err) {
      console.error('roomService.getRoomsByBuilding error:', err);
      throw err;
    }
  },

  /**
   * Fetch rooms by status
   */
  async getRoomsByStatus(status: string): Promise<Room[]> {
    try {
      const { data, error } = await supabase
        .from('room')
        .select('*')
        .eq('status', status)
        .order('name');

      if (error) {
        console.error('Supabase error fetching rooms by status:', error);
        throw error;
      }

      return (data || []).map(mapRoomData);
    } catch (err) {
      console.error('roomService.getRoomsByStatus error:', err);
      throw err;
    }
  },

  /**
   * Fetch available rooms for a given time range
   * Filters out rooms that have active or reserved bookings overlapping with the time range
   */
  async getAvailableRooms(startTime: Date, endTime: Date): Promise<Room[]> {
    try {
      // Get all rooms
      const { data: allRooms, error: roomsError } = await supabase
        .from('room')
        .select('*')
        .order('name');

      if (roomsError) {
        console.error('Supabase error fetching rooms:', roomsError);
        throw roomsError;
      }

      // Get all bookings that overlap with the requested time range
      const { data: bookings, error: bookingsError } = await supabase
        .from('booking')
        .select('*')
        .in('status', ['reserved', 'active'])
        .or(
          `and(start_time.lt.${endTime.toISOString()},end_time.gt.${startTime.toISOString()})`
        );

      if (bookingsError) {
        console.error('Supabase error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      // Get set of room IDs that have bookings during the requested time
      const bookedRoomIds = new Set((bookings || []).map(b => b.room_id));

      // Filter out rooms that have bookings
      return (allRooms || [])
        .filter(room => !bookedRoomIds.has(room.room_id))
        .map(mapRoomData);
    } catch (err) {
      console.error('roomService.getAvailableRooms error:', err);
      throw err;
    }
  },

  /**
   * Control room equipment/facilities (doors, lights, ventilation)
   * Note: Requires a room_control table to be implemented in Supabase
   */
  async controlRoomEquipment(
    roomId: string,
    controls: { doors?: boolean; lights?: boolean; ventilation?: boolean }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('room_control')
        .upsert(
          {
            room_id: roomId,
            doors: controls.doors,
            lights: controls.lights,
            ventilation: controls.ventilation,
          },
          { onConflict: 'room_id' }
        );

      if (error) {
        console.error('Supabase error controlling room equipment:', error);
        throw error;
      }
    } catch (err) {
      console.error('roomService.controlRoomEquipment error:', err);
      throw err;
    }
  },

  /**
   * Count bookings for a room (for delete checks)
   */
  async countBookingsForRoom(roomId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('booking')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId);

      if (error) {
        console.error('Supabase error counting bookings:', error);
        throw error;
      }

      return count ?? 0;
    } catch (err) {
      console.error('roomService.countBookingsForRoom error:', err);
      throw err;
    }
  },

  /**
   * Create a room
   */
  async createRoom(input: RoomCreateInput): Promise<Room> {
    try {
      const payload = {
        name: input.name,
        floor: input.floor,
        capacity: input.capacity,
        building_id: input.buildingId,
        description: input.description ?? null,
        has_projector: input.hasProjector ?? false,
        has_whiteboard: input.hasWhiteboard ?? false,
        has_video_conference: input.hasVideoConference ?? false,
      };

      const { data, error } = await supabase
        .from('room')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        console.error('Supabase error creating room:', error);
        throw error;
      }

      return mapRoomData(data as unknown as Record<string, unknown>);
    } catch (err) {
      console.error('roomService.createRoom error:', err);
      throw err;
    }
  },

  /**
   * Update a room
   */
  async updateRoom(roomId: string, patch: RoomUpdateInput): Promise<Room> {
    try {
      const payload: Record<string, unknown> = {};

      if (patch.name !== undefined) payload.name = patch.name;
      if (patch.floor !== undefined) payload.floor = patch.floor;
      if (patch.capacity !== undefined) payload.capacity = patch.capacity;
      if (patch.buildingId !== undefined) payload.building_id = patch.buildingId;
      if (patch.description !== undefined) payload.description = patch.description ?? null;

      if (patch.hasProjector !== undefined) payload.has_projector = patch.hasProjector;
      if (patch.hasWhiteboard !== undefined) payload.has_whiteboard = patch.hasWhiteboard;
      if (patch.hasVideoConference !== undefined) payload.has_video_conference = patch.hasVideoConference;

      const { data, error } = await supabase
        .from('room')
        .update(payload)
        .eq('room_id', roomId)
        .select('*')
        .single();

      if (error) {
        console.error('Supabase error updating room:', error);
        throw error;
      }

      return mapRoomData(data as unknown as Record<string, unknown>);
    } catch (err) {
      console.error('roomService.updateRoom error:', err);
      throw err;
    }
  },

  /**
   * Delete a room and (optionally) its bookings.
   * Returns how many bookings were removed so UI can inform the user.
   */
  async deleteRoom(roomId: string): Promise<{ deletedBookings: number }> {
    try {
      const bookingCount = await this.countBookingsForRoom(roomId);

      // 1) delete bookings first (fits your task requirement)
      if (bookingCount > 0) {
        const { error: bookingsError } = await supabase
          .from('booking')
          .delete()
          .eq('room_id', roomId);

        if (bookingsError) {
          console.error('Supabase error deleting bookings for room:', bookingsError);
          throw bookingsError;
        }
      }

      // 2) delete room
      const { error: roomError } = await supabase
        .from('room')
        .delete()
        .eq('room_id', roomId);

      if (roomError) {
        console.error('Supabase error deleting room:', roomError);
        throw roomError;
      }

      return { deletedBookings: bookingCount };
    } catch (err) {
      console.error('roomService.deleteRoom error:', err);
      throw err;
    }
  },
};

export const buildingService = {
  async getAllBuildings(): Promise<Building[]> {
    try {
      console.log('[buildingService] getAllBuildings() called');
      console.log('[buildingService] executing supabase query...');

      const { data, error } = await supabase
        .from('building')
        .select('*')
        .order('name');

      if (error) {
        console.error('[buildingService] Supabase error fetching buildings:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      if (!data) {
        return [];
      }

      const mapped = (data || []).map((item: Record<string, unknown>) => mapBuildingData(item));

      return mapped;
    } catch (err) {
      console.error('[buildingService] getAllBuildings error:', err);
      throw err;
    }
  },

  async getBuildingById(buildingId: string): Promise<Building | null> {
    try {
      const { data, error } = await supabase
        .from('building')
        .select('*')
        .eq('id', buildingId)
        .single();

      if (error) {
        console.error('[buildingService] Supabase error fetching building:', error);
        throw error;
      }

      if (!data) return null;

      const mapped = mapBuildingData(data);
      return mapped;
    } catch (err) {
      console.error('[buildingService] getBuildingById error:', err);
      throw err;
    }
  },
};
