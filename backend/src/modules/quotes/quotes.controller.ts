import type { Request, Response } from "express";
import { getQuotesCached, refreshQuotes, getQuoteCached } from "./quotes.service";

function parseSymbolsFromQuery(q: unknown): string[] {
  const raw = String(q ?? "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

function parseSymbolsFromBody(b: any): string[] {
  if (!b) return [];
  const arr = b.symbols;
  if (!Array.isArray(arr)) return [];
  return arr.map((s) => String(s).trim().toUpperCase()).filter(Boolean);
}

/**
 * GET /api/quotes?symbols=ENGI.PA,AI.PA
 * -> renvoie un tableau de quotes, en cache DB si fresh.
 */
export async function getQuotesCtrl(req: Request, res: Response) {
  const symbols = parseSymbolsFromQuery(req.query.symbols);
  if (symbols.length === 0) {
    return res.status(400).json({ error: "Paramètre symbols requis (ex: ?symbols=ENGI.PA,AI.PA)" });
  }

  const data = await getQuotesCached(symbols);
  return res.json(data);
}

/**
 * GET /api/quotes/:symbol
 */
export async function getQuoteBySymbolCtrl(req: Request, res: Response) {
  const symbol = String(req.params.symbol ?? "").trim().toUpperCase();
  if (!symbol) return res.status(400).json({ error: "symbol requis" });

  const quote = await getQuoteCached(symbol);
  if (!quote) return res.status(404).json({ error: "Quote introuvable" });

  return res.json(quote);
}

/**
 * POST /api/quotes/refresh
 * body optionnel: { "symbols": ["ENGI.PA","AI.PA"] }
 * si vide -> refresh tous les symbols présents dans portfolio_holdings
 */
export async function refreshQuotesCtrl(req: Request, res: Response) {
  const symbols = parseSymbolsFromBody(req.body);

  const result = await refreshQuotes(symbols.length ? symbols : null);
  return res.json({
    refreshed: result,
    count: result.length,
  });
}
