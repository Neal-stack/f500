import { NextResponse } from "next/server";
import { getCachedStocksResponse, startMarketDataBuild } from "@/lib/marketDataCache";
import { fetchSp500Constituents } from "@/lib/sp500Constituents";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const constituents = await fetchSp500Constituents();
    const response = getCachedStocksResponse(constituents);

    if (!response.meta.complete) {
      startMarketDataBuild(constituents);
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch S&P 500 company list.", details: error.message },
      { status: 500 }
    );
  }
}
