import { db } from "../../config/db";

export type HoldingRow = {
  id: string;
  code: string;
  name: string;
  currency: string;

  // On réutilise ces champs pour éviter de casser le front :
  // last_price = prix ACTUEL (market)
  last_price: string;

  // day_gain_amount = gain du jour par action (prix - previous_close)
  day_gain_amount: string;

  // day_gain_pct = gain du jour en %
  day_gain_pct: string;

  created_at: string;
  updated_at: string;

  // agrégats
  quantity: string;     // somme lots
  value: string;        // montant investi total
  day_gain_value: string; // gain du jour total = (prix - prevClose) * qty
};

export type LotRow = {
  id: string;
  holding_id: string;
  buy_date: string;
  buy_price: string;
  quantity: string;
  created_at: string;
  updated_at: string;

  total_cost: string;
  current_value: string;
  total_gain_value: string;
  total_gain_pct: string;
};

// ========== Holdings (ligne principale) ==========
export async function listHoldings(): Promise<HoldingRow[]> {
  const { rows } = await db.query<HoldingRow>(`
    SELECT
      h.id,
      h.code,
      h.name,
      h.currency,
      h.created_at,
      h.updated_at,

      -- quantité totale
      COALESCE(SUM(l.quantity), 0)::numeric(14,2) AS quantity,

      -- montant investi total
      COALESCE(SUM(l.quantity * l.buy_price), 0)::numeric(14,2) AS value,

      -- last_price = prix actuel (market)
      COALESCE(q.price, 0)::numeric(14,2) AS last_price,

      -- gain du jour par action = prix - clôture veille
      (COALESCE(q.price, 0) - COALESCE(q.previous_close, 0))::numeric(14,2) AS day_gain_amount,

      -- gain du jour total = (prix - prevClose) * quantité totale
      (
        (COALESCE(q.price, 0) - COALESCE(q.previous_close, 0))
        * COALESCE(SUM(l.quantity), 0)
      )::numeric(14,2) AS day_gain_value,

      -- gain du jour % = (prix - prevClose) / prevClose * 100
      CASE
        WHEN COALESCE(q.previous_close, 0) = 0 THEN 0
        ELSE ((q.price - q.previous_close) / q.previous_close) * 100
      END::numeric(7,2) AS day_gain_pct

    FROM portfolio_holdings h
    LEFT JOIN portfolio_lots l ON l.holding_id = h.id
    LEFT JOIN market_quotes q ON q.symbol = h.symbol
    GROUP BY h.id, q.price, q.previous_close
    ORDER BY h.name ASC;
  `);

  return rows;
}

// ========== Lots (détails) ==========
export async function getLotsByHolding(holdingId: string): Promise<LotRow[]> {
  const { rows } = await db.query<LotRow>(`
    SELECT
      l.id,
      l.holding_id,
      l.buy_date,
      l.buy_price,
      l.quantity,
      l.created_at,
      l.updated_at,

      (l.quantity * l.buy_price)::numeric(14,2) AS total_cost,

      -- valeur actuelle du lot = qty * prix actuel
      (l.quantity * COALESCE(q.price, 0))::numeric(14,2) AS current_value,

      -- gain total du lot = (prix actuel - prix achat) * qty
      ((l.quantity * COALESCE(q.price, 0)) - (l.quantity * l.buy_price))::numeric(14,2) AS total_gain_value,

      -- gain total % du lot
      CASE
        WHEN (l.buy_price) = 0 THEN 0
        ELSE (((COALESCE(q.price, 0) - l.buy_price) / l.buy_price) * 100)
      END::numeric(7,2) AS total_gain_pct

    FROM portfolio_lots l
    JOIN portfolio_holdings h ON h.id = l.holding_id
    LEFT JOIN market_quotes q ON q.symbol = h.symbol
    WHERE l.holding_id = $1
    ORDER BY l.buy_date DESC;
  `, [holdingId]);

  return rows;
}

/**
 * ⚠️ createHolding / updateHolding :
 * Ta table DB actuelle (migrations) contient (code,name,symbol,currency)
 * et PAS last_price/day_gain_* (car on les calcule via market_quotes)
 *
 * Donc je te propose de changer l’input pour inclure symbol.
 */

// ========== CRUD Holding ==========
export async function createHolding(input: {
  code: string;
  name: string;
  symbol: string;   // ex: ENGI.PA
  currency: string;
}) {
  const { rows } = await db.query(`
    INSERT INTO portfolio_holdings (code, name, symbol, currency)
    VALUES ($1,$2,$3,$4)
    RETURNING *;
  `, [input.code, input.name, input.symbol, input.currency]);

  return rows[0];
}

export async function updateHolding(id: string, patch: Partial<{
  code: string;
  name: string;
  symbol: string;
  currency: string;
}>) {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k} = $${i++}`);
    values.push(v);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const { rows } = await db.query(`
    UPDATE portfolio_holdings
    SET ${fields.join(", ")}, updated_at = now()
    WHERE id = $${i}
    RETURNING *;
  `, values);

  return rows[0] ?? null;
}

export async function deleteHolding(id: string) {
  const r = await db.query(`DELETE FROM portfolio_holdings WHERE id = $1`, [id]);
  return r.rowCount === 1;
}

// ========== CRUD Lot ==========
export async function createLot(
  holdingId: string,
  input: { buy_date: string; buy_price: number; quantity: number; }
) {
  const { rows } = await db.query(`
    INSERT INTO portfolio_lots (holding_id, buy_date, buy_price, quantity)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `, [holdingId, input.buy_date, input.buy_price, input.quantity]);

  return rows[0];
}

export async function updateLot(
  lotId: string,
  patch: Partial<{ buy_date: string; buy_price: number; quantity: number; }>
) {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k} = $${i++}`);
    values.push(v);
  }

  if (fields.length === 0) return null;

  values.push(lotId);
  const { rows } = await db.query(`
    UPDATE portfolio_lots
    SET ${fields.join(", ")}, updated_at = now()
    WHERE id = $${i}
    RETURNING *;
  `, values);

  return rows[0] ?? null;
}

export async function deleteLot(lotId: string) {
  const r = await db.query(`DELETE FROM portfolio_lots WHERE id = $1`, [lotId]);
  return r.rowCount === 1;
}
