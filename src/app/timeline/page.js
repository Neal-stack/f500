"use client";
import { useEffect, useState } from 'react';
import { getEarningsData } from '../api/data';

export default function Timeline() {
  const [earningsData, setEarningsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError("");
        const earnings = await getEarningsData();
        setEarningsData(Array.isArray(earnings) ? earnings : []);
      } catch (e) {
        setError("Failed to load earnings data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Market Events Timeline</h1>
        <p className="mt-2 text-neutral-400">Earnings reports for 2024</p>
      </div>

      {loading && (
        <div className="rounded-md border border-neutral-800 p-4">Loading…</div>
      )}

      {!!error && (
        <div className="rounded-md border border-red-900 bg-red-950/40 p-4 text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && (
        <ul className="space-y-3">
          {earningsData.map((earn, index) => {
            const dateLabel = earn?.date ?? "Unknown date";
            const symbol = earn?.symbol ?? "—";
            const epsEstimate = earn?.epsEstimate ?? "N/A";
            return (
              <li key={`${dateLabel}-${symbol}-${index}`} className="rounded-md border border-neutral-800 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-2 w-2 rounded-full bg-white/80" />
                    <div>
                      <div className="font-medium">{symbol}</div>
                      <div className="text-sm text-neutral-400">EPS est. {epsEstimate}</div>
                    </div>
                  </div>
                  <div className="text-sm text-neutral-300">{dateLabel}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
