import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, fmt } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const STATUT_COLORS = {
  OUVERT:               { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/20",     label: "Ouvert" },
  EN_COURS_RESOLUTION:  { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20",   label: "En cours" },
  RESOLU:               { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Résolu" },
  FERME:                { bg: "bg-white/5",         text: "text-white/30",    border: "border-white/10",        label: "Fermé" },
};

const TYPE_ICONS = {
  PANNE_MECANIQUE:  "🔧",
  ACCIDENT:         "💥",
  RETARD_TRAFIC:    "🚦",
  SURCHARGE:        "👥",
  ABSENCE_CHAUFFEUR:"👤",
  CONDITIONS_METEO: "🌧️",
  AUTRE:            "❓",
};

const EMPTY = { type: "AUTRE", description: "", dateSurvenance: "", retardImpute: 0, busId: "", trajetId: "", etudiantId: "" };

export default function AdminIncidents() {
  const [incidents, setIncidents]   = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);
  const [statutFilter, setStatutFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState(null);
  const [saving, setSaving]         = useState(false);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/incidents", { params: { page, limit: 15, statut: statutFilter || undefined, type: typeFilter || undefined } });
      setIncidents(r.data.data);
      setPagination(r.data.pagination);
    } finally { setLoading(false); }
  }, [page, statutFilter, typeFilter]);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const openAdd = () => setForm({ ...EMPTY, _mode: "add" });

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { _mode, bus, trajet, etudiant, ...body } = form;
      const payload = {
        ...body,
        dateSurvenance: new Date(body.dateSurvenance),
        retardImpute:   parseInt(body.retardImpute) || 0,
        busId:      body.busId     ? parseInt(body.busId)     : null,
        trajetId:   body.trajetId  ? parseInt(body.trajetId)  : null,
        etudiantId: body.etudiantId ? parseInt(body.etudiantId) : null,
      };
      if (_mode === "add") await api.post("/incidents", payload);
      else                 await api.put(`/incidents/${body.id}`, payload);
      setForm(null);
      fetchIncidents();
    } catch (e) { alert(e?.response?.data?.message || "Error"); }
    finally { setSaving(false); }
  };

  const resoudre = async (id) => {
    await api.patch(`/incidents/${id}/resoudre`);
    fetchIncidents();
  };

  const openDetail = async (i) => {
    const r = await api.get(`/incidents/${i.id}`);
    setSelected(r.data.data);
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">
      <AdminSidebar />
      <main className="ml-60 flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black">⚠️ Incidents</h1>
            <p className="text-white/35 text-sm mt-1">{pagination.total ?? "—"} incidents saved</p>
          </div>
          <button onClick={openAdd} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-red-900/30">
            + Report an incident
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <select value={statutFilter} onChange={(e) => { setStatutFilter(e.target.value); setPage(1); }}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 focus:border-red-400/50 outline-none">
            <option value="">All statuses</option>
            <option value="OUVERT">Open</option>
            <option value="EN_COURS_RESOLUTION">In Progress</option>
            <option value="RESOLU">Resolved</option>
            <option value="FERME">Closed</option>
          </select>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 focus:border-red-400/50 outline-none">
            <option value="">All types</option>
            {Object.keys(TYPE_ICONS).map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {["Type", "Description", "Bus", "Retard", "Date", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-4 text-xs font-bold tracking-widest text-white/25 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-white/25">Loading...</td></tr>
              ) : incidents.map((inc) => {
                const statut = STATUT_COLORS[inc.statut];
                return (
                  <tr key={inc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-lg">{TYPE_ICONS[inc.type]}</span>
                    </td>
                    <td className="px-5 py-3 max-w-[220px]">
                      <p className="text-white/70 text-xs truncate">{inc.description}</p>
                      <p className="text-white/25 text-[11px] mt-0.5">{inc.type.replace(/_/g, " ")}</p>
                    </td>
                    <td className="px-5 py-3 text-amber-300 text-xs font-mono">{inc.bus?.immatriculation ?? "—"}</td>
                    <td className="px-5 py-3">
                      {inc.retardImpute > 0 ? (
                        <span className="text-red-400 text-xs font-bold">+{inc.retardImpute} min</span>
                      ) : <span className="text-white/20 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3 text-white/40 text-xs font-mono">{inc.dateSurvenance?.split("T")[0]}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 ${statut.bg} ${statut.text} border ${statut.border} rounded-full text-xs font-semibold`}>
                        {statut.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openDetail(inc)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-all">View</button>
                        {inc.statut === "OUVERT" && (
                          <button onClick={() => resoudre(inc.id)} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 transition-all">Resolve</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex gap-2 mt-6 justify-center">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-xl text-sm font-bold border transition-all ${page === p ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"}`}>{p}</button>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {selected && (
            <Modal onClose={() => setSelected(null)} title={`Incident #${selected.id} — ${TYPE_ICONS[selected.type]}`}>
              <Row label="Type"        val={selected.type?.replace(/_/g, " ")} />
              <Row label="Description" val={selected.description} />
              <Row label="Bus"         val={selected.bus?.immatriculation} />
              <Row label="Line"       val={selected.trajet?.ligne?.code} />
              <Row label="Delay"      val={selected.retardImpute > 0 ? `${selected.retardImpute} min` : null} />
              <Row label="Occurred on"  val={selected.dateSurvenance?.split("T")[0]} />
              <Row label="Resolved on"   val={selected.dateResolution?.split("T")[0]} />
              <Row label="Status"      val={STATUT_COLORS[selected.statut]?.label} />
              {selected.etudiant && (
                <div className="mt-3 p-3 bg-violet-500/5 border border-violet-500/15 rounded-xl text-xs text-white/50">
                  Reported by : {selected.etudiant.nom} {selected.etudiant.prenom}
                </div>
              )}
            </Modal>
          )}
        </AnimatePresence>

        {/* Form Modal */}
        <AnimatePresence>
          {form && (
            <Modal onClose={() => setForm(null)} title="Report an incident">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Type</label>
                  <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-red-400/50 outline-none">
                    {Object.keys(TYPE_ICONS).map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Date occurred</label>
                  <input type="datetime-local" value={form.dateSurvenance ?? ""} onChange={(e) => setForm(f => ({ ...f, dateSurvenance: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-red-400/50 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Description</label>
                  <textarea value={form.description ?? ""} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-red-400/50 outline-none resize-none" />
                </div>
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Bus ID (optional)</label>
                  <input type="number" value={form.busId ?? ""} onChange={(e) => setForm(f => ({ ...f, busId: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-red-400/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Delay imputed (min)</label>
                  <input type="number" value={form.retardImpute ?? 0} onChange={(e) => setForm(f => ({ ...f, retardImpute: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-red-400/50 outline-none" />
                </div>
              </div>
              <button onClick={save} disabled={saving} className="w-full mt-6 py-3.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold rounded-xl transition-all">
                {saving ? "Submitting..." : "Report Incident"}
              </button>
            </Modal>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Row({ label, val }) {
  if (!val) return null;
  return (
    <div className="flex items-start gap-4 mb-2">
      <span className="text-xs text-white/25 w-28 flex-shrink-0">{label}</span>
      <span className="text-sm text-white/60">{val}</span>
    </div>
  );
}

function Modal({ onClose, title, children }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-7 py-5 border-b border-white/10">
          <h2 className="font-black text-lg">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all flex items-center justify-center">×</button>
        </div>
        <div className="overflow-y-auto flex-1 px-7 py-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}