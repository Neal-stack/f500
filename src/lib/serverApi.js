const FMP_BASE_URL = "https://financialmodelingprep.com/stable";
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FRED_BASE_URL = "https://api.stlouisfed.org/fred";
const OPENAI_BASE_URL = "https://api.openai.com/v1";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function safeJsonFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed (${response.status}): ${text.slice(0, 200)}`);
  }

  return response.json();
}

export async function fetchFmp(path) {
  const apiKey = requiredEnv("FMP_API_KEY").trim();
  if (apiKey.includes("your_") || apiKey.includes("_here")) {
    throw new Error(
      "FMP_API_KEY is still a placeholder. Save your real key in .env.local and restart the dev server."
    );
  }

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const joinChar = cleanPath.includes("?") ? "&" : "?";
  const url = `${FMP_BASE_URL}/${cleanPath}${joinChar}apikey=${apiKey}`;
  return safeJsonFetch(url);
}

export async function fetchFinnhub(path) {
  const apiKey = requiredEnv("FINNHUB_API_KEY").trim();
  const joinChar = path.includes("?") ? "&" : "?";
  const url = `${FINNHUB_BASE_URL}${path}${joinChar}token=${apiKey}`;
  return safeJsonFetch(url);
}

export async function fetchFred(path) {
  const apiKey = requiredEnv("FRED_API_KEY");
  const joinChar = path.includes("?") ? "&" : "?";
  const url = `${FRED_BASE_URL}${path}${joinChar}api_key=${apiKey}&file_type=json`;
  return safeJsonFetch(url);
}

export async function summarizeWithOpenAI(prompt, systemPrompt) {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    return null;
  }

  const body = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          systemPrompt ||
          "You are a financial analyst assistant. Keep responses factual and concise.",
      },
      { role: "user", content: prompt },
    ],
  };

  const data = await safeJsonFetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify(body),
    next: { revalidate: 0 },
  });

  return data?.choices?.[0]?.message?.content?.trim() || null;
}
