const { createClient } = require('redis');

const redisClient = createClient({
  url: 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis Error: ', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis.');
});

redisClient.connect();

function createDeviceKey(building, floor, room, device) {
  return String(`device:${building}:${floor}:${room}:${device}`);
}

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
  return String(`booking${bookingId}`);
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
  redisClient,
  createDeviceKey,
  setDeviceStatus,
  getDeviceStatus,
  createBookingKey,
  setBookingConfirmHandled,
  getBookingConfirmHandled
}
