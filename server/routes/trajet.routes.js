import { Router } from "express";
import * as c from "../controllers/trajet.controller.js";
const router = Router();

router.get("/retards", c.getTrajetsAvecRetard);
router.get("/",    c.getAllTrajets);
router.get("/:id", c.getTrajetById);
router.post("/",   c.createTrajet);
router.put("/:id", c.updateTrajet);

export default router;