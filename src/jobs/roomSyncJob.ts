// src/jobs/roomSyncJob.ts
import cron from 'node-cron';
import { roomService } from '@/services/roomService';
import type { Room } from '@/types/index';

export async function syncRooms(): Promise<void> {
  try {
    const rooms: Room[] = await roomService.getAllRooms();
    // … mache hier etwas mit den Räumen …
    console.log(`[roomSyncJob] ${rooms.length} Räume synchronisiert`);
  } catch (err: unknown) {
    console.error('[roomSyncJob] Error:', err);
  }
}

/* Cron‑Job – wird beim Laden der Datei automatisch registriert */
cron.schedule('*/5 * * * *', syncRooms, { timezone: 'Europe/Berlin' });

/* Sofort beim Start ausführen (wie du es bereits machst) */
syncRooms();
