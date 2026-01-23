import { Router } from "express";
import * as controller from "./items.controller";

const router = Router();

router.get("/items", controller.list);
router.get("/items/:id", controller.get);
router.post("/items", controller.create);
router.put("/items/:id", controller.update);
router.delete("/items/:id", controller.remove);

export default router;
