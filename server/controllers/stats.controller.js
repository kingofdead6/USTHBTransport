import prisma from "../prisma/client.js";

// GET /api/stats/dashboard — Résumé global pour le tableau de bord
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalEtudiants,
      totalBus,
      totalLignes,
      totalIncidents,
      etudiantsSansAbonnement,
      trajetsEnRetard,
      incidentsOuverts,
      busOperationnels,
    ] = await Promise.all([
      prisma.etudiant.count(),
      prisma.bus.count(),
      prisma.ligne.count({ where: { statut: "ACTIVE" } }),
      prisma.incident.count(),
      prisma.etudiant.count({ where: { abonnementActif: null } }),
      prisma.trajet.count({ where: { retardMinutes: { gt: 0 } } }),
      prisma.incident.count({ where: { statut: "OUVERT" } }),
      prisma.bus.count({ where: { etat: "OPERATIONNEL" } }),
    ]);

    // Lignes les plus chargées (top 5)
    const lignesPlusChargees = await prisma.ligne.findMany({
      include: { _count: { select: { abonnements: true } } },
      orderBy: { abonnements: { _count: "desc" } },
      take: 5,
    });

    // Taux de remplissage moyen des bus
    const trajetsTermines = await prisma.trajet.findMany({
      where: { statut: "TERMINE", nbPassagers: { not: null } },
      include: { bus: true },
    });

    const tauxMoyen = trajetsTermines.length > 0
      ? Math.round(
          trajetsTermines.reduce((acc, t) => acc + (t.nbPassagers / t.bus.capaciteMax) * 100, 0) /
          trajetsTermines.length
        )
      : 0;

    res.json({
      success: true,
      data: {
        totalEtudiants,
        totalBus,
        totalLignes,
        totalIncidents,
        etudiantsSansAbonnement,
        trajetsEnRetard,
        incidentsOuverts,
        busOperationnels,
        tauxRemplissageMoyen: tauxMoyen,
        lignesPlusChargees: lignesPlusChargees.map((l) => ({
          id:   l.id,
          code: l.code,
          nom:  l.nom,
          nb:   l._count.abonnements,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/stats/nb-etudiants-par-ligne
const nbEtudiantsParLigne = async (req, res) => {
  try {
    const data = await prisma.ligne.findMany({
      include: { _count: { select: { abonnements: true } } },
      orderBy: { code: "asc" },
    });
    res.json({
      success: true,
      data: data.map((l) => ({ id: l.id, code: l.code, nom: l.nom, nbEtudiants: l._count.abonnements })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export { getDashboardStats, nbEtudiantsParLigne };