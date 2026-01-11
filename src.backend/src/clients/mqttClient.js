const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://localhost:1883', {
  clientId: 'mci_' + Math.random().toString(16).substring(2, 8),
  clean: true,
});

client.on('connect', () => console.log('Connected to MQTT broker.'));

client.on('error', (err) => console.error('MQTT-Fehler:', err));

module.exports = client;
