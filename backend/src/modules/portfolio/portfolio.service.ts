import { db } from "../../config/db";

export type HoldingRow = {
  id: string;
  code: string;
  name: string;
  currency: string;
  last_price: string;       // pg => string
  day_gain_amount: string;
  day_gain_pct: string;
  created_at: string;
  updated_at: string;

  quantity: string;         // agrégats
  value: string;
  day_gain_value: string;
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

export async function listHoldings(): Promise<HoldingRow[]> {
  // agrégation: quantité totale + valeur (qty * last_price) + gain du jour (qty * day_gain_amount)
  const { rows } = await db.query<HoldingRow>(`
    SELECT
      h.*,
      COALESCE(SUM(l.quantity), 0)::numeric(12,2) AS quantity,
      (COALESCE(SUM(l.quantity), 0) * h.last_price)::numeric(14,2) AS value,
      (COALESCE(SUM(l.quantity), 0) * h.day_gain_amount)::numeric(14,2) AS day_gain_value
    FROM portfolio_holdings h
    LEFT JOIN portfolio_lots l ON l.holding_id = h.id
    GROUP BY h.id
    ORDER BY h.name ASC;
  `);

  return rows;
}

export async function getLotsByHolding(holdingId: string): Promise<LotRow[]> {
  const { rows } = await db.query<LotRow>(`
    SELECT
      l.*,
      (l.quantity * l.buy_price)::numeric(14,2) AS total_cost,
      (l.quantity * h.last_price)::numeric(14,2) AS current_value,
      ((l.quantity * h.last_price) - (l.quantity * l.buy_price))::numeric(14,2) AS total_gain_value,
      CASE
        WHEN (l.quantity * l.buy_price) = 0 THEN 0
        ELSE ((((l.quantity * h.last_price) - (l.quantity * l.buy_price)) / (l.quantity * l.buy_price)) * 100)
      END::numeric(7,2) AS total_gain_pct
    FROM portfolio_lots l
    JOIN portfolio_holdings h ON h.id = l.holding_id
    WHERE l.holding_id = $1
    ORDER BY l.buy_date DESC;
  `, [holdingId]);

  return rows;
}

export async function createHolding(input: {
  code: string; name: string; currency: string;
  last_price: number; day_gain_amount: number; day_gain_pct: number;
}) {
  const { rows } = await db.query(`
    INSERT INTO portfolio_holdings (code, name, currency, last_price, day_gain_amount, day_gain_pct)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *;
  `, [input.code, input.name, input.currency, input.last_price, input.day_gain_amount, input.day_gain_pct]);

  return rows[0];
}

export async function updateHolding(id: string, patch: Partial<{
  code: string; name: string; currency: string;
  last_price: number; day_gain_amount: number; day_gain_pct: number;
}>) {
  // update dynamique simple
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

export async function createLot(holdingId: string, input: { buy_date: string; buy_price: number; quantity: number; }) {
  const { rows } = await db.query(`
    INSERT INTO portfolio_lots (holding_id, buy_date, buy_price, quantity)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `, [holdingId, input.buy_date, input.buy_price, input.quantity]);

  return rows[0];
}

export async function updateLot(lotId: string, patch: Partial<{ buy_date: string; buy_price: number; quantity: number; }>) {
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
