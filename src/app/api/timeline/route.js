import { NextResponse } from "next/server";
import { fetchFinnhub, fetchFred } from "@/lib/serverApi";

const DEFAULT_WINDOW_DAYS = 45;
const FRED_RELEASE_IDS = [10, 53, 54, 50, 103, 26];

function dateRange(days = DEFAULT_WINDOW_DAYS) {
  const fromDate = new Date();
  const toDate = new Date();
  toDate.setDate(toDate.getDate() + days);
  return {
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
  };
}

function scoreEvent(event) {
  let score = 1;
  const title = `${event.title} ${event.category}`.toLowerCase();

  if (title.includes("fomc") || title.includes("interest rate")) score += 5;
  if (title.includes("cpi") || title.includes("inflation")) score += 4;
  if (title.includes("gdp")) score += 3;
  if (title.includes("employment") || title.includes("unemployment")) score += 3;
  if (event.category === "earnings") score += 2;
  if (["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA"].includes(event.symbol)) {
    score += 3;
  }

  return Math.min(10, score);
}

function normalizeEarningsRows(payload) {
  const rows = payload?.earningsCalendar || payload?.earnings || [];
  if (!Array.isArray(rows)) return [];
  return rows.map((item) => ({
    id: `earnings-${item.symbol}-${item.date}`,
    source: "Finnhub",
    category: "earnings",
    title: `${item.symbol} earnings`,
    date: item.date,
    symbol: item.symbol,
    raw: item,
  }));
}

function normalizeEconomicRows(payload) {
  const rows = payload?.economicCalendar || [];
  if (!Array.isArray(rows)) return [];
  return rows.map((item, index) => ({
    id: `econ-${item.event || "event"}-${item.time || index}-${item.date || ""}`,
    source: "Finnhub",
    category: "macro",
    title: item.event || "Economic release",
    date: item.date || "",
    symbol: null,
    raw: item,
  }));
}

async function fetchFredReleases(from, to) {
  const responses = await Promise.all(
    FRED_RELEASE_IDS.map(async (releaseId) => {
      const data = await fetchFred(
        `/release/dates?release_id=${releaseId}&realtime_start=${from}&realtime_end=${to}`
      );
      const releaseDates = Array.isArray(data?.release_dates) ? data.release_dates : [];
      return releaseDates.slice(0, 8).map((entry, index) => ({
        id: `fred-${releaseId}-${entry.date}-${index}`,
        source: "FRED",
        category: "economic-release",
        title: entry.release_name || "Economic release",
        date: entry.date,
        symbol: null,
        raw: entry,
      }));
    })
  );

  return responses.flat();
}

export async function GET() {
  try {
    const { from, to } = dateRange();
    const [earningsPayload, econPayload, fredEvents] = await Promise.all([
      fetchFinnhub(`/calendar/earnings?from=${from}&to=${to}`),
      fetchFinnhub(`/calendar/economic?from=${from}&to=${to}`),
      fetchFredReleases(from, to),
    ]);

    const combined = [
      ...normalizeEarningsRows(earningsPayload),
      ...normalizeEconomicRows(econPayload),
      ...fredEvents,
    ]
      .filter((event) => event.date)
      .map((event) => ({ ...event, importanceScore: scoreEvent(event) }))
      .sort((a, b) => {
        if (a.date === b.date) return b.importanceScore - a.importanceScore;
        return a.date.localeCompare(b.date);
      });

    return NextResponse.json({ data: combined.slice(0, 250) });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load timeline data.", details: error.message },
      { status: 500 }
    );
  }
}
