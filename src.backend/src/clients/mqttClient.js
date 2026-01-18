const mqtt = require('mqtt');

const mqttClient = mqtt.connect('mqtt://localhost:1883', {
  clientId: 'mci_' + Math.random().toString(16).substring(2, 8),
  clean: true,
});

mqttClient.on('connect', () => console.log('Connected to MQTT broker.'));

mqttClient.on('error', (err) => console.error('MQTT-Error:', err));

module.exports = mqttClient;
