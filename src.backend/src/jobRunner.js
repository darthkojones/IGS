const cron = require('node-cron');

const redisClient = require('./clients/redisClient');
const mqttClient = require('./clients/mqttClient');
const supabaseClient = require('./clients/supabaseClient');
const deviceConfig = require('./deviceConfig.json');
const devices = deviceConfig.devices;

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

async function handleNewCheckIns() {
  const utcDate = new Date();
  const nowMinus = new Date(utcDate.getTime() - 150 * 60 * 1000);

  const confirmedBookings = await supabaseClient.getConfirmedBookings(nowMinus);
  const newConfirmedBookings = await Promise.all(
    confirmedBookings.map(async b => {
      const bookingKey = redisClient.createBookingKey(b.bookingId);
      const isBookingAlreadyHandled = await redisClient.getBookingConfirmHandled(bookingKey);
      return isBookingAlreadyHandled ? null : b;
    })
  );
  const newConfirmedFilteredBookings = newConfirmedBookings.filter(b => b != null);

  if (!newConfirmedFilteredBookings.length) {
    console.log(`No bookings confirmed since ${nowMinus.toISOString()}`)
    //return; //UNCOMMENT
  }

  for (let booking of confirmedBookings) { //CHANGE!
    const bookedRoom = await supabaseClient.getRoomById(booking.roomId);
    for (let device of devices) {
      const redisDeviceKey = redisClient.createDeviceKey(bookedRoom.buildingId, bookedRoom.floor, bookedRoom.roomId, device.name);
      const deviceStatus = await redisClient.getDeviceStatus(redisDeviceKey);

      if (!deviceStatus) {
        console.log(`Device ${redisDeviceKey} has no status, running onStart command ${redisDeviceKey}:${device.onStart}`);
      } else {
        console.log(redisDeviceKey, deviceStatus, `Device has status ${deviceStatus} checking ...`)

        const status = Number(deviceStatus.status);

        if (device.statusOn.includes(status)) {
          console.log(`Device ${redisDeviceKey} status indicates that device is running, doing nothing ...`)
        } else if (!device.statusOn.includes(status)) {
          console.log(`Device ${redisDeviceKey} status indicates that device is not running, running onStart command ${redisDeviceKey}:${device.onStart}`)
        }



      }
    }
  }


}

cron.schedule('*/4 * * * * *', () => {
  requestMqttUpdatesFromDevices();
  handleNewCheckIns();
});

cron.schedule('*/1 * * * * *', async () => {
  return;
  bumpRooms();
});

cron.schedule('*/3 * * * * *', async () => {
  return;
  infrastructure();
});
