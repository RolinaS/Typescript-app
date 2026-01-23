import { db } from "../../config/db";

export type Item = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export async function listItems(): Promise<Item[]> {
  const { rows } = await db.query<Item>(
    "SELECT id, name, created_at, updated_at FROM items ORDER BY created_at DESC"
  );
  return rows;
}

export async function getItemById(id: string): Promise<Item | null> {
  const { rows } = await db.query<Item>(
    "SELECT id, name, created_at, updated_at FROM items WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}

export async function createItem(name: string): Promise<Item> {
  const { rows } = await db.query<Item>(
    `
    INSERT INTO items (name)
    VALUES ($1)
    RETURNING id, name, created_at, updated_at
    `,
    [name]
  );
  return rows[0];
}

export async function updateItem(id: string, name: string): Promise<Item | null> {
  const { rows } = await db.query<Item>(
    `
    UPDATE items
    SET name = $2, updated_at = now()
    WHERE id = $1
    RETURNING id, name, created_at, updated_at
    `,
    [id, name]
  );
  return rows[0] ?? null;
}

export async function deleteItem(id: string): Promise<boolean> {
  const result = await db.query("DELETE FROM items WHERE id = $1", [id]);
  return result.rowCount === 1;
}
