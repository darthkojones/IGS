/**
 * Author: wa7205@mci4me.at
 * Modified: 18 Jan 2025
 */

const redisClient = require('../clients/redisClient');

/**
 * Factory function that returns normalized device key for redis
 * @param {string | number} buildingId
 * @param {string | number} floor
 * @param {string | number} roomId
 * @param {string | number} deviceName
 * @returns {string
 */
function createDeviceKey(buildingId, floor, roomId, deviceName) {
  return String(`device:${buildingId}:${floor}:${roomId}:${deviceName}`);
}

/**
 *
 * @param {string} deviceKey Use createDeviceKey() to generate the key
 * @param {number} status
 * @param {string} modifier
 * @param {Date} modified
 * @param {string} room
 * @param {string} device
 */
async function setDeviceStatus(deviceKey, status, modifier, modified, room, device) {
  await redisClient.hSet(
    deviceKey,
    {
      status: status,
      modifier: modifier,
      modified: modified,
      room,
      device
    }
  )
}

async function getDeviceStatus(deviceKey) {
  const data = await redisClient.hGetAll(deviceKey);

  if (!await redisClient.exists(deviceKey)) {
    return null;
  } else {
    return {
      status: data?.status ?? null,
      modifier: data?.modifier ?? null,
      modified: data?.modified ?? null,
      room: data?.room ?? null,
      device: data?.device ?? null
    }
  }
}

function createBookingKey(bookingId) {
  return String(`booking:${bookingId}`);
}

async function setBookingConfirmHandled(bookingKey) {
  await redisClient.set(
    bookingKey,
    1
  )
}

async function getBookingConfirmHandled(bookingKey) {
  const data = await redisClient.get(bookingKey);

  if (!await redisClient.exists(bookingKey)) {
    return null;
  } else {
    return data
  }
}

module.exports = {
  createDeviceKey,
  setDeviceStatus,
  getDeviceStatus,
  createBookingKey,
  setBookingConfirmHandled,
  getBookingConfirmHandled
}
