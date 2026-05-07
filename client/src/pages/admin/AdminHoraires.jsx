import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const JOURS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const JOUR_SHORT = { Saturday: "Sat", Sunday: "Sun", Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu" };

const SENS_COLORS = {
  ALLER:  { bg: "bg-indigo-500/10", text: "text-indigo-300", border: "border-indigo-500/20" },
  RETOUR: { bg: "bg-pink-500/10",   text: "text-pink-300",   border: "border-pink-500/20" },
};

const EMPTY = { ligneId: "", jourSemaine: "Monday", heureDepart: "", heureArrivee: "", sens: "ALLER", actif: true };

export default function AdminHoraires() {
  const [horaires, setHoraires]   = useState([]);
  const [lignes, setLignes]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [ligneFilter, setLigneFilter] = useState("");
  const [jourFilter, setJourFilter]   = useState("");
  const [form, setForm]           = useState(null);
  const [saving, setSaving]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, lRes] = await Promise.all([
        api.get("/horaires", { params: { ligneId: ligneFilter || undefined, jour: jourFilter || undefined } }),
        api.get("/lignes"),
      ]);
      setHoraires(hRes.data.data);
      setLignes(lRes.data.data);
    } finally {
      setLoading(false);
    }
  }, [ligneFilter, jourFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => setForm({ ...EMPTY, _mode: "add" });
  const openEdit = (h) => setForm({
    ...h,
    heureDepart: h.heureDepart?.slice(11, 16) || "",
    heureArrivee: h.heureArrivee?.slice(11, 16) || "",
    _mode: "edit",
  });

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { _mode, ligne, trajets, ...body } = form;
      const today = "1970-01-01";
      const payload = {
        ...body,
        ligneId: parseInt(body.ligneId),
        heureDepart: new Date(`${today}T${body.heureDepart}:00`),
        heureArrivee: new Date(`${today}T${body.heureArrivee}:00`),
        actif: Boolean(body.actif),
      };
      if (_mode === "add") await api.post("/horaires", payload);
      else await api.put(`/horaires/${body.id}`, payload);
      setForm(null);
      fetchAll();
    } catch (e) {
      alert(e?.response?.data?.message || "Error saving schedule");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this schedule?")) return;
    await api.delete(`/horaires/${id}`);
    fetchAll();
  };

  const toggleActif = async (h) => {
    await api.put(`/horaires/${h.id}`, { ...h, ligneId: h.ligneId, actif: !h.actif });
    fetchAll();
  };

  // Group schedules by line
  const grouped = {};
  for (const h of horaires) {
    const key = h.ligne?.code ?? "?";
    if (!grouped[key]) grouped[key] = { ligne: h.ligne, slots: {} };
    if (!grouped[key].slots[h.jourSemaine]) grouped[key].slots[h.jourSemaine] = [];
    grouped[key].slots[h.jourSemaine].push(h);
  }

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
          <span className="text-xl">🕒</span>
          <span className="font-black text-lg">Schedules</span>
        </div>
        <button
          onClick={openAdd}
          className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-xl text-sm font-bold transition-all"
        >
          + New
        </button>
      </div>

      <main className="flex-1 md:ml-60 p-4 md:p-8 pt-20 md:pt-8">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">🕐 Schedules</h1>
            <p className="text-white/40 text-sm mt-1">{horaires.length} schedules configured</p>
          </div>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-sm transition-all"
          >
            + New Schedule
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <select
            value={ligneFilter}
            onChange={(e) => setLigneFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-indigo-400/50 outline-none"
          >
            <option value="">All Lines</option>
            {lignes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.code} — {l.nom}
              </option>
            ))}
          </select>

          <select
            value={jourFilter}
            onChange={(e) => setJourFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-indigo-400/50 outline-none"
          >
            <option value="">All Days</option>
            {JOURS.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/30">Loading schedules...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-white/30">No schedules found</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([code, { ligne, slots }]) => (
              <motion.div
                key={code}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden"
              >
                {/* Line Header */}
                <div className="flex items-center gap-4 px-5 py-4 border-b border-white/10 bg-white/[0.02]">
                  <span className="w-14 h-10 bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 rounded-2xl text-base font-black flex items-center justify-center">
                    {code}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white/90">{ligne?.nom}</p>
                    <p className="text-white/40 text-sm truncate">
                      {ligne?.pointDepart} → {ligne?.pointArrivee}
                    </p>
                  </div>
                </div>

                {/* Schedule Grid - Mobile friendly */}
                <div className="overflow-x-auto p-4">
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 min-w-[700px]">
                    {JOURS.map((jour) => (
                      <div key={jour} className="bg-white/[0.02] border border-white/10 rounded-2xl p-3">
                        <p className="text-center text-xs font-bold text-white/40 mb-3 tracking-widest">
                          {JOUR_SHORT[jour]}
                        </p>
                        <div className="space-y-2">
                          {(slots[jour] || []).map((h) => {
                            const sens = SENS_COLORS[h.sens];
                            return (
                              <div
                                key={h.id}
                                className={`rounded-xl p-3 border ${sens.border} ${sens.bg} ${!h.actif ? "opacity-40" : ""}`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className={`font-bold text-base ${sens.text}`}>
                                    {h.heureDepart?.slice(11, 16)}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full border ${sens.border} ${sens.text}`}>
                                    {h.sens === "ALLER" ? "→" : "←"}
                                  </span>
                                </div>
                                <p className="text-white/30 text-xs mt-1">
                                  → {h.heureArrivee?.slice(11, 16)}
                                </p>

                                <div className="flex gap-1 mt-3">
                                  <button
                                    onClick={() => openEdit(h)}
                                    className="flex-1 py-1.5 text-[10px] bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => toggleActif(h)}
                                    className={`flex-1 py-1.5 text-[10px] rounded-lg transition-all ${h.actif ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}
                                  >
                                    {h.actif ? "Pause" : "Activate"}
                                  </button>
                                  <button
                                    onClick={() => del(h.id)}
                                    className="px-3 py-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {(!slots[jour] || slots[jour].length === 0) && (
                            <div className="text-center py-6 text-white/10 text-sm">No trips</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {form && (
            <Modal
              onClose={() => setForm(null)}
              title={form._mode === "add" ? "New Schedule" : "Edit Schedule"}
            >
              <div className="space-y-5">
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Line</label>
                  <select
                    value={form.ligneId}
                    onChange={(e) => setForm(f => ({ ...f, ligneId: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-indigo-400/50 outline-none"
                  >
                    <option value="">Select a line...</option>
                    {lignes.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.code} — {l.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Day</label>
                    <select
                      value={form.jourSemaine}
                      onChange={(e) => setForm(f => ({ ...f, jourSemaine: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-indigo-400/50 outline-none"
                    >
                      {JOURS.map((j) => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Direction</label>
                    <select
                      value={form.sens}
                      onChange={(e) => setForm(f => ({ ...f, sens: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-indigo-400/50 outline-none"
                    >
                      <option value="ALLER">Go →</option>
                      <option value="RETOUR">Return ←</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Departure Time</label>
                    <input
                      type="time"
                      value={form.heureDepart ?? ""}
                      onChange={(e) => setForm(f => ({ ...f, heureDepart: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-indigo-400/50 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Arrival Time</label>
                    <input
                      type="time"
                      value={form.heureArrivee ?? ""}
                      onChange={(e) => setForm(f => ({ ...f, heureArrivee: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-indigo-400/50 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, actif: !f.actif }))}
                    className={`w-11 h-6 rounded-full relative transition-all ${form.actif ? "bg-indigo-500" : "bg-white/20"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${form.actif ? "left-6" : "left-0.5"}`} />
                  </button>
                  <span className="text-white/70">{form.actif ? "Active" : "Inactive"}</span>
                </div>
              </div>

              <button
                onClick={save}
                disabled={saving || !form.ligneId || !form.heureDepart || !form.heureArrivee}
                className="w-full mt-8 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-2xl text-lg transition-all"
              >
                {saving ? "Saving..." : "Save Schedule"}
              </button>
            </Modal>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ====================== Modal Component ====================== */

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