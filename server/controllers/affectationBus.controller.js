import prisma from "../prisma/client.js";

// GET /api/affectations-bus
const getAllAffectations = async (req, res) => {
  try {
    const { busId, ligneId, active } = req.query;
    const where = {};
    if (busId)  where.busId  = parseInt(busId);
    if (ligneId) where.ligneId = parseInt(ligneId);
    if (active === "true") where.dateFin = null;

    const data = await prisma.affectationBus.findMany({
      where,
      include: { bus: true, ligne: true },
      orderBy: { dateDebut: "desc" },
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/affectations-bus/ligne/:ligneId/date/:date — Bus affectés à une ligne à une date donnée
const getBusParLigneEtDate = async (req, res) => {
  try {
    const { ligneId, date } = req.params;
    const targetDate = new Date(date);

    const affectations = await prisma.affectationBus.findMany({
      where: {
        ligneId:   parseInt(ligneId),
        dateDebut: { lte: targetDate },
        OR: [
          { dateFin: null },
          { dateFin: { gte: targetDate } },
        ],
      },
      include: { bus: true, ligne: true },
    });

    res.json({ success: true, data: affectations, date });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/affectations-bus
const createAffectation = async (req, res) => {
  try {
    const { busId, ligneId, dateDebut } = req.body;

    // Fermer l'affectation active du bus si elle existe
    await prisma.affectationBus.updateMany({
      where: { busId: parseInt(busId), dateFin: null },
      data:  { dateFin: new Date(dateDebut), motifFin: "Nouvelle affectation" },
    });

    const affectation = await prisma.affectationBus.create({
      data: { ...req.body, busId: parseInt(busId), ligneId: parseInt(ligneId) },
      include: { bus: true, ligne: true },
    });

    res.status(201).json({ success: true, data: affectation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PATCH /api/affectations-bus/:id/terminer
const terminerAffectation = async (req, res) => {
  try {
    const { dateFin, motifFin } = req.body;
    const affectation = await prisma.affectationBus.update({
      where: { id: parseInt(req.params.id) },
      data:  { dateFin: new Date(dateFin), motifFin },
    });
    res.json({ success: true, data: affectation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export {
  getAllAffectations,
  getBusParLigneEtDate,
  createAffectation,
  terminerAffectation,
};