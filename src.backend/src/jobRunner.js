const cron = require('node-cron');

const redisClient = require('./clients/redisClient');
const mqttClient = require('./clients/mqttClient');
const supabaseClient = require('./clients/supabaseClient');

/**
 * Here we are processing all updates sent to us
 * Mainly status updates but we can easily extend this to also process warnings or other info messages
 */
mqttClient.on('message', async (topic, message) => {
  try {
    const parts = topic.split('/');

    if (parts.length == 6 && parts[5] == 'status') {
      const [, building, floor, room, device] = parts;
      const data = JSON.parse(message.toString());

      const deviceKey = redisClient.createDeviceKey(building, floor, room, device);
      await redisClient.setStatus(deviceKey, data.status, data.modifier, data.modified, room, device);

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
    const bookingsForCurrentRoom = await supabaseClient.getTodaysBookingsForRoom(r);

    if (supabaseClient.isRoomOccupied(bookingsForCurrentRoom, now)) continue;

    const prevBooking = supabaseClient.findPreviousBooking(bookingsForCurrentRoom, now);
    const nextBooking = supabaseClient.findNextBooking(bookingsForCurrentRoom, now);
    const minsToPrevBooking = prevBooking ? ((now.getTime() - prevBooking.endTime.getTime()) / 1000 / 60) : 60 * 24;
    const minsToNextBooking = nextBooking ? ((nextBooking.startTime.getTime() - now.getTime()) / 1000 / 60) : 60 * 24;


    console.log(minsToPrevBooking, minsToNextBooking);
    // Wir haben es hier nur mit räumen zutun die aktuell nicht genutzt werden

    // Actions sind ende eines aktiven bookings, manueller command
    // n minuten nach einer action gehen wir in den standby mode
    // m minuten nach einer action gehen wir in den shutdown mode

    /*
    Es gibt nur zwei arten von actions: ON-ACTIONS, OFF-ACTIONS
    Wir definieren events mit mindestabstand zu ON-ACTIONS und OFF-ACTIONS
    Müssen wir entscheiden welche action bevorzugt wird? Was wenn es 10 minuten pause gibt und es würde beide actions triggern, weil beide mit 5 minuten verzögerung laufen?

    */


  }
}

cron.schedule('*/10 * * * * *', () => {
  requestMqttUpdatesFromDevices();
  infrastructure();
});

cron.schedule('*/1 * * * * *', async () => {
  return;
  bumpRooms();
});

cron.schedule('*/3 * * * * *', async () => {
  return;
  infrastructure();
});
