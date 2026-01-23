import { Request, Response, NextFunction } from "express";
import { logger } from "../shared/logger";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(
    {
      err,
      requestId: req.requestId,
      path: req.originalUrl,
    },
    "Unhandled error"
  );

  res.status(err.statusCode || 500).json({
    error: "Internal Server Error",
    requestId: req.requestId,
  });
}
