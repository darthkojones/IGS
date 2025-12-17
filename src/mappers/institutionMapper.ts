import type { Institution } from '@/types';

/**
 * Map an institution row from the database to the Institution type
 */
export function mapInstitutionData(data: Record<string, unknown>): Institution {
  return {
    institutionId: String(data.id),
    name: String(data.name ?? ''),
    fullName: String(data.full_name ?? ''),
    address: data.address ? String(data.address) : undefined,
  };
}
