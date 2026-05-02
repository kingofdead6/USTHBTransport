import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, fmt } from "../../utils/api";
import PublicNav from "../../components/public/PublicNav";

const TYPE_LABELS = {
  PANNE_MECANIQUE:   "🔧 Panne mécanique",
  ACCIDENT:          "🚨 Accident",
  RETARD_TRAFIC:     "🚦 Retard trafic",
  SURCHARGE:         "👥 Surcharge",
  ABSENCE_CHAUFFEUR: "👤 Absence chauffeur",
  CONDITIONS_METEO:  "🌩️ Météo",
  AUTRE:             "ℹ️ Autre",
};

const STATUS_STYLE = {
  OUVERT:              "bg-red-100 text-red-700 border-red-200",
  EN_COURS_RESOLUTION: "bg-amber-100 text-amber-700 border-amber-200",
  RESOLU:              "bg-emerald-100 text-emerald-700 border-emerald-200",
  FERME:               "bg-slate-100 text-slate-500 border-slate-200",
};

const REPORT_TYPES = [
  { key: "ACCIDENT",        label: "Accident",         icon: "🚨" },
  { key: "PANNE_MECANIQUE", label: "Panne mécanique",  icon: "🔧" },
  { key: "RETARD_TRAFIC",   label: "Retard trafic",    icon: "🚦" },
  { key: "SURCHARGE",       label: "Surcharge",        icon: "👥" },
  { key: "CONDITIONS_METEO",label: "Intempéries",      icon: "🌩️" },
  { key: "AUTRE",           label: "Autre",            icon: "ℹ️" },
];

const EMPTY_REPORT = { type: "ACCIDENT", description: "", etudiantId: "", busId: "" };

export default function PublicIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ ...EMPTY_REPORT });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const fetchIncidents = () => {
    api.get("/incidents", { params: { statut: "OUVERT" } })
      .then((r) => setIncidents(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchIncidents(); }, []);

  const submit = async () => {
    if (submitting || !form.description.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/incidents", {
        type:            form.type,
        description:     form.description,
        dateSurvenance:  new Date(),
        statut:          "OUVERT",
        retardImpute:    0,
        etudiantId:      form.etudiantId ? parseInt(form.etudiantId) : null,
        busId:           form.busId      ? parseInt(form.busId)      : null,
      });
      setSubmitted(true);
      setForm({ ...EMPTY_REPORT });
      setTimeout(() => {
        setSubmitted(false);
        setShowForm(false);
        fetchIncidents();
      }, 2500);
    } catch (e) {
      alert(e?.response?.data?.message || "Erreur lors du signalement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <PublicNav />
      <div className="max-w-4xl mx-auto pt-28 px-6 pb-16">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">Incidents & Retards</h1>
            <p className="text-slate-500">Incidents actuellement ouverts sur le réseau.</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-red-200 flex-shrink-0"
          >
            <span className="text-base">🚨</span>
            Signaler un incident
          </button>
        </div>

        {/* Report Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200 rounded-3xl p-7 mb-8 shadow-xl shadow-slate-100"
            >
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <span className="text-5xl block mb-3">✅</span>
                  <p className="font-black text-slate-800 text-lg">Signalement envoyé !</p>
                  <p className="text-slate-500 text-sm mt-1">Merci, notre équipe va traiter votre signalement.</p>
                </motion.div>
              ) : (
                <>
                  <h2 className="font-black text-slate-900 text-lg mb-5">Signaler un incident</h2>

                  {/* Type selector */}
                  <div className="mb-5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Type d'incident</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {REPORT_TYPES.map(({ key, label, icon }) => (
                        <button
                          key={key}
                          onClick={() => setForm(f => ({ ...f, type: key }))}
                          className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl border-2 text-xs font-bold transition-all ${
                            form.type === key
                              ? "border-red-400 bg-red-50 text-red-700"
                              : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-white"
                          }`}
                        >
                          <span className="text-xl">{icon}</span>
                          <span className="text-center leading-tight">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                      Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Décrivez ce que vous avez observé (lieu, heure, détails...)."
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-300 focus:border-red-300 focus:ring-2 focus:ring-red-100 outline-none resize-none transition-all"
                    />
                  </div>

                  {/* Optional fields */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Votre ID étudiant <span className="text-slate-300 font-normal">(optionnel)</span></label>
                      <input
                        type="number"
                        value={form.etudiantId}
                        onChange={(e) => setForm(f => ({ ...f, etudiantId: e.target.value }))}
                        placeholder="ex: 42"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:border-red-300 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">ID du bus <span className="text-slate-300 font-normal">(optionnel)</span></label>
                      <input
                        type="number"
                        value={form.busId}
                        onChange={(e) => setForm(f => ({ ...f, busId: e.target.value }))}
                        placeholder="ex: 7"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:border-red-300 outline-none"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={submit}
                      disabled={submitting || !form.description.trim()}
                      className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-red-100"
                    >
                      {submitting ? "Envoi en cours..." : "Envoyer le signalement"}
                    </button>
                    <button
                      onClick={() => { setShowForm(false); setForm({ ...EMPTY_REPORT }); }}
                      className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-sm transition-all"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Incident list */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">Chargement...</div>
        ) : incidents.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-12 text-center">
            <span className="text-4xl block mb-3">✅</span>
            <p className="font-bold text-emerald-700">Aucun incident en cours</p>
            <p className="text-emerald-600/70 text-sm mt-1">Le réseau fonctionne normalement.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incidents.map((inc) => (
              <motion.div
                key={inc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-bold text-slate-800">{TYPE_LABELS[inc.type] ?? inc.type}</p>
                    {inc.trajet?.ligne && (
                      <p className="text-sm text-slate-500 mt-0.5">Ligne : {inc.trajet.ligne.nom}</p>
                    )}
                    {inc.bus && (
                      <p className="text-xs text-slate-400">Bus : {inc.bus.immatriculation}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${STATUS_STYLE[inc.statut]}`}>
                    {inc.statut.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">{inc.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>📅 {fmt.datetime ? fmt.datetime(inc.dateSurvenance) : inc.dateSurvenance?.split("T")[0]}</span>
                  {inc.retardImpute > 0 && <span>⏱ +{inc.retardImpute} min de retard</span>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}