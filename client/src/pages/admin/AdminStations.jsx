import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const EMPTY = { nom: "", adresse: "", latitude: "", longitude: "", description: "" };

export default function AdminStations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchStations = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/stations", { params: { search: search || undefined } });
      setStations(r.data.data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchStations(); }, [fetchStations]);

  const openAdd = () => setForm({ ...EMPTY, _mode: "add" });
  const openEdit = (s) => setForm({
    ...s,
    latitude: s.latitude ?? "",
    longitude: s.longitude ?? "",
    _mode: "edit"
  });

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { _mode, ligneStations, _count, ...body } = form;
      const payload = {
        ...body,
        latitude: body.latitude ? parseFloat(body.latitude) : null,
        longitude: body.longitude ? parseFloat(body.longitude) : null,
      };
      if (_mode === "add") await api.post("/stations", payload);
      else await api.put(`/stations/${body.id}`, payload);
      setForm(null);
      fetchStations();
    } catch (e) {
      alert(e?.response?.data?.message || "Error saving station");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this station?")) return;
    await api.delete(`/stations/${id}`);
    fetchStations();
  };

  const openDetail = async (s) => {
    const r = await api.get(`/stations/${s.id}`);
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
          <span className="text-xl">📍</span>
          <span className="font-black text-lg">Stations</span>
        </div>
        <button
          onClick={openAdd}
          className="bg-sky-500 hover:bg-sky-600 px-4 py-2 rounded-xl text-sm font-bold transition-all"
        >
          + New
        </button>
      </div>

      <main className="flex-1 md:ml-60 p-4 md:p-8 pt-20 md:pt-8">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">📍 Stations</h1>
            <p className="text-white/40 text-sm mt-1">{stations.length} stops in the network</p>
          </div>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-sm transition-all"
          >
            + New Station
          </button>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or address..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm placeholder:text-white/30 focus:border-sky-400/50 outline-none mb-6"
        />

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20 text-white/30">Loading stations...</div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {stations.map((s) => (
                <div key={s.id} className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
                  <div className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-2xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-xl flex-shrink-0">📍</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg leading-tight">{s.nom}</p>
                      <p className="text-white/40 text-sm mt-1 line-clamp-2">{s.adresse || "No address"}</p>
                      {s.latitude && s.longitude && (
                        <p className="text-white/30 text-xs font-mono mt-2">
                          {parseFloat(s.latitude).toFixed(4)}, {parseFloat(s.longitude).toFixed(4)}
                        </p>
                      )}
                    </div>
                    <span className="px-3 py-1 bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-full text-xs font-medium whitespace-nowrap">
                      {s._count?.ligneStations ?? 0} lines
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-6">
                    <button
                      onClick={() => openDetail(s)}
                      className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-medium transition-all"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openEdit(s)}
                      className="py-3 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-2xl text-sm font-medium text-sky-400 transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => del(s.id)}
                      className="py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-sm font-medium text-red-400 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Station</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Address</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Coordinates</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Lines</th>
                    <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-white/30 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((s) => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-2xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-400">📍</span>
                          <span className="font-semibold">{s.nom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/50 text-sm max-w-xs truncate">{s.adresse || "—"}</td>
                      <td className="px-6 py-4 text-white/30 font-mono text-sm">
                        {s.latitude && s.longitude
                          ? `${parseFloat(s.latitude).toFixed(4)}, ${parseFloat(s.longitude).toFixed(4)}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-full text-xs">
                          {s._count?.ligneStations ?? 0} lines
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openDetail(s)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm">View</button>
                          <button onClick={() => openEdit(s)} className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-xl text-sm text-sky-400">Edit</button>
                          <button onClick={() => del(s.id)} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-sm text-red-400">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {selected && (
            <Modal onClose={() => setSelected(null)} title={selected.nom}>
              <Row label="Address" val={selected.adresse} />
              <Row label="Latitude" val={selected.latitude} />
              <Row label="Longitude" val={selected.longitude} />
              <Row label="Description" val={selected.description} />

              {selected.ligneStations?.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Serving Lines</p>
                  {selected.ligneStations.map((ls) => (
                    <div key={ls.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium">
                        {ls.ligne?.code}
                      </span>
                      <span className="flex-1 text-white/70">{ls.ligne?.nom}</span>
                      <span className="text-white/40 text-sm">Stop #{ls.ordreArret}</span>
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
              title={form._mode === "add" ? "New Station" : "Edit Station"}
            >
              <div className="space-y-5">
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Station Name</label>
                  <input
                    type="text"
                    value={form.nom ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, nom: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-sky-400/50 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Address</label>
                  <input
                    type="text"
                    value={form.adresse ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, adresse: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-sky-400/50 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={form.latitude ?? ""}
                      onChange={(e) => setForm(f => ({ ...f, latitude: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-sky-400/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={form.longitude ?? ""}
                      onChange={(e) => setForm(f => ({ ...f, longitude: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-sky-400/50 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Description</label>
                  <textarea
                    value={form.description ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-sky-400/50 outline-none resize-none"
                  />
                </div>
              </div>

              <button
                onClick={save}
                disabled={saving}
                className="w-full mt-8 py-4 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold rounded-2xl text-lg transition-all"
              >
                {saving ? "Saving..." : form._mode === "add" ? "Create Station" : "Save Changes"}
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
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 py-3 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/30 w-28 flex-shrink-0">{label}</span>
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