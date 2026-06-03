"use client";

import { useEffect, useMemo, useState } from "react";

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs uppercase tracking-wide muted-text">{label}</div>
      <div className="mt-1 font-semibold">{value ?? "N/A"}</div>
    </div>
  );
}

export default function StocksPage() {
  const [stocks, setStocks] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [stockDetails, setStockDetails] = useState(null);
  const [query, setQuery] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadList() {
      try {
        setLoadingList(true);
        setError("");
        const response = await fetch("/api/stocks");
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Failed to fetch stocks");
        const data = Array.isArray(payload.data) ? payload.data : [];
        setStocks(data);
        if (data[0]?.symbol) {
          setSelectedSymbol(data[0].symbol);
        }
      } catch (err) {
        setError(err.message || "Could not load stock list.");
      } finally {
        setLoadingList(false);
      }
    }
    loadList();
  }, []);

  useEffect(() => {
    if (!selectedSymbol) return;

    async function loadDetails() {
      try {
        setLoadingDetails(true);
        const response = await fetch(`/api/stocks/${selectedSymbol}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Failed to fetch stock details");
        setStockDetails(payload.data || null);
      } catch (err) {
        setStockDetails(null);
        setError(err.message || "Could not load stock details.");
      } finally {
        setLoadingDetails(false);
      }
    }
    loadDetails();
  }, [selectedSymbol]);

  const filteredStocks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stocks;
    return stocks.filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(q) || stock.name.toLowerCase().includes(q)
    );
  }, [stocks, query]);

  const latestFinancial = stockDetails?.financials?.[0];
  const latestRatio = stockDetails?.ratios?.[0];
  const latestEarning = stockDetails?.earnings?.[0];

  return (
    <section className="space-y-6">
      <div className="glass-card rounded-3xl p-8 md:p-10">
        <h1 className="text-3xl md:text-4xl font-bold">Stocks</h1>
        <p className="mt-3 muted-text">
          Browse the top 500 tradeable companies and inspect profile, financials,
          ratios, and earnings detail.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-300/30 bg-rose-500/20 p-5 text-rose-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_1.2fr]">
        <div className="glass-card rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">S&P 500 List</h2>
            <div className="text-xs muted-text">{filteredStocks.length} companies</div>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search symbol or company"
            className="mb-4 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 outline-none placeholder:text-white/50 focus:border-emerald-300/60"
          />
          <div className="max-h-[560px] space-y-2 overflow-auto pr-1">
            {loadingList && <div className="muted-text">Loading stock list...</div>}
            {!loadingList &&
              filteredStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => setSelectedSymbol(stock.symbol)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                    selectedSymbol === stock.symbol
                      ? "border-emerald-300/60 bg-emerald-400/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{stock.symbol}</div>
                    <div className="text-xs muted-text">#{stock.rank}</div>
                  </div>
                  <div className="mt-1 text-sm">{stock.name}</div>
                  <div className="mt-1 text-xs muted-text">{stock.sector}</div>
                </button>
              ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Company Snapshot</h2>
            <span className="rounded-full chip px-3 py-1 text-xs">{selectedSymbol || "None"}</span>
          </div>

          {loadingDetails && <div className="mt-4 muted-text">Loading details...</div>}
          {!loadingDetails && !stockDetails && (
            <div className="mt-4 muted-text">Select a stock to view statistics.</div>
          )}

          {!loadingDetails && stockDetails && (
            <div className="mt-4 space-y-5">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <Metric label="Price" value={stockDetails.profile?.price} />
                <Metric label="Market Cap" value={stockDetails.profile?.mktCap} />
                <Metric label="Beta" value={stockDetails.profile?.beta} />
                <Metric label="P/E" value={latestRatio?.priceEarningsRatio} />
                <Metric label="ROE" value={latestRatio?.returnOnEquity} />
                <Metric label="Revenue" value={latestFinancial?.revenue} />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="font-semibold">Profile</h3>
                <p className="mt-2 text-sm muted-text">
                  {stockDetails.profile?.description || "No profile description available."}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="font-semibold">Latest Earnings</h3>
                <p className="mt-2 text-sm muted-text">
                  Date: {latestEarning?.date || "N/A"} | EPS: {latestEarning?.eps || "N/A"} |
                  Estimate: {latestEarning?.epsEstimated || "N/A"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="font-semibold">AI Summary</h3>
                <p className="mt-2 text-sm whitespace-pre-line muted-text">
                  {stockDetails.summary || "Add OPENAI_API_KEY to generate model summaries."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
