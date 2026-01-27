/**
 * Author: wa7205@mci4me.at
 * Modified: 18 Jan 2025
 */

const clientPath = __dirname.split('/');
const envPath = clientPath.slice(0, clientPath.length - 3).join('/') + '/.env.local';

require('dotenv').config({ path: envPath });

const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => {
  console.error('Redis Error: ', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis.');
});

redisClient.connect();

module.exports = redisClient;
