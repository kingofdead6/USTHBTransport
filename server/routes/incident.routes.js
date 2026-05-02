import { Router } from "express";
import * as c from "../controllers/incident.controller.js";
const router = Router();

router.get("/",    c.getAllIncidents);
router.get("/:id", c.getIncidentById);
router.post("/",   c.createIncident);
router.put("/:id", c.updateIncident);
router.patch("/:id/resoudre", c.resoudreIncident);

export default router;