const mqttClient = require('../clients/mqttClient');

function subscribeToTopics(topics) {
  topics.forEach(t => {
    mqttClient.subscribe(t, (err) => { if (!err) console.log('Subscribed to status updates.')});
  })
}

function createDeviceKey(baseTopic, buildingId, floor, roomId, deviceName) {
  return String(`${baseTopic}/${buildingId}/${floor}/${roomId}/${deviceName}`);
}


module.exports = {
  subscribeToTopics,
  createDeviceKey,
  mqttClient
}
