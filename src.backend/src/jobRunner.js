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

      console.log(`DSC\tStatus Saved\tRoom:${room}/${device}\tStatus: ${data.status}`);

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

      console.log(`Redis\tStatus Saved\tRoom:${room}/${device}\tStatus: ${data.status}`);

    } else {
      console.warn('Invalid topic:', topic);
      return;
    }
  } catch (error) {
    console.error('JSON-ERROR:', error.message, '| Message:', message.toString());
  }
});

/**
 * Here we are polling all devices across all buildings
 * Devices send back their latest status
 * Latest status is stored in redis store
 */
cron.schedule('*/5 * * * * *', () => {
  mqttClient.publish(
    'mci/all/command',
    JSON.stringify({
      action: 'request_status',
      timestamp: new Date().toISOString()
    }),
    { qos: 1 }
  );
});

/**
 * Here we query all expired rooms across all buildings
 * Expired rooms are bumped
 */
cron.schedule('*/1 * * * * *', async () => {
  const utcDate = new Date();
  const nowMinusTenMinutes = new Date(utcDate.getTime() - 10 * 60 * 1000).toISOString();

  try {
    const bookingsToExpire = await supabaseClient.getExpiredBookings(nowMinusTenMinutes);
    if (bookingsToExpire.length >= 1) supabaseClient.setBookingsToExpired(bookingsToExpire);
  } catch(error) {
    console.error('Supabase error', error)
  }
});


/**
 *
 * Hier muss folgendes rein:
 * - Cron job der alle 5 minuten läuft
 * - Der alle Räume abfragt aus supabase
 * - Der die letzten redis status erhält
 * 1. Beurteilung ob etwas zu unternehmen ist (licht ein obwohl aus gehört, licht aus obwohl ein gehört, etc)
 * 2. Commands an die betroffenen räume melden
 */
