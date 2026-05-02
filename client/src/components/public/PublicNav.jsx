import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/",         label: "Accueil" },
  { to: "/lignes",   label: "Lignes" },
  { to: "/horaires", label: "Horaires" },
  { to: "/incidents",label: "Incidents" },
];

export default function PublicNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow">🚌</span>
          <div>
            <span className="font-black text-slate-800 tracking-tight text-sm leading-none block">TransportUST</span>
            <span className="text-[10px] text-slate-400 font-medium">USTHB · Bab Ezzouar</span>
          </div>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                pathname === to
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Admin button */}
        <Link
          to="/admin"
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-200 transition-all"
        >
          ⚡ Administration
        </Link>
      </div>
    </nav>
  );
}