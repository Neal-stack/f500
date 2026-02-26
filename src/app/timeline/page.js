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
    <div className="flex flex-col gap-6 py-6">
      <div className="glass-card rounded-3xl p-7 md:p-9">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Market Events Timeline</h1>
        <p className="mt-3 muted-text">Earnings reports for 2024</p>
      </div>

      {loading && (
        <div className="glass-card rounded-2xl p-5">Loading earnings data...</div>
      )}

      {!!error && (
        <div className="rounded-2xl border border-rose-300/30 bg-rose-500/20 p-5 text-rose-100">
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
              <li
                key={`${dateLabel}-${symbol}-${index}`}
                className="glass-card rounded-2xl p-4 md:p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full soft-highlight" />
                    <div>
                      <div className="font-medium">{symbol}</div>
                      <div className="text-sm muted-text">EPS est. {epsEstimate}</div>
                    </div>
                  </div>
                  <div className="text-sm muted-text">{dateLabel}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
