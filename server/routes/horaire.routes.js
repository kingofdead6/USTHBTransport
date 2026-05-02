import { Router } from "express";
import * as c from "../controllers/horaire.controller.js";
const router = Router();

router.get("/",    c.getAllHoraires);
router.get("/:id", c.getHoraireById);
router.post("/",   c.createHoraire);
router.put("/:id", c.updateHoraire);
router.delete("/:id", c.deleteHoraire);

export default router;