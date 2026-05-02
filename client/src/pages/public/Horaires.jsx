import { useEffect, useState } from "react";
import { api } from "../../utils/api";
import PublicNav from "../../components/public/PublicNav";

const JOURS = ["SAMEDI","DIMANCHE","LUNDI","MARDI","MERCREDI","JEUDI"];
const JOURS_FR = { SAMEDI:"Samedi", DIMANCHE:"Dimanche", LUNDI:"Lundi", MARDI:"Mardi", MERCREDI:"Mercredi", JEUDI:"Jeudi" };

export default function PublicHoraires() {
  const [horaires, setHoraires] = useState([]);
  const [lignes, setLignes]     = useState([]);
  const [selLigne, setSelLigne] = useState("");
  const [selJour, setSelJour]   = useState("");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get("/lignes").then((r) => setLignes(r.data.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (selLigne) params.ligneId = selLigne;
    if (selJour)  params.jour    = selJour;
    api.get("/horaires", { params }).then((r) => {
      setHoraires(r.data.data);
      setLoading(false);
    });
  }, [selLigne, selJour]);

  // Group by ligne
  const byLigne = horaires.reduce((acc, h) => {
    const key = h.ligne?.id;
    if (!acc[key]) acc[key] = { ligne: h.ligne, items: [] };
    acc[key].items.push(h);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <PublicNav />
      <div className="max-w-5xl mx-auto pt-28 px-6 pb-16">
        <h1 className="text-4xl font-black text-slate-900 mb-2">Horaires</h1>
        <p className="text-slate-500 mb-8">Consultez les horaires de départ par ligne et par jour.</p>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <select
            value={selLigne}
            onChange={(e) => setSelLigne(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 shadow-sm"
          >
            <option value="">Toutes les lignes</option>
            {lignes.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.nom}</option>)}
          </select>

          <div className="flex gap-2 flex-wrap">
            {["", ...JOURS].map((j) => (
              <button
                key={j}
                onClick={() => setSelJour(j)}
                className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                  selJour === j
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white border-slate-200 text-slate-500 hover:border-emerald-300"
                }`}
              >
                {j ? JOURS_FR[j].slice(0, 3) : "Tous"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400">Chargement...</div>
        ) : (
          <div className="space-y-6">
            {Object.values(byLigne).map(({ ligne, items }) => (
              <div key={ligne?.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-black text-sm flex items-center justify-center">
                    {ligne?.code}
                  </span>
                  <span className="font-bold text-slate-800">{ligne?.nom}</span>
                </div>
                <div className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {items.map((h) => (
                      <div key={h.id} className="flex flex-col items-center px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[10px] text-slate-400 font-bold">{JOURS_FR[h.jourSemaine]?.slice(0,3)}</span>
                        <span className="text-sm font-black text-slate-800">
                          {new Date(h.heureDepart).toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-[10px] text-slate-400">{h.sens}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(byLigne).length === 0 && (
              <div className="text-center py-16 text-slate-400">Aucun horaire trouvé.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}