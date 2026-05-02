import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// GET /api/etudiants
const getAllEtudiants = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search
      ? {
          OR: [
            { nom:        { contains: search, mode: "insensitive" } },
            { prenom:     { contains: search, mode: "insensitive" } },
            { email:      { contains: search, mode: "insensitive" } },
            { matricule:  { contains: search, mode: "insensitive" } },
            { faculte:    { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.etudiant.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
          abonnementActif: { include: { ligne: true } },
        },
      }),
      prisma.etudiant.count({ where }),
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

// GET /api/etudiants/:id
const getEtudiantById = async (req, res) => {
  try {
    const etudiant = await prisma.etudiant.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        abonnementActif:      { include: { ligne: true } },
        historiqueAbonnements: { include: { ligne: true }, orderBy: { dateDebut: "desc" } },
        incidents:            { orderBy: { createdAt: "desc" } },
      },
    });
    if (!etudiant) return res.status(404).json({ success: false, message: "Étudiant introuvable" });
    res.json({ success: true, data: etudiant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/etudiants
const createEtudiant = async (req, res) => {
  try {
    const etudiant = await prisma.etudiant.create({
      data: {
        ...req.body,
        anneeEtude: Number(req.body.anneeEtude),
        dateNaissance: new Date(req.body.dateNaissance),
      },
    });

    res.status(201).json({ success: true, data: etudiant });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/etudiants/:id
const updateEtudiant = async (req, res) => {
  try {
    const etudiant = await prisma.etudiant.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json({ success: true, data: etudiant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/etudiants/:id
const deleteEtudiant = async (req, res) => {
  try {
    await prisma.etudiant.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: "Étudiant supprimé" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/etudiants/sans-abonnement
const getEtudiantsSansAbonnement = async (req, res) => {
  try {
    const data = await prisma.etudiant.findMany({
      where: { abonnementActif: null },
      orderBy: { nom: "asc" },
    });
    res.json({ success: true, data, total: data.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export {
  getAllEtudiants,
  getEtudiantById,
  createEtudiant,
  updateEtudiant,
  deleteEtudiant,
  getEtudiantsSansAbonnement,
};