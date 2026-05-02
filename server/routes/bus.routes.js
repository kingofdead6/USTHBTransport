import { Router } from "express";
import * as c from "../controllers/bus.controller.js";
const router = Router();

router.get("/taux-remplissage", c.getTauxRemplissage);
router.get("/",       c.getAllBus);
router.get("/:id",    c.getBusById);
router.post("/",      c.createBus);
router.put("/:id",    c.updateBus);
router.delete("/:id", c.deleteBus);

export default router;