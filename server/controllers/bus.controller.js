import prisma from "../prisma/client.js";

// GET /api/bus
const getAllBus = async (req, res) => {
  try {
    const { etat, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (etat) where.etat = etat;
    if (search) {
      where.OR = [
        { immatriculation: { contains: search, mode: "insensitive" } },
        { marque:          { contains: search, mode: "insensitive" } },
        { modele:          { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.bus.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
          affectations: {
            where: { dateFin: null },
            include: { ligne: true },
            take: 1,
          },
        },
      }),
      prisma.bus.count({ where }),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bus/:id
const getBusById = async (req, res) => {
  try {
    const bus = await prisma.bus.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        affectations: { include: { ligne: true }, orderBy: { dateDebut: "desc" } },
        trajets:      { orderBy: { dateTrajet: "desc" }, take: 20 },
        incidents:    { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
    if (!bus) return res.status(404).json({ success: false, message: "Bus introuvable" });
    res.json({ success: true, data: bus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/bus
const createBus = async (req, res) => {
  try {
    const bus = await prisma.bus.create({ data: req.body });
    res.status(201).json({ success: true, data: bus });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/bus/:id
const updateBus = async (req, res) => {
  try {
    const bus = await prisma.bus.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json({ success: true, data: bus });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/bus/:id
const deleteBus = async (req, res) => {
  try {
    await prisma.bus.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: "Bus supprimé" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/bus/taux-remplissage — Taux de remplissage des bus
const getTauxRemplissage = async (req, res) => {
  try {
    const trajets = await prisma.trajet.findMany({
      where: { statut: "TERMINE", nbPassagers: { not: null } },
      include: { bus: true, ligne: true },
      orderBy: { dateTrajet: "desc" },
      take: 100,
    });

    const data = trajets.map((t) => ({
      trajetId:       t.id,
      dateTrajet:     t.dateTrajet,
      ligne:          t.ligne.nom,
      immatriculation: t.bus.immatriculation,
      capaciteMax:    t.bus.capaciteMax,
      nbPassagers:    t.nbPassagers,
      taux:           Math.round((t.nbPassagers / t.bus.capaciteMax) * 100),
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export {
  getAllBus,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
  getTauxRemplissage,
};