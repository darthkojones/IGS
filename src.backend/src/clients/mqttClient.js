/**
 * Author: wa7205@mci4me.at
 * Modified: 18 Jan 2025
 */

const clientPath = __dirname.split('/');
const envPath = clientPath.slice(0, clientPath.length - 3).join('/') + '/.env.local';

require('dotenv').config({ path: envPath });

const mqtt = require('mqtt');

const mqttClient = mqtt.connect(
  process.env.MQTT_URL, {
  clientId: 'mci_' + Math.random().toString(16).substring(2, 8),
  clean: true,
});

mqttClient.on('connect', () => console.log('Connected to MQTT broker.'));

mqttClient.on('error', (err) => console.error('MQTT-Error:', err));

module.exports = mqttClient;
