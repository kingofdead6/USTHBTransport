import { Router } from "express";
import * as c from "../controllers/station.controller.js";
const router = Router();

router.get("/",    c.getAllStations);
router.get("/:id", c.getStationById);
router.post("/",   c.createStation);
router.put("/:id", c.updateStation);
router.delete("/:id", c.deleteStation);
router.post("/:stationId/lignes/:ligneId", c.addStationToLigne);

export default router;