import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import healthRoutes from "./routes/health.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", healthRoutes);

export default app;
