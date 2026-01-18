/**
 * Author: wa7205@mci4me.at
 * Modified: 18 Jan 2025
 */

const { createClient } = require('redis');

const redisClient = createClient({
  url: 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis Error: ', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis.');
});

redisClient.connect();

module.exports = redisClient;
