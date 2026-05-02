import prisma from "../prisma/client.js";

const getAllTrajets = async (req, res) => {
  try {
    const { ligneId, busId, statut, date, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (ligneId) where.ligneId = parseInt(ligneId);
    if (busId)   where.busId   = parseInt(busId);
    if (statut)  where.statut  = statut;
    if (date)    where.dateTrajet = new Date(date);

    const [data, total] = await Promise.all([
      prisma.trajet.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { bus: true, ligne: true, horaire: true },
        orderBy: { dateTrajet: "desc" },
      }),
      prisma.trajet.count({ where }),
    ]);

    res.json({
      success: true,
      data,
      pagination: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTrajetById = async (req, res) => {
  try {
    const trajet = await prisma.trajet.findUnique({
      where:   { id: parseInt(req.params.id) },
      include: {
        bus:         true,
        ligne:       true,
        horaire:     true,
        arretsTrajet: { include: { station: true }, orderBy: { ordreArret: "asc" } },
        incidents:   true,
      },
    });
    if (!trajet) return res.status(404).json({ success: false, message: "Trajet introuvable" });
    res.json({ success: true, data: trajet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createTrajet = async (req, res) => {
  try {
    const trajet = await prisma.trajet.create({
      data: req.body,
      include: { bus: true, ligne: true, horaire: true },
    });
    res.status(201).json({ success: true, data: trajet });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateTrajet = async (req, res) => {
  try {
    const trajet = await prisma.trajet.update({
      where: { id: parseInt(req.params.id) },
      data:  req.body,
    });
    res.json({ success: true, data: trajet });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/trajets/retards — Liste des trajets avec retard
const getTrajetsAvecRetard = async (req, res) => {
  try {
    const data = await prisma.trajet.findMany({
      where: { retardMinutes: { gt: 0 } },
      include: { bus: true, ligne: true, horaire: true },
      orderBy: { retardMinutes: "desc" },
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export {
  getAllTrajets,
  getTrajetById,
  createTrajet,
  updateTrajet,
  getTrajetsAvecRetard,
};