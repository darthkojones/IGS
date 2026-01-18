import type { Room, Building } from '@/types';

/**
 * Map a room row from the `room` table to the application's `Room` type.
 */
export function mapRoomData(data: Record<string, unknown>): Room {
  const building = data.building ? mapBuildingData(data.building as Record<string, unknown>) : undefined;

  return {
    roomId: String(data.room_id),
    name: String(data.name ?? ''),
    floor: Number(data.floor ?? 0),
    capacity: Number(data.capacity ?? 0),
    buildingId: String(data.building_id ?? ''),
    building,
    description: data.description ? String(data.description) : undefined,
    hasProjector: Boolean(data.has_projector ?? false),
    hasWhiteboard: Boolean(data.has_whiteboard ?? false),
    hasVideoConference: Boolean(data.has_video_conference ?? false),
    equipment: [], // TODO: Fetch from equipment table if needed
    currentBooking: undefined, // TODO: Fetch current booking if needed
  };
}

/**
 * Map a building row from the `building` table to the application's `Building` type.
 */
function mapBuildingData(data: Record<string, unknown>): Building {
  return {
    buildingId: String(data.id ?? ''),
    name: String(data.name ?? ''),
    address: String(data.address ?? ''),
    latitude: data.latitude ? Number(data.latitude) : undefined,
    longitude: data.longitude ? Number(data.longitude) : undefined,
    floorCount: data.floor_count ? Number(data.floor_count) : undefined,
    roomCount: data.room_count ? Number(data.room_count) : undefined,
    institutionId: String(data.institution_id ?? ''),
  };
}
