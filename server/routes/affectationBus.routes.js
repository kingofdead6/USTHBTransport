import { Router } from "express";
import * as c from "../controllers/affectationBus.controller.js";
const router = Router();

router.get("/ligne/:ligneId/date/:date", c.getBusParLigneEtDate);
router.get("/",    c.getAllAffectations);
router.post("/",   c.createAffectation);
router.patch("/:id/terminer", c.terminerAffectation);

export default router;