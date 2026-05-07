import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const JOURS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const JOUR_SHORT = { Saturday:"Sat", Sunday:"Sun", Monday:"Mon", Tuesday:"Tue", Wednesday:"Wed", Thursday:"Thu" };

const SENS_COLORS = {
  ALLER:  { bg: "bg-indigo-500/10", text: "text-indigo-300", border: "border-indigo-500/20" },
  RETOUR: { bg: "bg-pink-500/10",   text: "text-pink-300",   border: "border-pink-500/20" },
};

const EMPTY = { ligneId: "", jourSemaine: "Monday", heureDepart: "", heureArrivee: "", sens: "Go", actif: true };

export default function AdminHoraires() {
  const [horaires, setHoraires]   = useState([]);
  const [lignes, setLignes]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [ligneFilter, setLigneFilter] = useState("");
  const [jourFilter, setJourFilter]   = useState("");
  const [form, setForm]           = useState(null);
  const [saving, setSaving]       = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, lRes] = await Promise.all([
        api.get("/horaires", { params: { ligneId: ligneFilter || undefined, jour: jourFilter || undefined } }),
        api.get("/lignes"),
      ]);
      setHoraires(hRes.data.data);
      setLignes(lRes.data.data);
    } finally { setLoading(false); }
  }, [ligneFilter, jourFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd  = () => setForm({ ...EMPTY, _mode: "add" });
  const openEdit = (h) => setForm({
    ...h,
    ligneId: h.ligneId,
    heureDepart:  h.heureDepart?.slice(11, 16) || "",
    heureArrivee: h.heureArrivee?.slice(11, 16) || "",
    _mode: "edit",
  });

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { _mode, ligne, trajets, ...body } = form;
      // Build full datetime strings for Time fields (Prisma @db.Time needs a datetime string)
      const today = "1970-01-01";
      const payload = {
        ...body,
        ligneId:      parseInt(body.ligneId),
        heureDepart:  new Date(`${today}T${body.heureDepart}:00`),
        heureArrivee: new Date(`${today}T${body.heureArrivee}:00`),
        actif:        Boolean(body.actif),
      };
      if (_mode === "add") await api.post("/horaires", payload);
      else                 await api.put(`/horaires/${body.id}`, payload);
      setForm(null);
      fetchAll();
    } catch (e) { alert(e?.response?.data?.message || "Error"); }
    finally { setSaving(false); }
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

  // Group by ligne then by jour for the schedule grid view
  const grouped = {};
  for (const h of horaires) {
    const key = h.ligne?.code ?? "?";
    if (!grouped[key]) grouped[key] = { ligne: h.ligne, slots: {} };
    if (!grouped[key].slots[h.jourSemaine]) grouped[key].slots[h.jourSemaine] = [];
    grouped[key].slots[h.jourSemaine].push(h);
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">
      <AdminSidebar />
      <main className="ml-60 flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black">🕐 Timing</h1>
            <p className="text-white/35 text-sm mt-1">{horaires.length} schedules configured</p>
          </div>
          <button onClick={openAdd} className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-900/30">
            + New Schedule
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-8">
          <select value={ligneFilter} onChange={(e) => setLigneFilter(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 focus:border-indigo-400/50 outline-none">
            <option value="">All Lines</option>
            {lignes.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.nom}</option>)}
          </select>
          <select value={jourFilter} onChange={(e) => setJourFilter(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 focus:border-indigo-400/50 outline-none">
            <option value="">All Days</option>
            {JOURS.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-16 text-white/25">Loading...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-white/25">No schedules found</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([code, { ligne, slots }]) => (
              <motion.div key={code} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                {/* Ligne header */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-white/8 bg-white/[0.02]">
                  <span className="w-14 h-9 bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 rounded-xl text-sm font-black flex items-center justify-center">
                    {code}
                  </span>
                  <div>
                    <p className="font-bold text-white/80 text-sm">{ligne?.nom}</p>
                    <p className="text-white/30 text-xs">{ligne?.pointDepart} → {ligne?.pointArrivee}</p>
                  </div>
                </div>

                {/* Schedule grid */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5">
                        {JOURS.map((j) => (
                          <th key={j} className={`px-4 py-3 text-center font-bold tracking-widest uppercase ${slots[j]?.length ? "text-white/40" : "text-white/10"}`}>
                            {JOUR_SHORT[j]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {JOURS.map((jour) => (
                          <td key={jour} className="px-2 py-3 align-top border-r border-white/5 last:border-0 min-w-[110px]">
                            <div className="space-y-1.5">
                              {(slots[jour] || []).map((h) => {
                                const sens = SENS_COLORS[h.sens];
                                return (
                                  <div key={h.id} className={`group rounded-lg px-2.5 py-2 border ${sens.border} ${sens.bg} ${!h.actif ? "opacity-35" : ""} transition-all`}>
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`font-black text-sm ${sens.text}`}>{h.heureDepart?.slice(11, 16)}</span>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${sens.bg} ${sens.text} border ${sens.border}`}>{h.sens === "Go" ? "→" : "←"}</span>
                                    </div>
                                    <p className="text-white/25 text-[11px] mt-0.5">→ {h.heureArrivee?.slice(11, 16)}</p>
                                    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => openEdit(h)} className="flex-1 py-0.5 bg-white/10 hover:bg-white/20 rounded text-white/50 hover:text-white text-[10px] transition-all">✏️</button>
                                      <button onClick={() => toggleActif(h)} className={`flex-1 py-0.5 rounded text-[10px] transition-all ${h.actif ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                                        {h.actif ? "⏸" : "▶"}
                                      </button>
                                      <button onClick={() => del(h.id)} className="flex-1 py-0.5 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 text-[10px] transition-all">✕</button>
                                    </div>
                                  </div>
                                );
                              })}
                              {(!slots[jour] || slots[jour].length === 0) && (
                                <div className="text-white/8 text-center py-3">—</div>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        <AnimatePresence>
          {form && (
            <Modal onClose={() => setForm(null)} title={form._mode === "add" ? "New Schedule" : "Edit Schedule"}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Ligne</label>
                  <select value={form.ligneId} onChange={(e) => setForm(f => ({ ...f, ligneId: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-400/50 outline-none">
                    <option value="">Sélectionner une ligne...</option>
                    {lignes.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Jour</label>
                  <select value={form.jourSemaine} onChange={(e) => setForm(f => ({ ...f, jourSemaine: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-400/50 outline-none">
                    {JOURS.map((j) => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Sens</label>
                  <select value={form.sens} onChange={(e) => setForm(f => ({ ...f, sens: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-400/50 outline-none">
                    <option value="ALLER">Aller →</option>
                    <option value="RETOUR">Retour ←</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Heure départ</label>
                  <input type="time" value={form.heureDepart ?? ""} onChange={(e) => setForm(f => ({ ...f, heureDepart: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-400/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Heure arrivée</label>
                  <input type="time" value={form.heureArrivee ?? ""} onChange={(e) => setForm(f => ({ ...f, heureArrivee: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-400/50 outline-none" />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <button type="button" onClick={() => setForm(f => ({ ...f, actif: !f.actif }))}
                    className={`w-10 h-6 rounded-full transition-all relative ${form.actif ? "bg-indigo-500" : "bg-white/10"}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.actif ? "left-5" : "left-1"}`} />
                  </button>
                  <span className="text-sm text-white/50">{form.actif ? "Actif" : "Inactif"}</span>
                </div>
              </div>
              <button onClick={save} disabled={saving || !form.ligneId || !form.heureDepart || !form.heureArrivee}
                className="w-full mt-6 py-3.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white font-bold rounded-xl transition-all">
                {saving ? "Saving..." : "Save"}
              </button>
            </Modal>
          )}
        </AnimatePresence>
      </main>
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