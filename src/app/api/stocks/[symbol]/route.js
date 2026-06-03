import { NextResponse } from "next/server";
import { fetchFmp, summarizeWithOpenAI } from "@/lib/serverApi";

function compactArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export async function GET(_request, { params }) {
  const symbol = params?.symbol?.toUpperCase();
  if (!symbol) {
    return NextResponse.json({ error: "Missing stock symbol." }, { status: 400 });
  }

  try {
    const [profile, financials, ratios, earnings] = await Promise.all([
      fetchFmp(`/profile/${symbol}`),
      fetchFmp(`/income-statement/${symbol}?period=annual&limit=4`),
      fetchFmp(`/ratios/${symbol}?period=annual&limit=4`),
      fetchFmp(`/historical/earning_calendar/${symbol}?limit=8`),
    ]);

    const profileEntry = compactArray(profile)[0] || {};
    const financialEntries = compactArray(financials);
    const ratioEntries = compactArray(ratios);
    const earningEntries = compactArray(earnings);

    const summaryPrompt = `
Symbol: ${symbol}
Company: ${profileEntry.companyName || "Unknown"}
Sector: ${profileEntry.sector || "Unknown"}
Price: ${profileEntry.price || "N/A"}
Market Cap: ${profileEntry.mktCap || "N/A"}

Latest income statement: ${JSON.stringify(financialEntries[0] || {})}
Latest ratios: ${JSON.stringify(ratioEntries[0] || {})}
Recent earnings item: ${JSON.stringify(earningEntries[0] || {})}

Write a short investment snapshot in 4 bullet points:
1) Business profile
2) Financial trend
3) Valuation/quality signal
4) What to watch next quarter
`;

    const aiSummary = await summarizeWithOpenAI(
      summaryPrompt,
      "You are a strict financial research assistant. Do not provide investment advice. Be concise and factual."
    );

    return NextResponse.json({
      data: {
        symbol,
        profile: profileEntry,
        financials: financialEntries,
        ratios: ratioEntries,
        earnings: earningEntries,
        summary: aiSummary,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch stock details for ${symbol}.`, details: error.message },
      { status: 500 }
    );
  }
}
