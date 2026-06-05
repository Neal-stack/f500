import { NextResponse } from "next/server";
import { fetchMetricsBatch, fetchQuotesBatch } from "@/lib/finnhubMarket";

const MAX_BATCH_SIZE = 58;

export async function POST(request) {
  try {
    const body = await request.json();
    const symbols = Array.isArray(body?.symbols) ? body.symbols : [];
    const mode = body?.mode === "metrics" ? "metrics" : "quote";

    if (!symbols.length) {
      return NextResponse.json({ error: "No symbols provided." }, { status: 400 });
    }

    if (symbols.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Batch limit is ${MAX_BATCH_SIZE} symbols per request.` },
        { status: 400 }
      );
    }

    const normalized = symbols.map((symbol) => String(symbol).toUpperCase());
    const data =
      mode === "metrics"
        ? await fetchMetricsBatch(normalized)
        : await fetchQuotesBatch(normalized);

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch market data.", details: error.message },
      { status: 500 }
    );
  }
}
