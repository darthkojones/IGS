const cron = require('node-cron');

const redisService = require('./services/redisService.js')
const mqttService = require('./services/mqttService.js');
const supabaseService = require('./services/supabaseService.js');
const fs = require('fs');


const deviceConfig = require('./deviceConfig.json');
const devices = deviceConfig.devices;


function log(logfileName, service, line) {
  fs.appendFile(logfileName, `${new Date().toISOString()}\t${service} >> ${line}\n`, 'utf8', (err) => {
    if (err) throw err;
  });
}


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
      log('logfile.txt', 'bumpRooms', `${bookingsToExpire.length} Bookings bumped.`)
    } else {
      log('logfile.txt', 'bumpRooms', `No bookings bumped.`)
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



async function handleCheckIns(lastCheckNMinutesAgo) {
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
        log('logfile.txt', 'handleCheckIns', `${mqttDeviceKey} has no status, starting device ...`)

        mqttService.mqttClient.publish(
          `${mqttDeviceKey}/command`,
          JSON.stringify({ modifier: 'sys', modified: new Date(), status: d.onStart}),
          { qos: 1 }
        )

      } else if (statusesQualifyingAsOn.includes(currentStatus))  {
        log('logfile.txt', 'handleCheckIns', `${mqttDeviceKey} is already running ...`)

      } else if (!statusesQualifyingAsOn.includes(currentStatus)) {
        log('logfile.txt', 'handleCheckIns', `${mqttDeviceKey} is not running, starting device ...`)

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

    if (isRoomOccupied(roomBookings, now)) {
      continue;
    }

    const prevMeeting = findPreviousBooking(roomBookings, now);
    const prevActivityInMinutes = ((now.getTime() - (prevMeeting?.endTime?.getTime() ?? new Date(now).setHours(0, 0, 0))) / 1000 / 60);

    const nextMeeting = findNextBooking(roomBookings, now);
    const nextActivityInMinutes = (((nextMeeting?.startTime?.getTime() ?? new Date(now).setHours(23, 59, 59)) - now.getTime()) / 1000 / 60);

    for (let d of devices) {
      const redisDeviceKey = redisService.createDeviceKey(r.buildingId, r.floor, r.roomId, d.name);
      const status = await redisService.getDeviceStatus(redisDeviceKey);

      const statusStatus = Number(status.status);
      const statusWasSetManually = (status.modifier !== 'sys');
      const statusModified = new Date(status.modified);


      const statusWasOn = d.statusOn.includes(statusStatus);

      const minutesSinceStatusChange = ((now.getTime() - (statusModified.getTime() ?? new Date(now).setHours(0, 0, 0))) / 1000 / 60);

      const previousActivityForDevice = (statusWasSetManually && minutesSinceStatusChange < prevActivityInMinutes) ? minutesSinceStatusChange : prevActivityInMinutes;


      const prevStandby = previousActivityForDevice > d.standByAfter ?? Infinity;
      const prevOff = minutesSinceStatusChange > d.offAfter ?? Infinity;
      const nextOff = nextActivityInMinutes > d.offNextBookingThreshold ?? Infinity;

      const mqttDeviceKey = mqttService.createDeviceKey('mci', r.buildingId, r.floor, r.roomId, d.name);

      if (prevOff && nextOff && statusWasOn) {
          log('logfile.txt', 'handleShutdowns', `${mqttDeviceKey} can be turned off, sending command ...`)

          mqttService.mqttClient.publish(
          `${mqttDeviceKey}/command`,
          JSON.stringify({ modifier: 'sys', modified: new Date(), status: d.onOff}),
          { qos: 1 }
        );
      } else if (prevStandby && statusWasOn) {
        log('logfile.txt', 'handleShutdowns', `${mqttDeviceKey} can be set on stand by mode, sending command ...`)

        if (d.onStandby) {
          mqttService.mqttClient.publish(
          `${mqttDeviceKey}/command`,
          JSON.stringify({ modifier: 'sys', modified: new Date(), status: d.onStandby}),
          { qos: 1 }
          );
        }
      } else {
        log('logfile.txt', 'handleShutdowns', `${mqttDeviceKey} is OK, no command to be sent.`)
      }
    }
  }
}

// Runs every 20 seconds
cron.schedule('0,20,40 * * * * *', async () => {
  log('logfile.txt', 'cron', 'Requesting device updates ...')
  requestMqttUpdatesFromDevices();
});

// Runs every minute of every hour
cron.schedule('0-59 * * * *', async () => {
  log('logfile.txt', 'cron', 'Running check in handler ...')
  handleCheckIns(1);
});

// Runs every minute of every hour
cron.schedule('0-59 * * * *', async () => {
  log('logfile.txt', 'cron', 'Bumping rooms ...')
  bumpRooms(1)
});

// Runs every minute of every hour
cron.schedule('0-59 * * * *', async () => {
  log('logfile.txt', 'cron', 'Running shutdown handler ...')
  handleShutdowns()
});


/**

 * @param {Booking[]} bookings
 * @param {Date} dateTimeNow
 * @returns {Boolean}
 */
function isRoomOccupied(bookings, dateTimeNow) {
  const now = dateTimeNow.getTime();
  return bookings.filter(b => b.startTime.getTime() < now && b.endTime.getTime() > now).length > 0;
}

/**
 *
 * @param {Booking[]} bookings
 * @param {Date} dateTimeNow
 * @returns {Booking | null}
 */
function findNextBooking(bookings, dateTimeNow) {
  const now = dateTimeNow.getTime();
  return bookings
    .filter(b => b.startTime.getTime() > now && (b.status === BookingStatus.CONFIRMED))
    .sort((a, b) => (a.startTime.getTime() > b.startTime.getTime() ? 1 : a.startTime.getTime() < b.startTime.getTime() ? -1 : 0))
    .at(0) ?? null;
}

/**
 *
 * @param {Booking[]} bookings
 * @param {Date} dateTimeNow
 * @returns {Booking | null}
 */
function findPreviousBooking(bookings, dateTimeNow) {
  const now = dateTimeNow.getTime();
  return bookings
    .filter(b => b.endTime.getTime() < now && b.status === BookingStatus.COMPLETED)
    .sort((a, b) => (a.endTime.getTime() > b.endTime.getTime() ? -1 : a.endTime.getTime() < b.endTime.getTime() ? 1 : 0))
    .at(0) ?? null;
}
