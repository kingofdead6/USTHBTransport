import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, fmt } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const STATUT_COLORS = {
  OUVERT:              { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/20",     label: "Open" },
  EN_COURS_RESOLUTION: { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20",   label: "In Progress" },
  RESOLU:              { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Resolved" },
  FERME:               { bg: "bg-white/5",        text: "text-white/30",    border: "border-white/10",        label: "Closed" },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/incidents", { 
        params: { 
          page, 
          limit: 15, 
          statut: statutFilter || undefined, 
          type: typeFilter || undefined 
        } 
      });
      setIncidents(r.data.data);
      setPagination(r.data.pagination);
    } finally {
      setLoading(false);
    }
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
        retardImpute: parseInt(body.retardImpute) || 0,
        busId: body.busId ? parseInt(body.busId) : null,
        trajetId: body.trajetId ? parseInt(body.trajetId) : null,
        etudiantId: body.etudiantId ? parseInt(body.etudiantId) : null,
      };
      if (_mode === "add") await api.post("/incidents", payload);
      else await api.put(`/incidents/${body.id}`, payload);
      setForm(null);
      fetchIncidents();
    } catch (e) {
      alert(e?.response?.data?.message || "Error saving incident");
    } finally {
      setSaving(false);
    }
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
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#0f0f1a] border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <span className="font-black text-lg">Incidents</span>
        </div>
        <button
          onClick={openAdd}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-sm font-bold transition-all"
        >
          + New
        </button>
      </div>

      <main className="flex-1 md:ml-60 p-4 md:p-8 pt-20 md:pt-8">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">⚠️ Incidents</h1>
            <p className="text-white/40 text-sm mt-1">{pagination.total ?? "—"} incidents saved</p>
          </div>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all"
          >
            + Report Incident
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <select
            value={statutFilter}
            onChange={(e) => { setStatutFilter(e.target.value); setPage(1); }}
            className="w-full sm:w-auto px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-red-400/50 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="OUVERT">Open</option>
            <option value="EN_COURS_RESOLUTION">In Progress</option>
            <option value="RESOLU">Resolved</option>
            <option value="FERME">Closed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="w-full sm:w-auto px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-red-400/50 outline-none"
          >
            <option value="">All Types</option>
            {Object.keys(TYPE_ICONS).map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20 text-white/30">Loading incidents...</div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {incidents.map((inc) => {
                const statut = STATUT_COLORS[inc.statut];
                return (
                  <div key={inc.id} className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{TYPE_ICONS[inc.type]}</span>
                        <div>
                          <p className="font-semibold text-white/90">{inc.type.replace(/_/g, " ")}</p>
                          <span className={`text-xs px-3 py-1 mt-1 inline-block ${statut.bg} ${statut.text} border ${statut.border} rounded-full`}>
                            {statut.label}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-white/40 font-mono">
                        {inc.dateSurvenance?.split("T")[0]}
                      </span>
                    </div>

                    <p className="mt-4 text-white/70 text-sm line-clamp-3">{inc.description}</p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs text-white/40">
                      {inc.bus && <span>Bus: {inc.bus.immatriculation}</span>}
                      {inc.retardImpute > 0 && <span className="text-red-400">+{inc.retardImpute} min</span>}
                    </div>

                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={() => openDetail(inc)}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-medium"
                      >
                        View Details
                      </button>
                      {inc.statut === "OUVERT" && (
                        <button
                          onClick={() => resoudre(inc.id)}
                          className="flex-1 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl text-sm font-medium text-emerald-400"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Type</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Description</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Bus</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Delay</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Date</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => {
                    const statut = STATUT_COLORS[inc.statut];
                    return (
                      <tr key={inc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-2xl">{TYPE_ICONS[inc.type]}</td>
                        <td className="px-6 py-4">
                          <p className="text-white/70 text-sm line-clamp-2">{inc.description}</p>
                        </td>
                        <td className="px-6 py-4 text-amber-300 font-mono text-sm">{inc.bus?.immatriculation ?? "—"}</td>
                        <td className="px-6 py-4">
                          {inc.retardImpute > 0 ? (
                            <span className="text-red-400 font-bold">+{inc.retardImpute} min</span>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-white/40 font-mono text-sm">
                          {inc.dateSurvenance?.split("T")[0]}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statut.bg} ${statut.text} ${statut.border}`}>
                            {statut.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openDetail(inc)}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-all"
                            >
                              View
                            </button>
                            {inc.statut === "OUVERT" && (
                              <button
                                onClick={() => resoudre(inc.id)}
                                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 transition-all"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex gap-2 mt-8 justify-center flex-wrap">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-2xl text-sm font-bold border transition-all ${page === p ? "bg-white text-black border-white" : "bg-white/5 border-white/10 hover:border-white/30"}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {selected && (
            <Modal onClose={() => setSelected(null)} title={`Incident #${selected.id}`}>
              <Row label="Type" val={selected.type?.replace(/_/g, " ")} />
              <Row label="Description" val={selected.description} />
              <Row label="Bus" val={selected.bus?.immatriculation} />
              <Row label="Line" val={selected.trajet?.ligne?.code} />
              <Row label="Delay" val={selected.retardImpute > 0 ? `${selected.retardImpute} min` : null} />
              <Row label="Occurred On" val={selected.dateSurvenance?.split("T")[0]} />
              <Row label="Resolved On" val={selected.dateResolution?.split("T")[0]} />
              <Row label="Status" val={STATUT_COLORS[selected.statut]?.label} />

              {selected.etudiant && (
                <div className="mt-6 p-4 bg-violet-500/5 border border-violet-500/20 rounded-2xl">
                  <p className="text-xs text-white/40">Reported by</p>
                  <p className="text-white/80">
                    {selected.etudiant.nom} {selected.etudiant.prenom}
                  </p>
                </div>
              )}
            </Modal>
          )}
        </AnimatePresence>

        {/* Add Incident Modal */}
        <AnimatePresence>
          {form && (
            <Modal onClose={() => setForm(null)} title="Report New Incident">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Incident Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-red-400/50 outline-none"
                  >
                    {Object.keys(TYPE_ICONS).map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Description</label>
                  <textarea
                    value={form.description ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-red-400/50 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={form.dateSurvenance ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, dateSurvenance: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-red-400/50 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Delay (minutes)</label>
                  <input
                    type="number"
                    value={form.retardImpute ?? 0}
                    onChange={(e) => setForm(f => ({ ...f, retardImpute: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-red-400/50 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Bus ID (optional)</label>
                  <input
                    type="number"
                    value={form.busId ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, busId: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-red-400/50 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={save}
                disabled={saving}
                className="w-full mt-8 py-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold rounded-2xl text-lg transition-all"
              >
                {saving ? "Submitting..." : "Report Incident"}
              </button>
            </Modal>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ====================== Reusable Components ====================== */

function Row({ label, val }) {
  if (!val) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 py-3 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/30 w-32 flex-shrink-0">{label}</span>
      <span className="text-white/70">{val}</span>
    </div>
  );
}

function Modal({ onClose, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 30 }}
        className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="font-black text-xl">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-2xl text-white/60 hover:text-white transition-all"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}