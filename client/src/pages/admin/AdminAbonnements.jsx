import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, fmt } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const STATUT_COLORS = {
  ACTIF:    { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Actif" },
  SUSPENDU: { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20",   label: "Suspendu" },
  EXPIRE:   { bg: "bg-white/5",         text: "text-white/30",    border: "border-white/10",        label: "Expiré" },
};

export default function AdminAbonnements() {
  const [abonnements, setAbonnements] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [ligneFilter, setLigneFilter] = useState("");
  const [lignes, setLignes]         = useState([]);

  // New subscription form
  const [newForm, setNewForm]       = useState({ etudiantId: "", ligneId: "", dateDebut: "" });
  const [saving, setSaving]         = useState(false);

  // Change line form
  const [changeForm, setChangeForm] = useState(null); // { etudiantId, nouvelleLigneId, motif }
  const [changeSaving, setChangeSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [abRes, ligneRes] = await Promise.all([
        api.get("/abonnements", { params: { ligneId: ligneFilter || undefined } }),
        api.get("/lignes"),
      ]);
      setAbonnements(abRes.data.data);
      setLignes(ligneRes.data.data);
    } finally { setLoading(false); }
  }, [ligneFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const subscribe = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await api.post("/abonnements", {
        etudiantId: parseInt(newForm.etudiantId),
        ligneId:    parseInt(newForm.ligneId),
        dateDebut:  newForm.dateDebut,
      });
      setNewForm({ etudiantId: "", ligneId: "", dateDebut: "" });
      fetchAll();
    } catch (e) { alert(e?.response?.data?.message || "Erreur"); }
    finally { setSaving(false); }
  };

  const resilier = async (etudiantId) => {
    if (!confirm("Résilier cet abonnement ?")) return;
    await api.delete(`/abonnements/${etudiantId}`);
    fetchAll();
  };

  const openChangeLigne = (a) => {
    setChangeForm({ etudiantId: a.etudiantId, nouvelleLigneId: "", motif: "", nom: `${a.etudiant?.nom} ${a.etudiant?.prenom}` });
  };

  const changerLigne = async () => {
    if (changeSaving) return;
    setChangeSaving(true);
    try {
      await api.patch(`/abonnements/${changeForm.etudiantId}/changer-ligne`, {
        nouvelleLigneId: parseInt(changeForm.nouvelleLigneId),
        motif:           changeForm.motif || "Changement de ligne",
        dateChangement:  new Date().toISOString(),
      });
      setChangeForm(null);
      fetchAll();
    } catch (e) { alert(e?.response?.data?.message || "Erreur"); }
    finally { setChangeSaving(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">
      <AdminSidebar />
      <main className="ml-60 flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black">🔑 Abonnements</h1>
            <p className="text-white/35 text-sm mt-1">{abonnements.length} abonnements actifs</p>
          </div>
        </div>

        {/* New subscription quick panel */}
        <div className="bg-white/[0.03] border border-pink-500/20 rounded-2xl p-6 mb-8">
          <h2 className="text-sm font-bold text-pink-300 mb-4">➕ Nouvel abonnement</h2>
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-white/25 uppercase tracking-widest mb-1 block">ID Étudiant</label>
              <input type="number" value={newForm.etudiantId} onChange={(e) => setNewForm(f => ({ ...f, etudiantId: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-pink-400/50 outline-none" />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-white/25 uppercase tracking-widest mb-1 block">Ligne</label>
              <select value={newForm.ligneId} onChange={(e) => setNewForm(f => ({ ...f, ligneId: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-pink-400/50 outline-none">
                <option value="">Sélectionner...</option>
                {lignes.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.nom}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-white/25 uppercase tracking-widest mb-1 block">Date début</label>
              <input type="date" value={newForm.dateDebut} onChange={(e) => setNewForm(f => ({ ...f, dateDebut: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-pink-400/50 outline-none" />
            </div>
            <div className="flex items-end">
              <button onClick={subscribe} disabled={saving || !newForm.etudiantId || !newForm.ligneId || !newForm.dateDebut}
                className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-30 text-white font-bold rounded-xl text-sm transition-all">
                {saving ? "..." : "Abonner"}
              </button>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-3 mb-6">
          <select value={ligneFilter} onChange={(e) => setLigneFilter(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 focus:border-pink-400/50 outline-none">
            <option value="">Toutes les lignes</option>
            {lignes.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.nom}</option>)}
          </select>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {["Étudiant", "Matricule", "Ligne", "Depuis", "Statut", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-4 text-xs font-bold tracking-widest text-white/25 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-white/25">Chargement...</td></tr>
              ) : abonnements.map((a) => {
                const statut = STATUT_COLORS[a.statut];
                return (
                  <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-white/90">{a.etudiant?.nom} {a.etudiant?.prenom}</p>
                      <p className="text-white/25 text-xs">{a.etudiant?.faculte}</p>
                    </td>
                    <td className="px-5 py-3 text-violet-300 font-mono text-xs">{a.etudiant?.matricule}</td>
                    <td className="px-5 py-3">
                      <div>
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full text-xs font-bold">{a.ligne?.code}</span>
                        <p className="text-white/30 text-xs mt-1 truncate max-w-[160px]">{a.ligne?.nom}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-white/40 text-xs font-mono">{a.dateDebut?.split("T")[0]}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 ${statut.bg} ${statut.text} border ${statut.border} rounded-full text-xs font-semibold`}>
                        {statut.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openChangeLigne(a)} className="px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-lg text-xs text-pink-400 transition-all whitespace-nowrap">Changer ligne</button>
                        <button onClick={() => resilier(a.etudiantId)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs text-red-400 transition-all">Résilier</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Change Ligne Modal */}
        <AnimatePresence>
          {changeForm && (
            <Modal onClose={() => setChangeForm(null)} title={`Changer la ligne — ${changeForm.nom}`}>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Nouvelle ligne</label>
                  <select value={changeForm.nouvelleLigneId} onChange={(e) => setChangeForm(f => ({ ...f, nouvelleLigneId: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-pink-400/50 outline-none">
                    <option value="">Sélectionner...</option>
                    {lignes.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Motif</label>
                  <input type="text" value={changeForm.motif} onChange={(e) => setChangeForm(f => ({ ...f, motif: e.target.value }))}
                    placeholder="ex: Déménagement, Changement de filière..."
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-pink-400/50 outline-none placeholder:text-white/20" />
                </div>
              </div>
              <button onClick={changerLigne} disabled={changeSaving || !changeForm.nouvelleLigneId}
                className="w-full mt-6 py-3.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 text-white font-bold rounded-xl transition-all">
                {changeSaving ? "Changement..." : "Confirmer le changement"}
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