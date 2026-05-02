import { Router } from "express";
import * as c from "../controllers/abonnement.controller.js";
const router = Router();

router.get("/historique/:etudiantId", c.getHistoriqueEtudiant);
router.get("/",    c.getAllAbonnements);
router.post("/",   c.createAbonnement);
router.patch("/:etudiantId/changer-ligne", c.changerLigne);
router.delete("/:etudiantId", c.resilierAbonnement);

export default router;
