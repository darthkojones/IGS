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
