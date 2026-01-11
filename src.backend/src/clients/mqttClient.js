const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://localhost:1883', {
  clientId: 'mci_' + Math.random().toString(16).substring(2, 8),
  clean: true,
});

client.on('connect', () => {

  console.log('Connected to MQTT broker.');

  client.subscribe('mci/+/+/+/+/reply_status', (err) => {
    if (!err) console.log('Subscribed to status updates.');
  });

});

client.on('error', (err) => {
  console.error('MQTT-Fehler:', err);
});

function createKey(baseTopic, building = null, floor = null, room = null, device = null) {
  return String(`device:${baseTopic}:${building}:${floor}:${room}:${device}`);
}

function publishCommand(building, floor, room, device) {

}

module.exports = client;
