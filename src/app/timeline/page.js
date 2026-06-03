"use client";
import { useEffect, useMemo, useState } from "react";

export default function Timeline() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [minImportance, setMinImportance] = useState(1);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/timeline");
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Failed to load timeline.");
        setEvents(Array.isArray(payload.data) ? payload.data : []);
      } catch (err) {
        setError(err.message || "Failed to load timeline data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function onSelectEvent(event) {
    setSelectedEvent(event);
    setExplanation(null);

    try {
      setLoadingExplanation(true);
      const response = await fetch("/api/timeline/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to explain event.");
      setExplanation(payload.data || null);
    } catch (err) {
      setExplanation({
        whatHappened: "Could not load explanation.",
        whyImportant: err.message || "Please try again.",
        marketEffects: "No analysis available.",
        impactedStocks: [],
      });
    } finally {
      setLoadingExplanation(false);
    }
  }

  const filteredEvents = useMemo(
    () => events.filter((event) => (event.importanceScore || 0) >= minImportance),
    [events, minImportance]
  );

  return (
    <div className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-6">
        <div className="glass-card rounded-3xl p-7 md:p-9">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Market Events Timeline</h1>
          <p className="mt-3 muted-text">
            Live feed combining FRED releases and Finnhub macro + earnings events.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Importance Filter</h2>
            <div className="text-sm muted-text">Min score: {minImportance}</div>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={minImportance}
            onChange={(event) => setMinImportance(Number(event.target.value))}
            className="w-full accent-emerald-400"
          />
        </div>

        {loading && <div className="glass-card rounded-2xl p-5">Loading timeline events...</div>}

        {!!error && (
          <div className="rounded-2xl border border-rose-300/30 bg-rose-500/20 p-5 text-rose-100">
            {error}
          </div>
        )}

        {!loading && !error && (
          <ul className="space-y-3">
            {filteredEvents.map((event) => (
              <li key={event.id}>
                <button
                  onClick={() => onSelectEvent(event)}
                  className={`glass-card w-full rounded-2xl p-4 text-left transition hover:bg-white/10 ${
                    selectedEvent?.id === event.id ? "border border-emerald-300/50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="mt-1 text-sm muted-text">
                        {event.source} • {event.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{event.date}</div>
                      <div className="mt-1 text-xs muted-text">Score {event.importanceScore}/10</div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="glass-card rounded-2xl p-5 h-fit lg:sticky lg:top-28">
        <h2 className="text-xl font-semibold">Event Breakdown</h2>
        {!selectedEvent && (
          <p className="mt-3 text-sm muted-text">
            Click an event to see what happened, why it matters, and impacted stocks.
          </p>
        )}
        {selectedEvent && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wide muted-text">Selected event</div>
              <div className="mt-1 font-semibold">{selectedEvent.title}</div>
              <div className="mt-1 text-sm muted-text">
                {selectedEvent.date} • {selectedEvent.source}
              </div>
            </div>
            {loadingExplanation && <p className="text-sm muted-text">Generating explanation...</p>}
            {!loadingExplanation && explanation && (
              <>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-wide muted-text">What happened</div>
                  <p className="mt-2 text-sm">{explanation.whatHappened}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-wide muted-text">Why important</div>
                  <p className="mt-2 text-sm">{explanation.whyImportant}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-wide muted-text">Market effects</div>
                  <p className="mt-2 text-sm">{explanation.marketEffects}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-wide muted-text">Impacted stocks</div>
                  <p className="mt-2 text-sm">{(explanation.impactedStocks || []).join(", ")}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
