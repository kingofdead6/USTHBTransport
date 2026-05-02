import { Link, useLocation } from "react-router-dom";

const sections = [
  { path: "/admin",               icon: "📊", label: "Dashboard" },
  { path: "/admin/etudiants",     icon: "🎓", label: "Étudiants" },
  { path: "/admin/bus",           icon: "🚌", label: "Bus" },
  { path: "/admin/lignes",        icon: "🗺️",  label: "Lignes" },
  { path: "/admin/stations",      icon: "📍", label: "Stations" },
  { path: "/admin/abonnements",   icon: "🔑", label: "Abonnements" },
  { path: "/admin/trajets",       icon: "🛣️",  label: "Trajets" },
  { path: "/admin/incidents",     icon: "⚠️",  label: "Incidents" },
  { path: "/admin/horaires",      icon: "⏰",  label: "Horaires" }
];

export default function AdminSidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-[#0f0f1a] border-r border-white/5 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-violet-900/50">🚌</span>
          <div>
            <p className="text-white font-black text-sm leading-none">TransportUST</p>
            <p className="text-white/30 text-[10px] mt-0.5">Panel Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {sections.map(({ path, icon, label }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/20"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/5">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2.5 text-sm text-white/30 hover:text-white/60 transition-all rounded-xl hover:bg-white/5"
        >
          <span>←</span> Vue publique
        </Link>
      </div>
    </aside>
  );
}