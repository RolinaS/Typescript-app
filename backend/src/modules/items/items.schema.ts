import { z } from "zod";

export const createItemSchema = z.object({
  name: z.string().min(1).max(200),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).max(200),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});
