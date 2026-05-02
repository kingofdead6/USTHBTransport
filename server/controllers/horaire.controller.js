import prisma from "../prisma/client.js";

const getAllHoraires = async (req, res) => {
  try {
    const { ligneId, jour } = req.query;
    const where = { actif: true };
    if (ligneId) where.ligneId = parseInt(ligneId);
    if (jour)    where.jourSemaine = jour;

    const data = await prisma.horaire.findMany({
      where,
      include: { ligne: true },
      orderBy: [{ jourSemaine: "asc" }, { heureDepart: "asc" }],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getHoraireById = async (req, res) => {
  try {
    const horaire = await prisma.horaire.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { ligne: true },
    });
    if (!horaire) return res.status(404).json({ success: false, message: "Horaire introuvable" });
    res.json({ success: true, data: horaire });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createHoraire = async (req, res) => {
  try {
    const horaire = await prisma.horaire.create({
      data: req.body,
      include: { ligne: true },
    });
    res.status(201).json({ success: true, data: horaire });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateHoraire = async (req, res) => {
  try {
    const horaire = await prisma.horaire.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json({ success: true, data: horaire });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteHoraire = async (req, res) => {
  try {
    await prisma.horaire.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: "Horaire supprimé" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export { getAllHoraires, getHoraireById, createHoraire, updateHoraire, deleteHoraire };