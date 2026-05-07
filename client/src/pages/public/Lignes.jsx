import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../utils/api";
import PublicNav from "../../components/public/PublicNav";

const STATUS_COLOR = {
  ACTIVE:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  SUSPENDED: "bg-amber-100 text-amber-700 border-amber-200",
  DELETED: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABEL = {
  ACTIVE: "Active",
  SUSPENDUE: "Suspended",
  SUPPRIMEE: "Deleted",
};

export default function PublicLignes() {
  const [lignes, setLignes]  = useState([]);
  const [search, setSearch]  = useState("");
  const [loading, setLoading]= useState(true);

  useEffect(() => {
    api.get("/lignes", { params: { search, statut: "ACTIVE" } })
      .then((r) => setLignes(r.data.data))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <PublicNav />
      <div className="max-w-5xl mx-auto pt-28 px-6 pb-16">
        <h1 className="text-4xl font-black text-slate-900 mb-2">Transport Lines</h1>
        <p className="text-slate-500 mb-8">All active lines on the university network.</p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for a line..."
          className="w-full max-w-sm px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm mb-8 focus:outline-none focus:border-emerald-400 shadow-sm"
        />

        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {lignes.map((l) => (
              <Link
                key={l.id}
                to={`/lignes/${l.id}`}
                className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-lg hover:border-emerald-200 hover:-translate-y-0.5 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-emerald-100">
                      {l.code}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 text-sm leading-tight">{l.nom}</p>
                      <p className="text-xs text-slate-400">{l._count?.abonnements ?? 0} subscribers</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLOR[l.statut]}`}>
                    {STATUS_LABEL[l.statut] || l.statut}
                  </span>
                </div>

                {/* Route preview */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="truncate">{l.pointDepart}</span>
                  <span className="flex-shrink-0">→</span>
                  <span className="truncate">{l.pointArrivee}</span>
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                </div>

                {/* Stations count */}
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                  <span>📍 {l.ligneStations?.length ?? 0} stops</span>
                  <span>🕐 {l.horaires?.length ?? 0} schedules</span>
                  {l.distanceKm && <span>📏 {l.distanceKm} km</span>}
                </div>

                <div className="mt-4 text-emerald-600 text-xs font-bold group-hover:translate-x-1 transition-transform">
                  View Details →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}