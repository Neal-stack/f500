import { fetchFinnhub } from "@/lib/serverApi";
import { getFinnhubRateLimiter } from "@/lib/rateLimiter";

const CACHE_TTL_MS = 30 * 60 * 1000;
const QUOTE_BATCH_SIZE = 58;
const METRIC_BATCH_SIZE = 58;

const emptyMarketFields = {
  price: null,
  change: null,
  changePercent: null,
  marketCap: null,
  pe: null,
  eps: null,
  yearHigh: null,
  yearLow: null,
  open: null,
  previousClose: null,
};

function getStore() {
  if (!globalThis.__f500StockCache) {
    globalThis.__f500StockCache = {
      full: null,
      partial: new Map(),
      building: false,
      quotesComplete: false,
      builtAt: 0,
    };
  }
  return globalThis.__f500StockCache;
}

function metricValue(metric, keys) {
  for (const key of keys) {
    if (metric?.[key] !== undefined && metric?.[key] !== null) {
      return metric[key];
    }
  }
  return null;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function fetchQuote(symbol) {
  const limiter = getFinnhubRateLimiter();
  await limiter.acquire();
  const quote = await fetchFinnhub(`/quote?symbol=${encodeURIComponent(symbol)}`);
  return {
    price: quote?.c ?? null,
    change: quote?.d ?? null,
    changePercent: quote?.dp ?? null,
    open: quote?.o ?? null,
    previousClose: quote?.pc ?? null,
  };
}

async function fetchMetrics(symbol) {
  const limiter = getFinnhubRateLimiter();
  await limiter.acquire();
  const metricsPayload = await fetchFinnhub(
    `/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all`
  );
  await limiter.acquire();
  const profile = await fetchFinnhub(
    `/stock/profile2?symbol=${encodeURIComponent(symbol)}`
  );

  const metric = metricsPayload?.metric || {};

  return {
    marketCap:
      profile?.marketCapitalization != null
        ? profile.marketCapitalization * 1_000_000
        : null,
    pe: metricValue(metric, ["peBasicExclExtraTTM", "peTTM", "peNormalizedAnnual"]),
    eps: metricValue(metric, ["epsBasicExclExtraItemsTTM", "epsTTM", "epsAnnual"]),
    yearHigh: metricValue(metric, ["52WeekHigh", "yearHigh"]),
    yearLow: metricValue(metric, ["52WeekLow", "yearLow"]),
  };
}

function mergeIntoPartial(symbol, patch) {
  const store = getStore();
  store.partial.set(symbol, { ...emptyMarketFields, ...store.partial.get(symbol), ...patch });
}

function buildFullList(constituents) {
  const store = getStore();
  return constituents.map((company) => ({
    ...company,
    ...emptyMarketFields,
    ...store.partial.get(company.symbol),
  }));
}

function countWithPrices(data) {
  return data.filter((row) => row.price !== null).length;
}

export function getCachedStocksResponse(constituents) {
  const store = getStore();
  const isFresh = store.full && Date.now() - store.builtAt < CACHE_TTL_MS;

  if (isFresh) {
    return {
      data: store.full,
      meta: { complete: true, loaded: store.full.length, total: store.full.length },
    };
  }

  const data = buildFullList(constituents);
  return {
    data,
    meta: {
      complete: false,
      building: store.building,
      quotesComplete: store.quotesComplete,
      loaded: countWithPrices(data),
      total: data.length,
    },
  };
}

export function startMarketDataBuild(constituents) {
  const store = getStore();
  if (store.building) return;
  if (store.full && Date.now() - store.builtAt < CACHE_TTL_MS) return;

  store.building = true;
  store.quotesComplete = false;

  void (async () => {
    try {
      const symbols = constituents.map((company) => company.symbol);

      for (const batch of chunkArray(symbols, QUOTE_BATCH_SIZE)) {
        await Promise.all(
          batch.map(async (symbol) => {
            try {
              mergeIntoPartial(symbol, await fetchQuote(symbol));
            } catch {
              mergeIntoPartial(symbol, {});
            }
          })
        );
      }

      store.quotesComplete = true;

      for (const batch of chunkArray(symbols, METRIC_BATCH_SIZE)) {
        await Promise.all(
          batch.map(async (symbol) => {
            try {
              mergeIntoPartial(symbol, await fetchMetrics(symbol));
            } catch {
              mergeIntoPartial(symbol, {});
            }
          })
        );
      }

      store.full = buildFullList(constituents);
      store.builtAt = Date.now();
    } finally {
      store.building = false;
    }
  })();
}

export { emptyMarketFields };
