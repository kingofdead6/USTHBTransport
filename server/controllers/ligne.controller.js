import prisma from "../prisma/client.js";

// GET /api/lignes
const getAllLignes = async (req, res) => {
  try {
    const { statut, search } = req.query;
    const where = {};
    if (statut) where.statut = statut;
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { nom:  { contains: search, mode: "insensitive" } },
      ];
    }

    const data = await prisma.ligne.findMany({
      where,
      orderBy: { code: "asc" },
      include: {
        ligneStations: { include: { station: true }, orderBy: { ordreArret: "asc" } },
        horaires:      { where: { actif: true } },
        _count:        { select: { abonnements: true } },
      },
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/lignes/:id
const getLigneById = async (req, res) => {
  try {
    const ligne = await prisma.ligne.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        ligneStations: {
          include: { station: true },
          orderBy:  { ordreArret: "asc" },
        },
        horaires:       { orderBy: [{ jourSemaine: "asc" }, { heureDepart: "asc" }] },
        affectationsBus: {
          where:   { dateFin: null },
          include: { bus: true },
        },
        _count: { select: { abonnements: true, trajets: true } },
      },
    });
    if (!ligne) return res.status(404).json({ success: false, message: "Ligne introuvable" });
    res.json({ success: true, data: ligne });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/lignes
const createLigne = async (req, res) => {
  try {
    const ligne = await prisma.ligne.create({ data: req.body });
    res.status(201).json({ success: true, data: ligne });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/lignes/:id
const updateLigne = async (req, res) => {
  try {
    const ligne = await prisma.ligne.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json({ success: true, data: ligne });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/lignes/:id
const deleteLigne = async (req, res) => {
  try {
    await prisma.ligne.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: "Ligne supprimée" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/lignes/:id/horaires — Horaires d'une ligne donnée
const getHorairesLigne = async (req, res) => {
  try {
    const horaires = await prisma.horaire.findMany({
      where: { ligneId: parseInt(req.params.id), actif: true },
      orderBy: [{ jourSemaine: "asc" }, { heureDepart: "asc" }],
    });
    res.json({ success: true, data: horaires });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/lignes/plus-chargees — Lignes les plus chargées
const getLignesPlusChargees = async (req, res) => {
  try {
    const data = await prisma.ligne.findMany({
      include: {
        _count: { select: { abonnements: true } },
      },
      orderBy: { abonnements: { _count: "desc" } },
    });

    const result = data.map((l) => ({
      id:           l.id,
      code:         l.code,
      nom:          l.nom,
      nbAbonnements: l._count.abonnements,
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/lignes/:id/etudiants — Nombre d'étudiants par ligne
const getNbEtudiantsParLigne = async (req, res) => {
  try {
    const ligneId = parseInt(req.params.id);
    const [ligne, count] = await Promise.all([
      prisma.ligne.findUnique({ where: { id: ligneId } }),
      prisma.abonnement.count({ where: { ligneId, statut: "ACTIF" } }),
    ]);
    if (!ligne) return res.status(404).json({ success: false, message: "Ligne introuvable" });
    res.json({ success: true, data: { ligneId, nom: ligne.nom, nbEtudiants: count } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export {
  getAllLignes,
  getLigneById,
  createLigne,
  updateLigne,
  deleteLigne,
  getHorairesLigne,
  getLignesPlusChargees,
  getNbEtudiantsParLigne,
};