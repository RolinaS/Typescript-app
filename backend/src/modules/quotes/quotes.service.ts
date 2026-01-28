import { db } from "../../config/db";
import { env } from "../../config/env"; // si tu n'as pas env.ts ici, adapte (process.env)

export type MarketQuoteRow = {
  symbol: string;
  price: string;
  previous_close: string | null;
  change: string | null;
  change_percent: string | null;
  fetched_at: string;
};

export type MarketQuote = {
  symbol: string;
  price: number;
  previous_close: number | null;
  change: number | null;
  change_percent: number | null;
  fetched_at: string;
};

type FinnhubQuote = {
  c: number;  // current
  pc: number; // previous close
  d: number;  // change
  dp: number; // change percent
  // o,h,l,t...
};

function ttlSeconds(): number {
  const v = Number((env as any).QUOTE_TTL_SECONDS ?? process.env.QUOTE_TTL_SECONDS ?? 60);
  return Number.isFinite(v) && v > 0 ? v : 60;
}

function apiKey(): string {
  const k = String((env as any).FINNHUB_API_KEY ?? process.env.FINNHUB_API_KEY ?? "").trim();
  if (!k) throw new Error("FINNHUB_API_KEY manquant");
  return k;
}

function toQuote(r: MarketQuoteRow): MarketQuote {
  return {
    symbol: r.symbol,
    price: Number(r.price),
    previous_close: r.previous_close === null ? null : Number(r.previous_close),
    change: r.change === null ? null : Number(r.change),
    change_percent: r.change_percent === null ? null : Number(r.change_percent),
    fetched_at: r.fetched_at,
  };
}

async function fetchFinnhub(symbol: string): Promise<MarketQuote> {
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey()}`;
  const r = await fetch(url);

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`Finnhub HTTP ${r.status} (${symbol}) ${txt}`.trim());
  }

  const j = (await r.json()) as FinnhubQuote;

  // Finnhub renvoie parfois 0 si symbol invalide
  if (!j || typeof j.c !== "number" || j.c <= 0) {
    throw new Error(`Quote invalide pour ${symbol}`);
  }

  return {
    symbol,
    price: j.c,
    previous_close: typeof j.pc === "number" && j.pc > 0 ? j.pc : null,
    change: typeof j.d === "number" ? j.d : null,
    change_percent: typeof j.dp === "number" ? j.dp : null,
    fetched_at: new Date().toISOString(),
  };
}

async function upsertQuote(q: MarketQuote): Promise<void> {
  await db.query(
    `
    INSERT INTO market_quotes(symbol, price, previous_close, change, change_percent, fetched_at)
    VALUES ($1,$2,$3,$4,$5,NOW())
    ON CONFLICT (symbol) DO UPDATE SET
      price = EXCLUDED.price,
      previous_close = EXCLUDED.previous_close,
      change = EXCLUDED.change,
      change_percent = EXCLUDED.change_percent,
      fetched_at = NOW()
    `,
    [q.symbol, q.price, q.previous_close, q.change, q.change_percent]
  );
}

export async function getQuotesCached(symbols: string[]): Promise<MarketQuote[]> {
  const ttl = ttlSeconds();

  // 1) chercher en DB les quotes fraîches
  const { rows: cached } = await db.query<MarketQuoteRow>(
    `
    SELECT symbol, price::text, previous_close::text, change::text, change_percent::text, fetched_at::text
    FROM market_quotes
    WHERE symbol = ANY($1)
      AND fetched_at > NOW() - ($2 || ' seconds')::interval
    `,
    [symbols, ttl]
  );

  const map = new Map<string, MarketQuote>();
  cached.forEach((r) => map.set(r.symbol, toQuote(r)));

  // 2) fetch ceux manquants
  const missing = symbols.filter((s) => !map.has(s));
  if (missing.length > 0) {
    const fetched = await Promise.all(
      missing.map(async (sym) => {
        const q = await fetchFinnhub(sym);
        await upsertQuote(q);
        return q;
      })
    );

    fetched.forEach((q) => map.set(q.symbol, q));
  }

  // 3) renvoyer dans l’ordre demandé
  return symbols.map((s) => map.get(s)).filter(Boolean) as MarketQuote[];
}

export async function getQuoteCached(symbol: string): Promise<MarketQuote | null> {
  const data = await getQuotesCached([symbol]);
  return data[0] ?? null;
}

/**
 * Force refresh :
 * - si symbols = null -> refresh tous les symbols de portfolio_holdings
 * - sinon refresh uniquement la liste
 */
export async function refreshQuotes(symbols: string[] | null): Promise<MarketQuote[]> {
  let list = symbols?.length ? symbols : null;

  if (!list) {
    const { rows } = await db.query<{ symbol: string }>(`
      SELECT DISTINCT symbol
      FROM portfolio_holdings
      WHERE symbol IS NOT NULL AND symbol <> ''
      ORDER BY symbol ASC
    `);
    list = rows.map((r) => String(r.symbol).trim().toUpperCase()).filter(Boolean);
  }

  if (!list || list.length === 0) return [];

  const refreshed = await Promise.all(
    list.map(async (sym) => {
      const q = await fetchFinnhub(sym);
      await upsertQuote(q);
      return q;
    })
  );

  return refreshed;
}
