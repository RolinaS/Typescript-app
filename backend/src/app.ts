import express from "express";
import cors from "cors";

import { requestId } from "./middlewares/requestId";
import { errorHandler } from "./middlewares/errorHandler";
import healthRoutes from "./modules/health/health.routes";
import itemsRoutes from "./modules/items/items.routes";

const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(requestId);

// Routes
app.use("/api", healthRoutes);
app.use("/api", itemsRoutes);

// Middleware d’erreurs (⚠️ toujours en dernier)
app.use(errorHandler);

export default app;
