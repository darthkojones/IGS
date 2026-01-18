/**
 * Author: wa7205@mci4me.at
 * Modified: 18 Jan 2025
 */

const mqttClient = require('../clients/mqttClient');

/**
 * Subscribes to all topics handed over, e.g. ['mci/+/+/+/+/topic_1', 'mci/+/+/+/+/topic_2']
 * @param {string[]} topics
 */
function subscribeToTopics(topics) {
  topics.forEach(t => {
    mqttClient.subscribe(t, (err) => { if (!err) console.log('Subscribed to status updates.')});
  })
}

/**
 * Factory function that returns a normalized MQTT key for a device (e.g. lights) in a building
 * @param {string} baseTopic
 * @param {string | number} buildingId
 * @param {string | number} floor
 * @param {string | number} roomId
 * @param {string | number} deviceName
 * @returns {string}
 */
function createDeviceKey(
  baseTopic,
  buildingId,
  floor,
  roomId,
  deviceName
) {
  return String(`${baseTopic}/${buildingId}/${floor}/${roomId}/${deviceName}`);
}

/**
 *
 * @param {string} deviceKey Use createDeviceKey
 * @param {number} status
 */
function publishCommandToDevice(deviceKey, status) {
  mqttClient.publish(
    `${deviceKey}/command`,
    JSON.stringify({ modifier: 'sys', modified: new Date(), status: status}),
    { qos: 1 }
  )
}

module.exports = {
  subscribeToTopics,
  createDeviceKey,
  publishCommandToDevice,
  mqttClient
}
