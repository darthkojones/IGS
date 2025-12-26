// src/jobs/roomSyncJob.ts
import cron from 'node-cron';
import { roomService } from '@/services/roomService';
import type { Room } from '@/types/index';

export async function syncRooms(): Promise<void> {
  try {
    const rooms: Room[] = await roomService.getAllRooms();

    rooms.forEach(r => console.log(r.name))
    // … mache hier etwas mit den Räumen …



  } catch (err: unknown) {
    console.error('[roomSyncJob] Error:', err);
  }
}

// Register cron job when file is loaded
cron.schedule('*/5 * * * *', syncRooms, { timezone: 'Europe/Berlin' });
