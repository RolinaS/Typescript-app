import type { Request, Response } from "express";
import {
  listHoldings,
  getLotsByHolding,
  createHolding,
  updateHolding,
  deleteHolding,
  createLot,
  updateLot,
  deleteLot,
} from "./portfolio.service";
import {
  createHoldingSchema,
  updateHoldingSchema,
  createLotSchema,
  updateLotSchema,
  idParamSchema,
  lotIdParamSchema,
} from "./portfolio.schema";

export async function list(req: Request, res: Response) {
  res.json(await listHoldings());
}

export async function lots(req: Request, res: Response) {
  const params = idParamSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  res.json(await getLotsByHolding(params.data.id));
}

export async function createHoldingCtrl(req: Request, res: Response) {
  const parsed = createHoldingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const created = await createHolding(parsed.data);
  res.status(201).json(created);
}

export async function updateHoldingCtrl(req: Request, res: Response) {
  const params = idParamSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const patch = updateHoldingSchema.safeParse(req.body);
  if (!patch.success) return res.status(400).json({ error: patch.error.flatten() });

  const updated = await updateHolding(params.data.id, patch.data);
  if (!updated) return res.status(404).json({ error: "Holding not found" });

  res.json(updated);
}

export async function deleteHoldingCtrl(req: Request, res: Response) {
  const params = idParamSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const ok = await deleteHolding(params.data.id);
  if (!ok) return res.status(404).json({ error: "Holding not found" });

  res.status(204).send();
}

export async function createLotCtrl(req: Request, res: Response) {
  const params = idParamSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const parsed = createLotSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const created = await createLot(params.data.id, parsed.data);
  res.status(201).json(created);
}

export async function updateLotCtrl(req: Request, res: Response) {
  const params = lotIdParamSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid lotId" });

  const patch = updateLotSchema.safeParse(req.body);
  if (!patch.success) return res.status(400).json({ error: patch.error.flatten() });

  const updated = await updateLot(params.data.lotId, patch.data);
  if (!updated) return res.status(404).json({ error: "Lot not found" });

  res.json(updated);
}

export async function deleteLotCtrl(req: Request, res: Response) {
  const params = lotIdParamSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid lotId" });

  const ok = await deleteLot(params.data.lotId);
  if (!ok) return res.status(404).json({ error: "Lot not found" });

  res.status(204).send();
}
