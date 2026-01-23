import type { Request, Response } from "express";
import {
  listItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from "./items.service";
import { createItemSchema, updateItemSchema, idParamSchema } from "./items.schema";

export async function list(req: Request, res: Response) {
  const items = await listItems();
  res.json(items);
}

export async function get(req: Request, res: Response) {
  const params = idParamSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const item = await getItemById(params.data.id);
  if (!item) return res.status(404).json({ error: "Item not found" });

  res.json(item);
}

export async function create(req: Request, res: Response) {
  const parsed = createItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const item = await createItem(parsed.data.name);
  res.status(201).json(item);
}

export async function update(req: Request, res: Response) {
  const params = idParamSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const body = updateItemSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const item = await updateItem(params.data.id, body.data.name);
  if (!item) return res.status(404).json({ error: "Item not found" });

  res.json(item);
}

export async function remove(req: Request, res: Response) {
  const params = idParamSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const ok = await deleteItem(params.data.id);
  if (!ok) return res.status(404).json({ error: "Item not found" });

  res.status(204).send();
}
