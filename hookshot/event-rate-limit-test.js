const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhYjc2MDdlNjlhOTdlOGRiZWE5ZWYxNCIsImlhdCI6MTc5MDY1ODQ1NSwiZXhwIjoxNzkwNjU5MzU1fQ.zNIBQFRWApqmNf8zb9FyM7RdEQzqQkZtHVXGegHEpE8';

async function sendEvent(i) {
  const res = await fetch('http://localhost:5001/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      'Idempotency-Key': `rate-test-${Date.now()}-${i}`, // unique every time
    },
    body: JSON.stringify({ type: 'test.event', data: { i } }),
  });

  const retryAfter = res.headers.get('retry-after');
  console.log(
    `Request ${i}: status ${res.status}` +
      (retryAfter ? `, Retry-After: ${retryAfter}` : '')
  );
}

async function run() {
  for (let i = 1; i <= 21; i++) {
    await sendEvent(i);
  }
}

run();