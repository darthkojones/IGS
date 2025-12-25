import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncRooms } from '@/jobs/roomSyncJob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const DIST = path.join(__dirname, 'dist');
app.use(express.static(DIST));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Express‑Server läuft auf Port ${PORT}\n`);
  syncRooms()
});
