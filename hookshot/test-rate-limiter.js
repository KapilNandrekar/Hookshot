const { createLimiter } = require('./rateLimiter');

const limiter = createLimiter({ limit: 5, windowMs: 3000 });
const testKey = 'test-user';

console.log('--- Sending 7 requests instantly (limit is 5) ---');
for (let i = 1; i <= 7; i++) {
  const result = limiter.check(testKey);
  console.log(`Request ${i}:`, result);
}

console.log('\n--- Waiting 3.5 seconds for the window to reset ---');
setTimeout(() => {
  console.log('--- Sending 1 more request after window reset ---');
  const result = limiter.check(testKey);
  console.log('Request after reset:', result);
}, 3500);