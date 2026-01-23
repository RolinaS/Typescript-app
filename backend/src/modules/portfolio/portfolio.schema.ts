import { z } from "zod";

export const createHoldingSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  currency: z.string().min(1).max(5).default("EUR"),
  last_price: z.number().nonnegative().default(0),
  day_gain_amount: z.number().default(0),
  day_gain_pct: z.number().default(0),
});

export const updateHoldingSchema = createHoldingSchema.partial();

export const createLotSchema = z.object({
  buy_date: z.string().min(10).max(10), // "YYYY-MM-DD"
  buy_price: z.number().positive(),
  quantity: z.number().positive(),
});

export const updateLotSchema = createLotSchema.partial();

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const lotIdParamSchema = z.object({
  lotId: z.string().uuid(),
});
