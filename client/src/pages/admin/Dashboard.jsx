import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../../utils/api";
import AdminSidebar from "../../components/admin/AdminSidebar";
import StatCard from "../../components/shared/StatCard";

const sections = [
  { path: "/admin/etudiants",  icon: "🎓", title: "Students",   desc: "Manage students and their subscriptions.",     color: "from-violet-600 to-indigo-600"  },
  { path: "/admin/bus",        icon: "🚌", title: "Buses",         desc: "Manage fleet and capacities.",              color: "from-amber-500 to-orange-600"  },
  { path: "/admin/lignes",     icon: "🗺️",  title: "Lines",     desc: "Manage lines and their stations.",            color: "from-emerald-500 to-teal-600"  },
  { path: "/admin/stations",   icon: "📍", title: "Stations",   desc: "Manage network stops.",                    color: "from-sky-500 to-blue-600"      },
  { path: "/admin/abonnements",icon: "🔑", title: "Subscriptions",desc: "Assign and historize subscriptions.",         color: "from-pink-500 to-rose-600"     },
  { path: "/admin/trajets",    icon: "🛣️",  title: "Trips",    desc: "Track passages and delays.",            color: "from-lime-500 to-green-600"    },
  { path: "/admin/incidents",  icon: "⚠️",  title: "Incidents",  desc: "Manage incidents and resolve delays.",   color: "from-red-500 to-rose-700"      },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.get("/stats/dashboard").then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#0f0f1a] border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm shadow-lg shadow-violet-900/50">🚌</span>
          <span className="font-black text-sm">TransportUST</span>
        </div>
        <div></div> {/* Spacer */}
      </div>

      <main className="ml-0 md:ml-60 flex-1 p-4 md:p-8 pt-16 md:pt-8">
        {/* Header */}
        <div className="mb-10">
          <motion.h1
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black tracking-tight bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent"
          >
            Dashboard
          </motion.h1>
          <p className="text-white/35 text-sm mt-1">University Transport Management System · USTHB</p>
        </div>

        {/* Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          >
            <StatCard label="Students"         value={stats.totalEtudiants}          icon="🎓" color="violet" />
            <StatCard label="Operational Buses" value={stats.busOperationnels}         icon="🚌" color="amber"  />
            <StatCard label="Lignes actives"    value={stats.totalLignes}             icon="🗺️"  color="emerald"/>
            <StatCard label="Incidents ouverts" value={stats.incidentsOuverts}        icon="⚠️"  color="red"    />
            <StatCard label="Sans abonnement"   value={stats.etudiantsSansAbonnement} icon="🔑" color="sky"    sub="étudiants non abonnés" />
            <StatCard label="Trajets en retard" value={stats.trajetsEnRetard}         icon="⏱️"  color="amber"  />
            <StatCard label="Taux remplissage"  value={`${stats.tauxRemplissageMoyen}%`} icon="📊" color="emerald" />
            <StatCard label="Incidents totaux"  value={stats.totalIncidents}          icon="🚨" color="red"    />
          </motion.div>
        )}

        {/* Lignes les plus chargées */}
        {stats?.lignesPlusChargees?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-10"
          >
            <h2 className="text-xs font-bold tracking-widest text-white/30 uppercase mb-4">Lignes les plus chargées</h2>
            <div className="space-y-3">
              {stats.lignesPlusChargees.map((l, i) => (
                <div key={l.id} className="flex items-center gap-4">
                  <span className="text-xs text-white/30 w-4">{i + 1}</span>
                  <span className="w-10 h-7 bg-violet-500/20 border border-violet-500/20 text-violet-300 rounded-lg text-xs font-black flex items-center justify-center">
                    {l.code}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                        style={{ width: `${Math.min(100, (l.nb / (stats.lignesPlusChargees[0]?.nb || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-white/60">{l.nb}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Sections grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {sections.map((s, i) => (
            <motion.div
              key={s.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <Link to={s.path}>
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/[0.05] transition-all h-full">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl mb-4 shadow-lg`}>
                    {s.icon}
                  </div>
                  <h3 className="font-bold text-white/90 mb-1">{s.title}</h3>
                  <p className="text-white/35 text-xs leading-relaxed">{s.desc}</p>
                  <div className="mt-4 text-white/20 text-xs font-semibold">Gérer →</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}