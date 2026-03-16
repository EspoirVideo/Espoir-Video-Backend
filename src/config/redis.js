const Redis = require('ioredis');
const env = require('./env');

const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisClient.on('connect', () => {
  console.log('[REDIS] Cache connecté avec succès');
});

redisClient.on('error', (err) => {
  console.error('[REDIS] Erreur de connexion:', err.message);
});

module.exports = redisClient;