import { NextResponse } from "next/server";
import { fetchFmp } from "@/lib/serverApi";

export async function GET() {
  try {
    const constituents = await fetchFmp("/sp500_constituent");
    const list = Array.isArray(constituents) ? constituents : [];

    const normalized = list.map((company, index) => ({
      rank: index + 1,
      symbol: company.symbol || "N/A",
      name: company.name || "Unknown Company",
      sector: company.sector || "Unknown",
      subSector: company.subSector || "Unknown",
      headquarters: company.headQuarter || "Unknown",
      founded: company.founded || "Unknown",
    }));

    return NextResponse.json({ data: normalized });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch S&P 500 company list.", details: error.message },
      { status: 500 }
    );
  }
}
