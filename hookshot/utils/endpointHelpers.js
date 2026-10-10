const Endpoint = require('../models/Endpoint');
const cache = require('../cache');

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes, as required by the PDF

let dbQueryCount = 0;

async function getActiveEndpoints(userId) {
  const cacheKey = `endpoints:${userId}`;

  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  dbQueryCount++;
  const endpoints = await Endpoint.find({ userId, active: true });

  cache.set(cacheKey, endpoints, CACHE_TTL_MS);
  return endpoints;
}

function getDbQueryCount() {
  return dbQueryCount;
}

module.exports = { getActiveEndpoints, getDbQueryCount };