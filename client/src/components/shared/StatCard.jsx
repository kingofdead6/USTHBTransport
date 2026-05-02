export default function StatCard({ label, value, icon, color = "violet", sub }) {
  const colors = {
    violet: "from-violet-500/20 to-indigo-500/10 border-violet-500/20 text-violet-400",
    emerald: "from-emerald-500/20 to-teal-500/10 border-emerald-500/20 text-emerald-400",
    amber: "from-amber-500/20 to-orange-500/10 border-amber-500/20 text-amber-400",
    red: "from-red-500/20 to-rose-500/10 border-red-500/20 text-red-400",
    sky: "from-sky-500/20 to-blue-500/10 border-sky-500/20 text-sky-400",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">{label}</p>
          <p className="text-3xl font-black text-white mt-1">{value ?? "—"}</p>
          {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
        </div>
        <span className="text-2xl opacity-60">{icon}</span>
      </div>
    </div>
  );
}