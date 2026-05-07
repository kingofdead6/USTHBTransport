import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const STATUT_COLORS = {
  ACTIVE:    { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Active" },
  SUSPENDUE: { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20",   label: "Suspended" },
  SUPPRIMEE: { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/20",     label: "Deleted" },
};

const EMPTY = { code: "", nom: "", description: "", pointDepart: "", pointArrivee: "", distanceKm: "", dureeEstimeeMin: "", statut: "ACTIVE" };

export default function AdminLignes() {
  const [lignes, setLignes]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState(null);
  const [saving, setSaving]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchLignes = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/lignes", { params: { search: search || undefined } });
      setLignes(r.data.data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchLignes(); }, [fetchLignes]);

  const openAdd = () => setForm({ ...EMPTY, _mode: "add" });
  const openEdit = (l) => setForm({
    ...l,
    distanceKm: l.distanceKm ?? "",
    dureeEstimeeMin: l.dureeEstimeeMin ?? "",
    _mode: "edit"
  });

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { _mode, ligneStations, horaires, affectationsBus, abonnements, trajets, _count, ...body } = form;
      const payload = {
        ...body,
        distanceKm: body.distanceKm ? parseFloat(body.distanceKm) : null,
        dureeEstimeeMin: body.dureeEstimeeMin ? parseInt(body.dureeEstimeeMin) : null,
      };
      if (_mode === "add") await api.post("/lignes", payload);
      else await api.put(`/lignes/${body.id}`, payload);
      setForm(null);
      fetchLignes();
    } catch (e) {
      alert(e?.response?.data?.message || "Error saving line");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this line?")) return;
    await api.delete(`/lignes/${id}`);
    fetchLignes();
  };

  const openDetail = async (l) => {
    const r = await api.get(`/lignes/${l.id}`);
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
          <span className="text-xl">🗺️</span>
          <span className="font-black text-lg">Lines</span>
        </div>
        <button
          onClick={openAdd}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
        >
          + New
        </button>
      </div>

      <main className="flex-1 md:ml-60 p-4 md:p-8 pt-20 md:pt-8">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">🗺️ Lines</h1>
            <p className="text-white/40 text-sm mt-1">{lignes.length} lines configured</p>
          </div>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all"
          >
            + New Line
          </button>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code or name..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm placeholder:text-white/30 focus:border-emerald-400/50 outline-none mb-6"
        />

        {/* Lines Grid */}
        {loading ? (
          <div className="text-center py-20 text-white/30">Loading lines...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {lignes.map((l) => {
              const statut = STATUT_COLORS[l.statut];
              return (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-12 h-11 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 rounded-2xl text-base font-black flex items-center justify-center">
                        {l.code}
                      </span>
                      <div>
                        <p className="font-bold text-lg leading-tight">{l.nom}</p>
                        <span className={`inline-block text-xs px-3 py-0.5 mt-1.5 ${statut.bg} ${statut.text} border ${statut.border} rounded-full`}>
                          {statut.label}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-white/40 font-medium">
                      {l._count?.abonnements ?? 0} subscribers
                    </span>
                  </div>

                  <div className="mt-6 space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-white/70">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span className="truncate">{l.pointDepart}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                      <span className="truncate">{l.pointArrivee}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
                    {l.distanceKm && <span>{l.distanceKm} km</span>}
                    {l.dureeEstimeeMin && <span>{l.dureeEstimeeMin} min</span>}
                    {l.ligneStations?.length > 0 && <span>{l.ligneStations.length} stations</span>}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-6">
                    <button
                      onClick={() => openDetail(l)}
                      className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-medium transition-all"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openEdit(l)}
                      className="py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl text-sm font-medium text-emerald-400 transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => del(l.id)}
                      className="py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-sm font-medium text-red-400 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {selected && (
            <Modal onClose={() => setSelected(null)} title={`${selected.code} — ${selected.nom}`}>
              <Row label="Departure" val={selected.pointDepart} />
              <Row label="Arrival" val={selected.pointArrivee} />
              <Row label="Distance" val={selected.distanceKm ? `${selected.distanceKm} km` : null} />
              <Row label="Estimated Time" val={selected.dureeEstimeeMin ? `${selected.dureeEstimeeMin} min` : null} />
              <Row label="Status" val={STATUT_COLORS[selected.statut]?.label} />
              {selected.description && <Row label="Description" val={selected.description} />}

              {selected.ligneStations?.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Stations ({selected.ligneStations.length})</p>
                  {selected.ligneStations.map((ls) => (
                    <div key={ls.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 text-sm">
                      <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs text-white/40">
                        {ls.ordreArret}
                      </span>
                      <span className="flex-1">{ls.station?.nom}</span>
                      {ls.dureeDepuisDepart && <span className="text-white/40">{ls.dureeDepuisDepart} min</span>}
                    </div>
                  ))}
                </div>
              )}

              {selected.horaires?.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Schedules</p>
                  {selected.horaires.map((h) => (
                    <div key={h.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 text-sm text-white/60">
                      <span>{h.jourSemaine}</span>
                      <span className="font-mono">{h.heureDepart?.slice(11, 16)} → {h.heureArrivee?.slice(11, 16)}</span>
                      <span className="text-white/40">{h.sens}</span>
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
            <Modal
              onClose={() => setForm(null)}
              title={form._mode === "add" ? "New Line" : "Edit Line"}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { label: "Code", key: "code", type: "text" },
                  { label: "Name", key: "nom", type: "text" },
                  { label: "Departure Point", key: "pointDepart", type: "text" },
                  { label: "Arrival Point", key: "pointArrivee", type: "text" },
                  { label: "Distance (km)", key: "distanceKm", type: "number" },
                  { label: "Duration (min)", key: "dureeEstimeeMin", type: "number" },
                ].map(({ label, key, type }) => (
                  <div key={key} className={["nom", "pointDepart", "pointArrivee"].includes(key) ? "sm:col-span-2" : ""}>
                    <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">{label}</label>
                    <input
                      type={type}
                      value={form[key] ?? ""}
                      onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-emerald-400/50 outline-none"
                    />
                  </div>
                ))}

                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Status</label>
                  <select
                    value={form.statut}
                    onChange={(e) => setForm(f => ({ ...f, statut: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-emerald-400/50 outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDUE">Suspended</option>
                    <option value="SUPPRIMEE">Deleted</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Description</label>
                  <textarea
                    value={form.description ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-emerald-400/50 outline-none resize-none"
                  />
                </div>
              </div>

              <button
                onClick={save}
                disabled={saving}
                className="w-full mt-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-2xl text-lg transition-all"
              >
                {saving ? "Saving..." : form._mode === "add" ? "Create Line" : "Save Changes"}
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