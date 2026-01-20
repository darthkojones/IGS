import type { User } from '@/types';
import { UserRole } from '@/types';

/**
 * Map a user row from the `users` table to the application's `User` type.
 */
export function mapSupabaseUserToUser(userData: Record<string, unknown>): User | null {
  if (!userData || !userData.id) return null;

  const firstName = (userData.first_name ?? '') as string;
  const lastName = (userData.last_name ?? '') as string;
  const email = (userData.email ?? '') as string;
  //const name = (`${firstName} ${lastName}`.trim() || email || '');

  const user: User = {
    userId: String(userData.id),
    firstName,
    lastName,
    email,
    //name,
    role: (userData.role as UserRole) ?? UserRole.STUDENT,
    institutionId: userData.institution_id != null ? String(userData.institution_id) : undefined,
  };

  // Map institution if it was joined
  if (userData.Institution && typeof userData.Institution === 'object') {
    const inst = userData.Institution as Record<string, unknown>;
    user.institution = {
      institutionId: String(inst.id),
      name: String(inst.name ?? ''),
      fullName: String(inst.full_name ?? ''),
      address: inst.address ? String(inst.address) : undefined,
    };
  }

  return user;
}
