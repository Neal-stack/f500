import { fetchFinnhub } from "@/lib/serverApi";
import { getFinnhubRateLimiter } from "@/lib/rateLimiter";

function metricValue(metric, keys) {
  for (const key of keys) {
    if (metric?.[key] !== undefined && metric?.[key] !== null) {
      return metric[key];
    }
  }
  return null;
}

export async function fetchQuotesBatch(symbols) {
  const limiter = getFinnhubRateLimiter();
  const results = {};

  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        await limiter.acquire();
        const quote = await fetchFinnhub(`/quote?symbol=${encodeURIComponent(symbol)}`);
        results[symbol] = {
          symbol,
          price: quote?.c ?? null,
          change: quote?.d ?? null,
          changePercent: quote?.dp ?? null,
          open: quote?.o ?? null,
          previousClose: quote?.pc ?? null,
        };
      } catch (error) {
        results[symbol] = { symbol, error: error.message };
      }
    })
  );

  return results;
}

export async function fetchMetricsBatch(symbols) {
  const limiter = getFinnhubRateLimiter();
  const results = {};

  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        await limiter.acquire();
        const metricsPayload = await fetchFinnhub(
          `/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all`
        );
        const metric = metricsPayload?.metric || {};
        results[symbol] = {
          symbol,
          pe: metricValue(metric, ["peBasicExclExtraTTM", "peTTM", "peNormalizedAnnual"]),
          eps: metricValue(metric, ["epsBasicExclExtraItemsTTM", "epsTTM", "epsAnnual"]),
          yearHigh: metricValue(metric, ["52WeekHigh", "yearHigh"]),
          yearLow: metricValue(metric, ["52WeekLow", "yearLow"]),
        };
      } catch (error) {
        results[symbol] = { symbol, error: error.message };
      }
    })
  );

  return results;
}
