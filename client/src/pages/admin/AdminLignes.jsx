import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const STATUT_COLORS = {
  ACTIVE:    { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Active" },
  SUSPENDUE: { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20",   label: "Suspendue" },
  SUPPRIMEE: { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/20",     label: "Supprimée" },
};

const EMPTY = { code: "", nom: "", description: "", pointDepart: "", pointArrivee: "", distanceKm: "", dureeEstimeeMin: "", statut: "ACTIVE" };

export default function AdminLignes() {
  const [lignes, setLignes]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState(null);
  const [saving, setSaving]       = useState(false);

  const fetchLignes = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/lignes", { params: { search: search || undefined } });
      setLignes(r.data.data);
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchLignes(); }, [fetchLignes]);

  const openAdd  = () => setForm({ ...EMPTY, _mode: "add" });
  const openEdit = (l) => setForm({ ...l, distanceKm: l.distanceKm ?? "", dureeEstimeeMin: l.dureeEstimeeMin ?? "", _mode: "edit" });

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { _mode, ligneStations, horaires, affectationsBus, abonnements, trajets, _count, ...body } = form;
      const payload = {
        ...body,
        distanceKm:      body.distanceKm ? parseFloat(body.distanceKm) : null,
        dureeEstimeeMin: body.dureeEstimeeMin ? parseInt(body.dureeEstimeeMin) : null,
      };
      if (_mode === "add") await api.post("/lignes", payload);
      else                 await api.put(`/lignes/${body.id}`, payload);
      setForm(null);
      fetchLignes();
    } catch (e) { alert(e?.response?.data?.message || "Erreur"); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm("Supprimer cette ligne ?")) return;
    await api.delete(`/lignes/${id}`);
    fetchLignes();
  };

  const openDetail = async (l) => {
    const r = await api.get(`/lignes/${l.id}`);
    setSelected(r.data.data);
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">
      <AdminSidebar />
      <main className="ml-60 flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black">🗺️ Lignes</h1>
            <p className="text-white/35 text-sm mt-1">{lignes.length} lignes configurées</p>
          </div>
          <button onClick={openAdd} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-900/30">
            + Nouvelle ligne
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par code, nom..."
          className="w-full max-w-sm px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-white/25 focus:border-emerald-400/50 outline-none mb-6"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 text-center py-12 text-white/25">Chargement...</div>
          ) : lignes.map((l) => {
            const statut = STATUT_COLORS[l.statut];
            return (
              <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-10 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 rounded-xl text-sm font-black flex items-center justify-center">
                      {l.code}
                    </span>
                    <div>
                      <p className="font-bold text-white/90 text-sm leading-tight">{l.nom}</p>
                      <span className={`text-xs px-2 py-0.5 ${statut.bg} ${statut.text} border ${statut.border} rounded-full`}>{statut.label}</span>
                    </div>
                  </div>
                  <span className="text-xs text-white/30 font-bold">{l._count?.abonnements ?? 0} abonnés</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-white/30 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500/60 flex-shrink-0" />
                  <span className="truncate">{l.pointDepart}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/30 mb-4">
                  <span className="w-2 h-2 rounded-full bg-red-400/60 flex-shrink-0" />
                  <span className="truncate">{l.pointArrivee}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-white/20 mb-4">
                  {l.distanceKm && <span>{l.distanceKm} km</span>}
                  {l.distanceKm && l.dureeEstimeeMin && <span>·</span>}
                  {l.dureeEstimeeMin && <span>{l.dureeEstimeeMin} min</span>}
                  {l.ligneStations?.length > 0 && <><span>·</span><span>{l.ligneStations.length} stations</span></>}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => openDetail(l)} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-all">Voir</button>
                  <button onClick={() => openEdit(l)}   className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 transition-all">Modifier</button>
                  <button onClick={() => del(l.id)}     className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs text-red-400 transition-all">✕</button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
          {selected && (
            <Modal onClose={() => setSelected(null)} title={`${selected.code} — ${selected.nom}`}>
              <Row label="Départ"      val={selected.pointDepart} />
              <Row label="Arrivée"     val={selected.pointArrivee} />
              <Row label="Distance"    val={selected.distanceKm ? `${selected.distanceKm} km` : null} />
              <Row label="Durée"       val={selected.dureeEstimeeMin ? `${selected.dureeEstimeeMin} min` : null} />
              <Row label="Statut"      val={STATUT_COLORS[selected.statut]?.label} />
              {selected.description && <Row label="Description" val={selected.description} />}

              {selected.ligneStations?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-white/25 uppercase tracking-widest mb-2">Stations ({selected.ligneStations.length})</p>
                  {selected.ligneStations.map((ls) => (
                    <div key={ls.id} className="flex items-center gap-3 py-2 border-b border-white/5 text-xs text-white/50">
                      <span className="w-5 h-5 rounded-full bg-white/5 text-white/30 flex items-center justify-center text-[10px]">{ls.ordreArret}</span>
                      <span>{ls.station?.nom}</span>
                      {ls.dureeDepuisDepart && <span className="ml-auto text-white/25">{ls.dureeDepuisDepart} min</span>}
                    </div>
                  ))}
                </div>
              )}

              {selected.horaires?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-white/25 uppercase tracking-widest mb-2">Horaires</p>
                  {selected.horaires.map((h) => (
                    <div key={h.id} className="flex items-center justify-between py-2 border-b border-white/5 text-xs text-white/50">
                      <span>{h.jourSemaine}</span>
                      <span>{h.heureDepart?.slice(11, 16)} → {h.heureArrivee?.slice(11, 16)}</span>
                      <span className="text-white/25">{h.sens}</span>
                    </div>
                  ))}
                </div>
              )}
            </Modal>
          )}
        </AnimatePresence>

        {/* Form Modal */}
        <AnimatePresence>
          {form && (
            <Modal onClose={() => setForm(null)} title={form._mode === "add" ? "Nouvelle ligne" : "Modifier la ligne"}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Code",           "code",           "text"],
                  ["Nom",            "nom",            "text"],
                  ["Point de départ","pointDepart",    "text"],
                  ["Point d'arrivée","pointArrivee",   "text"],
                  ["Distance (km)",  "distanceKm",     "number"],
                  ["Durée (min)",    "dureeEstimeeMin","number"],
                ].map(([label, key, type]) => (
                  <div key={key} className={key === "nom" || key === "pointDepart" || key === "pointArrivee" ? "col-span-2" : ""}>
                    <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">{label}</label>
                    <input type={type} value={form[key] ?? ""} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-emerald-400/50 outline-none" />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Statut</label>
                  <select value={form.statut} onChange={(e) => setForm(f => ({ ...f, statut: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-emerald-400/50 outline-none">
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDUE">Suspendue</option>
                    <option value="SUPPRIMEE">Supprimée</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Description</label>
                  <textarea value={form.description ?? ""} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-emerald-400/50 outline-none resize-none" />
                </div>
              </div>
              <button onClick={save} disabled={saving} className="w-full mt-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold rounded-xl transition-all">
                {saving ? "Enregistrement..." : "Enregistrer"}
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