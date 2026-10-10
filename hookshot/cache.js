const store = new Map(); 
let hits = 0;
let misses = 0;

function get(key) {
  const entry = store.get(key);

  if (!entry) {
    misses++;
    return undefined;
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    misses++;
    return undefined;
  }

  hits++;
  return entry.value;
}

function set(key, value, ttlMs) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

function del(key) {
  store.delete(key);
}

function getStats() {
  return { hits, misses, size: store.size };
}

module.exports = { get, set, del, getStats };