import type { Room, Building } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { mapRoomData } from '@/mappers/roomMapper';
import { mapBuildingData } from '@/mappers/buildingMapper';

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
