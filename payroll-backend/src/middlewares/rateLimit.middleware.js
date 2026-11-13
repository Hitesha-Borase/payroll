/**
 * In-Memory Sliding Window Rate Limiter Middleware
 * Protects sensitive endpoints (e.g. Google Play purchase verification) against brute force attacks
 */

const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 30, // max requests per windowMs
  message = 'Too many requests from this client. Please try again later.'
} = {}) => {
  const requests = new Map();

  // Periodic cleanup of expired entries every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(t => now - t < windowMs);
      if (validTimestamps.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, validTimestamps);
      }
    }
  }, 5 * 60 * 1000);

  // Unref interval so it does not block node process exit in tests
  if (cleanupInterval.unref) cleanupInterval.unref();

  return (req, res, next) => {
    // Generate rate-limit key based on authenticated user ID or client IP
    const key = req.user?.id ? `user_${req.user.id}` : (req.ip || req.connection?.remoteAddress || 'unknown');
    const now = Date.now();

    const currentTimestamps = requests.get(key) || [];
    const validTimestamps = currentTimestamps.filter(t => now - t < windowMs);

    if (validTimestamps.length >= max) {
      const oldestTimestamp = validTimestamps[0];
      const resetTimeMs = windowMs - (now - oldestTimestamp);
      res.setHeader('Retry-After', Math.ceil(resetTimeMs / 1000));
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: Math.ceil(resetTimeMs / 1000)
      });
    }

    validTimestamps.push(now);
    requests.set(key, validTimestamps);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', max - validTimestamps.length);

    next();
  };
};

module.exports = {
  createRateLimiter,
  googlePlayVerifyLimiter: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Too many Google Play verification attempts. Please try again in a few minutes.'
  })
};

