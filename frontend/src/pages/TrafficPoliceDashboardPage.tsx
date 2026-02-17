import { Link } from "react-router-dom";

export default function TrafficPoliceDashboardPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-800 bg-white/5 p-5 lg:col-span-2">
        <h2 className="text-lg font-semibold">Saobraćajna policija</h2>
        <p className="mt-1 text-sm text-slate-400">
          Upravljanje policajcima, prekršajima i korisnicima (role).
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            to="/traffic/violations"
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:bg-white/5"
          >
            <p className="text-sm font-semibold">Prekršaji</p>
            <p className="mt-1 text-sm text-slate-400">Lista, detalji, kreiranje, filteri.</p>
          </Link>

          <Link
            to="/traffic/police"
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:bg-white/5"
          >
            <p className="text-sm font-semibold">Policija</p>
            <p className="mt-1 text-sm text-slate-400">Kreiranje, pregled, suspend toggle.</p>
          </Link>

          <Link
            to="/admin/users"
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:bg-white/5"
          >
            <p className="text-sm font-semibold">Korisnici & Role</p>
            <p className="mt-1 text-sm text-slate-400">Dodela role iz liste korisnika.</p>
          </Link>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 p-4 text-sm text-slate-300">
            Tip: prvo kreiraj policajca, pa onda prekršaj sa dropdown-om policajca.
          </div>
        </div>
      </section>

      <aside className="rounded-2xl border border-slate-800 bg-white/5 p-5">
        <h3 className="text-sm font-semibold">Brze akcije</h3>
        <div className="mt-4 grid gap-3">
          <Link
            to="/traffic/violations?mode=create"
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            Kreiraj prekršaj
          </Link>
          <Link
            to="/traffic/police?mode=create"
            className="rounded-xl border border-slate-700 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Dodaj policajca
          </Link>
        </div>
      </aside>
    </div>
  );
}
