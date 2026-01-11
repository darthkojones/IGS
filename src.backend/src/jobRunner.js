const cron = require('node-cron');

const redisService = require('./services/redisService.js')
const mqttService = require('./services/mqttService.js');
const supabaseService = require('./services/supabaseService.js');


const deviceConfig = require('./deviceConfig.json');
const devices = deviceConfig.devices;




mqttService.subscribeToTopics(['mci/+/+/+/+/reply_status']);

mqttService.mqttClient.on('message', async (topic, message) => {
  try {
    if (String(topic.endsWith('reply_status'))) {
      const [, building, floor, room, device] = topic.split('/');
      const data = JSON.parse(message.toString());

      await redisService.setDeviceStatus(
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
    const bookingsToExpire = await supabaseService.getExpiredBookings(nowMinusTenMinutes);
    if (bookingsToExpire.length) {
      supabaseService.setBookingsToExpired(bookingsToExpire)
    }
  } catch(error) {
    console.error('Supabase error', error)
  }
}

function requestMqttUpdatesFromDevices() {
  mqttService.mqttClient.publish(
    'mci/request_status',
    'no message'
  );
}



async function handleNewCheckIns() {
  const nowMinus = new Date(new Date().getTime() - 150 * 60 * 1000); // 150 mins

  const confirmed = await supabaseService.getConfirmedBookings(nowMinus);
  const newConfirmed = await Promise.all(
    confirmed.map(async b => {
      const isAlreadyChecked = await redisService.getBookingConfirmHandled(redisService.createBookingKey(b.bookingId));
      return isAlreadyChecked ? null : b;
    })
  );
  const filteredNewConfirmed = newConfirmed.filter(b => b != null);

  if (!filteredNewConfirmed.length) console.log(`No bookings confirmed since ${nowMinus.toISOString()}`); // NUR DEBUGGING

  for (let b of confirmed) { //CHANGE!
    const room = await supabaseService.getRoomById(b.roomId);

    for (let d of devices) {
      const redisDeviceKey = redisService.createDeviceKey(room.buildingId, room.floor, room.roomId, d.name);
      const deviceStatus = await redisService.getDeviceStatus(redisDeviceKey);

      const currentStatus = Number(deviceStatus.status);
      const statusesQualifyingAsOn = d.statusOn;

      const mqttDeviceKey = mqttService.createDeviceKey('mci', room.buildingId, room.floor, room.roomId, d.name);

      if (!deviceStatus) {
        console.log(`${redisDeviceKey} has no status, starting device ...`);

        mqttService.mqttClient.publish(
          `${mqttDeviceKey}/command`,
          JSON.stringify({ modifier: 'sys', modified: new Date(), status: d.onStart}),
          { qos: 1 }
        )

      } else if (statusesQualifyingAsOn.includes(currentStatus))  {
        console.log(`${redisDeviceKey} is already running ...`)

      } else if (!statusesQualifyingAsOn.includes(currentStatus)) {
        console.log(`${redisDeviceKey} is not running, starting device ...`)

        mqttService.mqttClient.publish(
          `${mqttDeviceKey}/command`,
          JSON.stringify({ modifier: 'sys', modified: new Date(), status: d.onStart}),
          { qos: 1 }
        )
      }
    }
  }


}

cron.schedule('*/5 * * * * *', async () => {
  requestMqttUpdatesFromDevices();
  handleNewCheckIns();
});
