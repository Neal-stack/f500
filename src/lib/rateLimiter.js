const FINNHUB_LIMIT_PER_MINUTE = 58;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createRateLimiter(maxPerMinute = FINNHUB_LIMIT_PER_MINUTE) {
  const timestamps = [];

  return {
    async acquire() {
      while (timestamps.length >= maxPerMinute) {
        const oldest = timestamps[0];
        const waitMs = 60_000 - (Date.now() - oldest) + 50;
        if (waitMs > 0) await sleep(waitMs);
        while (timestamps.length && Date.now() - timestamps[0] >= 60_000) {
          timestamps.shift();
        }
      }
      timestamps.push(Date.now());
    },
  };
}

const globalLimiter = globalThis.__f500RateLimiter ?? createRateLimiter();
globalThis.__f500RateLimiter = globalLimiter;

export function getFinnhubRateLimiter() {
  return globalLimiter;
}
