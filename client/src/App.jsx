import { BrowserRouter, Routes, Route } from "react-router-dom";

// Public pages
import PublicHome        from "./pages/public/Home";
import PublicLignes      from "./pages/public/Lignes";
import PublicLigneDetail from "./pages/public/LigneDetail";
import PublicHoraires    from "./pages/public/Horaires";
import PublicIncidents   from "./pages/public/Incidents";
import Footer           from "./pages/public/Footer";  
// Admin pages
import AdminDashboard    from "./pages/admin/Dashboard";
import AdminEtudiants    from "./pages/admin/Etudiants";
import AdminBus from "./pages/admin/AdminBus";
import AdminLignes from "./pages/admin/AdminLignes";
import AdminStations from "./pages/admin/AdminStations";
import AdminTrajets from "./pages/admin/AdminTrajet";
import AdminIncidents from "./pages/admin/AdminIncidents";
import AdminAbonnements from "./pages/admin/AdminAbonnements";
import AdminHoraires from "./pages/admin/AdminHoraires";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ── */}
        <Route path="/"              element={<PublicHome />} />
        <Route path="/lignes"        element={<PublicLignes />} />
        <Route path="/lignes/:id"    element={<PublicLigneDetail />} />
        <Route path="/horaires"      element={<PublicHoraires />} />
        <Route path="/incidents"     element={<PublicIncidents />} />

        {/* ── Admin ── */}
        <Route path="/admin"              element={<AdminDashboard />} />
        <Route path="/admin/etudiants"    element={<AdminEtudiants />} />
        <Route path="/admin/bus"          element={<AdminBus />} />
        <Route path="/admin/lignes"       element={<AdminLignes />} />
        <Route path="/admin/stations"     element={<AdminStations />} />
        <Route path="/admin/trajets"      element={<AdminTrajets />} />
        <Route path="/admin/incidents"    element={<AdminIncidents />} />
        <Route path="/admin/abonnements"  element={<AdminAbonnements />} /> 
        <Route path="/admin/horaires"     element={<AdminHoraires />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}