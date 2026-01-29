import { db } from "../../config/db";

export type HoldingRow = {
  id: string;
  symbol: string;  // ex: ENGI.PA
  code: string;    // ex: ENGI (optionnel)
  name: string;
  currency: string;

  // agrégats
  quantity: string;          // Σ lots.qty
  avg_buy_price: string;     // Σ(qty*buy)/Σ(qty)
  invested_value: string;    // Σ(qty*buy)

  // marché (optionnel, si tu stockes en DB)
  market_price: string;      // dernier prix
  previous_close: string;    // clôture J-1
  day_gain_value: string;    // gain du jour en €
  day_gain_pct: string;      // gain du jour en %
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
      h.symbol,
      h.name,
      h.currency,

      -- Quantité totale
      COALESCE(SUM(l.quantity), 0)::numeric(14,2) AS quantity,

      -- Valeur investie
      COALESCE(SUM(l.quantity * l.buy_price), 0)::numeric(14,2) AS invested_value,

      -- Prix d’achat moyen pondéré
      CASE
        WHEN COALESCE(SUM(l.quantity), 0) = 0 THEN 0
        ELSE SUM(l.quantity * l.buy_price) / SUM(l.quantity)
      END::numeric(14,2) AS avg_buy_price,

      -- Prix marché
      COALESCE(m.price, 0)::numeric(14,2) AS market_price,

      -- 🔥 GAIN TOTAL (€)
      COALESCE(
        SUM(
          (COALESCE(m.price,0) - l.buy_price) * l.quantity
        ),
        0
      )::numeric(14,2) AS total_gain_value,

      -- 🔥 GAIN TOTAL (%)
      CASE
        WHEN COALESCE(SUM(l.quantity * l.buy_price),0) = 0 THEN 0
        ELSE (
          SUM((COALESCE(m.price,0) - l.buy_price) * l.quantity)
          / SUM(l.quantity * l.buy_price)
        ) * 100
      END::numeric(7,2) AS total_gain_pct

    FROM portfolio_holdings h
    LEFT JOIN portfolio_lots l ON l.holding_id = h.id
    LEFT JOIN market_quotes m ON m.symbol = h.symbol
    GROUP BY h.id, m.price
    ORDER BY h.name ASC;
  `);

  return rows;
}


// ========== Lots (détails) ==========
export async function getLotsByHolding(holdingId: string): Promise<LotRow[]> {
  const { rows } = await db.query<LotRow>(`
    SELECT
      l.*,

      (l.quantity * l.buy_price)::numeric(14,2) AS total_cost,
      (COALESCE(m.price,0) * l.quantity)::numeric(14,2) AS current_value,
      ((COALESCE(m.price,0) * l.quantity) - (l.quantity * l.buy_price))::numeric(14,2) AS total_gain_value,

      CASE
        WHEN (l.quantity * l.buy_price) = 0 THEN 0
        ELSE ((((COALESCE(m.price,0) * l.quantity) - (l.quantity * l.buy_price)) / (l.quantity * l.buy_price)) * 100)
      END::numeric(7,2) AS total_gain_pct

    FROM portfolio_lots l
    JOIN portfolio_holdings h ON h.id = l.holding_id
    LEFT JOIN market_quotes m ON m.symbol = h.symbol
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
