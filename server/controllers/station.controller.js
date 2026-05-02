import prisma from "../prisma/client.js";

const getAllStations = async (req, res) => {
  try {
    const { search } = req.query;
    const where = search
      ? { OR: [{ nom: { contains: search, mode: "insensitive" } }, { adresse: { contains: search, mode: "insensitive" } }] }
      : {};

    const data = await prisma.station.findMany({
      where,
      orderBy: { nom: "asc" },
      include: { _count: { select: { ligneStations: true } } },
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStationById = async (req, res) => {
  try {
    const station = await prisma.station.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        ligneStations: { include: { ligne: true } },
      },
    });
    if (!station) return res.status(404).json({ success: false, message: "Station introuvable" });
    res.json({ success: true, data: station });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createStation = async (req, res) => {
  try {
    const station = await prisma.station.create({ data: req.body });
    res.status(201).json({ success: true, data: station });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateStation = async (req, res) => {
  try {
    const station = await prisma.station.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json({ success: true, data: station });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteStation = async (req, res) => {
  try {
    await prisma.station.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: "Station supprimée" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/stations/:stationId/lignes/:ligneId — Ajouter une station à une ligne
const addStationToLigne = async (req, res) => {
  try {
    const { stationId, ligneId } = req.params;
    const { ordreArret, distanceDepuisDepart, dureeDepuisDepart } = req.body;

    const ls = await prisma.ligneStation.create({
      data: {
        stationId: parseInt(stationId),
        ligneId:   parseInt(ligneId),
        ordreArret,
        distanceDepuisDepart,
        dureeDepuisDepart,
      },
    });
    res.status(201).json({ success: true, data: ls });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export {
  getAllStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
  addStationToLigne,
};