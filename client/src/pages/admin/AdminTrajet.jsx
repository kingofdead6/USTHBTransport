import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const STATUT_COLORS = {
  PLANIFIE:  { bg: "bg-sky-500/10",     text: "text-sky-400",     border: "border-sky-500/20",     label: "Planifié" },
  EN_COURS:  { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20",   label: "En cours" },
  TERMINE:   { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Terminé" },
  ANNULE:    { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/20",     label: "Annulé" },
};

const EMPTY_TRAJET = { busId: "", ligneId: "", horaireId: "", dateTrajet: "", retardMinutes: 0, statut: "PLANIFIE", nbPassagers: "" };

export default function AdminTrajets() {
  const [trajets, setTrajets]       = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);
  const [statutFilter, setStatutFilter] = useState("");
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState(null);
  const [saving, setSaving]         = useState(false);
  const [buses, setBuses]           = useState([]);
  const [lignes, setLignes]         = useState([]);
  const [horaires, setHoraires]     = useState([]);

  const fetchTrajets = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/trajets", { params: { page, limit: 15, statut: statutFilter || undefined } });
      setTrajets(r.data.data);
      setPagination(r.data.pagination);
    } finally { setLoading(false); }
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
        busId:         parseInt(body.busId),
        ligneId:       parseInt(body.ligneId),
        horaireId:     parseInt(body.horaireId),
        retardMinutes: parseInt(body.retardMinutes) || 0,
        nbPassagers:   body.nbPassagers ? parseInt(body.nbPassagers) : null,
        dateTrajet:    new Date(body.dateTrajet),
      };
      if (_mode === "add") await api.post("/trajets", payload);
      else                 await api.put(`/trajets/${body.id}`, payload);
      setForm(null);
      fetchTrajets();
    } catch (e) { alert(e?.response?.data?.message || "Erreur"); }
    finally { setSaving(false); }
  };

  const openDetail = async (t) => {
    const r = await api.get(`/trajets/${t.id}`);
    setSelected(r.data.data);
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">
      <AdminSidebar />
      <main className="ml-60 flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black">🛣️ Trajets</h1>
            <p className="text-white/35 text-sm mt-1">{pagination.total ?? "—"} trajets enregistrés</p>
          </div>
          <button onClick={openAdd} className="px-5 py-2.5 bg-lime-500 hover:bg-lime-600 text-black font-bold rounded-xl text-sm transition-all shadow-lg shadow-lime-900/30">
            + Nouveau trajet
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <select value={statutFilter} onChange={(e) => { setStatutFilter(e.target.value); setPage(1); }}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 focus:border-lime-400/50 outline-none">
            <option value="">Tous les statuts</option>
            <option value="PLANIFIE">Planifié</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINE">Terminé</option>
            <option value="ANNULE">Annulé</option>
          </select>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {["Date", "Ligne", "Bus", "Retard", "Passagers", "Statut", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-4 text-xs font-bold tracking-widest text-white/25 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-white/25">Chargement...</td></tr>
              ) : trajets.map((t) => {
                const statut = STATUT_COLORS[t.statut];
                return (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-white/60 text-xs font-mono">{t.dateTrajet?.split("T")[0]}</td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full text-xs font-bold">
                        {t.ligne?.code}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-amber-300 text-xs font-mono">{t.bus?.immatriculation}</td>
                    <td className="px-5 py-3">
                      {t.retardMinutes > 0 ? (
                        <span className="text-red-400 text-xs font-bold">+{t.retardMinutes} min</span>
                      ) : (
                        <span className="text-white/25 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-white/50 text-xs">{t.nbPassagers ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 ${statut.bg} ${statut.text} border ${statut.border} rounded-full text-xs font-semibold`}>
                        {statut.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => openDetail(t)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-all">Voir</button>
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
            <Modal onClose={() => setSelected(null)} title={`Trajet #${selected.id}`}>
              <Row label="Date"       val={selected.dateTrajet?.split("T")[0]} />
              <Row label="Ligne"      val={`${selected.ligne?.code} — ${selected.ligne?.nom}`} />
              <Row label="Bus"        val={`${selected.bus?.immatriculation} (${selected.bus?.marque})`} />
              <Row label="Retard"     val={selected.retardMinutes > 0 ? `+${selected.retardMinutes} min` : "Aucun"} />
              <Row label="Passagers"  val={selected.nbPassagers} />
              <Row label="Statut"     val={STATUT_COLORS[selected.statut]?.label} />

              {selected.arretsTrajet?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-white/25 uppercase tracking-widest mb-2">Arrêts</p>
                  {selected.arretsTrajet.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 py-2 border-b border-white/5 text-xs text-white/50">
                      <span className="w-5 h-5 rounded-full bg-white/5 text-white/30 flex items-center justify-center text-[10px]">{a.ordreArret}</span>
                      <span className="flex-1">{a.station?.nom}</span>
                      <span className="text-white/25">{a.heurePrevue?.slice(11, 16)}</span>
                      {a.retardMinutes > 0 && <span className="text-red-400">+{a.retardMinutes}'</span>}
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
            <Modal onClose={() => setForm(null)} title="Nouveau trajet">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Bus</label>
                  <select value={form.busId} onChange={(e) => setForm(f => ({ ...f, busId: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-lime-400/50 outline-none">
                    <option value="">Sélectionner...</option>
                    {buses.map((b) => <option key={b.id} value={b.id}>{b.immatriculation} ({b.marque})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Ligne</label>
                  <select value={form.ligneId} onChange={(e) => onLigneChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-lime-400/50 outline-none">
                    <option value="">Sélectionner...</option>
                    {lignes.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Horaire</label>
                  <select value={form.horaireId} onChange={(e) => setForm(f => ({ ...f, horaireId: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-lime-400/50 outline-none"
                    disabled={!form.ligneId}>
                    <option value="">Sélectionner...</option>
                    {horaires.map((h) => <option key={h.id} value={h.id}>{h.jourSemaine} {h.heureDepart?.slice(11, 16)} ({h.sens})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Date</label>
                  <input type="date" value={form.dateTrajet ?? ""} onChange={(e) => setForm(f => ({ ...f, dateTrajet: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-lime-400/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Retard (min)</label>
                  <input type="number" value={form.retardMinutes ?? 0} onChange={(e) => setForm(f => ({ ...f, retardMinutes: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-lime-400/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Passagers</label>
                  <input type="number" value={form.nbPassagers ?? ""} onChange={(e) => setForm(f => ({ ...f, nbPassagers: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-lime-400/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Statut</label>
                  <select value={form.statut} onChange={(e) => setForm(f => ({ ...f, statut: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-lime-400/50 outline-none">
                    <option value="PLANIFIE">Planifié</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="TERMINE">Terminé</option>
                    <option value="ANNULE">Annulé</option>
                  </select>
                </div>
              </div>
              <button onClick={save} disabled={saving} className="w-full mt-6 py-3.5 bg-lime-500 hover:bg-lime-600 disabled:opacity-40 text-black font-bold rounded-xl transition-all">
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
  if (val === null || val === undefined || val === "") return null;
  return (
    <div className="flex items-start gap-4 mb-2">
      <span className="text-xs text-white/25 w-28 flex-shrink-0">{label}</span>
      <span className="text-sm text-white/60">{String(val)}</span>
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