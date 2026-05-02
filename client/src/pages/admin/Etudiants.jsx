import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, fmt } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const EMPTY = { matricule:"", nom:"", prenom:"", email:"", telephone:"", dateNaissance:"", adresse:"", faculte:"", departement:"", anneeEtude:1 };

export default function AdminEtudiants() {
  const [etudiants, setEtudiants] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState(null);   // detail modal
  const [form, setForm]           = useState(null);   // add/edit modal
  const [saving, setSaving]       = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/etudiants", { params: { search, page, limit: 15 } });
      setEtudiants(r.data.data);
      setPagination(r.data.pagination);
    } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd  = () => setForm({ ...EMPTY, _mode: "add" });
  const openEdit = (e) => setForm({ ...e, dateNaissance: e.dateNaissance?.split("T")[0], _mode: "edit" });

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { _mode, ...body } = form;
      if (_mode === "add") await api.post("/etudiants", body);
      else                 await api.put(`/etudiants/${body.id}`, body);
      setForm(null);
      fetch();
    } catch (e) { alert(e?.response?.data?.message || "Erreur"); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm("Supprimer cet étudiant ?")) return;
    await api.delete(`/etudiants/${id}`);
    fetch();
  };

  const openDetail = async (e) => {
    const r = await api.get(`/etudiants/${e.id}`);
    setSelected(r.data.data);
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">
      <AdminSidebar />
      <main className="ml-60 flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black">🎓 Étudiants</h1>
            <p className="text-white/35 text-sm mt-1">{pagination.total ?? "—"} inscrits</p>
          </div>
          <button onClick={openAdd} className="px-5 py-2.5 bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-violet-900/30">
            + Nouvel étudiant
          </button>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Rechercher par nom, email, matricule..."
          className="w-full max-w-sm px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-white/25 focus:border-violet-400/50 outline-none mb-6"
        />

        {/* Table */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {["Matricule", "Nom complet", "Email", "Faculté", "Abonnement", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-4 text-xs font-bold tracking-widest text-white/25 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-white/25">Chargement...</td></tr>
              ) : etudiants.map((e) => (
                <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-violet-300 font-mono text-xs">{e.matricule}</td>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-white/90">{e.nom} {e.prenom}</p>
                    <p className="text-white/30 text-xs">Année {e.anneeEtude}</p>
                  </td>
                  <td className="px-5 py-3 text-white/50 text-xs">{e.email}</td>
                  <td className="px-5 py-3 text-white/50 text-xs">{e.faculte}</td>
                  <td className="px-5 py-3">
                    {e.abonnementActif ? (
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
                        {e.abonnementActif.ligne?.code}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs">Sans</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openDetail(e)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-all">Voir</button>
                      <button onClick={() => openEdit(e)}   className="px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-lg text-xs text-violet-400 transition-all">Modifier</button>
                      <button onClick={() => del(e.id)}     className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs text-red-400 transition-all">Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex gap-2 mt-6 justify-center">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-xl text-sm font-bold border transition-all ${page === p ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"}`}>
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {selected && (
            <Modal onClose={() => setSelected(null)} title={`${selected.nom} ${selected.prenom}`}>
              <Row label="Matricule"  val={selected.matricule} />
              <Row label="Email"      val={selected.email} />
              <Row label="Téléphone"  val={selected.telephone} />
              <Row label="Faculté"    val={selected.faculte} />
              <Row label="Département" val={selected.departement} />
              <Row label="Année"      val={selected.anneeEtude} />
              <Row label="Naissance"  val={fmt.date(selected.dateNaissance)} />
              <Row label="Adresse"    val={selected.adresse} />

              {selected.abonnementActif && (
                <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Abonnement actif</p>
                  <p className="text-emerald-400 font-bold">{selected.abonnementActif.ligne?.code} — {selected.abonnementActif.ligne?.nom}</p>
                  <p className="text-white/30 text-xs">Depuis {fmt.date(selected.abonnementActif.dateDebut)}</p>
                </div>
              )}

              {selected.historiqueAbonnements?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-white/25 uppercase tracking-widest mb-2">Historique des lignes</p>
                  {selected.historiqueAbonnements.map((h) => (
                    <div key={h.id} className="flex items-center justify-between py-2 border-b border-white/5 text-xs text-white/50">
                      <span>{h.ligne?.code} — {h.ligne?.nom}</span>
                      <span>{fmt.date(h.dateDebut)} → {fmt.date(h.dateFin)}</span>
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
            <Modal onClose={() => setForm(null)} title={form._mode === "add" ? "Nouvel étudiant" : "Modifier l'étudiant"}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Matricule",   "matricule",   "text"],
                  ["Nom",         "nom",          "text"],
                  ["Prénom",      "prenom",       "text"],
                  ["Email",       "email",        "email"],
                  ["Téléphone",   "telephone",    "text"],
                  ["Naissance",   "dateNaissance","date"],
                  ["Faculté",     "faculte",      "text"],
                  ["Département", "departement",  "text"],
                  ["Année étude", "anneeEtude",   "number"],
                ].map(([label, key, type]) => (
                  <div key={key} className={key === "adresse" ? "col-span-2" : ""}>
                    <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">{label}</label>
                    <input
                      type={type}
                      value={form[key] ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-violet-400/50 outline-none"
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Adresse</label>
                  <textarea
                    value={form.adresse ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-violet-400/50 outline-none resize-none"
                  />
                </div>
              </div>
              <button onClick={save} disabled={saving} className="w-full mt-6 py-3.5 bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white font-bold rounded-xl transition-all">
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
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-7 py-5 border-b border-white/10">
          <h2 className="font-black text-lg">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all flex items-center justify-center">×</button>
        </div>
        <div className="overflow-y-auto flex-1 px-7 py-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}