import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, fmt } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const STATUT_COLORS = {
  ACTIF:    { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Active" },
  SUSPENDU: { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20",   label: "Suspended" },
  EXPIRE:   { bg: "bg-white/5",        text: "text-white/30",    border: "border-white/10",        label: "Expired" },
};

export default function AdminAbonnements() {
  const [abonnements, setAbonnements] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [ligneFilter, setLigneFilter] = useState("");
  const [lignes, setLignes]           = useState([]);

  // New subscription form
  const [newForm, setNewForm]         = useState({ etudiantId: "", ligneId: "", dateDebut: "" });
  const [saving, setSaving]           = useState(false);

  // Change line form
  const [changeForm, setChangeForm]   = useState(null);
  const [changeSaving, setChangeSaving] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [abRes, ligneRes] = await Promise.all([
        api.get("/abonnements", { params: { ligneId: ligneFilter || undefined } }),
        api.get("/lignes"),
      ]);
      setAbonnements(abRes.data.data);
      setLignes(ligneRes.data.data);
    } finally {
      setLoading(false);
    }
  }, [ligneFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const subscribe = async () => {
    if (saving || !newForm.etudiantId || !newForm.ligneId || !newForm.dateDebut) return;
    setSaving(true);
    try {
      await api.post("/abonnements", {
        etudiantId: parseInt(newForm.etudiantId),
        ligneId: parseInt(newForm.ligneId),
        dateDebut: newForm.dateDebut,
      });
      setNewForm({ etudiantId: "", ligneId: "", dateDebut: "" });
      fetchAll();
    } catch (e) {
      alert(e?.response?.data?.message || "Error creating subscription");
    } finally {
      setSaving(false);
    }
  };

  const resilier = async (etudiantId) => {
    if (!confirm("Cancel this subscription?")) return;
    await api.delete(`/abonnements/${etudiantId}`);
    fetchAll();
  };

  const openChangeLigne = (a) => {
    setChangeForm({
      etudiantId: a.etudiantId,
      nouvelleLigneId: "",
      motif: "",
      nom: `${a.etudiant?.nom} ${a.etudiant?.prenom}`
    });
  };

  const changerLigne = async () => {
    if (changeSaving || !changeForm.nouvelleLigneId) return;
    setChangeSaving(true);
    try {
      await api.patch(`/abonnements/${changeForm.etudiantId}/changer-ligne`, {
        nouvelleLigneId: parseInt(changeForm.nouvelleLigneId),
        motif: changeForm.motif || "Line Change",
        dateChangement: new Date().toISOString(),
      });
      setChangeForm(null);
      fetchAll();
    } catch (e) {
      alert(e?.response?.data?.message || "Error changing line");
    } finally {
      setChangeSaving(false);
    }
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
          <span className="text-xl">🔑</span>
          <span className="font-black text-lg">Subscriptions</span>
        </div>
        <div></div>
      </div>

      <main className="flex-1 md:ml-60 p-4 md:p-8 pt-20 md:pt-8">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">🔑 Subscriptions</h1>
            <p className="text-white/40 text-sm mt-1">{abonnements.length} active subscriptions</p>
          </div>
        </div>

        {/* New Subscription Panel */}
        <div className="bg-white/[0.03] border border-pink-500/20 rounded-3xl p-5 md:p-6 mb-8">
          <h2 className="text-sm font-bold text-pink-300 mb-4">➕ New Subscription</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Student ID</label>
              <input
                type="number"
                value={newForm.etudiantId}
                onChange={(e) => setNewForm(f => ({ ...f, etudiantId: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-pink-400/50 outline-none"
                placeholder="e.g. 12345"
              />
            </div>
            <div>
              <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Line</label>
              <select
                value={newForm.ligneId}
                onChange={(e) => setNewForm(f => ({ ...f, ligneId: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-pink-400/50 outline-none"
              >
                <option value="">Select Line...</option>
                {lignes.map((l) => (
                  <option key={l.id} value={l.id}>{l.code} — {l.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Start Date</label>
              <input
                type="date"
                value={newForm.dateDebut}
                onChange={(e) => setNewForm(f => ({ ...f, dateDebut: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-pink-400/50 outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={subscribe}
                disabled={saving || !newForm.etudiantId || !newForm.ligneId || !newForm.dateDebut}
                className="w-full py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 text-white font-bold rounded-2xl transition-all"
              >
                {saving ? "Processing..." : "Subscribe"}
              </button>
            </div>
          </div>
        </div>

        {/* Filter */}
        <select
          value={ligneFilter}
          onChange={(e) => setLigneFilter(e.target.value)}
          className="w-full md:w-auto px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-pink-400/50 outline-none mb-6"
        >
          <option value="">All Lines</option>
          {lignes.map((l) => (
            <option key={l.id} value={l.id}>{l.code} — {l.nom}</option>
          ))}
        </select>

        {loading ? (
          <div className="text-center py-20 text-white/30">Loading subscriptions...</div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {abonnements.map((a) => {
                const statut = STATUT_COLORS[a.statut];
                return (
                  <div key={a.id} className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-bold text-lg">{a.etudiant?.nom} {a.etudiant?.prenom}</p>
                        <p className="text-violet-300 font-mono text-sm">{a.etudiant?.matricule}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full ${statut.bg} ${statut.text} ${statut.border}`}>
                        {statut.label}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full text-sm font-medium">
                        {a.ligne?.code}
                      </span>
                      <span className="text-white/40 text-sm">{a.ligne?.nom}</span>
                    </div>

                    <p className="text-white/40 text-sm mt-3">
                      Since {a.dateDebut?.split("T")[0]}
                    </p>

                    <div className="flex gap-2 mt-5">
                      <button
                        onClick={() => openChangeLigne(a)}
                        className="flex-1 py-3 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-2xl text-sm font-medium text-pink-400 transition-all"
                      >
                        Change Line
                      </button>
                      <button
                        onClick={() => resilier(a.etudiantId)}
                        className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-sm font-medium text-red-400 transition-all"
                      >
                        Cancel
                      </button>
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
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Student</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Matricule</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Line</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Start Date</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {abonnements.map((a) => {
                    const statut = STATUT_COLORS[a.statut];
                    return (
                      <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold">{a.etudiant?.nom} {a.etudiant?.prenom}</p>
                          <p className="text-white/40 text-xs">{a.etudiant?.faculte}</p>
                        </td>
                        <td className="px-6 py-4 text-violet-300 font-mono">{a.etudiant?.matricule}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full text-xs font-medium">
                            {a.ligne?.code}
                          </span>
                          <p className="text-white/40 text-xs mt-1">{a.ligne?.nom}</p>
                        </td>
                        <td className="px-6 py-4 text-white/40 font-mono text-sm">
                          {a.dateDebut?.split("T")[0]}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statut.bg} ${statut.text} ${statut.border}`}>
                            {statut.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openChangeLigne(a)}
                              className="px-4 py-2 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-xl text-sm text-pink-400 transition-all"
                            >
                              Change Line
                            </button>
                            <button
                              onClick={() => resilier(a.etudiantId)}
                              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-sm text-red-400 transition-all"
                            >
                              Cancel
                            </button>
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

        {/* Change Line Modal */}
        <AnimatePresence>
          {changeForm && (
            <Modal onClose={() => setChangeForm(null)} title={`Change Line — ${changeForm.nom}`}>
              <div className="space-y-5">
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">New Line</label>
                  <select
                    value={changeForm.nouvelleLigneId}
                    onChange={(e) => setChangeForm(f => ({ ...f, nouvelleLigneId: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-pink-400/50 outline-none"
                  >
                    <option value="">Select new line...</option>
                    {lignes.map((l) => (
                      <option key={l.id} value={l.id}>{l.code} — {l.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Reason (optional)</label>
                  <input
                    type="text"
                    value={changeForm.motif}
                    onChange={(e) => setChangeForm(f => ({ ...f, motif: e.target.value }))}
                    placeholder="e.g. Moving, Change of major..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-pink-400/50 outline-none placeholder:text-white/30"
                  />
                </div>
              </div>

              <button
                onClick={changerLigne}
                disabled={changeSaving || !changeForm.nouvelleLigneId}
                className="w-full mt-8 py-4 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-bold rounded-2xl text-lg transition-all"
              >
                {changeSaving ? "Processing..." : "Confirm Line Change"}
              </button>
            </Modal>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ====================== Modal ====================== */

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