import "dotenv/config";
import express from "express";
import cors from "cors";
import prisma from "./prisma/client.js"; 

// Route Imports
import etudiantRoutes       from "./routes/etudiant.routes.js";
import busRoutes            from "./routes/bus.routes.js";
import ligneRoutes          from "./routes/ligne.routes.js";
import stationRoutes        from "./routes/station.routes.js";
import horaireRoutes        from "./routes/horaire.routes.js";
import affectationBusRoutes from "./routes/affectationBus.routes.js";
import abonnementRoutes     from "./routes/abonnement.routes.js";
import trajetRoutes         from "./routes/trajet.routes.js";
import incidentRoutes       from "./routes/incident.routes.js";
import statsRoutes          from "./routes/stats.routes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/etudiants",        etudiantRoutes);
app.use("/api/bus",              busRoutes);
app.use("/api/lignes",           ligneRoutes);
app.use("/api/stations",         stationRoutes);
app.use("/api/horaires",         horaireRoutes);
app.use("/api/affectations-bus", affectationBusRoutes);
app.use("/api/abonnements",      abonnementRoutes);
app.use("/api/trajets",          trajetRoutes);
app.use("/api/incidents",        incidentRoutes);
app.use("/api/stats",            statsRoutes);

// Health check
app.get("/api/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.json({
      status: "ok",
      database: "reachable",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DB Health Check Failed:", error);

    return res.status(500).json({
      status: "error",
      database: "unreachable",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: err.message || "Internal server error" 
  });
});
try {
  await prisma.$connect();
  console.log("✅ Database connected");
} catch (err) {
  console.error("❌ Database connection failed at startup:", err);
  process.exit(1);
}
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`🚌 Transport Universitaire API running on port ${PORT}`);
});