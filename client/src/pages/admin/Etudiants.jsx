import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, fmt } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const EMPTY = {
  matricule: "",
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  dateNaissance: "",
  adresse: "",
  faculte: "",
  departement: "",
  anneeEtude: 1,
};

export default function AdminEtudiants() {
  const [etudiants, setEtudiants] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/etudiants", { params: { search, page, limit: 15 } });
      setEtudiants(r.data.data);
      setPagination(r.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => setForm({ ...EMPTY, _mode: "add" });
  const openEdit = (e) => setForm({
    ...e,
    dateNaissance: e.dateNaissance?.split("T")[0],
    _mode: "edit"
  });

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { _mode, ...body } = form;
      if (_mode === "add") await api.post("/etudiants", body);
      else await api.put(`/etudiants/${body.id}`, body);
      setForm(null);
      fetch();
    } catch (e) {
      alert(e?.response?.data?.message || "Error saving student");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this student?")) return;
    await api.delete(`/etudiants/${id}`);
    fetch();
  };

  const openDetail = async (e) => {
    const r = await api.get(`/etudiants/${e.id}`);
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
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm shadow-lg shadow-violet-900/50">🎓</span>
          <span className="font-black text-lg">Students</span>
        </div>
        <button
          onClick={openAdd}
          className="bg-violet-500 hover:bg-violet-600 px-4 py-2 rounded-xl text-sm font-bold transition-all"
        >
          + New
        </button>
      </div>

      <main className="flex-1 md:ml-60 p-4 md:p-8 pt-20 md:pt-8">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">🎓 Students</h1>
            <p className="text-white/40 text-sm mt-1">{pagination.total ?? "—"} registered</p>
          </div>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 bg-violet-500 hover:bg-violet-600 font-bold rounded-xl text-sm transition-all"
          >
            + New Student
          </button>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email or matricule..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm placeholder:text-white/30 focus:border-violet-400/50 outline-none mb-6"
        />

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20 text-white/30">Loading students...</div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {etudiants.map((e) => (
                <div key={e.id} className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-mono text-xs text-violet-300">{e.matricule}</p>
                      <p className="text-lg font-bold mt-1">{e.nom} {e.prenom}</p>
                      <p className="text-white/40 text-sm">{e.faculte} • Year {e.anneeEtude}</p>
                    </div>

                    {e.abonnementActif ? (
                      <span className="px-3 py-1 h-fit bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium">
                        {e.abonnementActif.ligne?.code}
                      </span>
                    ) : (
                      <span className="px-3 py-1 h-fit bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs">No Pass</span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-6">
                    <button
                      onClick={() => openDetail(e)}
                      className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-medium transition-all"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openEdit(e)}
                      className="py-3 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-2xl text-sm font-medium text-violet-400 transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => del(e.id)}
                      className="py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-sm font-medium text-red-400 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Matricule</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Full Name</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Email</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Faculty</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Subscription</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {etudiants.map((e) => (
                    <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono text-violet-300">{e.matricule}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold">{e.nom} {e.prenom}</p>
                        <p className="text-white/40 text-xs">Year {e.anneeEtude}</p>
                      </td>
                      <td className="px-6 py-4 text-white/60">{e.email}</td>
                      <td className="px-6 py-4 text-white/60">{e.faculte}</td>
                      <td className="px-6 py-4">
                        {e.abonnementActif ? (
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium">
                            {e.abonnementActif.ligne?.code}
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openDetail(e)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs transition-all">View</button>
                          <button onClick={() => openEdit(e)} className="px-4 py-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-xl text-xs text-violet-400 transition-all">Edit</button>
                          <button onClick={() => del(e.id)} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs text-red-400 transition-all">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
            <Modal onClose={() => setSelected(null)} title={`${selected.nom} ${selected.prenom}`}>
              <Row label="Matricule" val={selected.matricule} />
              <Row label="Email" val={selected.email} />
              <Row label="Phone" val={selected.telephone} />
              <Row label="Faculty" val={selected.faculte} />
              <Row label="Department" val={selected.departement} />
              <Row label="Year" val={selected.anneeEtude} />
              <Row label="Birth Date" val={fmt.date(selected.dateNaissance)} />
              <Row label="Address" val={selected.adresse} />

              {selected.abonnementActif && (
                <div className="mt-6 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Active Subscription</p>
                  <p className="text-emerald-400 font-bold text-lg">
                    {selected.abonnementActif.ligne?.code} — {selected.abonnementActif.ligne?.nom}
                  </p>
                  <p className="text-white/40 text-sm mt-1">
                    Since {fmt.date(selected.abonnementActif.dateDebut)}
                  </p>
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
              title={form._mode === "add" ? "New Student" : "Edit Student"}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { label: "Matricule", key: "matricule", type: "text" },
                  { label: "Last Name", key: "nom", type: "text" },
                  { label: "First Name", key: "prenom", type: "text" },
                  { label: "Email", key: "email", type: "email" },
                  { label: "Phone", key: "telephone", type: "tel" },
                  { label: "Date of Birth", key: "dateNaissance", type: "date" },
                  { label: "Faculty", key: "faculte", type: "text" },
                  { label: "Department", key: "departement", type: "text" },
                  { label: "Year of Study", key: "anneeEtude", type: "number" },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">{label}</label>
                    <input
                      type={type}
                      value={form[key] ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-violet-400/50 outline-none"
                    />
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Address</label>
                  <textarea
                    value={form.adresse ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-violet-400/50 outline-none resize-none"
                  />
                </div>
              </div>

              <button
                onClick={save}
                disabled={saving}
                className="w-full mt-8 py-4 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 font-bold rounded-2xl text-lg transition-all"
              >
                {saving ? "Saving..." : form._mode === "add" ? "Create Student" : "Save Changes"}
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
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/30 w-32 flex-shrink-0 font-medium">{label}</span>
      <span className="text-white/70 break-words">{val}</span>
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