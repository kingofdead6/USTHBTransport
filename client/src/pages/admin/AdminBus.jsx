import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const ETAT_COLORS = {
  OPERATIONNEL:   { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Operational" },
  EN_MAINTENANCE: { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20",   label: "Maintenance" },
  HORS_SERVICE:   { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/20",     label: "Out of Service" },
};

const EMPTY = { immatriculation: "", marque: "", modele: "", capaciteMax: 50, anneeAcquisition: "", etat: "OPERATIONNEL" };

export default function AdminBus() {
  const [buses, setBuses]         = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [etatFilter, setEtatFilter] = useState("");
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState(null);
  const [saving, setSaving]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchBuses = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/bus", { 
        params: { search, page, limit: 15, etat: etatFilter || undefined } 
      });
      setBuses(r.data.data);
      setPagination(r.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [search, page, etatFilter]);

  useEffect(() => { fetchBuses(); }, [fetchBuses]);

  const openAdd = () => setForm({ ...EMPTY, _mode: "add" });
  const openEdit = (b) => setForm({ ...b, _mode: "edit" });

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { _mode, ...body } = form;
      const payload = { 
        ...body, 
        capaciteMax: parseInt(body.capaciteMax), 
        anneeAcquisition: body.anneeAcquisition ? parseInt(body.anneeAcquisition) : null 
      };
      if (_mode === "add") await api.post("/bus", payload);
      else await api.put(`/bus/${body.id}`, payload);
      setForm(null);
      fetchBuses();
    } catch (e) {
      alert(e?.response?.data?.message || "Error saving bus");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this bus?")) return;
    await api.delete(`/bus/${id}`);
    fetchBuses();
  };

  const openDetail = async (b) => {
    const r = await api.get(`/bus/${b.id}`);
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
          <span className="text-xl">🚌</span>
          <span className="font-black text-lg">Fleet</span>
        </div>
        <button
          onClick={openAdd}
          className="bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl text-sm font-bold transition-all"
        >
          + New
        </button>
      </div>

      <main className="flex-1 md:ml-60 p-4 md:p-8 pt-20 md:pt-8">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">🚌 Bus Fleet</h1>
            <p className="text-white/40 text-sm mt-1">{pagination.total ?? "—"} vehicles</p>
          </div>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-all"
          >
            + New Bus
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by plate, brand or model..."
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm placeholder:text-white/30 focus:border-amber-400/50 outline-none"
          />
          <select
            value={etatFilter}
            onChange={(e) => { setEtatFilter(e.target.value); setPage(1); }}
            className="w-full sm:w-auto px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-amber-400/50 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="OPERATIONNEL">Operational</option>
            <option value="EN_MAINTENANCE">Maintenance</option>
            <option value="HORS_SERVICE">Out of Service</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/30">Loading buses...</div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {buses.map((b) => {
                const etat = ETAT_COLORS[b.etat];
                const affectActuelle = b.affectations?.[0];
                return (
                  <div key={b.id} className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono text-amber-300 font-bold text-lg">{b.immatriculation}</p>
                        <p className="text-white/90 text-lg mt-1">{b.marque} {b.modele}</p>
                        <p className="text-white/40 text-sm">
                          {b.anneeAcquisition} • {b.capaciteMax} seats
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${etat.bg} ${etat.text} ${etat.border}`}>
                        {etat.label}
                      </span>
                    </div>

                    {affectActuelle && (
                      <div className="mt-4">
                        <span className="text-xs text-white/40">Current Line:</span>
                        <span className="ml-2 px-3 py-1 bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-full text-xs">
                          {affectActuelle.ligne?.code}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 mt-6">
                      <button
                        onClick={() => openDetail(b)}
                        className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-medium transition-all"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEdit(b)}
                        className="py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-2xl text-sm font-medium text-amber-400 transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => del(b.id)}
                        className="py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-sm font-medium text-red-400 transition-all"
                      >
                        Delete
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
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">License Plate</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Brand / Model</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Capacity</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Current Line</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.map((b) => {
                    const etat = ETAT_COLORS[b.etat];
                    const affectActuelle = b.affectations?.[0];
                    return (
                      <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-mono text-amber-300 font-bold">{b.immatriculation}</td>
                        <td className="px-6 py-4">
                          <p className="font-semibold">{b.marque}</p>
                          <p className="text-white/40 text-xs">{b.modele} {b.anneeAcquisition && `· ${b.anneeAcquisition}`}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-white/80">{b.capaciteMax}</span>
                          <span className="text-white/40 text-xs ml-1">seats</span>
                        </td>
                        <td className="px-6 py-4">
                          {affectActuelle ? (
                            <span className="px-3 py-1 bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-full text-xs">
                              {affectActuelle.ligne?.code}
                            </span>
                          ) : (
                            <span className="text-white/30 text-xs">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${etat.bg} ${etat.text} ${etat.border}`}>
                            {etat.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openDetail(b)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm">View</button>
                            <button onClick={() => openEdit(b)} className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-sm text-amber-400">Edit</button>
                            <button onClick={() => del(b.id)} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-sm text-red-400">Delete</button>
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
            <Modal onClose={() => setSelected(null)} title={`${selected.immatriculation} — ${selected.marque}`}>
              <Row label="Model" val={selected.modele} />
              <Row label="Capacity" val={`${selected.capaciteMax} seats`} />
              <Row label="Year" val={selected.anneeAcquisition} />
              <Row label="Status" val={ETAT_COLORS[selected.etat]?.label} />

              {selected.affectations?.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Assignment History</p>
                  {selected.affectations.map((a) => (
                    <div key={a.id} className="flex justify-between py-3 border-b border-white/5 last:border-0 text-sm">
                      <span>{a.ligne?.code} — {a.ligne?.nom}</span>
                      <span className="text-white/40">
                        {a.dateDebut?.split("T")[0]} → {a.dateFin ? a.dateFin.split("T")[0] : "Current"}
                      </span>
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
              title={form._mode === "add" ? "New Bus" : "Edit Bus"}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { label: "License Plate", key: "immatriculation", type: "text" },
                  { label: "Brand", key: "marque", type: "text" },
                  { label: "Model", key: "modele", type: "text" },
                  { label: "Max Capacity", key: "capaciteMax", type: "number" },
                  { label: "Acquisition Year", key: "anneeAcquisition", type: "number" },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">{label}</label>
                    <input
                      type={type}
                      value={form[key] ?? ""}
                      onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-amber-400/50 outline-none"
                    />
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Status</label>
                  <select
                    value={form.etat}
                    onChange={(e) => setForm(f => ({ ...f, etat: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-amber-400/50 outline-none"
                  >
                    <option value="OPERATIONNEL">Operational</option>
                    <option value="EN_MAINTENANCE">Maintenance</option>
                    <option value="HORS_SERVICE">Out of Service</option>
                  </select>
                </div>
              </div>

              <button
                onClick={save}
                disabled={saving}
                className="w-full mt-8 py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-2xl text-lg transition-all"
              >
                {saving ? "Saving..." : form._mode === "add" ? "Add Bus" : "Save Changes"}
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