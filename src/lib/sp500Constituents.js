const SP500_CSV_URL =
  "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv";

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current.trim());
  return values;
}

export async function fetchSp500Constituents() {
  const response = await fetch(SP500_CSV_URL, { next: { revalidate: 86400 } });
  if (!response.ok) {
    throw new Error("Failed to load S&P 500 constituent list.");
  }

  const text = await response.text();
  const lines = text.trim().split("\n");
  const headers = parseCsvLine(lines[0]);

  const symbolIndex = headers.indexOf("Symbol");
  const nameIndex = headers.indexOf("Security");
  const sectorIndex = headers.indexOf("GICS Sector");

  return lines.slice(1).map((line, index) => {
    const cols = parseCsvLine(line);
    return {
      rank: index + 1,
      symbol: cols[symbolIndex] || "N/A",
      name: cols[nameIndex] || "Unknown Company",
      sector: cols[sectorIndex] || "Unknown",
    };
  });
}
