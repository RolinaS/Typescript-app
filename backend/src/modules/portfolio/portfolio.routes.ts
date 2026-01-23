import { Router } from "express";
import * as c from "./portfolio.controller";

const router = Router();

router.get("/portfolio", c.list);
router.get("/portfolio/:id/lots", c.lots);

router.post("/portfolio/holdings", c.createHoldingCtrl);
router.put("/portfolio/holdings/:id", c.updateHoldingCtrl);
router.delete("/portfolio/holdings/:id", c.deleteHoldingCtrl);

router.post("/portfolio/holdings/:id/lots", c.createLotCtrl);
router.put("/portfolio/lots/:lotId", c.updateLotCtrl);
router.delete("/portfolio/lots/:lotId", c.deleteLotCtrl);

export default router;
