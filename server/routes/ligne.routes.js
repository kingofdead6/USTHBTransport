import { Router } from "express";
import * as c from "../controllers/ligne.controller.js";
const router = Router();

router.get("/plus-chargees",    c.getLignesPlusChargees);
router.get("/",                 c.getAllLignes);
router.get("/:id",              c.getLigneById);
router.get("/:id/horaires",     c.getHorairesLigne);
router.get("/:id/nb-etudiants", c.getNbEtudiantsParLigne);
router.post("/",                c.createLigne);
router.put("/:id",              c.updateLigne);
router.delete("/:id",           c.deleteLigne);

export default router;