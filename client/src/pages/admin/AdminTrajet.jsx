import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const STATUT_COLORS = {
  PLANIFIE: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20", label: "Planned" },
  EN_COURS: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "In Progress" },
  TERMINE: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Completed" },
  ANNULE: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", label: "Cancelled" },
};

const EMPTY_TRAJET = { busId: "", ligneId: "", horaireId: "", dateTrajet: "", retardMinutes: 0, statut: "PLANIFIE", nbPassagers: "" };

export default function AdminTrajets() {
  const [trajets, setTrajets] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [statutFilter, setStatutFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [buses, setBuses] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [horaires, setHoraires] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchTrajets = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/trajets", { 
        params: { page, limit: 15, statut: statutFilter || undefined } 
      });
      setTrajets(r.data.data);
      setPagination(r.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, statutFilter]);

  useEffect(() => { fetchTrajets(); }, [fetchTrajets]);

  const openAdd = async () => {
    const [busRes, ligneRes] = await Promise.all([api.get("/bus"), api.get("/lignes")]);
    setBuses(busRes.data.data);
    setLignes(ligneRes.data.data);
    setHoraires([]);
    setForm({ ...EMPTY_TRAJET, _mode: "add" });
  };

  const onLigneChange = async (ligneId) => {
    setForm(f => ({ ...f, ligneId, horaireId: "" }));
    if (ligneId) {
      const r = await api.get(`/lignes/${ligneId}/horaires`);
      setHoraires(r.data.data);
    } else {
      setHoraires([]);
    }
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { _mode, bus, ligne, horaire, arretsTrajet, incidents, ...body } = form;
      const payload = {
        ...body,
        busId: parseInt(body.busId),
        ligneId: parseInt(body.ligneId),
        horaireId: parseInt(body.horaireId),
        retardMinutes: parseInt(body.retardMinutes) || 0,
        nbPassagers: body.nbPassagers ? parseInt(body.nbPassagers) : null,
        dateTrajet: new Date(body.dateTrajet),
      };
      if (_mode === "add") await api.post("/trajets", payload);
      else await api.put(`/trajets/${body.id}`, payload);
      setForm(null);
      fetchTrajets();
    } catch (e) {
      alert(e?.response?.data?.message || "Error saving trip");
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (t) => {
    const r = await api.get(`/trajets/${t.id}`);
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
          <span className="text-xl">🛤️</span>
          <span className="font-black text-lg">Trips</span>
        </div>
        <button
          onClick={openAdd}
          className="bg-lime-500 hover:bg-lime-600 text-black px-4 py-2 rounded-xl text-sm font-bold transition-all"
        >
          + New
        </button>
      </div>

      <main className="flex-1 md:ml-60 p-4 md:p-8 pt-20 md:pt-8">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">🛤️ Trips</h1>
            <p className="text-white/40 text-sm mt-1">{pagination.total ?? "—"} trips recorded</p>
          </div>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 bg-lime-500 hover:bg-lime-600 text-black font-bold rounded-xl text-sm transition-all"
          >
            + New Trip
          </button>
        </div>

        {/* Status Filter */}
        <select
          value={statutFilter}
          onChange={(e) => { setStatutFilter(e.target.value); setPage(1); }}
          className="w-full md:w-auto px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-lime-400/50 outline-none mb-6"
        >
          <option value="">All Statuses</option>
          <option value="PLANIFIE">Planned</option>
          <option value="EN_COURS">In Progress</option>
          <option value="TERMINE">Completed</option>
          <option value="ANNULE">Cancelled</option>
        </select>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20 text-white/30">Loading trips...</div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {trajets.map((t) => {
                const statut = STATUT_COLORS[t.statut];
                return (
                  <div key={t.id} className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono text-xs text-white/50">{t.dateTrajet?.split("T")[0]}</p>
                        <p className="text-lg font-bold mt-1">{t.ligne?.code} — {t.bus?.immatriculation}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statut.bg} ${statut.text} ${statut.border}`}>
                        {statut.label}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-white/40 text-xs">Delay</p>
                        <p className="font-medium">{t.retardMinutes > 0 ? `+${t.retardMinutes} min` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs">Passengers</p>
                        <p className="font-medium">{t.nbPassagers ?? "—"}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => openDetail(t)}
                      className="w-full mt-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-medium transition-all"
                    >
                      View Details
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Date</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Line</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Bus</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Delay</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Passengers</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trajets.map((t) => {
                    const statut = STATUT_COLORS[t.statut];
                    return (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-white/60 font-mono text-sm">{t.dateTrajet?.split("T")[0]}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full text-xs font-bold">
                            {t.ligne?.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-amber-300">{t.bus?.immatriculation}</td>
                        <td className="px-6 py-4">
                          {t.retardMinutes > 0 ? (
                            <span className="text-red-400 font-bold">+{t.retardMinutes} min</span>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-white/50">{t.nbPassagers ?? "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statut.bg} ${statut.text} ${statut.border}`}>
                            {statut.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openDetail(t)}
                            className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-all"
                          >
                            View
                          </button>
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
            <Modal onClose={() => setSelected(null)} title={`Trip #${selected.id}`}>
              <Row label="Date" val={selected.dateTrajet?.split("T")[0]} />
              <Row label="Line" val={`${selected.ligne?.code} — ${selected.ligne?.nom}`} />
              <Row label="Bus" val={`${selected.bus?.immatriculation} (${selected.bus?.marque})`} />
              <Row label="Delay" val={selected.retardMinutes > 0 ? `+${selected.retardMinutes} min` : "None"} />
              <Row label="Passengers" val={selected.nbPassagers} />
              <Row label="Status" val={STATUT_COLORS[selected.statut]?.label} />

              {selected.arretsTrajet?.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Stops</p>
                  {selected.arretsTrajet.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 text-sm">
                      <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs text-white/40">
                        {a.ordreArret}
                      </span>
                      <span className="flex-1">{a.station?.nom}</span>
                      <span className="text-white/40 font-mono">{a.heurePrevue?.slice(11, 16)}</span>
                      {a.retardMinutes > 0 && <span className="text-red-400">+{a.retardMinutes}′</span>}
                    </div>
                  ))}
                </div>
              )}
            </Modal>
          )}
        </AnimatePresence>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {form && (
            <Modal onClose={() => setForm(null)} title="New Trip">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Bus</label>
                  <select
                    value={form.busId}
                    onChange={(e) => setForm(f => ({ ...f, busId: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-lime-400/50 outline-none"
                  >
                    <option value="">Select Bus...</option>
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.immatriculation} ({b.marque})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Line</label>
                  <select
                    value={form.ligneId}
                    onChange={(e) => onLigneChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-lime-400/50 outline-none"
                  >
                    <option value="">Select Line...</option>
                    {lignes.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.code} — {l.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Schedule</label>
                  <select
                    value={form.horaireId}
                    onChange={(e) => setForm(f => ({ ...f, horaireId: e.target.value }))}
                    disabled={!form.ligneId}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-lime-400/50 outline-none"
                  >
                    <option value="">Select Schedule...</option>
                    {horaires.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.jourSemaine} {h.heureDepart?.slice(11, 16)} ({h.sens})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Date</label>
                  <input
                    type="date"
                    value={form.dateTrajet ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, dateTrajet: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-lime-400/50 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Delay (minutes)</label>
                  <input
                    type="number"
                    value={form.retardMinutes ?? 0}
                    onChange={(e) => setForm(f => ({ ...f, retardMinutes: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-lime-400/50 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Passengers</label>
                  <input
                    type="number"
                    value={form.nbPassagers ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, nbPassagers: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-lime-400/50 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Status</label>
                  <select
                    value={form.statut}
                    onChange={(e) => setForm(f => ({ ...f, statut: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-lime-400/50 outline-none"
                  >
                    <option value="PLANIFIE">Planned</option>
                    <option value="EN_COURS">In Progress</option>
                    <option value="TERMINE">Completed</option>
                    <option value="ANNULE">Cancelled</option>
                  </select>
                </div>
              </div>

              <button
                onClick={save}
                disabled={saving}
                className="w-full mt-8 py-4 bg-lime-500 hover:bg-lime-600 disabled:opacity-50 text-black font-bold rounded-2xl text-lg transition-all"
              >
                {saving ? "Saving..." : "Save Trip"}
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
  if (val === null || val === undefined || val === "") return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/30 w-28 flex-shrink-0">{label}</span>
      <span className="text-white/70">{String(val)}</span>
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