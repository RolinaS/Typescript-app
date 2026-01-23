import type { Request, Response } from "express";
import { getHealthStatus } from "./health.service";

export const healthCheck = (req: Request, res: Response) => {
  res.status(200).json(getHealthStatus());
};
