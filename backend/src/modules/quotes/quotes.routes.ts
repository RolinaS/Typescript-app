import { Router } from "express";
import { getQuotesCtrl, getQuoteBySymbolCtrl, refreshQuotesCtrl } from "./quotes.controller";

const router = Router();

router.get("/quotes", getQuotesCtrl);              // /api/quotes?symbols=...
router.get("/quotes/:symbol", getQuoteBySymbolCtrl); // /api/quotes/ENGI.PA
router.post("/quotes/refresh", refreshQuotesCtrl); // /api/quotes/refresh

export default router;
