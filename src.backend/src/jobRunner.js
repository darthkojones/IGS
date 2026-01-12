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

async function bumpRooms(lastCheckNMinutesAgo) {
  const utcDate = new Date();
  const nowMinus = new Date(utcDate.getTime() - lastCheckNMinutesAgo * 60 * 1000);

  try {
    const bookingsToExpire = await supabaseService.getExpiredBookings(nowMinus);
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



async function handleNewCheckIns(lastCheckNMinutesAgo) {
  const nowMinus = new Date(new Date().getTime() - lastCheckNMinutesAgo * 60 * 1000); // 150 mins

  const confirmed = await supabaseService.getConfirmedBookings(nowMinus);
  const newConfirmed = await Promise.all(
    confirmed.map(async b => {
      const isAlreadyChecked = await redisService.getBookingConfirmHandled(redisService.createBookingKey(b.bookingId));
      return isAlreadyChecked ? null : b;
    })
  );
  const filteredNewConfirmed = newConfirmed.filter(b => b != null);

  for (let b of filteredNewConfirmed) {
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

async function handleShutdowns() {
  const now = new Date();
  const allRooms = await supabaseService.getAllRooms();

  for (let r of allRooms) {
    const roomBookings = await supabaseService.getTodaysBookingsForRoom(r);

    if (supabaseService.isRoomOccupied(roomBookings, now)) {
      continue;
    }

    const prevMeeting = supabaseService.findPreviousBooking(roomBookings, now);
    const prevActivityInMinutes = ((now.getTime() - (prevMeeting?.endTime?.getTime() ?? new Date(now).setHours(0, 0, 0))) / 1000 / 60);

    const nextMeeting = supabaseService.findNextBooking(roomBookings, now);
    const nextActivityInMinutes = (((nextMeeting?.startTime?.getTime() ?? new Date(now).setHours(23, 59, 59)) - now.getTime()) / 1000 / 60);

    for (let d of devices) {
      const redisDeviceKey = redisService.createDeviceKey(r.buildingId, r.floor, r.roomId, d.name);
      const status = await redisService.getDeviceStatus(redisDeviceKey);

      const statusStatus = Number(status.status);
      const statusWasSetManually = (status.modifier !== 'sys');
      const statusModified = new Date(status.modified);
      const statusWasOn = d.statusOn.includes(statusStatus);

      const minutesSinceStatusChange = ((now.getTime() - (statusModified.getTime() ?? new Date(now).setHours(0, 0, 0))) / 1000 / 60);

      const previousActivityForDevice = (statusWasSetManually && minutesSinceStatusChange < prevActivityInMinutes && statusWasOn) ? minutesSinceStatusChange : prevActivityInMinutes;




      const prevStandby = minutesSinceStatusChange > d.standByAfter ?? Infinity;
      const prevOff = minutesSinceStatusChange > d.offAfter ?? Infinity;
      const nextOff = nextActivityInMinutes > d.offNextBookingThreshold ?? Infinity;


      if (prevOff && nextOff) {
        // turn off
      } else if (prevStandby) {
        // standby
        // standby is always possible, no matter how close the next meeting
      } else {
        // Other
      }


    }
  }
}

handleShutdowns()

return;
{
// Runs every 20 seconds
cron.schedule('0,20,40 * * * * *', async () => {
  console.log('>> node-cron >> Requesting MQTT updates from devices ...')
  requestMqttUpdatesFromDevices();
});

// Runs every minute of every hour
cron.schedule('0-59 * * * *', async () => {
  console.log('>> node-cron >> Checking for new check-ins ...')
  handleNewCheckIns(1);
});

// Runs every minute of every hour
cron.schedule('0-59 * * * *', async () => {
  console.log('>> node-cron >> Checking for expired rooms ...')
  bumpRooms(1)
});
}
