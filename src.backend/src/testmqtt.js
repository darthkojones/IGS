const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

// Simuliertes Gerät (z. B. Licht in Raum 3)
const simulatedDevice = {
  building: 'mciIV',
  floor: '3',
  room: 'raum3', // Festes Gerät, das auf Anfragen reagiert
  deviceType: 'licht',
  statusTopic: 'mci/mciIV/3/raum3/licht/status',
  commandTopic: 'mci/mciIV/3/raum3/licht/command'
};

// Aktueller Status des simulierten Geräts (Memory n°1)
let currentStatus = {
  status: 'off',
  modifier: 'manual',
  modified: new Date().toISOString()
};

client.on('connect', () => {
  console.log('✅ Verbunden mit MQTT-Broker');

  // 1. Globales Command-Topic abonnieren (für Status-Anfragen)
  client.subscribe('mci/all/command');
  console.log('📋 Abonniere globale Befehle (mci/all/command)');

  // 2. Eigenes Command-Topic abonnieren (für direkte Befehle)
  client.subscribe(simulatedDevice.commandTopic);
  console.log(`📋 Abonniere Geräte-Befehle (${simulatedDevice.commandTopic})`);

  // 3. Zufällige Status-Updates senden (wie in deinem Original)
  //setInterval(sendRandomStatusUpdates, 5000);
});

client.on('message', (topic, message) => {
  try {
    const msg = message.toString();

    // A) Reaktion auf globale Status-Anfrage
    if (topic === 'mci/all/command') {
      const request = JSON.parse(msg);
      if (request.action === 'request_status') {
        console.log('📩 Status-Anfrage empfangen – antworte mit aktuellem Status');
        sendDeviceStatus();
      }
    }

    // B) Reaktion auf direkte Befehle (z. B. Licht ein/aus)
    if (topic === simulatedDevice.commandTopic) {
      const command = JSON.parse(msg);
      if (command.status) { // z. B. {"status": "on"}
        currentStatus.status = command.status;
        currentStatus.modifier = 'controller';
        currentStatus.modified = new Date().toISOString();
        console.log(`🔄 Befehl empfangen: ${command.status} – aktualisiere Status`);
        sendDeviceStatus();
      }
    }
  } catch (error) {
    console.error('Fehler:', error.message);
  }
});

// Status des simulierten Geräts senden
function sendDeviceStatus() {
  client.publish(
    simulatedDevice.statusTopic,
    JSON.stringify(currentStatus),
    { qos: 1 }
  );
  console.log(`📤 Status gesendet:`, currentStatus);
}

// Zufällige Status-Updates (wie in deinem Original)
function sendRandomStatusUpdates() {
  const raum = `raum${Math.floor(Math.random() * 5) + 1}`; // Zufälliger Raum
  const payload = {
    status: Math.random() > 0.5 ? 'on' : 'off',
    modifier: Math.random() > 0.2 ? 'auto' : 'manual',
    modified: new Date(Date.now() - Math.floor(Math.random() * (24 * 60 * 60 * 1000 - 5 * 60 * 1000)) - 5 * 60 * 1000).toISOString()
  };

  // Original-Logik: Zufällige Geräte simulieren
  client.publish(
    `mci/mciIV/3/${raum}/licht/status`,
    JSON.stringify(payload)
  );
  console.log(`📤 Zufälliger Status (${raum}):`, payload);
}

client.on('error', (err) => console.log('Fehler:', err.message));
