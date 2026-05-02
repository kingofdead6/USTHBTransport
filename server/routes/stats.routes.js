import { Router } from "express";
import * as c from "../controllers/stats.controller.js";
const router = Router();

router.get("/dashboard",              c.getDashboardStats);
router.get("/nb-etudiants-par-ligne", c.nbEtudiantsParLigne);

export default router;