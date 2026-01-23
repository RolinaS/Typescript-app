import { Pool } from "pg";
import { env } from "./env";
import { logger } from "../shared/logger";

export const db = new Pool({
  connectionString: env.DATABASE_URL,
});

db.on("connect", () => {
  logger.info("📦 Connected to PostgreSQL");
});

db.on("error", (err) => {
  logger.error({ err }, "❌ PostgreSQL connection error");
  process.exit(1);
});
