import prisma from "../prisma/client.js";

const getAllIncidents = async (req, res) => {
  try {
    const { statut, type, busId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (statut) where.statut = statut;
    if (type)   where.type   = type;
    if (busId)  where.busId  = parseInt(busId);

    const [data, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { bus: true, trajet: { include: { ligne: true } }, etudiant: true },
        orderBy: { dateSurvenance: "desc" },
      }),
      prisma.incident.count({ where }),
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

const getIncidentById = async (req, res) => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        bus:     true,
        trajet:  { include: { ligne: true, bus: true } },
        etudiant: true,
      },
    });
    if (!incident) return res.status(404).json({ success: false, message: "Incident introuvable" });
    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createIncident = async (req, res) => {
  try {
    const incident = await prisma.incident.create({
      data: req.body,
      include: { bus: true },
    });
    res.status(201).json({ success: true, data: incident });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateIncident = async (req, res) => {
  try {
    const incident = await prisma.incident.update({
      where: { id: parseInt(req.params.id) },
      data:  req.body,
    });
    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PATCH /api/incidents/:id/resoudre
const resoudreIncident = async (req, res) => {
  try {
    const incident = await prisma.incident.update({
      where: { id: parseInt(req.params.id) },
      data:  { statut: "RESOLU", dateResolution: new Date() },
    });
    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  resoudreIncident,
};