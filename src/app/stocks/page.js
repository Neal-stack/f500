"use client";

import { useEffect, useMemo, useState } from "react";

const STAT_COLUMNS = [
  {
    key: "symbol",
    label: "Symbol",
    sortable: true,
    blurb:
      "The ticker symbol is the short code used to identify a company on exchanges. It is the fastest way to look up quotes, news, and filings when comparing companies.",
  },
  {
    key: "name",
    label: "Name",
    sortable: true,
    blurb:
      "The legal or commonly used company name. Use it to confirm you are analyzing the right business, especially when multiple brands operate under one parent company.",
  },
  {
    key: "price",
    label: "Price",
    sortable: true,
    blurb:
      "The latest traded share price. Price alone does not indicate value; compare it with earnings, cash flow, and growth to judge whether a stock looks expensive or cheap.",
  },
  {
    key: "changePercent",
    label: "Change %",
    sortable: true,
    blurb:
      "How much the stock moved today as a percentage. Large daily moves often reflect earnings, macro news, or sentiment shifts rather than long-term business changes.",
  },
  {
    key: "marketCap",
    label: "Market Cap",
    sortable: true,
    blurb:
      "Total market value of all outstanding shares (price × shares). It helps classify companies as large-cap, mid-cap, or small-cap and compare size across the market.",
  },
  {
    key: "pe",
    label: "P/E",
    sortable: true,
    blurb:
      "Price-to-earnings ratio compares share price to earnings per share. Higher P/E can mean growth expectations; lower P/E can mean value or weaker outlook. Compare within the same sector.",
  },
  {
    key: "eps",
    label: "EPS",
    sortable: true,
    blurb:
      "Earnings per share shows profit allocated to each share. Rising EPS over time often signals improving profitability, while falling EPS can warn of margin or demand pressure.",
  },
  {
    key: "yearHigh",
    label: "52W High",
    sortable: true,
    blurb:
      "The highest price over the past year. Stocks near their 52-week high may reflect strong momentum, while distance from the high can reveal recent drawdowns.",
  },
  {
    key: "yearLow",
    label: "52W Low",
    sortable: true,
    blurb:
      "The lowest price over the past year. Comparing current price to the 52-week range helps gauge whether a stock is near support, resistance, or recovery territory.",
  },
];

function formatValue(key, value) {
  if (value === null || value === undefined || value === "") return "—";

  switch (key) {
    case "price":
    case "yearHigh":
    case "yearLow":
    case "open":
    case "previousClose":
    case "priceAvg50":
    case "priceAvg200":
      return `$${Number(value).toFixed(2)}`;
    case "changePercent":
      return `${Number(value).toFixed(2)}%`;
    case "marketCap": {
      const cap = Number(value);
      if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
      if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
      if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
      return `$${cap.toLocaleString()}`;
    }
    case "volume":
    case "avgVolume":
      return Number(value).toLocaleString();
    case "pe":
    case "eps":
      return Number(value).toFixed(2);
    default:
      return String(value);
  }
}

function StatPopover({ stat, position, onClose }) {
  if (!stat) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close statistic info"
        className="fixed inset-0 z-40 cursor-default bg-black/20"
        onClick={onClose}
      />
      <div
        className="glass-card fixed z-50 w-72 rounded-2xl border border-emerald-300/30 p-4 shadow-2xl"
        style={{ top: position.top, left: position.left }}
      >
        <div className="text-sm font-semibold text-emerald-200">{stat.label}</div>
        <p className="mt-2 text-sm leading-relaxed muted-text">{stat.blurb}</p>
      </div>
    </>
  );
}

const POLL_INTERVAL_MS = 2000;

