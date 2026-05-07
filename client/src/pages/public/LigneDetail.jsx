import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, fmt } from "../../utils/api";
import PublicNav from "../../components/public/PublicNav";

const JOURS = { SAMEDI: "Sam", DIMANCHE: "Dim", LUNDI: "Lun", MARDI: "Mar", MERCREDI: "Mer", JEUDI: "Jeu" };

export default function PublicLigneDetail() {
  const { id } = useParams();
  const [ligne, setLigne] = useState(null);

  useEffect(() => {
    api.get(`/lignes/${id}`).then((r) => setLigne(r.data.data));
  }, [id]);

  if (!ligne) return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <div className="pt-32 text-center text-slate-400">Loading...</div>
    </div>
  );

  // Group horaires by day
  const horairesByDay = ligne.horaires.reduce((acc, h) => {
    if (!acc[h.jourSemaine]) acc[h.jourSemaine] = [];
    acc[h.jourSemaine].push(h);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <PublicNav />
      <div className="max-w-4xl mx-auto pt-28 px-6 pb-16">
        {/* Header */}
        <Link to="/lignes" className="text-sm text-slate-400 hover:text-emerald-600 mb-6 inline-flex items-center gap-1">
          ← Back to Lines
        </Link>

        <div className="bg-white border border-slate-100 rounded-3xl p-8 mb-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-black text-xl flex items-center justify-center shadow-lg">
              {ligne.code}
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{ligne.nom}</h1>
              <p className="text-slate-500 text-sm">{ligne._count?.abonnements} subscribers · {ligne._count?.trajets} trips completed</p>
            </div>
          </div>

          {/* Route */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl mb-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <div className="w-0.5 h-10 bg-slate-200 my-1" />
              <div className="w-3 h-3 rounded-full bg-red-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800 text-sm">{ligne.pointDepart}</p>
              <p className="text-slate-400 text-xs my-2">{ligne.distanceKm && `${ligne.distanceKm} km`} {ligne.dureeEstimeeMin && `· ~${ligne.dureeEstimeeMin} min`}</p>
              <p className="font-semibold text-slate-800 text-sm">{ligne.pointArrivee}</p>
            </div>
          </div>
        </div>

        {/* Stations */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 mb-6 shadow-sm">
          <h2 className="font-black text-slate-800 mb-5">📍 Stops ({ligne.ligneStations.length})</h2>
          <div className="space-y-2">
            {ligne.ligneStations.map((ls, i) => (
              <div key={ls.id} className="flex items-center gap-4">
                <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center flex-shrink-0">
                  {ls.ordreArret}
                </span>
                <div className="flex-1 flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                  <span className="text-sm font-semibold text-slate-700">{ls.station.nom}</span>
                  {ls.dureeDepuisDepart != null && (
                    <span className="text-xs text-slate-400">+{ls.dureeDepuisDepart} min</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Horaires */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
          <h2 className="font-black text-slate-800 mb-5">🕐 Horaires</h2>
          {Object.entries(horairesByDay).map(([jour, hs]) => (
            <div key={jour} className="mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{JOURS[jour] ?? jour}</p>
              <div className="flex flex-wrap gap-2">
                {hs.map((h) => (
                  <span key={h.id} className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-semibold text-emerald-700">
                    {new Date(h.heureDepart).toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(horairesByDay).length === 0 && (
            <p className="text-slate-400 text-sm">Aucun horaire disponible.</p>
          )}
        </div>
      </div>
    </div>
  );
}