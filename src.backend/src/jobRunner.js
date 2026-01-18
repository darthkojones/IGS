/**
 * Author: wa7205@mci4me.at
 * Modified: 18 Jan 2025
 */

const cron = require('node-cron');
const redisService = require('./services/redisService.js')
const mqttService = require('./services/mqttService.js');
const supabaseService = require('./services/supabaseService.js');
const fs = require('fs');
const deviceConfig = require('./deviceConfig.json');
const devices = deviceConfig.devices;

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
UTILITY FUNCTIONS
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * Writes to logfile
 * @param {string} logfileName Filepath
 * @param {string} service E.g. 'cron' or 'redis'
 * @param {string} line What happened, e.g. 'Executed successfully'
 */
function log(logfileName, service, line) {
  fs.appendFile(logfileName, `${new Date().toISOString()}\t${service} >> ${line}\n`, 'utf8', (err) => { if (err) throw err; });
}

/**
 * Checks if one of the bookings handed over is happending right now
 * Operates on Booking[] already queried from database
 * @param {Booking[]} bookings
 * @param {Date} dateTimeNow
 * @returns {Boolean}
 */
function isRoomOccupied(bookings, dateTimeNow) {
  const now = dateTimeNow.getTime();
  return bookings.filter(b => b.startTime.getTime() < now && b.endTime.getTime() > now).length > 0;
}

/**
 * Operates on Booking[] already queried from database
 * Returns the next confirmed booking from the input array
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
 * Operates on Booking[] already queried from database
 * Returns the previous completed booking from the input array
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


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
MQTT SETUP
- We only need to subscribe to one topic because we only receive status updates
- mqqtClient.on(...) handles the whole redis status log for all devices
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

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


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
CRON FUNCTIONS
- Each function is run on regular basis in the next section at the bottom of this file
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * Checks for expired rooms and sets them to expired
 * @param {number} lastCheckNMinutesAgo How many minutes the last check was ago; e.g. if the cron job runs every 5 minutes, set this to 5 minutes
 */
