import { env } from "./config/env";
import app from "./app";
import { logger } from "./shared/logger";

// Lancement du serveur
app.listen(env.PORT, () => {
  logger.info(
    `🚀 Backend started on http://localhost:${env.PORT} (${env.NODE_ENV})`
  );
});
