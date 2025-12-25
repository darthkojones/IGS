import cron from 'node-cron'

import { roomService } from '@/services/roomService'   // @ = src/
import type { Room } from '@/types/index'

async function syncRooms(): Promise<void> {
  try {
    const rooms: Room[] = await roomService.getAllRooms()






  } catch (err: unknown) {
    console.error('[roomSyncJob] Error:', err)
  }
}

/**
 * Cron‑expression, runs every 5 minutes
 */
cron.schedule('*/5 * * * *', syncRooms, {
  timezone: 'Europe/Berlin',
})

// Runs at server start
syncRooms()
