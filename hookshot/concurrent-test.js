const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhYjc2MDdlNjlhOTdlOGRiZWE5ZWYxNCIsImlhdCI6MTc5MDU2ODc1OCwiZXhwIjoxNzkwNTY5NjU4fQ.jVNaRPAwMiCbQfRPHtrGiWL3aItK3Y__C0-LWHsDRl0';
const KEY = 'concurrent-' + Date.now(); // fresh key every run

async function send() {
  const res = await fetch('http://localhost:5001/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      'Idempotency-Key': KEY,
    },
    body: JSON.stringify({ type: 'invoice.paid', data: { amount: 100 } }),
  });
  const body = await res.json();
  return { status: res.status, id: body._id };
}

(async () => {
  const results = await Promise.all(Array.from({ length: 10 }, send));
  console.log(results);
  console.log('201 count:', results.filter((r) => r.status === 201).length);
  console.log('200 count:', results.filter((r) => r.status === 200).length);
  console.log('Unique event ids:', new Set(results.map((r) => r.id)).size);
})();