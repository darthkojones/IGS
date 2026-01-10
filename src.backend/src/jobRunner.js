const cron = require('node-cron');

const redisClient = require('./clients/redisClient');
const mqttClient = require('./clients/mqttClient');
const supabaseClient = require('./clients/supabaseClient');

/**
 * Here we are processing all updates sent to us
 * Mainly status updates but we can easily extend this to also process warnings or other info messages
 */
const deviceStatusCache = {};

mqttClient.on('message', async (topic, message) => {
  try {
    const parts = topic.split('/');

    /**
     * Here we are processing status updates from all devices across all buildings
     * The status updates land in a hash map and in a redis key value store so that they are available quickly
     */
    if (parts.length == 6 && parts[5] == 'status') {
      const [, building, floor, room, device] = parts;
      const data = JSON.parse(message.toString());
      const deviceKey = `${building}:${floor}:${room}:${device}`;
      deviceStatusCache[deviceKey] = data.status;

      //console.log(`DSC\tStatus Saved\tRoom:${room}/${device}\tStatus: ${data.status}`);

      console.log(deviceKey)

      await redisClient.hSet(
        `device:${deviceKey}`,
        {
          status: data.status,
          modifier: data.modifier,
          modified: data.modified,
          room,
          device
        }
      );

      //console.log(`Redis\tStatus Saved\tRoom:${room}/${device}\tStatus: ${data.status}`);

    } else {
      console.warn('Invalid topic:', topic);
      return;
    }
  } catch (error) {
    console.error('JSON-ERROR:', error.message, '| Message:', message.toString());
  }
});

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
Cron jobs
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

async function bumpRooms() {
  const utcDate = new Date();
  const nowMinusTenMinutes = new Date(utcDate.getTime() - 10 * 60 * 1000);

  try {
    const bookingsToExpire = await supabaseClient.getExpiredBookings(nowMinusTenMinutes);
    if (bookingsToExpire.length) {
      supabaseClient.setBookingsToExpired(bookingsToExpire)
    }
  } catch(error) {
    console.error('Supabase error', error)
  }
}

function requestMqttUpdatesFromDevices() {
  mqttClient.publish(
    'mci/all/command',
    JSON.stringify({
      action: 'request_status',
      timestamp: new Date().toISOString()
    }),
    { qos: 1 }
  );
}

async function infrastructure() {
  const now = new Date();

  const allRooms = await supabaseClient.getAllRooms();
  for (let r of allRooms) {
    const bookingsForCurrentRoom = await supabaseClient.getAllBookingsForRoom(r);

    const prevBooking = supabaseClient.findPreviousBooking(bookingsForCurrentRoom, now);
    const nextBooking = supabaseClient.findNextBooking(bookingsForCurrentRoom, now);

    const minsToPrevBooking = prevBooking ? ((now.getTime() - prevBooking.endTime.getTime()) / 1000 / 60) : 60 * 24;
    const minsToNextBooking = nextBooking ? ((nextBooking.startTime.getTime() - now.getTime()) / 1000 / 60) : 60 * 24;
    const isOccupied = supabaseClient.isRoomOccupied(bookingsForCurrentRoom, now);

    createCommand(minsToPrevBooking, minsToNextBooking, isOccupied)
  }
}

async function test() {
  let sesh = await redisClient.hGetAll('device:mciIV:3:raum3:licht');
  console.log(sesh)
}


cron.schedule('*/1 * * * * *', () => {
  requestMqttUpdatesFromDevices();
  test();
});

cron.schedule('*/1 * * * * *', async () => {
  return;
  bumpRooms();
});

cron.schedule('*/3 * * * * *', async () => {
  return;
  infrastructure();
});




// device:mciIV:3:raum3:licht
