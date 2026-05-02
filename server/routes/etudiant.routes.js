import { Router } from "express";
import * as c from "../controllers/etudiant.controller.js";
const router = Router();

router.get("/sans-abonnement", c.getEtudiantsSansAbonnement);
router.get("/",       c.getAllEtudiants);
router.get("/:id",    c.getEtudiantById);
router.post("/",      c.createEtudiant);
router.put("/:id",    c.updateEtudiant);
router.delete("/:id", c.deleteEtudiant);

export default router;