import type { Building } from '@/types';

export function mapBuildingData(data: Record<string, unknown>): Building {
  return {
    buildingId: String(data.id),
    name: String(data.name ?? ''),
    address: '', // Building doesn't have direct address field, it has address_id
    latitude: data.latitude ? Number(data.latitude) : undefined,
    longitude: data.longitude ? Number(data.longitude) : undefined,
    floorCount: data.floors ? Number(data.floors) : undefined,
    roomCount: data.rooms ? Number(data.rooms) : undefined,
    institutionId: data.institution_id ? String(data.institution_id) : '',
  };
}
