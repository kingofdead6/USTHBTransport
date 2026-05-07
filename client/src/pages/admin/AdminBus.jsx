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

  const fetchBuses = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/bus", { params: { search, page, limit: 15, etat: etatFilter || undefined } });
      setBuses(r.data.data);
      setPagination(r.data.pagination);
    } finally { setLoading(false); }
  }, [search, page, etatFilter]);

  useEffect(() => { fetchBuses(); }, [fetchBuses]);

  const openAdd  = () => setForm({ ...EMPTY, _mode: "add" });
  const openEdit = (b) => setForm({ ...b, _mode: "edit" });

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { _mode, ...body } = form;
      const payload = { ...body, capaciteMax: parseInt(body.capaciteMax), anneeAcquisition: body.anneeAcquisition ? parseInt(body.anneeAcquisition) : null };
      if (_mode === "add") await api.post("/bus", payload);
      else                 await api.put(`/bus/${body.id}`, payload);
      setForm(null);
      fetchBuses();
    } catch (e) { alert(e?.response?.data?.message || "Error"); }
    finally { setSaving(false); }
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
      <AdminSidebar />
      <main className="ml-60 flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black">🚌 Fleet of Buses</h1>
            <p className="text-white/35 text-sm mt-1">{pagination.total ?? "—"} vehicles </p>
          </div>
          <button onClick={openAdd} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-900/30">
            + New Bus
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by license plate, brand..."
            className="flex-1 max-w-sm px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-white/25 focus:border-amber-400/50 outline-none"
          />
          <select
            value={etatFilter}
            onChange={(e) => { setEtatFilter(e.target.value); setPage(1); }}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 focus:border-amber-400/50 outline-none"
          >
            <option value="">All States</option>
            <option value="OPERATIONNEL">Operational</option>
            <option value="EN_MAINTENANCE">In Maintenance</option>
            <option value="HORS_SERVICE">Out of Service</option>
          </select>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {["License Plate", "Brand / Model", "Capacity", "Current Line", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-4 text-xs font-bold tracking-widest text-white/25 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-white/25">Loading...</td></tr>
              ) : buses.map((b) => {
                const etat = ETAT_COLORS[b.etat];
                const affectActuelle = b.affectations?.[0];
                return (
                  <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-amber-300 font-mono text-xs font-bold">{b.immatriculation}</td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-white/90">{b.marque}</p>
                      <p className="text-white/30 text-xs">{b.modele || "—"} {b.anneeAcquisition ? `· ${b.anneeAcquisition}` : ""}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-white/70 font-bold">{b.capaciteMax}</span>
                      <span className="text-white/25 text-xs"> places</span>
                    </td>
                    <td className="px-5 py-3">
                      {affectActuelle ? (
                        <span className="px-2.5 py-1 bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-full text-xs font-semibold">
                          {affectActuelle.ligne?.code}
                        </span>
                      ) : <span className="text-white/25 text-xs">Not Assigned</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 ${etat.bg} ${etat.text} border ${etat.border} rounded-full text-xs font-semibold`}>
                        {etat.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openDetail(b)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-all">View</button>
                        <button onClick={() => openEdit(b)}   className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-xs text-amber-400 transition-all">Edit</button>
                        <button onClick={() => del(b.id)}     className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs text-red-400 transition-all">Delete</button>
                      </div>
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
            <Modal onClose={() => setSelected(null)} title={`${selected.immatriculation} — ${selected.marque}`}>
              <Row label="Model"       val={selected.modele} />
              <Row label="Capacity"     val={`${selected.capaciteMax} places`} />
              <Row label="Year"        val={selected.anneeAcquisition} />
              <Row label="Status"         val={ETAT_COLORS[selected.etat]?.label} />

              {selected.affectations?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-white/25 uppercase tracking-widest mb-2">Assignment History</p>
                  {selected.affectations.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-2 border-b border-white/5 text-xs text-white/50">
                      <span>{a.ligne?.code} — {a.ligne?.nom}</span>
                      <span>{a.dateDebut?.split("T")[0]} → {a.dateFin ? a.dateFin.split("T")[0] : "In Progress"}</span>
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
            <Modal onClose={() => setForm(null)} title={form._mode === "add" ? "New Bus" : "Edit Bus"}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["License Plate", "immatriculation", "text"],
                  ["Brand",          "marque",          "text"],
                  ["Model",          "modele",          "text"],
                  ["Max Capacity",    "capaciteMax",     "number"],
                  ["Acquisition Year","anneeAcquisition","number"],
                ].map(([label, key, type]) => (
                  <div key={key}>
                    <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">{label}</label>
                    <input type={type} value={form[key] ?? ""} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-amber-400/50 outline-none" />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Status</label>
                  <select value={form.etat} onChange={(e) => setForm(f => ({ ...f, etat: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-amber-400/50 outline-none">
                    <option value="OPERATIONNEL">Operational</option>
                    <option value="EN_MAINTENANCE">Maintenance</option>
                    <option value="HORS_SERVICE">Out of Service</option>
                  </select>
                </div>
              </div>
              <button onClick={save} disabled={saving} className="w-full mt-6 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold rounded-xl transition-all">
                {saving ? "Saving..." : "Save"}
              </button>
            </Modal>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Row({ label, val }) {
  if (!val && val !== 0) return null;
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