import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

const EMPTY = { nom: "", adresse: "", latitude: "", longitude: "", description: "" };

export default function AdminStations() {
  const [stations, setStations]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState(null);
  const [saving, setSaving]       = useState(false);

  const fetchStations = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/stations", { params: { search: search || undefined } });
      setStations(r.data.data);
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchStations(); }, [fetchStations]);

  const openAdd  = () => setForm({ ...EMPTY, _mode: "add" });
  const openEdit = (s) => setForm({ ...s, latitude: s.latitude ?? "", longitude: s.longitude ?? "", _mode: "edit" });

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { _mode, ligneStations, _count, ...body } = form;
      const payload = {
        ...body,
        latitude:  body.latitude  ? parseFloat(body.latitude)  : null,
        longitude: body.longitude ? parseFloat(body.longitude) : null,
      };
      if (_mode === "add") await api.post("/stations", payload);
      else                 await api.put(`/stations/${body.id}`, payload);
      setForm(null);
      fetchStations();
    } catch (e) { alert(e?.response?.data?.message || "Erreur"); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm("Supprimer cette station ?")) return;
    await api.delete(`/stations/${id}`);
    fetchStations();
  };

  const openDetail = async (s) => {
    const r = await api.get(`/stations/${s.id}`);
    setSelected(r.data.data);
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">
      <AdminSidebar />
      <main className="ml-60 flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black">📍 Stations</h1>
            <p className="text-white/35 text-sm mt-1">{stations.length} arrêts dans le réseau</p>
          </div>
          <button onClick={openAdd} className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-sky-900/30">
            + Nouvelle station
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, adresse..."
          className="w-full max-w-sm px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-white/25 focus:border-sky-400/50 outline-none mb-6"
        />

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {["Station", "Adresse", "Coordonnées", "Lignes", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-4 text-xs font-bold tracking-widest text-white/25 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-white/25">Chargement...</td></tr>
              ) : stations.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-400 text-xs">📍</span>
                      <span className="font-semibold text-white/90">{s.nom}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-white/40 text-xs max-w-[180px] truncate">{s.adresse || "—"}</td>
                  <td className="px-5 py-3 text-white/30 text-xs font-mono">
                    {s.latitude && s.longitude ? `${parseFloat(s.latitude).toFixed(4)}, ${parseFloat(s.longitude).toFixed(4)}` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2.5 py-1 bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-full text-xs">
                      {s._count?.ligneStations ?? 0} ligne(s)
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openDetail(s)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-all">Voir</button>
                      <button onClick={() => openEdit(s)}   className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-lg text-xs text-sky-400 transition-all">Modifier</button>
                      <button onClick={() => del(s.id)}     className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs text-red-400 transition-all">Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
          {selected && (
            <Modal onClose={() => setSelected(null)} title={selected.nom}>
              <Row label="Adresse"    val={selected.adresse} />
              <Row label="Latitude"   val={selected.latitude} />
              <Row label="Longitude"  val={selected.longitude} />
              <Row label="Description" val={selected.description} />
              {selected.ligneStations?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-white/25 uppercase tracking-widest mb-2">Lignes desservant cette station</p>
                  {selected.ligneStations.map((ls) => (
                    <div key={ls.id} className="flex items-center gap-3 py-2 border-b border-white/5 text-xs text-white/50">
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[11px]">{ls.ligne?.code}</span>
                      <span>{ls.ligne?.nom}</span>
                      <span className="ml-auto text-white/25">Arrêt #{ls.ordreArret}</span>
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
            <Modal onClose={() => setForm(null)} title={form._mode === "add" ? "Nouvelle station" : "Modifier la station"}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Nom</label>
                  <input type="text" value={form.nom ?? ""} onChange={(e) => setForm(f => ({ ...f, nom: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-sky-400/50 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Adresse</label>
                  <input type="text" value={form.adresse ?? ""} onChange={(e) => setForm(f => ({ ...f, adresse: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-sky-400/50 outline-none" />
                </div>
                {[["Latitude", "latitude"], ["Longitude", "longitude"]].map(([label, key]) => (
                  <div key={key}>
                    <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">{label}</label>
                    <input type="number" step="0.0000001" value={form[key] ?? ""} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-sky-400/50 outline-none" />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs text-white/30 uppercase tracking-widest mb-1.5 block">Description</label>
                  <textarea value={form.description ?? ""} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-sky-400/50 outline-none resize-none" />
                </div>
              </div>
              <button onClick={save} disabled={saving} className="w-full mt-6 py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-bold rounded-xl transition-all">
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