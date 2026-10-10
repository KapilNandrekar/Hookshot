function createLimiter({ limit, windowMs }) {
  const requests = new Map();

  function check(key) {
    const now = Date.now();
    const entry = requests.get(key);

    if (!entry || now >= entry.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true };
    }

    entry.count += 1;

    if (entry.count > limit) {
      const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
      return { allowed: false, retryAfterSeconds };
    }

    return { allowed: true };
  }

  function middleware(getKey) {
    return function (req, res, next) {
      const key = getKey(req);
      const result = check(key);

      if (!result.allowed) {
        res.set('Retry-After', String(result.retryAfterSeconds));
        return res.status(429).json({
          error: 'Too many requests. Please try again later.',
        });
      }

      next();
    };
  }

  return { check, middleware };
}

module.exports = { createLimiter };