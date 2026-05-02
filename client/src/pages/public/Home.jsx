import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../utils/api";
import PublicNav from "../../components/public/PublicNav";

export default function PublicHome() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/stats/dashboard").then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 font-sans">
      <PublicNav />

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
            USTHB · Système de Transport
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-none tracking-tight mb-6">
            Transport
            <span className="block bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Universitaire
            </span>
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed mb-10">
            Consultez les lignes, horaires et disponibilités du transport étudiant de l'USTHB en temps réel.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/lignes" className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5 transition-all">
              Voir les lignes →
            </Link>
            <Link to="/horaires" className="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:border-emerald-300 hover:-translate-y-0.5 transition-all shadow-sm">
              Consulter les horaires
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Étudiants", value: stats.totalEtudiants, icon: "🎓", bg: "bg-indigo-50 border-indigo-100", text: "text-indigo-700" },
              { label: "Lignes actives", value: stats.totalLignes, icon: "🗺️", bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
              { label: "Bus", value: stats.totalBus, icon: "🚌", bg: "bg-amber-50 border-amber-100", text: "text-amber-700" },
              { label: "Incidents ouverts", value: stats.incidentsOuverts, icon: "⚠️", bg: "bg-red-50 border-red-100", text: "text-red-700" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} border rounded-2xl p-6 text-center`}>
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className={`text-3xl font-black ${s.text}`}>{s.value}</div>
                <div className="text-slate-500 text-xs font-semibold mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cards */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { to: "/lignes",    icon: "🗺️",  title: "Lignes",    desc: "Toutes les lignes de bus avec leurs arrêts et trajets.",    color: "emerald" },
            { to: "/horaires",  icon: "🕐",  title: "Horaires",  desc: "Consultez les horaires par ligne et par jour de semaine.",    color: "sky" },
            { to: "/incidents", icon: "⚠️",  title: "Incidents", desc: "Suivez les retards et incidents en cours sur le réseau.",     color: "orange" },
          ].map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="group bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <span className="text-4xl block mb-4">{card.icon}</span>
              <h3 className="text-xl font-black text-slate-800 mb-2">{card.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{card.desc}</p>
              <div className="mt-6 text-emerald-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                Explorer →
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-slate-400 text-xs">
        USTHB · Faculté d'Informatique · BDD 2ème Année 2025–2026
      </footer>
    </div>
  );
}