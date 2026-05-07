import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, fmt } from "../../utils/api";
import PublicNav from "../../components/public/PublicNav";

const TYPE_LABELS = {
  PANNE_MECANIQUE:   "🔧 Mechanical Failure",
  ACCIDENT:          "🚨 Accident",
  RETARD_TRAFIC:     "🚦 Traffic Delay",
  SURCHARGE:         "👥 Overload",
  ABSENCE_CHAUFFEUR: "👤 Driver Absence",
  CONDITIONS_METEO:  "🌩️ Weather Conditions",
  AUTRE:             "ℹ️ Other",
};

const STATUS_STYLE = {
  OUVERT:              "bg-red-100 text-red-700 border-red-200",
  EN_COURS_RESOLUTION: "bg-amber-100 text-amber-700 border-amber-200",
  RESOLU:              "bg-emerald-100 text-emerald-700 border-emerald-200",
  FERME:               "bg-slate-100 text-slate-500 border-slate-200",
};

const REPORT_TYPES = [
  { key: "ACCIDENT",        label: "Accident",           icon: "🚨" },
  { key: "PANNE_MECANIQUE", label: "Mechanical Failure", icon: "🔧" },
  { key: "RETARD_TRAFIC",   label: "Traffic Delay",      icon: "🚦" },
  { key: "SURCHARGE",       label: "Overload",           icon: "👥" },
  { key: "CONDITIONS_METEO",label: "Bad Weather",        icon: "🌩️" },
  { key: "AUTRE",           label: "Other",              icon: "ℹ️" },
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
      alert(e?.response?.data?.message || "Error submitting report");
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
            <h1 className="text-4xl font-black text-slate-900 mb-2">Incidents & Delays</h1>
            <p className="text-slate-500">Currently open incidents on the network.</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-red-200 flex-shrink-0"
          >
            <span className="text-base">🚨</span>
            Report an Incident
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
                  <p className="font-black text-slate-800 text-lg">Report Submitted!</p>
                  <p className="text-slate-500 text-sm mt-1">Thank you, our team will process your report.</p>
                </motion.div>
              ) : (
                <>
                  <h2 className="font-black text-slate-900 text-lg mb-5">Report an Incident</h2>

                  {/* Type selector */}
                  <div className="mb-5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Incident Type</label>
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
                      placeholder="Describe what you observed (location, time, details...)"
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-300 focus:border-red-300 focus:ring-2 focus:ring-red-100 outline-none resize-none transition-all"
                    />
                  </div>

                  {/* Optional fields */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Your Student ID <span className="text-slate-300 font-normal">(optional)</span></label>
                      <input
                        type="number"
                        value={form.etudiantId}
                        onChange={(e) => setForm(f => ({ ...f, etudiantId: e.target.value }))}
                        placeholder="ex: 42"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:border-red-300 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Bus ID <span className="text-slate-300 font-normal">(optional)</span></label>
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
                      {submitting ? "Submitting..." : "Submit Report"}
                    </button>
                    <button
                      onClick={() => { setShowForm(false); setForm({ ...EMPTY_REPORT }); }}
                      className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-sm transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Incident list */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading...</div>
        ) : incidents.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-12 text-center">
            <span className="text-4xl block mb-3">✅</span>
            <p className="font-bold text-emerald-700">No Current Incidents</p>
            <p className="text-emerald-600/70 text-sm mt-1">The network is operating normally.</p>
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
                      <p className="text-sm text-slate-500 mt-0.5">Line: {inc.trajet.ligne.nom}</p>
                    )}
                    {inc.bus && (
                      <p className="text-xs text-slate-400">Bus: {inc.bus.immatriculation}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${STATUS_STYLE[inc.statut]}`}>
                    {inc.statut.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">{inc.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>📅 {fmt.datetime ? fmt.datetime(inc.dateSurvenance) : inc.dateSurvenance?.split("T")[0]}</span>
                  {inc.retardImpute > 0 && <span>⏱ +{inc.retardImpute} min delay</span>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}