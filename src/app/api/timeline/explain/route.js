import { NextResponse } from "next/server";
import { summarizeWithOpenAI } from "@/lib/serverApi";

function fallbackExplanation(event) {
  const symbolText = event?.symbol ? ` Primary ticker: ${event.symbol}.` : "";
  return {
    whatHappened: `${event.title} is a scheduled ${event.category} update from ${event.source}.${symbolText}`,
    whyImportant:
      "These events can shift expectations for rates, growth, inflation, or company performance, which can move risk assets quickly.",
    marketEffects:
      "Watch for moves in broad indexes, Treasury yields, and sectors most exposed to the event surprise versus consensus.",
    impactedStocks: event?.symbol ? [event.symbol] : ["SPY", "QQQ", "DIA"],
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const event = body?.event;

    if (!event?.title || !event?.date) {
      return NextResponse.json({ error: "Invalid event payload." }, { status: 400 });
    }

    const prompt = `
You are explaining a market event to an investor.
Event:
${JSON.stringify(event)}

Return strict JSON with this shape:
{
  "whatHappened": "string",
  "whyImportant": "string",
  "marketEffects": "string",
  "impactedStocks": ["symbol1", "symbol2", "symbol3"]
}
Use concise plain language. impactedStocks should be 3-8 tickers or ETFs.
`;

    const aiText = await summarizeWithOpenAI(
      prompt,
      "You are a macro and equity market analyst. Output only valid JSON with no markdown."
    );

    if (!aiText) {
      return NextResponse.json({ data: fallbackExplanation(event) });
    }

    try {
      const parsed = JSON.parse(aiText);
      return NextResponse.json({ data: parsed });
    } catch {
      return NextResponse.json({ data: fallbackExplanation(event) });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate event explanation.", details: error.message },
      { status: 500 }
    );
  }
}
