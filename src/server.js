import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncRooms } from '@/jobs/roomSyncJob';
import distanceRoutes from './routes/distanceRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Parse JSON request bodies
app.use(express.json());

// API routes (must come before static files)
app.use('/api/distance', distanceRoutes);

// Static files and SPA fallback
const DIST = path.resolve(__dirname, '..', 'dist');
app.use(express.static(DIST));
app.get(/.*/, (_, res) => res.sendFile(path.join(DIST, 'index.html')));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Express‑Server läuft auf Port ${PORT}\n`);
  syncRooms()
});