export default function StocksPage() {
  const [stocks, setStocks] = useState([]);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("rank");
  const [sortDir, setSortDir] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [loadingMarketData, setLoadingMarketData] = useState(false);
  const [marketProgress, setMarketProgress] = useState({ loaded: 0, total: 0 });
  const [quotesComplete, setQuotesComplete] = useState(false);
  const [error, setError] = useState("");
  const [activeStat, setActiveStat] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    let cancelled = false;
    let pollTimer;

    async function refreshStocks(isInitial = false) {
      try {
        if (isInitial) {
          setLoading(true);
          setError("");
        }

        const response = await fetch("/api/stocks");
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.details || payload.error || "Failed to fetch stocks");
        }

        if (cancelled) return;

        const list = Array.isArray(payload.data) ? payload.data : [];
        const meta = payload.meta || {};
        setStocks(list);
        setMarketProgress({
          loaded: meta.loaded ?? list.filter((row) => row.price !== null).length,
          total: meta.total ?? list.length,
        });
        setQuotesComplete(Boolean(meta.quotesComplete || meta.complete));
        setLoadingMarketData(!meta.complete);

        if (!meta.complete) {
          pollTimer = window.setTimeout(() => refreshStocks(false), POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load stock list.");
        }
      } finally {
        if (isInitial && !cancelled) setLoading(false);
      }
    }

    refreshStocks(true);

    return () => {
      cancelled = true;
      if (pollTimer) window.clearTimeout(pollTimer);
    };
  }, []);

  const filteredStocks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stocks;
    return stocks.filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(q) || stock.name.toLowerCase().includes(q)
    );
  }, [stocks, query]);

  const sortedStocks = useMemo(() => {
    const copy = [...filteredStocks];
    copy.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aText = String(aVal ?? "").toLowerCase();
      const bText = String(bVal ?? "").toLowerCase();
      if (aText < bText) return sortDir === "asc" ? -1 : 1;
      if (aText > bText) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredStocks, sortKey, sortDir]);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "symbol" || key === "name" ? "asc" : "desc");
  }

  function openStatInfo(stat, event) {
    const cardWidth = 288;
    const cardHeight = 180;
    const padding = 12;

    let top = event.clientY + 10;
    let left = event.clientX - cardWidth / 2;

    if (left + cardWidth > window.innerWidth - padding) {
      left = window.innerWidth - cardWidth - padding;
    }
    if (left < padding) left = padding;
    if (top + cardHeight > window.innerHeight - padding) {
      top = event.clientY - cardHeight - 10;
    }

    setPopoverPos({ top, left });
    setActiveStat(stat);
  }

  return (
    <section className="space-y-6">
      <div className="glass-card rounded-3xl p-8 md:p-10">
        <h1 className="text-3xl md:text-4xl font-bold">Stocks</h1>
        <p className="mt-3 muted-text">
          S&P 500 companies with live price and key statistics. Click any column
          header to learn what that metric means and how to use it.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-300/30 bg-rose-500/20 p-5 text-rose-100">
          {error}
        </div>
      )}

      <div className="glass-card rounded-2xl p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Top 500 US Stocks</h2>
          <div className="text-xs muted-text">
            {sortedStocks.length} companies
            {loadingMarketData &&
              ` · ${quotesComplete ? "loading fundamentals" : "loading prices"} ${marketProgress.loaded}/${marketProgress.total}`}
          </div>
        </div>

        {loadingMarketData && marketProgress.total > 0 && (
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500"
              style={{
                width: `${Math.round((marketProgress.loaded / marketProgress.total) * 100)}%`,
              }}
            />
          </div>
        )}

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search symbol or company"
          className="mb-4 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 outline-none placeholder:text-white/50 focus:border-emerald-300/60 sm:max-w-sm"
        />

        {loading && <div className="muted-text">Loading stock table...</div>}

        {!loading && (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-3 py-3 font-medium muted-text">#</th>
                  {STAT_COLUMNS.map((column) => (
                    <th key={column.key} className="px-3 py-3">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(event) => openStatInfo(column, event)}
                          className="rounded-md px-1 py-0.5 font-medium transition hover:bg-emerald-400/10 hover:text-emerald-200"
                        >
                          {column.label}
                        </button>
                        {column.sortable && (
                          <button
                            type="button"
                            aria-label={`Sort by ${column.label}`}
                            onClick={() => handleSort(column.key)}
                            className="rounded px-1 text-xs muted-text transition hover:bg-white/10 hover:text-white"
                          >
                            {sortKey === column.key ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedStocks.map((stock) => (
                  <tr
                    key={stock.symbol}
                    className="border-b border-white/5 transition hover:bg-white/5"
                  >
                    <td className="px-3 py-3 muted-text">{stock.rank}</td>
                    {STAT_COLUMNS.map((column) => {
                      const raw = stock[column.key];
                      const formatted = formatValue(column.key, raw);
                      const isChange = column.key === "changePercent" && raw !== null;
                      const changeClass =
                        isChange && Number(raw) > 0
                          ? "text-emerald-300"
                          : isChange && Number(raw) < 0
                            ? "text-rose-300"
                            : "";

                      return (
                        <td key={`${stock.symbol}-${column.key}`} className="px-3 py-3">
                          <button
                            type="button"
                            onClick={(event) => openStatInfo(column, event)}
                            className={`rounded-md px-1 py-0.5 transition hover:bg-white/10 ${changeClass}`}
                          >
                            {formatted}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StatPopover
        stat={activeStat}
        position={popoverPos}
        onClose={() => setActiveStat(null)}
      />
    </section>
  );
}
