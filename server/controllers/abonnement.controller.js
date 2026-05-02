import prisma from "../prisma/client.js";

// GET /api/abonnements
const getAllAbonnements = async (req, res) => {
  try {
    const { ligneId, statut } = req.query;
    const where = {};
    if (ligneId) where.ligneId = parseInt(ligneId);
    if (statut)  where.statut  = statut;

    const data = await prisma.abonnement.findMany({
      where,
      include: { etudiant: true, ligne: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/abonnements — Abonner un étudiant à une ligne
const createAbonnement = async (req, res) => {
  try {
    const { etudiantId, ligneId, dateDebut } = req.body;

    // Vérifier s'il existe déjà un abonnement actif
    const existing = await prisma.abonnement.findUnique({
      where: { etudiantId: parseInt(etudiantId) },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Cet étudiant a déjà un abonnement actif. Veuillez d'abord le résilier.",
      });
    }

    const abonnement = await prisma.abonnement.create({
      data: {
        etudiantId: parseInt(etudiantId),
        ligneId:    parseInt(ligneId),
        dateDebut:  new Date(dateDebut),
        statut:     "ACTIF",
      },
      include: { etudiant: true, ligne: true },
    });

    // Enregistrer dans l'historique
    await prisma.historiqueAbonnement.create({
      data: {
        etudiantId:     parseInt(etudiantId),
        ligneId:        parseInt(ligneId),
        dateDebut:      new Date(dateDebut),
        dateFin:        new Date("9999-12-31"),
        motifChangement: "Nouvel abonnement",
      },
    });

    res.status(201).json({ success: true, data: abonnement });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PATCH /api/abonnements/:etudiantId/changer-ligne — Changer de ligne
const changerLigne = async (req, res) => {
  try {
    const etudiantId = parseInt(req.params.etudiantId);
    const { nouvelleLigneId, motif, dateChangement } = req.body;
    const today = dateChangement ? new Date(dateChangement) : new Date();

    // Clôturer l'historique en cours
    await prisma.historiqueAbonnement.updateMany({
      where: { etudiantId, dateFin: new Date("9999-12-31") },
      data:  { dateFin: today, motifChangement: motif || "Changement de ligne" },
    });

    // Mettre à jour l'abonnement actif
    const abonnement = await prisma.abonnement.update({
      where: { etudiantId },
      data:  { ligneId: parseInt(nouvelleLigneId), dateDebut: today },
      include: { etudiant: true, ligne: true },
    });

    // Créer nouvelle entrée historique
    await prisma.historiqueAbonnement.create({
      data: {
        etudiantId,
        ligneId:        parseInt(nouvelleLigneId),
        dateDebut:      today,
        dateFin:        new Date("9999-12-31"),
        motifChangement: motif || "Changement de ligne",
      },
    });

    res.json({ success: true, data: abonnement });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/abonnements/:etudiantId — Résilier un abonnement
const resilierAbonnement = async (req, res) => {
  try {
    const etudiantId = parseInt(req.params.etudiantId);
    const today = new Date();

    await prisma.historiqueAbonnement.updateMany({
      where: { etudiantId, dateFin: new Date("9999-12-31") },
      data:  { dateFin: today, motifChangement: "Résiliation" },
    });

    await prisma.abonnement.delete({ where: { etudiantId } });
    res.json({ success: true, message: "Abonnement résilié" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/abonnements/historique/:etudiantId — Historique des affectations d'un étudiant
const getHistoriqueEtudiant = async (req, res) => {
  try {
    const data = await prisma.historiqueAbonnement.findMany({
      where:   { etudiantId: parseInt(req.params.etudiantId) },
      include: { ligne: true },
      orderBy: { dateDebut: "desc" },
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export {
  getAllAbonnements,
  createAbonnement,
  changerLigne,
  resilierAbonnement,
  getHistoriqueEtudiant,
};