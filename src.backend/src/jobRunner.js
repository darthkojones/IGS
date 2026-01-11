const cron = require('node-cron');

const redisService = require('./services/redisService.js')



const mqttClient = require('./clients/mqttClient');
const supabaseClient = require('./clients/supabaseClient');
const deviceConfig = require('./deviceConfig.json');
const devices = deviceConfig.devices;


mqttClient.on('message', async (topic, message) => {
  try {
    if (String(topic.endsWith('reply_status'))) {
      const [, building, floor, room, device] = topic.split('/');
      const data = JSON.parse(message.toString());

      await redisService.getDeviceStatus(
        redisService.createDeviceKey(building, floor, room, device),
        data.status, data.modifier, data.modified, room, device
      );

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
    'mci/request_status',
    'no message'
  );
}



async function handleNewCheckIns() {
  const nowMinus = new Date(new Date().getTime() - 150 * 60 * 1000); // 150 mins

  const confirmed = await supabaseClient.getConfirmedBookings(nowMinus);
  const newConfirmed = await Promise.all(
    confirmed.map(async b => {
      const isAlreadyChecked = await redisService.getBookingConfirmHandled(redisService.createBookingKey(b.bookingId));
      return isAlreadyChecked ? null : b;
    })
  );
  const filteredNewConfirmed = newConfirmed.filter(b => b != null);

  if (!filteredNewConfirmed.length) console.log(`No bookings confirmed since ${nowMinus.toISOString()}`); // NUR DEBUGGING

  for (let b of confirmed) { //CHANGE!
    const room = await supabaseClient.getRoomById(b.roomId);

    for (let d of devices) {
      const redisDeviceKey = redisService.createDeviceKey(room.buildingId, room.floor, room.roomId, d.name);
      const deviceStatus = await redisService.getDeviceStatus(redisDeviceKey);

      if (!deviceStatus) {
        console.log(`${redisDeviceKey} has no status, starting device ...`);

        mqttClient.publish()


      } else if (d.statusOn.includes(deviceStatus.status))  {
        console.log(`${redisDeviceKey} is already running ...`)



      } else if (!d.statusOn.includes(deviceStatus.status)) {
        console.log(`${redisDeviceKey} is not running, starting device ...`)


      }
    }
  }


}

cron.schedule('*/4 * * * * *', async () => {
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