async function bumpRooms(lastCheckNMinutesAgo) {
  const nowMinus = new Date(new Date().getTime() - lastCheckNMinutesAgo * 60 * 1000);

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

/**
 * Publishes a message to all MQTT consumers that they should send a status update
 */
function requestMqttUpdatesFromDevices() {
  mqttService.mqttClient.publish(
    'mci/request_status',
    'no message'
  );
}

/**
 * Checks for new check ins and sends commands to devices
 * @param {number} lastCheckNMinutesAgo How many minutes the last check was ago; e.g. if the cron job runs every 5 minutes, set this to 5 minutes
 */
async function handleCheckIns(lastCheckNMinutesAgo) {
  const confirmedBookings = await supabaseService.getConfirmedBookings(
    new Date(new Date().getTime() - lastCheckNMinutesAgo * 60 * 1000)
  );
  const newConfirmedBookings = await Promise.all(
    confirmedBookings.map(async b => {
      const isAlreadyChecked = await redisService.getBookingConfirmHandled(redisService.createBookingKey(b.bookingId));
      return isAlreadyChecked ? null : b;
    })
  );
  const filteredNewConfirmedBookings = newConfirmedBookings.filter(b => b != null);

  for (let b of filteredNewConfirmedBookings) {
    const room = await supabaseService.getRoomById(b.roomId);

    for (let d of devices) {
      const mqttDeviceKey = mqttService.createDeviceKey(
          'mci',
          room.buildingId,
          room.floor,
          room.roomId,
          d.name
        );

      const redisStatus = await redisService.getDeviceStatus(
        redisService.createDeviceKey(
          room.buildingId,
          room.floor,
          room.roomId,
          d.name)
      );

      if (!redisStatus) {
        log('logfile.txt', 'handleCheckIns', `${mqttDeviceKey} has no status, starting device ...`)
        mqttService.publishCommandToDevice(mqttDeviceKey, d.onStart);

      } else {
        const deviceStatus = Number(redisStatus.status);
        const isDeviceStatusOn = d.statusOn.includes(deviceStatus);

        if (isDeviceStatusOn)  {
          log('logfile.txt', 'handleCheckIns', `${mqttDeviceKey} is already running ...`)

        } else {
          log('logfile.txt', 'handleCheckIns', `${mqttDeviceKey} is not running, starting device ...`)
          mqttService.publishCommandToDevice(mqttDeviceKey, d.onStart);
        }
      }
    }
  }
}

/**
 * Checks for devices that can be shut down and sends commands to devices
 */
async function handleShutdowns() {
  const now = new Date();
  const allRooms = await supabaseService.getAllRooms();

  for (let r of allRooms) {
    const roomBookings = await supabaseService.getTodaysBookingsForRoom(r);

    if (isRoomOccupied(roomBookings, now)) continue;

    // We get the previous and the next meeting and calculate the minutes; If there is no meeting, we use start of today and end of today;
    const prevMeetingEnding =
      findPreviousBooking(roomBookings, now)?.endTime?.getTime()
      ?? new Date(now).setHours(0, 0, 0);

    const nextMeetingStart =
      findNextBooking(roomBookings, now)?.startTime?.getTime()
      ?? new Date(now).setHours(23, 59, 59)

    const prevActivityInMinutes = (now.getTime() - prevMeetingEnding) / 1000 / 60;
    const nextActivityInMinutes = (nextMeetingStart - now.getTime()) / 1000 / 60;

    for (let d of devices) {
      const status = await redisService.getDeviceStatus(
        redisService.createDeviceKey(r.buildingId, r.floor, r.roomId, d.name)
      );

      const statusWasOn = d.statusOn.includes(Number(status.status));
      const statusWasSetManually = status.modifier !== 'sys';
      const minutesSinceStatusChange = ((now.getTime() - (new Date(status.modified).getTime() ?? new Date(now).setHours(0, 0, 0))) / 1000 / 60);

      /*
        If, according to redis, the last status was set manually and the it was set after the last activity (e.g. booking end), then this is our last action
        Why? When a booking ends and somebody changes e.g. the setting of the lights, they are obviously still using the room
      */
      const previousActivityForDevice = (statusWasSetManually && minutesSinceStatusChange < prevActivityInMinutes) ? minutesSinceStatusChange : prevActivityInMinutes;

      // We check if since the previous activity enough minutes have passed to put the device in standby mode or off
      const prevStandby = previousActivityForDevice > d.standByAfter ?? Infinity;
      const prevOff = minutesSinceStatusChange > d.offAfter ?? Infinity;
      // We check if to the next activity there are enough minutes left to put turn off the device
      const nextOff = nextActivityInMinutes > d.offNextBookingThreshold ?? Infinity;

      const mqttDeviceKey = mqttService.createDeviceKey('mci', r.buildingId, r.floor, r.roomId, d.name);


      if (prevOff && nextOff && statusWasOn) {
        /*
          prevOff: Enough time passed to turn the device off
          nextOff: Enough time to next activity to turn it off (e.g. aircon takes up more energy if it has to restart often vs. if it idles)
          statusWasOn: If it was already off, we don't turn it off again
        */
          log('logfile.txt', 'handleShutdowns', `${mqttDeviceKey} can be turned off, sending command ...`)
          mqttService.publishCommandToDevice(mqttDeviceKey, d.onOff);

      } else if (prevStandby && statusWasOn) {
        /*
          prevStandby: Enough time passed to set the device on standby (standby is always OK, but not off - e.g. its dark and lights suddenly go off completely)
          statusWasOn: If it was already off, we don't set it to standby
        */
        if (d.onStandby) { // Stand by can be null if a device has no stand by mode
          mqttService.publishCommandToDevice(mqttDeviceKey, d.onStandby)
          log('logfile.txt', 'handleShutdowns', `${mqttDeviceKey} can be set on stand by mode, sending command ...`)
        } else {
          log('logfile.txt', 'handleShutdowns', `${mqttDeviceKey} has no stand by mode, no command can be sent.`)
        }

      } else {
        // log('logfile.txt', 'handleShutdowns', `${mqttDeviceKey} is OK, no command to be sent.`)
      }
    }
  }
}


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
RUNNING CRON FUNCTIONS
- Each cron function is scheduled separately to avoid one function waiting for the other to finish
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// Runs every 20 seconds
cron.schedule('0,20,40 * * * * *', async () => {
  log('logfile.txt', 'cron', 'Requesting device updates ...');
  requestMqttUpdatesFromDevices();
});

// Runs every minute of every hour
cron.schedule('0-59 * * * *', async () => {
  log('logfile.txt', 'cron', 'Running check in handler ...');
  handleCheckIns(1);
});

// Runs every minute of every hour
cron.schedule('0-59 * * * *', async () => {
  log('logfile.txt', 'cron', 'Bumping rooms ...');
  bumpRooms(1)
});

// Runs every minute of every hour
cron.schedule('0-59 * * * *', async () => {
  log('logfile.txt', 'cron', 'Running shutdown handler ...');
  handleShutdowns()
});
